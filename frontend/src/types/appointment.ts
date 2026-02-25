export interface TimeSlot {
  time: string;
  isAvailable: boolean;
  bookedBy?: string;
}

export interface Availability {
  _id?: string;
  designerId: string;
  date: string;
  slots: TimeSlot[];
}

export interface Appointment {
  _id: string;
  designerId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  date: string;
  timeSlot: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';
  consultationType: 'design' | 'fitting' | 'consultation' | 'custom';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookAppointmentData {
  date: string;
  timeSlot: string;
  consultationType: string;
  notes?: string;
  customerPhone?: string;
  customerName?: string;
}