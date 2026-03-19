import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Box,
  Chip,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Alert,
  Breadcrumbs
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import HomeIcon from '@mui/icons-material/Home';
import StoreIcon from '@mui/icons-material/Store';
import { productApi } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/helpers';
import ImageGallery from '../components/products/ImageGallery';
import { toast } from 'react-toastify';
import '../styles/ProductDetail.css';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  designer?: string;
  stock_quantity: number;
  images: string[];
  tags: string[];
  created_at?: string;
  updated_at?: string;
}

const ProductDetail: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingImages, setSavingImages] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  const splitCategory = (cat: string) => {
    if (!cat) return { main: '', sub: '' };
    const parts = cat.split(' ');
    if (parts.length >= 2) {
      return { main: parts[0], sub: parts.slice(1).join(' ') };
    }
    return { main: cat, sub: '' };
  };

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await productApi.get(`/products/${id}`);
      
      if (!response.data?.product) {
        throw new Error('Product not found');
      }
      
      setProduct(response.data.product);
    } catch (error: any) {
      console.error('Error fetching product:', error);
      const errorMessage = error.response?.data?.error || 'Failed to load product';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally { 
      setLoading(false); 
    }
  }, [id]);

  useEffect(() => { 
    fetchProduct(); 
  }, [fetchProduct]);

  const handleImagesChange = async (newImages: string[]) => {
    if (!isAdmin || !product) {
      toast.warning('You do not have permission to edit images');
      return;
    }
    
    const validImages = newImages.filter(img => img && typeof img === 'string');
    
    if (validImages.length === 0) {
      toast.warning('No valid images to save');
      return;
    }
    
    try {
      setSavingImages(true);
      
      const response = await productApi.put(`/products/${product._id}`, {
        images: validImages
      });
      
      if (response.data?.product) {
        setProduct(response.data.product);
        toast.success('Images updated successfully');
      } else {
        setProduct({ ...product, images: validImages });
        toast.success('Images updated successfully');
      }
      
    } catch (error: any) {
      console.error('Error updating images:', error);
      
      if (error.response?.status === 401) {
        toast.error('Authentication required. Please login again.');
        navigate('/login');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to update images');
      } else {
        toast.error(error.response?.data?.error || 'Failed to update images');
      }
    } finally {
      setSavingImages(false);
    }
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) { 
      toast.info('Please login to add items to cart');
      navigate('/login'); 
      return; 
    }
    
    if (!product) return;
    
    if (product.stock_quantity < quantity) {
      toast.error(`Only ${product.stock_quantity} items available`);
      return;
    }
    
    addToCart(product, quantity);
    toast.success(`${quantity} × ${product.name} added to cart`);
  };

  const increaseQuantity = () => {
    if (!product) return;
    if (quantity < product.stock_quantity) {
      setQuantity(prev => prev + 1);
    } else {
      toast.warning(`Maximum available: ${product.stock_quantity}`);
    }
  };

  const decreaseQuantity = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };

  if (loading) {
    return (
      <Box className="loading-container">
        <CircularProgress size={60} thickness={4} />
        <Typography variant="body1" color="textSecondary">
          Loading product details...
        </Typography>
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Container maxWidth="lg" className="error-container">
        <Alert 
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/products')}>
              Browse Products
            </Button>
          }
        >
          {error || t('product.notFound')}
        </Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/products')}
          variant="outlined"
          className="back-button"
        >
          {t('common.back')}
        </Button>
      </Container>
    );
  }

  const { main, sub } = splitCategory(product.category || '');

  return (
    <Container maxWidth="lg" className="product-detail-container">
      {/* Breadcrumbs */}
      <Breadcrumbs className="breadcrumbs" separator="/">
        <Link to="/" className="breadcrumb-link">
          <HomeIcon fontSize="small" />
          <span>Home</span>
        </Link>
        <Link to="/products" className="breadcrumb-link">
          <StoreIcon fontSize="small" />
          <span>Products</span>
        </Link>
        <Typography color="textPrimary" className="breadcrumb-current">
          {product.name}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box className="product-header">
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/products')}
          className="back-button"
        >
          Back to Products
        </Button>
        
        {isAdmin && (
          <Chip 
            label="Admin Mode" 
            color="primary" 
            size="small"
            className="admin-chip"
          />
        )}
      </Box>

      {/* Saving Indicator */}
      {savingImages && (
        <Alert 
          severity="info" 
          className="saving-alert"
          icon={<CircularProgress size={20} />}
        >
          Saving images... Please wait.
        </Alert>
      )}

      {/* Main Content */}
      <Grid container spacing={6} className="product-grid">
        {/* Image Section */}
        <Grid item xs={12} md={6}>
          <Box className="image-section">
            <ImageGallery 
              images={product.images || []} 
              productName={product.name}
              isEditable={isAdmin}
              onImagesChange={handleImagesChange}
            />
          </Box>
        </Grid>

        {/* Info Section */}
        <Grid item xs={12} md={6}>
          <Box className="info-section">
            <Typography variant="h3" className="product-title">
              {product.name}
            </Typography>
            
            <Typography variant="h4" className="product-price">
              {formatCurrency(product.price)}
            </Typography>
            
            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <Box className="tags-container">
                {product.tags.map((tag: string) => (
                  <Chip 
                    key={tag} 
                    label={tag} 
                    size="small"
                    className="tag-chip"
                  />
                ))}
              </Box>
            )}
            
            <Divider className="divider" />
            
            {/* Description */}
            <Typography className="product-description">
              {product.description}
            </Typography>
            
            {/* Product Details Grid */}
            <Box className="details-grid">
              <Box className="detail-item">
                <Typography variant="subtitle2" color="textSecondary" className="detail-label">
                  {t('product.category')}
                </Typography>
                <Box className="category-chips">
                  <Chip
                    label={t(`products.categories.${main.toLowerCase()}`)}
                    size="small"
                    variant="outlined"
                  />
                  {sub && (
                    <Chip
                      label={t(`products.categories.${sub === 'T-Shirts' ? 'tShirts' : sub.toLowerCase()}`)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
              
              <Box className="detail-item">
                <Typography variant="subtitle2" color="textSecondary" className="detail-label">
                  {t('product.designer')}
                </Typography>
                <Typography variant="body1" className="detail-value">
                  {product.designer || t('product.defaultDesigner')}
                </Typography>
              </Box>
              
              <Box className="detail-item">
                <Typography variant="subtitle2" color="textSecondary" className="detail-label">
                  {t('product.stock')}
                </Typography>
                <Typography 
                  variant="body1" 
                  className={`stock-value ${product.stock_quantity > 0 ? 'in-stock' : 'out-of-stock'}`}
                >
                  {product.stock_quantity > 0 
                    ? `${product.stock_quantity} ${t('product.available')}`
                    : 'Out of Stock'
                  }
                </Typography>
              </Box>

              {product._id && (
                <Box className="detail-item">
                  <Typography variant="subtitle2" color="textSecondary" className="detail-label">
                    Product ID
                  </Typography>
                  <Typography variant="body2" color="textSecondary" className="product-id">
                    {product._id.slice(-8)}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Quantity Selector */}
            <Box className="quantity-selector">
              <Typography variant="body1" className="quantity-label">
                {t('product.quantity')}:
              </Typography>
              
              <Box className="quantity-controls">
                <IconButton 
                  onClick={decreaseQuantity} 
                  disabled={quantity <= 1}
                  className="quantity-button"
                  size="small"
                >
                  <RemoveIcon />
                </IconButton>
                
                <Typography className="quantity-value">
                  {quantity}
                </Typography>
                
                <IconButton 
                  onClick={increaseQuantity}
                  disabled={quantity >= product.stock_quantity}
                  className="quantity-button"
                  size="small"
                >
                  <AddIcon />
                </IconButton>
              </Box>
              
              <Typography variant="body2" color="textSecondary" className="total-price">
                Total: {formatCurrency(product.price * quantity)}
              </Typography>
            </Box>

            {/* Add to Cart Button */}
            <Button 
              variant="contained" 
              size="large" 
              fullWidth 
              startIcon={<ShoppingCartIcon />} 
              onClick={handleAddToCart} 
              disabled={product.stock_quantity === 0 || savingImages} 
              className="add-to-cart-button"
            >
              {product.stock_quantity > 0 
                ? t('product.addToCart') 
                : t('product.outOfStock')
              }
            </Button>

            {/* Login Prompt */}
            {!isAuthenticated && (
              <Typography variant="body2" color="textSecondary" className="login-prompt">
                {t('product.loginRequired')}{' '}
                <Button 
                  component={Link} 
                  to="/login" 
                  size="small"
                  className="login-link"
                >
                  {t('auth.login')}
                </Button>
              </Typography>
            )}

            {/* Admin Note */}
            {isAdmin && (
              <Typography variant="caption" color="textSecondary" className="admin-note">
                You are in admin mode. You can add, remove, or reorder images using the gallery controls.
              </Typography>
            )}
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProductDetail;