import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Paper, Stepper, Step, StepLabel,
  Grid, TextField, Button, Divider, Card, CardMedia, RadioGroup,
  FormControlLabel, Radio, CircularProgress, InputLabel, FormControl, Select, MenuItem
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { sendOrderEmails, generateOrderId } from '../services/orderService';
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

// Delivery fee constant (must match Cart.tsx)
const DELIVERY_FEE = 8;

const steps = ['shippingInfo', 'paymentMethod', 'reviewOrder'];

interface CartItemWithImage {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  imageUrl?: string;
}

const Checkout: React.FC = () => {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [cartItemsWithImages, setCartItemsWithImages] = useState<CartItemWithImage[]>([]);
  const { cart, cartTotal, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Calculate total with delivery
  const totalWithDelivery = cartTotal + DELIVERY_FEE;

  const [shippingInfo, setShippingInfo] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    address: '',
    city: '',
    zipCode: '',
    country: 'TN'
  });

  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery'); // Default to cash on delivery

  // Fetch product images for cart items
  useEffect(() => {
    const fetchProductImages = async () => {
      if (cart.length === 0) return;

      setLoadingImages(true);
      try {
        const productPromises = cart.map(async (item) => {
          try {
            const response = await productApi.get(`/products/${item._id}`);
            const product = response.data.product;
            return {
              ...item,
              imageUrl: product.images?.[0] || null
            };
          } catch (error) {
            console.error(`Error fetching product ${item._id}:`, error);
            return {
              ...item,
              imageUrl: null
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

    if (activeStep === 2) { // Only fetch images when reaching review step
      fetchProductImages();
    }
  }, [activeStep, cart]);

  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingInfo({
      ...shippingInfo,
      [e.target.name]: e.target.value
    });
  };

  const handleCountryChange = (e: any) => {
    setShippingInfo({
      ...shippingInfo,
      country: e.target.value
    });
  };

  const handleNext = () => {
    // Validate shipping info on step 0
    if (activeStep === 0) {
      if (!shippingInfo.firstName || !shippingInfo.lastName || !shippingInfo.email || !shippingInfo.address || !shippingInfo.city || !shippingInfo.zipCode) {
        toast.error('Please fill in all shipping information');
        return;
      }
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    
    try {
      const orderId = generateOrderId();
      const orderData = {
        items: cartItemsWithImages.length > 0 ? cartItemsWithImages : cart,
        shippingInfo: {
          ...shippingInfo,
          paymentMethod
        },
        cartTotal: totalWithDelivery, // Send total with delivery
        subtotal: cartTotal, // Also send subtotal separately
        deliveryFee: DELIVERY_FEE,
        orderId,
        orderDate: new Date().toISOString()
      };

      await sendOrderEmails(orderData);
      toast.success(t('checkout.orderSuccess'));
      clearCart();
      setOrderPlaced(true);
    } catch (error) {
      console.error('Order placement error:', error);
      toast.error(t('checkout.orderError'));
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>{t('auth.login')}</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t('checkout.loginRequired')}
        </Typography>
        <Button component={Link} to="/login" variant="contained" size="large">
          {t('auth.login')}
        </Button>
      </Container>
    );
  }

  if (cart.length === 0 && !orderPlaced) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>{t('cart.empty')}</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t('checkout.emptyCart')}
        </Typography>
        <Button component={Link} to="/products" variant="contained" size="large">
          {t('cart.continueShopping')}
        </Button>
      </Container>
    );
  }

  if (orderPlaced) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" gutterBottom sx={{ color: 'success.main' }}>
            ✓ {t('checkout.orderPlaced')}
          </Typography>
          <Typography variant="h5" gutterBottom>
            {t('checkout.thankYou')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            {t('checkout.confirmationEmail')}
          </Typography>
        </Box>
        <Button component={Link} to="/products" variant="contained" size="large" sx={{ mr: 2 }}>
          {t('cart.continueShopping')}
        </Button>
        <Button component={Link} to="/" variant="outlined" size="large">
          {t('nav.home')}
        </Button>
      </Container>
    );
  }

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField required fullWidth name="firstName" label={t('checkout.firstName')} value={shippingInfo.firstName} onChange={handleShippingChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField required fullWidth name="lastName" label={t('checkout.lastName')} value={shippingInfo.lastName} onChange={handleShippingChange} />
            </Grid>
            <Grid item xs={12}>
              <TextField required fullWidth name="email" label={t('checkout.email')} type="email" value={shippingInfo.email} onChange={handleShippingChange} />
            </Grid>
            <Grid item xs={12}>
              <TextField required fullWidth name="address" label={t('checkout.address')} value={shippingInfo.address} onChange={handleShippingChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField required fullWidth name="city" label={t('checkout.city')} value={shippingInfo.city} onChange={handleShippingChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField required fullWidth name="zipCode" label={t('checkout.postalCode')} value={shippingInfo.zipCode} onChange={handleShippingChange} />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel id="country-label">{t('checkout.country')}</InputLabel>
                <Select labelId="country-label" value={shippingInfo.country} label={t('checkout.country')} onChange={handleCountryChange}>
                  <MenuItem value="TN">🇹🇳 {t('countries.tunisia')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>{t('checkout.paymentMethod')}</Typography>
            <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <FormControlLabel value="cash_on_delivery" control={<Radio />} label={`💵 ${t('checkout.cod')}`} />
            </RadioGroup>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>{t('checkout.reviewOrder')}</Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              {loadingImages ? (
                <Box display="flex" justifyContent="center" py={2}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                (cartItemsWithImages.length > 0 ? cartItemsWithImages : cart).map((item, index) => {
                  const imageUrl = 'imageUrl' in item ? (item as CartItemWithImage).imageUrl : null;
                  
                  return (
                    <Box key={item._id}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={2}>
                          <Card sx={{ height: 50, width: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {imageUrl ? (
                              <CardMedia
                                component="img"
                                height="50"
                                width="50"
                                image={imageUrl}
                                alt={item.name}
                                sx={{ objectFit: 'cover' }}
                              />
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                {t('product.noImage') || 'No image'}
                              </Typography>
                            )}
                          </Card>
                        </Grid>
                        <Grid item xs={5}>
                          <Typography variant="body2">{item.name}</Typography>
                        </Grid>
                        <Grid item xs={2}>
                          <Typography variant="body2">{t('cart.quantity')} {item.quantity}</Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="body2" fontWeight={600}>
                            {formatPrice(item.price * item.quantity)}
                          </Typography>
                        </Grid>
                      </Grid>
                      {index < cart.length - 1 && <Divider sx={{ my: 2 }} />}
                    </Box>
                  );
                })
              )}
            </Paper>
            
            {/* Subtotal and Delivery */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">{t('cart.subtotal')}</Typography>
                <Typography variant="body2" fontWeight={500}>{formatPrice(cartTotal)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">{t('cart.shipping')}</Typography>
                <Typography variant="body2" fontWeight={500}>{formatPrice(DELIVERY_FEE)}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="subtitle1" fontWeight={600}>{t('cart.total')}</Typography>
                <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                  {formatPrice(totalWithDelivery)}
                </Typography>
              </Box>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight={600}> {t('checkout.shippingInfo')}</Typography>
              <Typography variant="body2">{shippingInfo.firstName} {shippingInfo.lastName}</Typography>
              <Typography variant="body2">{shippingInfo.address}</Typography>
              <Typography variant="body2">{shippingInfo.city}, {shippingInfo.zipCode}</Typography>
              <Typography variant="body2">{shippingInfo.country === 'TN' ? 'Tunisia' : shippingInfo.country}</Typography>
            </Paper>
          </Box>
        );
      default: return '';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/cart')} sx={{ mb: 3 }}>
        {t('checkout.backToCart')}
      </Button>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">{t('checkout.title')}</Typography>
        <Stepper activeStep={activeStep} sx={{ my: 4 }}>
          {steps.map((label) => <Step key={label}><StepLabel>{t(`checkout.${label}`)}</StepLabel></Step>)}
        </Stepper>
        <Box sx={{ mt: 4, mb: 2 }}>{getStepContent(activeStep)}</Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button onClick={handleBack} disabled={activeStep === 0}>{t('checkout.back')}</Button>
          {activeStep === steps.length - 1 ? (
            <Button variant="contained" onClick={handlePlaceOrder} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : ` ${t('checkout.placeOrder')} (${formatPrice(totalWithDelivery)})`}
            </Button>
          ) : (
            <Button variant="contained" onClick={handleNext}>{t('checkout.continue')}</Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default Checkout;