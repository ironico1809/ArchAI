import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Check,
  KeyRound
} from 'lucide-react';
import { RolEquipo, PermisosUsuario, MiembroEquipo, obtenerPermisosRol } from '../../types/rbac';

interface ModalGestionEquipoProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  miembros: MiembroEquipo[];
  onActualizarMiembro: (miembroActualizado: MiembroEquipo) => void;
  onCambiarMiRol: (nuevoRol: RolEquipo) => void;
}

export const ModalGestionEquipo: React.FC<ModalGestionEquipoProps> = ({
  isOpen,
  onClose,
  currentUserId,
  miembros,
  onActualizarMiembro,
  onCambiarMiRol
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(currentUserId);

  if (!isOpen) return null;

  const currentMember = miembros.find(m => m.id === selectedMemberId) || miembros[0];

  const handleRoleChange = (memberId: string, newRole: RolEquipo) => {
    const defaultPerms = obtenerPermisosRol(newRole);
    const member = miembros.find(m => m.id === memberId);
    if (!member) return;

    const updated: MiembroEquipo = {
      ...member,
      role: newRole,
      permissions: { ...defaultPerms }
    };

    onActualizarMiembro(updated);

    if (memberId === currentUserId) {
      onCambiarMiRol(newRole);
    }
  };

  const handleTogglePermission = (key: keyof PermisosUsuario) => {
    if (!currentMember) return;
    const updated: MiembroEquipo = {
      ...currentMember,
      permissions: {
        ...currentMember.permissions,
        [key]: !currentMember.permissions[key]
      }
    };
    onActualizarMiembro(updated);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.72)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 120,
      padding: '16px'
    }}>
      <div style={{
        background: 'var(--glass-surface-elevated)',
        border: '1px solid var(--glass-border-color)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '820px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 30px var(--glow-cyan)',
        overflow: 'hidden'
      }}>
        {/* Encabezado */}
        <div style={{
          padding: '16px 22px',
          borderBottom: '1px solid var(--glass-border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#2f2c79',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f5e1ce'
            }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Control de Acceso y Gestión de Equipo (RBAC)
              </h2>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0 }}>
                Asignación de roles por área y permisos granulares de modelado y código
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo Dividido en 2 Columnas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          flex: 1,
          overflow: 'hidden'
        }}>
          {/* Columna Izquierda: Lista de Desarrolladores */}
          <div style={{
            borderRight: '1px solid var(--glass-border-color)',
            padding: '14px',
            overflowY: 'auto',
            background: 'rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              letterSpacing: '0.05em',
              marginBottom: '4px'
            }}>
              Miembros Conectados ({miembros.length})
            </span>

            {miembros.map(m => {
              const isSelected = m.id === selectedMemberId;
              const isMe = m.id === currentUserId;

              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMemberId(m.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: isSelected ? 'var(--glass-surface-hover)' : 'transparent',
                    border: isSelected ? '1px solid var(--accent-primary)' : '1px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: m.avatarColor || '#2f2c79',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    flexShrink: 0
                  }}>
                    {m.name.charAt(0).toUpperCase()}
                  </div>

                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <div style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.name}
                      </span>
                      {isMe && (
                        <span style={{
                          fontSize: '0.62rem',
                          background: 'rgba(232, 195, 158, 0.22)',
                          color: 'var(--accent-cyan)',
                          padding: '1px 5px',
                          borderRadius: '4px'
                        }}>
                          Tú
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      {m.role}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Columna Derecha: Configuración del Rol y Permisos */}
          {currentMember && (
            <div style={{
              padding: '20px 24px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}>
              {/* Tarjeta del Miembro Seleccionado */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                background: 'var(--glass-surface-hover)',
                borderRadius: '12px',
                border: '1px solid var(--glass-border-color)'
              }}>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {currentMember.name} {currentMember.id === currentUserId ? '(Tú)' : ''}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {currentMember.email}
                  </div>
                </div>

                {/* Desplegable de Rol */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                  <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Rol Asignado:
                  </label>
                  <select
                    value={currentMember.role}
                    onChange={e => handleRoleChange(currentMember.id, e.target.value as RolEquipo)}
                    style={{
                      background: 'var(--glass-node-bg)',
                      border: '1px solid var(--glass-border-color)',
                      color: 'var(--accent-cyan)',
                      fontWeight: 700,
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Arquitecto de Software">👑 Arquitecto de Software</option>
                    <option value="Líder Técnico">⚡ Líder Técnico</option>
                    <option value="Desarrollador Backend">💻 Desarrollador Backend</option>
                    <option value="Ingeniero Frontend">🎨 Ingeniero Frontend</option>
                    <option value="Analista QA">🧪 Analista QA / Tester</option>
                    <option value="Observador">👁️ Observador (Solo Lectura)</option>
                  </select>
                </div>
              </div>

              {/* Matriz de Permisos Granulares */}
              <div>
                <span style={{
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '10px'
                }}>
                  <KeyRound size={14} color="var(--accent-cyan)" />
                  Permisos por Área de Desarrollo
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* 1. Modelar Diagrama */}
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: currentMember.permissions.canEditDiagram ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0,0,0,0.1)',
                    border: '1px solid var(--glass-border-color)',
                    cursor: 'pointer'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Modelado UML (Crear, Mover y Editar Clases)
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Permite modificar atributos, métodos y coordenadas en el lienzo.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={currentMember.permissions.canEditDiagram}
                      onChange={() => handleTogglePermission('canEditDiagram')}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </label>

                  {/* 2. Conectar Relaciones */}
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: currentMember.permissions.canConnectRelations ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0,0,0,0.1)',
                    border: '1px solid var(--glass-border-color)',
                    cursor: 'pointer'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Gestión de Relaciones (1:N, N:M, Composición)
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Permite trazar y eliminar asociaciones y multiplicidades.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={currentMember.permissions.canConnectRelations}
                      onChange={() => handleTogglePermission('canConnectRelations')}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </label>

                  {/* 3. Generar Código y Descargar */}
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: currentMember.permissions.canGenerateCode ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0,0,0,0.1)',
                    border: '1px solid var(--glass-border-color)',
                    cursor: 'pointer'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Síntesis de Código (Spring Boot, SQL, Postman y ZIP)
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Permite ver y exportar los artefactos compilados del backend.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={currentMember.permissions.canGenerateCode}
                      onChange={() => handleTogglePermission('canGenerateCode')}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </label>

                  {/* 4. Asistente de IA y Voz */}
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: currentMember.permissions.canUseAi ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0,0,0,0.1)',
                    border: '1px solid var(--glass-border-color)',
                    cursor: 'pointer'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Comandos por Voz e Inteligencia Artificial
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Permite dictar órdenes NLP, auto-ejecución y consultas al cerebro IA.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={currentMember.permissions.canUseAi}
                      onChange={() => handleTogglePermission('canUseAi')}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </label>

                  {/* 5. Administrar Equipo */}
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: currentMember.permissions.canManageTeam ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0,0,0,0.1)',
                    border: '1px solid var(--glass-border-color)',
                    cursor: 'pointer'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Administración de Sala y Miembros
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Permite cambiar permisos de otros usuarios y gestionar accesos.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={currentMember.permissions.canManageTeam}
                      onChange={() => handleTogglePermission('canManageTeam')}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </label>
                </div>
              </div>

              {/* Botón de Aplicar */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
                <button
                  onClick={onClose}
                  style={{
                    background: 'var(--accent-primary)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 700,
                    borderRadius: '8px',
                    padding: '8px 20px',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px var(--glow-cyan)'
                  }}
                >
                  <Check size={15} />
                  Listo, aplicar permisos
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
