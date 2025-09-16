import { supabase } from '../lib/supabase';

class LocationService {
  /**
   * Get posts based on location filter
   * @param {Object} filter - Location filter object
   * @param {string} filter.type - 'local', 'regional', or 'global'
   * @param {Object} filter.userLocation - User's location {latitude, longitude}
   * @param {number} filter.radius - Radius in miles
   * @param {Object} options - Query options
   */
  async getLocationFilteredPosts(filter, options = {}) {
    const {
      limit = 20,
      offset = 0,
      orderBy = 'created_at',
      ascending = false
    } = options;

    let query = supabase
      .from('community_posts')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          first_name,
          last_name,
          avatar_url
        ),
        post_likes:community_post_likes (count),
        post_comments:community_post_comments (count)
      `);

    // Apply location-based filtering
    if (filter.type !== 'global' && filter.userLocation) {
      const { latitude, longitude } = filter.userLocation;
      const radiusInMeters = this.milesToMeters(filter.radius);

      // Use PostGIS distance function
      query = query
        .not('location', 'is', null)
        .filter(
          'location',
          'st_dwithin',
          `POINT(${longitude} ${latitude}),${radiusInMeters}`
        );
    }

    // Apply ordering and pagination
    query = query
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch location-filtered posts: ${error.message}`);
    }

    return {
      posts: data || [],
      totalCount: count
    };
  }

  /**
   * Get user's location preferences
   * @param {string} userId
   */
  async getLocationPreferences(userId) {
    const { data, error } = await supabase
      .from('user_location_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
      throw new Error(`Failed to fetch location preferences: ${error.message}`);
    }

    return data || {
      default_filter: 'global',
      location_sharing: 'public',
      custom_location: null,
      auto_detect: true
    };
  }

  /**
   * Update user's location preferences
   * @param {string} userId
   * @param {Object} preferences
   */
  async updateLocationPreferences(userId, preferences) {
    const { data, error } = await supabase
      .from('user_location_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update location preferences: ${error.message}`);
    }

    return data;
  }

  /**
   * Geocode an address using Mapbox Geocoding API
   * @param {string} address
   */
  async geocodeAddress(address) {
    const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

    if (!mapboxToken) {
      throw new Error('Mapbox access token not configured');
    }

    const encodedAddress = encodeURIComponent(address);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxToken}&limit=5`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Geocoding failed');
      }

      return data.features.map(feature => ({
        id: feature.id,
        place_name: feature.place_name,
        center: {
          longitude: feature.center[0],
          latitude: feature.center[1]
        },
        context: feature.context || []
      }));
    } catch (error) {
      throw new Error(`Geocoding failed: ${error.message}`);
    }
  }

  /**
   * Reverse geocode coordinates to get address
   * @param {number} longitude
   * @param {number} latitude
   */
  async reverseGeocode(longitude, latitude) {
    const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

    if (!mapboxToken) {
      throw new Error('Mapbox access token not configured');
    }

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}&types=place,locality,neighborhood`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Reverse geocoding failed');
      }

      if (data.features.length === 0) {
        return null;
      }

      const feature = data.features[0];
      return {
        place_name: feature.place_name,
        text: feature.text,
        context: feature.context || []
      };
    } catch (error) {
      throw new Error(`Reverse geocoding failed: ${error.message}`);
    }
  }

  /**
   * Get location from IP address as fallback
   */
  async getLocationFromIP() {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.reason || 'IP geolocation failed');
      }

      return {
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city,
        region: data.region,
        country: data.country_name,
        accuracy: 10000 // IP-based location is less accurate
      };
    } catch (error) {
      throw new Error(`IP geolocation failed: ${error.message}`);
    }
  }

  /**
   * Create a post with location data
   * @param {Object} postData
   */
  async createPostWithLocation(postData) {
    const { location, location_visibility, ...otherData } = postData;

    let locationPoint = null;
    if (location && location_visibility !== 'private') {
      // Convert to PostGIS POINT format
      locationPoint = `POINT(${location.longitude} ${location.latitude})`;
    }

    const { data, error } = await supabase
      .from('community_posts')
      .insert({
        ...otherData,
        location: locationPoint,
        location_visibility: location_visibility || 'public'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create post: ${error.message}`);
    }

    return data;
  }

  /**
   * Calculate distance between two points in miles
   * @param {number} lat1
   * @param {number} lon1
   * @param {number} lat2
   * @param {number} lon2
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert miles to meters
   * @param {number} miles
   */
  milesToMeters(miles) {
    return miles * 1609.34;
  }

  /**
   * Get communities within a certain distance
   * @param {Object} userLocation
   * @param {number} radius - in miles
   */
  async getCommunitiesNearLocation(userLocation, radius = 50) {
    const { latitude, longitude } = userLocation;
    const radiusInMeters = this.milesToMeters(radius);

    const { data, error } = await supabase
      .from('communities')
      .select(`
        *,
        member_count:community_members(count)
      `)
      .not('location', 'is', null)
      .filter(
        'location',
        'st_dwithin',
        `POINT(${longitude} ${latitude}),${radiusInMeters}`
      )
      .order('member_count', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch nearby communities: ${error.message}`);
    }

    return data || [];
  }
}

export const locationService = new LocationService();