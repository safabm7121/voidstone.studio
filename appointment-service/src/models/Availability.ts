import mongoose from 'mongoose';

export interface IAvailability extends mongoose.Document {
  designerId: string; 
  date: Date;
  slots: Array<{
    time: string;
    isAvailable: boolean;
    bookedBy?: string; 
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const availabilitySchema = new mongoose.Schema({
  designerId: { 
    type: String, 
    required: true,
    index: true
  },
  date: { 
    type: Date, 
    required: true 
  },
  slots: [{
    time: { 
      type: String, 
      required: true 
    },
    isAvailable: { 
      type: Boolean, 
      default: true 
    },
    bookedBy: { 
      type: String, 
      ref: 'User' 
    }
  }]
}, {
  timestamps: true
});

// Ensure one availability per designer per day
availabilitySchema.index({ designerId: 1, date: 1 }, { unique: true });

const Availability = mongoose.model<IAvailability>('Availability', availabilitySchema);
export default Availability;