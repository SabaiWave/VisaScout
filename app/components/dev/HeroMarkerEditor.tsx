'use client';

import { useEffect, useState, type RefObject } from 'react';

export interface HeroMarker {
  top: string;
  left: string;
  size: number;
  opacity: number;
  rings: number[];
}

interface HeroMarkerEditorProps {
  markers: HeroMarker[];
  containerRef: RefObject<HTMLElement | null>;
}

const isDev = process.env.NEXT_PUBLIC_ENVIRONMENT === 'development';

// Natural pixel dimensions of public/hero/hero-landing.jpg. Positions are
// stored as % of THIS image, not of the container — see cover math below.
const IMAGE_NATURAL = { w: 2560, h: 1440 };

// Replicates the browser's object-fit: cover math so marker positions can be
// computed against the image's actual visible content, not the container box.
// The container and image share the same top-left origin (image is `fill`,
// object-position defaults to center) so this is the only geometry needed.
function coverGeometry(containerW: number, containerH: number) {
  const scale = Math.max(containerW / IMAGE_NATURAL.w, containerH / IMAGE_NATURAL.h);
  const renderedW = IMAGE_NATURAL.w * scale;
  const renderedH = IMAGE_NATURAL.h * scale;
  const offsetX = (containerW - renderedW) / 2;
  const offsetY = (containerH - renderedH) / 2;
  return { renderedW, renderedH, offsetX, offsetY };
}

function formatMarkers(markers: HeroMarker[]) {
  const lines = markers.map(
    (m) => `  { top: '${m.top}', left: '${m.left}', size: ${m.size}, opacity: ${m.opacity}, rings: [${m.rings.join(', ')}] },`
  );
  return `const HERO_MARKERS = [\n${lines.join('\n')}\n];`;
}

