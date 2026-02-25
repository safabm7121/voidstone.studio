import mongoose from 'mongoose';
import { ProductHistory } from '../../src/models/ProductHistory';
import Product from '../../src/models/productModel';

describe('ProductHistory Model', () => {
  let productId: mongoose.Types.ObjectId;

  beforeEach(async () => {
    const product = await Product.create({
      name: 'Test Product',
      description: 'This is a test product description with at least 10 characters',
      price: 99.99,
      category: 'test-category'
    });
    productId = product._id as mongoose.Types.ObjectId;
  });

  const validHistoryData = {
    productId: null as any, // Will be set in tests
    action: 'created' as const,
    changes: [
      { field: 'name', newValue: 'Test Product' },
      { field: 'price', newValue: 99.99 }
    ],
    changedBy: 'user123'
  };

  it('should create valid history entry', async () => {
    const history = new ProductHistory({
      ...validHistoryData,
      productId
    });

    const saved = await history.save();

    expect(saved._id).toBeDefined();
    expect(saved.productId.toString()).toBe(productId.toString());
    expect(saved.action).toBe('created');
    expect(saved.changes).toHaveLength(2);
    expect(saved.changedBy).toBe('user123');
    expect(saved.changedAt).toBeDefined();
  });

  it('should allow updated action', async () => {
    const history = new ProductHistory({
      productId,
      action: 'updated',
      changes: [
        { field: 'price', oldValue: 99.99, newValue: 89.99 }
      ],
      changedBy: 'user123'
    });

    const saved = await history.save();
    expect(saved.action).toBe('updated');
  });

  it('should allow deleted action', async () => {
    const history = new ProductHistory({
      productId,
      action: 'deleted',
      changes: [
        { field: 'is_active', oldValue: true, newValue: false }
      ],
      changedBy: 'user123'
    });

    const saved = await history.save();
    expect(saved.action).toBe('deleted');
  });

  it('should reject invalid action', async () => {
    const history = new ProductHistory({
      productId,
      action: 'invalid-action',
      changes: [],
      changedBy: 'user123'
    });

    let error: any = null;
    try {
      await history.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.action).toBeDefined();
  });

  it('should require productId', async () => {
    const history = new ProductHistory({
      action: 'created',
      changes: [],
      changedBy: 'user123'
    });

    let error: any = null;
    try {
      await history.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.productId).toBeDefined();
  });

  it('should require action', async () => {
    const history = new ProductHistory({
      productId,
      changes: [],
      changedBy: 'user123'
    });

    let error: any = null;
    try {
      await history.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.action).toBeDefined();
  });

  it('should default changedAt to current date', async () => {
    const before = new Date();
    const history = new ProductHistory({
      productId,
      action: 'created',
      changes: []
    });
    const saved = await history.save();
    const after = new Date();

    expect(saved.changedAt).toBeDefined();
    expect(saved.changedAt.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
    expect(saved.changedAt.getTime()).toBeLessThanOrEqual(after.getTime() + 1000);
  });
});