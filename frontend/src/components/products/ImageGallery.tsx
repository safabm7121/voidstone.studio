import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import ReorderIcon from '@mui/icons-material/Reorder';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LinkIcon from '@mui/icons-material/Link';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
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
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const swiperRef = useRef<any>(null);
  const isReordering = useRef(false);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;

  const handleSlideChange = (swiper: any) => {
    setCurrentIndex(swiper.activeIndex);
  };

  const handleDelete = () => {
    const newImages = localImages.filter((_, i) => i !== currentIndex);
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
    // After reorder, update current index if needed
    if (currentIndex === fromIndex) {
      setCurrentIndex(toIndex);
    } else if (currentIndex > fromIndex && currentIndex <= toIndex) {
      setCurrentIndex(currentIndex - 1);
    } else if (currentIndex < fromIndex && currentIndex >= toIndex) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // File upload handlers
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setIsProcessing(true);

      try {
        const compressedImages = await Promise.all(
          acceptedFiles.map(async (file) => {
            if (file.size > 15 * 1024 * 1024) {
              toast.warning(`${file.name} is ${formatFileSize(file.size)}. It will be compressed.`);
            }
            return new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = async () => {
                try {
                  const compressed = await compressImage(reader.result as string, 2000, 2000, 0.9);
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
        <Typography color="textSecondary" gutterBottom>No images</Typography>
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
      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-content">
            <CircularProgress />
            <Typography>Processing images...</Typography>
          </div>
        </div>
      )}

      {/* Main Image Carousel with Swiper */}
      <div className="main-image-wrapper">
        <Swiper
          onSwiper={(swiper) => { swiperRef.current = swiper; }}
          onSlideChange={handleSlideChange}
          modules={[Navigation, Pagination]}
          navigation={{
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
          }}
          pagination={{
            clickable: true,
            dynamicBullets: false,
          }}
          loop={false}
          spaceBetween={0}
          slidesPerView={1}
          touchRatio={1}
          resistance={true}
          resistanceRatio={0.85}
          className="image-swiper"
        >
          {localImages.map((img, idx) => (
            <SwiperSlide key={idx}>
              <img 
                src={img}
                alt={`${productName} - ${idx + 1}`}
                className="main-image"
              />
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Navigation Arrows - visible on desktop only */}
        {!isMobile && localImages.length > 1 && (
          <>
            <div className="swiper-button-prev custom-nav" aria-label="Previous image">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="swiper-button-next custom-nav" aria-label="Next image">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </>
        )}
      </div>

      {/* Admin Buttons & Pagination Dots (outside image container) */}
      <div className="gallery-controls">
        {localImages.length > 1 && (
          <div className="pagination-dots">
            {localImages.map((_, idx) => (
              <button
                key={idx}
                className={`dot ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => swiperRef.current?.slideTo(idx)}
                aria-label={`Go to image ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {isEditable && (
          <div className="admin-buttons">
            <Tooltip title="Delete current image">
              <IconButton onClick={handleDelete} className="admin-delete" size="small">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Add images">
              <IconButton onClick={() => setAddDialogOpen(true)} className="admin-add" size="small">
                <AddPhotoAlternateIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      <div className="thumbnail-strip">
        {localImages.map((img, idx) => (
          <div
            key={idx}
            className={`thumbnail-item ${idx === currentIndex ? 'active' : ''}`}
            onClick={() => swiperRef.current?.slideTo(idx)}
          >
            <img src={img} alt={`Thumbnail ${idx + 1}`} />
            {isEditable && (
              <div
                className="reorder-handle"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', idx.toString());
                  const dragImg = new Image();
                  dragImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
                  e.dataTransfer.setDragImage(dragImg, 0, 0);
                  isReordering.current = true;
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
                  const fromIndex = idx;
                  const element = e.currentTarget;
                  
                  const onTouchEnd = (endEvent: TouchEvent) => {
                    const endTouch = endEvent.changedTouches[0];
                    const elementsAtPoint = document.elementsFromPoint(endTouch.clientX, endTouch.clientY);
                    const targetBox = elementsAtPoint.find(el => el.closest?.('.thumbnail-item')) as HTMLElement;
                    
                    if (targetBox && targetBox !== element.closest('.thumbnail-item')) {
                      const targetIndex = Array.from(document.querySelectorAll('.thumbnail-item')).findIndex(item => item === targetBox);
                      if (targetIndex !== -1 && targetIndex !== fromIndex) {
                        handleReorder(fromIndex, targetIndex);
                      }
                    }
                    document.removeEventListener('touchend', onTouchEnd);
                    isReordering.current = false;
                  };
                  
                  document.addEventListener('touchend', onTouchEnd);
                  element.style.opacity = '0.5';
                  setTimeout(() => { if (element) element.style.opacity = ''; }, 200);
                }}
              >
                <ReorderIcon />
              </div>
            )}
          </div>
        ))}
        {isEditable && (
          <div className="thumbnail-item add-button" onClick={() => setAddDialogOpen(true)}>
            <AddPhotoAlternateIcon />
          </div>
        )}
      </div>

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