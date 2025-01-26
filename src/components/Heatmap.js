import React from "react";
import { MapContainer, TileLayer, Circle, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const Heatmap = ({ pm25Value, coordinates }) => {
  const circleRadius = 1000; // Circle radius in meters

  // Google Maps-style pin icon
  const pinIcon = L.divIcon({
    className: "google-pin",
    html: `
      <div style="
        position: relative;
        width: 40px;
        height: 40px;
      ">
        <!-- Pin shadow -->
        <div style="
          position: absolute;
          width: 30px;
          height: 30px;
          background: rgba(0,0,0,0.2);
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg) translate(-5px, 10px);
        "></div>
        
        <!-- Main pin body -->
        <div style="
          position: absolute;
          width: 30px;
          height: 30px;
          background: #ff5e57;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">
          <!-- White center dot -->
          <div style="
            position: absolute;
            width: 10px;
            height: 10px;
            background: white;
            border-radius: 50%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
          "></div>
        </div>
      </div>
    `,
    iconSize: [40, 40], // Entire icon size
    iconAnchor: [15, 40], // Anchor point at the pin tip
    popupAnchor: [0, -40] // Popup appears above the pin
  });

  return (
    <MapContainer
      center={coordinates}
      zoom={13}
      style={{ height: "300px", width: "100%", borderRadius: "8px" }}
    >
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Circle
        center={coordinates}
        radius={circleRadius}
        pathOptions={{
          fillColor: pm25Value > 150 ? "red" : pm25Value > 100 ? "orange" : "green",
          color: pm25Value > 150 ? "red" : pm25Value > 100 ? "orange" : "green",
          fillOpacity: 0.2,
        }}
      />

      <Marker position={coordinates} icon={pinIcon}>
        <Popup>
          <b>PM 2.5:</b> {pm25Value} µg/m³
        </Popup>
      </Marker>
    </MapContainer>
  );
};

export default Heatmap;