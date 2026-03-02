import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, IconButton, Slider, Typography, Switch, FormControlLabel,
  Paper, Popover, Tooltip, Badge, CircularProgress, useTheme, useMediaQuery,
  Button
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SettingsIcon from '@mui/icons-material/Settings';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import ReorderIcon from '@mui/icons-material/Reorder';
import { toast } from 'react-toastify';
import './ImageSlider.css';

interface ImageSliderProps {
  images: string[];
  productName: string;
  onImagesChange?: (images: string[]) => void;
  isEditable?: boolean;
}

// Image compression utility (unchanged)
const compressImage = async (base64String: string, maxWidth = 2000, maxHeight = 2000, quality = 0.9): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64String;
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      
      const format = base64String.includes('image/png') ? 'image/png' : 
                     base64String.includes('image/webp') ? 'image/webp' : 
                     'image/jpeg';
      
      const compressed = canvas.toDataURL(format, quality);
      resolve(compressed);
    };
    
    img.onerror = (error) => {
      reject(error);
    };
  });
};

// File size formatter
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const ImageSlider: React.FC<ImageSliderProps> = ({ 
  images, 
  productName, 
  onImagesChange,
  isEditable = false 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const getResponsiveWidth = () => {
    if (isMobile) return window.innerWidth - 40;
    if (isTablet) return 550;
    return 650;
  };
  
  const getResponsiveHeight = () => {
    if (isMobile) return 350;
    if (isTablet) return 400;
    return 450;
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [settingsAnchor, setSettingsAnchor] = useState<null | HTMLElement>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState(5);
  const [zDepth, setZDepth] = useState(200);
  const [imageWidth, setImageWidth] = useState(getResponsiveWidth());
  const [imageHeight, setImageHeight] = useState(getResponsiveHeight());
  const [borderRadius, setBorderRadius] = useState(16);
  const [backfaceVisible, setBackfaceVisible] = useState(true);
  const [pauseOnHover] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [showPlaceholders] = useState(false);
  const [localImages, setLocalImages] = useState<string[]>(images);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const sliderRef = useRef<HTMLDivElement>(null);
  const autoRotateRef = useRef<NodeJS.Timeout>();

  // Update dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      setImageWidth(getResponsiveWidth());
      setImageHeight(getResponsiveHeight());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile, isTablet]);

  // Update local images when prop changes
  useEffect(() => {
    setLocalImages(images);
    setCurrentIndex(0);
  }, [images]);

  // Auto-rotate effect
  useEffect(() => {
    if (autoRotate && !isPaused && !isHovered && localImages.length > 1) {
      autoRotateRef.current = setInterval(() => {
        handleNext();
      }, rotationSpeed * 1000);
    }
    return () => {
      if (autoRotateRef.current) clearInterval(autoRotateRef.current);
    };
  }, [autoRotate, isPaused, isHovered, rotationSpeed, localImages.length]);

  const handleNext = useCallback(() => {
    if (localImages.length === 0) return;
    console.log('Next clicked, current index:', currentIndex);
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % localImages.length);
  }, [localImages.length, currentIndex]);

  const handlePrev = useCallback(() => {
    if (localImages.length === 0) return;
    console.log('Prev clicked, current index:', currentIndex);
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + localImages.length) % localImages.length);
  }, [localImages.length, currentIndex]);

  // Simple direct handlers without preventDefault to avoid passive listener issues
  const handlePrevClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    console.log('Prev button touched/clicked');
    handlePrev();
  }, [handlePrev]);

  const handleNextClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    console.log('Next button touched/clicked');
    handleNext();
  }, [handleNext]);

  const handleDragStart = (e: React.MouseEvent) => {
    if (isMobile) return;
    setIsDragging(true);
    setDragStartX(e.clientX);
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging || isMobile) return;
    const diff = e.clientX - dragStartX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handlePrev();
      } else {
        handleNext();
      }
      setIsDragging(false);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Touch handlers for swipe - without preventDefault
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const isSwiping = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    isSwiping.current = true;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping.current) return;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!isSwiping.current) return;
    
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    
    isSwiping.current = false;
  };

  const handleAddImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;
      
      setIsProcessing(true);
      
      try {
        const compressedImages = await Promise.all(
          Array.from(files).map(async (file) => {
            if (file.size > 15 * 1024 * 1024) {
              toast.warning(`${file.name} is ${formatFileSize(file.size)}. It will be compressed.`);
            }
            return new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = async () => {
                try {
                  const compressed = await compressImage(
                    reader.result as string,
                    2000,
                    2000,
                    0.9
                  );
                  resolve(compressed);
                } catch (error) {
                  reject(error);
                }
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
          })
        );
        
        const newImages = [...localImages, ...compressedImages];
        setLocalImages(newImages);
        onImagesChange?.(newImages);
        toast.success(`${compressedImages.length} image${compressedImages.length > 1 ? 's' : ''} added`);
      } catch (error) {
        console.error('Error processing images:', error);
        toast.error('Failed to process images');
      } finally {
        setIsProcessing(false);
      }
    };
    input.click();
  };

  const handleRemoveImage = (index: number) => {
    const newImages = localImages.filter((_, i) => i !== index);
    setLocalImages(newImages);
    if (currentIndex >= newImages.length) {
      setCurrentIndex(Math.max(0, newImages.length - 1));
    }
    onImagesChange?.(newImages);
    toast.success('Image deleted successfully');
  };

  const handleReorderImages = (fromIndex: number, toIndex: number) => {
    const newImages = [...localImages];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    setLocalImages(newImages);
    onImagesChange?.(newImages);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
      rotateY: direction > 0 ? 45 : -45,
      z: -zDepth,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
      z: 0,
      transition: {
        duration: 0.5,
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
      rotateY: direction < 0 ? 45 : -45,
      z: -zDepth,
      transition: {
        duration: 0.5,
      },
    }),
  };

  const placeholderCount = Math.max(0, 6 - localImages.length);

  // Settings popover content
  const settingsContent = (
    <Paper className="slider-settings-paper">
      <Typography variant="h6" className="slider-settings-title">
        Slider Settings
      </Typography>
      
      <FormControlLabel
        control={<Switch checked={autoRotate} onChange={(e) => setAutoRotate(e.target.checked)} />}
        label="Auto Rotate"
      />
      
      {autoRotate && (
        <Box className="slider-speed-control">
          <Typography gutterBottom>Rotation Speed: {rotationSpeed}s</Typography>
          <Slider
            value={rotationSpeed}
            onChange={(_, val) => setRotationSpeed(val as number)}
            min={2}
            max={10}
            step={0.5}
            marks={[
              { value: 2, label: 'Fast' },
              { value: 5, label: 'Normal' },
              { value: 10, label: 'Slow' },
            ]}
          />
        </Box>
      )}
      
      <Box className="slider-depth-control">
        <Typography gutterBottom>Z-Depth: {zDepth}px</Typography>
        <Slider
          value={zDepth}
          onChange={(_, val) => setZDepth(val as number)}
          min={0}
          max={500}
          step={10}
        />
      </Box>
      
      <Box className="slider-radius-control">
        <Typography gutterBottom>Border Radius: {borderRadius}px</Typography>
        <Slider
          value={borderRadius}
          onChange={(_, val) => setBorderRadius(val as number)}
          min={0}
          max={50}
          step={1}
        />
      </Box>
      
      <FormControlLabel
        control={<Switch checked={backfaceVisible} onChange={(e) => setBackfaceVisible(e.target.checked)} />}
        label="Backface Visibility"
      />
    </Paper>
  );

  return (
    <Box className="slider-container">
      {/* Processing Indicator */}
      {isProcessing && (
        <Box className="slider-processing">
          <CircularProgress color="primary" />
          <Typography color="white">Processing images...</Typography>
        </Box>
      )}

      {/* Settings Button - Left side */}
      <Box className="slider-settings-button slider-settings-left">
        <Tooltip title="Slider Settings">
          <IconButton onClick={(e) => setSettingsAnchor(e.currentTarget)}>
            <SettingsIcon />
          </IconButton>
        </Tooltip>
        
        <Popover
          open={Boolean(settingsAnchor)}
          anchorEl={settingsAnchor}
          onClose={() => setSettingsAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          {settingsContent}
        </Popover>
      </Box>

      {/* Play/Pause Button */}
      {autoRotate && localImages.length > 1 && (
        <Box className="slider-play-pause slider-play-pause-shifted">
          <Tooltip title={isPaused ? "Play" : "Pause"}>
            <IconButton onClick={() => setIsPaused(!isPaused)}>
              {isPaused ? <PlayArrowIcon /> : <PauseIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Add Image Button */}
      {isEditable && (
        <Box className="slider-add-image">
          <Tooltip title="Add Images">
            <IconButton onClick={handleAddImage} disabled={isProcessing}>
              <AddPhotoAlternateIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Main Slider */}
      <Box 
        ref={sliderRef}
        className={`slider-main ${isDragging ? 'dragging' : ''}`}
        style={{ height: imageHeight }}
        onMouseEnter={() => pauseOnHover && setIsHovered(true)}
        onMouseLeave={() => {
          if (pauseOnHover) setIsHovered(false);
          handleDragEnd();
        }}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => { isSwiping.current = false; }}
      >
        {/* Main Image with Animation */}
        <AnimatePresence initial={false} custom={direction} mode="wait">
          {localImages.length > 0 ? (
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              className="slider-image-container"
              style={{
                width: imageWidth,
                height: imageHeight,
                backfaceVisibility: backfaceVisible ? 'visible' : 'hidden' as any,
                pointerEvents: 'none',
              }}
            >
              <Box
                className="slider-image-box"
                style={{ borderRadius }}
              >
                <img
                  src={localImages[currentIndex]}
                  alt={`${productName} - Image ${currentIndex + 1}`}
                  className="slider-image-contain"
                />
                
                {/* Image Index Badge */}
                <Badge
                  badgeContent={`${currentIndex + 1}/${localImages.length}`}
                  color="primary"
                  className="slider-image-badge"
                />

                {/* Delete Button on Main Image - Bottom Right */}
                {isEditable && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(currentIndex);
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(currentIndex);
                    }}
                    className="slider-delete-button slider-delete-bottom-right"
                    sx={{ pointerEvents: 'auto' }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </motion.div>
          ) : (
            <Box
              className="slider-no-image"
              style={{
                width: imageWidth,
                height: imageHeight,
                borderRadius,
              }}
            >
              <Typography color="text.secondary">No images available</Typography>
              {isEditable && (
                <Button 
                  variant="contained" 
                  onClick={handleAddImage}
                  startIcon={<AddPhotoAlternateIcon />}
                  className="slider-add-button"
                >
                  Add Images
                </Button>
              )}
            </Box>
          )}
        </AnimatePresence>

        {/* Navigation Arrows - Always visible when > 1 image */}
        {localImages.length > 1 && (
          <>
            <IconButton
              onClick={handlePrevClick}
              onTouchEnd={handlePrevClick}
              size={isMobile ? "small" : "medium"}
              sx={{
                position: 'absolute',
                left: { xs: 5, sm: 10 },
                top: '50%',
                transform: 'translateY(-50%)',
                width: { xs: 48, sm: 48 }, // Even larger touch target for 2-image case
                height: { xs: 48, sm: 48 },
                bgcolor: 'rgba(0,0,0,0.5)', // Slightly more visible
                color: 'white',
                zIndex: 2000,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                '&:active': { 
                  transform: 'translateY(-50%) scale(0.95)',
                  bgcolor: 'rgba(0,0,0,0.9)'
                },
                pointerEvents: 'auto',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                transition: 'background-color 0.2s, transform 0.1s',
                '&:focus': {
                  outline: 'none'
                },
                // Add a subtle border to make it more visible
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <ChevronLeftIcon fontSize={isMobile ? "large" : "medium"} />
            </IconButton>

            <IconButton
              onClick={handleNextClick}
              onTouchEnd={handleNextClick}
              size={isMobile ? "small" : "medium"}
              sx={{
                position: 'absolute',
                right: { xs: 5, sm: 10 },
                top: '50%',
                transform: 'translateY(-50%)',
                width: { xs: 48, sm: 48 },
                height: { xs: 48, sm: 48 },
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                zIndex: 2000,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                '&:active': { 
                  transform: 'translateY(-50%) scale(0.95)',
                  bgcolor: 'rgba(0,0,0,0.9)'
                },
                pointerEvents: 'auto',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                transition: 'background-color 0.2s, transform 0.1s',
                '&:focus': {
                  outline: 'none'
                },
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <ChevronRightIcon fontSize={isMobile ? "large" : "medium"} />
            </IconButton>
          </>
        )}

        {/* Side Cards for 3D Effect - Only when more than 2 images */}
        {localImages.length > 2 && (
          <>
            <motion.div
              className="slider-side-card left"
              style={{
                width: isMobile ? 80 : 120,
                height: imageHeight * 0.6,
                borderRadius,
                transform: `translateZ(-${zDepth}px) rotateY(20deg)`,
              }}
              whileHover={{ opacity: 0.8, scale: 1.05 }}
              onClick={() => {
                setDirection(-1);
                setCurrentIndex((prev) => (prev - 1 + localImages.length) % localImages.length);
              }}
            >
              <img
                src={localImages[(currentIndex - 1 + localImages.length) % localImages.length]}
                alt="Previous"
                className="slider-side-image"
              />
            </motion.div>

            <motion.div
              className="slider-side-card right"
              style={{
                width: isMobile ? 80 : 120,
                height: imageHeight * 0.6,
                borderRadius,
                transform: `translateZ(-${zDepth}px) rotateY(-20deg)`,
              }}
              whileHover={{ opacity: 0.8, scale: 1.05 }}
              onClick={() => {
                setDirection(1);
                setCurrentIndex((prev) => (prev + 1) % localImages.length);
              }}
            >
              <img
                src={localImages[(currentIndex + 1) % localImages.length]}
                alt="Next"
                className="slider-side-image"
              />
            </motion.div>
          </>
        )}
      </Box>

      {/* Thumbnail Strip */}
      {localImages.length > 1 && (!isMobile || localImages.length <= 5) && (
        <Box className="slider-thumbnails">
          {localImages.map((img, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.1, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Box
                onClick={() => {
                  setDirection(idx > currentIndex ? 1 : -1);
                  setCurrentIndex(idx);
                }}
                className={`slider-thumbnail ${currentIndex === idx ? 'active' : 'inactive'}`}
              >
                <img src={img} alt={`Thumbnail ${idx + 1}`} />
                
                {isEditable && (
                  <Tooltip title="Drag to reorder">
                    <IconButton
                      size="small"
                      draggable={true}
                      onDragStart={(e) => {
                        e.stopPropagation();
                        e.dataTransfer.setData('text/plain', idx.toString());
                        const img = new Image();
                        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
                        e.dataTransfer.setDragImage(img, 0, 0);
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                        if (!isNaN(fromIndex) && fromIndex !== idx) {
                          handleReorderImages(fromIndex, idx);
                        }
                      }}
                      className="slider-reorder-handle"
                    >
                      <ReorderIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </motion.div>
          ))}

          {/* Placeholders */}
          {showPlaceholders && placeholderCount > 0 && Array(placeholderCount).fill(0).map((_, idx) => (
            <Box key={`placeholder-${idx}`} className="slider-placeholder">
              <AddPhotoAlternateIcon />
            </Box>
          ))}
        </Box>
      )}
      
      {/* Mobile indicator dots */}
      {isMobile && localImages.length > 5 && (
        <Box className="slider-dots">
          {localImages.map((_, idx) => (
            <Box
              key={idx}
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
              }}
              className={`slider-dot ${idx === currentIndex ? 'active' : ''}`}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ImageSlider;