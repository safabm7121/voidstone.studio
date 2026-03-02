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
  
  // Settings - Portrait orientation & smaller hoop
  const [rotationSpeed, setRotationSpeed] = useState(8);
  const [orbitRadius, setOrbitRadius] = useState(500);
  const [imageWidth, setImageWidth] = useState(200);
  const [imageHeight, setImageHeight] = useState(260);
  const [borderRadius, setBorderRadius] = useState(16);
  const [pauseOnHover, setPauseOnHover] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  // New: Control depth intensity
  const [depthIntensity, setDepthIntensity] = useState(0.3); // 0 = flat, 1 = dramatic

  const orbitRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  const itemCount = Math.min(products.length, 12);
  const placeholderCount = Math.max(0, 12 - products.length);
  const displayItems = [
    ...products.slice(0, itemCount),
    ...Array(placeholderCount).fill(null)
  ];

  // Animation loop
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
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPaused, isHovered, rotationSpeed]);

  // Update current index
  useEffect(() => {
    if (displayItems.length === 0) return;
    const itemAngle = 360 / displayItems.length;
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    const centerIndex = Math.round(normalizedRotation / itemAngle) % displayItems.length;
    setCurrentIndex(centerIndex);
  }, [rotation, displayItems.length]);

  const handlePrev = () => setRotation(prev => prev - (360 / displayItems.length));
  const handleNext = () => setRotation(prev => prev + (360 / displayItems.length));
  const handleProductClick = (productId: string) => navigate(`/products/${productId}`);
  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => setSettingsAnchor(event.currentTarget);
  const handleSettingsClose = () => setSettingsAnchor(null);
  const togglePause = () => setIsPaused(!isPaused);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tn-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(price).replace('TND', 'DT').trim();
  };

  // --- CRITICAL FIX: Dynamic scaling based on Z-position ---
  const getItemStyle = (index: number) => {
    const totalItems = displayItems.length;
    const angleStep = 360 / totalItems;
    const angle = angleStep * index - rotation;
    
    // Convert to radians for math
    const radian = (angle * Math.PI) / 180;
    
    // Calculate Z-position relative to viewer (ranges from -radius to +radius)
    const zPosition = Math.cos(radian) * orbitRadius;
    
    // Scale factor: front cards (positive Z) get larger, back cards (negative Z) get smaller
    // Map zPosition from [-radius, radius] to a scale range
    // Using depthIntensity to control the effect (0.3 = 30% size difference)
    const minScale = 1 - depthIntensity;
    const maxScale = 1 + depthIntensity;
    // Normalize zPosition from -1 to 1, then map to scale range
    const normalizedZ = zPosition / orbitRadius; // Now from -1 to 1
    // Map from [-1, 1] to [minScale, maxScale]
    const scale = ((normalizedZ + 1) / 2) * (maxScale - minScale) + minScale;
    
    // Slight vertical offset for dynamic feel (optional, can be removed)
    const yOffset = Math.sin(radian) * 10;
    
    return {
      transform: `translateX(-50%) translateY(calc(-50% + ${yOffset}px)) rotateY(${angle}deg) translateZ(${orbitRadius}px) scale(${scale})`,
      width: imageWidth,
      height: imageHeight,
      left: '50%',
      top: '50%',
      position: 'absolute' as const,
      opacity: 1,
      filter: 'none',
      // Ensure proper stacking
      zIndex: Math.floor((zPosition + orbitRadius) / 10),
    };
  };

  return (
    <Box className="carousel-container">
      <Box 
        className="carousel-3d-stage" 
        style={{ 
          perspective: '1200px', // Tighter perspective for more drama
        }}
      >
        <Box
          ref={orbitRef}
          className="carousel-orbit"
          style={{
            transform: `rotateX(0deg)`, // More tilt for better visibility
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
                      <Typography className="product-name">{item.name}</Typography>
                      <Typography className="product-category">{item.category}</Typography>
                      <Typography className="product-price">{formatPrice(item.price)}</Typography>
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
      <IconButton onClick={handlePrev} className="carousel-nav-btn left"><ChevronLeftIcon /></IconButton>
      <IconButton onClick={handleNext} className="carousel-nav-btn right"><ChevronRightIcon /></IconButton>

      {/* Controls */}
      <Box className="carousel-controls">
        <IconButton onClick={togglePause} className="carousel-control-btn" size="small">
          {isPaused ? <PlayArrowIcon /> : <PauseIcon />}
        </IconButton>
        <IconButton onClick={handleSettingsClick} className="carousel-control-btn" size="small">
          <SettingsIcon />
        </IconButton>
      </Box>

      {/* Settings Panel - Added Depth Control */}
      <Popover
        open={Boolean(settingsAnchor)}
        anchorEl={settingsAnchor}
        onClose={handleSettingsClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Paper className="carousel-settings-panel">
          <Typography className="settings-title">Settings</Typography>

          <Box className="settings-item">
            <Box className="settings-label"><span>Speed</span><span>{rotationSpeed}s</span></Box>
            <Slider value={rotationSpeed} onChange={(_, val) => setRotationSpeed(val as number)} min={3} max={15} step={0.5} size="small" />
          </Box>

          <Box className="settings-item">
            <Box className="settings-label"><span>Radius</span><span>{orbitRadius}px</span></Box>
            <Slider value={orbitRadius} onChange={(_, val) => setOrbitRadius(val as number)} min={380} max={620} step={10} size="small" />
          </Box>

          {/* NEW: Depth Intensity Slider */}
          <Box className="settings-item">
            <Box className="settings-label"><span>Depth</span><span>{Math.round(depthIntensity * 100)}%</span></Box>
            <Slider 
              value={depthIntensity} 
              onChange={(_, val) => setDepthIntensity(val as number)} 
              min={0.1} 
              max={0.6} 
              step={0.05} 
              size="small" 
            />
          </Box>

          <Box className="settings-item">
            <Box className="settings-label"><span>Width</span><span>{imageWidth}px</span></Box>
            <Slider value={imageWidth} onChange={(_, val) => setImageWidth(val as number)} min={160} max={260} step={10} size="small" />
          </Box>

          <Box className="settings-item">
            <Box className="settings-label"><span>Height</span><span>{imageHeight}px</span></Box>
            <Slider value={imageHeight} onChange={(_, val) => setImageHeight(val as number)} min={200} max={320} step={10} size="small" />
          </Box>

          <Box className="settings-item">
            <Box className="settings-label"><span>Radius</span><span>{borderRadius}px</span></Box>
            <Slider value={borderRadius} onChange={(_, val) => setBorderRadius(val as number)} min={0} max={30} step={2} size="small" />
          </Box>

          <FormControlLabel control={<Switch checked={pauseOnHover} onChange={(e) => setPauseOnHover(e.target.checked)} size="small" />} label="Pause on hover" />

          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
            Item {currentIndex + 1} of {displayItems.length}
          </Typography>
        </Paper>
      </Popover>
    </Box>
  );
};

export default ThreeDCarousel;