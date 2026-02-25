// components/admin/HeroImageUpload.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import { useDropzone } from 'react-dropzone';
import { heroService } from '../../services/heroService';
import { toast } from 'react-toastify';

interface HeroImageUploadProps {
  open: boolean;
  onClose: () => void;
  currentImage?: string;
  onUploadSuccess: (imageData: string) => void;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const RECOMMENDED_SIZE = '50MB';

const HeroImageUpload: React.FC<HeroImageUploadProps> = ({
  open,
  onClose,
  currentImage,
  onUploadSuccess
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = (acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0].code === 'file-too-large') {
        setError(`File is too large. Maximum size is ${RECOMMENDED_SIZE}`);
      } else {
        setError(rejection.errors[0].message);
      }
      return;
    }

    const file = acceptedFiles[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file (JPEG, PNG, WebP, GIF)');
        return;
      }
      
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setError(`File size exceeds ${RECOMMENDED_SIZE}. Please compress the image.`);
        return;
      }

      setSelectedFile(file);
      setError(null);
      setUploadProgress(0);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif']
    },
    maxFiles: 1,
    multiple: false,
    maxSize: MAX_FILE_SIZE
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const result = await heroService.updateHeroImage(selectedFile);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        onUploadSuccess(result.imageData);
        toast.success('Hero image updated successfully');
        handleClose();
      }, 500);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      
      if (error.response?.status === 403) {
        toast.error('Only Voidstone Studio admin can change the hero image');
      } else if (error.response?.status === 413) {
        toast.error('File too large. Maximum size is 50MB.');
      } else {
        toast.error(error.response?.data?.error || 'Failed to upload image');
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!currentImage) return;
    
    if (window.confirm('Are you sure you want to delete the hero image? The default background will be used.')) {
      try {
        await heroService.deleteHeroImage();
        onUploadSuccess('');
        toast.success('Hero image deleted');
        handleClose();
      } catch (error: any) {
        console.error('Delete error:', error);
        if (error.response?.status === 403) {
          toast.error('Only Voidstone Studio admin can delete the hero image');
        } else {
          toast.error(error.response?.data?.error || 'Failed to delete image');
        }
      }
    }
  };

  const handleClose = () => {
    setPreview(null);
    setSelectedFile(null);
    setError(null);
    setUploadProgress(0);
    onClose();
  };

  const handleRemoveSelected = () => {
    setPreview(null);
    setSelectedFile(null);
    setError(null);
    setUploadProgress(0);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        bgcolor: '#f5f5f5',
        py: 2
      }}>
        <Box>
          <Typography variant="h6" component="div">
            Upload Hero Image
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Recommended size: 1920x1080px (16:9 ratio) • Max size: {RECOMMENDED_SIZE}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ py: 3 }}>
        <Box>
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 3 }} 
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {currentImage && !preview && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                Current Image:
              </Typography>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid #e0e0e0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <Box
                  component="img"
                  src={currentImage}
                  alt="Current hero"
                  sx={{
                    width: '100%',
                    maxHeight: 250,
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
              </Box>
            </Box>
          )}

          <Box
            {...getRootProps()}
            sx={{
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : error ? 'error.main' : '#ccc',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: isDragActive ? 'action.hover' : 'transparent',
              minHeight: preview ? 'auto' : 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover'
              }
            }}
          >
            <input {...getInputProps()} />
            {preview ? (
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Preview (new image):
                    </Typography>
                    {selectedFile && (
                      <Typography variant="caption" color="text.secondary">
                        Size: {formatFileSize(selectedFile.size)}
                      </Typography>
                    )}
                  </Box>
                  <Button 
                    size="small" 
                    color="error" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveSelected();
                    }}
                  >
                    Remove
                  </Button>
                </Box>
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid #e0e0e0'
                  }}
                >
                  <Box
                    component="img"
                    src={preview}
                    alt="Preview"
                    sx={{
                      width: '100%',
                      maxHeight: 300,
                      objectFit: 'contain',
                      display: 'block'
                    }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Click or drag to change image
                </Typography>
              </Box>
            ) : (
              <Box>
                <CloudUploadIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                <Typography variant="body1" gutterBottom>
                  {isDragActive ? 'Drop image here...' : 'Drag & drop an image or click to select'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Supports: JPG, PNG, WebP, GIF (Max {RECOMMENDED_SIZE})
                </Typography>
                <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 1 }}>
                  ⚠️ Only Voidstone Studio admin can upload images
                </Typography>
              </Box>
            )}
          </Box>

          {uploading && (
            <Box sx={{ mt: 3 }}>
              <LinearProgress 
                variant="determinate" 
                value={uploadProgress} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  bgcolor: '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: 'black'
                  }
                }} 
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                Uploading: {uploadProgress}%
              </Typography>
            </Box>
          )}

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Image Requirements:
            </Typography>
            <Typography variant="caption" component="div" color="text.secondary">
              • Minimum width: 1920px for best quality<br />
              • 16:9 aspect ratio recommended<br />
              • Maximum file size: {RECOMMENDED_SIZE}<br />
              • Supported formats: JPG, PNG, WebP, GIF<br />
              • Only Voidstone Studio admin can upload images
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, bgcolor: '#fafafa', borderTop: '1px solid #e0e0e0' }}>
        {currentImage && (
          <Button
            color="error"
            onClick={handleDelete}
            startIcon={<DeleteIcon />}
            disabled={uploading}
            variant="outlined"
            sx={{ mr: 'auto' }}
          >
            Delete Current
          </Button>
        )}
        <Button onClick={handleClose} disabled={uploading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          sx={{
            bgcolor: 'black',
            '&:hover': { bgcolor: '#333' },
            '&.Mui-disabled': { bgcolor: '#ccc' }
          }}
        >
          {uploading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} color="inherit" />
              <span>Uploading... {uploadProgress}%</span>
            </Box>
          ) : (
            'Upload Image'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HeroImageUpload;