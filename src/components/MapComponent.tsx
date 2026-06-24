'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';

interface MapComponentProps {
  lat: number;
  lng: number;
}

export default function MapComponent({ lat, lng }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    // Initialize map
    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([lat, lng], 15);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(mapRef.current);

      // Add user marker
      const userIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="width:16px;height:16px;background:var(--nets-blue);border:3px solid white;border-radius:50%;box-shadow:0 0 10px rgba(0,0,0,0.3);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      L.marker([lat, lng], { icon: userIcon }).addTo(mapRef.current);

      // Add mock merchant pins around user
      const offsets = [
        [0.002, 0.003, '7-Eleven'],
        [-0.001, 0.004, 'Central Mall'],
        [0.004, -0.002, 'Night Market'],
        [-0.003, -0.004, 'Food Court'],
        [0.001, -0.005, 'Cafe'],
      ];

      const merchantIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="display:flex;flex-direction:column;align-items:center;">
                 <div style="width:12px;height:12px;background:var(--nets-red);border:2px solid var(--border-color);transform:rotate(45deg);"></div>
               </div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      offsets.forEach(([dLat, dLng, name]) => {
        const marker = L.marker([lat + (dLat as number), lng + (dLng as number)], { icon: merchantIcon }).addTo(mapRef.current!);
        marker.bindTooltip(name as string, {
          permanent: true,
          direction: 'top',
          offset: [0, -10],
          className: 'map-pin-label-leaflet',
        });
      });
    } else {
      mapRef.current.setView([lat, lng]);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lng]);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .map-pin-label-leaflet {
          background: var(--card-bg) !important;
          border: 1.5px solid var(--border-color) !important;
          color: var(--text-primary) !important;
          font-family: var(--font-mono) !important;
          font-size: 0.55rem !important;
          font-weight: 700 !important;
          padding: 1px 4px !important;
          box-shadow: none !important;
        }
        .map-pin-label-leaflet::before { display: none !important; }
      `}} />
      <div ref={containerRef} className="leaflet-map-container" />
    </>
  );
}
