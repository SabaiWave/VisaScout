'use client';

import { useEffect, useState } from 'react';

// Supported-destination waypoints — scroll pans through them in order.
const WAYPOINTS = [
  { lat: 13.756,  lng: 100.520 }, // Bangkok
  { lat: 18.783,  lng: 98.993  }, // Chiang Mai
  { lat: 10.776,  lng: 106.693 }, // Ho Chi Minh City
  { lat: -8.340,  lng: 115.091 }, // Bali
  { lat: 1.283,   lng: 103.833 }, // Singapore
  { lat: 14.058,  lng: 108.277 }, // Vietnam highlands
  { lat: 11.562,  lng: 104.916 }, // Phnom Penh
  { lat: 35.689,  lng: 139.692 }, // Tokyo
  { lat: 37.566,  lng: 126.978 }, // Seoul
  { lat: 38.717,  lng: -9.137  }, // Lisbon
  { lat: 40.416,  lng: -3.703  }, // Madrid
  { lat: 19.433,  lng: -99.133 }, // Mexico City
];

function toDMS(decimal: number, posDir: string, negDir: string): string {
  const dir = decimal >= 0 ? posDir : negDir;
  const abs = Math.abs(decimal);
  const deg = Math.floor(abs);
  const minFull = (abs - deg) * 60;
  const min = Math.floor(minFull);
  const sec = Math.round((minFull - min) * 60);
  return `${deg}°${String(min).padStart(2, '0')}'${String(sec).padStart(2, '0')}"${dir}`;
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

export function LandingCoords({ position = 'top-left' }: { position?: 'top-left' | 'bottom-right' }) {
  const [coords, setCoords] = useState(() => {
    const w = WAYPOINTS[0];
    return `${toDMS(w.lat, 'N', 'S')} ${toDMS(w.lng, 'E', 'W')}`;
  });

  useEffect(() => {
    function update() {
      const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
      const progress = Math.min(window.scrollY / maxScroll, 1);
      const scaled = progress * (WAYPOINTS.length - 1);
      const idx = Math.floor(scaled);
      const t = scaled - idx;
      const a = WAYPOINTS[idx];
      const b = WAYPOINTS[Math.min(idx + 1, WAYPOINTS.length - 1)];
      const lat = lerp(a.lat, b.lat, t);
      const lng = lerp(a.lng, b.lng, t);
      setCoords(`${toDMS(lat, 'N', 'S')} ${toDMS(lng, 'E', 'W')}`);
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, []);

  const pos: React.CSSProperties = position === 'bottom-right'
    ? { bottom: '20px', right: '24px', textAlign: 'right' }
    : { top: '68px', left: '20px' };

  return (
    <div
      aria-hidden
      className="hidden lg:block fixed z-0 pointer-events-none"
      style={{
        ...pos,
        fontFamily: 'var(--font-mono)',
        fontSize: '0.55rem',
        letterSpacing: '0.1em',
        color: 'var(--color-text-tertiary)',
        lineHeight: 1.7,
      }}
    >
      {coords}
    </div>
  );
}
