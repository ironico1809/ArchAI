import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface GlassModalProps {
  /** Control de visibilidad externa (si se omite, se asume montado condicionalmente) */
  isOpen?: boolean;
  /** Callback para cerrar el modal */
  onClose: () => void;
  /** Título principal del modal en tono Crema / Marfil */
  title?: React.ReactNode;
  /** Subtítulo descriptivo */
  subtitle?: React.ReactNode;
  /** Icono representativo para el badge de cabecera */
  icon?: React.ReactNode;
  /** Fondo del contenedor del icono (por defecto #2f2c79) */
  iconBg?: string;
  /** Color del icono (por defecto #e8c39e) */
  iconColor?: string;
  /** Ancho máximo del diálogo (ej. '520px', '700px', '820px', por defecto '640px') */
  maxWidth?: string;
  /** Altura máxima del diálogo (por defecto '90vh') */
  maxHeight?: string;
  /** Ancho del diálogo (por defecto '94%') */
  width?: string;
  /** Contenido del cuerpo */
  children: React.ReactNode;
  /** Contenido del pie de modal (barra de acciones inferior) */
  footer?: React.ReactNode;
  /** Si debe cerrarse al hacer clic en el backdrop oscurecido (por defecto true) */
  closeOnBackdropClick?: boolean;
  /** Si debe cerrarse al presionar la tecla Escape (por defecto true) */
  closeOnEscape?: boolean;
  /** Si debe mostrar el botón [X] de cierre en la cabecera (por defecto true) */
  showCloseButton?: boolean;
  /** z-index del diálogo flotante (por defecto 1200) */
  zIndex?: number;
  /** Clases CSS adicionales para el overlay */
  className?: string;
  /** Clases CSS adicionales para la tarjeta */
  cardClassName?: string;
  /** Clases CSS adicionales para el cuerpo */
  bodyClassName?: string;
  /** Estilos inline para el contenedor del cuerpo */
  bodyStyle?: React.CSSProperties;
  /** Contenido extra a la derecha de la cabecera (antes del botón de cierre) */
  headerRightContent?: React.ReactNode;
}

/**
 * GlassModal (ModalBase) — Componente Canónico de Modales para ArchAI
 *
 * Implementa el sistema de diseño HUD Midnight Navy & Warm Sand:
 * - Superficie Midnight Navy translúcida con desenfoque de 16px
 * - Bordes translúcidos en marfil suave (rgba(245, 225, 206, 0.16))
 * - Animación fluida de escala y opacidad al abrirse
 * - Cabecera estandarizada con icono-badge, títulos en Marfil y botón de cierre
 * - Bloqueo automático del scroll de la página de fondo
 * - Cierre por tecla Escape y clic en backdrop con protección de propagación
 */
export const GlassModal: React.FC<GlassModalProps> = ({
  isOpen = true,
  onClose,
  title,
  subtitle,
  icon,
  iconBg = '#2f2c79',
  iconColor = '#e8c39e',
  maxWidth = '640px',
  maxHeight = '90vh',
  width = '94%',
  children,
  footer,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  zIndex = 1200,
  className = '',
  cardClassName = '',
  bodyClassName = '',
  bodyStyle,
  headerRightContent
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // 1. Bloqueo de scroll en el elemento body mientras el modal esté visible
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // 2. Cierre accesible con tecla Escape
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const hasHeader = Boolean(title || icon || showCloseButton || headerRightContent);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={handleBackdropClick}
      className={`glass-dialog-overlay ${className}`}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--glass-modal-overlay, rgba(0, 0, 32, 0.82))',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex,
        padding: '16px',
        animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div
        ref={cardRef}
        onClick={e => e.stopPropagation()}
        className={`glass-dialog-card ${cardClassName}`}
        style={{
          background: 'var(--glass-modal-bg, #171a4a)',
          border: '1px solid var(--glass-modal-border, rgba(245, 225, 206, 0.16))',
          borderRadius: '18px',
          width,
          maxWidth,
          maxHeight,
          boxShadow: 'var(--glass-modal-shadow, 0 25px 60px rgba(0, 0, 32, 0.85), inset 0 1px 1px 0 rgba(245, 225, 206, 0.15))',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          color: 'var(--text-primary, #f5e1ce)',
          animation: 'scaleUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Cabecera Estandarizada */}
        {hasHeader && (
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--glass-modal-border, rgba(245, 225, 206, 0.12))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              background: 'rgba(255, 255, 255, 0.02)',
              flexShrink: 0
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              {icon && (
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    minWidth: '36px',
                    borderRadius: '10px',
                    background: iconBg,
                    border: '1px solid rgba(245, 225, 206, 0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: iconColor
                  }}
                >
                  {icon}
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                {title && (
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '1.12rem',
                      fontWeight: 800,
                      fontFamily: 'var(--font-heading, "Inter", sans-serif)',
                      color: 'var(--text-primary, #f5e1ce)',
                      lineHeight: 1.25,
                      letterSpacing: '-0.01em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p
                    style={{
                      margin: '2px 0 0 0',
                      fontSize: '0.74rem',
                      color: 'var(--text-muted, #8892b0)',
                      lineHeight: 1.3
                    }}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {headerRightContent}
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar modal"
                  title="Cerrar (Esc)"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted, #8892b0)',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = 'var(--text-primary, #f5e1ce)';
                    e.currentTarget.style.background = 'rgba(245, 225, 206, 0.08)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'var(--text-muted, #8892b0)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Cuerpo Desplazable Anti-desbordamiento */}
        <div
          className={bodyClassName}
          style={{
            padding: '20px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            ...bodyStyle
          }}
        >
          {children}
        </div>

        {/* Pie de Acciones Opcional */}
        {footer && (
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--glass-modal-border, rgba(245, 225, 206, 0.12))',
              background: 'rgba(0, 0, 32, 0.40)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              flexShrink: 0
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// Alias exportado para versatilidad en la importación
export const ModalBase = GlassModal;
export default GlassModal;
