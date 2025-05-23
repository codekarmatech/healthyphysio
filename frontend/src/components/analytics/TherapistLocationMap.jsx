import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './TherapistLocationMap.css';

// Fix Leaflet icon issues in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix the default icon issue - needs to be done before any markers are created
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// Set the default icon for all markers
L.Marker.prototype.options.icon = DefaultIcon;

// Define map tile layers
const MAP_LAYERS = {
  STANDARD: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    name: 'Standard'
  },
  SATELLITE: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    name: 'Satellite'
  }
};

/**
 * TherapistLocationMap Component
 *
 * Displays a map with all therapist locations for admin monitoring
 * Includes proximity detection between users
 *
 * Props:
 * - therapists: Array of therapist objects with location data
 * - patients: Array of patient objects with location data (optional)
 * - height: Height of the map container (default: '500px')
 * - showProximityAlerts: Whether to show proximity alerts (default: true)
 * - proximityThreshold: Distance threshold for proximity alerts in meters (default: 100)
 * - defaultCenter: Default center coordinates [lat, lng] (default: Ahmedabad, Gujarat)
 * - zoom: Default zoom level (default: 12)
 * - selectedTherapistId: ID of the selected therapist to focus on (optional)
 * - onTherapistSelect: Callback when a therapist is selected from the map (optional)
 * - initialMapType: Initial map type to display (default: 'STANDARD')
 */
