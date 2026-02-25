import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Product from '../models/productModel';
import { ProductHistory } from '../models/ProductHistory';
import { AuthRequest } from '../middleware/auth';
import { productSchema, productUpdateSchema } from '../utils/validation';
import axios from 'axios';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001/api';

export class ProductController {
    async createProduct(req: AuthRequest, res: Response) {
        try {
            const { error } = productSchema.validate(req.body);
            if (error) {
                return res.status(400).json({ error: error.details[0].message });
            }

            const { name, description, price, category, designer, stock_quantity, images, tags } = req.body;

            // Validate base64 images
            if (images && images.length > 0) {
                for (const image of images) {
                    if (!image.startsWith('data:image')) {
                        return res.status(400).json({ 
                            error: 'Invalid image format. Must be base64 encoded image' 
                        });
                    }
                }
            }

            // Convert userId to ObjectId
            const createdById = req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : undefined;

            const product = new Product({
                name,
                description,
                price,
                category,
                designer,
                stock_quantity: stock_quantity || 0,
                images: images || [],
                tags: tags || [],
                created_by: createdById
            });

            await product.save();

            await ProductHistory.create({
                productId: product._id,
                action: 'created',
                changes: [{ field: 'product', newValue: product }],
                changedBy: req.user?.userId
            });

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
            console.error('❌ Create product error:', error);
            res.status(500).json({ error: 'Internal server error: ' + (error as Error).message });
        }
    }

    async getAllProducts(req: Request, res: Response) {
        try {
            console.log('📦 Fetching all products...');
            // Check database connection
            if (mongoose.connection.readyState !== 1) {
                console.error('❌ MongoDB not connected');
                return res.status(500).json({ error: 'Database connection error' });
            }

            const products = await Product.find({ is_active: true }).sort({ created_at: -1 });
            console.log(`✅ Found ${products.length} products`);
            res.json({ products });
        } catch (error) {
            console.error('❌ Get products error:', error);
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
            console.error('❌ Get product error:', error);
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

            const updateFields = ['name', 'description', 'price', 'category', 'designer', 
                                 'stock_quantity', 'images', 'tags'] as const;
            const changes: { field: string; oldValue: any; newValue: any }[] = [];

            updateFields.forEach(field => {
                if (req.body[field] !== undefined) {
                    const oldValue = (product as any)[field];
                    const newValue = req.body[field];
                    if (oldValue !== newValue) {
                        changes.push({ field, oldValue, newValue });
                        (product as any)[field] = newValue;
                    }
                }
            });

            product.updated_by = req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : undefined;
            await product.save();

            if (changes.length > 0) {
                await ProductHistory.create({
                    productId: product._id,
                    action: 'updated',
                    changes,
                    changedBy: req.user?.userId
                });

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
            console.error('❌ Update product error:', error);
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

            product.is_active = false;
            product.updated_by = req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : undefined;
            await product.save();

            await ProductHistory.create({
                productId: product._id,
                action: 'deleted',
                changes: [{ field: 'is_active', oldValue: true, newValue: false }],
                changedBy: req.user?.userId
            });

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
            console.error('❌ Delete product error:', error);
            res.status(500).json({ error: 'Internal server error: ' + (error as Error).message });
        }
    }

    async getProductHistory(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const history = await ProductHistory.find({ productId: id })
                .sort({ changedAt: -1 })
                .limit(50);
            res.json({ history });
        } catch (error) {
            console.error('❌ Get history error:', error);
            res.status(500).json({ error: 'Internal server error: ' + (error as Error).message });
        }
    }
}