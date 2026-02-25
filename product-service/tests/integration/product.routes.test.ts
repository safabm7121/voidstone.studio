import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/index';
import Product from '../../src/models/productModel';
import { ProductHistory } from '../../src/models/ProductHistory';
import jwt from 'jsonwebtoken';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Product API Integration Tests', () => {
  let authToken: string;
  let adminToken: string;
  let designerToken: string;
  let server: any; // Add this line
  
  const userId = new mongoose.Types.ObjectId().toString();
  const adminId = new mongoose.Types.ObjectId().toString();
  const designerId = new mongoose.Types.ObjectId().toString();

  const validProduct = {
    name: 'Test Product',
    description: 'This is a test product description with enough characters',
    price: 99.99,
    category: 'test-category',
    designer: 'Test Designer',
    stock_quantity: 10,
    images: ['data:image/jpeg;base64,/9j/4AAQSkZJRg...'],
    tags: ['test', 'product']
  };

  beforeAll(() => {
    server = app.listen(); // Start server once before all tests
  });

  afterAll((done) => {
    server.close(done); // Close server once after all tests
  });

  beforeEach(async () => {
    // Clear collections
    await Product.deleteMany({});
    await ProductHistory.deleteMany({});

    // Create test tokens with proper roles
    authToken = jwt.sign(
      { userId, email: 'test@example.com', role: 'client' },
      process.env.JWT_SECRET!
    );

    adminToken = jwt.sign(
      { userId: adminId, email: 'admin@example.com', role: 'admin' },
      process.env.JWT_SECRET!
    );

    designerToken = jwt.sign(
      { userId: designerId, email: 'designer@example.com', role: 'designer' },
      process.env.JWT_SECRET!
    );

    // Mock axios for email notifications
    mockedAxios.post.mockResolvedValue({ data: { success: true } });
  });

  // ... rest of your tests remain exactly the same ...
  
  describe('GET /api/products', () => {
    it('should return all active products', async () => {
      // Create test products
      await Product.create([
        validProduct,
        { ...validProduct, name: 'Another Product' }
      ]);

      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.products).toHaveLength(2);
      expect(response.body.products[0].name).toBeDefined();
      expect(response.body.products[0].is_active).toBe(true);
    });

    it('should not return inactive products', async () => {
      await Product.create({
        ...validProduct,
        is_active: false
      });

      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.products).toHaveLength(0);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return product by id', async () => {
      const product = await Product.create(validProduct);

      const response = await request(app)
        .get(`/api/products/${product._id}`)
        .expect(200);

      expect(response.body.product._id).toBe(product._id.toString());
      expect(response.body.product.name).toBe(validProduct.name);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await request(app)
        .get(`/api/products/${fakeId}`)
        .expect(404);
    });

    it('should return 404 for inactive product', async () => {
      const product = await Product.create({
        ...validProduct,
        is_active: false
      });

      await request(app)
        .get(`/api/products/${product._id}`)
        .expect(404);
    });
  });

  describe('POST /api/products', () => {
    it('should create product with admin token', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validProduct)
        .expect(201);

      expect(response.body.message).toContain('created successfully');
      expect(response.body.product.name).toBe(validProduct.name);
      expect(response.body.product.price).toBe(validProduct.price);

      // Check database
      const product = await Product.findById(response.body.product._id);
      expect(product).toBeDefined();
      expect(product?.name).toBe(validProduct.name);

      // Check history was created
      const history = await ProductHistory.findOne({ productId: product?._id });
      expect(history).toBeDefined();
      expect(history?.action).toBe('created');

      // Check email was sent
      expect(mockedAxios.post).toHaveBeenCalled();
    });

    it('should create product with designer token', async () => {
      await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${designerToken}`)
        .send(validProduct)
        .expect(201);
    });

    it('should reject product creation with client token', async () => {
      await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validProduct)
        .expect(403);
    });

    it('should reject product creation without auth', async () => {
      await request(app)
        .post('/api/products')
        .send(validProduct)
        .expect(401);
    });

    it('should reject invalid product data', async () => {
      const invalidProduct = {
        name: 'ab', // Too short
        description: 'short', // Too short
        price: -10, // Negative
        // Missing category
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidProduct)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should reject invalid image format', async () => {
      const invalidProduct = {
        ...validProduct,
        images: ['not-a-base64-image']
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidProduct)
        .expect(400);

      expect(response.body.error).toContain('Invalid image format');
    });
  });

  describe('PUT /api/products/:id', () => {
    let productId: string;

    beforeEach(async () => {
      const product = await Product.create(validProduct);
      productId = product._id.toString();
    });

    it('should update product with admin token', async () => {
      const updates = {
        name: 'Updated Name',
        price: 89.99,
        stock_quantity: 5
      };

      const response = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.message).toContain('updated successfully');
      expect(response.body.product.name).toBe('Updated Name');
      expect(response.body.product.price).toBe(89.99);
      expect(response.body.product.stock_quantity).toBe(5);

      // Check database
      const product = await Product.findById(productId);
      expect(product?.name).toBe('Updated Name');
      expect(product?.price).toBe(89.99);

      // Check history was created
      const history = await ProductHistory.findOne({ productId });
      expect(history).toBeDefined();
      expect(history?.action).toBe('updated');
      expect(history?.changes).toHaveLength(3);

      // Check email was sent
      expect(mockedAxios.post).toHaveBeenCalled();
    });

    it('should update product with designer token', async () => {
      await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${designerToken}`)
        .send({ name: 'Updated Name' })
        .expect(200);
    });

    it('should reject update with client token', async () => {
      await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })
        .expect(403);
    });

    it('should reject update without auth', async () => {
      await request(app)
        .put(`/api/products/${productId}`)
        .send({ name: 'Updated Name' })
        .expect(401);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await request(app)
        .put(`/api/products/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name' })
        .expect(404);
    });

    it('should reject empty update', async () => {
      await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);
    });

    it('should reject invalid update data', async () => {
      await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: -10 })
        .expect(400);
    });

    it('should not create history if no changes', async () => {
      await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: validProduct.name }) // Same name, no change
        .expect(200);

      const history = await ProductHistory.find({ productId });
      expect(history).toHaveLength(0); // No new history entry
    });
  });

  describe('DELETE /api/products/:id', () => {
    let productId: string;

    beforeEach(async () => {
      const product = await Product.create(validProduct);
      productId = product._id.toString();
    });

    it('should soft delete product with admin token', async () => {
      const response = await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toContain('deleted successfully');

      // Check product is inactive
      const product = await Product.findById(productId);
      expect(product?.is_active).toBe(false);

      // Check history was created
      const history = await ProductHistory.findOne({ productId });
      expect(history).toBeDefined();
      expect(history?.action).toBe('deleted');

      // Check email was sent
      expect(mockedAxios.post).toHaveBeenCalled();
    });

    it('should reject delete with designer token', async () => {
      await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${designerToken}`)
        .expect(403);
    });

    it('should reject delete with client token', async () => {
      await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('should reject delete without auth', async () => {
      await request(app)
        .delete(`/api/products/${productId}`)
        .expect(401);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await request(app)
        .delete(`/api/products/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 404 for already deleted product', async () => {
      // First delete
      await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Second delete should return 404
      await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('Health Check', () => {
    it('should return OK status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('service', 'product-service');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});