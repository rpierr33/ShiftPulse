/**
 * Geofencing utilities for Electronic Visit Verification (EVV).
 *
 * Uses the Haversine formula to compute distances between GPS coordinates
 * and determine whether a clock event falls within the configured geofence.
 */

const EARTH_RADIUS_METERS = 6_371_000; // mean Earth radius in meters

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate the distance in meters between two GPS coordinates using the
 * Haversine formula.
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Check whether a clock-in/out location falls within the geofence radius of a
 * site (shift or company location).
 *
 * Returns the computed distance and a boolean indicating whether the worker is
 * within the allowed radius.
 */
export function checkGeofence(
  clockLat: number,
  clockLng: number,
  siteLat: number,
  siteLng: number,
  radiusMeters: number
): { isWithinRange: boolean; distance: number } {
  const distance = calculateDistance(clockLat, clockLng, siteLat, siteLng);
  return {
    isWithinRange: distance <= radiusMeters,
    distance: Math.round(distance),
  };
}
