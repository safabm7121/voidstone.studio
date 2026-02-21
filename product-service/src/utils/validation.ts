import Joi from 'joi';

export const productSchema = Joi.object({
    name: Joi.string().required().min(3).max(100).messages({
        'string.min': 'Product name must be at least 3 characters',
        'string.max': 'Product name cannot exceed 100 characters',
        'any.required': 'Product name is required'
    }),
    description: Joi.string().required().min(10).max(1000).messages({
        'string.min': 'Description must be at least 10 characters',
        'string.max': 'Description cannot exceed 1000 characters',
        'any.required': 'Description is required'
    }),
    price: Joi.number().required().positive().precision(3).messages({
        'number.positive': 'Price must be a positive number',
        'any.required': 'Price is required'
    }),
    category: Joi.string().required().messages({
        'any.required': 'Category is required'
    }),
    designer: Joi.string().optional(),
    stock_quantity: Joi.number().integer().min(0).default(0),
    images: Joi.array().items(Joi.string()).max(10).default([]),
    tags: Joi.array().items(Joi.string()).default([])
});

export const productUpdateSchema = Joi.object({
    name: Joi.string().min(3).max(100),
    description: Joi.string().min(10).max(1000),
    price: Joi.number().positive().precision(3),
    category: Joi.string(),
    designer: Joi.string(),
    stock_quantity: Joi.number().integer().min(0),
    images: Joi.array().items(Joi.string()).max(10),
    tags: Joi.array().items(Joi.string())
}).min(1);