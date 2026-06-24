'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

interface NETSMapProps {
  isOverseasMode?: boolean;
  compact?: boolean;
}

const mapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] }
];

const LOCAL_FALLBACK = { lat: 1.3404, lng: 103.7090 };
const OVERSEAS_FALLBACK = { lat: 13.7563, lng: 100.5018 };

export default function NETSMap({ isOverseasMode = false, compact = false }: NETSMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const [center, setCenter] = useState(isOverseasMode ? OVERSEAS_FALLBACK : LOCAL_FALLBACK);
  const [selectedMarker, setSelectedMarker] = useState<any>(null);

  useEffect(() => {
    if (!isOverseasMode) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
          },
          () => {
            setCenter(LOCAL_FALLBACK); // Fallback silently
          }
        );
      } else {
        setCenter(LOCAL_FALLBACK);
      }
    } else {
      setCenter(OVERSEAS_FALLBACK);
    }
  }, [isOverseasMode]);

  const merchants = useMemo(() => {
    if (isOverseasMode) {
      return [
        { id: 'm1', name: '7-Eleven', lat: center.lat + 0.002, lng: center.lng + 0.001, dist: '120m away', tag: 'Convenience' },
        { id: 'm2', name: 'FairPrice Finest', lat: center.lat - 0.001, lng: center.lng - 0.002, dist: '250m away', tag: 'Grocery' },
        { id: 'm3', name: 'Starbucks', lat: center.lat + 0.003, lng: center.lng - 0.001, dist: '300m away', tag: 'Cafe' },
        { id: 'm4', name: "McDonald's", lat: center.lat - 0.003, lng: center.lng + 0.002, dist: '400m away', tag: 'Food' },
        { id: 'm5', name: 'Uniqlo', lat: center.lat + 0.001, lng: center.lng + 0.003, dist: '150m away', tag: 'Retail' },
        { id: 'm6', name: 'Guardian', lat: center.lat - 0.002, lng: center.lng - 0.003, dist: '500m away', tag: 'Health' },
      ];
    } else {
      return [
        { id: 'm1', name: 'Sheng Siong', lat: center.lat + 0.002, lng: center.lng + 0.001, dist: '120m away', tag: 'Grocery' },
        { id: 'm2', name: 'Koufu', lat: center.lat - 0.001, lng: center.lng - 0.002, dist: '250m away', tag: 'Food' },
        { id: 'm3', name: 'Cheers', lat: center.lat + 0.003, lng: center.lng - 0.001, dist: '300m away', tag: 'Convenience' },
        { id: 'm4', name: 'Popular Bookstore', lat: center.lat - 0.003, lng: center.lng + 0.002, dist: '400m away', tag: 'Retail' },
        { id: 'm5', name: 'Watsons', lat: center.lat + 0.001, lng: center.lng + 0.003, dist: '150m away', tag: 'Health' },
        { id: 'm6', name: 'NTUC FairPrice', lat: center.lat - 0.002, lng: center.lng - 0.003, dist: '500m away', tag: 'Grocery' },
        { id: 'm7', name: "McDonald's", lat: center.lat + 0.004, lng: center.lng + 0.001, dist: '600m away', tag: 'Food' },
        { id: 'm8', name: 'Kopitiam', lat: center.lat - 0.001, lng: center.lng + 0.004, dist: '350m away', tag: 'Food' },
      ].slice(0, compact ? 3 : 8);
    }
  }, [center, isOverseasMode, compact]);

  const friends = useMemo(() => {
    if (compact) return [];
    if (isOverseasMode) {
      return [
        { id: 'f1', name: 'Kai', merchant: 'Chatuchak Market', amount: '$28.00', time: '2 days ago', lat: center.lat + 0.005, lng: center.lng + 0.002, initial: 'K' },
        { id: 'f2', name: 'Priya', merchant: 'Terminal 21', amount: '$15.50', time: '3 days ago', lat: center.lat - 0.004, lng: center.lng - 0.001, initial: 'P' },
      ];
    } else {
      return [
        { id: 'f1', name: 'Kai', merchant: 'Tian Tian Chicken Rice', amount: '$5.50', time: 'Yesterday', lat: center.lat + 0.005, lng: center.lng + 0.002, initial: 'K' },
        { id: 'f2', name: 'Manoj', merchant: 'Toast Box', amount: '$4.20', time: '2 hours ago', lat: center.lat - 0.004, lng: center.lng - 0.001, initial: 'M' },
      ];
    }
  }, [center, isOverseasMode, compact]);

  const onMapClick = useCallback(() => {
    setSelectedMarker(null);
  }, []);

  const merchantIcon = {
    path: 'M 0 -15 L 15 0 L 0 15 L -15 0 Z',
    fillColor: '#C0001F',
    fillOpacity: 1,
    strokeWeight: 1,
    strokeColor: '#fff',
    scale: 1,
  };

  const friendIcon = {
    path: 'M 0,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0',
    fillColor: '#0033A0',
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: '#fff',
    scale: 1.2,
    anchor: { x: 10, y: 10 }
  };

  if (loadError || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div style={{ width: '100%', height: compact ? '200px' : '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E8E4DF', border: '2.5px solid var(--border-color)', position: 'relative' }}>
        {/* Mock SVG Map Fallback */}
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', opacity: 0.5 }}>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ccc" strokeWidth="1"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <circle cx="50%" cy="50%" r="8" fill="#C0001F" />
          <circle cx="30%" cy="40%" r="6" fill="#C0001F" />
          <circle cx="70%" cy="60%" r="6" fill="#C0001F" />
        </svg>
        <span className="text-mono" style={{ zIndex: 1, background: '#fff', padding: '4px 8px', border: '1px solid #000' }}>
          Map unavailable (Add API Key)
        </span>
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="skeleton-pulse" style={{ width: '100%', height: compact ? '200px' : '400px', borderRadius: '0' }} />;
  }

  return (
    <div style={{ border: '2.5px solid var(--border-color)' }}>
      {!compact && (
        <div style={{ background: 'var(--ink-black)', color: '#fff', padding: '8px', textAlign: 'center' }}>
          <span className="text-mono" style={{ fontSize: '0.7rem' }}>
            {isOverseasMode ? 'Live map • NETS accepted locations in Bangkok' : 'Live map • NETS accepted near you in Singapore'}
          </span>
        </div>
      )}
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: compact ? '200px' : '400px' }}
        center={center}
        zoom={14}
        options={{
          styles: mapStyles,
          disableDefaultUI: true,
          zoomControl: !compact,
        }}
        onClick={onMapClick}
      >
        {merchants.map(m => (
          <Marker
            key={m.id}
            position={{ lat: m.lat, lng: m.lng }}
            icon={merchantIcon}
            onClick={() => setSelectedMarker({ type: 'merchant', ...m })}
          />
        ))}

        {friends.map(f => (
          <Marker
            key={f.id}
            position={{ lat: f.lat, lng: f.lng }}
            icon={friendIcon}
            label={{ text: f.initial, color: 'white', fontSize: '10px', fontWeight: 'bold' }}
            onClick={() => setSelectedMarker({ type: 'friend', ...f })}
          />
        ))}

        {selectedMarker && (
          <InfoWindow
            position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
            onCloseClick={() => setSelectedMarker(null)}
            options={{ pixelOffset: new window.google.maps.Size(0, -20) }}
          >
            <div style={{ padding: '4px', maxWidth: '180px' }}>
              {selectedMarker.type === 'merchant' ? (
                <>
                  <div className="text-mono-bold" style={{ fontSize: '0.85rem', color: '#1A1A1A' }}>{selectedMarker.name}</div>
                  <div style={{ color: '#00A86B', fontSize: '0.7rem', fontWeight: 700, margin: '4px 0' }}>NETS QR Accepted ✓</div>
                  <div className="text-mono" style={{ fontSize: '0.65rem', color: '#666', marginBottom: '8px' }}>{selectedMarker.dist}</div>
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedMarker.lat},${selectedMarker.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'block', background: 'var(--nets-red)', color: '#fff', textAlign: 'center', padding: '4px 0', fontSize: '0.7rem', fontWeight: 800, textDecoration: 'none' }}
                  >
                    Get Directions
                  </a>
                </>
              ) : (
                <>
                  <div className="text-mono-bold" style={{ fontSize: '0.8rem', color: 'var(--nets-blue)' }}>{selectedMarker.name} paid here</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, margin: '4px 0', color: '#1A1A1A' }}>{selectedMarker.merchant}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                    <span style={{ fontWeight: 800, color: 'var(--nets-red)' }}>{selectedMarker.amount}</span>
                    <span style={{ color: '#666' }}>{selectedMarker.time}</span>
                  </div>
                </>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
