import { IMG } from '../data';

export const MODE_ICON = {
  flight: 'airplane',
  bus: 'bus-side',
  train: 'train',
  hotel: 'bed-king-outline',
  car: 'car-sports',
};

export const MODE_NAME = { flight: 'Flight', bus: 'Coach', train: 'Train', hotel: 'Stay', car: 'Car rental' };

// Bookings persist image keys (not require() ids) so they survive reloads.
export function bookingImage(b) {
  if (!b || !b.imageKey) return null;
  const [group, key] = b.imageKey.split('.');
  if (group === 'room') return IMG.rooms[key] || null;
  if (group === 'flight') return IMG.flight[key] || null;
  if (group === 'bus') return IMG.bus[key] || null;
  if (group === 'train') return IMG.train[key] || null;
  if (group === 'car') return IMG.cars[key] || null;
  if (group === 'hero') return IMG.hero;
  return null;
}
