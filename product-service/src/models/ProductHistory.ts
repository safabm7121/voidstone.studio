import mongoose from 'mongoose';

export interface IProductHistory extends mongoose.Document {
  productId: mongoose.Types.ObjectId;
  action: 'created' | 'updated' | 'deleted';
  changes: {
    field: string;
    oldValue?: any;
    newValue?: any;
  }[];
  changedBy?: string;
  changedAt: Date;
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
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed
  }],
  changedBy: { type: String },
  changedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Index for faster queries
productHistorySchema.index({ productId: 1, changedAt: -1 });

export const ProductHistory = mongoose.model<IProductHistory>('ProductHistory', productHistorySchema);