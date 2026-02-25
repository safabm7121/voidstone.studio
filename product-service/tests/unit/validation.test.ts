import {
  productSchema,
  productUpdateSchema
} from '../../src/utils/validation';

describe('Product Validation Schemas', () => {
  describe('productSchema', () => {
    const validProduct = {
      name: 'Test Product',
      description: 'This is a test product description with enough characters',
      price: 99.99,
      category: 'test-category',
      designer: 'Test Designer',
      stock_quantity: 10,
      images: ['data:image/jpeg;base64,test'],
      tags: ['test', 'product']
    };

    it('should validate correct product data', () => {
      const { error } = productSchema.validate(validProduct);
      expect(error).toBeUndefined();
    });

    it('should validate minimal product data', () => {
      const minimalProduct = {
        name: 'Test Product',
        description: 'This is a test product description with enough characters',
        price: 99.99,
        category: 'test-category'
      };

      const { error } = productSchema.validate(minimalProduct);
      expect(error).toBeUndefined();
    });

    it('should default stock_quantity to 0', () => {
      const product = {
        name: 'Test Product',
        description: 'This is a test product description with enough characters',
        price: 99.99,
        category: 'test-category'
      };

      const { value } = productSchema.validate(product);
      expect(value.stock_quantity).toBe(0);
    });

    it('should default images to empty array', () => {
      const product = {
        name: 'Test Product',
        description: 'This is a test product description with enough characters',
        price: 99.99,
        category: 'test-category'
      };

      const { value } = productSchema.validate(product);
      expect(value.images).toEqual([]);
    });

    it('should default tags to empty array', () => {
      const product = {
        name: 'Test Product',
        description: 'This is a test product description with enough characters',
        price: 99.99,
        category: 'test-category'
      };

      const { value } = productSchema.validate(product);
      expect(value.tags).toEqual([]);
    });

    it('should reject name that is too short', () => {
      const invalidProduct = {
        ...validProduct,
        name: 'ab' // Too short
      };

      const { error } = productSchema.validate(invalidProduct);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('at least 3 characters');
    });

    it('should reject name that is too long', () => {
      const invalidProduct = {
        ...validProduct,
        name: 'a'.repeat(101) // Too long
      };

      const { error } = productSchema.validate(invalidProduct);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('cannot exceed 100 characters');
    });

    it('should reject description that is too short', () => {
      const invalidProduct = {
        ...validProduct,
        description: 'Too short' // Too short
      };

      const { error } = productSchema.validate(invalidProduct);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('at least 10 characters');
    });

    it('should reject description that is too long', () => {
      const invalidProduct = {
        ...validProduct,
        description: 'a'.repeat(1001) // Too long
      };

      const { error } = productSchema.validate(invalidProduct);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('cannot exceed 1000 characters');
    });

    it('should reject negative price', () => {
      const invalidProduct = {
        ...validProduct,
        price: -10
      };

      const { error } = productSchema.validate(invalidProduct);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('positive number');
    });

    it('should reject non-numeric price', () => {
      const invalidProduct = {
        ...validProduct,
        price: 'not-a-number'
      };

      const { error } = productSchema.validate(invalidProduct);
      expect(error).toBeDefined();
    });

    it('should reject negative stock_quantity', () => {
      const invalidProduct = {
        ...validProduct,
        stock_quantity: -5
      };

      const { error } = productSchema.validate(invalidProduct);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('must be greater than or equal to 0');
    });

    it('should reject too many images', () => {
      const invalidProduct = {
        ...validProduct,
        images: Array(11).fill('data:image/jpeg;base64,test') // 11 images, max is 10
      };

      const { error } = productSchema.validate(invalidProduct);
      expect(error).toBeDefined();
    });

    it('should require name', () => {
      const { name, ...productWithoutName } = validProduct;
      const { error } = productSchema.validate(productWithoutName);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('required');
    });

    it('should require description', () => {
      const { description, ...productWithoutDescription } = validProduct;
      const { error } = productSchema.validate(productWithoutDescription);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('required');
    });

    it('should require price', () => {
      const { price, ...productWithoutPrice } = validProduct;
      const { error } = productSchema.validate(productWithoutPrice);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('required');
    });

    it('should require category', () => {
      const { category, ...productWithoutCategory } = validProduct;
      const { error } = productSchema.validate(productWithoutCategory);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('required');
    });
  });

  describe('productUpdateSchema', () => {
    const validUpdate = {
      name: 'Updated Name',
      price: 89.99,
      stock_quantity: 5
    };

    it('should validate correct update data', () => {
      const { error } = productUpdateSchema.validate(validUpdate);
      expect(error).toBeUndefined();
    });

    it('should validate single field update', () => {
      const { error } = productUpdateSchema.validate({ name: 'New Name' });
      expect(error).toBeUndefined();
    });

    it('should reject empty update', () => {
      const { error } = productUpdateSchema.validate({});
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('at least 1');
    });

    it('should validate name constraints', () => {
      const { error } = productUpdateSchema.validate({ name: 'ab' });
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('at least 3 characters');
    });

    it('should validate price constraints', () => {
      const { error } = productUpdateSchema.validate({ price: -10 });
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('positive number');
    });

    it('should validate stock_quantity constraints', () => {
      const { error } = productUpdateSchema.validate({ stock_quantity: -5 });
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('must be greater than or equal to 0');
    });
  });
});