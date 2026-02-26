import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Box,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, isSameDay, startOfMonth, endOfMonth } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { appointmentService } from '../services/appointmentService';
import { Availability, TimeSlot } from '../types/appointment';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const steps = ['step1', 'step2'];

const consultationTypes = [
  { value: 'consultation', label: 'consultation' },
  { value: 'design', label: 'design' },
  { value: 'fitting', label: 'fitting' },
  { value: 'custom', label: 'custom' }
];

const BookAppointment: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [bookingDialog, setBookingDialog] = useState(false);
  const [consultationType, setConsultationType] = useState('consultation');
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState('');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  // Fetch availability when month changes
  useEffect(() => {
    fetchAvailabilityForMonth();
  }, [currentMonth]);

  // Update current month when selected date changes
  useEffect(() => {
    if (
      selectedDate.getMonth() !== currentMonth.getMonth() ||
      selectedDate.getFullYear() !== currentMonth.getFullYear()
    ) {
      setCurrentMonth(selectedDate);
    }
  }, [selectedDate]);

  const fetchAvailabilityForMonth = async () => {
    setLoading(true);
    try {
      const firstDay = startOfMonth(currentMonth);
      const lastDay = endOfMonth(currentMonth);

      const startDate = format(firstDay, 'yyyy-MM-dd');
      const endDate = format(lastDay, 'yyyy-MM-dd');

      console.log(' Fetching availability for month:', {
        month: format(currentMonth, 'MMMM yyyy'),
        startDate,
        endDate
      });

      const data = await appointmentService.getAvailability(startDate, endDate);
      console.log(' Availability data received:', data);
      setAvailability(data);
    } catch (error) {
      console.error(' Error fetching availability:', error);
      toast.error(t('appointments.loadError') || 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (!selectedSlot) {
        toast.error(t('appointments.selectSlotError') || 'Please select a time slot');
        return;
      }
      setActiveStep(1);
    }
  };

  const handleBack = () => {
    setActiveStep(0);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    console.log(' Selected slot:', slot);
    setSelectedSlot(slot);
  };

  const handleBookAppointment = async () => {
    if (!user) {
      toast.error(t('appointments.loginRequired') || 'You must be logged in');
      navigate('/login');
      return;
    }

    if (!selectedSlot) {
      toast.error(t('appointments.noSlotSelected') || 'No time slot selected');
      setBookingDialog(false);
      return;
    }

    console.log(' Starting booking process...');

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error(t('appointments.sessionExpired') || 'Session expired. Please login again.');
        navigate('/login');
        return;
      }

      const bookingData = {
        date: format(selectedDate, 'yyyy-MM-dd'),
        timeSlot: selectedSlot.time,
        consultationType,
        notes,
        customerPhone: phone,
        customerName: `${user.firstName} ${user.lastName}`
      };

      console.log(' Sending booking data:', bookingData);

      const response = await appointmentService.bookAppointment(bookingData);

      console.log(' Booking successful:', response);
      toast.success(t('appointments.bookingSuccess') || 'Appointment booked successfully! Check your email for confirmation.');

      // Reset everything
      setBookingDialog(false);
      setActiveStep(0);
      setSelectedSlot(null);
      setConsultationType('consultation');
      setNotes('');
      setPhone('');

      // Navigate to appointments page
      navigate('/appointments');
    } catch (error: any) {
      console.error(' Booking error:', error);

      if (error.response?.status === 401) {
        toast.error(t('appointments.sessionExpired') || 'Session expired. Please login again.');
        navigate('/login');
      } else if (error.response?.status === 400) {
        toast.error(error.response.data.error || t('appointments.invalidData') || 'Invalid booking data');
      } else {
        toast.error(error.response?.data?.error || t('appointments.bookingError') || 'Failed to book appointment');
      }
    } finally {
      setLoading(false);
    }
  };

  const getSlotsForDate = (date: Date): TimeSlot[] => {
    const dayAvailability = availability.find((a) =>
      isSameDay(new Date(a.date), date)
    );
    return dayAvailability?.slots || [];
  };

  const openBookingDialog = () => {
    if (!selectedSlot) {
      toast.error(t('appointments.selectSlotFirst') || 'Please select a time slot first');
      return;
    }
    setBookingDialog(true);
  };

  const handleMonthChange = (newDate: Date | null) => {
    if (newDate) {
      setCurrentMonth(newDate);
    }
  };

  const slotsForSelectedDate = getSlotsForDate(selectedDate);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          {t('appointments.title')}
        </Typography>

        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          {t('appointments.subtitle')}
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((step) => (
            <Step key={step}>
              <StepLabel>{t(`appointments.${step}`)}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 1: Choose Date & Time */}
        {activeStep === 0 && (
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {t('appointments.selectDate')}
                </Typography>
                <DatePicker
                  label={t('appointments.date')}
                  value={selectedDate}
                  onChange={(newDate) => newDate && setSelectedDate(newDate)}
                  onMonthChange={handleMonthChange}
                  slotProps={{ textField: { fullWidth: true } }}
                  minDate={new Date()}
                />
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('appointments.showingAvailability', { month: format(currentMonth, 'MMMM yyyy') })}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {t('appointments.availableSlots', { date: format(selectedDate, 'EEEE, MMMM d, yyyy') })}
                </Typography>

                {loading ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    {slotsForSelectedDate.length > 0 ? (
                      <Grid container spacing={1}>
                        {slotsForSelectedDate.map((slot, index) => (
                          <Grid item xs={6} sm={4} md={3} key={index}>
                            <Button
                              variant={
                                selectedSlot?.time === slot.time ? 'contained' : 'outlined'
                              }
                              color={slot.isAvailable ? 'primary' : 'error'}
                              disabled={!slot.isAvailable}
                              fullWidth
                              onClick={() => slot.isAvailable && handleSlotSelect(slot)}
                              sx={{ py: 1 }}
                            >
                              {slot.time}
                            </Button>
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        {availability.length === 0
                          ? t('appointments.noAvailabilityMonth', { month: format(currentMonth, 'MMMM yyyy') })
                          : t('appointments.noSlotsDate', { date: format(selectedDate, 'MMMM d, yyyy') })}
                      </Alert>
                    )}

                    {availability.length > 0 && (
                      <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Typography variant="body2" color="text.secondary">
                          {t('appointments.availableDays', { count: availability.length })}
                        </Typography>
                      </Box>
                    )}
                  </>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Step 2: Confirm Details */}
        {activeStep === 1 && selectedSlot && (
          <Paper sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>
              {t('appointments.confirmDetails')}
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('appointments.designer')}
                </Typography>
                <Typography variant="body1" gutterBottom sx={{ fontWeight: 600 }}>
                  {t('appointments.designTeam')}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                  {t('appointments.dateTime')}
                </Typography>
                <Typography variant="body1">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </Typography>
                <Typography variant="body1" color="primary" sx={{ fontWeight: 600 }}>
                  {selectedSlot.time}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                  {t('appointments.consultationType')}
                </Typography>
                <FormControl fullWidth sx={{ mt: 1 }}>
                  <Select
                    value={consultationType}
                    onChange={(e) => setConsultationType(e.target.value)}
                  >
                    {consultationTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {t(`appointments.${type.label}`)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('appointments.yourInformation')}
                </Typography>
                <Typography variant="body1">
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.email}
                </Typography>

                <TextField
                  fullWidth
                  label={t('appointments.phoneOptional')}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  margin="normal"
                  placeholder="+216 XX XXX XXX"
                />

                <TextField
                  fullWidth
                  label={t('appointments.notesOptional')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  margin="normal"
                  multiline
                  rows={3}
                  placeholder={t('appointments.notesPlaceholder')}
                />
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Navigation Buttons */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          gap: 2,
          mt: 4 
        }}>
          <Button 
            onClick={handleBack} 
            disabled={activeStep === 0}
            variant="outlined"
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            {t('common.back')}
          </Button>

          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={openBookingDialog}
              disabled={loading || !selectedSlot}
              sx={{ 
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': { bgcolor: 'primary.dark' },
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              {t('appointments.book')}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!selectedSlot}
              sx={{ 
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': { bgcolor: 'primary.dark' },
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              {t('common.next')}
            </Button>
          )}
        </Box>

        {/* Confirmation Dialog */}
        <Dialog
          open={bookingDialog}
          onClose={() => setBookingDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: 'background.paper',
            }
          }}
        >
          <DialogTitle>{t('appointments.confirmBooking')}</DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              {t('appointments.confirmMessage')}
            </Typography>
            <Box sx={{ 
              mt: 2, 
              p: 2, 
              bgcolor: 'background.default', 
              borderRadius: 1,
              border: 1,
              borderColor: 'divider'
            }}>
              <Typography>
                <strong>{t('appointments.designer')}:</strong> {t('appointments.designTeam')}
              </Typography>
              <Typography>
                <strong>{t('appointments.date')}:</strong> {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
              </Typography>
              <Typography>
                <strong>{t('appointments.time')}:</strong> {selectedSlot?.time}
              </Typography>
              <Typography>
                <strong>{t('appointments.type')}:</strong>{' '}
                {t(`appointments.${consultationTypes.find((t) => t.value === consultationType)?.label}`)}
              </Typography>
              {notes && (
                <Typography>
                  <strong>{t('appointments.notes')}:</strong> {notes}
                </Typography>
              )}
              {phone && (
                <Typography>
                  <strong>{t('appointments.phone')}:</strong> {phone}
                </Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
            <Button 
              onClick={() => setBookingDialog(false)} 
              disabled={loading}
              variant="outlined"
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleBookAppointment}
              variant="contained"
              disabled={loading}
              sx={{ 
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': { bgcolor: 'primary.dark' },
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : t('appointments.confirmBooking')}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default BookAppointment;