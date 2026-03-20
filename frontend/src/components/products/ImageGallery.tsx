import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Tooltip,
  Badge,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import ReorderIcon from '@mui/icons-material/Reorder';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LinkIcon from '@mui/icons-material/Link';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import './ImageGallery.css';

interface ImageGalleryProps {
  images: string[];
  productName: string;
  onImagesChange?: (images: string[]) => void;
  isEditable?: boolean;
}

// Image compression utility
const compressImage = async (
  base64String: string,
  maxWidth = 2000,
  maxHeight = 2000,
  quality = 0.9
): Promise<string> => {
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

      const format = base64String.includes('image/png')
        ? 'image/png'
        : base64String.includes('image/webp')
        ? 'image/webp'
        : 'image/jpeg';

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
  isEditable = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localImages, setLocalImages] = useState(images);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [imageUrls, setImageUrls] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const variants = {
    enter: { opacity: 0 },
    center: { opacity: 1 },
    exit: { opacity: 0 },
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

  // Handle file upload via dropzone
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setIsProcessing(true);

      try {
        const compressedImages = await Promise.all(
          acceptedFiles.map(async (file) => {
            if (file.size > 15 * 1024 * 1024) {
              toast.warning(
                `${file.name} is ${formatFileSize(file.size)}. It will be compressed.`
              );
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
        setAddDialogOpen(false);
      } catch (error) {
        console.error('Error processing images:', error);
        toast.error('Failed to process images');
      } finally {
        setIsProcessing(false);
      }
    },
    [localImages, onImagesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'] },
    multiple: true,
    maxSize: 15 * 1024 * 1024,
  });

  const handleAddUrls = () => {
    if (imageUrls.trim()) {
      const urls = imageUrls
        .split('\n')
        .map((url) => url.trim())
        .filter((url) => url.startsWith('http://') || url.startsWith('https://'));

      if (urls.length === 0) {
        toast.warning('Please enter valid image URLs (starting with http:// or https://)');
        return;
      }

      const newImages = [...localImages, ...urls];
      setLocalImages(newImages);
      onImagesChange?.(newImages);
      toast.success(`${urls.length} URL(s) added`);
      setImageUrls('');
      setAddDialogOpen(false);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await onDrop(Array.from(files));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (localImages.length === 0) {
    return (
      <Box className="gallery-empty">
        <Typography color="textSecondary" gutterBottom>
          No images
        </Typography>
        {isEditable && (
          <Button
            variant="contained"
            startIcon={<AddPhotoAlternateIcon />}
            onClick={() => setAddDialogOpen(true)}
            disabled={isProcessing}
          >
            Add Images
          </Button>
        )}
        {isProcessing && <CircularProgress size={24} className="processing-spinner" />}

        {/* Add Image Dialog */}
        <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Images</DialogTitle>
          <DialogContent>
            <div
              {...getRootProps()}
              className={`dropzone-area ${isDragActive ? 'drag-active' : ''}`}
            >
              <input {...getInputProps()} />
              <CloudUploadIcon className="dropzone-icon" />
              <Typography>
                {isDragActive ? 'Drop images here...' : 'Drag & drop images here'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                (JPG, PNG, WebP, GIF up to 15MB each)
              </Typography>
              <Button variant="outlined" size="small" onClick={handleFileSelect} className="browse-button">
                Browse Files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden-file-input"
                onChange={handleFileInputChange}
                aria-label="Choose image files to upload"
                title="Choose image files to upload"
              />
            </div>

            <Typography variant="subtitle2" gutterBottom className="url-input-label">
              Or Add Image URLs
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.png"
              value={imageUrls}
              onChange={(e) => setImageUrls(e.target.value)}
              variant="outlined"
              size="small"
              aria-label="Image URLs"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddUrls} variant="contained" startIcon={<LinkIcon />}>
              Add URLs
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  return (
    <Box className="gallery-container">
      {/* Processing overlay */}
      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-content">
            <CircularProgress />
            <Typography>Processing images...</Typography>
          </div>
        </div>
      )}

      {/* Main image carousel */}
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

        {/* Navigation arrows */}
        {localImages.length > 1 && (
          <>
            <Tooltip title="Previous">
              <IconButton
                onClick={handlePrev}
                className="nav-arrow left"
                disabled={isTransitioning}
                aria-label="Previous image"
              >
                <ChevronLeftIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Next">
              <IconButton
                onClick={handleNext}
                className="nav-arrow right"
                disabled={isTransitioning}
                aria-label="Next image"
              >
                <ChevronRightIcon />
              </IconButton>
            </Tooltip>
          </>
        )}

        {/* Image counter */}
        <Badge
          badgeContent={`${currentIndex + 1}/${localImages.length}`}
          color="primary"
          className="image-counter"
        />

        {/* Admin delete button */}
        {isEditable && (
          <Tooltip title="Delete current image">
            <IconButton
              onClick={() => handleDelete(currentIndex)}
              className="delete-button"
              aria-label="Delete current image"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Admin add button overlay */}
        {isEditable && (
          <Tooltip title="Add images">
            <IconButton
              onClick={() => setAddDialogOpen(true)}
              className="add-button-overlay"
              aria-label="Add images"
            >
              <AddPhotoAlternateIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Thumbnail strip */}
      <Box className="thumbnail-strip">
        {localImages.map((img, idx) => (
          <Box
            key={idx}
            className={`thumbnail-item ${idx === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(idx)}
            role="button"
            tabIndex={0}
            aria-label={`Go to image ${idx + 1}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setCurrentIndex(idx);
              }
            }}
          >
            <img src={img} alt={`Thumbnail ${idx + 1}`} />

            {/* Reorder handle with touch support */}
           {/* Reorder handle with touch support */}
{isEditable && (
  <div
    className="reorder-handle"
    draggable
    aria-label="Drag to reorder"
    onDragStart={(e) => {
      e.dataTransfer.setData('text/plain', idx.toString());
      const dragImg = new Image();
      dragImg.src =
        'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
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
    onTouchStart={(e) => {
      e.stopPropagation();
      const element = e.currentTarget;
      const fromIndex = idx;
      
      const onTouchMove = (moveEvent: TouchEvent) => {
        moveEvent.preventDefault();
      };
      
      const onTouchEnd = (endEvent: TouchEvent) => {
        const endTouch = endEvent.changedTouches[0];
        const endX = endTouch.clientX;
        const endY = endTouch.clientY;
        
        const elements = document.elementsFromPoint(endX, endY);
        const targetThumb = elements.find(el => el.closest?.('.thumbnail-item')) as HTMLElement;
        const targetBox = targetThumb?.closest('.thumbnail-item');
        
        if (targetBox) {
          const targetIndex = Array.from(document.querySelectorAll('.thumbnail-item'))
            .findIndex(item => item === targetBox);
          if (targetIndex !== -1 && targetIndex !== fromIndex) {
            handleReorder(fromIndex, targetIndex);
          }
        }
        
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
      };
      
      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', onTouchEnd);
      
      element.style.opacity = '0.5';
      setTimeout(() => {
        element.style.opacity = '';
      }, 200);
    }}
  >
    <ReorderIcon />
  </div>
)}
          </Box>
        ))}

        {/* Admin add button in thumbnail strip */}
        {isEditable && (
          <Tooltip title="Add images">
            <Box
              className="thumbnail-item add-button"
              onClick={() => setAddDialogOpen(true)}
              role="button"
              tabIndex={0}
              aria-label="Add new images"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setAddDialogOpen(true);
                }
              }}
            >
              <AddPhotoAlternateIcon />
            </Box>
          </Tooltip>
        )}
      </Box>

      {/* Add Image Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Images</DialogTitle>
        <DialogContent>
          <div
            {...getRootProps()}
            className={`dropzone-area ${isDragActive ? 'drag-active' : ''}`}
          >
            <input {...getInputProps()} />
            <CloudUploadIcon className="dropzone-icon" />
            <Typography>
              {isDragActive ? 'Drop images here...' : 'Drag & drop images here'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              (JPG, PNG, WebP, GIF up to 15MB each)
            </Typography>
            <Button variant="outlined" size="small" onClick={handleFileSelect} className="browse-button">
              Browse Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden-file-input"
              onChange={handleFileInputChange}
              aria-label="Choose image files to upload"
              title="Choose image files to upload"
            />
          </div>

          <Typography variant="subtitle2" gutterBottom className="url-input-label">
            Or Add Image URLs
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.png"
            value={imageUrls}
            onChange={(e) => setImageUrls(e.target.value)}
            variant="outlined"
            size="small"
            aria-label="Image URLs"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddUrls} variant="contained" startIcon={<LinkIcon />}>
            Add URLs
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ImageGallery;