import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { productApi } from '../services/api';
import ThreeDCarousel from '../components/home/ThreeDCarousel';
import ParallaxSection from '../components/common/ParallaxSection';
import '../styles/animation.css';
import '../styles/parallax.css';
import '../styles/home.css';
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
      {/* Hero Section with Parallax */}
      <ParallaxSection height="vh-90" speed={0.3}>
        <Box className="hero-section">
          <Box className="hero-overlay" />
          
          <Container maxWidth="lg" className="hero-content">
            <motion.div
              ref={heroRef}
              initial={{ opacity: 0, y: 30 }}
              animate={heroVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <Typography
                variant="h1"
                className="hero-title"
              >
                {t('home.title')}
              </Typography>
              <Typography
                variant="h2"
                className="hero-subtitle"
              >
                {t('home.subtitle')}
              </Typography>
              <Button
                component={Link}
                to="/products"
                variant="contained"
                size="large"
                className="hero-button"
              >
                {t('home.explore')}
              </Button>
            </motion.div>
          </Container>
        </Box>
      </ParallaxSection>

      {/* 3D Carousel Section */}
      <Container maxWidth="lg" className="featured-section">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <Typography
            variant="h3"
            className="featured-title"
          >
            {t('home.featured')}
          </Typography>
        </motion.div>
        
        {!loading && featuredProducts.length > 0 && (
          <ThreeDCarousel products={featuredProducts} />
        )}
      </Container>

      {/* Brand Story Section */}
      <Box className="story-section">
        <Container maxWidth="md" className="story-container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Typography variant="h3" className="story-title">
              {t('home.story')}
            </Typography>
            <Typography variant="body1" className="story-text">
              {t('home.storyText')}
            </Typography>
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;