import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();
const productController = new ProductController();

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'product-service' });
});

// Public routes (no auth required)
router.get('/products', productController.getAllProducts);
router.get('/products/:id', productController.getProductById);

// Protected routes (auth required)
router.get('/products/:id/history', 
    authenticateToken, 
    authorizeRoles('admin', 'manager', 'designer'), 
    productController.getProductHistory
);

router.post('/products', 
    authenticateToken, 
    authorizeRoles('admin', 'manager', 'designer'),
    productController.createProduct
);

router.put('/products/:id', 
    authenticateToken, 
    authorizeRoles('admin', 'manager', 'designer'),
    productController.updateProduct
);

router.delete('/products/:id', 
    authenticateToken, 
    authorizeRoles('admin', 'manager'),
    productController.deleteProduct
);

export default router;