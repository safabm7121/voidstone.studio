import  { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import 'react-toastify/dist/ReactToastify.css';
import { getTheme } from './theme';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import PrivateRoute from './components/auth/PrivateRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import CreateProduct from './pages/CreateProduct';
import About from './pages/About';
import Contact from './pages/Contact';
import Cart from './pages/Cart'; 
import Checkout from './pages/Checkout';
import './i18n';


function App() {
  const { i18n } = useTranslation();
  const [direction, setDirection] = useState<'ltr' | 'rtl'>(
    i18n.language === 'ar' ? 'rtl' : 'ltr'
  );

  useEffect(() => {
    setDirection(i18n.language === 'ar' ? 'rtl' : 'ltr');
    document.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('language', i18n.language);
  }, [i18n.language]);

  return (
    <ThemeProvider theme={getTheme(direction)}>
      <CssBaseline />
      <ToastContainer position="top-right" autoClose={3000} rtl={direction === 'rtl'} />
      <AuthProvider>
        <CartProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="products" element={<Products />} />
                <Route path="products/:id" element={<ProductDetail />} />
                <Route path="cart" element={<Cart />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="create-product" element={
                  <PrivateRoute roles={['admin', 'manager', 'designer']}>
                    <CreateProduct />
                  </PrivateRoute>
                } />
                <Route path="about" element={<About />} />
                <Route path="contact" element={<Contact />} />
              </Route>
            </Routes>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;