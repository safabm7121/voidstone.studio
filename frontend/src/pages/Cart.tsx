import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Paper, IconButton,
  Button, Grid, Divider, Card, CardMedia, CircularProgress
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { productApi } from '../services/api';

// Format price in Tunisian Dinar
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('tn-TN', {
    style: 'currency',
    currency: 'TND',
    currencyDisplay: 'code',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  }).format(price).replace('TND', 'DT').trim();
};

// Delivery fee constant
const DELIVERY_FEE = 8; // 8 DT

interface CartItemWithImage {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  imageUrl?: string;
  hasImage?: boolean;
}

const Cart: React.FC = () => {
  const { t } = useTranslation();
  const { cart, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [cartItemsWithImages, setCartItemsWithImages] = useState<CartItemWithImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

  // Calculate total with delivery
  const totalWithDelivery = cartTotal + (cartTotal > 0 ? DELIVERY_FEE : 0);

  // Fetch product images for cart items
  useEffect(() => {
    const fetchProductImages = async () => {
      if (cart.length === 0) {
        setCartItemsWithImages([]);
        return;
      }

      setLoadingImages(true);
      try {
        // Create an array of promises to fetch each product
        const productPromises = cart.map(async (item) => {
          try {
            // Try to fetch the full product details to get the image
            const response = await productApi.get(`/products/${item._id}`);
            const product = response.data.product;
            return {
              ...item,
              imageUrl: product.images?.[0] || null,
              hasImage: product.images?.length > 0
            };
          } catch (error) {
            console.error(`Error fetching product ${item._id}:`, error);
            return {
              ...item,
              imageUrl: null,
              hasImage: false
            };
          }
        });

        const itemsWithImages = await Promise.all(productPromises);
        setCartItemsWithImages(itemsWithImages);
      } catch (error) {
        console.error('Error fetching product images:', error);
      } finally {
        setLoadingImages(false);
      }
    };

    fetchProductImages();
  }, [cart]);

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 4, sm: 6, md: 8 }, textAlign: 'center' }}>
        <ShoppingBagIcon sx={{ fontSize: { xs: 60, sm: 70, md: 80 }, color: '#ccc', mb: 2 }} />
        <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
          {t('auth.login')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, px: { xs: 2, sm: 4 } }}>
          {t('cart.loginRequired')}
        </Typography>
        <Button component={Link} to="/login" variant="contained" size="large" sx={{ px: { xs: 3, sm: 4 } }}>
          {t('auth.login')}
        </Button>
      </Container>
    );
  }

  if (cart.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 4, sm: 6, md: 8 }, textAlign: 'center' }}>
        <ShoppingBagIcon sx={{ fontSize: { xs: 60, sm: 70, md: 80 }, color: '#ccc', mb: 2 }} />
        <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
          {t('cart.empty')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, px: { xs: 2, sm: 4 } }}>
          {t('cart.emptyMessage')}
        </Typography>
        <Button component={Link} to="/products" variant="contained" size="large" sx={{ px: { xs: 3, sm: 4 } }}>
          {t('cart.continueShopping')}
        </Button>
      </Container>
    );
  }

  // Determine which items to display (with images or fallback to cart)
  const displayItems = cartItemsWithImages.length > 0 ? cartItemsWithImages : cart;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header with back button */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: { xs: 2, sm: 3, md: 4 },
        flexWrap: 'wrap',
      }}>
        <IconButton component={Link} to="/products" sx={{ mr: { xs: 1, sm: 2 } }}>
          <ArrowBackIcon fontSize={window.innerWidth < 600 ? 'medium' : 'large'} />
        </IconButton>
        <Typography variant="h3" sx={{ 
          fontWeight: 600,
          fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' }
        }}>
          {t('cart.title')}
        </Typography>
      </Box>

      <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
        {/* Cart Items */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={2} sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
            {loadingImages && (
              <Box display="flex" justifyContent="center" py={2}>
                <CircularProgress size={24} />
              </Box>
            )}
            
            {displayItems.map((item, index) => {
              // Safely access imageUrl - check if it exists on the item
              const imageUrl = 'imageUrl' in item ? (item as CartItemWithImage).imageUrl : null;
              const hasImage = 'hasImage' in item ? (item as CartItemWithImage).hasImage : false;
              
              return (
                <Box key={item._id}>
                  <Grid container spacing={{ xs: 1, sm: 2 }} alignItems="center">
                    {/* Product Image - Responsive sizing */}
                    <Grid item xs={3} sm={2} md={2}>
                      <Card sx={{ 
                        borderRadius: 2, 
                        overflow: 'hidden', 
                        height: { xs: 60, sm: 70, md: 80 }, 
                        width: '100%' 
                      }}>
                        {imageUrl ? (
                          <CardMedia
                            component="img"
                            height={window.innerWidth < 600 ? 60 : window.innerWidth < 900 ? 70 : 80}
                            image={imageUrl}
                            alt={item.name}
                            sx={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <Box
                            sx={{
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: '#f5f5f5',
                              color: '#999',
                              fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.75rem' }
                            }}
                          >
                            {hasImage ? 'Loading...' : 'No image'}
                          </Box>
                        )}
                      </Card>
                    </Grid>

                    {/* Product Details - Responsive text */}
                    <Grid item xs={9} sm={5} md={4}>
                      <Typography variant="subtitle1" fontWeight={600} sx={{ 
                        fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: { xs: 180, sm: 250, md: 300 }
                      }}>
                        {item.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' } }}>
                        {formatPrice(item.price)} {t('cart.each')}
                      </Typography>
                      {item.category && (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.75rem' } }}>
                          {item.category}
                        </Typography>
                      )}
                    </Grid>

                    {/* Quantity Controls - Responsive layout */}
                    <Grid item xs={5} sm={3} md={3}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: { xs: 0.5, sm: 0.75, md: 1 },
                        justifyContent: { xs: 'flex-start', sm: 'center' }
                      }}>
                        <IconButton
                          size="small"
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          sx={{ 
                            border: '1px solid #ddd', 
                            borderRadius: 1,
                            p: { xs: 0.25, sm: 0.5 }
                          }}
                        >
                          <RemoveIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 } }} />
                        </IconButton>
                        <Typography sx={{ 
                          minWidth: { xs: 24, sm: 28, md: 30 }, 
                          textAlign: 'center', 
                          fontWeight: 500,
                          fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' }
                        }}>
                          {item.quantity}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          sx={{ 
                            border: '1px solid #ddd', 
                            borderRadius: 1,
                            p: { xs: 0.25, sm: 0.5 }
                          }}
                        >
                          <AddIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 } }} />
                        </IconButton>
                      </Box>
                    </Grid>

                    {/* Price and Delete - Responsive layout */}
                    <Grid item xs={4} sm={1} md={2}>
                      <Typography variant="subtitle1" fontWeight={700} align="right" sx={{ 
                        fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' }
                      }}>
                        {formatPrice(item.price * item.quantity)}
                      </Typography>
                    </Grid>
                    <Grid item xs={3} sm={1} md={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <IconButton
                          color="error"
                          onClick={() => removeFromCart(item._id)}
                          size="small"
                          sx={{ p: { xs: 0.25, sm: 0.5 } }}
                        >
                          <DeleteIcon sx={{ fontSize: { xs: 16, sm: 18, md: 20 } }} />
                        </IconButton>
                      </Box>
                    </Grid>
                  </Grid>
                  {index < cart.length - 1 && <Divider sx={{ my: { xs: 2, sm: 2.5, md: 3 } }} />}
                </Box>
              );
            })}

            {/* Cart Actions - Responsive buttons */}
            <Box sx={{ 
              mt: { xs: 3, sm: 3.5, md: 4 }, 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between', 
              alignItems: 'center',
              gap: { xs: 2, sm: 0 }
            }}>
              <Button 
                variant="outlined" 
                color="error" 
                onClick={clearCart}
                startIcon={<DeleteIcon />}
                fullWidth={window.innerWidth < 600}
                sx={{ 
                  order: { xs: 2, sm: 1 },
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                {t('cart.clearCart')}
              </Button>
              <Button 
                component={Link} 
                to="/products" 
                variant="text"
                startIcon={<ArrowBackIcon />}
                fullWidth={window.innerWidth < 600}
                sx={{ 
                  order: { xs: 1, sm: 2 },
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                {t('cart.continueShopping')}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Order Summary - Responsive sticky positioning */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={2} sx={{ 
            p: { xs: 2, sm: 2.5, md: 3 }, 
            position: { xs: 'relative', lg: 'sticky' }, 
            top: { lg: 100 },
            mb: { xs: 2, lg: 0 }
          }}>
            <Typography variant="h5" gutterBottom fontWeight={600} sx={{ 
              fontSize: { xs: '1.25rem', sm: '1.35rem', md: '1.5rem' }
            }}>
              {t('cart.orderSummary')}
            </Typography>
            
            <Box sx={{ my: { xs: 2, sm: 2.5, md: 3 } }}>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography color="text.secondary" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                  {t('cart.subtotal')} ({cart.length} {t('cart.items')})
                </Typography>
                <Typography fontWeight={500} sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                  {formatPrice(cartTotal)}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography color="text.secondary" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                  {t('cart.shipping')}
                </Typography>
                <Typography fontWeight={500} sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                  {formatPrice(DELIVERY_FEE)}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography color="text.secondary" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                  {t('cart.tax')}
                </Typography>
                <Typography fontWeight={500} sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                  {t('cart.calculated')}
                </Typography>
              </Box>
            </Box>
            
            <Divider sx={{ my: { xs: 1.5, sm: 2 } }} />
            
            <Box display="flex" justifyContent="space-between" mb={3}>
              <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.25rem' } }}>
                {t('cart.total')}
              </Typography>
              <Typography variant="h6" color="primary.main" fontWeight={700} sx={{ 
                fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.25rem' }
              }}>
                {formatPrice(totalWithDelivery)}
              </Typography>
            </Box>
            
           <Button
  component={Link}
  to="/checkout"
  variant="contained"
  fullWidth
  size="large"
  sx={{ 
    mb: 2, 
    py: { xs: 1.2, sm: 1.3, md: 1.5 },
    // This will be black in light mode, white in dark mode
    bgcolor: 'text.primary',
    color: 'background.paper', // This ensures text contrast
    '&:hover': { 
      bgcolor: 'text.secondary' // Adapts to dark mode automatically
    },
    fontSize: { xs: '0.9rem', sm: '1rem' }
  }}
>
  {t('cart.checkout')} ({formatPrice(totalWithDelivery)})
</Button>
            
            <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ 
              fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' }
            }}>
              {t('cart.secureCheckout')}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Cart;