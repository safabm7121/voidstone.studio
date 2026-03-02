import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Tabs,
  Tab,
  Box,
  TextField,
  Button,
  Chip,
  IconButton,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../context/AuthContext';
import { profileService, ProfileData } from '../services/profileService';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import '../styles/profile.css';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && <Box sx={{ pt: { xs: 2, sm: 3 } }}>{children}</Box>}
    </div>
  );
};

// Helper to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const Profile: React.FC = () => {
  const theme = useTheme();
  const mode = theme.palette.mode;
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Profile info state
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [experience, setExperience] = useState<ProfileData['experience']>([]);
  const [education, setEducation] = useState<ProfileData['education']>([]);

  // File preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);

  // Dialog for adding/editing experience
  const [expDialog, setExpDialog] = useState<{
    open: boolean;
    editIndex: number;
    data: {
      title: string;
      company: string;
      years: string;
      description?: string;
    };
  }>({
    open: false,
    editIndex: -1,
    data: { title: '', company: '', years: '', description: '' }
  });

  // Dialog for adding/editing education
  const [eduDialog, setEduDialog] = useState<{
    open: boolean;
    editIndex: number;
    data: {
      degree: string;
      institution: string;
      year: string;
    };
  }>({
    open: false,
    editIndex: -1,
    data: { degree: '', institution: '', year: '' }
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await profileService.getProfile();
      setProfile(data.profile);
      setBio(data.profile.bio || '');
      setSkills(data.profile.skills || []);
      setExperience(data.profile.experience || []);
      setEducation(data.profile.education || []);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast.error(t('profile.loadError') || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const updated = await profileService.updateProfile({
        bio,
        skills,
        experience,
        education
      });
      setProfile(updated.profile);
      setEditMode(false);
      toast.success(t('profile.updateSuccess') || 'Profile updated');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.error || t('profile.updateError') || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Drag & Drop for files
  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        let fileType: 'cv' | 'portfolio' | 'certificate' = 'portfolio';
        if (file.name.endsWith('.pdf')) fileType = 'cv';
        else if (file.type.startsWith('image/')) fileType = 'portfolio';

        try {
          await profileService.uploadFile({
            name: file.name,
            type: fileType,
            url: base64,
            size: file.size
          });
          toast.success(`${file.name} ${t('profile.uploaded')}`);
          fetchProfile();
        } catch (error: any) {
          console.error('Upload error:', error.response?.data || error.message);
          const errorMsg = error.response?.data?.error || error.message || t('profile.uploadError');
          toast.error(`${t('profile.uploadFailed')} ${file.name}: ${errorMsg}`);
        }
      };
      reader.readAsDataURL(file);
    });
  }, [t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: true
  });

  const handleDeleteFile = async (fileId: string) => {
    if (!window.confirm(t('profile.confirmDelete'))) return;
    try {
      await profileService.deleteFile(fileId);
      toast.success(t('profile.deleteSuccess'));
      fetchProfile();
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('profile.deleteError'));
    }
  };

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!skills.includes(skillInput.trim())) {
        setSkills([...skills, skillInput.trim()]);
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  return (
    <Container
      maxWidth="lg"
      className="profile-container"
      disableGutters={isMobile}
      sx={{
        py: { xs: 1, sm: 2, md: 4 },
        px: { xs: 1, sm: 2, md: 3 }
      }}
    >
      <Paper
        elevation={3}
        className="profile-paper"
        sx={{
          p: { xs: 1.5, sm: 2, md: 3, lg: 4 },
          width: '100%',
          borderRadius: { xs: 1, sm: 2 }
        }}
      >
        {/* Header Section */}
        <Box
          className="profile-header"
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            gap: { xs: 2, sm: 3 },
            mb: { xs: 2, sm: 3, md: 4 }
          }}
        >
          {/* User Info */}
          <Box
            className="profile-user-section"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1.5, sm: 2, md: 3 }
            }}
          >
            <Avatar
              className="profile-avatar"
              sx={{
                width: { xs: 48, sm: 56, md: 64, lg: 72 },
                height: { xs: 48, sm: 56, md: 64, lg: 72 },
                bgcolor: mode === 'dark' ? 'primary.dark' : 'primary.main',
                color: mode === 'dark' ? '#000' : '#fff',
                fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem', lg: '2rem' },
                flexShrink: 0
              }}
            >
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Avatar>

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="h4"
                sx={{
                  fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem', lg: '2rem' },
                  fontWeight: 600,
                  lineHeight: 1.2,
                  mb: 0.5,
                  wordBreak: 'break-word',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: { xs: 2, sm: 1 },
                  WebkitBoxOrient: 'vertical'
                }}
              >
                {user?.firstName} {user?.lastName}
              </Typography>

              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.9rem', lg: '1rem' },
                  wordBreak: 'break-word',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: { xs: 'normal', sm: 'nowrap' }
                }}
              >
                {user?.email} · {user?.role}
              </Typography>
            </Box>
          </Box>

          {/* Button Section - FIXED for mobile */}
          <Box
            className="profile-button-container"
            sx={{
              width: { xs: '100%', sm: 'auto' },
              minWidth: { sm: 200 }
            }}
          >
            {!editMode ? (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setEditMode(true)}
                fullWidth={isMobile}
                sx={{
                  height: { xs: 40, sm: 36, md: 40 },
                  fontSize: { xs: '0.85rem', sm: '0.8rem', md: '0.875rem' },
                  whiteSpace: 'nowrap'
                }}
              >
                {t('profile.editProfile')}
              </Button>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  width: '100%',
                  flexDirection: { xs: 'row', sm: 'row' }
                }}
              >
                <Button
                  variant="contained"
                  onClick={handleSaveProfile}
                  disabled={loading}
                  fullWidth
                  sx={{
                    flex: 1,
                    height: { xs: 40, sm: 36, md: 40 },
                    fontSize: { xs: '0.85rem', sm: '0.8rem', md: '0.875rem' }
                  }}
                >
                  {t('common.save')}
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => {
                    setEditMode(false);
                    if (profile) {
                      setBio(profile.bio || '');
                      setSkills(profile.skills || []);
                      setExperience(profile.experience || []);
                      setEducation(profile.education || []);
                    }
                  }}
                  fullWidth
                  sx={{
                    flex: 1,
                    height: { xs: 40, sm: 36, md: 40 },
                    fontSize: { xs: '0.85rem', sm: '0.8rem', md: '0.875rem' }
                  }}
                >
                  {t('common.cancel')}
                </Button>
              </Box>
            )}
          </Box>
        </Box>

        {/* Tabs */}
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          variant={isMobile ? 'fullWidth' : 'standard'}
          sx={{
            mb: { xs: 1, sm: 2 },
            '& .MuiTab-root': {
              fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
              minHeight: { xs: 40, sm: 48 },
              py: { xs: 0.5, sm: 1 }
            }
          }}
        >
          <Tab label={t('profile.tabs.info')} />
          <Tab label={t('profile.tabs.files')} />
        </Tabs>

        {/* Tab 1: Profile Info */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('profile.bio')}
                multiline
                rows={isMobile ? 3 : 4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={!editMode}
                placeholder={t('profile.bioPlaceholder')}
                size={isMobile ? 'small' : 'medium'}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
                {t('profile.skills')}
              </Typography>
              {editMode ? (
                <>
                  <TextField
                    fullWidth
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleAddSkill}
                    placeholder={t('profile.skillsPlaceholder')}
                    size="small"
                  />
                  <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {skills.map(skill => (
                      <Chip
                        key={skill}
                        label={skill}
                        onDelete={() => removeSkill(skill)}
                        size="small"
                      />
                    ))}
                  </Box>
                </>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {skills.length > 0 ? skills.map(skill => (
                    <Chip key={skill} label={skill} size="small" />
                  )) : (
                    <Typography color="text.secondary" variant="body2">
                      {t('profile.noSkills')}
                    </Typography>
                  )}
                </Box>
              )}
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
                {t('profile.experience')}
              </Typography>
              {editMode && (
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => setExpDialog({ open: true, editIndex: -1, data: { title: '', company: '', years: '', description: '' } })}
                  sx={{ mb: 2 }}
                  size={isMobile ? 'small' : 'medium'}
                  fullWidth={isMobile}
                >
                  {t('profile.addExperience')}
                </Button>
              )}
              <List sx={{ width: '100%' }}>
                {experience.map((exp, index) => (
                  <React.Fragment key={index}>
                    <ListItem
                      sx={{
                        px: { xs: 0, sm: 1 },
                        py: { xs: 1, sm: 1.5 },
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        gap: { xs: 1, sm: 0 }
                      }}
                      secondaryAction={editMode && (
                        <IconButton
                          edge="end"
                          onClick={() => setExpDialog({ open: true, editIndex: index, data: exp })}
                          size="small"
                          sx={{ mt: { xs: 0, sm: 0 } }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="body1" sx={{ fontWeight: 500, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                            {`${exp.title} ${t('profile.at')} ${exp.company}`}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                              {exp.years}
                            </Typography>
                            {exp.description && (
                              <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                {exp.description}
                              </Typography>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                    {index < experience.length - 1 && <Divider sx={{ my: 1 }} />}
                  </React.Fragment>
                ))}
                {experience.length === 0 && (
                  <Typography color="text.secondary" variant="body2">
                    {t('profile.noExperience')}
                  </Typography>
                )}
              </List>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
                {t('profile.education')}
              </Typography>
              {editMode && (
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => setEduDialog({ open: true, editIndex: -1, data: { degree: '', institution: '', year: '' } })}
                  sx={{ mb: 2 }}
                  size={isMobile ? 'small' : 'medium'}
                  fullWidth={isMobile}
                >
                  {t('profile.addEducation')}
                </Button>
              )}
              <List sx={{ width: '100%' }}>
                {education.map((edu, index) => (
                  <React.Fragment key={index}>
                    <ListItem
                      sx={{
                        px: { xs: 0, sm: 1 },
                        py: { xs: 1, sm: 1.5 },
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        gap: { xs: 1, sm: 0 }
                      }}
                      secondaryAction={editMode && (
                        <IconButton
                          edge="end"
                          onClick={() => setEduDialog({ open: true, editIndex: index, data: edu })}
                          size="small"
                          sx={{ mt: { xs: 0, sm: 0 } }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="body1" sx={{ fontWeight: 500, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                            {`${edu.degree} ${t('profile.at')} ${edu.institution}`}
                          </Typography>
                        }
                        secondary={
                          <Typography component="span" variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                            {edu.year}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < education.length - 1 && <Divider sx={{ my: 1 }} />}
                  </React.Fragment>
                ))}
                {education.length === 0 && (
                  <Typography color="text.secondary" variant="body2">
                    {t('profile.noEducation')}
                  </Typography>
                )}
              </List>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 2: CV & Portfolio */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid item xs={12}>
              <Box
                {...getRootProps()}
                sx={{
                  border: '2px dashed',
                  borderColor: isDragActive ? 'primary.main' : mode === 'dark' ? 'rgba(255,255,255,0.3)' : '#ccc',
                  borderRadius: 2,
                  p: { xs: 2, sm: 3, md: 4 },
                  textAlign: 'center',
                  cursor: 'pointer',
                  bgcolor: isDragActive ? 'action.hover' : 'transparent',
                  mb: { xs: 2, sm: 3 }
                }}
              >
                <input {...getInputProps()} />
                <CloudUploadIcon sx={{ fontSize: { xs: 32, sm: 40, md: 48 }, color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : '#ccc', mb: 1 }} />
                <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}>
                  {isDragActive ? t('profile.dropFiles') : t('profile.dragDrop')}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.75rem' }, display: 'block', mt: 0.5 }}>
                  {t('profile.fileSupport')}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' } }}>
                {t('profile.uploadedFiles')}
              </Typography>
              {profile?.files && profile.files.length > 0 ? (
                <Grid container spacing={{ xs: 1, sm: 2 }}>
                  {profile.files.map((file) => (
                    <Grid item xs={12} sm={6} md={4} key={file._id}>
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{
                          aspectRatio: '1/1',
                          bgcolor: mode === 'dark' ? 'grey.900' : 'grey.100',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {file.type === 'portfolio' && file.url.startsWith('data:image') ? (
                            <CardMedia
                              component="img"
                              height="140"
                              image={file.url}
                              alt={file.name}
                              sx={{ objectFit: 'cover' }}
                            />
                          ) : (
                            file.type === 'cv' ? (
                              <PictureAsPdfIcon sx={{ fontSize: 60, color: '#d32f2f' }} />
                            ) : (
                              <ImageIcon sx={{ fontSize: 60, color: mode === 'dark' ? '#aaa' : '#999' }} />
                            )
                          )}
                        </Box>
                        <CardContent sx={{ flexGrow: 1, p: { xs: 1, sm: 1.5, md: 2 } }}>
                          <Typography noWrap variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' } }}>
                            {file.name}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.75rem' } }}>
                              {formatFileSize(file.size)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.75rem' } }}>
                              {format(new Date(file.uploadedAt), 'MMM d, yyyy')}
                            </Typography>
                          </Box>
                        </CardContent>
                        <CardActions sx={{ p: { xs: 1, sm: 1.5, md: 2 }, pt: 0 }}>
                          <IconButton size="small" onClick={() => { setPreviewFile(file); setPreviewOpen(true); }}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteFile(file._id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Alert severity="info" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}>
                  {t('profile.noFiles')}
                </Alert>
              )}
            </Grid>
          </Grid>
        </TabPanel>

        {/* Preview Dialog */}
        <Dialog
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              m: { xs: 0, sm: 2 },
              borderRadius: { xs: 0, sm: 2 }
            }
          }}
        >
          <DialogTitle sx={{ fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' } }}>
            {t('profile.preview')}
          </DialogTitle>
          <DialogContent>
            {previewFile && (
              previewFile.url.startsWith('data:image') ? (
                <img className='imagess'
                  src={previewFile.url}
                  alt={previewFile.name}
                  
                />
              ) : (
                <iframe className='iframess'
                  src={previewFile.url}
                  title={previewFile.name}
                 
                />
              )
            )}
          </DialogContent>
          <DialogActions sx={{ p: { xs: 1, sm: 2 } }}>
            <Button onClick={() => setPreviewOpen(false)}>{t('common.close')}</Button>
          </DialogActions>
        </Dialog>

        {/* Experience Dialog */}
        <Dialog
          open={expDialog.open}
          onClose={() => setExpDialog({ ...expDialog, open: false })}
          maxWidth="sm"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              m: { xs: 0, sm: 2 },
              borderRadius: { xs: 0, sm: 2 }
            }
          }}
        >
          <DialogTitle sx={{ fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' } }}>
            {expDialog.editIndex === -1 ? t('profile.addExperience') : t('profile.editExperience')}
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label={t('profile.title')}
              value={expDialog.data.title}
              onChange={(e) => setExpDialog({ ...expDialog, data: { ...expDialog.data, title: e.target.value } })}
              margin="dense"
              size={isMobile ? 'small' : 'medium'}
            />
            <TextField
              fullWidth
              label={t('profile.company')}
              value={expDialog.data.company}
              onChange={(e) => setExpDialog({ ...expDialog, data: { ...expDialog.data, company: e.target.value } })}
              margin="dense"
              size={isMobile ? 'small' : 'medium'}
            />
            <TextField
              fullWidth
              label={t('profile.years')}
              value={expDialog.data.years}
              onChange={(e) => setExpDialog({ ...expDialog, data: { ...expDialog.data, years: e.target.value } })}
              margin="dense"
              placeholder={t('profile.yearsPlaceholder')}
              size={isMobile ? 'small' : 'medium'}
            />
            <TextField
              fullWidth
              label={t('profile.description')}
              multiline
              rows={isMobile ? 2 : 3}
              value={expDialog.data.description || ''}
              onChange={(e) => setExpDialog({ ...expDialog, data: { ...expDialog.data, description: e.target.value } })}
              margin="dense"
              size={isMobile ? 'small' : 'medium'}
            />
          </DialogContent>
          <DialogActions sx={{ p: { xs: 1, sm: 2 } }}>
            <Button onClick={() => setExpDialog({ ...expDialog, open: false })} size={isMobile ? 'small' : 'medium'}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => {
              if (expDialog.editIndex === -1) {
                setExperience([...experience, expDialog.data]);
              } else {
                const newExp = [...experience];
                newExp[expDialog.editIndex] = expDialog.data;
                setExperience(newExp);
              }
              setExpDialog({ open: false, editIndex: -1, data: { title: '', company: '', years: '', description: '' } });
            }} variant="contained" size={isMobile ? 'small' : 'medium'}>
              {t('common.save')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Education Dialog */}
        <Dialog
          open={eduDialog.open}
          onClose={() => setEduDialog({ ...eduDialog, open: false })}
          maxWidth="sm"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              m: { xs: 0, sm: 2 },
              borderRadius: { xs: 0, sm: 2 }
            }
          }}
        >
          <DialogTitle sx={{ fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' } }}>
            {eduDialog.editIndex === -1 ? t('profile.addEducation') : t('profile.editEducation')}
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label={t('profile.degree')}
              value={eduDialog.data.degree}
              onChange={(e) => setEduDialog({ ...eduDialog, data: { ...eduDialog.data, degree: e.target.value } })}
              margin="dense"
              size={isMobile ? 'small' : 'medium'}
            />
            <TextField
              fullWidth
              label={t('profile.institution')}
              value={eduDialog.data.institution}
              onChange={(e) => setEduDialog({ ...eduDialog, data: { ...eduDialog.data, institution: e.target.value } })}
              margin="dense"
              size={isMobile ? 'small' : 'medium'}
            />
            <TextField
              fullWidth
              label={t('profile.year')}
              value={eduDialog.data.year}
              onChange={(e) => setEduDialog({ ...eduDialog, data: { ...eduDialog.data, year: e.target.value } })}
              margin="dense"
              size={isMobile ? 'small' : 'medium'}
            />
          </DialogContent>
          <DialogActions sx={{ p: { xs: 1, sm: 2 } }}>
            <Button onClick={() => setEduDialog({ ...eduDialog, open: false })} size={isMobile ? 'small' : 'medium'}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => {
              if (eduDialog.editIndex === -1) {
                setEducation([...education, eduDialog.data]);
              } else {
                const newEdu = [...education];
                newEdu[eduDialog.editIndex] = eduDialog.data;
                setEducation(newEdu);
              }
              setEduDialog({ open: false, editIndex: -1, data: { degree: '', institution: '', year: '' } });
            }} variant="contained" size={isMobile ? 'small' : 'medium'}>
              {t('common.save')}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default Profile;