import { encodePolyline, decodePolyline, simplify } from '../../../../src/lib/tracking/polyline';

describe('polyline', () => {
  test('encode/decode roundtrip preserves coords within 1e-5', () => {
    const coords = [
      { latitude: 38.5, longitude: -120.2 },
      { latitude: 40.7, longitude: -120.95 },
      { latitude: 43.252, longitude: -126.453 },
    ];
    const encoded = encodePolyline(coords);
    const decoded = decodePolyline(encoded);
    expect(decoded.length).toBe(coords.length);
    decoded.forEach((p, i) => {
      expect(p.latitude).toBeCloseTo(coords[i].latitude, 4);
      expect(p.longitude).toBeCloseTo(coords[i].longitude, 4);
    });
  });

  test('encode produces Google-known reference output', () => {
    const coords = [
      { latitude: 38.5, longitude: -120.2 },
      { latitude: 40.7, longitude: -120.95 },
      { latitude: 43.252, longitude: -126.453 },
    ];
    expect(encodePolyline(coords)).toBe('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
  });

  test('encode empty array returns empty string', () => {
    expect(encodePolyline([])).toBe('');
  });

  test('decode empty string returns empty array', () => {
    expect(decodePolyline('')).toEqual([]);
  });

  test('simplify reduces collinear points', () => {
    const coords = [];
    for (let i = 0; i < 100; i++) {
      coords.push({ latitude: 41 + i * 0.001, longitude: 29 });
    }
    const out = simplify(coords, 0.0001);
    expect(out.length).toBeLessThan(20);
    expect(out[0]).toEqual(coords[0]);
    expect(out[out.length - 1]).toEqual(coords[coords.length - 1]);
  });

  test('simplify keeps both endpoints', () => {
    const coords = [
      { latitude: 41.0, longitude: 29.0 },
      { latitude: 41.001, longitude: 29.0001 },
      { latitude: 41.002, longitude: 29.0002 },
    ];
    const out = simplify(coords, 1);
    expect(out[0]).toEqual(coords[0]);
    expect(out[out.length - 1]).toEqual(coords[coords.length - 1]);
  });

  test('simplify with <3 points returns input unchanged', () => {
    const a = [{ latitude: 41, longitude: 29 }];
    expect(simplify(a, 0.001)).toEqual(a);
    const b = [
      { latitude: 41, longitude: 29 },
      { latitude: 42, longitude: 30 },
    ];
    expect(simplify(b, 0.001)).toEqual(b);
  });
});
