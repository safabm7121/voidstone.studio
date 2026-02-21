import mongoose from 'mongoose';

export interface IAppointment extends mongoose.Document {
  designerId: string;      // References User in auth-service
  customerId: string;      // References User in auth-service
  date: Date;
  timeSlot: string;        // "10:00-11:00"
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new mongoose.Schema({
  designerId: {
    type: String,
    required: true,
    index: true
  },
  customerId: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending',
    index: true
  },
  notes: {
    type: String,
    maxlength: 500
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerPhone: String
}, {
  timestamps: true
});

// Compound index to prevent double-booking
appointmentSchema.index({ designerId: 1, date: 1, timeSlot: 1 }, { unique: true });

export const Appointment = mongoose.model<IAppointment>('Appointment', appointmentSchema);