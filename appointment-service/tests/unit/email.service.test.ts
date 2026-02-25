import axios from 'axios';
import {
  sendAppointmentEmail,
  sendAppointmentNotificationToAdmin,
  sendAppointmentConfirmationToCustomer,
  sendAppointmentConfirmedToCustomer
} from '../../src/utils/emailService';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Define type for axios post arguments
type AxiosPostArgs = [string, any];

describe('Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendAppointmentEmail', () => {
    it('should send email successfully', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

      await sendAppointmentEmail(
        'test@example.com',
        'Test Subject',
        '<p>Test HTML</p>'
      );

      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3001/api/appointment-email',
        {
          to: 'test@example.com',
          subject: 'Test Subject',
          html: '<p>Test HTML</p>'
        }
      );
    });

    it('should throw error when sending fails', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        sendAppointmentEmail('test@example.com', 'Subject', '<p>HTML</p>')
      ).rejects.toThrow('Network error');
    });
  });

  describe('sendAppointmentNotificationToAdmin', () => {
    it('should send admin notification', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

      const appointmentDetails = {
        date: '2026-03-02',
        timeSlot: '10:00-11:00',
        consultationType: 'design',
        notes: 'Test notes',
        _id: '12345'
      };

      await sendAppointmentNotificationToAdmin(
        appointmentDetails,
        'John Doe',
        'john@example.com'
      );

      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      
      // Type assertion for the call arguments
      const callArgs = mockedAxios.post.mock.calls[0] as AxiosPostArgs;
      expect(callArgs[0]).toBe('http://localhost:3001/api/appointment-email');
      
      // Now TypeScript knows callArgs[1] is an object
      const requestBody = callArgs[1];
      expect(requestBody.subject).toContain('New Appointment');
      expect(requestBody.html).toContain('John Doe');
      expect(requestBody.html).toContain('design');
    });
  });

  describe('sendAppointmentConfirmationToCustomer', () => {
    it('should send customer confirmation', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

      const appointmentDetails = {
        date: '2026-03-02',
        timeSlot: '10:00-11:00',
        consultationType: 'design',
        notes: 'Test notes'
      };

      await sendAppointmentConfirmationToCustomer(
        'john@example.com',
        'John Doe',
        appointmentDetails
      );

      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      
      const callArgs = mockedAxios.post.mock.calls[0] as AxiosPostArgs;
      expect(callArgs[0]).toBe('http://localhost:3001/api/appointment-email');
      
      const requestBody = callArgs[1];
      expect(requestBody.subject).toContain('Appointment Request Received');
      expect(requestBody.html).toContain('John Doe');
      expect(requestBody.html).toContain('10:00-11:00');
    });
  });

  describe('sendAppointmentConfirmedToCustomer', () => {
    it('should send confirmation email', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

      const appointmentDetails = {
        date: '2026-03-02',
        timeSlot: '10:00-11:00',
        consultationType: 'design'
      };

      await sendAppointmentConfirmedToCustomer(
        'john@example.com',
        'John Doe',
        appointmentDetails
      );

      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      
      const callArgs = mockedAxios.post.mock.calls[0] as AxiosPostArgs;
      expect(callArgs[0]).toBe('http://localhost:3001/api/appointment-email');
      
      const requestBody = callArgs[1];
      expect(requestBody.subject).toContain('Appointment Confirmed');
      expect(requestBody.html).toContain('John Doe');
      expect(requestBody.html).toContain('confirmed');
    });
  });
});