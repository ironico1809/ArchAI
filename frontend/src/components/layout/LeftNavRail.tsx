import React from 'react';
import { 
  LayoutGrid, 
  Users, 
  Settings, 
  Boxes,
  LogOut,
  FolderKanban
} from 'lucide-react';
import { PerfilUsuario } from '../../types/auth';

interface LeftNavRailProps {
  activeTab: 'canvas' | 'team' | 'settings';
  onSelectTab: (tab: 'canvas' | 'team' | 'settings') => void;
  currentUser: PerfilUsuario;
  onLogout?: () => void;
  onOpenProjects?: () => void;
}

export const LeftNavRail: React.FC<LeftNavRailProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  onLogout,
  onOpenProjects
}) => {
  return (
    <aside style={{
      width: '56px',
      background: 'var(--glass-rail-bg)',
      backdropFilter: 'var(--glass-blur-lg)',
      WebkitBackdropFilter: 'var(--glass-blur-lg)',
      borderRight: '1px solid var(--glass-rail-border)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 0',
      zIndex: 100,
      flexShrink: 0
    }}>
      {/* Top Icons */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
        {/* Brand Icon */}
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, var(--glass-accent), var(--glass-accent-secondary))',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--glow-accent)',
          marginBottom: '8px'
        }}>
          <Boxes size={19} color="#ffffff" />
        </div>

        {/* Navigation buttons */}
        {onOpenProjects && (
          <button
            onClick={onOpenProjects}
            title="Hub de Proyectos y Diagramas (CU-02)"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              border: '1px solid transparent',
              background: 'transparent',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#38bdf8';
              e.currentTarget.style.background = 'rgba(47, 44, 121, 0.12)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <FolderKanban size={18} />
          </button>
        )}

        <button
          onClick={() => onSelectTab('canvas')}
          title="Studio Canvas UML"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            border: activeTab === 'canvas' ? '1px solid color-mix(in srgb, var(--glass-accent) 55%, transparent)' : '1px solid transparent',
            background: activeTab === 'canvas' ? 'color-mix(in srgb, var(--glass-accent) 22%, transparent)' : 'transparent',
            color: activeTab === 'canvas' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: activeTab === 'canvas' ? '0 0 12px color-mix(in srgb, var(--glass-accent) 40%, transparent)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <LayoutGrid size={18} />
        </button>

        <button
          onClick={() => onSelectTab('team')}
          title="Equipo y Colaboración en Tiempo Real"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            border: activeTab === 'team' ? '1px solid color-mix(in srgb, var(--glass-accent) 55%, transparent)' : '1px solid transparent',
            background: activeTab === 'team' ? 'color-mix(in srgb, var(--glass-accent) 22%, transparent)' : 'transparent',
            color: activeTab === 'team' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: activeTab === 'team' ? '0 0 12px color-mix(in srgb, var(--glass-accent) 40%, transparent)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <Users size={18} />
        </button>

        <button
          onClick={() => onSelectTab('settings')}
          title="Configuración"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            border: activeTab === 'settings' ? '1px solid color-mix(in srgb, var(--glass-accent) 55%, transparent)' : '1px solid transparent',
            background: activeTab === 'settings' ? 'color-mix(in srgb, var(--glass-accent) 22%, transparent)' : 'transparent',
            color: activeTab === 'settings' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: activeTab === 'settings' ? '0 0 12px color-mix(in srgb, var(--glass-accent) 40%, transparent)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Bottom User Avatar & Logout */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <div
          title={`${currentUser.name} (${currentUser.role})`}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: currentUser.avatarColor || '#334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '0.8rem',
            color: '#ffffff',
            boxShadow: `0 0 12px ${currentUser.avatarColor || '#334155'}`,
            cursor: 'pointer'
          }}
        >
          {currentUser.name.charAt(0)}
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            title="Cerrar sesión"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              background: 'rgba(244, 63, 94, 0.12)',
              color: '#fb7185',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <LogOut size={15} />
          </button>
        )}
      </div>
    </aside>
  );
};
