import React, { useState } from 'react';
import { Layers, Sparkles } from 'lucide-react';
import { ClaseUml, AtributoUml, RelacionUml } from '../../types/uml';
import { detectarAtributosCompartidos } from '../../services/semanticDomainEngine';
import { GlassModal } from '../glass/GlassModal';

interface ExtractSuperclassModalProps {
  selectedClasses: ClaseUml[];
  onConfirm: (
    superclass: ClaseUml,
    updatedSubclasses: ClaseUml[],
    inheritanceRelations: RelacionUml[]
  ) => void;
  onClose: () => void;
}

export const ExtractSuperclassModal: React.FC<ExtractSuperclassModalProps> = ({
  selectedClasses,
  onConfirm,
  onClose
}) => {
  const sharedAttrs = detectarAtributosCompartidos(selectedClasses);

  // Sugerir nombre de superclase inteligente
  const nombresSubclases = selectedClasses.map(c => c.name.toLowerCase());
  let nombreSugerido = 'EntidadBase';
  if (nombresSubclases.some(n => n.includes('cliente') || n.includes('empleado') || n.includes('vendedor') || n.includes('usuario'))) {
    nombreSugerido = 'Persona';
  } else if (nombresSubclases.some(n => n.includes('cuenta') || n.includes('ahorro') || n.includes('corriente'))) {
    nombreSugerido = 'CuentaBancaria';
  } else if (nombresSubclases.some(n => n.includes('vehiculo') || n.includes('auto') || n.includes('camion') || n.includes('moto'))) {
    nombreSugerido = 'Vehiculo';
  } else if (nombresSubclases.some(n => n.includes('producto') || n.includes('servicio') || n.includes('articulo'))) {
    nombreSugerido = 'ItemComercial';
  }

  const [superclassName, setSuperclassName] = useState(nombreSugerido);
  const [selectedAttrNames, setSelectedAttrNames] = useState<Set<string>>(
    new Set(sharedAttrs.map(a => a.name))
  );
  const [removePromotedFromChildren, setRemovePromotedFromChildren] = useState(true);

  const toggleAttribute = (name: string) => {
    setSelectedAttrNames(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleApply = () => {
    const cleanName = superclassName.trim() || nombreSugerido;
    const ts = Date.now();
    const superclassId = `cls-super-${ts}`;

    // Calcular centro promedio de las subclases para posicionar la superclase arriba
    let avgX = 0;
    let minY = Infinity;
    selectedClasses.forEach(c => {
      const pos = c.position || { x: 300, y: 300 };
      avgX += pos.x;
      if (pos.y < minY) minY = pos.y;
    });
    avgX = Math.round(avgX / selectedClasses.length);
    const posY = Math.max(60, minY - 240);

    // Atributos promovidos a la superclase
    const promotedAttributes: AtributoUml[] = [
      {
        id: `attr-${ts}-pk`,
        name: 'id',
        type: 'Long',
        visibility: '#', // protegido en herencia
        isPrimaryKey: true,
        isNullable: false
      }
    ];

    sharedAttrs.forEach((sa, idx) => {
      if (selectedAttrNames.has(sa.name)) {
        promotedAttributes.push({
          id: `attr-${ts}-prom-${idx}`,
          name: sa.name,
          type: sa.type,
          visibility: '#', // protegido para acceso de subclases
          isPrimaryKey: false,
          isNullable: false
        });
      }
    });

    const superclass: ClaseUml = {
      id: superclassId,
      name: cleanName,
      stereotype: 'Abstract',
      isAbstract: true,
      isInterface: false,
      position: { x: avgX, y: posY },
      attributes: promotedAttributes,
      methods: [
        {
          id: `m-${ts}-desc`,
          name: `obtenerDescripcion${cleanName}`,
          returnType: 'String',
          visibility: '+',
          parameters: ''
        }
      ]
    };

    // Actualizar subclases: si removePromotedFromChildren es true, retirar los atributos promovidos
    const updatedSubclasses = selectedClasses.map(sub => {
      let attrs = sub.attributes || [];
      if (removePromotedFromChildren) {
        attrs = attrs.filter(a => !selectedAttrNames.has(a.name.toLowerCase()));
      }
      return {
        ...sub,
        attributes: attrs
      };
    });

    // Relaciones de HERENCIA (──▷) dirigidas desde la Subclase hacia la Superclase
    const inheritanceRelations: RelacionUml[] = selectedClasses.map((sub, idx) => ({
      id: `rel-inh-${ts}-${idx}`,
      sourceClassId: sub.id,
      targetClassId: superclassId,
      type: 'INHERITANCE',
      sourceMultiplicity: '',
      targetMultiplicity: '',
      label: 'extiende'
    }));

    onConfirm(superclass, updatedSubclasses, inheritanceRelations);
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
        onClick={handleApply}
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
        <span>Aplicar Herencia (UML 2.5)</span>
      </button>
    </div>
  );

  return (
    <GlassModal
      onClose={onClose}
      title="Extraer Superclase Común (Generalización)"
      subtitle="Factoriza atributos compartidos en una clase abstracta padre y conecta las clases con herencia UML (──▷)"
      icon={<Layers size={20} color="#e8c39e" />}
      iconBg="#2f2c79"
      maxWidth="660px"
      zIndex={1250}
      footer={modalFooter}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Subclases Seleccionadas */}
        <div
          style={{
            background: 'rgba(47, 44, 121, 0.35)',
            border: '1px solid rgba(232, 195, 158, 0.25)',
            borderRadius: '12px',
            padding: '12px 14px'
          }}
        >
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
            Subclases que heredarán de la nueva superclase:
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {selectedClasses.map(c => (
              <span
                key={c.id}
                style={{
                  background: 'rgba(47, 44, 121, 0.70)',
                  border: '1px solid rgba(232, 195, 158, 0.45)',
                  color: '#f5e1ce',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 700
                }}
              >
                {c.name}
              </span>
            ))}
          </div>
        </div>

        {/* Nombre de la Superclase */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            Nombre de la Superclase Base («abstract»):
          </label>
          <input
            type="text"
            value={superclassName}
            onChange={e => setSuperclassName(e.target.value)}
            placeholder="ej. Persona, CuentaBase, Vehiculo"
            style={{
              width: '100%',
              background: 'var(--glass-surface)',
              border: '1px solid var(--glass-modal-border)',
              color: 'var(--text-primary)',
              padding: '9px 12px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 700,
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Atributos Detectados para Promover */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            Atributos compartidos para promover a la Superclase:
          </label>

          {sharedAttrs.length === 0 ? (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.50)',
                border: '1px solid var(--glass-modal-border)',
                padding: '12px',
                borderRadius: '8px',
                color: 'var(--text-muted)',
                fontSize: '0.78rem'
              }}
            >
              No se detectaron atributos con nombres idénticos. La superclase se creará con el ID primario y visibilidad protegida `#`.
            </div>
          ) : (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.40)',
                border: '1px solid var(--glass-modal-border)',
                borderRadius: '8px',
                padding: '8px',
                maxHeight: '160px',
                overflowY: 'auto'
              }}
            >
              {sharedAttrs.map(attr => (
                <div
                  key={attr.name}
                  onClick={() => toggleAttribute(attr.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: selectedAttrNames.has(attr.name) ? 'rgba(47, 44, 121, 0.60)' : 'transparent',
                    border: `1px solid ${selectedAttrNames.has(attr.name) ? 'rgba(232, 195, 158, 0.35)' : 'transparent'}`,
                    marginBottom: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={selectedAttrNames.has(attr.name)}
                      onChange={() => toggleAttribute(attr.name)}
                      style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      #{attr.name}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      : {attr.type}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    Presente en {attr.count} de {selectedClasses.length} clases
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checkbox de Limpieza en Subclases */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            id="cleanChildren"
            checked={removePromotedFromChildren}
            onChange={e => setRemovePromotedFromChildren(e.target.checked)}
            style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
          />
          <label htmlFor="cleanChildren" style={{ fontSize: '0.78rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
            Retirar atributos promovidos de las subclases para evitar duplicación relacional (recomendado 3FN)
          </label>
        </div>
      </div>
    </GlassModal>
  );
};
