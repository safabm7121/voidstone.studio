import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, IconButton, Box, CircularProgress } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

import { getTheme } from './theme';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import PrivateRoute from './components/auth/PrivateRoute';
import Layout from './components/layout/Layout';

// Lazy load pages
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const VerifyEmail = React.lazy(() => import('./pages/VerifyEmail'));
const Home = React.lazy(() => import('./pages/Home'));
const Products = React.lazy(() => import('./pages/Products'));
const ProductDetail = React.lazy(() => import('./pages/ProductDetail'));
const CreateProduct = React.lazy(() => import('./pages/CreateProduct'));
const About = React.lazy(() => import('./pages/About'));
const Contact = React.lazy(() => import('./pages/Contact'));
const Cart = React.lazy(() => import('./pages/Cart'));
const Checkout = React.lazy(() => import('./pages/Checkout'));
const BookAppointment = React.lazy(() => import('./pages/BookAppointment'));
const MyAppointments = React.lazy(() => import('./pages/MyAppointments'));
const AdminAppointments = React.lazy(() => import('./pages/AdminAppointments'));
const Profile = React.lazy(() => import('./pages/Profile'));

// Styles
import './i18n';
import './styles/theme.css';
import './styles/global.css';
import './styles/animation.css';
import './styles/parallax.css';
import './styles/home.css';
import './styles/profile.css';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const { i18n } = useTranslation();
  const [direction, setDirection] = useState<'ltr' | 'rtl'>(
    i18n.language === 'ar' ? 'rtl' : 'ltr'
  );
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('themeMode');
    return (saved as 'light' | 'dark') || 'light';
  });

  // Update direction when language changes
  useEffect(() => {
    const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    setDirection(dir);
    document.dir = dir;
    document.documentElement.lang = i18n.language;
    localStorage.setItem('language', i18n.language);
    localStorage.setItem('direction', dir);

    // Add/remove RTL class
    if (dir === 'rtl') {
      document.documentElement.classList.add('rtl');
      document.documentElement.classList.remove('ltr');
    } else {
      document.documentElement.classList.add('ltr');
      document.documentElement.classList.remove('rtl');
    }
  }, [i18n.language]);

  // Apply theme mode to root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const toggleTheme = () => setMode(prev => (prev === 'light' ? 'dark' : 'light'));

  return (
    <ThemeProvider theme={getTheme(direction, i18n.language, mode)}>
      <CssBaseline />
      <ToastContainer
        position={direction === 'rtl' ? 'top-left' : 'top-right'}
        rtl={direction === 'rtl'}
        autoClose={3000}
        theme={mode}
      />
      <AuthProvider>
        <CartProvider>
          <Router>
            <Suspense fallback={
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
              </Box>
            }>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<VerifyEmail />} />

                {/* Protected routes with Layout */}
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="products" element={<Products />} />
                  <Route path="products/:id" element={<ProductDetail />} />
                  <Route path="cart" element={<Cart />} />
                  <Route path="checkout" element={<Checkout />} />
                  <Route path="about" element={<About />} />
                  <Route path="contact" element={<Contact />} />

                  {/* Appointment routes */}
                  <Route
                    path="book-appointment"
                    element={
                      <PrivateRoute>
                        <BookAppointment />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="appointments"
                    element={
                      <PrivateRoute>
                        <MyAppointments />
                      </PrivateRoute>
                    }
                  />

                  {/* Admin only routes */}
                  <Route
                    path="admin/appointments"
                    element={
                      <PrivateRoute roles={['admin']}>
                        <AdminAppointments />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="profile"
                    element={
                      <PrivateRoute>
                        <Profile />
                      </PrivateRoute>
                    }
                  />

                  {/* Product creation - admin/manager/designer only */}
                  <Route
                    path="create-product"
                    element={
                      <PrivateRoute roles={['admin', 'manager', 'designer']}>
                        <CreateProduct />
                      </PrivateRoute>
                    }
                  />
                </Route>
              </Routes>
            </Suspense>
          </Router>
        </CartProvider>
      </AuthProvider>

      {/* Theme Toggle Button - responsive positioning */}
      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: 16, sm: 24 },
          right: { xs: 16, sm: 24 },
          zIndex: 9999,
        }}
      >
        <IconButton
          onClick={toggleTheme}
          color="inherit"
          sx={{
            bgcolor: 'background.paper',
            boxShadow: 3,
            '&:hover': { bgcolor: 'action.hover' },
            width: { xs: 40, sm: 48 },
            height: { xs: 40, sm: 48 },
          }}
        >
          {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
        </IconButton>
      </Box>
    </ThemeProvider>
  );
}

export default App;