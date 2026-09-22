import React, { useEffect, useRef } from 'react';
import { 
  Box, 
  Layers, 
  FileCode, 
  Database, 
  Key
} from 'lucide-react';

interface LiquidBackgroundProps {
  children?: React.ReactNode;
}

const PARTICLES = [
  { x: '8%',  y: '16%', s: 6, c: '0, 237, 255',   o: 0.50, d: '7s' },
  { x: '18%', y: '72%', s: 9, c: '255, 59, 174',   o: 0.45, d: '9s' },
  { x: '30%', y: '32%', s: 5, c: '181, 149, 255',  o: 0.50, d: '8s' },
  { x: '44%', y: '12%', s: 7, c: '171, 255, 227',  o: 0.40, d: '10s' },
  { x: '55%', y: '66%', s: 6, c: '0, 237, 255',    o: 0.45, d: '7s' },
  { x: '66%', y: '24%', s: 8, c: '255, 175, 239',  o: 0.40, d: '9s' },
  { x: '78%', y: '58%', s: 5, c: '181, 149, 255',  o: 0.50, d: '8.5s' },
  { x: '88%', y: '16%', s: 7, c: '255, 59, 174',   o: 0.40, d: '11s' },
  { x: '12%', y: '44%', s: 4, c: '171, 255, 227',  o: 0.50, d: '8s' },
  { x: '70%', y: '84%', s: 9, c: '0, 237, 255',    o: 0.35, d: '9.5s' }
];

