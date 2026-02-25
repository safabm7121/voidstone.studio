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
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
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
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      await appointmentService.cancelAppointment(cancelDialog.id, cancelDialog.reason);
      toast.success('Appointment cancelled successfully');
      setCancelDialog({ open: false, id: '', reason: '' });
      fetchAppointments();
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

  const filterAppointments = (status: string) => {
    if (status === 'all') return appointments;
    return appointments.filter(apt => apt.status === status);
  };

  const renderAppointments = (appointmentsList: Appointment[]) => {
    if (appointmentsList.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No appointments found.
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
                      Date & Time
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
                      Consultation Type
                    </Typography>
                    <Typography variant="body1">
                      {apt.consultationType}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      with Voidstone Studio
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip 
                      label={apt.status.toUpperCase()}
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
                          Cancel
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          console.log('View details for appointment:', apt._id);
                        }}
                      >
                        Details
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
                
                {apt.notes && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      <strong>Notes:</strong> {apt.notes}
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
          My Appointments
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
          Book New Appointment
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
          <Tab label="All" />
          <Tab label="Pending" />
          <Tab label="Confirmed" />
          <Tab label="Completed" />
          <Tab label="Cancelled" />
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

      <Dialog 
        open={cancelDialog.open} 
        onClose={() => setCancelDialog({ open: false, id: '', reason: '' })}
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
          }
        }}
      >
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

export default MyAppointments;