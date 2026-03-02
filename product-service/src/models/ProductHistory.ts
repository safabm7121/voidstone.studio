import mongoose from 'mongoose';

export interface IProductHistory extends mongoose.Document {
  productId: mongoose.Types.ObjectId;
  action: 'created' | 'updated' | 'deleted';
  changes: {
    field: string;
    oldValue?: any;
    newValue?: any;
  }[];
  changedBy: {
    userId: mongoose.Types.ObjectId;
    name: string;
    email: string;
    role: string;
  };
  changedAt: Date;
  metadata?: {
    ip?: string;
    userAgent?: string;
  };
}

const productHistorySchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true,
    index: true
  },
  action: { 
    type: String, 
    enum: ['created', 'updated', 'deleted'], 
    required: true 
  },
  changes: [{
    field: { type: String, required: true },
    oldValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed }
  }],
  changedBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, required: true }
  },
  changedAt: { type: Date, default: Date.now },
  metadata: {
    ip: String,
    userAgent: String
  }
}, {
  timestamps: true
});

// Indexes for faster queries
productHistorySchema.index({ productId: 1, changedAt: -1 });
productHistorySchema.index({ 'changedBy.userId': 1 });
productHistorySchema.index({ action: 1 });

export const ProductHistory = mongoose.model<IProductHistory>('ProductHistory', productHistorySchema);