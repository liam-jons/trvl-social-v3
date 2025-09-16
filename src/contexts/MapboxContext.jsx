import { createContext, useContext, useMemo } from 'react';
const MapboxContext = createContext();
export const useMapbox = () => {
  const context = useContext(MapboxContext);
  if (!context) {
    throw new Error('useMapbox must be used within a MapboxProvider');
  }
  return context;
};
export const MapboxProvider = ({ children }) => {
  const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  const config = useMemo(() => ({
    accessToken,
    defaultStyle: 'mapbox://styles/mapbox/light-v11',
    darkStyle: 'mapbox://styles/mapbox/dark-v11',
    defaultCenter: [-95.7129, 37.0902], // Center of US
    defaultZoom: 4,
    maxZoom: 18,
    minZoom: 2,
    // Clustering configuration
    clusterMaxZoom: 14,
    clusterRadius: 50,
    // Search configuration
    geocodingEndpoint: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
    // Distance calculation settings
    distanceUnit: 'miles', // or 'kilometers'
  }), [accessToken]);
  if (!accessToken) {
    console.warn('Mapbox access token not found. Please add VITE_MAPBOX_ACCESS_TOKEN to your environment variables.');
  }
  const value = {
    ...config,
    isConfigured: Boolean(accessToken),
  };
  return (
    <MapboxContext.Provider value={value}>
      {children}
    </MapboxContext.Provider>
  );
};