import {
  haversineKm,
  totalDistanceKm,
  paceSecPerKm,
  avgSpeedKmh,
  maxSpeedKmh,
  splitsPerKm,
  type Sample,
} from '../../../../src/lib/tracking/sessionMetrics';

const A: Sample = { latitude: 41.0082, longitude: 28.9784, t: 0 };
const B: Sample = { latitude: 41.009, longitude: 28.9784, t: 60 };
const C: Sample = { latitude: 41.0098, longitude: 28.9784, t: 120 };

describe('sessionMetrics', () => {
  test('haversineKm two known points (~89m apart)', () => {
    expect(haversineKm(A, B)).toBeCloseTo(0.0889, 2);
  });

  test('totalDistanceKm sums segments', () => {
    expect(totalDistanceKm([A, B, C])).toBeCloseTo(0.1778, 2);
  });

  test('totalDistanceKm with <2 points is 0', () => {
    expect(totalDistanceKm([])).toBe(0);
    expect(totalDistanceKm([A])).toBe(0);
  });

  test('paceSecPerKm', () => {
    const pace = paceSecPerKm([A, B, C]);
    expect(pace).toBeGreaterThan(670);
    expect(pace).toBeLessThan(680);
  });

  test('paceSecPerKm 0 for tiny distance', () => {
    expect(paceSecPerKm([A])).toBe(0);
  });

  test('avgSpeedKmh', () => {
    expect(avgSpeedKmh([A, B, C])).toBeCloseTo(5.33, 1);
  });

  test('maxSpeedKmh picks fastest segment', () => {
    const fast: Sample = { latitude: 41.011, longitude: 28.9784, t: 130 };
    expect(maxSpeedKmh([A, B, C, fast])).toBeGreaterThan(40);
  });

  test('maxSpeedKmh ignores absurd >250 km/h spikes', () => {
    const teleport: Sample = { latitude: 50.0, longitude: 28.9784, t: 121 };
    expect(maxSpeedKmh([A, B, teleport])).toBeLessThan(250);
  });

  test('splitsPerKm returns one entry per completed km', () => {
    const points: Sample[] = [];
    for (let i = 0; i <= 100; i++) {
      points.push({ latitude: 41.0082 + i * 0.0002, longitude: 28.9784, t: i * 30 });
    }
    const splits = splitsPerKm(points);
    expect(splits.length).toBeGreaterThanOrEqual(2);
    expect(splits[0].km).toBe(1);
    expect(splits[0].durationSec).toBeGreaterThan(0);
  });
});
