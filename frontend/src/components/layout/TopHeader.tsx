import React, { useState, useRef, useEffect } from 'react';
import { 
  Share2, 
  Download, 
  Code2, 
  Boxes, 
  LogOut,
  Sun,
  Moon,
  Save,
  History,
  UserCircle,
  MoreVertical,
  FolderKanban
} from 'lucide-react';
import { InformacionSesion } from '../../types/auth';
import { RolEquipo } from '../../types/rbac';
import { ShieldCheck, Sparkles } from 'lucide-react';

interface TopHeaderProps {
  session: InformacionSesion;
  projectTitle: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenProjects?: () => void;
  onSelectProjectTitle?: (title: string) => void;
  onExportXmi: () => void;
  onToggleCodeDock: () => void;
  isCodeDockOpen: boolean;
  onShare: () => void;
  onLogout: () => void;
  /** CU-05 · Guardar diagrama en la nube */
  onGuardarNube?: () => void;
  /** CU-05 · Abrir gestor de versiones */
  onVersiones?: () => void;
  /** CU-01 · Abrir modal de perfil */
  onPerfil?: () => void;
  /** CU-09 · Indicador de conexión (modo offline) */
  online?: boolean;
  /** CU-03 · Conmutar rápidamente de sala */
  onCambiarSala?: (pin: string) => void;
  /** Medidor global de madurez del software */
  maturityScore?: number;
  /** Rol actual y conmutador rápido para RBAC */
  userRole?: RolEquipo;
  onQuickRoleChange?: (newRole: RolEquipo) => void;
  /** Abrir modal de equipo y permisos */
  onOpenTeamModal?: () => void;
  onOpenMaturityAudit?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  session,
  projectTitle,
  theme,
  onToggleTheme,
  onOpenProjects,
  onExportXmi,
  onToggleCodeDock,
  isCodeDockOpen,
  onShare,
  onLogout,
  onGuardarNube,
  onVersiones,
  onPerfil,
  online = true,
  onCambiarSala,
  maturityScore,
  userRole,
  onQuickRoleChange,
  onOpenTeamModal,
  onOpenMaturityAudit
}) => {
  const [activeHoveredUser, setActiveHoveredUser] = useState<string | null>(null);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const hideUserTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    if (isMoreMenuOpen) {
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMoreMenuOpen]);

  const handleUserHover = (userId: string) => {
    if (hideUserTimerRef.current) clearTimeout(hideUserTimerRef.current);
    setActiveHoveredUser(userId);
    hideUserTimerRef.current = setTimeout(() => {
      setActiveHoveredUser(null);
    }, 3500);
  };

  const handleUserLeave = () => {
    if (hideUserTimerRef.current) clearTimeout(hideUserTimerRef.current);
    hideUserTimerRef.current = setTimeout(() => {
      setActiveHoveredUser(null);
    }, 1200);
  };

  return (
    <header
      className="hud-topbar"
      style={{
        margin: '10px 14px 0 14px',
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 90,
        flexShrink: 0,
        gap: '12px'
      }}
    >
      {/* ─── Izquierda: Brand Logo + Proyecto + Sala PIN ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: '#2f2c79',
            border: '1px solid rgba(232, 195, 158, 0.30)',
            padding: '5px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(0, 0, 32, 0.40)'
          }}>
            <Boxes size={17} color="#e8c39e" />
          </div>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.18rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)'
          }}>
            Arch<span style={{ color: '#e8c39e', marginLeft: '1px' }}>AI</span>
          </span>
        </div>

        {/* Separator */}
        <div className="header-divider-hide-mobile" style={{ width: '1px', height: '18px', background: 'var(--glass-topbar-border)' }} />

        {/* Botón Gestión de Proyectos (CU-02) */}
        {onOpenProjects && (
          <button
            onClick={onOpenProjects}
            className="btn-studio-glass"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              background: '#2f2c79',
              border: '1px solid #2f2c79',
              color: '#f5e1ce',
              padding: '4px 10px',
              borderRadius: '7px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
            title="Abrir el Hub de Proyectos y Diagramas (CU-02)"
          >
            <FolderKanban size={14} color="#e8c39e" />
            <span>Proyectos</span>
          </button>
        )}

        {/* Título del Proyecto */}
        <div
          className="header-project-title"
          style={{
            color: 'var(--text-primary)',
            fontSize: '0.86rem',
            fontWeight: 700,
            fontFamily: 'var(--font-heading)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '180px'
          }}
          title={projectTitle}
        >
          {projectTitle}
        </div>

        {/* Sala Colaborativa PIN Badge */}
        <button
          onClick={onShare}
          className="btn-studio-glass"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            background: '#2f2c79',
            border: '1px solid #2f2c79',
            color: '#e8c39e',
            padding: '4px 8px',
            borderRadius: '8px',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
          title="Ver PIN de la sala, copiar o cambiar de sala colaborativa"
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: online ? '#e8c39e' : '#fb7185',
              boxShadow: online ? '0 0 6px #e8c39e' : 'none'
            }}
          />
          <span>{session.roomId || 'LOCAL'}</span>
        </button>

        {/* Botón rápido ARC-GRUPO04 si está en otra sala (solo desktop) */}
        {session.roomId !== 'ARC-GRUPO04' && onCambiarSala && (
          <button
            onClick={() => onCambiarSala('ARC-GRUPO04')}
            className="btn-studio-glass header-quick-sync-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.70rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              background: '#2f2c79',
              border: '1px solid #2f2c79',
              color: '#e8c39e',
              padding: '3px 8px',
              borderRadius: '8px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
            title="Conectarse a la sala compartida ARC-GRUPO04"
          >
            <span>⚡ ARC-GRUPO04</span>
          </button>
        )}
      </div>

      {/* ─── Derecha: Guardar + Avatares + Código + Menú Más ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* Medidor de Madurez Global del Software */}
        {maturityScore !== undefined && (
          <button
            onClick={onOpenMaturityAudit}
            className="btn-studio-glass"
            style={{
              padding: '4px 10px',
              fontSize: '0.72rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              borderRadius: '8px',
              border: `1px solid ${maturityScore >= 85 ? '#10B981' : maturityScore >= 60 ? '#38BDF8' : '#F59E0B'}66`,
              background: `${maturityScore >= 85 ? '#10B981' : maturityScore >= 60 ? '#38BDF8' : '#F59E0B'}15`,
              color: maturityScore >= 85 ? '#10B981' : maturityScore >= 60 ? '#38BDF8' : '#F59E0B'
            }}
            title="Madurez arquitectónica del software. Clic para ver auditoría detallada"
          >
            <Sparkles size={12} />
            <span className="hide-on-mobile">Madurez:</span>
            <span>{maturityScore}%</span>
          </button>
        )}

        {/* Conmutador Rápido de Rol para Demostración RBAC */}
        {userRole && onQuickRoleChange && (
          <select
            value={userRole}
            onChange={e => onQuickRoleChange(e.target.value as any)}
            className="hide-on-mobile"
            style={{
              background: userRole === 'Observador' ? 'rgba(245, 158, 11, 0.18)' : 'var(--glass-surface-hover)',
              border: `1px solid ${userRole === 'Observador' ? '#F59E0B' : 'var(--glass-border-color)'}`,
              color: userRole === 'Observador' ? '#F59E0B' : 'var(--text-primary)',
              borderRadius: '8px',
              padding: '4px 8px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            title="Cambiar rol activo para demostración de permisos RBAC en vivo"
          >
            <option value="Arquitecto de Software">👑 Arquitecto</option>
            <option value="Desarrollador Backend">💻 Backend</option>
            <option value="Ingeniero Frontend">🎨 Frontend</option>
            <option value="Analista QA">🧪 QA Tester</option>
            <option value="Observador">👁️ Observador</option>
          </select>
        )}

        {/* Avatares de Colaboradores (Compactos) */}
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          {session.participants.slice(0, 4).map((p, idx) => {
            const isMe = p.id === session.currentUser?.id;
            const isHovered = activeHoveredUser === p.id;
            const color = p.avatarColor || (idx === 0 ? '#2f2c79' : idx === 1 ? '#171a4a' : '#5c688c');

            return (
              <div
                key={p.id}
                onMouseEnter={() => handleUserHover(p.id)}
                onMouseLeave={handleUserLeave}
                onClick={() => handleUserHover(p.id)}
                style={{ position: 'relative', cursor: 'pointer' }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    border: '2px solid var(--bg-canvas)',
                    outline: isHovered ? '2px solid var(--text-primary)' : `1.5px solid ${color}88`,
                    marginLeft: idx === 0 ? 0 : '-6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.70rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    boxShadow: isHovered ? `0 0 12px ${color}` : `0 0 6px ${color}44`,
                    transform: isHovered ? 'scale(1.15) translateY(-2px)' : 'scale(1)',
                    transition: 'all 0.18s ease-out',
                    zIndex: isHovered ? 20 : 10 - idx
                  }}
                >
                  {p.name.charAt(0)}
                </div>

                {isHovered && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '36px',
                      right: 0,
                      background: 'var(--popover-bg)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: `1px solid ${color}88`,
                      borderRadius: '12px',
                      padding: '10px 14px',
                      minWidth: '190px',
                      boxShadow: `0 12px 32px rgba(0, 0, 0, 0.25), 0 0 15px ${color}33`,
                      zIndex: 100,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      animation: 'fadeIn 0.2s ease-out'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }} />
                      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                        {p.name} {isMe && <span style={{ color, fontSize: '0.74rem' }}>(Tú)</span>}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {p.role || 'Colaborador'}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Botón Principal Guardar en Nube (CU-05) */}
        {onGuardarNube && (
          <button
            onClick={onGuardarNube}
            className="btn-studio-primary"
            style={{
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Guardar el diagrama actual en la nube"
          >
            <Save size={14} />
            <span className="hide-on-mobile">Guardar</span>
          </button>
        )}

        {/* Botón Código y DDL Dock */}
        <button
          onClick={onToggleCodeDock}
          className="btn-studio-glass"
          style={{
            background: isCodeDockOpen ? 'var(--btn-studio-share-bg)' : undefined,
            borderColor: isCodeDockOpen ? 'var(--btn-studio-share-border)' : undefined,
            color: isCodeDockOpen ? 'var(--accent-primary)' : undefined,
            padding: '6px 12px',
            fontSize: '0.76rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          title="Alternar panel de generación de código Spring Boot y DDL"
        >
          <Code2 size={15} />
          <span className="hide-on-mobile">Código</span>
        </button>

        {/* ─── Menú Glass Desplegable de Más Opciones [ ⋯ ] ─── */}
        <div ref={moreMenuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setIsMoreMenuOpen(prev => !prev)}
            className="btn-studio-glass"
            style={{
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isMoreMenuOpen ? 'var(--glass-surface-hover)' : undefined
            }}
            title="Más opciones de proyecto y configuración"
          >
            <MoreVertical size={16} />
          </button>

          {isMoreMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '44px',
                right: 0,
                background: 'var(--popover-bg)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid var(--glass-topbar-border)',
                borderRadius: '14px',
                padding: '8px',
                minWidth: '220px',
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                zIndex: 120,
                animation: 'fadeIn 0.15s ease-out'
              }}
            >
              {/* Exportar XMI */}
              <button
                onClick={() => {
                  onExportXmi();
                  setIsMoreMenuOpen(false);
                }}
                className="btn-studio-glass"
                style={{
                  justifyContent: 'flex-start',
                  border: 'none',
                  padding: '8px 12px',
                  fontSize: '0.78rem',
                  gap: '8px'
                }}
              >
                <Download size={14} color="var(--accent-cyan)" />
                <span>Exportar XMI UML 2.5</span>
              </button>

              {/* Versiones */}
              {onVersiones && (
                <button
                  onClick={() => {
                    onVersiones();
                    setIsMoreMenuOpen(false);
                  }}
                  className="btn-studio-glass"
                  style={{
                    justifyContent: 'flex-start',
                    border: 'none',
                    padding: '8px 12px',
                    fontSize: '0.78rem',
                    gap: '8px'
                  }}
                >
                  <History size={14} color="var(--accent-primary)" />
                  <span>Historial de Versiones (CU-05)</span>
                </button>
              )}

              {/* Compartir Sala */}
              <button
                onClick={() => {
                  onShare();
                  setIsMoreMenuOpen(false);
                }}
                className="btn-studio-glass"
                style={{
                  justifyContent: 'flex-start',
                  border: 'none',
                  padding: '8px 12px',
                  fontSize: '0.78rem',
                  gap: '8px'
                }}
              >
                <Share2 size={14} color="var(--accent-emerald)" />
                <span>Compartir PIN de Sala (CU-03)</span>
              </button>

              {/* Gestión de Equipo & Permisos (RBAC) */}
              {onOpenTeamModal && (
                <button
                  onClick={() => {
                    onOpenTeamModal();
                    setIsMoreMenuOpen(false);
                  }}
                  className="btn-studio-glass"
                  style={{
                    justifyContent: 'flex-start',
                    border: 'none',
                    padding: '8px 12px',
                    fontSize: '0.78rem',
                    gap: '8px'
                  }}
                >
                  <ShieldCheck size={14} color="var(--accent-cyan)" />
                  <span>Gestión de Equipo & Roles</span>
                </button>
              )}

              {/* Auditoría de Madurez de Código */}
              {onOpenMaturityAudit && (
                <button
                  onClick={() => {
                    onOpenMaturityAudit();
                    setIsMoreMenuOpen(false);
                  }}
                  className="btn-studio-glass"
                  style={{
                    justifyContent: 'flex-start',
                    border: 'none',
                    padding: '8px 12px',
                    fontSize: '0.78rem',
                    gap: '8px'
                  }}
                >
                  <Sparkles size={14} color="#F59E0B" />
                  <span>Auditoría de Madurez de Código</span>
                </button>
              )}

              {/* Conmutador Tema Claro / Oscuro */}
              <button
                onClick={() => {
                  onToggleTheme();
                  setIsMoreMenuOpen(false);
                }}
                className="btn-studio-glass"
                style={{
                  justifyContent: 'flex-start',
                  border: 'none',
                  padding: '8px 12px',
                  fontSize: '0.78rem',
                  gap: '8px'
                }}
              >
                {theme === 'light' ? (
                  <>
                    <Moon size={14} color="var(--accent-primary)" />
                    <span>Modo Oscuro</span>
                  </>
                ) : (
                  <>
                    <Sun size={14} color="#f59e0b" />
                    <span>Modo Claro</span>
                  </>
                )}
              </button>

              {/* Perfil */}
              {onPerfil && (
                <button
                  onClick={() => {
                    onPerfil();
                    setIsMoreMenuOpen(false);
                  }}
                  className="btn-studio-glass"
                  style={{
                    justifyContent: 'flex-start',
                    border: 'none',
                    padding: '8px 12px',
                    fontSize: '0.78rem',
                    gap: '8px'
                  }}
                >
                  <UserCircle size={14} />
                  <span>Mi Perfil ({session.currentUser?.name?.split(' ')[0]})</span>
                </button>
              )}

              <div style={{ height: '1px', background: 'var(--glass-topbar-border)', margin: '4px 0' }} />

              {/* Salir */}
              <button
                onClick={() => {
                  onLogout();
                  setIsMoreMenuOpen(false);
                }}
                className="btn-studio-glass"
                style={{
                  justifyContent: 'flex-start',
                  border: 'none',
                  padding: '8px 12px',
                  fontSize: '0.78rem',
                  color: '#fb7185',
                  gap: '8px'
                }}
              >
                <LogOut size={14} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
