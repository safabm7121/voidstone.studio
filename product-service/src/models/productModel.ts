import mongoose from 'mongoose';

export interface IProduct extends mongoose.Document {
    name: string;
    description: string;
    price: number;
    category: string;
    designer?: string;
    stock_quantity: number;
    images: string[];
    tags: string[];
    is_active: boolean;
    created_by?: mongoose.Types.ObjectId;
    updated_by?: mongoose.Types.ObjectId;
    created_at: Date;
    updated_at: Date;
}

const productSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Product name is required'],
        trim: true,
        minlength: [3, 'Product name must be at least 3 characters'],
        maxlength: [100, 'Product name cannot exceed 100 characters']
    },
    description: { 
        type: String, 
        required: [true, 'Description is required'],
        minlength: [10, 'Description must be at least 10 characters'],
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    price: { 
        type: Number, 
        required: [true, 'Price is required'],
        min: [0, 'Price must be positive']
    },
    category: { 
        type: String, 
        required: [true, 'Category is required']
    },
    designer: { 
        type: String 
    },
    stock_quantity: { 
        type: Number, 
        default: 0,
        min: [0, 'Stock quantity cannot be negative']
    },
    images: { 
        type: [String], 
        default: [] 
    },
    tags: { 
        type: [String], 
        default: [] 
    },
    is_active: { 
        type: Boolean, 
        default: true 
    },
    created_by: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    updated_by: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }
}, {
    timestamps: { 
        createdAt: 'created_at', 
        updatedAt: 'updated_at' 
    }
});

// Create indexes for better query performance
productSchema.index({ category: 1 });
productSchema.index({ designer: 1 });
productSchema.index({ price: 1 });
productSchema.index({ created_at: -1 });

const Product = mongoose.model<IProduct>('Product', productSchema);

export default Product;