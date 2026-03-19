import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Tooltip,
  Badge,
  Button
} from '@mui/material';
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

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  productName,
  onImagesChange,
  isEditable = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localImages, setLocalImages] = useState(images);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % localImages.length);
  };

  const handlePrev = () => {
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
  };

  const handleAddImage = () => {
    // Add your image upload logic here
    toast.info('Image upload functionality');
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
          >
            Add Images
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box className="gallery-container">
      {/* Main Image */}
      <Box className="main-image-wrapper">
        <img
          src={localImages[currentIndex]}
          alt={`${productName} - ${currentIndex + 1}`}
          className="main-image"
        />

        {/* Navigation Arrows - Always Visible */}
        {localImages.length > 1 && (
          <>
            <Tooltip title="Previous">
              <IconButton
                onClick={handlePrev}
                className="nav-arrow left"
              >
                <ChevronLeftIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Next">
              <IconButton
                onClick={handleNext}
                className="nav-arrow right"
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