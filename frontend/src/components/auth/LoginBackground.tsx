import React, { useEffect, useRef } from 'react';
import { 
  Box, 
  Layers, 
  FileCode, 
  Database, 
  Key, 
  Code2,
  Zap,
  CheckCircle2
} from 'lucide-react';

interface LoginBackgroundProps {
  children?: React.ReactNode;
}

// ✨ Paleta Midnight Navy & Warm Sand (vault 01 - Arquitectura):
// partículas sobrias en Arena Cálida, Marfil y Gris-Azul desaturado.
const PARTICLES = [
  { x: '8%',  y: '16%', s: 6, c: '232, 195, 158', o: 0.45, d: '7s' },
  { x: '18%', y: '72%', s: 9, c: '245, 225, 206', o: 0.40, d: '9s' },
  { x: '30%', y: '32%', s: 5, c: '136, 146, 176', o: 0.45, d: '8s' },
  { x: '44%', y: '12%', s: 7, c: '232, 195, 158', o: 0.36, d: '10s' },
  { x: '55%', y: '66%', s: 6, c: '245, 225, 206', o: 0.40, d: '7s' },
  { x: '66%', y: '24%', s: 8, c: '136, 146, 176', o: 0.36, d: '9s' },
  { x: '78%', y: '58%', s: 5, c: '232, 195, 158', o: 0.45, d: '8.5s' },
  { x: '88%', y: '16%', s: 7, c: '245, 225, 206', o: 0.36, d: '11s' },
  { x: '12%', y: '44%', s: 4, c: '136, 146, 176', o: 0.45, d: '8s' },
  { x: '70%', y: '84%', s: 9, c: '232, 195, 158', o: 0.30, d: '9.5s' }
];

