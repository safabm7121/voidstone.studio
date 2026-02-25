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
import { appointmentService } from '../services/appointmentService';
import { Appointment } from '../types/appointment';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminAppointments: React.FC = () => {
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
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await appointmentService.confirmAppointment(id);
      toast.success('Appointment confirmed successfully');
      setConfirmDialog({ open: false, id: '' });
      fetchAllAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to confirm appointment');
    }
  };

  const handleCancel = async () => {
    try {
      await appointmentService.cancelAppointment(cancelDialog.id, cancelDialog.reason);
      toast.success('Appointment cancelled successfully');
      setCancelDialog({ open: false, id: '', reason: '' });
      fetchAllAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to cancel appointment');
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
        Admin Dashboard - Appointments
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select
            value={statusFilter}
            label="Filter by Status"
            onChange={handleStatusFilterChange}
          >
            <MenuItem value="all">All Appointments</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="confirmed">Confirmed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="body2" color="text.secondary">
          Total: {filteredAppointments.length} appointments
        </Typography>
      </Box>

      {filteredAppointments.length === 0 ? (
        <Alert severity="info">No appointments found.</Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredAppointments.map((apt) => (
            <Grid item xs={12} key={apt._id}>
              <Card elevation={2}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={2}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Date
                      </Typography>
                      <Typography variant="body1">
                        {format(new Date(apt.date), 'MMM d, yyyy')}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={2}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Time
                      </Typography>
                      <Typography variant="body1" color="primary">
                        {apt.timeSlot}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={3}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Customer
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
                        Type
                      </Typography>
                      <Chip 
                        label={apt.consultationType}
                        size="small"
                        variant="outlined"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={1}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Status
                      </Typography>
                      <Chip 
                        label={apt.status.toUpperCase()}
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
                          Details
                        </Button>
                        {apt.status === 'pending' && (
                          <>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => setConfirmDialog({ open: true, id: apt._id })}
                            >
                              Confirm
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => setCancelDialog({ open: true, id: apt._id, reason: '' })}
                            >
                              Cancel
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
        <DialogTitle>Appointment Details</DialogTitle>
        <DialogContent>
          {selectedAppointment && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Customer</Typography>
              <Typography variant="body1" gutterBottom>{selectedAppointment.customerName}</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>{selectedAppointment.customerEmail}</Typography>
              
              {selectedAppointment.customerPhone && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Phone</Typography>
                  <Typography variant="body1" gutterBottom>{selectedAppointment.customerPhone}</Typography>
                </>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" color="text.secondary">Appointment</Typography>
              <Typography variant="body1">Date: {format(new Date(selectedAppointment.date), 'MMMM d, yyyy')}</Typography>
              <Typography variant="body1">Time: {selectedAppointment.timeSlot}</Typography>
              <Typography variant="body1">Type: {selectedAppointment.consultationType}</Typography>
              <Chip 
                label={selectedAppointment.status}
                color={getStatusColor(selectedAppointment.status) as any}
                size="small"
                sx={{ mt: 1 }}
              />
              
              {selectedAppointment.notes && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Notes</Typography>
                  <Typography variant="body2" sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    {selectedAppointment.notes}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, id: '' })}>
        <DialogTitle>Confirm Appointment</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to confirm this appointment?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, id: '' })}>Cancel</Button>
          <Button 
            onClick={() => handleConfirm(confirmDialog.id)} 
            variant="contained" 
            color="success"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialog.open} onClose={() => setCancelDialog({ open: false, id: '', reason: '' })}>
        <DialogTitle>Cancel Appointment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Reason for cancellation (optional)"
            value={cancelDialog.reason}
            onChange={(e) => setCancelDialog({ ...cancelDialog, reason: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog({ open: false, id: '', reason: '' })}>
            Go Back
          </Button>
          <Button onClick={handleCancel} color="error" variant="contained">
            Confirm Cancellation
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminAppointments;