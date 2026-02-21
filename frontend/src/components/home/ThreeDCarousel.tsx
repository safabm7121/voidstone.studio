import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, IconButton, Typography, Slider, Switch, 
  FormControlLabel, Paper, Popover 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SettingsIcon from '@mui/icons-material/Settings';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import './ThreeDCarousel.css';

interface Product {
  _id: string;
  name: string;
  images: string[];
  price: number;
  category: string;
}

interface ThreeDCarouselProps {
  products: Product[];
}

const ThreeDCarousel: React.FC<ThreeDCarouselProps> = ({ products }) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [settingsAnchor, setSettingsAnchor] = useState<null | HTMLElement>(null);
  const [rotation, setRotation] = useState(0);
  
  // Settings
  const [rotationSpeed, setRotationSpeed] = useState(8);
  const [orbitRadius, setOrbitRadius] = useState(650);
  const [imageWidth, setImageWidth] = useState(280);
  const [imageHeight, setImageHeight] = useState(200);
  const [borderRadius, setBorderRadius] = useState(16);
  const [pauseOnHover, setPauseOnHover] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const orbitRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  // Calculate number of items to show (12 for perfect circle)
  const itemCount = Math.min(products.length, 12);
  const placeholderCount = Math.max(0, 12 - products.length);

  // Create array of items (products + placeholders)
  const displayItems = [
    ...products.slice(0, itemCount),
    ...Array(placeholderCount).fill(null)
  ];

  // Animation loop for smooth rotation
  useEffect(() => {
    const animate = () => {
      if (!isPaused && !isHovered) {
        setRotation(prev => {
          const increment = 0.1 * (8 / rotationSpeed);
          return (prev + increment) % 360;
        });
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPaused, isHovered, rotationSpeed]);

  // Update currentIndex based on rotation
  useEffect(() => {
    if (displayItems.length === 0) return;
    
    const itemAngle = 360 / displayItems.length;
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    const centerIndex = Math.round(normalizedRotation / itemAngle) % displayItems.length;
    
    setCurrentIndex(centerIndex);
  }, [rotation, displayItems.length]);

  const handlePrev = () => {
    setRotation(prev => prev - (360 / displayItems.length));
  };

  const handleNext = () => {
    setRotation(prev => prev + (360 / displayItems.length));
  };

  const handleProductClick = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchor(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchor(null);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

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

  // Perfect circle with cards facing outward
  const getItemStyle = (index: number) => {
    const totalItems = displayItems.length;
    const angleStep = 360 / totalItems;
    const angle = angleStep * index - rotation; // Subtract rotation to keep items oriented correctly
    
    return {
      transform: `translateX(-50%) translateY(-50%) rotateY(${angle}deg) translateZ(${orbitRadius}px)`,
      width: imageWidth,
      height: imageHeight,
      left: '50%',
      top: '50%',
      position: 'absolute' as const,
      opacity: 1,
      filter: 'none',
    };
  };

  return (
    <Box className="carousel-container">
      {/* 3D Stage with perspective */}
      <Box 
        className="carousel-3d-stage" 
        style={{ 
          perspective: '2500px',
        }}
      >
        <Box
          ref={orbitRef}
          className="carousel-orbit"
          style={{
            transform: `rotateX(-3deg)`, // Slight tilt for better visibility
          }}
          onMouseEnter={() => pauseOnHover && setIsHovered(true)}
          onMouseLeave={() => pauseOnHover && setIsHovered(false)}
        >
          {displayItems.map((item, index) => {
            const style = getItemStyle(index);
            const isCenter = index === currentIndex;
            
            return (
              <Box
                key={item?._id || `placeholder-${index}`}
                className={`carousel-item ${isCenter ? 'center' : ''}`}
                style={style}
                onClick={() => item && handleProductClick(item._id)}
              >
                {item ? (
                  <Box
                    className="carousel-card"
                    style={{ borderRadius: `${borderRadius}px` }}
                  >
                    <img
                      src={item.images[0] || 'https://via.placeholder.com/400x300'}
                      alt={item.name}
                      className="carousel-image"
                      loading="lazy"
                    />
                    <Box className="carousel-overlay">
                      <Typography className="product-name">
                        {item.name}
                      </Typography>
                      <Typography className="product-category">
                        {item.category}
                      </Typography>
                      <Typography className="product-price">
                        {formatPrice(item.price)}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box
                    className="carousel-card carousel-placeholder"
                    style={{ borderRadius: `${borderRadius}px` }}
                  >
                    <Typography>Coming Soon</Typography>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Navigation Buttons */}
      <IconButton
        onClick={handlePrev}
        className="carousel-nav-btn left"
      >
        <ChevronLeftIcon />
      </IconButton>

      <IconButton
        onClick={handleNext}
        className="carousel-nav-btn right"
      >
        <ChevronRightIcon />
      </IconButton>

      {/* Controls */}
      <Box className="carousel-controls">
        <IconButton
          onClick={togglePause}
          className="carousel-control-btn"
          size="small"
        >
          {isPaused ? <PlayArrowIcon /> : <PauseIcon />}
        </IconButton>
        
        <IconButton
          onClick={handleSettingsClick}
          className="carousel-control-btn"
          size="small"
        >
          <SettingsIcon />
        </IconButton>
      </Box>

      {/* Settings Panel */}
      <Popover
        open={Boolean(settingsAnchor)}
        anchorEl={settingsAnchor}
        onClose={handleSettingsClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <Paper className="carousel-settings-panel">
          <Typography className="settings-title">
            Settings
          </Typography>

          {/* Rotation Speed */}
          <Box className="settings-item">
            <Box className="settings-label">
              <span>Speed</span>
              <span>{rotationSpeed}s</span>
            </Box>
            <Slider
              value={rotationSpeed}
              onChange={(_, val) => setRotationSpeed(val as number)}
              min={3}
              max={15}
              step={0.5}
              size="small"
            />
          </Box>

          {/* Orbit Radius */}
          <Box className="settings-item">
            <Box className="settings-label">
              <span>Radius</span>
              <span>{orbitRadius}px</span>
            </Box>
            <Slider
              value={orbitRadius}
              onChange={(_, val) => setOrbitRadius(val as number)}
              min={450}
              max={850}
              step={10}
              size="small"
            />
          </Box>

          {/* Image Width */}
          <Box className="settings-item">
            <Box className="settings-label">
              <span>Width</span>
              <span>{imageWidth}px</span>
            </Box>
            <Slider
              value={imageWidth}
              onChange={(_, val) => setImageWidth(val as number)}
              min={220}
              max={350}
              step={10}
              size="small"
            />
          </Box>

          {/* Image Height */}
          <Box className="settings-item">
            <Box className="settings-label">
              <span>Height</span>
              <span>{imageHeight}px</span>
            </Box>
            <Slider
              value={imageHeight}
              onChange={(_, val) => setImageHeight(val as number)}
              min={150}
              max={260}
              step={10}
              size="small"
            />
          </Box>

          {/* Border Radius */}
          <Box className="settings-item">
            <Box className="settings-label">
              <span>Radius</span>
              <span>{borderRadius}px</span>
            </Box>
            <Slider
              value={borderRadius}
              onChange={(_, val) => setBorderRadius(val as number)}
              min={0}
              max={30}
              step={2}
              size="small"
            />
          </Box>

          {/* Pause on Hover */}
          <FormControlLabel
            control={
              <Switch
                checked={pauseOnHover}
                onChange={(e) => setPauseOnHover(e.target.checked)}
                size="small"
              />
            }
            label="Pause on hover"
          />

          {/* Current item indicator */}
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
            Item {currentIndex + 1} of {displayItems.length}
          </Typography>
        </Paper>
      </Popover>
    </Box>
  );
};

export default ThreeDCarousel;