import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Chip,
  Button,
  Box,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tab,
  Tabs,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { appointmentService } from '../services/appointmentService';
import { Appointment } from '../types/appointment';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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

const MyAppointments: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; id: string; reason: string }>({
    open: false,
    id: '',
    reason: ''
  });

  const isRtl = i18n.language === 'ar';

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const data = await appointmentService.getMyAppointments();
      setAppointments(data);
    } catch (error) {
      toast.error(t('appointments.loadError') || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      await appointmentService.cancelAppointment(cancelDialog.id, cancelDialog.reason);
      toast.success(t('appointments.cancelSuccess') || 'Appointment cancelled successfully');
      setCancelDialog({ open: false, id: '', reason: '' });
      fetchAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('appointments.cancelError') || 'Failed to cancel appointment');
    }
  };

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsDialogOpen(false);
    setSelectedAppointment(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  const filterAppointments = (status: string) => {
    if (status === 'all') return appointments;
    return appointments.filter(apt => apt.status === status);
  };

  const renderAppointments = (appointmentsList: Appointment[]) => {
    if (appointmentsList.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          {t('appointments.noAppointments')}
        </Alert>
      );
    }

    return (
      <Grid container spacing={3}>
        {appointmentsList.map((apt) => (
          <Grid item xs={12} key={apt._id}>
            <Card elevation={2}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t('appointments.dateTime')}
                    </Typography>
                    <Typography variant="body1">
                      {format(new Date(apt.date), 'MMM d, yyyy')}
                    </Typography>
                    <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                      {apt.timeSlot}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t('appointments.consultationType')}
                    </Typography>
                    <Typography variant="body1">
                      {t(`appointments.${apt.consultationType}`)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('appointments.withDesigner')}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t('common.status')}
                    </Typography>
                    <Chip 
                      label={t(`appointments.${apt.status}`)}
                      color={getStatusColor(apt.status) as any}
                      size="small"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Box display="flex" gap={1} justifyContent={isRtl ? 'flex-start' : 'flex-end'}>
                      {apt.status === 'pending' && (
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => setCancelDialog({ open: true, id: apt._id, reason: '' })}
                        >
                          {t('common.cancel')}
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleViewDetails(apt)}
                      >
                        {t('common.details')}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
                
                {apt.notes && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      <strong>{t('appointments.notes')}:</strong> {apt.notes}
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        gap: 2,
        mb: 3 
      }}>
        <Typography variant="h4">
          {t('appointments.myAppointments')}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/book-appointment')}
          sx={{ 
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': { 
              bgcolor: 'primary.dark',
            },
            width: { xs: '100%', sm: 'auto' }
          }}
        >
          {t('appointments.bookNew')}
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={(_, v) => setTabValue(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <Tab label={t('common.all')} />
          <Tab label={t('appointments.pending')} />
          <Tab label={t('appointments.confirmed')} />
          <Tab label={t('appointments.completed')} />
          <Tab label={t('appointments.cancelled')} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {renderAppointments(filterAppointments('all'))}
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        {renderAppointments(filterAppointments('pending'))}
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        {renderAppointments(filterAppointments('confirmed'))}
      </TabPanel>
      <TabPanel value={tabValue} index={3}>
        {renderAppointments(filterAppointments('completed'))}
      </TabPanel>
      <TabPanel value={tabValue} index={4}>
        {renderAppointments(filterAppointments('cancelled'))}
      </TabPanel>

      {/* Cancel Dialog */}
      <Dialog 
        open={cancelDialog.open} 
        onClose={() => setCancelDialog({ open: false, id: '', reason: '' })}
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
          }
        }}
      >
        <DialogTitle>{t('appointments.cancelAppointment')}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={t('appointments.cancelReason')}
            value={cancelDialog.reason}
            onChange={(e) => setCancelDialog({ ...cancelDialog, reason: e.target.value })}
            margin="normal"
            multiline
            rows={2}
            placeholder={t('appointments.cancelReasonPlaceholder')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog({ open: false, id: '', reason: '' })}>
            {t('common.back')}
          </Button>
          <Button onClick={handleCancel} color="error" variant="contained">
            {t('appointments.confirmCancellation')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={handleCloseDetails}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
          }
        }}
      >
        <DialogTitle>
          {t('appointments.appointmentDetails')}
        </DialogTitle>
        <DialogContent dividers>
          {selectedAppointment && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Appointment ID */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t('appointments.appointmentId')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {selectedAppointment._id}
                </Typography>
              </Box>

              <Divider />

              {/* Date and Time */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t('appointments.dateTime')}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {format(new Date(selectedAppointment.date), 'EEEE, MMMM d, yyyy')}
                </Typography>
                <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                  {selectedAppointment.timeSlot}
                </Typography>
              </Box>

              <Divider />

              {/* Consultation Type */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t('appointments.consultationType')}
                </Typography>
                <Typography variant="body1">
                  {t(`appointments.${selectedAppointment.consultationType}`)}
                </Typography>
              </Box>

              {/* Status */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t('common.status')}
                </Typography>
                <Chip 
                  label={t(`appointments.${selectedAppointment.status}`)}
                  color={getStatusColor(selectedAppointment.status) as any}
                  size="medium"
                  sx={{ mt: 0.5 }}
                />
              </Box>

              {/* Notes */}
              {selectedAppointment.notes && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {t('appointments.notes')}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        mt: 0.5, 
                        p: 2, 
                        bgcolor: 'grey.50',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      {selectedAppointment.notes}
                    </Typography>
                  </Box>
                </>
              )}

              {/* Booking Date */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  {t('appointments.bookedOn')}: {format(new Date(selectedAppointment.createdAt), 'MMM d, yyyy \'at\' h:mm a')}
                </Typography>
              </Box>

              {/* Last Updated */}
              {selectedAppointment.updatedAt && selectedAppointment.updatedAt !== selectedAppointment.createdAt && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('appointments.lastUpdated')}: {format(new Date(selectedAppointment.updatedAt), 'MMM d, yyyy \'at\' h:mm a')}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleCloseDetails} variant="outlined">
            {t('common.close')}
          </Button>
          {selectedAppointment?.status === 'pending' && (
            <Button 
              onClick={() => {
                handleCloseDetails();
                setCancelDialog({ open: true, id: selectedAppointment._id, reason: '' });
              }} 
              color="error" 
              variant="contained"
            >
              {t('common.cancel')}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyAppointments;