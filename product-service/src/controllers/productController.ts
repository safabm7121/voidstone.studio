import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Product from '../models/productModel';
import { ProductHistory } from '../models/ProductHistory';
import { AuthRequest } from '../middleware/auth';
import { productSchema, productUpdateSchema } from '../utils/validation';
import axios from 'axios';
import { ImageProcessor } from '../utils/imageProcessor'; 

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001/api';

export class ProductController {
    async createProduct(req: AuthRequest, res: Response) {
        try {
            const { error } = productSchema.validate(req.body);
            if (error) {
                return res.status(400).json({ error: error.details[0].message });
            }

            let { name, description, price, category, designer, stock_quantity, images, tags } = req.body; // CHANGED: added 'let'

            // Validate and clean base64 images - MODIFIED SECTION
            if (images && images.length > 0) {
                for (const image of images) {
                    if (!image.startsWith('data:image')) {
                        return res.status(400).json({ 
                            error: 'Invalid image format. Must be base64 encoded image' 
                        });
                    }
                }
                // Clean images with Sharp
                console.log(' Processing images with Sharp...');
                images = await ImageProcessor.cleanMultipleImages(images);
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
                images: images || [],
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

            // Optional email notification
            try {
                await axios.post(`${AUTH_SERVICE_URL}/api/product-email`, {
                    to: 'admin@voidstone.com',
                    subject: 'New Product Created',
                    html: `<h1>New Product: ${product.name}</h1><p>Price: ${product.price}</p>`
                });
            } catch (emailError) {
                console.error('Email notification failed:', emailError);
            }

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

            // Clean images if being updated - ADDED SECTION
            if (req.body.images) {
                console.log('🖼️ Processing updated images with Sharp...');
                req.body.images = await ImageProcessor.cleanMultipleImages(req.body.images);
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
                    
                    // Deep comparison for arrays/objects
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

                // Create history with full user info
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

                // Optional email notification
                try {
                    await axios.post(`${AUTH_SERVICE_URL}/api/product-email`, {
                        to: 'admin@voidstone.com',
                        subject: 'Product Updated',
                        html: `<h1>Product Updated: ${product.name}</h1><p>Changes: ${changes.length} fields</p>`
                    });
                } catch (emailError) {
                    console.error('Email notification failed:', emailError);
                }
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

            // Get user info from auth middleware
            const userId = req.user?.userId;
            const userName = req.user?.name || 'Unknown User';
            const userEmail = req.user?.email || '';
            const userRole = req.user?.role || 'user';

            product.is_active = false;
            product.updated_by = userId ? new mongoose.Types.ObjectId(userId) : undefined;
            await product.save();

            // Create history with full user info
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

            // Optional email notification
            try {
                await axios.post(`${AUTH_SERVICE_URL}/api/product-email`, {
                    to: 'admin@voidstone.com',
                    subject: 'Product Deleted',
                    html: `<h1>Product Deleted: ${product.name}</h1>`
                });
            } catch (emailError) {
                console.error('Email notification failed:', emailError);
            }

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