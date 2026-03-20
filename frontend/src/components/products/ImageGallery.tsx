import React, { useState, useCallback, useRef } from 'react';
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addingUrls, setAddingUrls] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragStartIndex = useRef<number | null>(null);
  const touchStartIndex = useRef<number | null>(null);
  const touchTargetIndex = useRef<number | null>(null);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % localImages.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + localImages.length) % localImages.length);
  };

  const handleDeleteConfirm = () => {
    if (localImages.length <= 1) {
      toast.warning('Cannot delete the last image');
      setDeleteDialogOpen(false);
      return;
    }
    const newImages = localImages.filter((_, i) => i !== currentIndex);
    setLocalImages(newImages);
    onImagesChange?.(newImages);
    const newIndex = currentIndex >= newImages.length ? newImages.length - 1 : currentIndex;
    setCurrentIndex(newIndex);
    toast.success('Image deleted');
    setDeleteDialogOpen(false);
  };

  // Validate image URL
  const validateImageUrl = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };

  // Drag and drop reordering for desktop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragStartIndex.current = index;
    e.dataTransfer.setData('text/plain', index.toString());
    const dragImg = new Image();
    dragImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
    e.dataTransfer.setDragImage(dragImg, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const fromIndex = dragStartIndex.current;
    if (fromIndex !== null && fromIndex !== targetIndex) {
      const newImages = [...localImages];
      const [moved] = newImages.splice(fromIndex, 1);
      newImages.splice(targetIndex, 0, moved);
      setLocalImages(newImages);
      onImagesChange?.(newImages);
      toast.success('Images reordered');
      
      if (currentIndex === fromIndex) {
        setCurrentIndex(targetIndex);
      } else if (currentIndex > fromIndex && currentIndex <= targetIndex) {
        setCurrentIndex(currentIndex - 1);
      } else if (currentIndex < fromIndex && currentIndex >= targetIndex) {
        setCurrentIndex(currentIndex + 1);
      }
    }
    dragStartIndex.current = null;
  };

  // Touch reordering for mobile
  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    e.preventDefault();
    touchStartIndex.current = index;
    const element = e.currentTarget as HTMLElement;
    element.style.opacity = '0.5';
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartIndex.current === null) return;
    e.preventDefault();
    const touch = e.touches[0];
    const elementsAtPoint = document.elementsFromPoint(touch.clientX, touch.clientY);
    const targetThumb = elementsAtPoint.find(el => el.closest?.('.thumbnail-item')) as HTMLElement;
    
    if (targetThumb) {
      const targetBox = targetThumb.closest('.thumbnail-item');
      if (targetBox) {
        const targetIndex = Array.from(document.querySelectorAll('.thumbnail-item')).findIndex(
          item => item === targetBox
        );
        if (targetIndex !== -1 && targetIndex !== touchTargetIndex.current) {
          touchTargetIndex.current = targetIndex;
          document.querySelectorAll('.thumbnail-item').forEach(el => {
            (el as HTMLElement).style.transform = '';
          });
          (targetBox as HTMLElement).style.transform = 'scale(1.05)';
        }
      }
    }
  };

  const handleTouchEnd = () => {
    if (touchStartIndex.current !== null && touchTargetIndex.current !== null && 
        touchStartIndex.current !== touchTargetIndex.current) {
      const newImages = [...localImages];
      const [moved] = newImages.splice(touchStartIndex.current, 1);
      newImages.splice(touchTargetIndex.current, 0, moved);
      setLocalImages(newImages);
      onImagesChange?.(newImages);
      toast.success('Images reordered');
      
      if (currentIndex === touchStartIndex.current) {
        setCurrentIndex(touchTargetIndex.current);
      }
    }
    
    document.querySelectorAll('.thumbnail-item').forEach(el => {
      const element = el as HTMLElement;
      element.style.opacity = '';
      element.style.transform = '';
    });
    touchStartIndex.current = null;
    touchTargetIndex.current = null;
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

  const handleAddUrls = async () => {
    if (!imageUrls.trim()) return;
    
    const urls = imageUrls
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url.startsWith('http://') || url.startsWith('https://'));

    if (urls.length === 0) {
      toast.warning('Please enter valid image URLs (starting with http:// or https://)');
      return;
    }

    setAddingUrls(true);
    let validCount = 0;
    const validUrls: string[] = [];

    for (const url of urls) {
      const isValid = await validateImageUrl(url);
      if (isValid) {
        validUrls.push(url);
        validCount++;
      } else {
        toast.warning(`Invalid image URL: ${url.substring(0, 50)}...`);
      }
    }

    if (validUrls.length > 0) {
      const newImages = [...localImages, ...validUrls];
      setLocalImages(newImages);
      onImagesChange?.(newImages);
      toast.success(`${validCount} valid URL(s) added`);
      setImageUrls('');
      setAddDialogOpen(false);
    } else {
      toast.error('No valid image URLs found');
    }
    setAddingUrls(false);
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
          addingUrls={addingUrls}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Image</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this image? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Main Image */}
      <div className="main-image-wrapper">
        <img
          src={localImages[currentIndex]}
          alt={`${productName} - ${currentIndex + 1}`}
          className="main-image"
          loading="eager"
        />

        {/* Navigation Arrows - visible on ALL devices */}
        {localImages.length > 1 && (
          <>
            <button onClick={handlePrev} className="nav-arrow left" aria-label="Previous image">
              <ChevronLeftIcon />
            </button>
            <button onClick={handleNext} className="nav-arrow right" aria-label="Next image">
              <ChevronRightIcon />
            </button>
          </>
        )}

        {/* Pagination Dots - ONLY inside the image */}
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
      </div>

      {/* Admin Buttons (outside image) */}
      {isEditable && (
        <div className="admin-buttons">
          <Tooltip title="Delete current image">
            <IconButton onClick={() => setDeleteDialogOpen(true)} className="admin-delete" size="small">
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

      {/* Thumbnail Strip - Clickable + Reorderable */}
      <div className="thumbnail-strip">
        {localImages.map((img, idx) => (
          <div
            key={idx}
            className={`thumbnail-item ${idx === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(idx)}
            draggable={isEditable}
            onDragStart={(e) => isEditable && handleDragStart(e, idx)}
            onDragOver={handleDragOver}
            onDrop={(e) => isEditable && handleDrop(e, idx)}
            onTouchStart={(e) => isEditable && handleTouchStart(e, idx)}
            onTouchMove={(e) => isEditable && handleTouchMove(e)}
            onTouchEnd={handleTouchEnd}
          >
            <img src={img} alt={`Thumbnail ${idx + 1}`} loading="lazy" />
            {isEditable && (
              <div className="reorder-handle" aria-label="Drag to reorder">
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
        addingUrls={addingUrls}
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
  addingUrls: boolean;
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
  addingUrls,
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
          disabled={addingUrls}
        />
        {addingUrls && <CircularProgress size={20} sx={{ mt: 1 }} />}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={addingUrls}>Cancel</Button>
        <Button onClick={handleAddUrls} variant="contained" startIcon={<LinkIcon />} disabled={addingUrls}>
          {addingUrls ? 'Validating...' : 'Add URLs'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageGallery;