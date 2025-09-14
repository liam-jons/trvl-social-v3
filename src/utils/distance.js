/**
 * Calculate distance between two geographical points using the Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @param {string} unit - Unit of measurement ('miles', 'km', 'meters', 'feet')
 * @returns {number} Distance between points
 */
export const calculateDistance = (lat1, lon1, lat2, lon2, unit = 'miles') => {
  // Validate inputs
  if (
    typeof lat1 !== 'number' || typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' || typeof lon2 !== 'number' ||
    isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)
  ) {
    return null;
  }

  // Convert latitude and longitude from degrees to radians
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const radLat1 = lat1 * Math.PI / 180;
  const radLat2 = lat2 * Math.PI / 180;

  // Haversine formula
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
           Math.cos(radLat1) * Math.cos(radLat2) *
           Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Earth's radius in different units
  const earthRadius = {
    miles: 3959,
    km: 6371,
    meters: 6371000,
    feet: 20902231,
  };

  const radius = earthRadius[unit] || earthRadius.miles;
  const distance = radius * c;

  return distance;
};

/**
 * Format distance for display
 * @param {number} distance - Distance value
 * @param {string} unit - Unit of measurement
 * @param {number} precision - Decimal places
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distance, unit = 'miles', precision = 1) => {
  if (distance === null || distance === undefined) return null;

  const unitLabels = {
    miles: 'mi',
    km: 'km',
    meters: 'm',
    feet: 'ft',
  };

  const label = unitLabels[unit] || 'mi';

  // Auto-convert small distances to more appropriate units
  if (unit === 'miles' && distance < 0.1) {
    return `${(distance * 5280).toFixed(0)} ft`;
  }

  if (unit === 'km' && distance < 0.1) {
    return `${(distance * 1000).toFixed(0)} m`;
  }

  return `${distance.toFixed(precision)} ${label}`;
};

/**
 * Calculate bearing (direction) from one point to another
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Bearing in degrees (0-360)
 */
export const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const radLat1 = lat1 * Math.PI / 180;
  const radLat2 = lat2 * Math.PI / 180;

  const y = Math.sin(dLon) * Math.cos(radLat2);
  const x = Math.cos(radLat1) * Math.sin(radLat2) -
           Math.sin(radLat1) * Math.cos(radLat2) * Math.cos(dLon);

  let brng = Math.atan2(y, x) * 180 / Math.PI;
  brng = (brng + 360) % 360; // Normalize to 0-360

  return brng;
};

/**
 * Get compass direction from bearing
 * @param {number} bearing - Bearing in degrees
 * @returns {string} Compass direction (N, NE, E, SE, S, SW, W, NW)
 */
export const bearingToCompass = (bearing) => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
};

/**
 * Check if a point is within a polygon (for boundary searches)
 * @param {Array} point - [longitude, latitude]
 * @param {Array} polygon - Array of [longitude, latitude] points
 * @returns {boolean} Whether point is inside polygon
 */
export const pointInPolygon = (point, polygon) => {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
};

/**
 * Get bounding box for a set of coordinates
 * @param {Array} coordinates - Array of [longitude, latitude] points
 * @returns {Array} Bounding box [minLng, minLat, maxLng, maxLat]
 */
export const getBoundingBox = (coordinates) => {
  if (!coordinates || coordinates.length === 0) return null;

  let minLng = coordinates[0][0];
  let minLat = coordinates[0][1];
  let maxLng = coordinates[0][0];
  let maxLat = coordinates[0][1];

  coordinates.forEach(([lng, lat]) => {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  });

  return [minLng, minLat, maxLng, maxLat];
};

/**
 * Sort adventures by distance from a reference point
 * @param {Array} adventures - Array of adventure objects with latitude/longitude
 * @param {Object} referencePoint - Object with latitude/longitude properties
 * @param {string} unit - Distance unit
 * @returns {Array} Sorted adventures with distance property added
 */
export const sortByDistance = (adventures, referencePoint, unit = 'miles') => {
  if (!referencePoint || !referencePoint.latitude || !referencePoint.longitude) {
    return adventures;
  }

  return adventures
    .map(adventure => ({
      ...adventure,
      distance: calculateDistance(
        referencePoint.latitude,
        referencePoint.longitude,
        adventure.latitude,
        adventure.longitude,
        unit
      ),
      formattedDistance: formatDistance(
        calculateDistance(
          referencePoint.latitude,
          referencePoint.longitude,
          adventure.latitude,
          adventure.longitude,
          unit
        ),
        unit
      ),
    }))
    .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
};

/**
 * Filter adventures within a certain distance
 * @param {Array} adventures - Array of adventure objects
 * @param {Object} referencePoint - Reference point with latitude/longitude
 * @param {number} maxDistance - Maximum distance
 * @param {string} unit - Distance unit
 * @returns {Array} Filtered adventures within distance
 */
export const filterByDistance = (adventures, referencePoint, maxDistance, unit = 'miles') => {
  if (!referencePoint || !referencePoint.latitude || !referencePoint.longitude) {
    return adventures;
  }

  return adventures.filter(adventure => {
    const distance = calculateDistance(
      referencePoint.latitude,
      referencePoint.longitude,
      adventure.latitude,
      adventure.longitude,
      unit
    );
    return distance !== null && distance <= maxDistance;
  });
};