import React, { useState } from 'react';
import { 
  Boxes, 
  Copy, 
  Check, 
  LogOut, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Bot, 
  Shield,
  Zap,
  Sun,
  Moon
} from 'lucide-react';
import { InformacionSesion } from '../../types/auth';

interface TopNavbarProps {
  session: InformacionSesion;
  backendOnline: boolean;
  checkingBackend: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onRefreshBackend: () => void;
  onLogout: () => void;
  onOpenExport: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  session,
  backendOnline,
  checkingBackend,
  theme,
  onToggleTheme,
  onRefreshBackend,
  onLogout,
  onOpenExport
}) => {
  const [copied, setCopied] = useState(false);

  const copyRoomPin = () => {
    navigator.clipboard.writeText(session.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="glass-card" style={{
      position: 'sticky',
      top: '16px',
      zIndex: 100,
      padding: '14px 26px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '26px'
    }}>
      {/* Brand & Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          background: '#0F172A',
          padding: '9px',
          borderRadius: '11px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <Boxes size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.55rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1
            }}>
              Arch<span style={{ color: 'var(--accent-primary)' }}>AI</span>
            </h1>
            <span className="glass-badge glass-badge-accent" style={{ fontSize: '0.7rem', padding: '2px 10px', fontFamily: 'var(--font-mono)' }}>
              v2.5 UML CASE
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}>
            {session.roomName}
          </p>
        </div>
      </div>

      {/* Center Status Indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Room PIN Pill */}
        <button
          onClick={copyRoomPin}
          title="Haz clic para copiar el código de sala"
          style={{
            background: 'var(--glass-surface)',
            border: '1px solid var(--glass-border-color)',
            borderRadius: 'var(--radius-full)',
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'var(--font-heading)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            transition: 'all 0.25s ease'
          }}
        >
          <Shield size={14} color="var(--glass-accent)" />
          <span>Sala: <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--glass-accent)' }}>{session.roomId}</strong></span>
          {copied ? <Check size={14} color="var(--glass-success)" /> : <Copy size={14} />}
        </button>

        {/* Local AI Engine Badge */}
        <div className="glass-badge glass-badge-cyan" style={{ padding: '6px 14px', fontSize: '0.78rem' }}>
          <Bot size={15} />
          <span>IA Local (Voz + NLP): <strong>ONLINE</strong></span>
        </div>

        {/* Backend Port 8000 Status Badge */}
        <div 
          className={`glass-badge ${backendOnline ? 'glass-badge-success' : 'glass-badge-error'}`}
          style={{ padding: '6px 14px', fontSize: '0.78rem' }}
        >
          {backendOnline ? <Wifi size={15} /> : <WifiOff size={15} />}
          <span>Spring Boot (8000): <strong>{backendOnline ? 'ONLINE' : 'OFFLINE'}</strong></span>
          <button
            onClick={onRefreshBackend}
            disabled={checkingBackend}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              padding: 0,
              marginLeft: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <RefreshCw size={12} className={checkingBackend ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* User Pill & Quick Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Theme Toggle (Light / Dark) */}
        <button
          onClick={onToggleTheme}
          title={theme === 'light' ? 'Cambiar a Modo Oscuro' : 'Cambiar a Modo Claro'}
          className="btn-glass-secondary"
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem'
          }}
        >
          {theme === 'light' ? (
            <>
              <Moon size={15} color="var(--glass-accent)" />
              <span>Oscuro</span>
            </>
          ) : (
            <>
              <Sun size={15} color="#F59E0B" />
              <span>Claro</span>
            </>
          )}
        </button>

        <button className="glass-button-pill" onClick={onOpenExport} style={{ padding: '8px 18px', fontSize: '0.86rem' }}>
          <Zap size={15} /> Generar Código
        </button>

        {/* User Card */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'var(--glass-surface)',
          border: '1px solid var(--glass-border-color)',
          borderRadius: '30px',
          padding: '4px 14px 4px 6px',
          backdropFilter: 'var(--glass-blur-sm)'
        }}>
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: session.currentUser.avatarColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '0.8rem',
            color: '#ffffff',
            boxShadow: `0 0 10px ${session.currentUser.avatarColor}`
          }}>
            {session.currentUser.name.charAt(0)}
          </div>
          <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{session.currentUser.name}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {session.currentUser.isHost ? '👑 Anfitrión' : '👤 Colaborador'} · {session.currentUser.role}
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Cerrar sesión o cambiar de usuario"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              marginLeft: '6px',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
              borderRadius: '6px',
              transition: 'all 0.2s'
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
