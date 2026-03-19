import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  IconButton,
  Slider,
  Typography,
  Switch,
  Paper,
  Popover,
  Tooltip,
  Badge,
  CircularProgress,
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

// Image compression utility
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [,setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [settingsAnchor, setSettingsAnchor] = useState<null | HTMLElement>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState(5);
  const [localImages, setLocalImages] = useState<string[]>(images);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  
  const sliderRef = useRef<HTMLDivElement>(null);
  const autoRotateRef = useRef<NodeJS.Timeout>();

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
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % localImages.length);
  }, [localImages.length]);

  const handlePrev = useCallback(() => {
    if (localImages.length === 0) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + localImages.length) % localImages.length);
  }, [localImages.length]);

  const handlePrevClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    handlePrev();
  }, [handlePrev]);

  const handleNextClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    handleNext();
  }, [handleNext]);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    
    setTouchStartX(0);
    setTouchEndX(0);
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

  const handleRemoveCurrentImage = () => {
    if (localImages.length === 0) return;
    
    const newImages = localImages.filter((_, i) => i !== currentIndex);
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

  // Variants for simple fade animation
  const variants = {
    enter: { opacity: 0 },
    center: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const placeholderCount = Math.max(0, 6 - localImages.length);

  // Settings popover content
  const settingsContent = (
    <Paper className="settings-panel">
      <Typography className="settings-title">
        Slider Settings
      </Typography>
      
      <div className="settings-control">
        <div className="settings-label">
          <span>Auto Rotate</span>
          <Switch 
            checked={autoRotate} 
            onChange={(e) => setAutoRotate(e.target.checked)}
            size="small"
          />
        </div>
      </div>
      
      {autoRotate && (
        <div className="settings-control">
          <div className="settings-label">
            <span>Speed</span>
            <span>{rotationSpeed}s</span>
          </div>
          <Slider
            value={rotationSpeed}
            onChange={(_, val) => setRotationSpeed(val as number)}
            min={2}
            max={10}
            step={0.5}
            size="small"
          />
        </div>
      )}
    </Paper>
  );

  return (
    <Box className="slider-container">
      {/* Processing Overlay */}
      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-content">
            <CircularProgress />
            <Typography>Processing images...</Typography>
          </div>
        </div>
      )}

      {/* Settings Button */}
      <Tooltip title="Slider Settings">
        <IconButton
          className="settings-button"
          onClick={(e) => setSettingsAnchor(e.currentTarget)}
        >
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

      {/* Play/Pause Button */}
      {autoRotate && localImages.length > 1 && (
        <Tooltip title={isPaused ? "Play" : "Pause"}>
          <IconButton
            className="play-pause-button"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? <PlayArrowIcon /> : <PauseIcon />}
          </IconButton>
        </Tooltip>
      )}

      {/* Main Image Container */}
      <div 
        className="main-image-container"
        ref={sliderRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait" initial={false}>
          {localImages.length > 0 ? (
            <motion.img
              key={currentIndex}
              src={localImages[currentIndex]}
              alt={`${productName} - ${currentIndex + 1}`}
              className="main-image"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            />
          ) : (
            <div className="no-image-placeholder">
              <Typography color="textSecondary">No images available</Typography>
              {isEditable && (
                <Button 
                  variant="contained" 
                  onClick={handleAddImage}
                  startIcon={<AddPhotoAlternateIcon />}
                >
                  Add Images
                </Button>
              )}
            </div>
          )}
        </AnimatePresence>

        {/* Navigation Arrows */}
        {localImages.length > 1 && (
          <>
            <Tooltip title="Previous">
              <IconButton
                className="nav-button left"
                onClick={handlePrevClick}
              >
                <ChevronLeftIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Next">
              <IconButton
                className="nav-button right"
                onClick={handleNextClick}
              >
                <ChevronRightIcon />
              </IconButton>
            </Tooltip>
          </>
        )}

        {/* Image Counter */}
        {localImages.length > 0 && (
          <Badge
            badgeContent={`${currentIndex + 1}/${localImages.length}`}
            color="primary"
            className="image-counter"
          />
        )}

        {/* Admin Buttons */}
        {isEditable && localImages.length > 0 && (
          <div className="admin-buttons">
            <Tooltip title="Delete current image">
              <IconButton
                className="admin-button delete"
                onClick={handleRemoveCurrentImage}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Add images">
              <IconButton
                className="admin-button add"
                onClick={handleAddImage}
              >
                <AddPhotoAlternateIcon />
              </IconButton>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {localImages.length > 0 && (
        <div className="thumbnail-strip">
          {localImages.map((img, idx) => (
            <div
              key={idx}
              className={`thumbnail-item ${idx === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(idx)}
            >
              <img src={img} alt={`thumb-${idx}`} />
              
              {isEditable && (
                <div
                  className="reorder-handle"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', idx.toString());
                    const dragImg = new Image();
                    dragImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
                    e.dataTransfer.setDragImage(dragImg, 0, 0);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                    if (!isNaN(fromIndex) && fromIndex !== idx) {
                      handleReorderImages(fromIndex, idx);
                    }
                  }}
                >
                  <ReorderIcon style={{ fontSize: 14 }} />
                </div>
              )}
            </div>
          ))}

          {/* Placeholders */}
          {isEditable && placeholderCount > 0 && Array(placeholderCount).fill(0).map((_, idx) => (
            <div
              key={`placeholder-${idx}`}
              className="placeholder-thumb"
              onClick={handleAddImage}
            >
              <AddPhotoAlternateIcon />
            </div>
          ))}
        </div>
      )}
    </Box>
  );
};

export default ImageSlider;