// Dev-only drag editor for HERO_MARKERS. Positions are % of the hero image's
// own pixels (via object-fit: cover math, recomputed on resize) so markers
// stay on the same map feature (e.g. land) at every viewport size — not just
// the size they were placed at. Renders the plain pulsing markers in
// production. Press M in dev to drag; Copy Positions pastes back into page.tsx.
export function HeroMarkerEditor({ markers: initialMarkers, containerRef }: HeroMarkerEditorProps) {
  const [markers, setMarkers] = useState(initialMarkers);
  const [editMode, setEditMode] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef]);

  useEffect(() => {
    if (!isDev) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== 'm') return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      setEditMode((v) => !v);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Single listener that picks the nearest marker to the click, not whichever
  // marker happens to be painted on top — fixes overlapping/close-together
  // markers being unreachable when one visually covers another.
  useEffect(() => {
    if (!isDev || !editMode || size.w === 0 || size.h === 0) return;
    const el = containerRef.current;
    if (!el) return;
    const { renderedW, renderedH, offsetX, offsetY } = coverGeometry(size.w, size.h);
    const positioned = markers.map((m, i) => ({
      i,
      px: offsetX + (parseFloat(m.left) / 100) * renderedW,
      py: offsetY + (parseFloat(m.top) / 100) * renderedH,
    }));
    function onDown(e: PointerEvent) {
      const rect = el!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      let nearest = positioned[0];
      let nearestDist = Infinity;
      for (const p of positioned) {
        const d = Math.hypot(p.px - x, p.py - y);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = p;
        }
      }
      if (nearestDist > 24) return;
      e.preventDefault();
      setDragIndex(nearest.i);
    }
    el.addEventListener('pointerdown', onDown);
    return () => el.removeEventListener('pointerdown', onDown);
  }, [containerRef, editMode, markers, size]);

  useEffect(() => {
    if (dragIndex === null) return;
    function onMove(e: PointerEvent) {
      const el = containerRef.current;
      if (!el || size.w === 0 || size.h === 0) return;
      const rect = el.getBoundingClientRect();
      const { renderedW, renderedH, offsetX, offsetY } = coverGeometry(size.w, size.h);
      const imgX = ((e.clientX - rect.left - offsetX) / renderedW) * 100;
      const imgY = ((e.clientY - rect.top - offsetY) / renderedH) * 100;
      const left = Math.min(100, Math.max(0, imgX));
      const top = Math.min(100, Math.max(0, imgY));
      setMarkers((prev) =>
        prev.map((m, i) => (i === dragIndex ? { ...m, top: `${top.toFixed(1)}%`, left: `${left.toFixed(1)}%` } : m))
      );
    }
    function onUp() {
      setDragIndex(null);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragIndex, containerRef, size]);

  async function handleCopy() {
    await navigator.clipboard.writeText(formatMarkers(markers));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleAdd() {
    setMarkers((prev) => [...prev, { top: '20%', left: '50%', size: 5, opacity: 1, rings: [0.7, 2.5] }]);
  }

  function handleRemove(index: number) {
    setDragIndex(null);
    setMarkers((prev) => prev.filter((_, i) => i !== index));
  }

  if (size.w === 0 || size.h === 0) return null;
  const { renderedW, renderedH, offsetX, offsetY } = coverGeometry(size.w, size.h);

  return (
    <>
      {markers.map((m, i) => {
        const fx = parseFloat(m.left) / 100;
        const fy = parseFloat(m.top) / 100;
        const px = offsetX + fx * renderedW;
        const py = offsetY + fy * renderedH;
        return (
          <div
            key={i}
            aria-hidden={!editMode}
            className="absolute z-[5]"
            style={{
              top: `${py}px`,
              left: `${px}px`,
              opacity: m.opacity,
              // pointer-events disabled in edit mode — the container-level
              // listener above picks the nearest marker instead, so an
              // overlapping marker never blocks clicks meant for another.
              pointerEvents: isDev && editMode ? 'none' : undefined,
              cursor: isDev && editMode ? (dragIndex === i ? 'grabbing' : 'grab') : undefined,
            }}
          >
            {isDev && editMode && (
              <div
                className="absolute rounded-full"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '28px',
                  height: '28px',
                  background: 'rgba(200,120,10,0.15)',
                  border: '1px dashed var(--color-amber)',
                }}
              />
            )}
            <div className="relative" style={{ width: `${m.size}px`, height: `${m.size}px` }}>
              {m.rings.map((delay) => (
                <span
                  key={delay}
                  className="pin-ring absolute rounded-full"
                  style={{ top: '50%', left: '50%', border: '1px solid var(--color-amber)', animationDelay: `${delay}s` }}
                />
              ))}
              <span className="absolute inset-0" style={{ background: 'var(--color-amber)', borderRadius: '50%' }} />
            </div>
            {isDev && editMode && (
              <span
                className="absolute whitespace-nowrap"
                style={{
                  top: '14px',
                  left: '14px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.625rem',
                  color: 'var(--color-amber)',
                  background: 'rgba(6,12,18,0.9)',
                  padding: '2px 5px',
                  pointerEvents: 'none',
                }}
              >
                #{i} {m.top} / {m.left}
              </span>
            )}
          </div>
        );
      })}

      {isDev && editMode && (
        <div
          className="fixed z-[100] flex flex-col gap-2"
          style={{
            bottom: '20px',
            left: '20px',
            background: 'rgba(6,12,18,0.96)',
            border: '1px solid var(--color-border)',
            padding: '14px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6875rem',
            color: 'var(--color-text-secondary)',
            minWidth: '260px',
          }}
        >
          <div style={{ color: 'var(--color-amber)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Marker Editor &middot; Drag Dots
          </div>
          <div style={{ color: 'var(--color-text-tertiary)' }}>% of image pixels, not layout</div>
          {markers.map((m, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <span>
                #{i} top:{m.top} left:{m.left}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(i)}
                aria-label={`Remove marker ${i}`}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: '0 2px' }}
              >
                &times;
              </button>
            </div>
          ))}
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={handleAdd}
              style={{
                flex: 1,
                background: 'none',
                color: 'var(--color-amber)',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '8px 10px',
                border: '1px solid var(--color-amber)',
                cursor: 'pointer',
              }}
            >
              + Add Marker
            </button>
            <button
              type="button"
              onClick={handleCopy}
              style={{
                flex: 1,
                background: 'var(--color-amber)',
                color: 'var(--color-neutral)',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '8px 10px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div style={{ color: 'var(--color-text-tertiary)' }}>Press M to exit</div>
        </div>
      )}
    </>
  );
}
