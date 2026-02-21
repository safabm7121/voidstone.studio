import React from 'react';
import {
  Container, Typography, Box, Paper, IconButton,
  Button, Grid, Divider, Card, CardMedia
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

// Format price in Tunisian Dinar
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('tn-TN', {
    style: 'currency',
    currency: 'TND',
    currencyDisplay: 'code',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  }).format(price).replace('TND', 'DT').trim();
};

const Cart: React.FC = () => {
  const { t } = useTranslation();
  const { cart, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <ShoppingBagIcon sx={{ fontSize: 80, color: '#ccc', mb: 2 }} />
        <Typography variant="h4" gutterBottom>{t('auth.login')}</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t('cart.loginRequired')}
        </Typography>
        <Button component={Link} to="/login" variant="contained" size="large">
          {t('auth.login')}
        </Button>
      </Container>
    );
  }

  if (cart.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <ShoppingBagIcon sx={{ fontSize: 80, color: '#ccc', mb: 2 }} />
        <Typography variant="h4" gutterBottom>{t('cart.empty')}</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t('cart.emptyMessage')}
        </Typography>
        <Button component={Link} to="/products" variant="contained" size="large">
          {t('cart.continueShopping')}
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton component={Link} to="/products" sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h3" sx={{ fontWeight: 600 }}>
          {t('cart.title')}
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Cart Items */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3 }}>
            {cart.map((item, index) => (
              <Box key={item._id}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={3} sm={2}>
                    <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
                      <CardMedia
                        component="img"
                        height="80"
                        image={item.images?.[0] || 'https://via.placeholder.com/80x80?text=Product'}
                        alt={item.name}
                        sx={{ objectFit: 'cover' }}
                      />
                    </Card>
                  </Grid>
                  <Grid item xs={9} sm={5}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {item.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatPrice(item.price)} {t('cart.each')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        sx={{ border: '1px solid #ddd', borderRadius: 1 }}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Typography sx={{ minWidth: 30, textAlign: 'center', fontWeight: 500 }}>
                        {item.quantity}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        sx={{ border: '1px solid #ddd', borderRadius: 1 }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Grid>
                  <Grid item xs={4} sm={1}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {formatPrice(item.price * item.quantity)}
                    </Typography>
                  </Grid>
                  <Grid item xs={2} sm={1}>
                    <IconButton
                      color="error"
                      onClick={() => removeFromCart(item._id)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
                {index < cart.length - 1 && <Divider sx={{ my: 3 }} />}
              </Box>
            ))}

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button 
                variant="outlined" 
                color="error" 
                onClick={clearCart}
                startIcon={<DeleteIcon />}
              >
                {t('cart.clearCart')}
              </Button>
              <Button 
                component={Link} 
                to="/products" 
                variant="text"
                startIcon={<ArrowBackIcon />}
              >
                {t('cart.continueShopping')}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Order Summary */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, position: 'sticky', top: 100 }}>
            <Typography variant="h5" gutterBottom fontWeight={600}>
              {t('cart.orderSummary')}
            </Typography>
            
            <Box sx={{ my: 3 }}>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography color="text.secondary">{t('cart.subtotal')} ({cart.length} {t('cart.items')})</Typography>
                <Typography fontWeight={500}>{formatPrice(cartTotal)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography color="text.secondary">{t('cart.shipping')}</Typography>
                <Typography fontWeight={500}>{t('cart.free')}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography color="text.secondary">{t('cart.tax')}</Typography>
                <Typography fontWeight={500}>{t('cart.calculated')}</Typography>
              </Box>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box display="flex" justifyContent="space-between" mb={3}>
              <Typography variant="h6">{t('cart.total')}</Typography>
              <Typography variant="h6" color="primary.main" fontWeight={700}>
                {formatPrice(cartTotal)}
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
                py: 1.5,
                bgcolor: 'black',
                '&:hover': { bgcolor: '#333' }
              }}
            >
              {t('cart.checkout')}
            </Button>
            
            <Typography variant="caption" color="text.secondary" align="center" display="block">
              {t('cart.secureCheckout')}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Cart;