import React, { useState } from 'react';
import { Sparkles, Plus, Trash2 } from 'lucide-react';
import { ClaseUml, AtributoUml, MetodoUml } from '../../types/uml';
import { inferirTablaIntermedia } from '../../services/semanticDomainEngine';
import { GlassModal } from '../glass/GlassModal';

interface IntermediateTableDecomposerModalProps {
  sourceClass: ClaseUml;
  targetClass: ClaseUml;
  existingClasses: ClaseUml[];
  onConfirm: (
    newClass: ClaseUml,
    rel1Config: { sourceMultiplicity: string; targetMultiplicity: string; label: string },
    rel2Config: { sourceMultiplicity: string; targetMultiplicity: string; label: string }
  ) => void;
  onClose: () => void;
}

export const IntermediateTableDecomposerModal: React.FC<IntermediateTableDecomposerModalProps> = ({
  sourceClass,
  targetClass,
  existingClasses,
  onConfirm,
  onClose
}) => {
  // Inferir sugerencia inicial inteligente
  const initialSuggestion = inferirTablaIntermedia(sourceClass, targetClass, existingClasses);

  const [className, setClassName] = useState<string>(initialSuggestion.nombreClase);
  const [stereotype, setStereotype] = useState<ClaseUml['stereotype']>('AssociationClass');
  const [attributes, setAttributes] = useState<Array<AtributoUml & { selected: boolean }>>(
    initialSuggestion.atributos.map(a => ({ ...a, selected: true }))
  );
  const [methods] = useState<MetodoUml[]>(initialSuggestion.metodos);

  // Nuevos atributos personalizados
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrType, setNewAttrType] = useState('String');

  // Cardinalidades de los extremos
  const [srcMult, setSrcMult] = useState('1');
  const [srcToInterMult, setSrcToInterMult] = useState('0..*');
  const [rel1Label, setRel1Label] = useState(initialSuggestion.relacion1?.label || 'tiene');

  const [tgtMult, setTgtMult] = useState('1');
  const [tgtToInterMult, setTgtToInterMult] = useState('0..*');
  const [rel2Label, setRel2Label] = useState(initialSuggestion.relacion2?.label || 'incluye');

  const handleToggleAttr = (attrId: string) => {
    setAttributes(prev =>
      prev.map(a => (a.id === attrId ? { ...a, selected: !a.selected } : a))
    );
  };

  const handleRemoveAttr = (attrId: string) => {
    setAttributes(prev => prev.filter(a => a.id !== attrId));
  };

  const handleAddCustomAttr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttrName.trim()) return;

    const newAttr: AtributoUml & { selected: boolean } = {
      id: `attr-custom-${Date.now()}`,
      name: newAttrName.trim(),
      type: newAttrType,
      visibility: '-',
      isPrimaryKey: false,
      isNullable: false,
      selected: true
    };

    setAttributes(prev => [...prev, newAttr]);
    setNewAttrName('');
  };

  const handleSave = () => {
    const cleanClassName = className.trim() || initialSuggestion.nombreClase;
    const finalAttributes = attributes
      .filter(a => a.selected)
      .map(({ selected, ...rest }) => rest);

    // Posición intermedia óptima en el lienzo
    const srcPos = sourceClass.position || { x: 100, y: 100 };
    const tgtPos = targetClass.position || { x: 500, y: 100 };
    const intermediatePos = {
      x: Math.round((srcPos.x + tgtPos.x) / 2),
      y: Math.round((srcPos.y + tgtPos.y) / 2) + 60
    };

    const newClass: ClaseUml = {
      id: `cls-inter-${Date.now()}`,
      name: cleanClassName,
      stereotype,
      isAbstract: false,
      isInterface: false,
      position: intermediatePos,
      attributes: finalAttributes,
      methods
    };

    onConfirm(
      newClass,
      {
        sourceMultiplicity: srcMult,
        targetMultiplicity: srcToInterMult,
        label: rel1Label.trim() || 'tiene'
      },
      {
        sourceMultiplicity: tgtMult,
        targetMultiplicity: tgtToInterMult,
        label: rel2Label.trim() || 'incluye'
      }
    );
  };

  const modalFooter = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
      <button
        type="button"
        onClick={onClose}
        className="btn-studio-glass"
        style={{ padding: '8px 16px', fontSize: '0.82rem' }}
      >
        Cancelar
      </button>
      <button
        type="button"
        onClick={handleSave}
        className="btn-studio-primary"
        style={{
          padding: '8px 20px',
          fontSize: '0.84rem',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <Sparkles size={15} color="#000020" />
        <span>Crear Tabla Intermedia</span>
      </button>
    </div>
  );

  return (
    <GlassModal
      onClose={onClose}
      title="Descomponer N:M en Tabla Intermedia"
      subtitle="Normalización UML 2.5 / 3FN: resuelve la relación Muchos a Muchos con una entidad asociativa tipada"
      icon={<Sparkles size={20} color="#e8c39e" />}
      iconBg="#2f2c79"
      maxWidth="720px"
      zIndex={1250}
      footer={modalFooter}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Badge de Dominio Detectado */}
        <div
          style={{
            background: 'rgba(47, 44, 121, 0.40)',
            border: '1px solid rgba(232, 195, 158, 0.25)',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.82rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ background: '#2f2c79', border: '1px solid rgba(232, 195, 158, 0.40)', color: '#f5e1ce', fontWeight: 800, padding: '2px 8px', borderRadius: '5px', fontSize: '0.72rem' }}>
              {sourceClass.name}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>* ──── *</span>
            <span style={{ background: '#2f2c79', border: '1px solid rgba(232, 195, 158, 0.40)', color: '#f5e1ce', fontWeight: 800, padding: '2px 8px', borderRadius: '5px', fontSize: '0.72rem' }}>
              {targetClass.name}
            </span>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
            Dominio detectado: <strong style={{ color: 'var(--text-primary)' }}>{initialSuggestion.dominioDetectado}</strong>
          </span>
        </div>

        {/* Nombre y Estereotipo de la Clase Intermedia */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Nombre de la Clase Asociativa:
            </label>
            <input
              type="text"
              value={className}
              onChange={e => setClassName(e.target.value)}
              placeholder="ej. Detalle, Inscripcion, Cita"
              style={{
                width: '100%',
                background: 'var(--glass-surface)',
                border: '1px solid var(--glass-modal-border)',
                color: 'var(--text-primary)',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 700,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Estereotipo UML:
            </label>
            <select
              value={stereotype}
              onChange={e => setStereotype(e.target.value as any)}
              style={{
                width: '100%',
                background: 'var(--glass-surface)',
                border: '1px solid var(--glass-modal-border)',
                color: 'var(--text-primary)',
                padding: '8px 10px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 600,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            >
              <option value="AssociationClass">«AssociationClass»</option>
              <option value="Entity">«Entity»</option>
            </select>
          </div>
        </div>

        {/* Lista de Atributos con Checkboxes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Atributos de la Intersección (Relación):
            </label>
            <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
              Marca o desmarca los campos a incluir
            </span>
          </div>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.45)',
              border: '1px solid var(--glass-modal-border)',
              borderRadius: '10px',
              padding: '8px',
              maxHeight: '170px',
              overflowY: 'auto'
            }}
          >
            {attributes.map(a => (
              <div
                key={a.id}
                onClick={() => !a.isPrimaryKey && handleToggleAttr(a.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: a.selected ? 'rgba(47, 44, 121, 0.60)' : 'transparent',
                  marginBottom: '4px',
                  cursor: a.isPrimaryKey ? 'default' : 'pointer',
                  border: a.selected ? '1px solid rgba(232, 195, 158, 0.35)' : '1px solid transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={a.selected}
                    disabled={a.isPrimaryKey}
                    onChange={() => handleToggleAttr(a.id)}
                    style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: a.selected ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {a.name}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    : {a.type}
                  </span>
                  {a.isPrimaryKey && (
                    <span style={{ background: '#eab308', color: '#000', fontSize: '0.62rem', fontWeight: 800, padding: '1px 5px', borderRadius: '4px' }}>
                      PK
                    </span>
                  )}
                </div>

                {!a.isPrimaryKey && (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleRemoveAttr(a.id);
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                    title="Eliminar atributo"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Formulario para agregar atributo personalizado */}
          <form
            onSubmit={handleAddCustomAttr}
            style={{ display: 'flex', gap: '8px', marginTop: '6px' }}
          >
            <input
              type="text"
              value={newAttrName}
              onChange={e => setNewAttrName(e.target.value)}
              placeholder="Nombre del atributo (ej. observacion, estado)"
              style={{
                flex: 1,
                background: 'var(--glass-surface)',
                border: '1px solid var(--glass-modal-border)',
                color: 'var(--text-primary)',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                outline: 'none'
              }}
            />
            <select
              value={newAttrType}
              onChange={e => setNewAttrType(e.target.value)}
              style={{
                background: 'var(--glass-surface)',
                border: '1px solid var(--glass-modal-border)',
                color: 'var(--text-secondary)',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 700,
                outline: 'none'
              }}
            >
              <option value="String">String</option>
              <option value="Integer">Integer</option>
              <option value="Double">Double</option>
              <option value="Long">Long</option>
              <option value="Boolean">Boolean</option>
              <option value="LocalDate">LocalDate</option>
              <option value="LocalDateTime">LocalDateTime</option>
              <option value="BigDecimal">BigDecimal</option>
            </select>
            <button
              type="submit"
              disabled={!newAttrName.trim()}
              className="btn-studio-primary"
              style={{
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: newAttrName.trim() ? 'pointer' : 'not-allowed',
                opacity: newAttrName.trim() ? 1 : 0.6,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Plus size={14} />
              <span>Agregar</span>
            </button>
          </form>
        </div>

        {/* Configuración de las Dos Conexiones 1:N Resultantes */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.45)',
            border: '1px solid var(--glass-modal-border)',
            borderRadius: '10px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            Conexiones 1:N resultantes:
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Relación 1 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{sourceClass.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <select
                  value={srcMult}
                  onChange={e => setSrcMult(e.target.value)}
                  style={{ background: 'var(--glass-surface)', border: '1px solid var(--glass-modal-border)', color: 'var(--text-primary)', padding: '2px 5px', borderRadius: '4px', fontSize: '0.72rem' }}
                >
                  <option value="1">1</option>
                  <option value="0..1">0..1</option>
                </select>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>──</span>
                  <input
                    type="text"
                    value={rel1Label}
                    onChange={e => setRel1Label(e.target.value)}
                    style={{ background: 'var(--glass-surface)', border: '1px solid var(--glass-modal-border)', color: 'var(--text-primary)', padding: '1px 4px', borderRadius: '3px', fontSize: '0.68rem', width: '55px', textAlign: 'center' }}
                  />
                  <span style={{ color: 'var(--text-muted)' }}>──</span>
                </div>
                <select
                  value={srcToInterMult}
                  onChange={e => setSrcToInterMult(e.target.value)}
                  style={{ background: 'var(--glass-surface)', border: '1px solid var(--glass-modal-border)', color: 'var(--text-primary)', padding: '2px 5px', borderRadius: '4px', fontSize: '0.72rem' }}
                >
                  <option value="0..*">0..*</option>
                  <option value="1..*">1..*</option>
                </select>
              </div>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{className || 'Intermedia'}</span>
            </div>

            {/* Relación 2 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{targetClass.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <select
                  value={tgtMult}
                  onChange={e => setTgtMult(e.target.value)}
                  style={{ background: 'var(--glass-surface)', border: '1px solid var(--glass-modal-border)', color: 'var(--text-primary)', padding: '2px 5px', borderRadius: '4px', fontSize: '0.72rem' }}
                >
                  <option value="1">1</option>
                  <option value="0..1">0..1</option>
                </select>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>──</span>
                  <input
                    type="text"
                    value={rel2Label}
                    onChange={e => setRel2Label(e.target.value)}
                    style={{ background: 'var(--glass-surface)', border: '1px solid var(--glass-modal-border)', color: 'var(--text-primary)', padding: '1px 4px', borderRadius: '3px', fontSize: '0.68rem', width: '55px', textAlign: 'center' }}
                  />
                  <span style={{ color: 'var(--text-muted)' }}>──</span>
                </div>
                <select
                  value={tgtToInterMult}
                  onChange={e => setTgtToInterMult(e.target.value)}
                  style={{ background: 'var(--glass-surface)', border: '1px solid var(--glass-modal-border)', color: 'var(--text-primary)', padding: '2px 5px', borderRadius: '4px', fontSize: '0.72rem' }}
                >
                  <option value="0..*">0..*</option>
                  <option value="1..*">1..*</option>
                </select>
              </div>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{className || 'Intermedia'}</span>
            </div>
          </div>
        </div>
      </div>
    </GlassModal>
  );
};
