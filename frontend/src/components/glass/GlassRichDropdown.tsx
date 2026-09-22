import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface RichOption<T> {
  id: string;
  data: T;
  label: string;
  description?: string;
  badge?: string;
  badgeColor?: string;
  icon?: React.ReactNode;
}

interface GlassRichDropdownProps<T> {
  options: RichOption<T>[];
  selectedId: string;
  onSelect: (option: RichOption<T>) => void;
  label?: string;
  placeholder?: string;
  searchable?: boolean;
  className?: string;
}

export function GlassRichDropdown<T>({
  options,
  selectedId,
  onSelect,
  label,
  placeholder = 'Seleccionar...',
  searchable = true,
  className = ''
}: GlassRichDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selected = options.find(o => o.id === selectedId);

  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    (o.description && o.description.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative', width: '100%' }} className={className}>
      {label && (
        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}>
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="glass-textfield"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          padding: '10px 16px',
          textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          {selected?.icon}
          <div>
            <div style={{ fontSize: '0.86rem', fontWeight: 600, color: selected ? 'var(--text-primary)' : 'var(--text-subtle)' }}>
              {selected ? selected.label : placeholder}
            </div>
            {selected?.description && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {selected.description}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {selected?.badge && (
            <span
              className="glass-badge"
              style={{
                fontSize: '0.68rem',
                padding: '2px 8px',
                backgroundColor: selected.badgeColor ? `${selected.badgeColor}20` : 'rgba(108, 99, 255, 0.15)',
                color: selected.badgeColor || 'var(--glass-accent)',
                borderColor: selected.badgeColor ? `${selected.badgeColor}40` : 'rgba(108, 99, 255, 0.3)'
              }}
            >
              {selected.badge}
            </span>
          )}
          <ChevronDown size={16} color="var(--text-subtle)" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 1000,
            background: 'var(--glass-modal)',
            backdropFilter: 'var(--glass-blur-lg)',
            WebkitBackdropFilter: 'var(--glass-blur-lg)',
            border: '1px solid var(--glass-border-color)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-glass-elevated)',
            maxHeight: '280px',
            overflowY: 'auto',
            padding: '8px'
          }}
        >
          {searchable && (
            <div style={{ position: 'relative', marginBottom: '8px', padding: '0 4px' }}>
              <Search size={14} color="var(--text-subtle)" style={{ position: 'absolute', left: '14px', top: '10px' }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar opción..."
                className="glass-textfield"
                style={{ padding: '6px 12px 6px 32px', fontSize: '0.78rem' }}
                autoFocus
              />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '12px', fontSize: '0.78rem', color: 'var(--text-subtle)', textAlign: 'center' }}>
                No se encontraron opciones
              </div>
            ) : (
              filteredOptions.map(option => {
                const isSelected = option.id === selectedId;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      onSelect(option);
                      setIsOpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid ' + (isSelected ? 'var(--glass-accent)' : 'transparent'),
                      background: isSelected ? 'rgba(108, 99, 255, 0.12)' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--glass-surface-hover)';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {option.icon}
                      <div>
                        <div style={{ fontSize: '0.84rem', fontWeight: isSelected ? 700 : 600, color: 'var(--text-primary)' }}>
                          {option.label}
                        </div>
                        {option.description && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {option.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {option.badge && (
                        <span
                          className="glass-badge"
                          style={{
                            fontSize: '0.68rem',
                            padding: '2px 8px',
                            backgroundColor: option.badgeColor ? `${option.badgeColor}20` : 'rgba(108, 99, 255, 0.15)',
                            color: option.badgeColor || 'var(--glass-accent)',
                            borderColor: option.badgeColor ? `${option.badgeColor}40` : 'rgba(108, 99, 255, 0.3)'
                          }}
                        >
                          {option.badge}
                        </span>
                      )}
                      {isSelected && <Check size={15} color="var(--glass-accent)" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
