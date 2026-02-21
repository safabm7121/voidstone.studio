import { Request, Response } from 'express';
import Product from '../models/prodectModel';
import { AuthRequest } from '../middleware/auth';
import { productSchema, productUpdateSchema } from '../utils/validation';

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

            const product = new Product({
                name,
                description,
                price,
                category,
                designer,
                stock_quantity: stock_quantity || 0,
                images: images || [],
                tags: tags || [],
                created_by: req.user?.userId
            });

            await product.save();

            res.status(201).json({
                message: 'Product created successfully',
                product
            });
        } catch (error) {
            console.error('Create product error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getAllProducts(req: Request, res: Response) {
        try {
            const products = await Product.find({ is_active: true }).sort({ created_at: -1 });
            res.json({ products });
        } catch (error) {
            console.error('Get products error:', error);
            res.status(500).json({ error: 'Internal server error' });
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
            console.error('Get product error:', error);
            res.status(500).json({ error: 'Internal server error' });
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

            // Update only provided fields
            const updateFields = ['name', 'description', 'price', 'category', 'designer', 
                                 'stock_quantity', 'images', 'tags'];
            
            updateFields.forEach(field => {
                if (req.body[field] !== undefined) {
                    (product as any)[field] = req.body[field];
                }
            });

            product.updated_by = req.user?.userId as any;
            await product.save();

            res.json({
                message: 'Product updated successfully',
                product
            });
        } catch (error) {
            console.error('Update product error:', error);
            res.status(500).json({ error: 'Internal server error' });
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
            product.updated_by = req.user?.userId as any;
            await product.save();

            res.json({ message: 'Product deleted successfully' });
        } catch (error) {
            console.error('Delete product error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}