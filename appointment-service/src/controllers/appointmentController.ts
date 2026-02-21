import { Request, Response } from 'express';
import { Appointment } from '../models/Appointment';
import { Availability } from '../models/Availability';
import { AuthRequest } from '../middleware/auth';
import axios from 'axios';
import { sendAppointmentEmails } from '../utils/emailService';

// Get all designers (users with role 'designer')
export const getDesigners = async (req: Request, res: Response) => {
  try {
    // Fetch designers from auth-service
    const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/users?role=designer`);
    res.json({ designers: response.data.users });
  } catch (error) {
    console.error('Error fetching designers:', error);
    res.status(500).json({ error: 'Failed to fetch designers' });
  }
};

// Get available time slots for a designer on a specific date
export const getAvailability = async (req: Request, res: Response) => {
  try {
    const { designerId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const selectedDate = new Date(date as string);
    selectedDate.setHours(0, 0, 0, 0);

    // Check if designer has set custom availability
    let availability = await Availability.findOne({
      designerId,
      date: selectedDate
    });

    if (availability) {
      return res.json({ slots: availability.slots });
    }

    // Generate default time slots (9 AM to 5 PM)
    const defaultSlots = [];
    for (let hour = 9; hour < 17; hour++) {
      const timeSlot = `${hour.toString().padStart(2, '0')}:00-${(hour + 1).toString().padStart(2, '0')}:00`;
      
      // Check if slot is already booked
      const existingBooking = await Appointment.findOne({
        designerId,
        date: selectedDate,
        timeSlot,
        status: { $in: ['pending', 'confirmed'] }
      });

      defaultSlots.push({
        time: timeSlot,
        isAvailable: !existingBooking
      });
    }

    res.json({ slots: defaultSlots });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
};

// Book an appointment
export const bookAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const { designerId, date, timeSlot, notes, customerPhone } = req.body;
    const customerId = req.user?.id;
    const customerName = `${req.user?.firstName} ${req.user?.lastName}`;
    const customerEmail = req.user?.email;

    if (!designerId || !date || !timeSlot) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const appointmentDate = new Date(date);
    appointmentDate.setHours(0, 0, 0, 0);

    // Check if slot is already booked
    const existingAppointment = await Appointment.findOne({
      designerId,
      date: appointmentDate,
      timeSlot,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingAppointment) {
      return res.status(400).json({ error: 'Time slot already booked' });
    }

    // Create appointment
    const appointment = new Appointment({
      designerId,
      customerId,
      date: appointmentDate,
      timeSlot,
      notes,
      customerName,
      customerEmail,
      customerPhone,
      status: 'pending'
    });

    await appointment.save();

    // Fetch designer details from auth-service
    const designerResponse = await axios.get(
      `${process.env.AUTH_SERVICE_URL}/users/${designerId}`
    );

    // Send confirmation emails
    await sendAppointmentEmails(
      appointment,
      { name: designerResponse.data.user.firstName + ' ' + designerResponse.data.user.lastName },
      { name: customerName, email: customerEmail }
    );

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
};

// Get user's appointments (both as customer and designer)
export const getMyAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    let query = {};
    
    if (userRole === 'designer') {
      // Designers see appointments where they are the designer
      query = { designerId: userId };
    } else {
      // Clients see appointments they booked
      query = { customerId: userId };
    }

    const appointments = await Appointment.find(query)
      .sort({ date: 1, timeSlot: 1 });

    // Fetch user details for each appointment
    const enrichedAppointments = await Promise.all(
      appointments.map(async (apt) => {
        const otherUserId = userRole === 'designer' ? apt.customerId : apt.designerId;
        try {
          const userResponse = await axios.get(
            `${process.env.AUTH_SERVICE_URL}/users/${otherUserId}`
          );
          return {
            ...apt.toObject(),
            otherUser: userResponse.data.user
          };
        } catch {
          return apt;
        }
      })
    );

    res.json({ appointments: enrichedAppointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

// Cancel appointment
export const cancelAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check permissions
    if (userRole !== 'admin' && 
        appointment.customerId !== userId && 
        appointment.designerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Can only cancel pending or confirmed appointments
    if (!['pending', 'confirmed'].includes(appointment.status)) {
      return res.status(400).json({ error: 'Cannot cancel this appointment' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
};

// Confirm appointment (designer/admin)
export const confirmAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Only designer or admin can confirm
    if (userRole !== 'admin' && appointment.designerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (appointment.status !== 'pending') {
      return res.status(400).json({ error: 'Appointment is not pending' });
    }

    appointment.status = 'confirmed';
    await appointment.save();

    res.json({ message: 'Appointment confirmed successfully' });
  } catch (error) {
    console.error('Error confirming appointment:', error);
    res.status(500).json({ error: 'Failed to confirm appointment' });
  }
};

// Set custom availability (designers only)
export const setAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const designerId = req.user?.id;
    const { date, slots } = req.body;

    if (req.user?.role !== 'designer' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only designers can set availability' });
    }

    const availabilityDate = new Date(date);
    availabilityDate.setHours(0, 0, 0, 0);

    const availability = await Availability.findOneAndUpdate(
      { designerId, date: availabilityDate },
      { designerId, date: availabilityDate, slots },
      { upsert: true, new: true }
    );

    res.json({
      message: 'Availability updated successfully',
      availability
    });
  } catch (error) {
    console.error('Error setting availability:', error);
    res.status(500).json({ error: 'Failed to set availability' });
  }
};