import React, { useState, useEffect, useRef } from 'react';
import {
  Box, IconButton, Slider, Typography, Switch, FormControlLabel,
  Paper, Popover, Tooltip, Badge
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
import './ImageSlider.css';

interface ImageSliderProps {
  images: string[];
  productName: string;
  onImagesChange?: (images: string[]) => void;
  isEditable?: boolean;
}

const ImageSlider: React.FC<ImageSliderProps> = ({ 
  images, 
  productName, 
  onImagesChange,
  isEditable = false 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [settingsAnchor, setSettingsAnchor] = useState<null | HTMLElement>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState(5);
  const [zDepth, setZDepth] = useState(200);
  const [imageWidth, setImageWidth] = useState(400);
  const [imageHeight, setImageHeight] = useState(400);
  const [borderRadius, setBorderRadius] = useState(16);
  const [backfaceVisible, setBackfaceVisible] = useState(true);
  const [pauseOnHover, setPauseOnHover] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [showPlaceholders] = useState(false);
  const [localImages, setLocalImages] = useState<string[]>(images);
  
  const sliderRef = useRef<HTMLDivElement>(null);
  const autoRotateRef = useRef<NodeJS.Timeout>();

  // Update local images when prop changes
  useEffect(() => {
    setLocalImages(images);
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
  }, [autoRotate, isPaused, isHovered, currentIndex, rotationSpeed, localImages.length]);

  const handleNext = () => {
    if (localImages.length === 0) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % localImages.length);
  };

  const handlePrev = () => {
    if (localImages.length === 0) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + localImages.length) % localImages.length);
  };

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
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

  const handleAddImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        Array.from(files).forEach(file => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const newImages = [...localImages, reader.result as string];
            setLocalImages(newImages);
            onImagesChange?.(newImages);
          };
          reader.readAsDataURL(file);
        });
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

  return (
    <Box className="slider-container">
      {/* Settings Button */}
      <Box className="slider-settings-button">
        <Tooltip title="Slider Settings">
          <IconButton onClick={(e) => setSettingsAnchor(e.currentTarget)}>
            <SettingsIcon />
          </IconButton>
        </Tooltip>
        
        <Popover
          open={Boolean(settingsAnchor)}
          anchorEl={settingsAnchor}
          onClose={() => setSettingsAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Paper className="slider-settings-paper">
            <Typography variant="h6" className="slider-settings-title">
              Slider Settings
            </Typography>
            
            <FormControlLabel
              control={<Switch checked={autoRotate} onChange={(e) => setAutoRotate(e.target.checked)} />}
              label="Auto Rotate"
            />
            
            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom>Rotation Speed: {rotationSpeed}s</Typography>
              <Slider
                value={rotationSpeed}
                onChange={(_, val) => setRotationSpeed(val as number)}
                min={2}
                max={10}
                step={0.5}
                marks={[
                  { value: 2, label: 'Cinematic' },
                  { value: 5, label: 'Normal' },
                  { value: 10, label: 'Playful' },
                ]}
              />
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom>Z-Depth: {zDepth}px</Typography>
              <Slider
                value={zDepth}
                onChange={(_, val) => setZDepth(val as number)}
                min={0}
                max={500}
                step={10}
              />
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom>Image Width: {imageWidth}px</Typography>
              <Slider
                value={imageWidth}
                onChange={(_, val) => setImageWidth(val as number)}
                min={200}
                max={800}
                step={10}
              />
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom>Image Height: {imageHeight}px</Typography>
              <Slider
                value={imageHeight}
                onChange={(_, val) => setImageHeight(val as number)}
                min={200}
                max={800}
                step={10}
              />
            </Box>
            
            <Box sx={{ mt: 2 }}>
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
            
            <FormControlLabel
              control={<Switch checked={pauseOnHover} onChange={(e) => setPauseOnHover(e.target.checked)} />}
              label="Pause on Hover"
            />
          </Paper>
        </Popover>
      </Box>

      {/* Play/Pause Button */}
      {autoRotate && (
        <Box className="slider-play-pause">
          <Tooltip title={isPaused ? "Play" : "Pause"}>
            <IconButton onClick={() => setIsPaused(!isPaused)}>
              {isPaused ? <PlayArrowIcon /> : <PauseIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Add Image Button (for editable mode) */}
      {isEditable && (
        <Box className="slider-add-image">
          <Tooltip title="Add Images">
            <IconButton onClick={handleAddImage}>
              <AddPhotoAlternateIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Main Slider */}
      <Box 
        ref={sliderRef}
        className={`slider-main ${isDragging ? 'dragging' : ''}`}
        style={{
          height: imageHeight,
        }}
        onMouseEnter={() => pauseOnHover && setIsHovered(true)}
        onMouseLeave={() => {
          if (pauseOnHover) setIsHovered(false);
          handleDragEnd();
        }}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
      >
        {/* Navigation Arrows */}
        {localImages.length > 1 && (
          <>
            <IconButton
              onClick={handlePrev}
              className="slider-nav-left"
            >
              <ChevronLeftIcon />
            </IconButton>
            <IconButton
              onClick={handleNext}
              className="slider-nav-right"
            >
              <ChevronRightIcon />
            </IconButton>
          </>
        )}

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
              }}
            >
              <Box
                className="slider-image-box"
                style={{
                  borderRadius: borderRadius,
                }}
              >
                <img
                  src={localImages[currentIndex]}
                  alt={`${productName} - Image ${currentIndex + 1}`}
                  className="slider-image"
                />
                
                {/* Image Index Badge */}
                <Badge
                  badgeContent={`${currentIndex + 1}/${localImages.length}`}
                  color="primary"
                  className="slider-image-badge"
                />

                {/* Delete Button (for editable mode) */}
                {isEditable && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(currentIndex);
                    }}
                    className="slider-delete-button"
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
                borderRadius: borderRadius,
              }}
            >
              <Typography color="text.secondary">No images available</Typography>
            </Box>
          )}
        </AnimatePresence>

        {/* Side Cards for 3D Effect (only when enough images) */}
        {localImages.length > 2 && (
          <>
            <motion.div
              className="slider-side-card left"
              style={{
                width: 200,
                height: imageHeight * 0.8,
                borderRadius: borderRadius,
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
                width: 200,
                height: imageHeight * 0.8,
                borderRadius: borderRadius,
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
      {localImages.length > 1 && (
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
                <img
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                />
                
                {/* Reorder Handle (for editable mode) */}
                {isEditable && (
                  <Tooltip title="Drag to reorder">
                    <IconButton
                      size="small"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', idx.toString());
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                        handleReorderImages(fromIndex, idx);
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
            <Box
              key={`placeholder-${idx}`}
              className="slider-placeholder"
            >
              <AddPhotoAlternateIcon />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ImageSlider;