export const LiquidBackground: React.FC<LiquidBackgroundProps> = ({ children }) => {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = backdropRef.current;
    if (!root) return;
    const onMove = (e: MouseEvent) => {
      root.style.setProperty('--mx', e.clientX + 'px');
      root.style.setProperty('--my', e.clientY + 'px');
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <>
      <div ref={backdropRef} className="floating-diagram-backdrop" aria-hidden="true">
        {/* Mouse-reactive cursor glow */}
        <div className="bg-cursor-glow" />

        {/* Floating neon particles */}
        <div className="bg-particles">
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              className="bg-particle"
              style={{
                left: p.x,
                top: p.y,
                width: p.s,
                height: p.s,
                background: `radial-gradient(circle, rgba(${p.c}, 0.90), rgba(${p.c}, 0) 70%)`,
                opacity: p.o,
                ['--po' as any]: p.o,
                animationDuration: p.d,
                animationDelay: `${-i * 0.9}s`
              }}
            />
          ))}
        </div>

        {/* Sweeping neon beam */}
        <div className="bg-beam" />
        {/* Dynamic SVG Connection Mesh with Glowing Pulses */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1,
            filter: 'blur(1px)'
          }}
        >
          <defs>
            <marker
              id="bg-uml-arrow-blue"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#38BDF8" />
            </marker>
            <marker
              id="bg-uml-diamond-amber"
              viewBox="0 0 16 16"
              refX="1"
              refY="8"
              markerWidth="12"
              markerHeight="12"
              orient="auto"
            >
              <polygon points="1,8 8,2 15,8 8,14" fill="#F59E0B" stroke="#ffffff" strokeWidth="1.5" />
            </marker>
            <filter id="line-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Connection Line 1: Top-Left Entity to Center-Right */}
          <path
            d="M 30% 30% Q 50% 15%, 85% 25%"
            fill="none"
            stroke="#38BDF8"
            strokeWidth="2.5"
            strokeDasharray="6,6"
            markerEnd="url(#bg-uml-arrow-blue)"
            filter="url(#line-glow)"
            opacity="0.8"
          />

          {/* Connection Line 2: Center-Right to Bottom-Right */}
          <path
            d="M 85% 35% C 80% 55%, 70% 65%, 65% 78%"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeDasharray="6,6"
            markerEnd="url(#bg-uml-diamond-amber)"
            filter="url(#line-glow)"
            opacity="0.8"
          />

          {/* Connection Line 3: Bottom-Right to Bottom-Left */}
          <path
            d="M 60% 82% Q 40% 92%, 18% 78%"
            fill="none"
            stroke="#A855F7"
            strokeWidth="2.5"
            strokeDasharray="6,6"
            filter="url(#line-glow)"
            opacity="0.8"
          />

          {/* Connection Line 4: Bottom-Left to Top-Left */}
          <path
            d="M 20% 70% C 15% 55%, 15% 45%, 28% 35%"
            fill="none"
            stroke="#10B981"
            strokeWidth="2.5"
            strokeDasharray="5,5"
            filter="url(#line-glow)"
            opacity="0.8"
          />
        </svg>

        {/* 🟦 VIBRANT SQUARE DIAGRAM 1: «Entity» Usuario (Top-Left, overlaps behind card) */}
        <div
          className="floating-vibrant-square floating-anim-1 bg-parallax-1"
          style={{
            top: 'calc(50% - 250px)',
            left: 'calc(50% - 310px)',
            width: '290px',
            minHeight: '260px',
            background: 'linear-gradient(145deg, #1845AD 0%, #0284C7 55%, #38BDF8 100%)',
            boxShadow: '0 20px 50px rgba(24, 69, 173, 0.55)',
            border: '2px solid rgba(255, 255, 255, 0.35)',
            borderRadius: '20px',
            zIndex: 2
          }}
        >
          {/* Card Header */}
          <div style={{
            padding: '12px 14px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.20)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.25)',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Box size={16} color="#FFFFFF" />
              </div>
              <div>
                <div style={{ fontSize: '0.66rem', color: '#E0F2FE', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  &laquo;Entity&raquo;
                </div>
                <div style={{ fontSize: '0.98rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                  Usuario
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.65rem', background: 'rgba(255, 255, 255, 0.20)', padding: '2px 6px', borderRadius: '4px', color: '#FFFFFF', fontWeight: 700 }}>
              JPA
            </span>
          </div>

          {/* Attributes List */}
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#FCA5A5', fontWeight: 900 }}>-</span>
              <span style={{ fontWeight: 700 }}>id</span>
              <Key size={12} color="#FDE047" />
              <span>:</span>
              <span style={{ color: '#BAE6FD', fontWeight: 800 }}>Long</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#FCA5A5', fontWeight: 900 }}>-</span>
              <span style={{ fontWeight: 700 }}>nombre</span>
              <span>:</span>
              <span style={{ color: '#BAE6FD', fontWeight: 800 }}>String</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#FCA5A5', fontWeight: 900 }}>-</span>
              <span style={{ fontWeight: 700 }}>email</span>
              <span>:</span>
              <span style={{ color: '#BAE6FD', fontWeight: 800 }}>String</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#FCA5A5', fontWeight: 900 }}>-</span>
              <span style={{ fontWeight: 700 }}>rol</span>
              <span>:</span>
              <span style={{ color: '#E9D5FF', fontWeight: 800 }}>RolUsuario</span>
            </div>
          </div>

          {/* Methods */}
          <div style={{ padding: '10px 14px', background: 'rgba(0, 0, 0, 0.15)', borderTop: '1px solid rgba(255, 255, 255, 0.12)', fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#86EFAC', fontWeight: 900 }}>+</span>
              <span style={{ fontWeight: 600 }}>validarPassword():</span>
              <span style={{ color: '#BAE6FD', fontWeight: 800 }}>Boolean</span>
            </div>
          </div>
        </div>

        {/* 🟧 VIBRANT SQUARE DIAGRAM 2: «Service» AuthService (Bottom-Right, overlaps behind card) */}
        <div
          className="floating-vibrant-square floating-anim-2 bg-parallax-2"
          style={{
            top: 'calc(50% + 40px)',
            left: 'calc(50% + 90px)',
            width: '295px',
            minHeight: '260px',
            background: 'linear-gradient(145deg, #C2410C 0%, #EA580C 50%, #F59E0B 100%)',
            boxShadow: '0 20px 50px rgba(234, 88, 12, 0.55)',
            border: '2px solid rgba(255, 255, 255, 0.35)',
            borderRadius: '20px',
            zIndex: 2
          }}
        >
          {/* Card Header */}
          <div style={{
            padding: '12px 14px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.20)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.25)',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Layers size={16} color="#FFFFFF" />
              </div>
              <div>
                <div style={{ fontSize: '0.66rem', color: '#FEF3C7', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  &laquo;Service&raquo;
                </div>
                <div style={{ fontSize: '0.98rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                  AuthService
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.65rem', background: 'rgba(255, 255, 255, 0.20)', padding: '2px 6px', borderRadius: '4px', color: '#FFFFFF', fontWeight: 700 }}>
              Spring
            </span>
          </div>

          {/* Attributes List */}
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#FCA5A5', fontWeight: 900 }}>-</span>
              <span style={{ fontWeight: 700 }}>userRepo</span>
              <span>:</span>
              <span style={{ color: '#FEF08A', fontWeight: 800 }}>UserRepository</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#FCA5A5', fontWeight: 900 }}>-</span>
              <span style={{ fontWeight: 700 }}>jwtProvider</span>
              <span>:</span>
              <span style={{ color: '#FEF08A', fontWeight: 800 }}>JwtService</span>
            </div>
          </div>

          {/* Methods */}
          <div style={{ padding: '10px 14px', background: 'rgba(0, 0, 0, 0.15)', borderTop: '1px solid rgba(255, 255, 255, 0.12)', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#86EFAC', fontWeight: 900 }}>+</span>
              <span style={{ fontWeight: 600 }}>login(dto):</span>
              <span style={{ color: '#FEF08A', fontWeight: 800 }}>SessionToken</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#86EFAC', fontWeight: 900 }}>+</span>
              <span style={{ fontWeight: 600 }}>unirseASala(pin):</span>
              <span style={{ color: '#FEF08A', fontWeight: 800 }}>RoomSession</span>
            </div>
          </div>
        </div>

        {/* 🟩 VIBRANT SQUARE DIAGRAM 3: «Controller» AuthController (Top-Right) */}
        <div
          className="floating-vibrant-square floating-anim-3 bg-parallax-3"
          style={{
            top: '8%',
            right: '7%',
            width: '275px',
            minHeight: '230px',
            background: 'linear-gradient(145deg, #065F46 0%, #059669 55%, #10B981 100%)',
            boxShadow: '0 20px 45px rgba(5, 150, 105, 0.45)',
            border: '2px solid rgba(255, 255, 255, 0.30)',
            borderRadius: '20px',
            zIndex: 2
          }}
        >
          <div style={{
            padding: '12px 14px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.20)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.25)',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FileCode size={16} color="#FFFFFF" />
              </div>
              <div>
                <div style={{ fontSize: '0.66rem', color: '#D1FAE5', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  &laquo;Controller&raquo;
                </div>
                <div style={{ fontSize: '0.98rem', fontWeight: 900, color: '#FFFFFF' }}>
                  AuthController
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.65rem', background: 'rgba(255, 255, 255, 0.20)', padding: '2px 6px', borderRadius: '4px', color: '#FFFFFF', fontWeight: 700 }}>
              REST
            </span>
          </div>
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: '#FFFFFF' }}>
            <div>
              <span style={{ color: '#86EFAC', fontWeight: 900 }}>+ </span>
              <span style={{ fontWeight: 600 }}>postLogin(req): </span>
              <span style={{ color: '#A7F3D0', fontWeight: 800 }}>ResponseEntity</span>
            </div>
            <div>
              <span style={{ color: '#86EFAC', fontWeight: 900 }}>+ </span>
              <span style={{ fontWeight: 600 }}>postCreateRoom(): </span>
              <span style={{ color: '#A7F3D0', fontWeight: 800 }}>ResponseEntity</span>
            </div>
          </div>
        </div>

        {/* 🟪 VIBRANT SQUARE DIAGRAM 4: «Repository» UserRepository (Bottom-Left) */}
        <div
          className="floating-vibrant-square floating-anim-4 bg-parallax-4"
          style={{
            bottom: '8%',
            left: '7%',
            width: '270px',
            minHeight: '230px',
            background: 'linear-gradient(145deg, #581C87 0%, #7C3AED 55%, #A855F7 100%)',
            boxShadow: '0 20px 45px rgba(124, 58, 237, 0.45)',
            border: '2px solid rgba(255, 255, 255, 0.30)',
            borderRadius: '20px',
            zIndex: 2
          }}
        >
          <div style={{
            padding: '12px 14px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.20)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.25)',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Database size={16} color="#FFFFFF" />
              </div>
              <div>
                <div style={{ fontSize: '0.66rem', color: '#F3E8FF', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  &laquo;Repository&raquo;
                </div>
                <div style={{ fontSize: '0.98rem', fontWeight: 900, color: '#FFFFFF' }}>
                  UserRepository
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.65rem', background: 'rgba(255, 255, 255, 0.20)', padding: '2px 6px', borderRadius: '4px', color: '#FFFFFF', fontWeight: 700 }}>
              PostgreSQL
            </span>
          </div>
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: '#FFFFFF' }}>
            <div>
              <span style={{ color: '#86EFAC', fontWeight: 900 }}>+ </span>
              <span style={{ fontWeight: 600 }}>findByDni(dni): </span>
              <span style={{ color: '#E9D5FF', fontWeight: 800 }}>Optional</span>
            </div>
            <div>
              <span style={{ color: '#86EFAC', fontWeight: 900 }}>+ </span>
              <span style={{ fontWeight: 600 }}>save(usuario): </span>
              <span style={{ color: '#E9D5FF', fontWeight: 800 }}>Usuario</span>
            </div>
          </div>
        </div>
      </div>
      {children}
    </>
  );
};
