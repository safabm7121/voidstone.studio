import { Response } from 'express';
import mongoose from 'mongoose';
import Appointment from '../models/Appointment';
import Availability from '../models/Availability';
import { AuthRequest } from '../middleware/auth';
import {
  bookAppointmentSchema,
  getAvailabilitySchema,
  cancelAppointmentSchema
} from '../utils/validation';
import {
  sendAppointmentConfirmationToCustomer,
  sendAppointmentNotificationToAdmin,
  sendAppointmentConfirmedToCustomer
} from '../utils/emailService';

const VOIDSTONE_DESIGNER_ID = 'voidstone-studio-designer';

// Helper: generate slots 10am–4pm for weekdays only
const generateTimeSlots = (date: Date): { time: string; isAvailable: boolean }[] => {
  const slots = [];
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday

  // No slots on weekends
  if (day === 0 || day === 6) {
    return [];
  }

  // 10:00 – 16:00 inclusive (7 slots)
  for (let hour = 10; hour <= 16; hour++) {
    const start = `${hour.toString().padStart(2, '0')}:00`;
    const end = `${(hour + 1).toString().padStart(2, '0')}:00`;
    slots.push({
      time: `${start}-${end}`,
      isAvailable: true
    });
  }
  return slots;
};

export class AppointmentController {
  // -----------------------------------------------------------------
  //  GET AVAILABILITY for a date range (includes all weekdays)
  // -----------------------------------------------------------------
  async getAvailability(req: AuthRequest, res: Response) {
    try {
      console.log('📅 getAvailability query:', req.query);
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      start.setUTCHours(0, 0, 0, 0);
      end.setUTCHours(23, 59, 59, 999);

      // Fetch any already‑stored availabilities in this range
      const existingAvailabilities = await Availability.find({
        designerId: VOIDSTONE_DESIGNER_ID,
        date: { $gte: start, $lte: end }
      }).sort({ date: 1 });

      // Build a map for quick lookup
      const availabilityMap = new Map<string, any>();
      existingAvailabilities.forEach((doc) => {
        const key = doc.date.toDateString();
        availabilityMap.set(key, doc);
      });

      // We will collect the final list of days (with slots)
      const result: any[] = [];

      // Loop day by day through the whole range
      for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
        const currentDate = new Date(d);
        currentDate.setUTCHours(0, 0, 0, 0);
        const dayOfWeek = currentDate.getUTCDay();

        // Skip weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          console.log(`📅 Skipping weekend: ${currentDate.toDateString()}`);
          continue;
        }

        const dateKey = currentDate.toDateString();

        // If we already have an entry in the database, use it (and adjust for booked slots)
        if (availabilityMap.has(dateKey)) {
          const dbEntry = availabilityMap.get(dateKey);
          const bookedSlots = await Appointment.find({
            designerId: VOIDSTONE_DESIGNER_ID,
            date: currentDate,
            status: { $in: ['pending', 'confirmed'] }
          });

          const dayObj = dbEntry.toObject();
          const updatedSlots = dayObj.slots.map((slot: any) => {
            const isBooked = bookedSlots.some((apt) => apt.timeSlot === slot.time);
            return {
              time: slot.time,
              isAvailable: slot.isAvailable && !isBooked,
              bookedBy: slot.bookedBy
            };
          });

          result.push({ ...dayObj, slots: updatedSlots });
        } else {
          // No availability in DB → generate fresh default slots
          const freshSlots = generateTimeSlots(currentDate);
          if (freshSlots.length > 0) {
            console.log(`📅 Generated ${freshSlots.length} slots for ${currentDate.toDateString()}`);
            result.push({
              _id: new mongoose.Types.ObjectId().toString(),
              designerId: VOIDSTONE_DESIGNER_ID,
              date: currentDate,
              slots: freshSlots
            });
          }
        }
      }

