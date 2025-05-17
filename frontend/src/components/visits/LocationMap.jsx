import { useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Location Map Component
 *
 * Displays a map with location markers using Leaflet.
 * Note: This component requires the leaflet library to be installed:
 * npm install leaflet
 *
 * And CSS to be imported in the parent component or globally:
 * import 'leaflet/dist/leaflet.css';
 *
 * Security: Only admin users can see all location data
 * Therapists can only see their own location
 * Patients can only see their own location
 *
 * Default center coordinates are for Ahmedabad, Gujarat, India
 */
const LocationMap = ({
  locations = [],
  currentPosition = null,
  height = '400px',
  zoom = 15,
  showPath = true,
  // Default center coordinates for Ahmedabad, Gujarat, India
  defaultCenter = [23.0225, 72.5714]
}) => {
  const { user } = useAuth();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const pathRef = useRef(null);

  // Initialize map when component mounts
  useEffect(() => {
    // Check if leaflet is available
    if (!window.L) {
      console.error('Leaflet library not loaded. Please import leaflet in your application.');
      return;
    }

    // Initialize map if not already initialized
    if (!mapInstanceRef.current && mapRef.current) {
      const L = window.L;

      // Create map instance with default center in Ahmedabad, Gujarat, India
      mapInstanceRef.current = L.map(mapRef.current).setView(defaultCenter, zoom);

      // Add tile layer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);
    }

    return () => {
      // Clean up map when component unmounts
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [zoom, defaultCenter]);

  // Update markers when locations change
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;

    const L = window.L;
    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Clear existing path
    if (pathRef.current) {
      pathRef.current.remove();
      pathRef.current = null;
    }

    // If no locations, return
    if (locations.length === 0 && !currentPosition) return;

    // Determine center point
    let centerLat, centerLng;
    let bounds = L.latLngBounds();

    // Filter locations based on user role
    let filteredLocations = [...locations];

    // Only admins can see all location data
    // Therapists and patients can only see their own locations
    if (!user?.role || user.role !== 'admin') {
      // For non-admin users, only show their own locations
      filteredLocations = filteredLocations.filter(loc =>
        loc.user === user?.id || loc.user?.id === user?.id
      );
    }

    // Add markers for historical locations
    if (filteredLocations.length > 0) {
      // Sort locations by timestamp (oldest first)
      const sortedLocations = [...filteredLocations].sort((a, b) =>
        new Date(a.timestamp) - new Date(b.timestamp)
      );

      // Create path coordinates
      const pathCoords = sortedLocations.map(loc => [
        parseFloat(loc.latitude),
        parseFloat(loc.longitude)
      ]);

      // Add markers
      sortedLocations.forEach((location, index) => {
        const lat = parseFloat(location.latitude);
        const lng = parseFloat(location.longitude);

        // Skip invalid coordinates
        if (isNaN(lat) || isNaN(lng)) return;

        // Extend bounds
        bounds.extend([lat, lng]);

        // Create marker
        const marker = L.circleMarker([lat, lng], {
          radius: 5,
          fillColor: index === 0 ? '#3388ff' : index === sortedLocations.length - 1 ? '#ff3333' : '#33ff33',
          color: '#fff',
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(map);

        // Add popup with information
        marker.bindPopup(`
          <strong>Time:</strong> ${new Date(location.timestamp).toLocaleString()}<br>
          <strong>Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}<br>
          <strong>Accuracy:</strong> ${parseFloat(location.accuracy).toFixed(1)} meters
        `);

        markersRef.current.push(marker);
      });

      // Add path if enabled and there are multiple points
      if (showPath && pathCoords.length > 1) {
        pathRef.current = L.polyline(pathCoords, {
          color: '#3388ff',
          weight: 3,
          opacity: 0.7,
          lineJoin: 'round'
        }).addTo(map);
      }

      // Set center to the most recent location
      centerLat = parseFloat(sortedLocations[sortedLocations.length - 1].latitude);
      centerLng = parseFloat(sortedLocations[sortedLocations.length - 1].longitude);
    }

    // Add marker for current position if available
    if (currentPosition) {
      const lat = currentPosition.coords.latitude;
      const lng = currentPosition.coords.longitude;
      const accuracy = currentPosition.coords.accuracy;

      // Extend bounds
      bounds.extend([lat, lng]);

      // Create marker
      const marker = L.marker([lat, lng]).addTo(map);

      // Add popup with information
      marker.bindPopup(`
        <strong>Current Position</strong><br>
        <strong>Time:</strong> ${new Date(currentPosition.timestamp).toLocaleString()}<br>
        <strong>Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}<br>
        <strong>Accuracy:</strong> ${accuracy.toFixed(1)} meters
      `);

      // Add accuracy circle
      const circle = L.circle([lat, lng], {
        radius: accuracy,
        fillColor: '#3388ff',
        fillOpacity: 0.1,
        color: '#3388ff',
        weight: 1
      }).addTo(map);

      markersRef.current.push(marker);
      markersRef.current.push(circle);

      // Set center to current position
      centerLat = lat;
      centerLng = lng;
    }

    // Fit bounds if multiple points, otherwise center on the single point
    if (bounds.isValid()) {
      if (locations.length > 1 || (locations.length > 0 && currentPosition)) {
        map.fitBounds(bounds, { padding: [50, 50] });
      } else {
        map.setView([centerLat, centerLng], zoom);
      }
    }
  }, [locations, currentPosition, zoom, showPath, user]);

  return (
    <div
      ref={mapRef}
      style={{
        height,
        width: '100%',
        borderRadius: '0.375rem',
        border: '1px solid #e2e8f0'
      }}
    >
      {!window.L && (
        <div className="flex items-center justify-center h-full bg-gray-100 text-gray-500">
          Leaflet library not loaded. Please import leaflet in your application.
        </div>
      )}
    </div>
  );
};

export default LocationMap;
