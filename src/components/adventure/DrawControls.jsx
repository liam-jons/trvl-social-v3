import { useState, useEffect, useCallback, useRef } from 'react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';

const DrawControls = ({
  map,
  onDrawComplete,
  onDrawClear,
  onDrawStart,
  className = '',
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState(null); // 'polygon', 'rectangle', 'circle'
  const [currentShape, setCurrentShape] = useState(null);

  // Drawing state
  const drawingRef = useRef({
    isActive: false,
    mode: null,
    coordinates: [],
    startPoint: null,
    listeners: [],
  });

  // Initialize drawing capabilities
  useEffect(() => {
    if (!map) return;

    // Add drawing source if it doesn't exist
    if (!map.getSource('draw-data')) {
      map.addSource('draw-data', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });
    }

    // Add drawing layers if they don't exist
    if (!map.getLayer('draw-polygon')) {
      map.addLayer({
        id: 'draw-polygon',
        type: 'fill',
        source: 'draw-data',
        filter: ['==', ['get', 'type'], 'polygon'],
        paint: {
          'fill-color': '#3b82f6',
          'fill-opacity': 0.1,
        },
      });

      map.addLayer({
        id: 'draw-polygon-outline',
        type: 'line',
        source: 'draw-data',
        filter: ['==', ['get', 'type'], 'polygon'],
        paint: {
          'line-color': '#3b82f6',
          'line-width': 2,
          'line-dasharray': [2, 2],
        },
      });
    }

    // Cleanup function
    return () => {
      // Remove event listeners
      drawingRef.current.listeners.forEach(({ event, handler }) => {
        map.off(event, handler);
      });
      drawingRef.current.listeners = [];
    };
  }, [map]);

  // Start drawing
  const startDrawing = useCallback((mode) => {
    if (!map) return;

    setDrawMode(mode);
    setIsDrawing(true);
    drawingRef.current.isActive = true;
    drawingRef.current.mode = mode;
    drawingRef.current.coordinates = [];

    // Change cursor
    map.getCanvas().style.cursor = 'crosshair';

    onDrawStart?.(mode);

    // Add event listeners based on mode
    if (mode === 'polygon') {
      const clickHandler = (e) => {
        if (!drawingRef.current.isActive) return;

        const { lng, lat } = e.lngLat;
        drawingRef.current.coordinates.push([lng, lat]);

        // Update the drawing
        updateDrawing();
      };

      const dblClickHandler = (e) => {
        e.preventDefault();
        finishDrawing();
      };

      map.on('click', clickHandler);
      map.on('dblclick', dblClickHandler);

      drawingRef.current.listeners.push(
        { event: 'click', handler: clickHandler },
        { event: 'dblclick', handler: dblClickHandler }
      );

    } else if (mode === 'rectangle') {
      const mouseDownHandler = (e) => {
        if (!drawingRef.current.isActive) return;

        drawingRef.current.startPoint = [e.lngLat.lng, e.lngLat.lat];
        drawingRef.current.coordinates = [drawingRef.current.startPoint];

        const mouseMoveHandler = (e) => {
          if (!drawingRef.current.startPoint) return;

          const endPoint = [e.lngLat.lng, e.lngLat.lat];
          const [startLng, startLat] = drawingRef.current.startPoint;
          const [endLng, endLat] = endPoint;

          // Create rectangle coordinates
          drawingRef.current.coordinates = [[
            [startLng, startLat],
            [endLng, startLat],
            [endLng, endLat],
            [startLng, endLat],
            [startLng, startLat],
          ]];

          updateDrawing();
        };

        const mouseUpHandler = () => {
          map.off('mousemove', mouseMoveHandler);
          map.off('mouseup', mouseUpHandler);
          finishDrawing();
        };

        map.on('mousemove', mouseMoveHandler);
        map.on('mouseup', mouseUpHandler);
      };

      map.on('mousedown', mouseDownHandler);
      drawingRef.current.listeners.push({ event: 'mousedown', handler: mouseDownHandler });

    } else if (mode === 'circle') {
      const mouseDownHandler = (e) => {
        if (!drawingRef.current.isActive) return;

        drawingRef.current.startPoint = [e.lngLat.lng, e.lngLat.lat];

        const mouseMoveHandler = (e) => {
          if (!drawingRef.current.startPoint) return;

          const center = drawingRef.current.startPoint;
          const endPoint = [e.lngLat.lng, e.lngLat.lat];

          // Calculate radius in degrees (approximate)
          const radius = Math.sqrt(
            Math.pow(endPoint[0] - center[0], 2) + Math.pow(endPoint[1] - center[1], 2)
          );

          // Create circle coordinates
          const points = 64;
          const coordinates = [];
          for (let i = 0; i <= points; i++) {
            const angle = (i * 2 * Math.PI) / points;
            const x = center[0] + radius * Math.cos(angle);
            const y = center[1] + radius * Math.sin(angle);
            coordinates.push([x, y]);
          }

          drawingRef.current.coordinates = [coordinates];
          updateDrawing();
        };

        const mouseUpHandler = () => {
          map.off('mousemove', mouseMoveHandler);
          map.off('mouseup', mouseUpHandler);
          finishDrawing();
        };

        map.on('mousemove', mouseMoveHandler);
        map.on('mouseup', mouseUpHandler);
      };

      map.on('mousedown', mouseDownHandler);
      drawingRef.current.listeners.push({ event: 'mousedown', handler: mouseDownHandler });
    }
  }, [map, onDrawStart]);

  // Update drawing on map
  const updateDrawing = useCallback(() => {
    if (!map || !drawingRef.current.isActive) return;

    const source = map.getSource('draw-data');
    if (!source) return;

    let geometry;

    if (drawingRef.current.mode === 'polygon') {
      if (drawingRef.current.coordinates.length < 3) return;

      // Close the polygon
      const coords = [...drawingRef.current.coordinates];
      if (coords.length > 2 && coords[0] !== coords[coords.length - 1]) {
        coords.push(coords[0]);
      }

      geometry = {
        type: 'Polygon',
        coordinates: [coords],
      };
    } else if (drawingRef.current.mode === 'rectangle' || drawingRef.current.mode === 'circle') {
      geometry = {
        type: 'Polygon',
        coordinates: drawingRef.current.coordinates,
      };
    }

    const feature = {
      type: 'Feature',
      properties: {
        type: 'polygon',
        drawMode: drawingRef.current.mode,
      },
      geometry,
    };

    source.setData({
      type: 'FeatureCollection',
      features: [feature],
    });
  }, [map]);

  // Finish drawing
  const finishDrawing = useCallback(() => {
    if (!map || !drawingRef.current.isActive) return;

    // Create final feature
    let geometry;

    if (drawingRef.current.mode === 'polygon') {
      if (drawingRef.current.coordinates.length < 3) {
        cancelDrawing();
        return;
      }

      const coords = [...drawingRef.current.coordinates];
      coords.push(coords[0]); // Close polygon

      geometry = {
        type: 'Polygon',
        coordinates: [coords],
      };
    } else if (drawingRef.current.mode === 'rectangle' || drawingRef.current.mode === 'circle') {
      geometry = {
        type: 'Polygon',
        coordinates: drawingRef.current.coordinates,
      };
    }

    const feature = {
      type: 'Feature',
      properties: {
        type: 'polygon',
        drawMode: drawingRef.current.mode,
      },
      geometry,
    };

    setCurrentShape(feature);

    // Clean up drawing state
    cleanupDrawing();

    // Notify parent
    onDrawComplete?.(feature);
  }, [map, onDrawComplete]);

  // Cancel drawing
  const cancelDrawing = useCallback(() => {
    cleanupDrawing();
    clearDrawing();
  }, []);

  // Clear drawing
  const clearDrawing = useCallback(() => {
    if (!map) return;

    const source = map.getSource('draw-data');
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: [],
      });
    }

    setCurrentShape(null);
    onDrawClear?.();
  }, [map, onDrawClear]);

  // Cleanup drawing state
  const cleanupDrawing = useCallback(() => {
    if (!map) return;

    // Remove event listeners
    drawingRef.current.listeners.forEach(({ event, handler }) => {
      map.off(event, handler);
    });
    drawingRef.current.listeners = [];

    // Reset state
    drawingRef.current.isActive = false;
    drawingRef.current.mode = null;
    drawingRef.current.coordinates = [];
    drawingRef.current.startPoint = null;

    setIsDrawing(false);
    setDrawMode(null);

    // Reset cursor
    map.getCanvas().style.cursor = '';
  }, [map]);

  // Handle escape key
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && isDrawing) {
        cancelDrawing();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isDrawing, cancelDrawing]);

  const getDrawingInstructions = () => {
    if (!isDrawing) return null;

    switch (drawMode) {
      case 'polygon':
        return 'Click to add points, double-click to finish';
      case 'rectangle':
        return 'Click and drag to draw rectangle';
      case 'circle':
        return 'Click and drag to draw circle';
      default:
        return 'Drawing...';
    }
  };

  return (
    <div className={`${className}`}>
      <GlassCard variant="light" blur="lg" padding="sm">
        {!isDrawing ? (
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Draw Search Area
            </div>
            <div className="flex flex-col gap-2">
              <GlassButton
                variant="primary"
                size="sm"
                onClick={() => startDrawing('polygon')}
                className="justify-start"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2" />
                </svg>
                Polygon
              </GlassButton>
              <GlassButton
                variant="secondary"
                size="sm"
                onClick={() => startDrawing('rectangle')}
                className="justify-start"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16v12H4z" />
                </svg>
                Rectangle
              </GlassButton>
              <GlassButton
                variant="secondary"
                size="sm"
                onClick={() => startDrawing('circle')}
                className="justify-start"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
                Circle
              </GlassButton>
              {currentShape && (
                <GlassButton
                  variant="accent"
                  size="sm"
                  onClick={clearDrawing}
                  className="justify-start mt-2"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear Area
                </GlassButton>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Drawing {drawMode}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              {getDrawingInstructions()}
            </div>
            <div className="flex gap-2">
              <GlassButton
                variant="secondary"
                size="sm"
                onClick={cancelDrawing}
                className="flex-1"
              >
                Cancel
              </GlassButton>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Press ESC to cancel
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default DrawControls;