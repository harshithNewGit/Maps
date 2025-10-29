import React, { useEffect, useRef } from 'react';

interface MapSelectorProps {
  onAreaSelect: (lat: number, lng: number) => void;
  latitude: number;
  longitude: number;
}

const MapSelector: React.FC<MapSelectorProps> = ({ onAreaSelect, latitude, longitude }) => {
  const mapRef = useRef<any>(null);
  const drawnItemsRef = useRef<any>(null);
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
      
      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);
      drawnItemsRef.current = drawnItems;

      const drawControl = new L.Control.Draw({
        edit: {
          featureGroup: drawnItems,
          remove: true,
        },
        draw: {
          polygon: {
            allowIntersection: false,
            shapeOptions: {
              color: '#2dd4bf'
            },
          },
          rectangle: {
            shapeOptions: {
              color: '#2dd4bf'
            }
          },
          polyline: false,
          circle: false,
          marker: false,
          circlemarker: false,
        }
      });
      map.addControl(drawControl);

      map.on(L.Draw.Event.CREATED, (event: any) => {
        const layer = event.layer;
        drawnItems.clearLayers();
        drawnItems.addLayer(layer);

        const center = layer.getBounds().getCenter();
        onAreaSelect(center.lat, center.lng);
      });
      
      map.on(L.Draw.Event.EDITED, (event: any) => {
        const layers = event.layers;
        layers.eachLayer((layer: any) => {
            const center = layer.getBounds().getCenter();
            onAreaSelect(center.lat, center.lng);
        });
      });
    }
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView([latitude, longitude], mapRef.current.getZoom() || 13);
    }
  }, [latitude, longitude]);

  return <div ref={mapContainerRef} className="h-full w-full" />;
};

export default MapSelector;