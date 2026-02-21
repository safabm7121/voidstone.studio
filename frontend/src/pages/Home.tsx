import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { productApi } from '../services/api';
import ThreeDCarousel from '../components/home/ThreeDCarousel';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
}

const Home: React.FC = () => {
  const { t } = useTranslation();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { elementRef: heroRef, isVisible: heroVisible } = useIntersectionObserver({ threshold: 0.1 });

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await productApi.get('/products');
      setFeaturedProducts(response.data.products.slice(0, 6));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          height: '90vh',
          background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)',
          }}
        />
        
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            ref={heroRef}
            initial={{ opacity: 0, y: 30 }}
            animate={heroVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '3rem', md: '5rem' },
                fontWeight: 700,
                letterSpacing: '-0.02em',
                mb: 2,
                background: 'linear-gradient(135deg, #ffffff 0%, #cccccc 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {t('home.title')}
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1.5rem', md: '2rem' },
                fontWeight: 400,
                color: 'rgba(255,255,255,0.7)',
                mb: 4,
                maxWidth: '600px',
              }}
            >
              {t('home.subtitle')}
            </Typography>
            <Button
              component={Link}
              to="/products"
              variant="contained"
              size="large"
              sx={{
                bgcolor: 'white',
                color: 'black',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.9)',
                },
                px: 4,
                py: 1.5,
              }}
            >
              {t('home.explore')}
            </Button>
          </motion.div>
        </Container>
      </Box>

      {/* 3D Carousel Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <Typography
            variant="h3"
            align="center"
            gutterBottom
            sx={{ fontWeight: 600, mb: 6 }}
          >
            {t('home.featured')}
          </Typography>
        </motion.div>
        
        {!loading && featuredProducts.length > 0 && (
          <ThreeDCarousel products={featuredProducts} />
        )}
      </Container>

      {/* Brand Story Section */}
      <Box sx={{ bgcolor: '#f5f5f5', py: 8 }}>
        <Container maxWidth="md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Typography variant="h3" align="center" gutterBottom sx={{ fontWeight: 600 }}>
              {t('home.story')}
            </Typography>
            <Typography variant="body1" align="center" paragraph sx={{ fontSize: '1.2rem', color: '#666' }}>
              {t('home.storyText')}
            </Typography>
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;