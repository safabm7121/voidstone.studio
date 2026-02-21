import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();
const productController = new ProductController();

router.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'product-service' });
});

router.get('/products', productController.getAllProducts);
router.get('/products/:id', productController.getProductById);

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