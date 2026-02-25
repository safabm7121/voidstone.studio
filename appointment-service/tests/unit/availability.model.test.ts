import mongoose from 'mongoose';
import Availability from '../../src/models/Availability';

describe('Availability Model', () => {
  const validAvailabilityData = {
    designerId: 'voidstone-studio-designer',
    date: new Date('2026-03-02'), // Monday
    slots: [
      { time: '10:00-11:00', isAvailable: true },
      { time: '11:00-12:00', isAvailable: true },
      { time: '14:00-15:00', isAvailable: true }
    ]
  };

  it('should create valid availability', async () => {
    const availability = new Availability(validAvailabilityData);
    const saved = await availability.save();

    expect(saved._id).toBeDefined();
    expect(saved.designerId).toBe(validAvailabilityData.designerId);
    expect(saved.date).toEqual(validAvailabilityData.date);
    expect(saved.slots).toHaveLength(3);
    expect(saved.createdAt).toBeDefined();
    expect(saved.updatedAt).toBeDefined();
  });

  it('should enforce unique designerId+date combination', async () => {
    const availability1 = new Availability(validAvailabilityData);
    await availability1.save();

    const availability2 = new Availability({
      ...validAvailabilityData,
      date: validAvailabilityData.date // Same date
    });

    await expect(availability2.save()).rejects.toThrow();
  });

  it('should allow multiple slots for different dates', async () => {
    const availability1 = new Availability(validAvailabilityData);
    await availability1.save();

    const nextDay = new Date(validAvailabilityData.date);
    nextDay.setDate(nextDay.getDate() + 1);

    const availability2 = new Availability({
      ...validAvailabilityData,
      date: nextDay
    });

    const saved = await availability2.save();
    expect(saved).toBeDefined();
    expect(saved.date).toEqual(nextDay);
  });

  it('should set default isAvailable to true', async () => {
    const availability = new Availability({
      designerId: 'test-designer',
      date: new Date(),
      slots: [{ time: '10:00-11:00' }] // No isAvailable specified
    });

    const saved = await availability.save();
    expect(saved.slots[0].isAvailable).toBe(true);
  });

  it('should require required fields', async () => {
    const availability = new Availability({});
    
    let error: any = null;
    try {
      await availability.save();
    } catch (err) {
      error = err;
    }
    
    expect(error).toBeDefined();
    expect(error.errors.designerId).toBeDefined();
    expect(error.errors.date).toBeDefined();
  });
});