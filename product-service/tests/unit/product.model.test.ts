import mongoose from 'mongoose';
import Product from '../../src/models/productModel';

describe('Product Model', () => {
  const validProductData = {
    name: 'Test Product',
    description: 'This is a test product description with at least 10 characters',
    price: 99.99,
    category: 'test-category',
    designer: 'Test Designer',
    stock_quantity: 10,
    images: ['data:image/jpeg;base64,/9j/4AAQSkZJRg...'],
    tags: ['test', 'product']
  };

  it('should create a valid product', async () => {
    const product = new Product(validProductData);
    const saved = await product.save();

    expect(saved._id).toBeDefined();
    expect(saved.name).toBe(validProductData.name);
    expect(saved.description).toBe(validProductData.description);
    expect(saved.price).toBe(validProductData.price);
    expect(saved.category).toBe(validProductData.category);
    expect(saved.designer).toBe(validProductData.designer);
    expect(saved.stock_quantity).toBe(validProductData.stock_quantity);
    expect(saved.images).toHaveLength(1);
    expect(saved.tags).toHaveLength(2);
    expect(saved.is_active).toBe(true);
    expect(saved.created_at).toBeDefined();
    expect(saved.updated_at).toBeDefined();
  });

  it('should default stock_quantity to 0', async () => {
    const product = new Product({
      name: 'Test Product',
      description: 'This is a test product description with at least 10 characters',
      price: 99.99,
      category: 'test-category'
    });

    const saved = await product.save();
    expect(saved.stock_quantity).toBe(0);
  });

  it('should default images to empty array', async () => {
    const product = new Product({
      name: 'Test Product',
      description: 'This is a test product description with at least 10 characters',
      price: 99.99,
      category: 'test-category'
    });

    const saved = await product.save();
    expect(saved.images).toEqual([]);
  });

  it('should default tags to empty array', async () => {
    const product = new Product({
      name: 'Test Product',
      description: 'This is a test product description with at least 10 characters',
      price: 99.99,
      category: 'test-category'
    });

    const saved = await product.save();
    expect(saved.tags).toEqual([]);
  });

  it('should default is_active to true', async () => {
    const product = new Product({
      name: 'Test Product',
      description: 'This is a test product description with at least 10 characters',
      price: 99.99,
      category: 'test-category'
    });

    const saved = await product.save();
    expect(saved.is_active).toBe(true);
  });

  it('should require name', async () => {
    const product = new Product({
      description: 'This is a test product description with at least 10 characters',
      price: 99.99,
      category: 'test-category'
    });

    let error: any = null;
    try {
      await product.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.name).toBeDefined();
  });

  it('should require description', async () => {
    const product = new Product({
      name: 'Test Product',
      price: 99.99,
      category: 'test-category'
    });

    let error: any = null;
    try {
      await product.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.description).toBeDefined();
  });

  it('should require price', async () => {
    const product = new Product({
      name: 'Test Product',
      description: 'This is a test product description with at least 10 characters',
      category: 'test-category'
    });

    let error: any = null;
    try {
      await product.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.price).toBeDefined();
  });

  it('should require category', async () => {
    const product = new Product({
      name: 'Test Product',
      description: 'This is a test product description with at least 10 characters',
      price: 99.99
    });

    let error: any = null;
    try {
      await product.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.category).toBeDefined();
  });

  it('should enforce minimum name length', async () => {
    const product = new Product({
      name: 'ab', // Too short
      description: 'This is a test product description with at least 10 characters',
      price: 99.99,
      category: 'test-category'
    });

    let error: any = null;
    try {
      await product.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.name).toBeDefined();
  });

  it('should enforce minimum description length', async () => {
    const product = new Product({
      name: 'Test Product',
      description: 'Too short', // Too short
      price: 99.99,
      category: 'test-category'
    });

    let error: any = null;
    try {
      await product.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.description).toBeDefined();
  });

  it('should enforce positive price', async () => {
    const product = new Product({
      name: 'Test Product',
      description: 'This is a test product description with at least 10 characters',
      price: -10, // Negative
      category: 'test-category'
    });

    let error: any = null;
    try {
      await product.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.price).toBeDefined();
  });

  it('should enforce non-negative stock_quantity', async () => {
    const product = new Product({
      name: 'Test Product',
      description: 'This is a test product description with at least 10 characters',
      price: 99.99,
      category: 'test-category',
      stock_quantity: -5 // Negative
    });

    let error: any = null;
    try {
      await product.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.stock_quantity).toBeDefined();
  });
});