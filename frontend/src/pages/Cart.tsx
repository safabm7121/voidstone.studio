import React from 'react';
import {
  Container, Typography, Box, Paper, IconButton,
  Button, Grid, Divider, Card
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
const DELIVERY_FEE = 8;

const Cart: React.FC = () => {
  const { t } = useTranslation();
  const { cart, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const { isAuthenticated } = useAuth();

  // Calculate total with delivery
  const totalWithDelivery = cartTotal + (cartTotal > 0 ? DELIVERY_FEE : 0);

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 4, sm: 6, md: 8 }, textAlign: 'center' }}>
        <ShoppingBagIcon sx={{ fontSize: { xs: 60, sm: 70, md: 80 }, color: 'text.disabled', mb: 2 }} />
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
        <ShoppingBagIcon sx={{ fontSize: { xs: 60, sm: 70, md: 80 }, color: 'text.disabled', mb: 2 }} />
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

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header with back button */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: { xs: 2, sm: 3, md: 4 },
        flexWrap: 'wrap',
      }}>
        <IconButton 
          component={Link} 
          to="/products" 
          sx={{ 
            mr: { xs: 1, sm: 2 },
            color: 'text.primary',
            '&:hover': { bgcolor: 'action.hover' }
          }}
        >
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
            {cart.map((item, index) => (
              <Box key={item._id}>
                <Grid container spacing={{ xs: 1, sm: 2 }} alignItems="center">
                  {/* Product Image */}
                  <Grid item xs={3} sm={2} md={2}>
                    <Card sx={{ 
                      borderRadius: 2, 
                      overflow: 'hidden', 
                      height: { xs: 60, sm: 70, md: 80 }, 
                      width: '100%',
                      bgcolor: 'grey.100'
                    }}>
                      {item.imageUrl ? (
                        <Box
                          sx={{
                            position: 'relative',
                            width: '100%',
                            height: '100%',
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            component="img"
                            src={item.imageUrl}
                            alt={item.name}
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                            }}
                          />
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'grey.100',
                            color: 'text.disabled',
                            fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.75rem' }
                          }}
                        >
                          No image
                        </Box>
                      )}
                    </Card>
                  </Grid>

                  {/* Product Details */}
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

                  {/* Quantity Controls */}
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
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          p: { xs: 0.25, sm: 0.5 },
                          color: 'text.primary',
                          '&:hover': { 
                            bgcolor: 'action.hover',
                            borderColor: 'text.primary'
                          }
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
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          p: { xs: 0.25, sm: 0.5 },
                          color: 'text.primary',
                          '&:hover': { 
                            bgcolor: 'action.hover',
                            borderColor: 'text.primary'
                          }
                        }}
                      >
                        <AddIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 } }} />
                      </IconButton>
                    </Box>
                  </Grid>

                  {/* Price and Delete */}
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
                        onClick={() => removeFromCart(item._id)}
                        size="small"
                        sx={{ 
                          p: { xs: 0.25, sm: 0.5 },
                          color: 'error.main',
                          '&:hover': { 
                            bgcolor: 'error.main',
                            color: 'error.contrastText'
                          }
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: { xs: 16, sm: 18, md: 20 } }} />
                      </IconButton>
                    </Box>
                  </Grid>
                </Grid>
                {index < cart.length - 1 && <Divider sx={{ my: { xs: 2, sm: 2.5, md: 3 } }} />}
              </Box>
            ))}

            {/* Cart Actions */}
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
                  width: { xs: '100%', sm: 'auto' },
                  borderColor: 'error.main',
                  color: 'error.main',
                  '&:hover': {
                    borderColor: 'error.dark',
                    bgcolor: 'error.main',
                    color: 'error.contrastText'
                  }
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
                  width: { xs: '100%', sm: 'auto' },
                  color: 'text.primary',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                {t('cart.continueShopping')}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Order Summary */}
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
                bgcolor: 'text.primary',
                color: 'background.paper', 
                '&:hover': { 
                  bgcolor: 'text.secondary' 
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