import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Button, IconButton, Tooltip } from '@mui/material';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { useParallax } from '../hooks/useParallax';
import { productApi } from '../services/api';
import { heroService } from '../services/heroService';
import ThreeDCarousel from '../components/home/ThreeDCarousel';
import ParallaxSection from '../components/common/ParallaxSection';
import HeroImageUpload from '../components/admin/HeroImageUpload';
import EditIcon from '@mui/icons-material/Edit';
import { useAuth } from '../context/AuthContext';
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
  const { user, isAuthenticated } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const { elementRef: heroRef, isVisible: heroVisible } = useIntersectionObserver({ threshold: 0.1 });
  
  // Use parallax for the hero section content - cast the ref to HTMLDivElement
  const heroContentParallaxRef = useParallax(0.2) as React.RefObject<HTMLDivElement>;

  // Check if user is admin
  const isAdmin = isAuthenticated && user?.role === 'admin';

  useEffect(() => {
    fetchFeaturedProducts();
    fetchHeroImage();
  }, []);

  const fetchHeroImage = async () => {
    try {
      const hero = await heroService.getHeroImage();
      if (hero && hero.imageData) {
        setHeroImage(hero.imageData);
      }
    } catch (error) {
      console.error('Error fetching hero image:', error);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      const response = await productApi.get('/products');
      const products = response.data.products || response.data;
      setFeaturedProducts(products.slice(0, 6));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (imageData: string) => {
    setHeroImage(imageData);
  };

  return (
    <Box>
      {/* Hero Section with Parallax */}
      <ParallaxSection 
        height="vh-90" 
        speed={0.3} 
        bgImage={heroImage || undefined}
      >
        <Box className="hero-section">
          <Box className="hero-overlay" />
          
          {/* Admin Edit Button - Only visible to admin */}
          {isAdmin && (
            <Tooltip title={t('home.editHero')}>
              <IconButton
                className="hero-edit-button"
                onClick={() => setUploadDialogOpen(true)}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
          
          <Container maxWidth="lg" className="hero-content">
            {/* Apply parallax effect to the content - now properly typed */}
            <div ref={heroContentParallaxRef}>
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
            </div>
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
            <Typography 
              variant="h3" 
              className="story-title"
            >
              {t('home.story')}
            </Typography>
            <Typography 
              variant="body1" 
              className="story-text"
            >
              {t('home.storyText')}
            </Typography>
          </motion.div>
        </Container>
      </Box>

      {/* Hero Image Upload Dialog */}
      <HeroImageUpload
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        currentImage={heroImage || undefined}
        onUploadSuccess={handleUploadSuccess}
      />
    </Box>
  );
};

export default Home;