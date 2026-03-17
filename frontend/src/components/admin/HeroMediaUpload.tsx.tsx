import React, { useState, useRef, useEffect } from 'react';
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
  LinearProgress,
  TextField,
  Tab,
  Tabs
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LinkIcon from '@mui/icons-material/Link';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { useDropzone } from 'react-dropzone';
import { heroService } from '../../services/heroService';
import { toast } from 'react-toastify';
import './HeroMediaUpload.css';

interface HeroMediaUploadProps {
  open: boolean;
  onClose: () => void;
  currentMedia?: string;
  currentMediaType?: string;
  onUploadSuccess: (mediaData: string, mediaType?: string) => void;
}

const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB
const RECOMMENDED_IMAGE_SIZE = '50MB';
const RECOMMENDED_VIDEO_SIZE = '200MB';

const HeroMediaUpload: React.FC<HeroMediaUploadProps> = ({
  open,
  onClose,
  currentMedia,
  currentMediaType,
  onUploadSuccess
}) => {
  const [tabValue, setTabValue] = useState(0); // 0 = upload, 1 = URL
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideo, setIsVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && preview && isVideo) {
      videoRef.current.muted = isMuted;
      videoRef.current.play().catch(e => console.log('Auto-play prevented:', e));
    }
  }, [preview, isVideo, isMuted]);

  const onDrop = (acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0].code === 'file-too-large') {
        const file = rejection.file;
        const isVideoFile = file.type.startsWith('video/');
        const maxSize = isVideoFile ? RECOMMENDED_VIDEO_SIZE : RECOMMENDED_IMAGE_SIZE;
        setError(`File is too large. Maximum size for ${isVideoFile ? 'videos' : 'images'} is ${maxSize}`);
      } else {
        setError(rejection.errors[0].message);
      }
      return;
    }

    const file = acceptedFiles[0];
    if (file) {
      const isValidImage = file.type.startsWith('image/');
      const isValidVideo = file.type.startsWith('video/');
      
      if (!isValidImage && !isValidVideo) {
        setError('Please upload an image (JPEG, PNG, WebP, GIF) or video (MP4, WebM, OGG, MOV) file');
        return;
      }
      
      const maxSize = file.type.startsWith('video/') ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
      if (file.size > maxSize) {
        const sizeLimit = file.type.startsWith('video/') ? RECOMMENDED_VIDEO_SIZE : RECOMMENDED_IMAGE_SIZE;
        setError(`File size exceeds ${sizeLimit}. Please compress the ${file.type.startsWith('video/') ? 'video' : 'image'}.`);
        return;
      }

      setSelectedFile(file);
      setError(null);
      setUploadProgress(0);
      setIsVideo(file.type.startsWith('video/'));
      setMediaUrl('');
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = () => {
    if (!mediaUrl.trim()) {
      setError('Please enter a URL');
      return;
    }

    // Simple URL validation
    const isValidUrl = mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://');
    if (!isValidUrl) {
      setError('Please enter a valid URL starting with http:// or https://');
      return;
    }

    // Try to determine if it's a video based on file extension
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
    const isVideoUrl = videoExtensions.some(ext => mediaUrl.toLowerCase().endsWith(ext));
    
    setPreview(mediaUrl);
    setIsVideo(isVideoUrl);
    setSelectedFile(null);
    setError(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'],
      'video/*': ['.mp4', '.webm', '.ogg', '.mov']
    },
    maxFiles: 1,
    multiple: false,
    maxSize: MAX_VIDEO_SIZE,
    disabled: tabValue !== 0 // Disable dropzone when on URL tab
  });

  const handleUpload = async () => {
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      let result;
      
      if (tabValue === 0 && selectedFile) {
        // Upload file
        result = await heroService.updateHeroImage(selectedFile);
      } else if (tabValue === 1 && preview) {
        // 🔥 FIX: For URL, send the URL directly - DO NOT FETCH THE FILE
        const mediaType = isVideo ? 'video/mp4' : 'image/jpeg';
        result = await heroService.updateHeroFromUrl(preview, mediaType);
      } else {
        throw new Error('No media selected');
      }
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        onUploadSuccess(result.imageData, result.imageType);
        toast.success(`Hero ${isVideo ? 'video' : 'image'} updated successfully`);
        handleClose();
      }, 500);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      
      if (error.response?.status === 403) {
        toast.error('Only Voidstone Studio admin can change the hero media');
      } else if (error.response?.status === 413) {
        toast.error('File too large. Maximum size for videos is 200MB, for images is 50MB.');
      } else {
        toast.error(error.response?.data?.error || 'Failed to upload media');
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!currentMedia) return;
    
    if (window.confirm('Are you sure you want to delete the hero media? The default background will be used.')) {
      try {
        await heroService.deleteHeroImage();
        onUploadSuccess('');
        toast.success('Hero media deleted');
        handleClose();
      } catch (error: any) {
        console.error('Delete error:', error);
        if (error.response?.status === 403) {
          toast.error('Only Voidstone Studio admin can delete the hero media');
        } else {
          toast.error(error.response?.data?.error || 'Failed to delete media');
        }
      }
    }
  };

  const handleClose = () => {
    setTabValue(0);
    setPreview(null);
    setSelectedFile(null);
    setMediaUrl('');
    setError(null);
    setUploadProgress(0);
    setIsMuted(true);
    onClose();
  };

  const handleRemoveSelected = () => {
    setPreview(null);
    setSelectedFile(null);
    setMediaUrl('');
    setError(null);
    setUploadProgress(0);
    setIsMuted(true);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isCurrentVideo = currentMediaType?.startsWith('video/');
  const dropzoneClasses = `dropzone ${isDragActive ? 'dropzone-active' : ''} ${error ? 'dropzone-error' : ''}`;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      classes={{ paper: 'hero-media-dialog' }}
    >
      <DialogTitle className="dialog-title">
        <Box>
          <Typography variant="h6" component="div">
            Upload Hero Media
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Images: 1920x1080px (16:9 ratio) • Max: {RECOMMENDED_IMAGE_SIZE}<br />
            Videos: MP4, WebM, OGG, MOV • Max: {RECOMMENDED_VIDEO_SIZE}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent className="dialog-content">
        <Box>
          {error && (
            <Alert 
              severity="error" 
              className="alert" 
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {currentMedia && !preview && (
            <Box className="media-container">
              <Typography variant="subtitle2" gutterBottom className="media-label">
                Current Media:
              </Typography>
              <Box className="media-box">
                {isCurrentVideo ? (
                  <video
                    src={currentMedia}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="media-video"
                  />
                ) : (
                  <Box
                    component="img"
                    src={currentMedia}
                    alt="Current hero"
                    className="media-image"
                  />
                )}
              </Box>
            </Box>
          )}

          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} className="media-tabs">
            <Tab icon={<CloudUploadIcon />} label="Upload File" />
            <Tab icon={<LinkIcon />} label="Enter URL" />
          </Tabs>

          {tabValue === 0 ? (
            // File Upload Tab
            <Box
              {...getRootProps()}
              className={dropzoneClasses}
            >
              <input {...getInputProps()} />
              {preview && !selectedFile ? (
                // This handles the case where we have a URL preview but switched back to upload tab
                <Box className="dropzone-content">
                  <Typography>Click or drag to select a file</Typography>
                </Box>
              ) : preview && selectedFile ? (
                <Box className="dropzone-content">
                  <Box className="preview-header">
                    <Box>
                      <Typography variant="body2" className="preview-title">
                        Preview (new {isVideo ? 'video' : 'image'}):
                      </Typography>
                      {selectedFile && (
                        <Typography variant="caption" className="file-size">
                          Size: {formatFileSize(selectedFile.size)}
                        </Typography>
                      )}
                    </Box>
                    <Box>
                      {isVideo && (
                        <IconButton 
                          size="small" 
                          onClick={toggleMute}
                          className="mute-button"
                        >
                          {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                        </IconButton>
                      )}
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
                  </Box>
                  <Box className="preview-box">
                    {isVideo ? (
                      <video
                        ref={videoRef}
                        src={preview}
                        autoPlay
                        loop
                        muted={isMuted}
                        playsInline
                        className="preview-media-video"
                      />
                    ) : (
                      <Box
                        component="img"
                        src={preview}
                        alt="Preview"
                        className="preview-media-image"
                      />
                    )}
                  </Box>
                  <Typography variant="caption" className="preview-caption">
                    Click or drag to change media
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <CloudUploadIcon className="upload-icon" />
                  <Typography variant="body1" gutterBottom>
                    {isDragActive ? 'Drop media here...' : 'Drag & drop an image or video or click to select'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Supports: Images (JPG, PNG, WebP, GIF) - Max {RECOMMENDED_IMAGE_SIZE}<br />
                    Videos (MP4, WebM, OGG, MOV) - Max {RECOMMENDED_VIDEO_SIZE}
                  </Typography>
                  <Typography variant="caption" className="warning-text">
                    ⚠️ Videos will auto-play on mute with mute/unmute toggle
                  </Typography>
                  <Typography variant="caption" className="warning-text-block">
                    ⚠️ Only Voidstone Studio admin can upload media
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            // URL Input Tab
            <Box className="url-tab">
              <TextField
                fullWidth
                variant="outlined"
                placeholder="https://example.com/video.mp4"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                disabled={uploading}
                helperText="Enter direct URL to image or video (MP4, WebM, MOV, JPG, PNG, etc.)"
              />
              <Button
                variant="contained"
                onClick={handleUrlSubmit}
                disabled={!mediaUrl.trim() || uploading}
                startIcon={<LinkIcon />}
                sx={{ mt: 2 }}
              >
                Preview URL
              </Button>

              {preview && !selectedFile && (
                <Box className="url-preview">
                  <Box className="preview-header">
                    <Typography variant="body2" className="preview-title">
                      Preview from URL:
                    </Typography>
                    <Button 
                      size="small" 
                      color="error" 
                      onClick={handleRemoveSelected}
                    >
                      Remove
                    </Button>
                  </Box>
                  <Box className="preview-box">
                    {isVideo ? (
                      <video
                        ref={videoRef}
                        src={preview}
                        autoPlay
                        loop
                        muted={isMuted}
                        playsInline
                        controls
                        className="preview-media-video"
                      />
                    ) : (
                      <Box
                        component="img"
                        src={preview}
                        alt="Preview"
                        className="preview-media-image"
                      />
                    )}
                  </Box>
                  {isVideo && (
                    <IconButton 
                      size="small" 
                      onClick={toggleMute}
                      className="mute-button-url"
                    >
                      {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                    </IconButton>
                  )}
                </Box>
              )}
            </Box>
          )}

          {uploading && (
            <Box className="progress-container">
              <LinearProgress 
                variant="determinate" 
                value={uploadProgress} 
                className="linear-progress"
              />
              <Typography variant="caption" className="progress-text">
                Uploading: {uploadProgress}%
              </Typography>
            </Box>
          )}

          <Box className="requirements">
            <Typography variant="body2" className="requirements-title">
              Media Requirements:
            </Typography>
            <Typography variant="caption" component="div" className="requirements-text">
              <strong>Images:</strong><br />
              • Minimum width: 1920px for best quality<br />
              • 16:9 aspect ratio recommended<br />
              • Maximum file size: {RECOMMENDED_IMAGE_SIZE}<br />
              • Supported formats: JPG, PNG, WebP, GIF<br /><br />
              <strong>Videos:</strong><br />
              • 16:9 aspect ratio recommended<br />
              • Maximum file size: {RECOMMENDED_VIDEO_SIZE}<br />
              • Supported formats: MP4, WebM, OGG, MOV<br />
              • Videos auto-play on mute with mute/unmute toggle<br /><br />
              • Only Voidstone Studio admin can upload media
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions className="dialog-actions">
        {currentMedia && (
          <Button
            color="error"
            onClick={handleDelete}
            startIcon={<DeleteIcon />}
            disabled={uploading}
            variant="outlined"
            className="delete-button"
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
          disabled={(!selectedFile && !preview) || uploading || (tabValue === 1 && !preview)}
          className="upload-button"
        >
          {uploading ? (
            <Box className="uploading-content">
              <CircularProgress size={20} color="inherit" />
              <span>Uploading... {uploadProgress}%</span>
            </Box>
          ) : (
            'Upload Media'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HeroMediaUpload;