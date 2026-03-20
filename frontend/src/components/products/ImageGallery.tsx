import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Tooltip,
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
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [imageUrls, setImageUrls] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const isReordering = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragEndX = useRef(0);
  const [direction, setDirection] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  const handleNext = () => {
    if (localImages.length <= 1) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % localImages.length);
  };

  const handlePrev = () => {
    if (localImages.length <= 1) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + localImages.length) % localImages.length);
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

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isReordering.current) return;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isReordering.current) return;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (isReordering.current) {
      isReordering.current = false;
      return;
    }
    
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // Mouse handlers for desktop drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isReordering.current) return;
    setIsDragging(true);
    dragStartX.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isReordering.current) return;
    dragEndX.current = e.clientX;
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const diff = dragStartX.current - dragEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    
    dragStartX.current = 0;
    dragEndX.current = 0;
  };

  // File upload via dropzone
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

        <AddImageDialog
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          getRootProps={getRootProps}
          getInputProps={getInputProps}
          isDragActive={isDragActive}
          imageUrls={imageUrls}
          setImageUrls={setImageUrls}
          handleAddUrls={handleAddUrls}
          handleFileSelect={handleFileSelect}
          fileInputRef={fileInputRef}
          handleFileInputChange={handleFileInputChange}
        />
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

      {/* Main image carousel with swipe support */}
      <Box 
        className="main-image-wrapper"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.img
            key={currentIndex}
            src={localImages[currentIndex]}
            alt={`${productName} - ${currentIndex + 1}`}
            className="main-image"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            dragMomentum={false}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(_, { offset, velocity }) => {
              setIsDragging(false);
              const swipe = Math.abs(offset.x) * velocity.x;
              if (swipe < -10000 || (Math.abs(offset.x) > 100 && velocity.x < -0.5)) {
                handleNext();
              } else if (swipe > 10000 || (Math.abs(offset.x) > 100 && velocity.x > 0.5)) {
                handlePrev();
              }
            }}
          />
        </AnimatePresence>

        {/* Navigation arrows - hidden on mobile/tablet */}
        {localImages.length > 1 && !isMobile && (
          <>
            <Tooltip title="Previous">
              <IconButton
                onClick={handlePrev}
                className="nav-arrow left"
                aria-label="Previous image"
              >
                <ChevronLeftIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Next">
              <IconButton
                onClick={handleNext}
                className="nav-arrow right"
                aria-label="Next image"
              >
                <ChevronRightIcon />
              </IconButton>
            </Tooltip>
          </>
        )}

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

      {/* Instagram-style pagination dots - TINY */}
      {localImages.length > 1 && (
        <div className="pagination-dots">
          {localImages.map((_, idx) => (
            <button
              key={idx}
              className={`dot ${idx === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to image ${idx + 1}`}
            />
          ))}
        </div>
      )}

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
            {isEditable && (
              <div
                className="reorder-handle"
                draggable
                aria-label="Drag to reorder"
                onDragStart={(e) => {
                  isReordering.current = true;
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
                  isReordering.current = false;
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  isReordering.current = true;
                  const fromIndex = idx;
                  const element = e.currentTarget;

                  const onTouchMove = (moveEvent: TouchEvent) => {
                    moveEvent.preventDefault();
                  };

                  const onTouchEnd = (endEvent: TouchEvent) => {
                    const endTouch = endEvent.changedTouches[0];
                    const elementsAtPoint = document.elementsFromPoint(endTouch.clientX, endTouch.clientY);
                    const targetThumb = elementsAtPoint.find(el => el.closest?.('.thumbnail-item')) as HTMLElement;
                    const targetBox = targetThumb?.closest('.thumbnail-item');

                    if (targetBox && targetBox !== element.closest('.thumbnail-item')) {
                      const targetIndex = Array.from(document.querySelectorAll('.thumbnail-item'))
                        .findIndex(item => item === targetBox);
                      if (targetIndex !== -1 && targetIndex !== fromIndex) {
                        handleReorder(fromIndex, targetIndex);
                      }
                    }

                    document.removeEventListener('touchmove', onTouchMove);
                    document.removeEventListener('touchend', onTouchEnd);
                    setTimeout(() => { isReordering.current = false; }, 100);
                  };

                  document.addEventListener('touchmove', onTouchMove, { passive: false });
                  document.addEventListener('touchend', onTouchEnd);
                  element.style.opacity = '0.5';
                  setTimeout(() => {
                    if (element) element.style.opacity = '';
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
      <AddImageDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        getRootProps={getRootProps}
        getInputProps={getInputProps}
        isDragActive={isDragActive}
        imageUrls={imageUrls}
        setImageUrls={setImageUrls}
        handleAddUrls={handleAddUrls}
        handleFileSelect={handleFileSelect}
        fileInputRef={fileInputRef}
        handleFileInputChange={handleFileInputChange}
      />
    </Box>
  );
};

// Separate dialog component
interface AddImageDialogProps {
  open: boolean;
  onClose: () => void;
  getRootProps: any;
  getInputProps: any;
  isDragActive: boolean;
  imageUrls: string;
  setImageUrls: (val: string) => void;
  handleAddUrls: () => void;
  handleFileSelect: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const AddImageDialog: React.FC<AddImageDialogProps> = ({
  open,
  onClose,
  getRootProps,
  getInputProps,
  isDragActive,
  imageUrls,
  setImageUrls,
  handleAddUrls,
  handleFileSelect,
  fileInputRef,
  handleFileInputChange,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
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
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleAddUrls} variant="contained" startIcon={<LinkIcon />}>
          Add URLs
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageGallery;