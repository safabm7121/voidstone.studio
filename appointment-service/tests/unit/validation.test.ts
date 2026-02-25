import {
  bookAppointmentSchema,
  cancelAppointmentSchema,
  getAvailabilitySchema
} from '../../src/utils/validation';

describe('Appointment Validation Schemas', () => {
  describe('bookAppointmentSchema', () => {
    it('should validate correct booking data', () => {
      const validData = {
        date: '2026-03-02T00:00:00.000Z',
        timeSlot: '10:00-11:00',
        consultationType: 'design',
        notes: 'Some notes',
        customerPhone: '123-456-7890',
        customerName: 'John Doe'
      };

      const { error } = bookAppointmentSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should validate minimal booking data', () => {
      const validData = {
        date: '2026-03-02T00:00:00.000Z',
        timeSlot: '10:00-11:00'
      };

      const { error } = bookAppointmentSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject invalid date', () => {
      const invalidData = {
        date: 'invalid-date',
        timeSlot: '10:00-11:00'
      };

      const { error } = bookAppointmentSchema.validate(invalidData);
      expect(error).toBeDefined();
      // Fix: Match Joi's actual error message
      expect(error?.details[0].message).toContain('ISO 8601 date format');
    });

    it('should reject invalid timeSlot format', () => {
      const invalidData = {
        date: '2026-03-02T00:00:00.000Z',
        timeSlot: '10:00' // Wrong format
      };

      const { error } = bookAppointmentSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('Time slot must be in format');
    });

    it('should reject notes that are too long', () => {
      const invalidData = {
        date: '2026-03-02T00:00:00.000Z',
        timeSlot: '10:00-11:00',
        notes: 'a'.repeat(501) // 501 characters
      };

      const { error } = bookAppointmentSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should default consultationType to consultation', () => {
      const validData = {
        date: '2026-03-02T00:00:00.000Z',
        timeSlot: '10:00-11:00'
      };

      const { value } = bookAppointmentSchema.validate(validData);
      expect(value.consultationType).toBe('consultation');
    });

    it('should require date and timeSlot', () => {
      const { error } = bookAppointmentSchema.validate({}, { abortEarly: false });
      expect(error).toBeDefined();
      // Fix: Should have 2 errors (date and timeSlot)
      expect(error?.details.length).toBe(2);
      expect(error?.details[0].message).toContain('Date is required');
      expect(error?.details[1].message).toContain('Time slot is required');
    });
  });

  describe('cancelAppointmentSchema', () => {
    it('should validate with reason', () => {
      const validData = {
        reason: 'Changed my mind'
      };

      const { error } = cancelAppointmentSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should validate without reason', () => {
      const { error } = cancelAppointmentSchema.validate({});
      expect(error).toBeUndefined();
    });

    it('should reject reason that is too long', () => {
      const invalidData = {
        reason: 'a'.repeat(201) // 201 characters
      };

      const { error } = cancelAppointmentSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });

  describe('getAvailabilitySchema', () => {
    it('should validate correct date range', () => {
      const validData = {
        startDate: '2026-03-02T00:00:00.000Z',
        endDate: '2026-03-07T00:00:00.000Z'
      };

      const { error } = getAvailabilitySchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject missing startDate', () => {
      const invalidData = {
        endDate: '2026-03-07T00:00:00.000Z'
      };

      const { error } = getAvailabilitySchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('startDate is required');
    });

    it('should reject missing endDate', () => {
      const invalidData = {
        startDate: '2026-03-02T00:00:00.000Z'
      };

      const { error } = getAvailabilitySchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('endDate is required');
    });

    it('should reject invalid dates', () => {
      const invalidData = {
        startDate: 'invalid',
        endDate: '2026-03-07T00:00:00.000Z'
      };

      const { error } = getAvailabilitySchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });
});