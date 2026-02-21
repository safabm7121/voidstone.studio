import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container, Typography, Grid, Card, CardMedia, Box, Chip, Button, CircularProgress,
  Divider, Paper, IconButton
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

const ProductDetail: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { elementRef, isVisible } = useIntersectionObserver({ threshold: 0.1 });
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await productApi.get(`/products/${id}`);
      setProduct(response.data.product);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (product) {
      addToCart(product, quantity);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;
  if (!product) return (
    <Container>
      <Typography variant="h4">{t('product.notFound')}</Typography>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/products')}>{t('common.back')}</Button>
    </Container>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <div ref={elementRef} className={`fade-blur ${isVisible ? 'visible' : ''}`}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/products')} sx={{ mb: 2 }}>
          {t('common.back')}
        </Button>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card>
              {product.images.length > 0 && (
                <>
                  <CardMedia component="img" height="400" image={product.images[selectedImage]} alt={product.name} sx={{ objectFit: 'cover' }} />
                  {product.images.length > 1 && (
                    <Box sx={{ display: 'flex', gap: 1, p: 2, overflowX: 'auto' }}>
                      {product.images.map((img: string, idx: number) => (
                        <Box key={idx} onClick={() => setSelectedImage(idx)} sx={{
                          width: 80, height: 80,
                          border: selectedImage === idx ? '2px solid black' : '1px solid #ddd',
                          cursor: 'pointer',
                          backgroundImage: `url(${img})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }} />
                      ))}
                    </Box>
                  )}
                </>
              )}
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 3 }}>
              <Typography variant="h3" gutterBottom>{product.name}</Typography>
              <Typography variant="h4" color="primary" gutterBottom>${product.price}</Typography>
              <Box sx={{ my: 2 }}>{product.tags.map((tag: string) => <Chip key={tag} label={tag} sx={{ mr: 1, mb: 1 }} />)}</Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body1" paragraph>{product.description}</Typography>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={6}><Typography variant="subtitle2" color="text.secondary">{t('product.category')}</Typography><Typography variant="body1">{product.category}</Typography></Grid>
                <Grid item xs={6}><Typography variant="subtitle2" color="text.secondary">{t('product.designer')}</Typography><Typography variant="body1">{product.designer || t('product.defaultDesigner')}</Typography></Grid>
                <Grid item xs={6}><Typography variant="subtitle2" color="text.secondary">{t('product.stock')}</Typography><Typography variant="body1">{product.stock_quantity} {t('product.available')}</Typography></Grid>
              </Grid>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 3 }}>
                <Typography>{t('product.quantity')}:</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton onClick={() => setQuantity(Math.max(1, quantity - 1))} size="small" sx={{ border: '1px solid #ddd', borderRadius: 1 }}>
                    <RemoveIcon />
                  </IconButton>
                  <Typography sx={{ minWidth: 30, textAlign: 'center' }}>{quantity}</Typography>
                  <IconButton onClick={() => setQuantity(quantity + 1)} size="small" sx={{ border: '1px solid #ddd', borderRadius: 1 }}>
                    <AddIcon />
                  </IconButton>
                </Box>
              </Box>

              <Button variant="contained" size="large" fullWidth startIcon={<ShoppingCartIcon />} onClick={handleAddToCart} disabled={product.stock_quantity === 0} sx={{ mt: 2 }}>
                {product.stock_quantity > 0 ? t('product.addToCart') : t('product.outOfStock')}
              </Button>

              {!isAuthenticated && (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                  {t('product.loginRequired')} <Button component={Link} to="/login" size="small">{t('auth.login')}</Button>
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