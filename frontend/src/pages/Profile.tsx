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
  Avatar
} from '@mui/material';
import { useTheme } from '@mui/material/styles'; // ADD THIS IMPORT
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
import '../styles/profile.css';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
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
  const theme = useTheme(); // ADD THIS LINE
  const mode = theme.palette.mode; // ADD THIS LINE
  const { user } = useAuth();
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

  // Dialog for adding/editing experience – fixed type (description optional)
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
      toast.error('Failed to load profile');
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
      toast.success('Profile updated');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.error || 'Failed to update profile');
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
        // Determine file type for storage
        let fileType: 'cv' | 'portfolio' | 'certificate' = 'portfolio';
        if (file.name.endsWith('.pdf')) fileType = 'cv';
        else if (file.type.startsWith('image/')) fileType = 'portfolio';
        // Additional logic for certificates could be added

        try {
          await profileService.uploadFile({
            name: file.name,
            type: fileType,
            url: base64,
            size: file.size
          });
          toast.success(`${file.name} uploaded`);
          fetchProfile(); // refresh
        } catch (error: any) {
          console.error('❌ Upload error details:', error.response?.data || error.message);
          const errorMsg = error.response?.data?.error || error.message || 'Failed to upload';
          toast.error(`Failed to upload ${file.name}: ${errorMsg}`);
        }
      };
      reader.readAsDataURL(file);
    });
  }, []);

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
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      await profileService.deleteFile(fileId);
      toast.success('File deleted');
      fetchProfile();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete file');
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
          <Box display="flex" alignItems="center">
            <Avatar 
              sx={{ 
                width: 64, 
                height: 64, 
                bgcolor: mode === 'dark' ? 'primary.dark' : 'primary.main',
                color: mode === 'dark' ? '#000' : '#fff',
                mr: 2, 
                fontSize: '2rem' 
              }}
            >
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Avatar>
            <Box>
              <Typography variant="h4">
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {user?.email} · {user?.role}
              </Typography>
            </Box>
          </Box>
          {!editMode ? (
            <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setEditMode(true)}>
              Edit Profile
            </Button>
          ) : (
            <Box>
              <Button variant="contained" onClick={handleSaveProfile} disabled={loading} sx={{ mr: 1 }}>
                Save
              </Button>
              <Button variant="outlined" onClick={() => {
                setEditMode(false);
                // revert changes
                if (profile) {
                  setBio(profile.bio || '');
                  setSkills(profile.skills || []);
                  setExperience(profile.experience || []);
                  setEducation(profile.education || []);
                }
              }}>
                Cancel
              </Button>
            </Box>
          )}
        </Box>

        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
          <Tab label="Profile Info" />
          <Tab label="CV & Portfolio" />
        </Tabs>

        {/* Tab 1: Profile Info */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bio"
                multiline
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={!editMode}
                placeholder="Tell us about yourself, your experience, and your design philosophy..."
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Skills
              </Typography>
              {editMode ? (
                <>
                  <TextField
                    fullWidth
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleAddSkill}
                    placeholder="Type a skill and press Enter (e.g., Fashion Design, Sketching)"
                  />
                  <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {skills.map(skill => (
                      <Chip
                        key={skill}
                        label={skill}
                        onDelete={() => removeSkill(skill)}
                      />
                    ))}
                  </Box>
                </>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {skills.length > 0 ? skills.map(skill => (
                    <Chip key={skill} label={skill} />
                  )) : <Typography color="text.secondary">No skills added</Typography>}
                </Box>
              )}
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Experience
              </Typography>
              {editMode && (
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => setExpDialog({ open: true, editIndex: -1, data: { title: '', company: '', years: '', description: '' } })}
                  sx={{ mb: 2 }}
                >
                  Add Experience
                </Button>
              )}
              <List>
                {experience.map((exp, index) => (
                  <React.Fragment key={index}>
                    <ListItem
                      secondaryAction={editMode && (
                        <IconButton edge="end" onClick={() => setExpDialog({ open: true, editIndex: index, data: exp })}>
                          <EditIcon />
                        </IconButton>
                      )}
                    >
                      <ListItemText
                        primary={`${exp.title} at ${exp.company}`}
                        secondary={`${exp.years} · ${exp.description || ''}`}
                      />
                    </ListItem>
                    {index < experience.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
                {experience.length === 0 && <Typography color="text.secondary">No experience added</Typography>}
              </List>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Education
              </Typography>
              {editMode && (
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => setEduDialog({ open: true, editIndex: -1, data: { degree: '', institution: '', year: '' } })}
                  sx={{ mb: 2 }}
                >
                  Add Education
                </Button>
              )}
              <List>
                {education.map((edu, index) => (
                  <React.Fragment key={index}>
                    <ListItem
                      secondaryAction={editMode && (
                        <IconButton edge="end" onClick={() => setEduDialog({ open: true, editIndex: index, data: edu })}>
                          <EditIcon />
                        </IconButton>
                      )}
                    >
                      <ListItemText
                        primary={`${edu.degree} at ${edu.institution}`}
                        secondary={edu.year}
                      />
                    </ListItem>
                    {index < education.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
                {education.length === 0 && <Typography color="text.secondary">No education added</Typography>}
              </List>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 2: CV & Portfolio */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box
                {...getRootProps()}
                sx={{
                  border: '2px dashed',
                  borderColor: isDragActive ? 'primary.main' : mode === 'dark' ? 'rgba(255,255,255,0.3)' : '#ccc',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  bgcolor: isDragActive ? 'action.hover' : 'transparent',
                  mb: 3
                }}
              >
                <input {...getInputProps()} />
                <CloudUploadIcon sx={{ fontSize: 48, color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : '#ccc', mb: 2 }} />
                <Typography>
                  {isDragActive ? 'Drop files here...' : 'Drag & drop files or click to upload'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Supports: Images, PDF, DOC, DOCX (Max 10MB each)
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Uploaded Files</Typography>
              {profile?.files && profile.files.length > 0 ? (
                <Grid container spacing={2}>
                  {profile.files.map((file) => (
                    <Grid item xs={12} sm={6} md={4} key={file._id}>
                      <Card>
                        {file.type === 'portfolio' && file.url.startsWith('data:image') ? (
                          <CardMedia
                            component="img"
                            height="140"
                            image={file.url}
                            alt={file.name}
                          />
                        ) : (
                          <Box
                            sx={{
                              height: 140,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: mode === 'dark' ? '#2d2d2d' : '#f5f5f5'
                            }}
                          >
                            {file.type === 'cv' ? (
                              <PictureAsPdfIcon sx={{ fontSize: 60, color: '#d32f2f' }} />
                            ) : (
                              <ImageIcon sx={{ fontSize: 60, color: mode === 'dark' ? '#aaa' : '#999' }} />
                            )}
                          </Box>
                        )}
                        <CardContent>
                          <Typography noWrap variant="body2">{file.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatFileSize(file.size)} · {format(new Date(file.uploadedAt), 'MMM d, yyyy')}
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <IconButton size="small" onClick={() => { setPreviewFile(file); setPreviewOpen(true); }}>
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteFile(file._id)}>
                            <DeleteIcon />
                          </IconButton>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Alert severity="info">No files uploaded yet.</Alert>
              )}
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>File Preview</DialogTitle>
        <DialogContent>
          {previewFile && (
            previewFile.url.startsWith('data:image') ? (
              <img
                src={previewFile.url}
                alt={previewFile.name}
                className="profile-preview-image"
              />
            ) : (
              <iframe
                src={previewFile.url}
                title={previewFile.name}
                className="profile-preview-iframe"
              />
            )
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Experience Dialog */}
      <Dialog open={expDialog.open} onClose={() => setExpDialog({ ...expDialog, open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>{expDialog.editIndex === -1 ? 'Add Experience' : 'Edit Experience'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={expDialog.data.title}
            onChange={(e) => setExpDialog({ ...expDialog, data: { ...expDialog.data, title: e.target.value } })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Company"
            value={expDialog.data.company}
            onChange={(e) => setExpDialog({ ...expDialog, data: { ...expDialog.data, company: e.target.value } })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Years"
            value={expDialog.data.years}
            onChange={(e) => setExpDialog({ ...expDialog, data: { ...expDialog.data, years: e.target.value } })}
            margin="normal"
            placeholder="e.g., 2020-2023 or 3 years"
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={expDialog.data.description || ''}
            onChange={(e) => setExpDialog({ ...expDialog, data: { ...expDialog.data, description: e.target.value } })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExpDialog({ ...expDialog, open: false })}>Cancel</Button>
          <Button onClick={() => {
            if (expDialog.editIndex === -1) {
              setExperience([...experience, expDialog.data]);
            } else {
              const newExp = [...experience];
              newExp[expDialog.editIndex] = expDialog.data;
              setExperience(newExp);
            }
            setExpDialog({ open: false, editIndex: -1, data: { title: '', company: '', years: '', description: '' } });
          }} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Education Dialog */}
      <Dialog open={eduDialog.open} onClose={() => setEduDialog({ ...eduDialog, open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>{eduDialog.editIndex === -1 ? 'Add Education' : 'Edit Education'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Degree"
            value={eduDialog.data.degree}
            onChange={(e) => setEduDialog({ ...eduDialog, data: { ...eduDialog.data, degree: e.target.value } })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Institution"
            value={eduDialog.data.institution}
            onChange={(e) => setEduDialog({ ...eduDialog, data: { ...eduDialog.data, institution: e.target.value } })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Year"
            value={eduDialog.data.year}
            onChange={(e) => setEduDialog({ ...eduDialog, data: { ...eduDialog.data, year: e.target.value } })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEduDialog({ ...eduDialog, open: false })}>Cancel</Button>
          <Button onClick={() => {
            if (eduDialog.editIndex === -1) {
              setEducation([...education, eduDialog.data]);
            } else {
              const newEdu = [...education];
              newEdu[eduDialog.editIndex] = eduDialog.data;
              setEducation(newEdu);
            }
            setEduDialog({ open: false, editIndex: -1, data: { degree: '', institution: '', year: '' } });
          }} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;