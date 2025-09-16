import { useState, useEffect, useMemo } from 'react';
import Supercluster from 'supercluster';
const useMapClustering = (
  adventures = [],
  viewState,
  options = {}
) => {
  const {
    maxZoom = 14,
    radius = 50,
    minPoints = 2,
    extent = 512,
    nodeSize = 64,
  } = options;
  const [clusters, setClusters] = useState([]);
  // Create supercluster instance
  const supercluster = useMemo(() => {
    const cluster = new Supercluster({
      maxZoom,
      radius,
      minPoints,
      extent,
      nodeSize,
    });
    return cluster;
  }, [maxZoom, radius, minPoints, extent, nodeSize]);
  // Convert adventures to GeoJSON features
  const points = useMemo(() => {
    return adventures
      .filter(adventure =>
        adventure.latitude &&
        adventure.longitude &&
        !isNaN(adventure.latitude) &&
        !isNaN(adventure.longitude)
      )
      .map(adventure => ({
        type: 'Feature',
        properties: {
          cluster: false,
          adventureId: adventure.id,
          adventure,
        },
        geometry: {
          type: 'Point',
          coordinates: [adventure.longitude, adventure.latitude],
        },
      }));
  }, [adventures]);
  // Update clusters when points or viewState change
  useEffect(() => {
    if (!points.length || !viewState) {
      setClusters([]);
      return;
    }
    // Load points into supercluster
    supercluster.load(points);
    // Get clusters for current viewport
    const bounds = getBounds(viewState);
    const zoom = Math.floor(viewState.zoom);
    try {
      const clusterData = supercluster.getClusters(bounds, zoom);
      setClusters(clusterData);
    } catch (error) {
      console.error('Error getting clusters:', error);
      setClusters(points); // Fallback to original points
    }
  }, [points, viewState, supercluster]);
  // Get bounds from viewState
  const getBounds = (viewState) => {
    if (!viewState) return [-180, -85, 180, 85];
    const { longitude, latitude, zoom } = viewState;
    // Calculate approximate bounds based on zoom level
    const latDelta = 180 / Math.pow(2, zoom);
    const lngDelta = 360 / Math.pow(2, zoom);
    return [
      longitude - lngDelta,
      latitude - latDelta,
      longitude + lngDelta,
      latitude + latDelta,
    ];
  };
  // Get cluster leaves (individual points in a cluster)
  const getClusterLeaves = (clusterId, limit = 10, offset = 0) => {
    if (!supercluster) return [];
    try {
      return supercluster.getLeaves(clusterId, limit, offset);
    } catch (error) {
      console.error('Error getting cluster leaves:', error);
      return [];
    }
  };
  // Expand cluster to show individual points
  const getClusterExpansionZoom = (clusterId) => {
    if (!supercluster) return null;
    try {
      return supercluster.getClusterExpansionZoom(clusterId);
    } catch (error) {
      console.error('Error getting cluster expansion zoom:', error);
      return null;
    }
  };
  return {
    clusters,
    getClusterLeaves,
    getClusterExpansionZoom,
    totalPoints: points.length,
  };
};
export default useMapClustering;