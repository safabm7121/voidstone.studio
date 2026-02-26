import React, { useState, useEffect, Suspense, useRef } from 'react';
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
import { MouseTracker } from './components/common/MouseTracker';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
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
// Styles
import './i18n';
import './styles/theme.css';
import './styles/animation.css';
import './styles/parallax.css';
import './styles/home.css';
import './styles/profile.css';
import 'react-toastify/dist/ReactToastify.css';
import './styles/global.css';  

function App() {
  const { i18n } = useTranslation();
  const [direction, setDirection] = useState<'ltr' | 'rtl'>(
    i18n.language === 'ar' ? 'rtl' : 'ltr'
  );
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('themeMode');
    return (saved as 'light' | 'dark') || 'light';
  });
  
  // Track if mouse has moved to show effects
  const [mouseMoved, setMouseMoved] = useState(false);
  const mouseMoveTimer = useRef<NodeJS.Timeout>();

  // Mouse tracking for CSS variables - KEEP THIS HERE
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      
      // Set mouse position as percentage (0-1)
      document.documentElement.style.setProperty('--mouse-x', x.toString());
      document.documentElement.style.setProperty('--mouse-y', y.toString());
      
      // Set mouse position as offset from center (-0.5 to 0.5)
      document.documentElement.style.setProperty('--mouse-x-percent', (x - 0.5).toString());
      document.documentElement.style.setProperty('--mouse-y-percent', (y - 0.5).toString());
      
      // Set pixel-based position for gradients
      document.documentElement.style.setProperty('--mouse-x-px', e.clientX + 'px');
      document.documentElement.style.setProperty('--mouse-y-px', e.clientY + 'px');
      
      // Add class to body to show mouse effects
      if (!mouseMoved) {
        setMouseMoved(true);
        document.body.classList.add('mouse-moved');
      }
      
      // Reset timer to hide effects after mouse stops
      if (mouseMoveTimer.current) {
        clearTimeout(mouseMoveTimer.current);
      }
      
      mouseMoveTimer.current = setTimeout(() => {
        document.body.classList.remove('mouse-moved');
        setMouseMoved(false);
      }, 1000);
    };

    // Scroll tracking for scroll-based animations
    const handleScroll = () => {
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      document.documentElement.style.setProperty('--scroll-percent', scrollPercent.toString());
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      if (mouseMoveTimer.current) {
        clearTimeout(mouseMoveTimer.current);
      }
    };
  }, [mouseMoved]); // Keep the dependency

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
            {/* MouseTracker is now just a wrapper - actual tracking is in App.tsx */}
            <MouseTracker>
              {/* Mouse glow element */}
              <div className={`mouse-glow ${mouseMoved ? 'visible' : ''}`} />
              
              <Suspense fallback={
                <Box 
                  display="flex" 
                  justifyContent="center" 
                  alignItems="center" 
                  minHeight="100vh"
                  className="animate-fade-in"
                >
                  <CircularProgress size={60} thickness={4} />
                </Box>
              }>
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password" element={<ResetPassword />} />

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
            </MouseTracker>
          </Router>
        </CartProvider>
      </AuthProvider>

      {/* Theme Toggle Button */}
      <Box
        className="theme-toggle-button"
        sx={{
          position: 'fixed',
          bottom: { xs: 16, sm: 24 },
          right: { xs: 16, sm: 24 },
          zIndex: 9990,
          animation: 'float 3s ease-in-out infinite',
        }}
      >
        <IconButton
          onClick={toggleTheme}
          color="inherit"
          className="btn-hover"
          sx={{
            bgcolor: 'background.paper',
            boxShadow: 3,
            '&:hover': { 
              bgcolor: 'action.hover',
              transform: 'rotate(180deg)',
            },
            width: { xs: 40, sm: 48 },
            height: { xs: 40, sm: 48 },
            transition: 'all 0.3s ease',
          }}
        >
          {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
        </IconButton>
      </Box>
    </ThemeProvider>
  );
}

export default App;