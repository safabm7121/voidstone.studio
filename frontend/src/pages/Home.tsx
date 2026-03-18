import React, { useEffect, useState, useRef } from 'react';
import { Container, Typography, Box, Button, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { useParallax } from '../hooks/useParallax';
import { productApi } from '../services/api';
import { heroService } from '../services/heroService';
import ThreeDCarousel from '../components/home/ThreeDCarousel';
import ParallaxSection from '../components/common/ParallaxSection';
import HeroMediaUpload from '../components/admin/HeroMediaUpload.tsx';
import EditIcon from '@mui/icons-material/Edit';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
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
  const [heroMedia, setHeroMedia] = useState<any>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [isMuted, setIsMuted] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const { elementRef: heroRef, isVisible: heroVisible } = useIntersectionObserver({ threshold: 0.1 });
  
  // Use parallax for the hero section content
  const heroContentParallaxRef = useParallax(0.2) as React.RefObject<HTMLDivElement>;

  // Check if user is admin
  const isAdmin = isAuthenticated && user?.role === 'admin';

  useEffect(() => {
    fetchFeaturedProducts();
    fetchHeroMedia();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      setFeaturedProducts([]);
    };
  }, []);

  useEffect(() => {
    // Auto-play video when it becomes available
    if (videoRef.current && mediaType === 'video') {
      videoRef.current.muted = isMuted;
      videoRef.current.play().catch(error => {
        console.log('Auto-play prevented:', error);
        // If auto-play fails, we can try again with user interaction
      });
    }
  }, [heroMedia, mediaType, isMuted]);

  const fetchHeroMedia = async () => {
    try {
      const hero = await heroService.getHeroImage();
      if (hero) {
        setHeroMedia(hero);
        
        // Check if it's a video based on imageType
        if (hero.imageType && hero.imageType.startsWith('video/')) {
          setMediaType('video');
        } else {
          setMediaType('image');
        }
      }
    } catch (error) {
      console.error('Error fetching hero media:', error);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      const response = await productApi.get('/products');
      const products = response.data.products || response.data || [];
      // Safe check before slicing
      setFeaturedProducts(Array.isArray(products) ? products.slice(0, 6) : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setFeaturedProducts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    // Refresh the hero media after upload
    fetchHeroMedia();
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  // Helper function to get the media URL (handles both base64 and direct URLs)
  const getMediaUrl = (): string | undefined => {
    if (!heroMedia || !heroMedia.imageData) return undefined;
    
    // If it's a URL (starts with http), use it directly
    if (heroMedia.imageData.startsWith('http')) {
      return heroMedia.imageData;
    }
    
    // Otherwise, it's base64 - construct data URL
    const type = heroMedia.imageType || 'image/jpeg';
    return `data:${type};base64,${heroMedia.imageData}`;
  };

  const mediaUrl = getMediaUrl();

  // Show loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Hero Section with Parallax */}
      <ParallaxSection 
        height="vh-90" 
        speed={0.3} 
        bgImage={!mediaUrl || mediaType === 'video' ? undefined : mediaUrl}
      >
        <Box className="hero-section" ref={heroSectionRef}>
          {/* Background Video for Video Type */}
         {mediaType === 'video' && mediaUrl && (
  <>
    <video
      ref={videoRef}
      src={mediaUrl}
      autoPlay
      loop
      muted={isMuted}
      playsInline
      disablePictureInPicture
      disableRemotePlayback
      className="hero-background-video"
    />
    {/* Mute/Unmute Button for Videos - Positioned inside the frame */}
    <Box className="hero-video-controls">
      <Tooltip title={isMuted ? t('home.unmute') : t('home.mute')}>
        <IconButton
          className="hero-mute-button"
          onClick={toggleMute}
          size="large"
        >
          {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
        </IconButton>
      </Tooltip>
    </Box>
  </>
)}
          <Box className="hero-overlay" />
          
          {/* Admin Edit Button - Only visible to admin */}
          {isAdmin && (
            <Box className="hero-admin-controls">
              <Tooltip title={t('home.editHero')}>
                <IconButton
                  className="hero-edit-button"
                  onClick={() => setUploadDialogOpen(true)}
                  size="large"
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
            </Box>
          )}
          
          <Container maxWidth="lg" className="hero-content">
            {/* Apply parallax effect to the content */}
            <div ref={heroContentParallaxRef}>
              <motion.div
                ref={heroRef}
                initial={{ opacity: 0, y: 30 }}
                animate={heroVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8 }}
              >
                <Typography variant="h1" className="hero-title">
                  {t('home.title')}
                </Typography>
                <Typography variant="h2" className="hero-subtitle">
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
        
        {/* Safe check for featured products */}
        {!loading ? (
          featuredProducts && featuredProducts.length > 0 ? (
            <ThreeDCarousel products={featuredProducts} />
          ) : (
            <Typography variant="body1" sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              No featured products available
            </Typography>
          )
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
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

      {/* Hero Media Upload Dialog */}
      <HeroMediaUpload
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        currentMedia={mediaUrl}
        currentMediaType={heroMedia?.imageType}
        onUploadSuccess={handleUploadSuccess}
      />
    </Box>
  );
};

export default Home;