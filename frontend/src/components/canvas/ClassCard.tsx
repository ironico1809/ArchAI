import React, { useState } from 'react';
import { 
  Key, 
  Plus, 
  Trash2, 
  Check, 
  X
} from 'lucide-react';
import { ClaseUml, AtributoUml, Visibilidad } from '../../types/uml';

interface ClassCardProps {
  umlClass: ClaseUml;
  onDeleteClass: (classId: string) => void;
  onAddAttribute: (classId: string, attribute: AtributoUml) => void;
  onDeleteAttribute: (classId: string, attrId: string) => void;
}

export const ClassCard: React.FC<ClassCardProps> = ({
  umlClass,
  onDeleteClass,
  onAddAttribute,
  onDeleteAttribute
}) => {
  const [showAddAttr, setShowAddAttr] = useState(false);
  const [attrName, setAttrName] = useState('');
  const [attrType, setAttrType] = useState<AtributoUml['type']>('String');
  const [attrVis, setAttrVis] = useState<Visibilidad>('-');

  const handleSaveAttribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attrName.trim()) return;

    const newAttr: AtributoUml = {
      id: 'attr-' + Date.now(),
      name: attrName.trim(),
      type: attrType,
      visibility: attrVis,
      isPrimaryKey: false,
      isNullable: false
    };

    onAddAttribute(umlClass.id, newAttr);
    setAttrName('');
    setShowAddAttr(false);
  };

  return (
    <div className="glass-card" style={{
      minWidth: '290px',
      maxWidth: '360px',
      borderRadius: 'var(--radius-xl)',
      border: '1px solid var(--glass-border-color)'
    }}>
      {/* Class Header */}
      <div style={{
        background: 'var(--glass-node-header-bg)',
        padding: '14px 18px',
        borderBottom: '1px solid var(--glass-node-header-border)',
        borderTop: '3px solid var(--glass-node-header-accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{
            fontSize: '0.72rem',
            color: 'var(--glass-node-stereo-color)',
            fontWeight: 800,
            letterSpacing: '1px',
            fontFamily: 'var(--font-mono)'
          }}>
            &laquo;{umlClass.stereotype || 'Entity'}&raquo;
          </div>
          <h4 style={{
            fontSize: '1.18rem',
            fontWeight: 800,
            color: 'var(--glass-node-header-text)',
            letterSpacing: '-0.02em',
            fontFamily: 'var(--font-heading)'
          }}>
            {umlClass.name}
          </h4>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setShowAddAttr(!showAddAttr)}
            title="Añadir atributo"
            style={{
              padding: '6px',
              borderRadius: '8px',
              background: 'var(--glass-node-btn-bg)',
              border: '1px solid var(--glass-node-btn-border)',
              color: 'var(--glass-node-btn-text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => onDeleteClass(umlClass.id)}
            title="Eliminar clase"
            style={{
              background: 'rgba(255, 82, 82, 0.15)',
              border: '1px solid rgba(255, 82, 82, 0.3)',
              borderRadius: '8px',
              padding: '6px',
              color: 'var(--glass-error)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s'
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Attributes Section */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--glass-border-color)' }}>
        <div style={{
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          fontWeight: 800,
          textTransform: 'uppercase',
          marginBottom: '10px',
          letterSpacing: '0.5px',
          fontFamily: 'var(--font-heading)'
        }}>
          Atributos / Columnas
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {umlClass.attributes.map(attr => (
            <div
              key={attr.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.84rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-primary)',
                background: 'var(--glass-surface)',
                padding: '5px 10px',
                borderRadius: '8px',
                border: '1px solid var(--glass-border-color)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  color: attr.visibility === '+' ? 'var(--glass-success)' : attr.visibility === '-' ? 'var(--glass-error)' : 'var(--glass-warning)',
                  fontWeight: 800,
                  fontSize: '0.92rem'
                }}>
                  {attr.visibility}
                </span>
                <span style={{ fontWeight: 600 }}>{attr.name}</span>
                {attr.isPrimaryKey && (
                  <span title="Clave Primaria (PK)">
                    <Key size={13} color="var(--glass-warning)" />
                  </span>
                )}
                <span style={{ color: 'var(--text-subtle)' }}>:</span>
                <span style={{ color: 'var(--glass-accent)', fontWeight: 700 }}>{attr.type}</span>
              </div>
              {!attr.isPrimaryKey && (
                <button
                  onClick={() => onDeleteAttribute(umlClass.id, attr.id)}
                  title="Borrar atributo"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-subtle)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Inline Add Attribute Form */}
        {showAddAttr && (
          <form onSubmit={handleSaveAttribute} style={{
            marginTop: '14px',
            background: 'var(--glass-surface-elevated)',
            backdropFilter: 'var(--glass-blur-sm)',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--glass-border-color)'
          }}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              <select
                value={attrVis}
                onChange={e => setAttrVis(e.target.value as Visibilidad)}
                className="glass-textfield"
                style={{ width: '80px', padding: '6px 8px', fontSize: '0.78rem' }}
              >
                <option value="-">- (private)</option>
                <option value="+">+ (public)</option>
                <option value="#"># (protected)</option>
              </select>
              <input
                type="text"
                required
                placeholder="nombreAtributo"
                value={attrName}
                onChange={e => setAttrName(e.target.value)}
                className="glass-textfield"
                style={{ flex: 1, padding: '6px 10px', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <select
                value={attrType}
                onChange={e => setAttrType(e.target.value as any)}
                className="glass-textfield"
                style={{ flex: 1, padding: '6px 8px', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}
              >
                <option value="String">String</option>
                <option value="Long">Long</option>
                <option value="Integer">Integer</option>
                <option value="Double">Double</option>
                <option value="Boolean">Boolean</option>
                <option value="LocalDate">LocalDate</option>
                <option value="LocalDateTime">LocalDateTime</option>
                <option value="BigDecimal">BigDecimal</option>
              </select>
              <button type="submit" className="glass-button-pill" style={{ padding: '6px 14px', fontSize: '0.78rem' }}>
                <Check size={13} /> Guardar
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Methods Section */}
      <div style={{ padding: '14px 18px', background: 'rgba(0, 0, 0, 0.03)' }}>
        <div style={{
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          fontWeight: 800,
          textTransform: 'uppercase',
          marginBottom: '8px',
          letterSpacing: '0.5px',
          fontFamily: 'var(--font-heading)'
        }}>
          Operaciones / Métodos
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {umlClass.methods.map(m => (
            <div key={m.id} style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--glass-success)', fontWeight: 800 }}>{m.visibility} </span>
              {m.name}({m.parameters || ''}): <span style={{ color: 'var(--glass-accent)', fontWeight: 700 }}>{m.returnType}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
