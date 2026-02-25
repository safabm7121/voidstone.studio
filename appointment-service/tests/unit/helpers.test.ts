import { generateTimeSlots } from '../../src/utils/helpers';

describe('Helper Functions', () => {
  describe('generateTimeSlots', () => {
    it('should generate 7 time slots from 10:00 to 16:00', () => {
      const date = new Date('2026-03-02');
      const slots = generateTimeSlots(date);

      expect(slots).toHaveLength(7);
      expect(slots[0]).toBe('10:00-11:00');
      expect(slots[1]).toBe('11:00-12:00');
      expect(slots[2]).toBe('12:00-13:00');
      expect(slots[3]).toBe('13:00-14:00');
      expect(slots[4]).toBe('14:00-15:00');
      expect(slots[5]).toBe('15:00-16:00');
      expect(slots[6]).toBe('16:00-17:00');
    });

    it('should generate slots with correct format', () => {
      const date = new Date('2026-03-02');
      const slots = generateTimeSlots(date);

      slots.forEach(slot => {
        expect(slot).toMatch(/^\d{2}:\d{2}-\d{2}:\d{2}$/);
      });
    });

    it('should generate same slots regardless of date', () => {
      const date1 = new Date('2026-03-02');
      const date2 = new Date('2026-03-03');
      
      const slots1 = generateTimeSlots(date1);
      const slots2 = generateTimeSlots(date2);

      expect(slots1).toEqual(slots2);
    });
  });
});