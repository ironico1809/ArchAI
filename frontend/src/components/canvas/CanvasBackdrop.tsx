import React from 'react';

interface CanvasBackdropProps {
  /** Pan actual del lienzo en px (coordenadas de pantalla) */
  pan: { x: number; y: number };
  /** Zoom actual (0.05 … 4.0) */
  zoom: number;
}

/**
 * Fondo ambiental con rejilla de puntos sincronizada 1:1 con pan y zoom.
 *
 * Extraído del antiguo InteractiveStudioCanvas. Es JSX puro dependiente de
 * `pan`/`zoom` → al arrastrar una clase (que no cambia pan/zoom) este
 * componente queda memoizado y NO se re-renderiza (mejora de 60 FPS).
 *
 * Refactor 2026-09-26 · Fase 1 (legibilidad + rendimiento) · sin cambios de lógica.
 */
export const CanvasBackdrop: React.FC<CanvasBackdropProps> = ({ pan, zoom }) => (
  <div
    className="canvas-ambient-backdrop"
    style={{
      backgroundPosition: `${((pan.x % Math.max(12, Math.round(28 * zoom))) + Math.max(12, Math.round(28 * zoom))) % Math.max(12, Math.round(28 * zoom))}px ${((pan.y % Math.max(12, Math.round(28 * zoom))) + Math.max(12, Math.round(28 * zoom))) % Math.max(12, Math.round(28 * zoom))}px`,
      backgroundSize: `${Math.max(12, Math.round(28 * zoom))}px ${Math.max(12, Math.round(28 * zoom))}px`,
      backgroundImage: `radial-gradient(var(--bg-canvas-grid) ${Math.max(1, Number((1.2 * Math.min(zoom, 1.8)).toFixed(1)))}px, transparent ${Math.max(1, Number((1.2 * Math.min(zoom, 1.8)).toFixed(1)))}px)`
    }}
  />
);