const TherapistLocationMap = ({
  therapists = [],
  patients = [],
  height = '500px',
  showProximityAlerts = true,
  proximityThreshold = 100, // meters
  defaultCenter = [23.0225, 72.5714], // Ahmedabad, Gujarat, India
  zoom = 12,
  selectedTherapistId = null,
  onTherapistSelect = () => {},
  initialMapType = 'STANDARD'
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersRef = useRef([]);
  const circlesRef = useRef([]);
  const proximityLinesRef = useRef([]);
  const previousSelectedIdRef = useRef(selectedTherapistId);
  const [proximityAlerts, setProximityAlerts] = useState([]);
  const [mapType, setMapType] = useState(initialMapType);

  // Initialize map when component mounts
  useEffect(() => {
    console.log('Map initialization effect running', {
      mapRef: !!mapRef.current,
      mapInstance: !!mapInstanceRef.current,
      mapType
    });

    // Initialize map if not already initialized and the DOM element is available
    if (!mapInstanceRef.current && mapRef.current) {
      console.log('Creating new map instance with center:', defaultCenter, 'and zoom:', zoom);

      try {
        // Create map instance with default center in Ahmedabad, Gujarat, India
        mapInstanceRef.current = L.map(mapRef.current, {
          center: defaultCenter,
          zoom: zoom,
          attributionControl: true,
          zoomControl: true
        });

        // Add initial tile layer based on mapType
        const currentMapLayer = MAP_LAYERS[mapType];
        tileLayerRef.current = L.tileLayer(currentMapLayer.url, {
          attribution: currentMapLayer.attribution
        }).addTo(mapInstanceRef.current);

        // Force a resize to ensure the map renders correctly
        setTimeout(() => {
          if (mapInstanceRef.current) {
            try {
              mapInstanceRef.current.invalidateSize(true);
              console.log('Map size invalidated');
            } catch (e) {
              console.error('Error invalidating map size:', e);
            }
          }
        }, 250);

        // Add a small delay before adding markers to ensure the map is fully initialized
        setTimeout(() => {
          if (mapInstanceRef.current && (therapists.length > 0 || patients.length > 0)) {
            console.log('Map initialized, ready for markers');
          } else if (mapInstanceRef.current) {
            console.log('Map initialized but no location data available');
          }
        }, 300);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }

    return () => {
      // Clean up map instance when component unmounts
      if (mapInstanceRef.current) {
        console.log('Cleaning up map instance');
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          console.error('Error removing map:', e);
        }
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
      }
    };
  }, [defaultCenter, zoom, mapType, therapists.length, patients.length]);

  // Effect to update the map tile layer when mapType changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // If we already have a tile layer, remove it
    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    // Add the new tile layer based on mapType
    const currentMapLayer = MAP_LAYERS[mapType];
    tileLayerRef.current = L.tileLayer(currentMapLayer.url, {
      attribution: currentMapLayer.attribution
    }).addTo(mapInstanceRef.current);

    console.log(`Map type changed to ${mapType}`);
  }, [mapType]);

  // Store the current map view to prevent zoom reset
  const saveCurrentMapView = () => {
    if (!mapInstanceRef.current) return null;

    try {
      const map = mapInstanceRef.current;
      return {
        center: map.getCenter(),
        zoom: map.getZoom()
      };
    } catch (error) {
      console.error('Error saving current map view:', error);
      return null;
    }
  };

  // Restore the saved map view
  const restoreMapView = (savedView) => {
    if (!mapInstanceRef.current || !savedView) return;

    try {
      const map = mapInstanceRef.current;
      map.setView(savedView.center, savedView.zoom, { animate: false });
      console.log('Restored previous map view:', savedView);
    } catch (error) {
      console.error('Error restoring map view:', error);
    }
  };

  // Update markers when therapists or patients change
  useEffect(() => {
    if (!mapInstanceRef.current) {
      console.error('Map instance not initialized, cannot add markers');
      return;
    }

    // Save current view before updating markers
    const savedView = saveCurrentMapView();
    const isFirstLoad = markersRef.current.length === 0;

    const map = mapInstanceRef.current;
    console.log('Updating markers with data:', {
      therapistsCount: therapists.length,
      patientsCount: patients.length,
      selectedTherapistId,
      isFirstLoad
    });

    // Clear existing markers, circles, and proximity lines
    markersRef.current.forEach(marker => marker.remove());
    circlesRef.current.forEach(circle => circle.remove());
    proximityLinesRef.current.forEach(line => line.remove());

    markersRef.current = [];
    circlesRef.current = [];
    proximityLinesRef.current = [];

    // Create bounds object to fit all markers
    const bounds = L.latLngBounds();

    // Filter therapists if a specific one is selected
    const filteredTherapists = selectedTherapistId
      ? therapists.filter(t => {
          // Check different possible ID fields
          return (
            t.id === selectedTherapistId ||
            t.therapist_id === selectedTherapistId ||
            (t.user_details && t.user_details.id === selectedTherapistId)
          );
        })
      : therapists;

    // Add therapist markers
    filteredTherapists.forEach(therapist => {
      // Handle different data formats - direct location object or nested in user_details
      let locationData = therapist.location;
      let name = therapist.name;
      let specialization = therapist.specialization;

      // If we're getting data from the API, it might have a different structure
      if (!locationData && therapist.latitude && therapist.longitude) {
        locationData = {
          latitude: therapist.latitude,
          longitude: therapist.longitude,
          accuracy: therapist.accuracy,
          timestamp: therapist.timestamp
        };
      }

      // Try to get name from user_details if available
      if (!name && therapist.user_details) {
        name = therapist.user_details.full_name ||
               `${therapist.user_details.first_name || ''} ${therapist.user_details.last_name || ''}`.trim() ||
               therapist.user_details.username;
      }

      // If we still don't have a name, use a placeholder
      if (!name) {
        name = "Therapist";
      }

      // If we don't have location data, skip this therapist
      if (!locationData) return;

      const { latitude, longitude, accuracy } = locationData;

      // Skip invalid coordinates
      if (!latitude || !longitude || isNaN(parseFloat(latitude)) || isNaN(parseFloat(longitude))) return;

      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      // Extend bounds
      bounds.extend([lat, lng]);

      // Get therapist ID from different possible fields
      const therapistId = therapist.id || therapist.therapist_id ||
                         (therapist.user_details && therapist.user_details.id);

      // Determine if this is the selected therapist
      const isSelected = selectedTherapistId && therapistId === selectedTherapistId;

      // Create marker with different style if selected
      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: `therapist-marker ${isSelected ? 'selected' : ''}`,
          html: `<div>${name.charAt(0)}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      }).addTo(map);

      console.log(`Added therapist marker for ${name} at [${lat}, ${lng}]`);

      // Add popup with information
      marker.bindPopup(`
        <strong>${name}</strong><br>
        <strong>Specialization:</strong> ${specialization || 'N/A'}<br>
        <strong>Last Updated:</strong> ${new Date(locationData.timestamp || Date.now()).toLocaleString()}<br>
        <strong>Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}<br>
        <strong>Accuracy:</strong> ${parseFloat(accuracy || 0).toFixed(1)} meters
        ${therapistId ? `<br><button class="select-therapist-btn" data-id="${therapistId}">Focus on this therapist</button>` : ''}
      `);

      // Add click handler for the marker
      marker.on('click', () => {
        // Store the therapist ID for use in the popup
        marker._therapistId = therapistId;
      });

      // Add click handler for the popup content
      marker.on('popupopen', () => {
        // Find the button in the popup and add click handler
        setTimeout(() => {
          const btn = document.querySelector('.select-therapist-btn');
          if (btn) {
            btn.addEventListener('click', (e) => {
              e.preventDefault();
              const id = e.target.getAttribute('data-id');
              if (id) {
                onTherapistSelect(id === selectedTherapistId ? null : id);
              }
            });
          }
        }, 10);
      });

      markersRef.current.push(marker);

      // Add accuracy circle
      if (accuracy) {
        const circle = L.circle([lat, lng], {
          radius: parseFloat(accuracy),
          fillColor: '#3388ff',
          fillOpacity: 0.1,
          color: '#3388ff',
          weight: 1
        }).addTo(map);

        circlesRef.current.push(circle);
      }
    });

    // Add patient markers if provided
    // If a therapist is selected, only show patients associated with that therapist
    // Otherwise, show all patients
    const filteredPatients = selectedTherapistId
      ? patients.filter(p => {
          // Check if this patient has an association with the selected therapist
          // This could be through appointments, treatment plans, or direct references
          return (
            // Check if patient has therapist_id that matches selected therapist
            p.therapist_id === selectedTherapistId ||
            // Check if patient has appointments with the selected therapist
            (p.appointments && p.appointments.some(a =>
              a.therapist_id === selectedTherapistId ||
              a.therapist?.id === selectedTherapistId
            )) ||
            // Check if patient has treatment plans with the selected therapist
            (p.treatment_plans && p.treatment_plans.some(tp =>
              tp.therapist_id === selectedTherapistId ||
              tp.therapist?.id === selectedTherapistId
            )) ||
            // If we don't have relationship data, show all patients when a therapist is selected
            // This ensures we don't hide patients unnecessarily when data is limited
            (!p.appointments && !p.treatment_plans && !p.therapist_id)
          );
        })
      : patients;

    filteredPatients.forEach(patient => {
      // Handle different data formats - direct location object or nested in user_details
      let locationData = patient.location;
      let name = patient.name;

      // If we're getting data from the API, it might have a different structure
      if (!locationData && patient.latitude && patient.longitude) {
        locationData = {
          latitude: patient.latitude,
          longitude: patient.longitude,
          accuracy: patient.accuracy,
          timestamp: patient.timestamp
        };
      }

      // Try to get name from user_details if available
      if (!name && patient.user_details) {
        name = patient.user_details.full_name ||
               `${patient.user_details.first_name || ''} ${patient.user_details.last_name || ''}`.trim() ||
               patient.user_details.username;
      }

      // If we still don't have a name, use a placeholder
      if (!name) {
        name = "Patient";
      }

      // If we don't have location data, skip this patient
      if (!locationData) return;

      const { latitude, longitude, accuracy } = locationData;

      // Skip invalid coordinates
      if (!latitude || !longitude || isNaN(parseFloat(latitude)) || isNaN(parseFloat(longitude))) return;

      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      // Extend bounds
      bounds.extend([lat, lng]);

      // Create marker
      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'patient-marker',
          html: `<div>${name.charAt(0)}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      }).addTo(map);

      console.log(`Added patient marker for ${name} at [${lat}, ${lng}]`);

      // Add popup with information
      marker.bindPopup(`
        <strong>${name}</strong><br>
        <strong>Last Updated:</strong> ${new Date(locationData.timestamp || Date.now()).toLocaleString()}<br>
        <strong>Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}<br>
        <strong>Accuracy:</strong> ${parseFloat(accuracy || 0).toFixed(1)} meters
      `);

      markersRef.current.push(marker);

      // Add accuracy circle
      if (accuracy) {
        const circle = L.circle([lat, lng], {
          radius: parseFloat(accuracy),
          fillColor: '#10b981',
          fillOpacity: 0.1,
          color: '#10b981',
          weight: 1
        }).addTo(map);

        circlesRef.current.push(circle);
      }
    });

    // Check for proximity between users if enabled
    // Note: We always check ALL therapists and patients for proximity alerts,
    // even when only showing a filtered subset on the map
    if (showProximityAlerts) {
      const alerts = [];

      // Always use all therapists for proximity checks, even when a specific therapist is selected
      // This ensures we don't miss any proximity alerts
      for (let i = 0; i < therapists.length; i++) {
        // Get location data for first therapist
        let t1LocationData = therapists[i].location;
        let t1Name = therapists[i].name;

        // Handle different data formats
        if (!t1LocationData && therapists[i].latitude && therapists[i].longitude) {
          t1LocationData = {
            latitude: therapists[i].latitude,
            longitude: therapists[i].longitude
          };
        }

        // Try to get name from user_details if available
        if (!t1Name && therapists[i].user_details) {
          t1Name = therapists[i].user_details.full_name ||
                 `${therapists[i].user_details.first_name || ''} ${therapists[i].user_details.last_name || ''}`.trim() ||
                 therapists[i].user_details.username;
        }

        // If we still don't have a name, use a placeholder
        if (!t1Name) {
          t1Name = "Therapist " + (i + 1);
        }

        // Skip if no location data
        if (!t1LocationData) continue;

        const t1Lat = parseFloat(t1LocationData.latitude);
        const t1Lng = parseFloat(t1LocationData.longitude);

        if (isNaN(t1Lat) || isNaN(t1Lng)) continue;

        // Check against other therapists
        for (let j = i + 1; j < therapists.length; j++) {
          // Get location data for second therapist
          let t2LocationData = therapists[j].location;
          let t2Name = therapists[j].name;

          // Handle different data formats
          if (!t2LocationData && therapists[j].latitude && therapists[j].longitude) {
            t2LocationData = {
              latitude: therapists[j].latitude,
              longitude: therapists[j].longitude
            };
          }

          // Try to get name from user_details if available
          if (!t2Name && therapists[j].user_details) {
            t2Name = therapists[j].user_details.full_name ||
                   `${therapists[j].user_details.first_name || ''} ${therapists[j].user_details.last_name || ''}`.trim() ||
                   therapists[j].user_details.username;
          }

          // If we still don't have a name, use a placeholder
          if (!t2Name) {
            t2Name = "Therapist " + (j + 1);
          }

          // Skip if no location data
          if (!t2LocationData) continue;

          const t2Lat = parseFloat(t2LocationData.latitude);
          const t2Lng = parseFloat(t2LocationData.longitude);

          if (isNaN(t2Lat) || isNaN(t2Lng)) continue;

          // Calculate distance
          const distance = calculateDistance(t1Lat, t1Lng, t2Lat, t2Lng);

          if (distance <= proximityThreshold) {
            // Add proximity alert
            alerts.push({
              type: 'therapist-therapist',
              user1: { ...therapists[i], name: t1Name },
              user2: { ...therapists[j], name: t2Name },
              distance,
              coordinates1: [t1Lat, t1Lng],
              coordinates2: [t2Lat, t2Lng]
            });

            // Draw proximity line
            const line = L.polyline([
              [t1Lat, t1Lng],
              [t2Lat, t2Lng]
            ], {
              color: 'red',
              weight: 2,
              opacity: 0.7,
              dashArray: '5, 10'
            }).addTo(map);

            line.bindPopup(`
              <strong>Proximity Alert!</strong><br>
              <strong>${t1Name}</strong> and <strong>${t2Name}</strong> are within ${distance.toFixed(1)} meters of each other.
            `);

            proximityLinesRef.current.push(line);
          }
        }

        // Check against all patients, not just filtered ones
        // This ensures we don't miss any proximity alerts
        for (let j = 0; j < patients.length; j++) {
          // Get location data for patient
          let pLocationData = patients[j].location;
          let pName = patients[j].name;

          // Handle different data formats
          if (!pLocationData && patients[j].latitude && patients[j].longitude) {
            pLocationData = {
              latitude: patients[j].latitude,
              longitude: patients[j].longitude
            };
          }

          // Try to get name from user_details if available
          if (!pName && patients[j].user_details) {
            pName = patients[j].user_details.full_name ||
                   `${patients[j].user_details.first_name || ''} ${patients[j].user_details.last_name || ''}`.trim() ||
                   patients[j].user_details.username;
          }

          // If we still don't have a name, use a placeholder
          if (!pName) {
            pName = "Patient " + (j + 1);
          }

          // Skip if no location data
          if (!pLocationData) continue;

          const pLat = parseFloat(pLocationData.latitude);
          const pLng = parseFloat(pLocationData.longitude);

          if (isNaN(pLat) || isNaN(pLng)) continue;

          // Calculate distance
          const distance = calculateDistance(t1Lat, t1Lng, pLat, pLng);

          if (distance <= proximityThreshold) {
            // Add proximity alert
            alerts.push({
              type: 'therapist-patient',
              user1: { ...therapists[i], name: t1Name },
              user2: { ...patients[j], name: pName },
              distance,
              coordinates1: [t1Lat, t1Lng],
              coordinates2: [pLat, pLng]
            });

            // Draw proximity line
            const line = L.polyline([
              [t1Lat, t1Lng],
              [pLat, pLng]
            ], {
              color: 'orange',
              weight: 2,
              opacity: 0.7,
              dashArray: '5, 10'
            }).addTo(map);

            line.bindPopup(`
              <strong>Proximity Alert!</strong><br>
              <strong>${t1Name}</strong> (Therapist) and <strong>${pName}</strong> (Patient) are within ${distance.toFixed(1)} meters of each other.
            `);

            proximityLinesRef.current.push(line);
          }
        }
      }

      // Update proximity alerts state
      setProximityAlerts(alerts);
    }

    // Handle map view updates
    try {
      // Only fit bounds on first load or when selection changes
      if (isFirstLoad || previousSelectedIdRef.current !== selectedTherapistId) {
        if (bounds.isValid()) {
          console.log('First load or selection changed - fitting map to bounds with padding');
          // Use setTimeout to ensure the map is fully initialized before fitting bounds
          setTimeout(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
            }
          }, 200);
        } else {
          console.log('No valid bounds, setting default view');
          // Otherwise use default center
          map.setView(defaultCenter, zoom);
        }
        // Update the previous selected ID reference
        previousSelectedIdRef.current = selectedTherapistId;
      } else if (savedView) {
        // For data refreshes, restore the previous view to prevent zoom reset
        console.log('Data refresh - restoring previous map view');
        setTimeout(() => {
          restoreMapView(savedView);
        }, 100);
      }
    } catch (error) {
      console.error('Error setting map view:', error);
      // Fallback to default center if there's an error
      try {
        map.setView(defaultCenter, zoom);
      } catch (e) {
        console.error('Failed to set default view:', e);
      }
    }
  }, [therapists, patients, showProximityAlerts, proximityThreshold, defaultCenter, zoom, selectedTherapistId, onTherapistSelect]);

  // Helper function to calculate distance between two points in meters
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;

    return d;
  };

  // Get unique therapists for the dropdown
  const getTherapistOptions = () => {
    const options = [];

    therapists.forEach(therapist => {
      // Get therapist ID and name
      const id = therapist.id || therapist.therapist_id ||
                (therapist.user_details && therapist.user_details.id);

      let name = therapist.name;

      // Try to get name from user_details if available
      if (!name && therapist.user_details) {
        name = therapist.user_details.full_name ||
              `${therapist.user_details.first_name || ''} ${therapist.user_details.last_name || ''}`.trim() ||
              therapist.user_details.username;
      }

      // If we still don't have a name, use a placeholder
      if (!name) {
        name = "Therapist";
      }

      if (id && name && !options.some(opt => opt.id === id)) {
        options.push({ id, name });
      }
    });

    return options;
  };

  const therapistOptions = getTherapistOptions();

  // Handle therapist selection from dropdown
  const handleTherapistSelect = (e) => {
    const value = e.target.value;
    onTherapistSelect(value === '' ? null : value);
  };

  // Toggle map type between standard and satellite
  const toggleMapType = () => {
    setMapType(prevType => prevType === 'STANDARD' ? 'SATELLITE' : 'STANDARD');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="relative">
        {/* Map status indicator */}
        {selectedTherapistId && (
          <div className="absolute top-2 left-2 z-[1001] bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium shadow-sm border border-yellow-200">
            Focused on selected therapist
          </div>
        )}

        {/* Map type toggle button - positioned on top of the map */}
        <div className="absolute top-2 right-2 z-[1001]">
          <button
            onClick={toggleMapType}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {mapType === 'STANDARD' ? 'Switch to Satellite View' : 'Switch to Standard View'}
          </button>
        </div>

        <div
          ref={mapRef}
          style={{ height, width: '100%', position: 'relative' }}
          className="rounded-lg overflow-hidden map-container"
        ></div>
      </div>

      {showProximityAlerts && proximityAlerts.length > 0 && (
        <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {proximityAlerts.length} Proximity Alert{proximityAlerts.length > 1 ? 's' : ''} Detected
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {proximityAlerts.map((alert, index) => {
                    // Get names with fallbacks
                    const user1Name = alert.user1.name ||
                                     (alert.user1.user_details ?
                                      (alert.user1.user_details.full_name ||
                                       `${alert.user1.user_details.first_name || ''} ${alert.user1.user_details.last_name || ''}`.trim() ||
                                       alert.user1.user_details.username) :
                                      "User 1");

                    const user2Name = alert.user2.name ||
                                     (alert.user2.user_details ?
                                      (alert.user2.user_details.full_name ||
                                       `${alert.user2.user_details.first_name || ''} ${alert.user2.user_details.last_name || ''}`.trim() ||
                                       alert.user2.user_details.username) :
                                      "User 2");

                    return (
                      <li key={index}>
                        {alert.type === 'therapist-therapist' ? (
                          <>Therapists <strong>{user1Name}</strong> and <strong>{user2Name}</strong> are within {alert.distance.toFixed(1)} meters of each other.</>
                        ) : (
                          <>Therapist <strong>{user1Name}</strong> and Patient <strong>{user2Name}</strong> are within {alert.distance.toFixed(1)} meters of each other.</>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TherapistLocationMap;
