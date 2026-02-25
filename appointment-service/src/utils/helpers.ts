
export const generateTimeSlots = (date: Date): string[] => {
  const slots = [];
  // Note: date parameter is not used - slots are time-based only, not date-based
  for (let hour = 10; hour <= 16; hour++) {
    const start = `${hour.toString().padStart(2, '0')}:00`;
    const end = `${(hour + 1).toString().padStart(2, '0')}:00`;
    slots.push(`${start}-${end}`);
  }
  return slots;
};

