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
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { appointmentService } from '../services/appointmentService';
import { Appointment } from '../types/appointment';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminAppointments: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; id: string }>({
    open: false,
    id: ''
  });
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; id: string; reason: string }>({
    open: false,
    id: '',
    reason: ''
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchAllAppointments();
  }, [user, navigate]);

  const fetchAllAppointments = async () => {
    try {
      const data = await appointmentService.getAllAppointments();
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error(t('admin.appointments.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await appointmentService.confirmAppointment(id);
      toast.success(t('admin.appointments.confirmSuccess'));
      setConfirmDialog({ open: false, id: '' });
      fetchAllAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('admin.appointments.confirmError'));
    }
  };

  const handleCancel = async () => {
    try {
      await appointmentService.cancelAppointment(cancelDialog.id, cancelDialog.reason);
      toast.success(t('admin.appointments.cancelSuccess'));
      setCancelDialog({ open: false, id: '', reason: '' });
      fetchAllAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('admin.appointments.cancelError'));
    }
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

  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
  };

  const filteredAppointments = appointments.filter(apt => {
    if (statusFilter === 'all') return true;
    return apt.status === statusFilter;
  });

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        {t('admin.appointments.title')}
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>{t('admin.appointments.filterByStatus')}</InputLabel>
          <Select
            value={statusFilter}
            label={t('admin.appointments.filterByStatus')}
            onChange={handleStatusFilterChange}
          >
            <MenuItem value="all">{t('admin.appointments.all')}</MenuItem>
            <MenuItem value="pending">{t('admin.appointments.pending')}</MenuItem>
            <MenuItem value="confirmed">{t('admin.appointments.confirmed')}</MenuItem>
            <MenuItem value="cancelled">{t('admin.appointments.cancelled')}</MenuItem>
            <MenuItem value="completed">{t('admin.appointments.completed')}</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="body2" color="text.secondary">
          {t('admin.appointments.total', { count: filteredAppointments.length })}
        </Typography>
      </Box>

      {filteredAppointments.length === 0 ? (
        <Alert severity="info">{t('admin.appointments.noAppointments')}</Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredAppointments.map((apt) => (
            <Grid item xs={12} key={apt._id}>
              <Card elevation={2}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={2}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {t('admin.appointments.date')}
                      </Typography>
                      <Typography variant="body1">
                        {format(new Date(apt.date), 'MMM d, yyyy')}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={2}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {t('admin.appointments.time')}
                      </Typography>
                      <Typography variant="body1" color="primary">
                        {apt.timeSlot}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={3}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {t('admin.appointments.customer')}
                      </Typography>
                      <Typography variant="body1">
                        {apt.customerName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {apt.customerEmail}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={2}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {t('admin.appointments.type')}
                      </Typography>
                      <Chip 
                        label={t(`appointments.${apt.consultationType.toLowerCase()}`)}
                        size="small"
                        variant="outlined"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={1}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {t('admin.appointments.status')}
                      </Typography>
                      <Chip 
                        label={t(`admin.appointments.${apt.status}`)}
                        color={getStatusColor(apt.status) as any}
                        size="small"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={2}>
                      <Box display="flex" gap={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setSelectedAppointment(apt);
                            setDetailsOpen(true);
                          }}
                        >
                          {t('common.details')}
                        </Button>
                        {apt.status === 'pending' && (
                          <>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => setConfirmDialog({ open: true, id: apt._id })}
                            >
                              {t('admin.appointments.confirm')}
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => setCancelDialog({ open: true, id: apt._id, reason: '' })}
                            >
                              {t('admin.appointments.cancel')}
                            </Button>
                          </>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('admin.appointments.appointmentDetails')}</DialogTitle>
        <DialogContent>
          {selectedAppointment && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">{t('admin.appointments.customer')}</Typography>
              <Typography variant="body1" gutterBottom>{selectedAppointment.customerName}</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>{selectedAppointment.customerEmail}</Typography>
              
              {selectedAppointment.customerPhone && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>{t('admin.appointments.phone')}</Typography>
                  <Typography variant="body1" gutterBottom>{selectedAppointment.customerPhone}</Typography>
                </>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" color="text.secondary">{t('admin.appointments.appointment')}</Typography>
              <Typography variant="body1">{t('admin.appointments.dateLabel')}: {format(new Date(selectedAppointment.date), 'MMMM d, yyyy')}</Typography>
              <Typography variant="body1">{t('admin.appointments.timeLabel')}: {selectedAppointment.timeSlot}</Typography>
              <Typography variant="body1">{t('admin.appointments.typeLabel')}: {t(`appointments.${selectedAppointment.consultationType.toLowerCase()}`)}</Typography>
              <Chip 
                label={t(`admin.appointments.${selectedAppointment.status}`)}
                color={getStatusColor(selectedAppointment.status) as any}
                size="small"
                sx={{ mt: 1 }}
              />
              
              {selectedAppointment.notes && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>{t('admin.appointments.notes')}</Typography>
                  <Typography variant="body2" sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    {selectedAppointment.notes}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, id: '' })}>
        <DialogTitle>{t('admin.appointments.confirmTitle')}</DialogTitle>
        <DialogContent>
          <Typography>{t('admin.appointments.confirmMessage')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, id: '' })}>{t('common.cancel')}</Button>
          <Button 
            onClick={() => handleConfirm(confirmDialog.id)} 
            variant="contained" 
            color="success"
          >
            {t('admin.appointments.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialog.open} onClose={() => setCancelDialog({ open: false, id: '', reason: '' })}>
        <DialogTitle>{t('admin.appointments.cancelTitle')}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={t('appointments.cancelReasonPlaceholder')}
            value={cancelDialog.reason}
            onChange={(e) => setCancelDialog({ ...cancelDialog, reason: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog({ open: false, id: '', reason: '' })}>
            {t('common.back')}
          </Button>
          <Button onClick={handleCancel} color="error" variant="contained">
            {t('admin.appointments.confirmCancellation')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminAppointments;