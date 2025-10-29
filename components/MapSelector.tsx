import React, { useEffect, useRef } from 'react';

interface MapSelectorProps {
  onAreaSelect: (lat: number, lng: number) => void;
  latitude: number;
  longitude: number;
  radiusKm: number;
}

const MapSelector: React.FC<MapSelectorProps> = ({ onAreaSelect, latitude, longitude, radiusKm }) => {
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true
      }).setView([latitude, longitude], 13);
      mapRef.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);
      
      map.on('click', (event: any) => {
        onAreaSelect(event.latlng.lat, event.latlng.lng);
      });
    }
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current;
      const center: [number, number] = [latitude, longitude];
      
      // Update marker
      if (!markerRef.current) {
        markerRef.current = L.marker(center).addTo(map);
      } else {
        markerRef.current.setLatLng(center);
      }
      
      // Update circle
      const radiusMeters = radiusKm * 1000;
      if (!circleRef.current) {
        circleRef.current = L.circle(center, {
          radius: radiusMeters,
          color: '#2dd4bf',
          fillColor: '#2dd4bf',
          fillOpacity: 0.1,
          weight: 2,
        }).addTo(map);
      } else {
        circleRef.current.setLatLng(center).setRadius(radiusMeters);
      }

      map.setView(center, map.getZoom() || 13);
    }
  }, [latitude, longitude, radiusKm]);

  return <div ref={mapContainerRef} className="h-full w-full" />;
};

export default MapSelector;
