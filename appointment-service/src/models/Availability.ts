import mongoose from 'mongoose';

export interface IAvailability extends mongoose.Document {
  designerId: string;
  date: Date;
  slots: {
    time: string;           // "10:00-11:00"
    isAvailable: boolean;
  }[];
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
    required: true,
    index: true
  },
  slots: [{
    time: String,
    isAvailable: {
      type: Boolean,
      default: true
    }
  }]
}, {
  timestamps: true
});

// One document per designer per day
availabilitySchema.index({ designerId: 1, date: 1 }, { unique: true });

export const Availability = mongoose.model<IAvailability>('Availability', availabilitySchema);