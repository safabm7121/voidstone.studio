import mongoose from 'mongoose';
import Appointment from '../../src/models/Appointment';

describe('Appointment Model', () => {
  const validAppointmentData = {
    designerId: 'voidstone-studio-designer',
    customerId: new mongoose.Types.ObjectId().toString(),
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '123-456-7890',
    date: new Date('2026-03-02'),
    timeSlot: '10:00-11:00',
    consultationType: 'design',
    notes: 'Test appointment',
    status: 'pending'
  };

  it('should create a valid appointment', async () => {
    const appointment = new Appointment(validAppointmentData);
    const saved = await appointment.save();

    expect(saved._id).toBeDefined();
    expect(saved.customerName).toBe('John Doe');
    expect(saved.customerEmail).toBe('john@example.com');
    expect(saved.status).toBe('pending');
    expect(saved.consultationType).toBe('design');
    expect(saved.createdAt).toBeDefined();
    expect(saved.updatedAt).toBeDefined();
  });

  it('should default consultationType to consultation', async () => {
    const appointment = new Appointment({
      ...validAppointmentData,
      consultationType: undefined
    });
    
    const saved = await appointment.save();
    expect(saved.consultationType).toBe('consultation');
  });

  it('should default status to pending', async () => {
    const appointment = new Appointment({
      ...validAppointmentData,
      status: undefined
    });
    
    const saved = await appointment.save();
    expect(saved.status).toBe('pending');
  });

  it('should default duration to 60', async () => {
    const appointment = new Appointment({
      ...validAppointmentData,
      duration: undefined
    });
    
    const saved = await appointment.save();
    expect(saved.duration).toBe(60);
  });

  it('should only allow valid status values', async () => {
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'];
    
    for (const status of validStatuses) {
      const appointment = new Appointment({
        ...validAppointmentData,
        status
      });
      
      const saved = await appointment.save();
      expect(saved.status).toBe(status);
    }
  });

  it('should reject invalid status', async () => {
    const appointment = new Appointment({
      ...validAppointmentData,
      status: 'invalid-status'
    });
    
    let error: any = null;
    try {
      await appointment.save();
    } catch (err) {
      error = err;
    }
    
    expect(error).toBeDefined();
    expect(error.errors.status).toBeDefined();
  });

  it('should only allow valid consultation types', async () => {
    const validTypes = ['design', 'fitting', 'consultation', 'custom'];
    
    for (const type of validTypes) {
      const appointment = new Appointment({
        ...validAppointmentData,
        consultationType: type
      });
      
      const saved = await appointment.save();
      expect(saved.consultationType).toBe(type);
    }
  });

  it('should require required fields', async () => {
    const appointment = new Appointment({});
    
    let error: any = null;
    try {
      await appointment.save();
    } catch (err) {
      error = err;
    }
    
    expect(error).toBeDefined();
    expect(error.errors.designerId).toBeDefined();
    expect(error.errors.customerId).toBeDefined();
    expect(error.errors.customerName).toBeDefined();
    expect(error.errors.customerEmail).toBeDefined();
    expect(error.errors.date).toBeDefined();
    expect(error.errors.timeSlot).toBeDefined();
  });
});