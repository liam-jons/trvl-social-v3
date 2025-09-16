import { useState, useRef, useCallback, useEffect } from 'react';
import Map, {
  Marker,
  Popup,
  NavigationControl,
  GeolocateControl,
  Source,
  Layer
} from 'react-map-gl';
import { useMapbox } from '../../contexts/MapboxContext';
import { useTheme } from '../../hooks/useTheme';
import useMapClustering from '../../hooks/useMapClustering';
import GlassCard from '../ui/GlassCard';
import AdventureMarker from './AdventureMarker';
import ClusterMarker from './ClusterMarker';
import AdventurePopup from './AdventurePopup';
import LocationSearch from './LocationSearch';
import DrawControls from './DrawControls';
// Import Mapbox CSS
import 'mapbox-gl/dist/mapbox-gl.css';
const MapView = ({
  adventures = [],
  onAdventureSelect,
  onLocationSearch,
  onBoundarySearch,
  showLocationSearch = true,
  showDrawControls = false,
  allowClustering = true,
  height = '500px',
  className = '',
}) => {
  const { accessToken, defaultCenter, defaultZoom, isConfigured, defaultStyle, darkStyle } = useMapbox();
  const { isDark } = useTheme();
  const mapRef = useRef();
  // Map state
  const [viewState, setViewState] = useState({
    longitude: defaultCenter[0],
    latitude: defaultCenter[1],
    zoom: defaultZoom,
  });
  // Interaction state
  const [selectedAdventure, setSelectedAdventure] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  // Clustering
  const { clusters, getClusterLeaves, getClusterExpansionZoom } = useMapClustering(
    adventures,
    viewState,
    allowClustering ? {
      maxZoom: 14,
      radius: 50,
      minPoints: 2,
    } : { maxZoom: 0 } // Disable clustering
  );
  // Handle adventure marker click
  const handleMarkerClick = useCallback((adventure) => {
    setSelectedAdventure(adventure);
    onAdventureSelect?.(adventure);
  }, [onAdventureSelect]);
  // Handle cluster click
  const handleClusterClick = useCallback((cluster) => {
    const expansionZoom = getClusterExpansionZoom(cluster.properties.cluster_id);
    if (expansionZoom) {
      setViewState(prev => ({
        ...prev,
        longitude: cluster.geometry.coordinates[0],
        latitude: cluster.geometry.coordinates[1],
        zoom: expansionZoom,
      }));
    }
  }, [getClusterExpansionZoom]);
  // Handle popup close
  const handlePopupClose = useCallback(() => {
    setSelectedAdventure(null);
  }, []);
  // Handle location search result
  const handleLocationSearchResult = useCallback((result) => {
    const [longitude, latitude] = result.center;
    setViewState({
      longitude,
      latitude,
      zoom: 14,
    });
    onLocationSearch?.(result);
  }, [onLocationSearch]);
  // Handle user location found
  const handleGeolocate = useCallback((event) => {
    const { coords } = event;
    setUserLocation({
      longitude: coords.longitude,
      latitude: coords.latitude,
    });
  }, []);
  // Get current location programmatically
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        setUserLocation({ longitude, latitude });
        setViewState(prev => ({
          ...prev,
          longitude,
          latitude,
          zoom: Math.max(prev.zoom, 12),
        }));
        setIsLocating(false);
      },
      (error) => {
        console.error('Error getting current location:', error);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, []);
  // Handle map load
  const handleMapLoad = useCallback(() => {
    // Map is loaded and ready
    if (mapRef.current) {
      // Additional map setup can go here
    }
  }, []);
  if (!isConfigured) {
    return (
      <GlassCard className="flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Map Configuration Required
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Please add your Mapbox access token to the environment variables.
          </p>
        </div>
      </GlassCard>
    );
  }
  return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* Location Search */}
      {showLocationSearch && (
        <div className="absolute top-4 left-4 z-10 w-80">
          <LocationSearch
            onResultSelect={handleLocationSearchResult}
            placeholder="Search for adventures or locations..."
          />
        </div>
      )}
      {/* Current Location Button */}
      <div className="absolute top-4 right-4 z-10">
        <GlassCard padding="none" className="p-2">
          <button
            onClick={getCurrentLocation}
            disabled={isLocating}
            className="p-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors disabled:opacity-50"
            title="Get current location"
          >
            {isLocating ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="m12 2a10 10 0 0 1 10 10h-4a6 6 0 0 0-6-6v-4z"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            )}
          </button>
        </GlassCard>
      </div>
      {/* Draw Controls */}
      {showDrawControls && (
        <div className="absolute bottom-4 left-4 z-10">
          <DrawControls
            map={mapRef.current}
            onDrawComplete={onBoundarySearch}
          />
        </div>
      )}
      {/* Map */}
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onLoad={handleMapLoad}
        mapboxAccessToken={accessToken}
        mapStyle={isDark ? darkStyle : defaultStyle}
        attributionControl={false}
        className="rounded-xl overflow-hidden"
      >
        {/* Navigation Controls */}
        <NavigationControl position="bottom-right" />
        {/* Geolocation Control */}
        <GeolocateControl
          position="bottom-right"
          trackUserLocation={true}
          showUserHeading={true}
          onGeolocate={handleGeolocate}
        />
        {/* User Location Marker */}
        {userLocation && (
          <Marker
            longitude={userLocation.longitude}
            latitude={userLocation.latitude}
          >
            <div className="w-4 h-4 bg-primary-500 border-2 border-white dark:border-gray-800 rounded-full shadow-lg" />
          </Marker>
        )}
        {/* Clustered Markers */}
        {(allowClustering ? clusters : adventures.map(adventure => ({
          type: 'Feature',
          properties: { cluster: false, adventure },
          geometry: {
            type: 'Point',
            coordinates: [adventure.longitude, adventure.latitude],
          }
        }))).map((item) => {
          const [longitude, latitude] = item.geometry.coordinates;
          const isCluster = item.properties.cluster;
          return (
            <Marker
              key={isCluster ? `cluster-${item.properties.cluster_id}` : `adventure-${item.properties.adventure.id}`}
              longitude={longitude}
              latitude={latitude}
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                if (isCluster) {
                  handleClusterClick(item);
                } else {
                  handleMarkerClick(item.properties.adventure);
                }
              }}
            >
              {isCluster ? (
                <ClusterMarker cluster={item} />
              ) : (
                <AdventureMarker adventure={item.properties.adventure} />
              )}
            </Marker>
          );
        })}
        {/* Selected Adventure Popup */}
        {selectedAdventure && (
          <Popup
            longitude={selectedAdventure.longitude}
            latitude={selectedAdventure.latitude}
            onClose={handlePopupClose}
            closeButton={false}
            className="adventure-popup"
          >
            <AdventurePopup
              adventure={selectedAdventure}
              onClose={handlePopupClose}
              userLocation={userLocation}
            />
          </Popup>
        )}
      </Map>
    </div>
  );
};
export default MapView;