import mongoose from 'mongoose';

export interface IAppointment extends mongoose.Document {
  designerId: string; // Changed from ObjectId to string
  customerId: string; // Changed from ObjectId to string
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  date: Date;
  timeSlot: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';
  notes?: string;
  consultationType: 'design' | 'fitting' | 'consultation' | 'custom';
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new mongoose.Schema({
  designerId: { 
    type: String, // Changed from ObjectId to String
    required: true 
  },
  customerId: { 
    type: String, // Changed from ObjectId to String
    required: true 
  },
  customerName: { 
    type: String, 
    required: true 
  },
  customerEmail: { 
    type: String, 
    required: true 
  },
  customerPhone: String,
  date: { 
    type: Date, 
    required: true 
  },
  timeSlot: { 
    type: String, 
    required: true 
  },
  duration: { 
    type: Number, 
    default: 60 
  },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
    default: 'pending'
  },
  notes: String,
  consultationType: { 
    type: String, 
    enum: ['design', 'fitting', 'consultation', 'custom'],
    default: 'consultation'
  }
}, {
  timestamps: true
});

// Indexes for faster queries
appointmentSchema.index({ designerId: 1, date: 1 });
appointmentSchema.index({ customerId: 1, date: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ date: 1 });

const Appointment = mongoose.model<IAppointment>('Appointment', appointmentSchema);
export default Appointment;