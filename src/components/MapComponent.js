import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import PropTypes from 'prop-types';

const MapComponent = ({ pm25Value, coordinates }) => {
  const mapRef = useRef(null);
  const prevCoords = useRef(coordinates);

  // Define custom Google-style pin icon
  const pinIcon = L.divIcon({
    className: 'custom-pin',
    html: `
      <div style="text-align: center; position: relative;">
        <div style="
          background-color: #FF5E5E;
          color: white;
          border-radius: 15px;
          padding: 4px 8px;
          font-size: 12px;
          font-weight: bold;
        ">${pm25Value} µg/m³</div>
        <div style="
          width: 0;
          height: 0;
          border-left: 10px solid transparent;
          border-right: 10px solid transparent;
          border-top: 14px solid #FF5E5E;
          margin: auto;
        "></div>
      </div>
    `,
  });

  // Define the circle color based on PM2.5 value
  const circleColor = pm25Value > 150 ? 'red' : pm25Value > 100 ? 'orange' : 'green';

  // Use useEffect to re-center the map when coordinates change
  // Coordinate update handler
  useEffect(() => {
    if (mapRef.current && coordinates) {
      const hasChanged = coordinates.some((val, i) => val !== prevCoords.current[i]);
      
      if (hasChanged) {
        mapRef.current.flyTo(coordinates, 15, {
          animate: true,
          duration: 1.5
        });
        prevCoords.current = coordinates;
      }
    }
  }, [coordinates]);

  return (
    <MapContainer
      key={`map-${coordinates.toString()}`} // Force new map instance
      center={coordinates}
      zoom={15}
      scrollWheelZoom={false}
      style={{ height: '300px', width: '300px', margin: 'auto' }}
      whenCreated={mapInstance => { mapRef.current = mapInstance; }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      <Circle
        center={coordinates}
        radius={1000}
        pathOptions={{
          fillColor: pm25Value > 150 ? 'red' : pm25Value > 100 ? 'orange' : 'green',
          color: pm25Value > 150 ? 'red' : pm25Value > 100 ? 'orange' : 'green',
          opacity: 0.3,
        }}
      />
      <Marker position={coordinates} icon={pinIcon}>
        <Popup>PM 2.5: {pm25Value} µg/m³</Popup>
      </Marker>
    </MapContainer>
  );
};

MapComponent.propTypes = {
  pm25Value: PropTypes.number.isRequired,
  coordinates: PropTypes.arrayOf(PropTypes.number).isRequired,
};

export default MapComponent;