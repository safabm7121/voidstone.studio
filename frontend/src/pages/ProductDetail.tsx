import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container, Typography, Grid, Card, CardMedia, Box, Chip, Button, CircularProgress,
  Divider, Paper, IconButton, FormControlLabel, Switch, Alert, 
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { productApi } from '../services/api';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/helpers';
import ImageSlider from '../components/products/ImageSlider';
import { toast } from 'react-toastify';

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
  
  // State
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingImages, setSavingImages] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [useNewSlider, setUseNewSlider] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simpleSliderIndex, setSimpleSliderIndex] = useState(0);
  // Hooks
  const { elementRef, isVisible } = useIntersectionObserver({ threshold: 0.1 });
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();

  // Check if user is admin
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  // Helper to split category into main and sub (e.g., "Men Shirts" → main="Men", sub="Shirts")
  const splitCategory = (cat: string) => {
    if (!cat) return { main: '', sub: '' };
    const parts = cat.split(' ');
    if (parts.length >= 2) {
      return { main: parts[0], sub: parts.slice(1).join(' ') };
    }
    return { main: cat, sub: '' };
  };

  // Fetch product data
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

  // Handle image changes
  const handleImagesChange = async (newImages: string[]) => {
    if (!isAdmin || !product) {
      toast.warning('You do not have permission to edit images');
      return;
    }
    
    // Validate images
    const validImages = newImages.filter(img => img && typeof img === 'string');
    
    if (validImages.length === 0) {
      toast.warning('No valid images to save');
      return;
    }
    
    try {
      setSavingImages(true);
      
      // Only send the images field to avoid overwriting other data
      const response = await productApi.put(`/products/${product._id}`, {
        images: validImages
      });
      
      if (response.data?.product) {
        // Update local state with the response from server
        setProduct(response.data.product);
        toast.success('Images updated successfully');
      } else {
        // Fallback: update local state manually
        setProduct({ ...product, images: validImages });
        toast.success('Images updated successfully');
      }
      
    } catch (error: any) {
      console.error('Error updating images:', error);
      
      // Handle specific error cases
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

  // Handle add to cart
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

  // Handle quantity changes
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

  // Loading state
  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="60vh"
        flexDirection="column"
        gap={2}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="body1" color="text.secondary">
          Loading product details...
        </Typography>
      </Box>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
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
        >
          {t('common.back')}
        </Button>
      </Container>
    );
  }

  const { main, sub } = splitCategory(product.category || '');

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <div ref={elementRef} className={`fade-blur ${isVisible ? 'visible' : ''}`}>
        {/* Header with back button and slider toggle */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate('/products')}
            variant="text"
            sx={{ '&:hover': { bgcolor: 'action.hover' } }}
          >
            {t('common.back')}
          </Button>
          
          {/* Admin info and slider toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {isAdmin && (
              <Chip 
                label="Admin Mode" 
                color="primary" 
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            )}
            <FormControlLabel
              control={
                <Switch 
                  checked={useNewSlider} 
                  onChange={(e) => setUseNewSlider(e.target.checked)}
                  color="primary"
                />
              }
              label="3D Slider"
              labelPlacement="start"
            />
          </Box>
        </Box>

        {/* Saving indicator */}
        {savingImages && (
          <Alert 
            severity="info" 
            sx={{ mb: 2 }}
            icon={<CircularProgress size={20} />}
          >
            Saving images... Please wait.
          </Alert>
        )}

        {/* Main content grid */}
        <Grid container spacing={4}>
          {/* Image section */}
          <Grid item xs={12} md={6}>
            {useNewSlider ? (
              <ImageSlider 
                images={product.images || []} 
                productName={product.name}
                isEditable={isAdmin}
                onImagesChange={handleImagesChange}
              />
            ) : (
              <Card elevation={3}>
                {product.images?.length > 0 ? (
                  <>
                    <CardMedia
                      component="img"
                      height="400"
                      image={product.images[simpleSliderIndex]}  
                      alt={product.name}
                      sx={{
                        objectFit: 'cover',
                        transition: 'transform 0.3s',
                        '&:hover': { transform: 'scale(1.02)' }
                      }}
                    />
                    {product.images.length > 1 && (
                      <Box sx={{
                        display: 'flex',
                        gap: 1,
                        p: 2,
                        overflowX: 'auto',
                        '&::-webkit-scrollbar': { height: 8 },
                        '&::-webkit-scrollbar-thumb': {
                          bgcolor: 'primary.main',
                          borderRadius: 4,
                        }
                      }}>
                        {product.images.map((img: string, idx: number) => (
                          <Box
                            key={idx}
                            onClick={() => setSimpleSliderIndex(idx)}  
                            sx={{
                              width: 80,
                              height: 80,
                              border: '2px solid',
                              borderColor: idx === simpleSliderIndex ? 'primary.main' : 'transparent',  
                              borderRadius: 1,
                              cursor: 'pointer',
                              backgroundImage: `url(${img})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              transition: 'transform 0.2s',
                              '&:hover': {
                                transform: 'scale(1.1)',
                                borderColor: 'primary.main'
                              }
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </>
                ) : (
                  <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
                    <Typography color="text.secondary">No images available</Typography>
                  </Box>
                )}
              </Card>
            )}
          </Grid>

          {/* Product info section */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 4 } }}>
              <Typography 
                variant="h3" 
                gutterBottom 
                sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '2rem', md: '2.5rem' }
                }}
              >
                {product.name}
              </Typography>
              
              <Typography 
                variant="h4" 
                color="primary" 
                gutterBottom 
                sx={{ fontWeight: 600, mb: 3 }}
              >
                {formatCurrency(product.price)}
              </Typography>
              
              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <Box sx={{ my: 2 }}>
                  {product.tags.map((tag: string) => (
                    <Chip 
                      key={tag} 
                      label={tag} 
                      size="small"
                      sx={{ 
                        mr: 1, 
                        mb: 1,
                        bgcolor: 'secondary.light',
                        color: 'secondary.contrastText'
                      }} 
                    />
                  ))}
                </Box>
              )}
              
              <Divider sx={{ my: 3 }} />
              
              {/* Description */}
              <Typography 
                variant="body1" 
                paragraph 
                sx={{ 
                  lineHeight: 1.8,
                  color: 'text.secondary'
                }}
              >
                {product.description}
              </Typography>
              
              {/* Product details grid */}
              <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {t('product.category')}
                  </Typography>
                  {/* Category chips – main and sub (translated) */}
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
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
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {t('product.designer')}
                  </Typography>
                  <Typography variant="body1" fontWeight="500">
                    {product.designer || t('product.defaultDesigner')}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {t('product.stock')}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    fontWeight="500"
                    color={product.stock_quantity > 0 ? 'success.main' : 'error.main'}
                  >
                    {product.stock_quantity > 0 
                      ? `${product.stock_quantity} ${t('product.available')}`
                      : 'Out of Stock'
                    }
                  </Typography>
                </Grid>

                {product._id && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Product ID
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                      {product._id.slice(-8)}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {/* Quantity selector */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                my: 4,
                p: 2,
                bgcolor: 'action.hover',
                borderRadius: 2
              }}>
                <Typography variant="body1" fontWeight="500">
                  {t('product.quantity')}:
                </Typography>
                
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider'
                }}>
                  <IconButton 
                    onClick={decreaseQuantity} 
                    disabled={quantity <= 1}
                    size="small"
                    sx={{ 
                      borderRadius: 0,
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <RemoveIcon />
                  </IconButton>
                  
                  <Typography 
                    sx={{ 
                      minWidth: 40, 
                      textAlign: 'center',
                      fontWeight: 600
                    }}
                  >
                    {quantity}
                  </Typography>
                  
                  <IconButton 
                    onClick={increaseQuantity}
                    disabled={quantity >= product.stock_quantity}
                    size="small"
                    sx={{ 
                      borderRadius: 0,
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  Total: {formatCurrency(product.price * quantity)}
                </Typography>
              </Box>

              {/* Add to cart button */}
              <Button 
                variant="contained" 
                size="large" 
                fullWidth 
                startIcon={<ShoppingCartIcon />} 
                onClick={handleAddToCart} 
                disabled={product.stock_quantity === 0 || savingImages} 
                sx={{ 
                  py: 2,
                  bgcolor: 'black', 
                  '&:hover': { 
                    bgcolor: '#333',
                    transform: 'translateY(-2px)',
                    boxShadow: 4
                  },
                  '&:disabled': {
                    bgcolor: 'action.disabledBackground'
                  },
                  transition: 'all 0.2s'
                }}
              >
                {product.stock_quantity > 0 
                  ? t('product.addToCart') 
                  : t('product.outOfStock')
                }
              </Button>

              {/* Login prompt for non-authenticated users */}
              {!isAuthenticated && (
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  align="center" 
                  sx={{ mt: 3 }}
                >
                  {t('product.loginRequired')}{' '}
                  <Button 
                    component={Link} 
                    to="/login" 
                    size="small"
                    sx={{ textTransform: 'none' }}
                  >
                    {t('auth.login')}
                  </Button>
                </Typography>
              )}

              {/* Admin note */}
              {isAdmin && (
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  align="center" 
                  sx={{ 
                    mt: 2, 
                    display: 'block',
                    fontStyle: 'italic'
                  }}
                >
                  You are in admin mode. You can add, remove, or reorder images using the 3D slider.
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </div>
    </Container>
  );
};

export default ProductDetail;