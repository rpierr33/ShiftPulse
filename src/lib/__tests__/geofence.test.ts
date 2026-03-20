import { calculateDistance, checkGeofence } from "@/lib/geofence";

describe("calculateDistance", () => {
  it("returns 0 for the same point", () => {
    const distance = calculateDistance(40.7128, -74.006, 40.7128, -74.006);
    expect(distance).toBe(0);
  });

  it("calculates distance between New York and Los Angeles approximately", () => {
    // NYC: 40.7128, -74.0060 | LAX: 33.9425, -118.4081
    const distance = calculateDistance(40.7128, -74.006, 33.9425, -118.4081);
    // Known distance is ~3944 km
    const distanceKm = distance / 1000;
    expect(distanceKm).toBeGreaterThan(3900);
    expect(distanceKm).toBeLessThan(4000);
  });

  it("calculates a short distance accurately", () => {
    // Two points roughly 1 km apart in Manhattan
    // From 40.7484 (Empire State) to 40.7580 (Times Square) at same longitude
    const distance = calculateDistance(40.7484, -73.9857, 40.758, -73.9855);
    const distanceMeters = Math.round(distance);
    // Should be approximately 1067 meters
    expect(distanceMeters).toBeGreaterThan(900);
    expect(distanceMeters).toBeLessThan(1200);
  });

  it("handles coordinates across the equator", () => {
    // Quito, Ecuador (near equator) to Bogota, Colombia
    const distance = calculateDistance(0.1807, -78.4678, 4.711, -74.0721);
    const distanceKm = distance / 1000;
    // ~710 km
    expect(distanceKm).toBeGreaterThan(650);
    expect(distanceKm).toBeLessThan(750);
  });

  it("handles antipodal-like points (very large distance)", () => {
    // North pole area to south pole area
    const distance = calculateDistance(89, 0, -89, 0);
    const distanceKm = distance / 1000;
    // Should be close to half the Earth's circumference (~20000 km)
    expect(distanceKm).toBeGreaterThan(19500);
    expect(distanceKm).toBeLessThan(20100);
  });
});

describe("checkGeofence", () => {
  // Hospital location: 40.7128, -74.0060
  const siteLat = 40.7128;
  const siteLng = -74.006;

  it("returns isWithinRange true when inside the radius", () => {
    // Same location
    const result = checkGeofence(40.7128, -74.006, siteLat, siteLng, 100);
    expect(result.isWithinRange).toBe(true);
    expect(result.distance).toBe(0);
  });

  it("returns isWithinRange true when exactly at the boundary", () => {
    // A point roughly 100m away
    const result = checkGeofence(40.7128, -74.006, siteLat, siteLng, 0);
    expect(result.isWithinRange).toBe(true);
  });

  it("returns isWithinRange false when outside the radius", () => {
    // Times Square is ~4km away from Lower Manhattan
    const result = checkGeofence(40.758, -73.9855, siteLat, siteLng, 100);
    expect(result.isWithinRange).toBe(false);
    expect(result.distance).toBeGreaterThan(100);
  });

  it("uses a large enough radius to include far points", () => {
    // Times Square with 10km radius should include it
    const result = checkGeofence(40.758, -73.9855, siteLat, siteLng, 10000);
    expect(result.isWithinRange).toBe(true);
  });

  it("returns distance as a rounded integer", () => {
    const result = checkGeofence(40.72, -74.0, siteLat, siteLng, 5000);
    expect(Number.isInteger(result.distance)).toBe(true);
  });
});
