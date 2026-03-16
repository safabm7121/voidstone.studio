import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Product from '../models/productModel';
import { ProductHistory } from '../models/ProductHistory';
import { AuthRequest } from '../middleware/auth';
import { productSchema, productUpdateSchema } from '../utils/validation';
import axios from 'axios';
import { CloudinaryService, CloudinaryResult } from '../utils/cloudinary';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001/api';

export class ProductController {
   async createProduct(req: AuthRequest, res: Response) {
    try {
        const { error } = productSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        let { name, description, price, category, designer, stock_quantity, images, tags } = req.body;

        let cloudinaryImages: CloudinaryResult[] = [];

        // Upload to Cloudinary if images exist
        if (images && images.length > 0) {
            try {
                console.log('☁️ Uploading images to Cloudinary...');
                cloudinaryImages = await CloudinaryService.uploadMultiple(images);
                console.log(`✅ Uploaded ${cloudinaryImages.length} images`);
            } catch (uploadError) {
                console.error('❌ Image upload failed:', uploadError);
                return res.status(500).json({ error: 'Failed to upload images' });
            }
        }

        // Get user info from auth middleware
        const userId = req.user?.userId;
        const userName = req.user?.name || 'Unknown User';
        const userEmail = req.user?.email || '';
        const userRole = req.user?.role || 'user';

        const product = new Product({
            name,
            description,
            price,
            category,
            designer,
            stock_quantity: stock_quantity || 0,
            images: cloudinaryImages, // Store Cloudinary objects, not base64!
            tags: tags || [],
            created_by: userId ? new mongoose.Types.ObjectId(userId) : undefined
        });

        await product.save();

        // Create history with full user info
        await ProductHistory.create({
            productId: product._id,
            action: 'created',
            changes: Object.keys(req.body).map(field => ({
                field,
                oldValue: null,
                newValue: req.body[field]
            })),
            changedBy: {
                userId: userId ? new mongoose.Types.ObjectId(userId) : null,
                name: userName,
                email: userEmail,
                role: userRole
            },
            metadata: {
                ip: req.ip,
                userAgent: req.headers['user-agent']
            }
        });

        res.status(201).json({
            message: 'Product created successfully',
            product
        });
    } catch (error) {
        console.error(' Create product error:', error);
        res.status(500).json({ error: 'Internal server error: ' + (error as Error).message });
    }
}

    async getAllProducts(req: Request, res: Response) {
        try {
            console.log(' Fetching all products...');
            if (mongoose.connection.readyState !== 1) {
                console.error(' MongoDB not connected');
                return res.status(500).json({ error: 'Database connection error' });
            }

            const products = await Product.find({ is_active: true }).sort({ created_at: -1 });
            console.log(` Found ${products.length} products`);
            res.json({ products });
        } catch (error) {
            console.error(' Get products error:', error);
            res.status(500).json({ error: 'Internal server error: ' + (error as Error).message });
        }
    }

