import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Tooltip,
  Badge,
  Button,
  CircularProgress
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import ReorderIcon from '@mui/icons-material/Reorder';
import { toast } from 'react-toastify';
import './ImageGallery.css';

interface ImageGalleryProps {
  images: string[];
  productName: string;
  onImagesChange?: (images: string[]) => void;
  isEditable?: boolean;
}

// Image compression utility (same as in ImageSlider)
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

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  productName,
  onImagesChange,
  isEditable = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localImages, setLocalImages] = useState(images);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Simple fade animation variants
  const variants = {
    enter: { opacity: 0 },
    center: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const handleNext = () => {
    if (isTransitioning || localImages.length <= 1) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % localImages.length);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handlePrev = () => {
    if (isTransitioning || localImages.length <= 1) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + localImages.length) % localImages.length);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleDelete = (index: number) => {
    const newImages = localImages.filter((_, i) => i !== index);
    setLocalImages(newImages);
    onImagesChange?.(newImages);
    if (currentIndex >= newImages.length) {
      setCurrentIndex(Math.max(0, newImages.length - 1));
    }
    toast.success('Image deleted');
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const newImages = [...localImages];
    const [moved] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, moved);
    setLocalImages(newImages);
    onImagesChange?.(newImages);
    toast.success('Images reordered');
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

  if (localImages.length === 0) {
    return (
      <Box className="gallery-empty">
        <Typography color="textSecondary">No images</Typography>
        {isEditable && (
          <Button
            variant="outlined"
            startIcon={<AddPhotoAlternateIcon />}
            onClick={handleAddImage}
            sx={{ 
              borderColor: 'rgba(0,0,0,0.3)', 
              color: 'text.primary',
              '&:hover': { borderColor: 'rgba(0,0,0,0.5)' }
            }}
            disabled={isProcessing}
          >
            Add Images
          </Button>
        )}
        {isProcessing && <CircularProgress size={24} sx={{ mt: 2 }} />}
      </Box>
    );
  }

  return (
    <Box className="gallery-container">
      {/* Processing overlay (optional) */}
      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-content">
            <CircularProgress />
            <Typography>Processing images...</Typography>
          </div>
        </div>
      )}

      {/* Main Image */}
      <Box className="main-image-wrapper">
        <AnimatePresence mode="wait" initial={false}>
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
        </AnimatePresence>

        {/* Navigation Arrows */}
        {localImages.length > 1 && (
          <>
            <Tooltip title="Previous">
              <IconButton
                onClick={handlePrev}
                className="nav-arrow left"
                disabled={isTransitioning}
              >
                <ChevronLeftIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Next">
              <IconButton
                onClick={handleNext}
                className="nav-arrow right"
                disabled={isTransitioning}
              >
                <ChevronRightIcon />
              </IconButton>
            </Tooltip>
          </>
        )}

        {/* Image Counter */}
        <Badge
          badgeContent={`${currentIndex + 1}/${localImages.length}`}
          color="primary"
          className="image-counter"
        />

        {/* Admin Delete Button */}
        {isEditable && (
          <Tooltip title="Delete current image">
            <IconButton
              onClick={() => handleDelete(currentIndex)}
              className="delete-button"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Thumbnail Strip */}
      <Box className="thumbnail-strip">
        {localImages.map((img, idx) => (
          <Box
            key={idx}
            className={`thumbnail-item ${idx === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(idx)}
          >
            <img src={img} alt={`Thumbnail ${idx + 1}`} />

            {/* Admin Reorder Handle */}
            {isEditable && (
              <div
                className="reorder-handle"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', idx.toString());
                  // Hide default drag image
                  const dragImg = new Image();
                  dragImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
                  e.dataTransfer.setDragImage(dragImg, 0, 0);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const from = parseInt(e.dataTransfer.getData('text/plain'));
                  if (!isNaN(from) && from !== idx) {
                    handleReorder(from, idx);
                  }
                }}
              >
                <ReorderIcon />
              </div>
            )}
          </Box>
        ))}

        {/* Admin Add Button */}
        {isEditable && (
          <Tooltip title="Add images">
            <Box
              className="thumbnail-item add-button"
              onClick={handleAddImage}
            >
              <AddPhotoAlternateIcon />
            </Box>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

export default ImageGallery;