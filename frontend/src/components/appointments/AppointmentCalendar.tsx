import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { Availability, TimeSlot } from '../../types/appointment';
import { toast } from 'react-toastify';

const consultationTypes = [
  { value: 'consultation', label: 'General Consultation' },
  { value: 'design', label: 'Design Session' },
  { value: 'fitting', label: 'Fitting Appointment' },
  { value: 'custom', label: 'Custom Request' }
];

const AppointmentCalendar: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [bookingDialog, setBookingDialog] = useState(false);
  const [consultationType, setConsultationType] = useState('consultation');
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailability();
  }, [selectedDate]);

  const fetchAvailability = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const startDate = format(startOfWeek(selectedDate), 'yyyy-MM-dd');
      const endDate = format(addDays(startOfWeek(selectedDate), 7), 'yyyy-MM-dd');
      console.log('📅 Fetching availability:', { startDate, endDate });
      const data = await appointmentService.getAvailability(startDate, endDate);
      console.log('✅ Availability data:', data);
      setAvailability(data);
      
      if (data.length === 0) {
        setErrorMessage('No availability found for this week. Please try another date.');
      }
    } catch (error: any) {
      console.error('❌ Error fetching availability:', error);
      const errorMsg = error.response?.data?.error || 'Failed to load availability';
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (newDate: Date | null) => {
    if (newDate) {
      setSelectedDate(newDate);
      setSelectedSlot(null);
    }
  };

  const handleSlotClick = (slot: TimeSlot) => {
    if (!user) {
      toast.error('Please login to book an appointment');
      return;
    }
    setSelectedSlot(slot);
    setBookingDialog(true);
  };

  const handleBookAppointment = async () => {
    if (!user || !selectedSlot) return;
    
    setLoading(true);
    try {
      await appointmentService.bookAppointment({
        date: format(selectedDate, 'yyyy-MM-dd'),
        timeSlot: selectedSlot.time,
        consultationType,
        notes,
        customerPhone: phone,
        customerName: `${user.firstName} ${user.lastName}`
      });
      
      toast.success('Appointment booked successfully! Check your email for confirmation.');
      setBookingDialog(false);
      
      // Reset form
      setConsultationType('consultation');
      setNotes('');
      setPhone('');
      setSelectedSlot(null);
      
      // Refresh availability
      await fetchAvailability();
    } catch (error: any) {
      console.error('❌ Error booking appointment:', error);
      const errorMsg = error.response?.data?.error || 'Failed to book appointment';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getSlotsForDate = (date: Date): TimeSlot[] => {
    const dayAvailability = availability.find(a => 
      isSameDay(new Date(a.date), date)
    );
    return dayAvailability?.slots || [];
  };

  const slotsForSelectedDate = getSlotsForDate(selectedDate);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper elevation={3} sx={{ p: 3, maxWidth: 800, mx: 'auto', my: 4 }}>
        <Typography variant="h5" gutterBottom align="center">
          Book an Appointment with Voidstone Studio
        </Typography>
        
        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
          Schedule a consultation with our design team (Weekdays 10AM - 4PM)
        </Typography>

        <DatePicker
          label="Select Date"
          value={selectedDate}
          onChange={handleDateChange}
          slotProps={{ 
            textField: { 
              fullWidth: true, 
              sx: { mb: 3 },
              size: 'small'
            } 
          }}
          minDate={new Date()}
        />

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            <Typography variant="subtitle1" gutterBottom fontWeight={500}>
              Available Time Slots for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </Typography>
            
            {errorMessage && !slotsForSelectedDate.length ? (
              <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
                {errorMessage}
              </Alert>
            ) : (
              <Grid container spacing={1} sx={{ mt: 1 }}>
                {slotsForSelectedDate.map((slot, index) => (
                  <Grid item xs={6} sm={4} md={3} key={index}>
                    <Button
                      variant={slot.isAvailable ? 'outlined' : 'contained'}
                      color={slot.isAvailable ? 'primary' : 'error'}
                      disabled={!slot.isAvailable}
                      fullWidth
                      onClick={() => handleSlotClick(slot)}
                      sx={{ 
                        py: 1,
                        fontSize: '0.9rem',
                        fontWeight: 500
                      }}
                    >
                      {slot.time}
                    </Button>
                  </Grid>
                ))}
                
                {slotsForSelectedDate.length === 0 && !errorMessage && (
                  <Grid item xs={12}>
                    <Alert severity="info" sx={{ mt: 2 }}>
                      No available slots for this date. Please select another date.
                    </Alert>
                  </Grid>
                )}
              </Grid>
            )}
          </Box>
        )}

        {/* Booking Dialog */}
        <Dialog open={bookingDialog} onClose={() => setBookingDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ bgcolor: '#000', color: 'white' }}>
            Confirm Your Appointment
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Appointment Details
              </Typography>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#f9f9f9' }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Date</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Time</Typography>
                    <Typography variant="body2" fontWeight={500} color="primary">
                      {selectedSlot?.time}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                Consultation Type
              </Typography>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <Select
                  value={consultationType}
                  onChange={(e) => setConsultationType(e.target.value)}
                >
                  {consultationTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Your Information
              </Typography>
              
              <TextField
                fullWidth
                label="Full Name"
                value={`${user?.firstName || ''} ${user?.lastName || ''}`}
                margin="dense"
                size="small"
                disabled
                InputProps={{ readOnly: true }}
              />
              
              <TextField
                fullWidth
                label="Email"
                value={user?.email || ''}
                margin="dense"
                size="small"
                disabled
                InputProps={{ readOnly: true }}
              />
              
              <TextField
                fullWidth
                label="Phone Number (Optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                margin="dense"
                size="small"
                placeholder="+216 XX XXX XXX"
              />
              
              <TextField
                fullWidth
                label="Notes (Optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                margin="dense"
                multiline
                rows={2}
                size="small"
                placeholder="Any special requests for the design team"
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: '#f5f5f5' }}>
            <Button onClick={() => setBookingDialog(false)} variant="outlined">
              Cancel
            </Button>
            <Button 
              onClick={handleBookAppointment} 
              variant="contained"
              disabled={loading}
              sx={{ bgcolor: '#000', '&:hover': { bgcolor: '#333' } }}
            >
              {loading ? 'Processing...' : 'Confirm Booking'}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </LocalizationProvider>
  );
};

export default AppointmentCalendar;