      console.log(`✅ Returning ${result.length} days of availability`);
      return res.json({ availability: result });
    } catch (error) {
      console.error('❌ getAvailability error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // -----------------------------------------------------------------
  //  BOOK AN APPOINTMENT
  // -----------------------------------------------------------------
  async bookAppointment(req: AuthRequest, res: Response) {
    try {
      console.log('🔍 BOOKING STARTED', { user: req.user, body: req.body });

      if (!req.user) {
        return res.status(401).json({ error: 'Please login to book an appointment' });
      }

      // Validate input
      const { error } = bookAppointmentSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { date, timeSlot, consultationType, notes, customerPhone, customerName } = req.body;
      const appointmentDate = new Date(date);
      appointmentDate.setUTCHours(0, 0, 0, 0);

      console.log('📅 Appointment date (UTC):', appointmentDate.toISOString());

      // ---- Business rules ----
      // 1. No weekends
      const dayOfWeek = appointmentDate.getUTCDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return res.status(400).json({ error: 'Appointments are only available on weekdays' });
      }

      // 2. Time must be between 10:00 and 16:00
      const hour = parseInt(timeSlot.split(':')[0]);
      if (hour < 10 || hour > 16) {
        return res.status(400).json({ error: 'Appointments are only available from 10 AM to 4 PM' });
      }

      // 3. No double‑booking
      const existingAppointment = await Appointment.findOne({
        designerId: VOIDSTONE_DESIGNER_ID,
        date: appointmentDate,
        timeSlot,
        status: { $in: ['pending', 'confirmed'] }
      });
      if (existingAppointment) {
        return res.status(400).json({ error: 'This time slot is already booked' });
      }

      // ---- Ensure an Availability document exists for this date ----
      let availability = await Availability.findOne({
        designerId: VOIDSTONE_DESIGNER_ID,
        date: appointmentDate
      });

      if (!availability) {
        // Create fresh availability for this day
        const slots = generateTimeSlots(appointmentDate);
        availability = new Availability({
          designerId: VOIDSTONE_DESIGNER_ID,
          date: appointmentDate,
          slots
        });
        await availability.save();
        console.log('✅ Created new availability for', appointmentDate.toDateString());
        console.log('💾 Saved availability date:', availability.date.toISOString());
        console.log('🕒 Saved slots:', availability.slots.map(s => s.time));
      }

      // ---- Verify the chosen slot is still available ----
      const slotIndex = availability.slots.findIndex((s) => s.time === timeSlot);
      if (slotIndex === -1) {
        return res.status(400).json({ error: 'Invalid time slot' });
      }
      if (!availability.slots[slotIndex].isAvailable) {
        return res.status(400).json({ error: 'Selected time slot is not available' });
      }

      // ---- Create the appointment ----
      const finalCustomerName = customerName || `${req.user.email}`;
      const appointment = new Appointment({
        designerId: VOIDSTONE_DESIGNER_ID,
        customerId: req.user.userId,
        customerName: finalCustomerName,
        customerEmail: req.user.email,
        customerPhone,
        date: appointmentDate,
        timeSlot,
        consultationType,
        notes,
        status: 'pending'
      });

      // Save appointment first, then update availability
      await appointment.save();
      console.log('✅ Appointment saved, id:', appointment._id);

      // Mark slot as taken
      availability.slots[slotIndex].isAvailable = false;
      availability.slots[slotIndex].bookedBy = req.user.userId;
      await availability.save();
      console.log('✅ Availability updated');

      // ---- Send emails (non‑blocking) ----
      try {
        await sendAppointmentConfirmationToCustomer(
          req.user.email,
          finalCustomerName,
          { date, timeSlot, consultationType, notes }
        );
        await sendAppointmentNotificationToAdmin(
          { date, timeSlot, consultationType, notes, _id: appointment._id },
          finalCustomerName,
          req.user.email
        );
        console.log('✅ Confirmation emails sent');
      } catch (emailErr) {
        console.error('❌ Email sending failed (non‑critical):', emailErr);
      }

      // Return success
      return res.status(201).json({
        message: 'Appointment booked successfully',
        appointment: {
          _id: appointment._id,
          date: appointment.date,
          timeSlot: appointment.timeSlot,
          consultationType: appointment.consultationType,
          status: appointment.status
        }
      });
    } catch (error) {
      console.error('❌ FATAL booking error:', error);
      return res.status(500).json({ error: 'Server error. Please try again.' });
    }
  }

  // -----------------------------------------------------------------
  //  GET MY APPOINTMENTS (customer)
  // -----------------------------------------------------------------
  async getMyAppointments(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Please login' });
      }
      const appointments = await Appointment.find({ customerId: req.user.userId })
        .sort({ date: -1 })
        .limit(50);
      res.json({ appointments });
    } catch (error) {
      console.error('❌ getMyAppointments error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // -----------------------------------------------------------------
  //  CANCEL APPOINTMENT (customer or admin)
  // -----------------------------------------------------------------
  async cancelAppointment(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Please login' });
      }

      const appointment = await Appointment.findById(req.params.id);
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      const isAuthorized =
        req.user.role === 'admin' || appointment.customerId.toString() === req.user.userId;
      if (!isAuthorized) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      if (appointment.status === 'completed') {
        return res.status(400).json({ error: 'Cannot cancel completed appointments' });
      }

      appointment.status = 'cancelled';
      await appointment.save();

      // Free the slot in availability
      const availability = await Availability.findOne({
        designerId: appointment.designerId,
        date: appointment.date
      });
      if (availability) {
        const slotIdx = availability.slots.findIndex((s) => s.time === appointment.timeSlot);
        if (slotIdx !== -1) {
          availability.slots[slotIdx].isAvailable = true;
          availability.slots[slotIdx].bookedBy = undefined;
          await availability.save();
        }
      }

      res.json({ message: 'Appointment cancelled successfully' });
    } catch (error) {
      console.error('❌ cancelAppointment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // -----------------------------------------------------------------
  //  CONFIRM APPOINTMENT (admin only)
  // -----------------------------------------------------------------
  async confirmAppointment(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const appointment = await Appointment.findById(req.params.id);
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      appointment.status = 'confirmed';
      await appointment.save();

      await sendAppointmentConfirmedToCustomer(
        appointment.customerEmail,
        appointment.customerName,
        appointment
      );

      res.json({ message: 'Appointment confirmed successfully' });
    } catch (error) {
      console.error('❌ confirmAppointment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // -----------------------------------------------------------------
  //  GET ALL APPOINTMENTS (admin only)
  // -----------------------------------------------------------------
  async getAllAppointments(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const appointments = await Appointment.find({}).sort({ date: -1 }).limit(100);
      res.json({ appointments });
    } catch (error) {
      console.error('❌ getAllAppointments error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}