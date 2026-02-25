import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/index';
import Appointment from '../../src/models/Appointment';
import Availability from '../../src/models/Availability';
import jwt from 'jsonwebtoken';

describe('Appointment API Integration Tests', () => {
  let authToken: string;
  let adminToken: string;
  const userId = new mongoose.Types.ObjectId().toString();
  const adminId = new mongoose.Types.ObjectId().toString();

  beforeEach(async () => {
    // Clear collections
    await Appointment.deleteMany({});
    await Availability.deleteMany({});

    // Create test tokens with proper roles
    authToken = jwt.sign(
      { userId, email: 'test@example.com', role: 'client' },
      process.env.JWT_SECRET!
    );

    adminToken = jwt.sign(
      { userId: adminId, email: 'admin@example.com', role: 'admin' },
      process.env.JWT_SECRET!
    );
  });

  describe('GET /api/availability', () => {
    it('should return availability for date range', async () => {
      const response = await request(app)
        .get('/api/availability')
        .query({
          startDate: '2026-03-02',
          endDate: '2026-03-06'
        })
        .expect(200);

      expect(response.body.availability).toBeDefined();
      expect(Array.isArray(response.body.availability)).toBe(true);
      
      // Should have 5 weekdays (Mon-Fri)
      expect(response.body.availability.length).toBe(5);
      
      // Each day should have 7 slots
      response.body.availability.forEach((day: any) => {
        expect(day.slots).toHaveLength(7);
        expect(day.designerId).toBe('voidstone-studio-designer');
      });
    });

    it('should skip weekends', async () => {
      const response = await request(app)
        .get('/api/availability')
        .query({
          startDate: '2026-03-07', // Saturday
          endDate: '2026-03-08'    // Sunday
        })
        .expect(200);

      expect(response.body.availability).toHaveLength(0);
    });

    it('should return 400 if dates are missing', async () => {
      await request(app)
        .get('/api/availability')
        .expect(400);
    });
  });

  describe('POST /api/book', () => {
    it('should book an appointment successfully', async () => {
      const bookingData = {
        date: '2026-03-02',
        timeSlot: '10:00-11:00',
        consultationType: 'design',
        notes: 'Test appointment',
        customerPhone: '123-456-7890'
      };

      const response = await request(app)
        .post('/api/book')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookingData)
        .expect(201);

      expect(response.body.message).toContain('Appointment booked successfully');
      expect(response.body.appointment).toBeDefined();
      expect(response.body.appointment.status).toBe('pending');
      expect(response.body.appointment.timeSlot).toBe('10:00-11:00');

      // Check database using the ID from response
      const appointment = await Appointment.findById(response.body.appointment._id);
      expect(appointment).toBeDefined();
      expect(appointment?.timeSlot).toBe('10:00-11:00');
      expect(appointment?.customerId).toBe(userId);
      expect(appointment?.consultationType).toBe('design');
      expect(appointment?.notes).toBe('Test appointment');
      expect(appointment?.customerPhone).toBe('123-456-7890');

      // FIX: Create the date in UTC to match MongoDB storage
      const searchDate = new Date(Date.UTC(2026, 2, 2)); // March 2, 2026 (month is 0-indexed)
      
      console.log('🔍 Searching for availability with date:', searchDate.toISOString());
      
      // Check availability was updated - include designerId in query
      const availability = await Availability.findOne({
        designerId: 'voidstone-studio-designer',
        date: searchDate
      });
      
      console.log('📋 Availability found:', availability ? 'YES' : 'NO');
      if (availability) {
        console.log('🕒 Slots:', availability.slots.map(s => s.time));
        console.log('📅 Stored date:', availability.date.toISOString());
      }
      
      expect(availability).toBeDefined();
      
      const bookedSlot = availability?.slots.find(s => s.time === '10:00-11:00');
      expect(bookedSlot).toBeDefined();
      expect(bookedSlot?.isAvailable).toBe(false);
      expect(bookedSlot?.bookedBy).toBe(userId);
    });

    it('should reject booking without auth', async () => {
      await request(app)
        .post('/api/book')
        .send({
          date: '2026-03-02',
          timeSlot: '10:00-11:00'
        })
        .expect(401);
    });

    it('should reject booking on weekend', async () => {
      const response = await request(app)
        .post('/api/book')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '2026-03-07', // Saturday
          timeSlot: '10:00-11:00'
        })
        .expect(400);

      expect(response.body.error).toContain('only available on weekdays');
    });

    it('should reject booking outside business hours', async () => {
      const response = await request(app)
        .post('/api/book')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '2026-03-02',
          timeSlot: '17:00-18:00' // After 4 PM
        })
        .expect(400);

      expect(response.body.error).toContain('only available from 10 AM to 4 PM');
    });

    it('should reject double booking', async () => {
      // First booking
      await request(app)
        .post('/api/book')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '2026-03-02',
          timeSlot: '10:00-11:00'
        })
        .expect(201);

      // Second booking - same slot
      const response = await request(app)
        .post('/api/book')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '2026-03-02',
          timeSlot: '10:00-11:00'
        })
        .expect(400);

      expect(response.body.error).toContain('already booked');
    });

    it('should reject invalid time slot', async () => {
      const response = await request(app)
        .post('/api/book')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '2026-03-02',
          timeSlot: 'invalid-slot'
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/my-appointments', () => {
    beforeEach(async () => {
      // Clear and create test appointments
      await Appointment.deleteMany({});
      
      await Appointment.create([
        {
          designerId: 'voidstone-studio-designer',
          customerId: userId,
          customerName: 'Test User',
          customerEmail: 'test@example.com',
          date: new Date(Date.UTC(2026, 2, 2)),
          timeSlot: '10:00-11:00',
          consultationType: 'design',
          status: 'pending'
        },
        {
          designerId: 'voidstone-studio-designer',
          customerId: userId,
          customerName: 'Test User',
          customerEmail: 'test@example.com',
          date: new Date(Date.UTC(2026, 2, 3)),
          timeSlot: '14:00-15:00',
          consultationType: 'fitting',
          status: 'confirmed'
        }
      ]);
    });

    it('should return user appointments', async () => {
      const response = await request(app)
        .get('/api/my-appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.appointments).toHaveLength(2);
      expect(response.body.appointments[0].customerId).toBe(userId);
      expect(response.body.appointments[0].consultationType).toBeDefined();
    });

    it('should reject without auth', async () => {
      await request(app)
        .get('/api/my-appointments')
        .expect(401);
    });
  });

  describe('PUT /api/cancel/:id', () => {
    let appointmentId: string;

    beforeEach(async () => {
      await Appointment.deleteMany({});
      await Availability.deleteMany({});

      // Create an appointment with the correct customerId
      const appointment = await Appointment.create({
        designerId: 'voidstone-studio-designer',
        customerId: userId,
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        date: new Date(Date.UTC(2026, 2, 2)),
        timeSlot: '10:00-11:00',
        consultationType: 'design',
        status: 'pending'
      });
      appointmentId = appointment._id.toString();

      await Availability.create({
        designerId: 'voidstone-studio-designer',
        date: new Date(Date.UTC(2026, 2, 2)),
        slots: [
          { time: '10:00-11:00', isAvailable: false, bookedBy: userId }
        ]
      });
    });

    it('should cancel appointment', async () => {
      const response = await request(app)
        .put(`/api/cancel/${appointmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toContain('cancelled successfully');

      // Check appointment status
      const appointment = await Appointment.findById(appointmentId);
      expect(appointment?.status).toBe('cancelled');

      // Check slot became available
      const availability = await Availability.findOne({
        designerId: 'voidstone-studio-designer',
        date: new Date(Date.UTC(2026, 2, 2))
      });
      const slot = availability?.slots.find(s => s.time === '10:00-11:00');
      expect(slot?.isAvailable).toBe(true);
      expect(slot?.bookedBy).toBeUndefined();
    });

    it('should reject cancel by different user', async () => {
      const differentUserToken = jwt.sign(
        { userId: 'different-id', email: 'other@example.com', role: 'client' },
        process.env.JWT_SECRET!
      );

      await request(app)
        .put(`/api/cancel/${appointmentId}`)
        .set('Authorization', `Bearer ${differentUserToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent appointment', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await request(app)
        .put(`/api/cancel/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Admin Routes', () => {
    describe('GET /api/all-appointments', () => {
      beforeEach(async () => {
        await Appointment.deleteMany({});
        await Appointment.create([
          {
            designerId: 'voidstone-studio-designer',
            customerId: 'user1',
            customerName: 'User 1',
            customerEmail: 'user1@example.com',
            date: new Date(Date.UTC(2026, 2, 2)),
            timeSlot: '10:00-11:00',
            consultationType: 'design',
            status: 'pending'
          },
          {
            designerId: 'voidstone-studio-designer',
            customerId: 'user2',
            customerName: 'User 2',
            customerEmail: 'user2@example.com',
            date: new Date(Date.UTC(2026, 2, 3)),
            timeSlot: '14:00-15:00',
            consultationType: 'fitting',
            status: 'confirmed'
          }
        ]);
      });

      it('should return all appointments for admin', async () => {
        const response = await request(app)
          .get('/api/all-appointments')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.appointments).toHaveLength(2);
        expect(response.body.appointments[0].consultationType).toBeDefined();
      });

      it('should reject non-admin users', async () => {
        await request(app)
          .get('/api/all-appointments')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);
      });
    });

    describe('PUT /api/confirm/:id', () => {
      let appointmentId: string;

      beforeEach(async () => {
        await Appointment.deleteMany({});
        const appointment = await Appointment.create({
          designerId: 'voidstone-studio-designer',
          customerId: userId,
          customerName: 'Test User',
          customerEmail: 'test@example.com',
          date: new Date(Date.UTC(2026, 2, 2)),
          timeSlot: '10:00-11:00',
          consultationType: 'design',
          status: 'pending'
        });
        appointmentId = appointment._id.toString();
      });

      it('should confirm appointment for admin', async () => {
        const response = await request(app)
          .put(`/api/confirm/${appointmentId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.message).toContain('confirmed successfully');

        const appointment = await Appointment.findById(appointmentId);
        expect(appointment?.status).toBe('confirmed');
      });

      it('should reject non-admin users', async () => {
        await request(app)
          .put(`/api/confirm/${appointmentId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);
      });

      it('should return 404 for non-existent appointment', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        await request(app)
          .put(`/api/confirm/${fakeId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });
    });
  });
});