    async getProductById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const product = await Product.findOne({ _id: id, is_active: true });

            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }

            res.json({ product });
        } catch (error) {
            console.error(' Get product error:', error);
            res.status(500).json({ error: 'Internal server error: ' + (error as Error).message });
        }
    }

  async updateProduct(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;
        
        const { error } = productUpdateSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const product = await Product.findOne({ _id: id, is_active: true });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Handle image updates
if (req.body.images) {
    // Upload new images to Cloudinary
    const newCloudinaryImages = await CloudinaryService.uploadMultiple(req.body.images);
    req.body.images = newCloudinaryImages;

    // Delete old images from Cloudinary - FIX HERE
    if (product.images && product.images.length > 0) {
        // Type guard: check if images are objects with public_id
        const oldPublicIds = product.images
            .filter(img => typeof img === 'object' && img !== null && 'public_id' in img)
            .map(img => (img as any).public_id);
        
        if (oldPublicIds.length > 0) {
            await CloudinaryService.deleteMultipleImages(oldPublicIds);
        }
    }
}

        // Get user info from auth middleware
        const userId = req.user?.userId;
        const userName = req.user?.name || 'Unknown User';
        const userEmail = req.user?.email || '';
        const userRole = req.user?.role || 'user';

        const updateFields = ['name', 'description', 'price', 'category', 'designer', 
                                'stock_quantity', 'images', 'tags'] as const;
        const changes: { field: string; oldValue: any; newValue: any }[] = [];

        updateFields.forEach(field => {
            if (req.body[field] !== undefined) {
                const oldValue = (product as any)[field];
                const newValue = req.body[field];
                
                const hasChanged = JSON.stringify(oldValue) !== JSON.stringify(newValue);
                
                if (hasChanged) {
                    changes.push({ field, oldValue, newValue });
                    (product as any)[field] = newValue;
                }
            }
        });

        if (changes.length > 0) {
            product.updated_by = userId ? new mongoose.Types.ObjectId(userId) : undefined;
            await product.save();

            await ProductHistory.create({
                productId: product._id,
                action: 'updated',
                changes,
                changedBy: {
                    userId: userId ? new mongoose.Types.ObjectId(userId) : null,
                    name: userName,
                    email: userEmail,
                    role: userRole
                },
                metadata: {
                    ip: req.ip,
                    userAgent: req.headers['user-agent']
                }
            });
        }

        res.json({
            message: 'Product updated successfully',
            product
        });
    } catch (error) {
        console.error(' Update product error:', error);
        res.status(500).json({ error: 'Internal server error: ' + (error as Error).message });
    }
}

   async deleteProduct(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;

        const product = await Product.findOne({ _id: id, is_active: true });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Delete images from Cloudinary
       // Delete images from Cloudinary
if (product.images && product.images.length > 0) {
    // Type guard: filter only objects with public_id
    const publicIds = product.images
        .filter(img => typeof img === 'object' && img !== null && 'public_id' in img)
        .map(img => (img as any).public_id);
    
    if (publicIds.length > 0) {
        await CloudinaryService.deleteMultipleImages(publicIds);
        console.log(`🗑️ Deleted ${publicIds.length} images from Cloudinary`);
    }
}

        // Get user info from auth middleware
        const userId = req.user?.userId;
        const userName = req.user?.name || 'Unknown User';
        const userEmail = req.user?.email || '';
        const userRole = req.user?.role || 'user';

        product.is_active = false;
        product.updated_by = userId ? new mongoose.Types.ObjectId(userId) : undefined;
        await product.save();

        await ProductHistory.create({
            productId: product._id,
            action: 'deleted',
            changes: [{ field: 'is_active', oldValue: true, newValue: false }],
            changedBy: {
                userId: userId ? new mongoose.Types.ObjectId(userId) : null,
                name: userName,
                email: userEmail,
                role: userRole
            },
            metadata: {
                ip: req.ip,
                userAgent: req.headers['user-agent']
            }
        });

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error(' Delete product error:', error);
        res.status(500).json({ error: 'Internal server error: ' + (error as Error).message });
    }
}

    async getProductHistory(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            
            // Check if product exists
            const product = await Product.findById(id);
            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }

            // Get history with populated user info
            const history = await ProductHistory.find({ productId: id })
                .sort({ changedAt: -1 })
                .limit(100);

            // Transform the data to match frontend expectations
            const transformedHistory = history.map(entry => ({
                _id: entry._id,
                action: entry.action,
                changes: entry.changes,
                performedBy: entry.changedBy ? {
                    _id: entry.changedBy.userId,
                    name: entry.changedBy.name,
                    email: entry.changedBy.email,
                    role: entry.changedBy.role
                } : null,
                changedAt: entry.changedAt
            }));

            res.json({ history: transformedHistory });
        } catch (error) {
            console.error(' Get history error:', error);
            res.status(500).json({ error: 'Internal server error: ' + (error as Error).message });
        }
    }
}