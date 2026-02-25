import Joi from 'joi';

export const bookAppointmentSchema = Joi.object({
  date: Joi.date().iso().required().messages({
    'date.base': 'Valid date is required',
    'any.required': 'Date is required'
  }),
  timeSlot: Joi.string().pattern(/^\d{2}:\d{2}-\d{2}:\d{2}$/).required().messages({
    'string.pattern.base': 'Time slot must be in format HH:MM-HH:MM',
    'any.required': 'Time slot is required'
  }),
  consultationType: Joi.string().valid('design', 'fitting', 'consultation', 'custom').default('consultation'),
  notes: Joi.string().max(500).optional(),
  customerPhone: Joi.string().optional(),
  customerName: Joi.string().optional()
});

export const cancelAppointmentSchema = Joi.object({
  reason: Joi.string().max(200).optional()
});

export const getAvailabilitySchema = Joi.object({
  startDate: Joi.date().iso().required().messages({
    'date.base': 'Valid start date is required',
    'any.required': 'startDate is required'
  }),
  endDate: Joi.date().iso().required().messages({
    'date.base': 'Valid end date is required',
    'any.required': 'endDate is required'
  })
});