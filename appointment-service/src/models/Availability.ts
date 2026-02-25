import mongoose from 'mongoose';

export interface IAvailability extends mongoose.Document {
  designerId: string; // Changed from ObjectId to string
  date: Date;
  slots: Array<{
    time: string;
    isAvailable: boolean;
    bookedBy?: string; // Changed from ObjectId to string
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const availabilitySchema = new mongoose.Schema({
  designerId: { 
    type: String, // Changed from ObjectId to String
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
      type: String, // Changed from ObjectId to String
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