export const LoginBackground: React.FC<LoginBackgroundProps> = ({ children }) => {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = backdropRef.current;
    if (!root) return;
    const onMove = (e: MouseEvent) => {
      root.style.setProperty('--mx', e.clientX + 'px');
      root.style.setProperty('--my', e.clientY + 'px');
      const normX = ((e.clientX / window.innerWidth) - 0.5) * 2;
      const normY = ((e.clientY / window.innerHeight) - 0.5) * 2;
      root.style.setProperty('--mouse-px', (normX * 28).toFixed(2) + 'px');
      root.style.setProperty('--mouse-py', (normY * 22).toFixed(2) + 'px');
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <>
      <div ref={backdropRef} className="floating-diagram-backdrop" aria-hidden="true">
        {/* Mouse-reactive cursor glow */}
        <div className="bg-cursor-glow" />

        {/* Floating particles */}
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

        {/* Sweeping warm-sand beam */}
        <div className="bg-beam" />

        {/* Dynamic SVG Connection Mesh (Arena Cálida, sin arcoíris) */}
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
              id="bg-uml-arrow-sand"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#e8c39e" />
            </marker>
            <marker
              id="bg-uml-diamond-sand"
              viewBox="0 0 16 16"
              refX="1"
              refY="8"
              markerWidth="12"
              markerHeight="12"
              orient="auto"
            >
              <polygon points="1,8 8,2 15,8 8,14" fill="none" stroke="#e8c39e" strokeWidth="1.5" />
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
            stroke="#e8c39e"
            strokeWidth="2.5"
            strokeDasharray="6,6"
            markerEnd="url(#bg-uml-arrow-sand)"
            filter="url(#line-glow)"
            opacity="0.70"
          />

          {/* Connection Line 2: Center-Right to Bottom-Right */}
          <path
            d="M 85% 35% C 80% 55%, 70% 65%, 65% 78%"
            fill="none"
            stroke="#8892b0"
            strokeWidth="2.5"
            strokeDasharray="6,6"
            markerEnd="url(#bg-uml-diamond-sand)"
            filter="url(#line-glow)"
            opacity="0.70"
          />

          {/* Connection Line 3: Bottom-Right to Bottom-Left */}
          <path
            d="M 60% 82% Q 40% 92%, 18% 78%"
            fill="none"
            stroke="#2f2c79"
            strokeWidth="2.5"
            strokeDasharray="6,6"
            filter="url(#line-glow)"
            opacity="0.70"
          />

          {/* Connection Line 4: Bottom-Left to Top-Left */}
          <path
            d="M 20% 70% C 15% 55%, 15% 45%, 28% 35%"
            fill="none"
            stroke="#e8c39e"
            strokeWidth="2.5"
            strokeDasharray="5,5"
            filter="url(#line-glow)"
            opacity="0.60"
          />

          {/* Connection Line 5: Top-Left Snippet to Entity */}
          <path
            d="M 16% 18% Q 22% 24%, 28% 32%"
            fill="none"
            stroke="#8892b0"
            strokeWidth="2"
            strokeDasharray="4,4"
            filter="url(#line-glow)"
            opacity="0.55"
          />

          {/* Connection Line 6: Controller to REST Endpoint */}
          <path
            d="M 82% 16% Q 86% 16%, 88% 18%"
            fill="none"
            stroke="#e8c39e"
            strokeWidth="2"
            strokeDasharray="4,4"
            filter="url(#line-glow)"
            opacity="0.55"
          />
        </svg>

        {/* 🟦 SOLID MATTE DIAGRAM 1: «Entity» Usuario (Top-Left, frames background) */}
        <div
          className="floating-vibrant-square floating-anim-1"
          style={{
            top: 'calc(50% - 280px + var(--mouse-py, 0px) * -0.6)',
            left: 'calc(50% - 460px + var(--mouse-px, 0px) * -0.6)',
            width: '280px',
            minHeight: '240px',
            background: 'rgba(23, 26, 74, 0.80)',
            boxShadow: '0 16px 36px rgba(0, 0, 32, 0.55)',
            border: '1px solid rgba(245, 225, 206, 0.10)',
            borderTop: '3px solid #e8c39e',
            borderRadius: '16px',
            zIndex: 2,
            transition: 'top 0.4s cubic-bezier(0.2, 0.8, 0.4, 1), left 0.4s cubic-bezier(0.2, 0.8, 0.4, 1)'
          }}
        >
          <div style={{
            padding: '11px 14px',
            borderBottom: '1px solid rgba(245, 225, 206, 0.10)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                background: 'rgba(0, 0, 32, 0.35)',
                padding: '5px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Box size={14} color="#8892b0" />
              </div>
              <div>
                <div style={{ fontSize: '0.64rem', color: '#8892b0', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  &laquo;Entity&raquo;
                </div>
                <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#f5e1ce', letterSpacing: '-0.01em' }}>
                  Usuario
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.65rem', background: '#2f2c79', padding: '2px 7px', borderRadius: '4px', color: '#e8c39e', fontWeight: 700 }}>
              JPA
            </span>
          </div>

          <div style={{ padding: '11px 14px', display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: '#f5e1ce' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#8892b0', fontWeight: 800 }}>-</span>
              <span style={{ fontWeight: 600 }}>id</span>
              <Key size={11} color="#8892b0" />
              <span>:</span>
              <span style={{ color: '#e8c39e', fontWeight: 700 }}>Long</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#8892b0', fontWeight: 800 }}>-</span>
              <span style={{ fontWeight: 600 }}>nombre</span>
              <span>:</span>
              <span style={{ color: '#e8c39e', fontWeight: 700 }}>String</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#8892b0', fontWeight: 800 }}>-</span>
              <span style={{ fontWeight: 600 }}>email</span>
              <span>:</span>
              <span style={{ color: '#e8c39e', fontWeight: 700 }}>String</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#8892b0', fontWeight: 800 }}>-</span>
              <span style={{ fontWeight: 600 }}>rol</span>
              <span>:</span>
              <span style={{ color: '#8892b0', fontWeight: 700 }}>RolUsuario</span>
            </div>
          </div>

          <div style={{ padding: '9px 14px', background: 'rgba(0, 0, 32, 0.35)', borderTop: '1px solid rgba(245, 225, 206, 0.08)', fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#f5e1ce' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#e8c39e', fontWeight: 800 }}>+</span>
              <span style={{ fontWeight: 600 }}>validarPassword():</span>
              <span style={{ color: '#e8c39e', fontWeight: 700 }}>Boolean</span>
            </div>
          </div>
        </div>

        {/* 🟩 SOLID MATTE DIAGRAM 2: «Service» AuthService (Bottom-Right, frames background) */}
        <div
          className="floating-vibrant-square floating-anim-2"
          style={{
            top: 'calc(50% + 50px + var(--mouse-py, 0px) * 0.7)',
            left: 'calc(50% + 220px + var(--mouse-px, 0px) * 0.7)',
            width: '280px',
            minHeight: '240px',
            background: 'rgba(23, 26, 74, 0.80)',
            boxShadow: '0 16px 36px rgba(0, 0, 32, 0.55)',
            border: '1px solid rgba(245, 225, 206, 0.10)',
            borderTop: '3px solid #2f2c79',
            borderRadius: '16px',
            zIndex: 2,
            transition: 'top 0.4s cubic-bezier(0.2, 0.8, 0.4, 1), left 0.4s cubic-bezier(0.2, 0.8, 0.4, 1)'
          }}
        >
          <div style={{
            padding: '11px 14px',
            borderBottom: '1px solid rgba(245, 225, 206, 0.10)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                background: 'rgba(0, 0, 32, 0.35)',
                padding: '5px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Layers size={14} color="#8892b0" />
              </div>
              <div>
                <div style={{ fontSize: '0.64rem', color: '#8892b0', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  &laquo;Service&raquo;
                </div>
                <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#f5e1ce', letterSpacing: '-0.01em' }}>
                  AuthService
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.65rem', background: '#2f2c79', padding: '2px 7px', borderRadius: '4px', color: '#e8c39e', fontWeight: 700 }}>
              Spring
            </span>
          </div>

          <div style={{ padding: '11px 14px', display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: '#f5e1ce' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#8892b0', fontWeight: 800 }}>-</span>
              <span style={{ fontWeight: 600 }}>userRepo</span>
              <span>:</span>
              <span style={{ color: '#e8c39e', fontWeight: 700 }}>UserRepository</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#8892b0', fontWeight: 800 }}>-</span>
              <span style={{ fontWeight: 600 }}>jwtProvider</span>
              <span>:</span>
              <span style={{ color: '#e8c39e', fontWeight: 700 }}>JwtService</span>
            </div>
          </div>

          <div style={{ padding: '9px 14px', background: 'rgba(0, 0, 32, 0.35)', borderTop: '1px solid rgba(245, 225, 206, 0.08)', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#f5e1ce' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#e8c39e', fontWeight: 800 }}>+</span>
              <span style={{ fontWeight: 600 }}>login(dto):</span>
              <span style={{ color: '#e8c39e', fontWeight: 700 }}>SessionToken</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#e8c39e', fontWeight: 800 }}>+</span>
              <span style={{ fontWeight: 600 }}>unirseASala(pin):</span>
              <span style={{ color: '#e8c39e', fontWeight: 700 }}>RoomSession</span>
            </div>
          </div>
        </div>

        {/* 🟪 SOLID MATTE DIAGRAM 3: «Controller» AuthController (Top-Right) */}
        <div
          className="floating-vibrant-square floating-anim-3"
          style={{
            top: 'calc(6% + var(--mouse-py, 0px) * -0.5)',
            right: 'calc(5% + var(--mouse-px, 0px) * -0.5)',
            width: '270px',
            minHeight: '220px',
            background: 'rgba(23, 26, 74, 0.80)',
            boxShadow: '0 16px 36px rgba(0, 0, 32, 0.55)',
            border: '1px solid rgba(245, 225, 206, 0.10)',
            borderTop: '3px solid #e8c39e',
            borderRadius: '16px',
            zIndex: 2,
            transition: 'top 0.4s cubic-bezier(0.2, 0.8, 0.4, 1), right 0.4s cubic-bezier(0.2, 0.8, 0.4, 1)'
          }}
        >
          <div style={{
            padding: '11px 14px',
            borderBottom: '1px solid rgba(245, 225, 206, 0.10)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                background: 'rgba(0, 0, 32, 0.35)',
                padding: '5px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FileCode size={14} color="#8892b0" />
              </div>
              <div>
                <div style={{ fontSize: '0.64rem', color: '#8892b0', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  &laquo;Controller&raquo;
                </div>
                <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#f5e1ce' }}>
                  AuthController
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.65rem', background: '#2f2c79', padding: '2px 7px', borderRadius: '4px', color: '#e8c39e', fontWeight: 700 }}>
              REST
            </span>
          </div>
          <div style={{ padding: '11px 14px', display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#f5e1ce' }}>
            <div>
              <span style={{ color: '#e8c39e', fontWeight: 800 }}>+ </span>
              <span style={{ fontWeight: 600 }}>postLogin(req): </span>
              <span style={{ color: '#8892b0', fontWeight: 700 }}>ResponseEntity</span>
            </div>
            <div>
              <span style={{ color: '#e8c39e', fontWeight: 800 }}>+ </span>
              <span style={{ fontWeight: 600 }}>postCreateRoom(): </span>
              <span style={{ color: '#8892b0', fontWeight: 700 }}>ResponseEntity</span>
            </div>
          </div>
        </div>

        {/* 🟦 SOLID MATTE DIAGRAM 4: «Repository» UserRepository (Bottom-Left) */}
        <div
          className="floating-vibrant-square floating-anim-4"
          style={{
            bottom: 'calc(6% + var(--mouse-py, 0px) * 0.8)',
            left: 'calc(5% + var(--mouse-px, 0px) * 0.8)',
            width: '265px',
            minHeight: '220px',
            background: 'rgba(23, 26, 74, 0.80)',
            boxShadow: '0 16px 36px rgba(0, 0, 32, 0.55)',
            border: '1px solid rgba(245, 225, 206, 0.10)',
            borderTop: '3px solid #8892b0',
            borderRadius: '16px',
            zIndex: 2,
            transition: 'bottom 0.4s cubic-bezier(0.2, 0.8, 0.4, 1), left 0.4s cubic-bezier(0.2, 0.8, 0.4, 1)'
          }}
        >
          <div style={{
            padding: '11px 14px',
            borderBottom: '1px solid rgba(245, 225, 206, 0.10)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                background: 'rgba(0, 0, 32, 0.35)',
                padding: '5px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Database size={14} color="#8892b0" />
              </div>
              <div>
                <div style={{ fontSize: '0.64rem', color: '#8892b0', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  &laquo;Repository&raquo;
                </div>
                <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#f5e1ce' }}>
                  UserRepository
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.65rem', background: '#2f2c79', padding: '2px 7px', borderRadius: '4px', color: '#e8c39e', fontWeight: 700 }}>
              PostgreSQL
            </span>
          </div>
          <div style={{ padding: '11px 14px', display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#f5e1ce' }}>
            <div>
              <span style={{ color: '#e8c39e', fontWeight: 800 }}>+ </span>
              <span style={{ fontWeight: 600 }}>findByDni(dni): </span>
              <span style={{ color: '#e8c39e', fontWeight: 700 }}>Optional</span>
            </div>
            <div>
              <span style={{ color: '#e8c39e', fontWeight: 800 }}>+ </span>
              <span style={{ fontWeight: 600 }}>save(usuario): </span>
              <span style={{ color: '#e8c39e', fontWeight: 700 }}>Usuario</span>
            </div>
          </div>
        </div>

        {/* 💻 EXTRA FLOATING ELEMENT 1: Spring Boot Java 21 Code Snippet Card */}
        <div
          className="floating-tech-card floating-anim-1"
          style={{
            top: '12%',
            left: '12%',
            background: 'rgba(0, 0, 32, 0.55)',
            border: '1px solid rgba(245, 225, 206, 0.12)',
            borderRadius: '12px',
            padding: '11px 15px',
            boxShadow: '0 12px 28px rgba(0, 0, 32, 0.55)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.74rem',
            color: '#f5e1ce',
            zIndex: 1
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#8892b0', fontWeight: 700 }}>
            <Code2 size={13} color="#8892b0" />
            <span>Usuario.java (JPA Entity)</span>
          </div>
          <div style={{ color: '#8892b0' }}>@Entity</div>
          <div style={{ color: '#e8c39e' }}>public class <span style={{ color: '#f5e1ce' }}>Usuario</span> &#123;</div>
          <div style={{ paddingLeft: '10px', color: '#8892b0' }}>@Id @GeneratedValue</div>
          <div style={{ paddingLeft: '10px', color: '#f5e1ce' }}>private Long id;</div>
          <div style={{ color: '#e8c39e' }}>&#125;</div>
        </div>

        {/* 🚀 EXTRA FLOATING ELEMENT 2: REST API Endpoint Chip */}
        <div
          className="floating-tech-chip floating-anim-3"
          style={{
            top: '15%',
            right: '12%',
            background: 'rgba(0, 0, 32, 0.55)',
            border: '1px solid rgba(245, 225, 206, 0.12)',
            borderRadius: '10px',
            padding: '8px 12px',
            boxShadow: '0 10px 24px rgba(0, 0, 32, 0.55)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.74rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 1
          }}
        >
          <span style={{ background: '#e8c39e', color: '#000020', padding: '2px 6px', borderRadius: '4px', fontWeight: 800, fontSize: '0.66rem' }}>
            POST
          </span>
          <span style={{ color: '#f5e1ce', fontWeight: 600 }}>/api/v1/auth/login</span>
          <span style={{ color: '#8892b0', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 700 }}>
            <CheckCircle2 size={12} color="#e8c39e" /> 200 OK
          </span>
        </div>

        {/* 🐘 EXTRA FLOATING ELEMENT 3: PostgreSQL Schema DDL Chip */}
        <div
          className="floating-tech-chip floating-anim-4"
          style={{
            bottom: '12%',
            left: '12%',
            background: 'rgba(0, 0, 32, 0.55)',
            border: '1px solid rgba(245, 225, 206, 0.12)',
            borderRadius: '10px',
            padding: '8px 12px',
            boxShadow: '0 10px 24px rgba(0, 0, 32, 0.55)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.74rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 1
          }}
        >
          <Database size={13} color="#8892b0" />
          <span style={{ color: '#f5e1ce' }}>
            <span style={{ color: '#e8c39e', fontWeight: 700 }}>CREATE TABLE</span> usuarios (id BIGSERIAL PK);
          </span>
        </div>

        {/* ⚡ EXTRA FLOATING ELEMENT 4: AST UML Parser Sync Chip */}
        <div
          className="floating-tech-chip floating-anim-2"
          style={{
            bottom: '14%',
            right: '12%',
            background: 'rgba(0, 0, 32, 0.55)',
            border: '1px solid rgba(245, 225, 206, 0.12)',
            borderRadius: '10px',
            padding: '8px 12px',
            boxShadow: '0 10px 24px rgba(0, 0, 32, 0.55)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.74rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#f5e1ce',
            fontWeight: 700,
            zIndex: 1
          }}
        >
          <Zap size={13} color="#8892b0" />
          <span>AST UML v2.5 Sincronizado</span>
        </div>
      </div>
      {children}
    </>
  );
};