import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Tooltip,
  Badge,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import ReorderIcon from '@mui/icons-material/Reorder';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LinkIcon from '@mui/icons-material/Link';
import { useDropzone } from 'react-dropzone';
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

const validateImageUrl = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  productName,
  onImagesChange,
  isEditable = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localImages, setLocalImages] = useState(images);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [imageUrls, setImageUrls] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [addingUrls, setAddingUrls] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>({
    open: false,
    message: '',
    severity: 'info',
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (localImages.length <= 1) {
      showSnackbar('Cannot delete the last image', 'warning');
      return;
    }
    const newImages = localImages.filter((_, i) => i !== index);
    setLocalImages(newImages);
    onImagesChange?.(newImages);
    if (currentIndex >= newImages.length) {
      setCurrentIndex(Math.max(0, newImages.length - 1));
    }
    showSnackbar('Image deleted successfully', 'success');
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const newImages = [...localImages];
    const [moved] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, moved);
    setLocalImages(newImages);
    onImagesChange?.(newImages);
    showSnackbar('Images reordered successfully', 'success');
    
    if (currentIndex === fromIndex) {
      setCurrentIndex(toIndex);
    } else if (currentIndex > fromIndex && currentIndex <= toIndex) {
      setCurrentIndex(currentIndex - 1);
    } else if (currentIndex < fromIndex && currentIndex >= toIndex) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setIsProcessing(true);

      try {
        const compressedImages = await Promise.all(
          acceptedFiles.map(async (file) => {
            if (file.size > 15 * 1024 * 1024) {
              showSnackbar(`${file.name} is ${formatFileSize(file.size)}. It will be compressed.`, 'warning');
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
        showSnackbar(`${compressedImages.length} image${compressedImages.length > 1 ? 's' : ''} added successfully`, 'success');
        setAddDialogOpen(false);
      } catch (error) {
        console.error('Error processing images:', error);
        showSnackbar('Failed to process images', 'error');
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
      showSnackbar('Please enter valid image URLs (starting with http:// or https://)', 'warning');
      return;
    }

    setAddingUrls(true);
    const validUrls: string[] = [];

    for (const url of urls) {
      const isValid = await validateImageUrl(url);
      if (isValid) {
        validUrls.push(url);
      } else {
        showSnackbar(`Invalid image URL: ${url}`, 'warning');
      }
    }

    if (validUrls.length > 0) {
      const newImages = [...localImages, ...validUrls];
      setLocalImages(newImages);
      onImagesChange?.(newImages);
      showSnackbar(`${validUrls.length} URL(s) added successfully`, 'success');
      setImageUrls('');
      setAddDialogOpen(false);
    } else {
      showSnackbar('No valid image URLs found', 'error');
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

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  if (localImages.length === 0) {
    return (
      <>
        <Box className="gallery-empty">
          <Typography color="textSecondary">No images</Typography>
          {isEditable && (
            <Button
              variant="outlined"
              startIcon={<AddPhotoAlternateIcon />}
              onClick={() => setAddDialogOpen(true)}
              sx={{ 
                borderColor: 'rgba(0,0,0,0.3)', 
                color: 'text.primary',
                '&:hover': { borderColor: 'rgba(0,0,0,0.5)' }
              }}
            >
              Add Images
            </Button>
          )}
        </Box>

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
          isAddingUrls={addingUrls}
        />

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </>
    );
  }

  return (
    <>
      <Box className="gallery-container">
        {/* Main Image */}
        <Box className="main-image-wrapper">
          <img 
            key={currentIndex}
            src={localImages[currentIndex]}
            alt={`${productName} - ${currentIndex + 1}`}
            className="main-image"
          />

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
                onClick={() => setAddDialogOpen(true)}
              >
                <AddPhotoAlternateIcon />
              </Box>
            </Tooltip>
          )}
        </Box>

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="processing-overlay">
            <div className="processing-content">
              <CircularProgress />
              <Typography>Processing images...</Typography>
            </div>
          </div>
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
        isAddingUrls={addingUrls}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

const AddImageDialog: React.FC<{
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
  isAddingUrls: boolean;
}> = ({
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
  isAddingUrls,
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
          disabled={isAddingUrls}
          label="Image URLs"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isAddingUrls}>Cancel</Button>
        <Button 
          onClick={handleAddUrls} 
          variant="contained" 
          startIcon={isAddingUrls ? <CircularProgress size={20} /> : <LinkIcon />}
          disabled={isAddingUrls || !imageUrls.trim()}
        >
          {isAddingUrls ? 'Validating URLs...' : 'Add URLs'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageGallery;