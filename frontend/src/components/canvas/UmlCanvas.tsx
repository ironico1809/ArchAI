import React, { useState } from 'react';
import { 
  Plus, 
  Layers, 
  Link2, 
  Sparkles,
  GitBranch,
  Camera,
  Boxes,
  Database,
  GraduationCap,
  CreditCard,
  Building2
} from 'lucide-react';
import { ClaseUml, RelacionUml, ModeloDiagrama, AtributoUml } from '../../types/uml';
import { ClassCard } from './ClassCard';
import { GlassTextField } from '../glass/GlassTextField';
import { GlassRichDropdown, RichOption } from '../glass/GlassRichDropdown';
import { GlassSidebar } from '../glass/GlassSidebar';
import { WhiteboardScannerModal } from './WhiteboardScannerModal';

interface UmlCanvasProps {
  diagram: ModeloDiagrama;
  onUpdateDiagram: (updated: ModeloDiagrama) => void;
  onAddClass: (newClass: ClaseUml) => void;
  onDeleteClass: (classId: string) => void;
  onAddAttribute: (classId: string, attr: AtributoUml) => void;
  onDeleteAttribute: (classId: string, attrId: string) => void;
}

const TEMPLATE_OPTIONS: RichOption<string>[] = [
  {
    id: 'clinica',
    data: 'clinica',
    label: 'Sistema Clínico / Hospitalario',
    description: 'Paciente, Medico, Consulta (Examen Parcial)',
    badge: 'Recomendado',
    badgeColor: '#10B981',
    icon: <Building2 size={16} color="#10B981" />
  },
  {
    id: 'facturacion',
    data: 'facturacion',
    label: 'Sistema de Facturación & Inventario',
    description: 'Cliente, Factura, Producto con DDL Postgres',
    badge: 'Comercial',
    badgeColor: '#00E5FF',
    icon: <CreditCard size={16} color="#00E5FF" />
  },
  {
    id: 'academico',
    data: 'academico',
    label: 'Sistema de Gestión Académica',
    description: 'Estudiante, Curso, Prerrequisitos',
    badge: 'Educación',
    badgeColor: '#8B5CF6',
    icon: <GraduationCap size={16} color="#8B5CF6" />
  }
];

export const UmlCanvas: React.FC<UmlCanvasProps> = ({
  diagram,
  onUpdateDiagram,
  onAddClass,
  onDeleteClass,
  onAddAttribute,
  onDeleteAttribute
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassStereotype, setNewClassStereotype] = useState<ClaseUml['stereotype']>('Entity');
  const [showRelationModal, setShowRelationModal] = useState(false);
  const [showWhiteboardModal, setShowWhiteboardModal] = useState(false);
  const [sourceClassId, setSourceClassId] = useState('');
  const [targetClassId, setTargetClassId] = useState('');
  const [relationLabel, setRelationLabel] = useState('asociado_con');
  const [selectedTemplateId, setSelectedTemplateId] = useState('clinica');

  // Cargar plantillas predefinidas
  const loadTemplate = (templateType: string) => {
    setSelectedTemplateId(templateType);
    if (templateType === 'clinica') {
      const classes: ClaseUml[] = [
        {
          id: 'cls-paciente',
          name: 'Paciente',
          stereotype: 'Entity',
          attributes: [
            { id: 'a1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'a2', name: 'nombreCompleto', type: 'String', visibility: '-' },
            { id: 'a3', name: 'ciDni', type: 'String', visibility: '-' },
            { id: 'a4', name: 'fechaNacimiento', type: 'LocalDate', visibility: '-' },
            { id: 'a5', name: 'telefono', type: 'String', visibility: '-' }
          ],
          methods: [
            { id: 'm1', name: 'calcularEdad', returnType: 'Integer', visibility: '+' },
            { id: 'm2', name: 'getHistorialResumen', returnType: 'String', visibility: '+' }
          ]
        },
        {
          id: 'cls-medico',
          name: 'Medico',
          stereotype: 'Entity',
          attributes: [
            { id: 'a6', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'a7', name: 'nombre', type: 'String', visibility: '-' },
            { id: 'a8', name: 'especialidad', type: 'String', visibility: '-' },
            { id: 'a9', name: 'numeroColegiatura', type: 'String', visibility: '-' }
          ],
          methods: [
            { id: 'm3', name: 'validarDisponibilidad', returnType: 'Boolean', visibility: '+' }
          ]
        },
        {
          id: 'cls-consulta',
          name: 'Consulta',
          stereotype: 'Entity',
          attributes: [
            { id: 'a10', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'a11', name: 'fechaHora', type: 'LocalDateTime', visibility: '-' },
            { id: 'a12', name: 'diagnostico', type: 'String', visibility: '-' },
            { id: 'a13', name: 'costo', type: 'Double', visibility: '-' }
          ],
          methods: [
            { id: 'm4', name: 'emitirReceta', returnType: 'String', visibility: '+' }
          ]
        }
      ];

      const relations: RelacionUml[] = [
        {
          id: 'rel-1',
          sourceClassId: 'cls-paciente',
          targetClassId: 'cls-consulta',
          type: 'ASSOCIATION_1_N',
          sourceMultiplicity: '1',
          targetMultiplicity: '*',
          label: 'solicita'
        },
        {
          id: 'rel-2',
          sourceClassId: 'cls-medico',
          targetClassId: 'cls-consulta',
          type: 'ASSOCIATION_1_N',
          sourceMultiplicity: '1',
          targetMultiplicity: '*',
          label: 'atiende'
        }
      ];

      onUpdateDiagram({
        title: 'Sistema de Gestión Clínica (Examen Parcial)',
        classes,
        relations,
        updatedAt: new Date().toISOString()
      });
    } else if (templateType === 'facturacion') {
      const classes: ClaseUml[] = [
        {
          id: 'cls-cliente',
          name: 'Cliente',
          stereotype: 'Entity',
          attributes: [
            { id: 'f1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'f2', name: 'razonSocial', type: 'String', visibility: '-' },
            { id: 'f3', name: 'nitCi', type: 'String', visibility: '-' },
            { id: 'f4', name: 'correoElectronico', type: 'String', visibility: '-' }
          ],
          methods: [{ id: 'fm1', name: 'getSaldoPendiente', returnType: 'Double', visibility: '+' }]
        },
        {
          id: 'cls-factura',
          name: 'Factura',
          stereotype: 'Entity',
          attributes: [
            { id: 'f5', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'f6', name: 'numeroFactura', type: 'String', visibility: '-' },
            { id: 'f7', name: 'fechaEmision', type: 'LocalDate', visibility: '-' },
            { id: 'f8', name: 'montoTotal', type: 'Double', visibility: '-' },
            { id: 'f9', name: 'estadoPago', type: 'Boolean', visibility: '-' }
          ],
          methods: [{ id: 'fm2', name: 'calcularImpuestos', returnType: 'Double', visibility: '+' }]
        },
        {
          id: 'cls-producto',
          name: 'Producto',
          stereotype: 'Entity',
          attributes: [
            { id: 'f10', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'f11', name: 'codigoBarra', type: 'String', visibility: '-' },
            { id: 'f12', name: 'descripcion', type: 'String', visibility: '-' },
            { id: 'f13', name: 'precioUnitario', type: 'Double', visibility: '-' },
            { id: 'f14', name: 'stockDisponible', type: 'Integer', visibility: '-' }
          ],
          methods: [{ id: 'fm3', name: 'actualizarStock', returnType: 'Boolean', visibility: '+' }]
        }
      ];

      const relations: RelacionUml[] = [
        {
          id: 'rel-f1',
          sourceClassId: 'cls-cliente',
          targetClassId: 'cls-factura',
          type: 'ASSOCIATION_1_N',
          sourceMultiplicity: '1',
          targetMultiplicity: '*',
          label: 'recibe'
        }
      ];

      onUpdateDiagram({
        title: 'Sistema de Facturación e Inventario',
        classes,
        relations,
        updatedAt: new Date().toISOString()
      });
    } else if (templateType === 'academico') {
      const classes: ClaseUml[] = [
        {
          id: 'cls-estudiante',
          name: 'Estudiante',
          stereotype: 'Entity',
          attributes: [
            { id: 'e1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'e2', name: 'matricula', type: 'String', visibility: '-' },
            { id: 'e3', name: 'nombres', type: 'String', visibility: '-' },
            { id: 'e4', name: 'apellidos', type: 'String', visibility: '-' }
          ],
          methods: [{ id: 'em1', name: 'getPromedioGeneral', returnType: 'Double', visibility: '+' }]
        },
        {
          id: 'cls-curso',
          name: 'Curso',
          stereotype: 'Entity',
          attributes: [
            { id: 'e5', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'e6', name: 'sigla', type: 'String', visibility: '-' },
            { id: 'e7', name: 'nombreMateria', type: 'String', visibility: '-' },
            { id: 'e8', name: 'creditos', type: 'Integer', visibility: '-' }
          ],
          methods: [{ id: 'em2', name: 'verificarPrerrequisitos', returnType: 'Boolean', visibility: '+' }]
        }
      ];

      const relations: RelacionUml[] = [
        {
          id: 'rel-e1',
          sourceClassId: 'cls-estudiante',
          targetClassId: 'cls-curso',
          type: 'ASSOCIATION_N_M',
          sourceMultiplicity: '*',
          targetMultiplicity: '*',
          label: 'inscrito_en'
        }
      ];

      onUpdateDiagram({
        title: 'Sistema de Gestión Académica',
        classes,
        relations,
        updatedAt: new Date().toISOString()
      });
    }
  };

  const handleManualAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const newClass: ClaseUml = {
      id: 'cls-' + Date.now(),
      name: newClassName.trim().charAt(0).toUpperCase() + newClassName.trim().slice(1),
      stereotype: newClassStereotype || 'Entity',
      attributes: [
        {
          id: 'attr-' + Date.now() + '-id',
          name: 'id',
          type: 'Long',
          visibility: '-',
          isPrimaryKey: true
        }
      ],
      methods: [
        {
          id: 'm-' + Date.now(),
          name: `get${newClassName.trim()}Data`,
          returnType: 'String',
          visibility: '+'
        }
      ]
    };

    onAddClass(newClass);
    setNewClassName('');
    setShowCreateModal(false);
  };

  const handleCreateRelation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceClassId || !targetClassId || sourceClassId === targetClassId) return;

    const newRel: RelacionUml = {
      id: 'rel-' + Date.now(),
      sourceClassId,
      targetClassId,
      type: 'ASSOCIATION_1_N',
      sourceMultiplicity: '1',
      targetMultiplicity: '*',
      label: relationLabel || 'asociado_con'
    };

    onUpdateDiagram({
      ...diagram,
      relations: [...diagram.relations, newRel],
      updatedAt: new Date().toISOString()
    });

    setShowRelationModal(false);
    setSourceClassId('');
    setTargetClassId('');
  };

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'stretch' }}>
      {/* UML Tool Palette Sidebar (GlassSidebar component) */}
      <GlassSidebar width="240px" style={{ borderRadius: 'var(--radius-2xl)', padding: '20px 16px', flexShrink: 0 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.5px', fontFamily: 'var(--font-heading)' }}>
          Herramientas CASE
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => {
              setNewClassStereotype('Entity');
              setShowCreateModal(true);
            }}
            className="glass-button-secondary"
            style={{ justifyContent: 'flex-start', padding: '9px 12px', fontSize: '0.82rem', borderRadius: 'var(--radius-md)' }}
          >
            <Boxes size={15} color="var(--glass-accent)" /> &laquo;Entity&raquo;
          </button>
          <button
            onClick={() => {
              setNewClassStereotype('Service');
              setShowCreateModal(true);
            }}
            className="glass-button-secondary"
            style={{ justifyContent: 'flex-start', padding: '9px 12px', fontSize: '0.82rem', borderRadius: 'var(--radius-md)' }}
          >
            <Layers size={15} color="var(--glass-accent-secondary)" /> &laquo;Service&raquo;
          </button>
          <button
            onClick={() => {
              setNewClassStereotype('Controller');
              setShowCreateModal(true);
            }}
            className="glass-button-secondary"
            style={{ justifyContent: 'flex-start', padding: '9px 12px', fontSize: '0.82rem', borderRadius: 'var(--radius-md)' }}
          >
            <Database size={15} color="var(--glass-success)" /> &laquo;Controller&raquo;
          </button>
          <button
            onClick={() => setShowRelationModal(true)}
            disabled={diagram.classes.length < 2}
            className="glass-button-secondary"
            style={{ justifyContent: 'flex-start', padding: '9px 12px', fontSize: '0.82rem', borderRadius: 'var(--radius-md)' }}
          >
            <Link2 size={15} color="var(--glass-warning)" /> Relación (1:N)
          </button>
          <button
            onClick={() => setShowWhiteboardModal(true)}
            className="glass-button-pill"
            style={{ justifyContent: 'flex-start', padding: '10px 14px', fontSize: '0.82rem', marginTop: '6px' }}
          >
            <Camera size={15} /> Foto Pizarra (IA)
          </button>
        </div>

        {/* Quick Domain Template Rich Dropdown */}
        <div style={{ marginTop: '24px' }}>
          <GlassRichDropdown
            label="Plantillas de Examen"
            options={TEMPLATE_OPTIONS}
            selectedId={selectedTemplateId}
            onSelect={opt => loadTemplate(opt.id)}
          />
        </div>
      </GlassSidebar>

      {/* Main Studio Canvas */}
      <div className="glass-card" style={{
        flex: 1,
        padding: '28px 32px',
        position: 'relative'
      }}>
        {/* Canvas Toolbar */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          paddingBottom: '20px',
          borderBottom: '1px solid var(--glass-border-color)',
          marginBottom: '24px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                background: 'linear-gradient(135deg, var(--glass-accent), #8B5CF6)',
                padding: '8px',
                borderRadius: '10px',
                boxShadow: 'var(--glow-accent)',
                color: '#FFFFFF'
              }}>
                <Layers size={20} />
              </div>
              <h3 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.4rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)'
              }}>
                {diagram.title}
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Estándar OMG UML 2.5 · <span style={{ color: 'var(--glass-accent)', fontWeight: 700 }}>{diagram.classes.length} Clases</span> · <span style={{ color: 'var(--glass-success)', fontWeight: 700 }}>{diagram.relations.length} Relaciones</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button className="glass-button-pill" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} /> Nueva Clase UML
            </button>
            <button className="glass-button-secondary" onClick={() => setShowRelationModal(true)} disabled={diagram.classes.length < 2}>
              <Link2 size={16} /> Conectar Relación
            </button>
          </div>
        </div>

        {/* Relations Summary Bar */}
        {diagram.relations.length > 0 && (
          <div style={{
            background: 'var(--glass-surface)',
            backdropFilter: 'var(--glass-blur-sm)',
            border: '1px solid var(--glass-border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 18px',
            marginBottom: '24px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center'
          }}>
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontWeight: 800,
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-heading)'
            }}>
              <GitBranch size={14} color="var(--glass-accent)" /> Asociaciones UML 2.5:
            </span>
            {diagram.relations.map(rel => {
              const src = diagram.classes.find(c => c.id === rel.sourceClassId);
              const tgt = diagram.classes.find(c => c.id === rel.targetClassId);
              if (!src || !tgt) return null;
              return (
                <div
                  key={rel.id}
                  style={{
                    background: 'var(--glass-surface-elevated)',
                    border: '1px solid var(--glass-border-color)',
                    borderRadius: 'var(--radius-full)',
                    padding: '5px 14px',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  <strong style={{ color: 'var(--text-primary)' }}>{src.name}</strong>
                  <span style={{ color: 'var(--glass-accent)' }}>({rel.sourceMultiplicity})</span>
                  <span style={{ color: 'var(--text-muted)' }}>─── [{rel.label || '1:N'}] ───&gt;</span>
                  <span style={{ color: 'var(--glass-accent)' }}>({rel.targetMultiplicity})</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{tgt.name}</strong>
                </div>
              );
            })}
          </div>
        )}

        {/* UML Class Grid */}
        {diagram.classes.length === 0 ? (
          <div style={{
            padding: '70px 20px',
            textAlign: 'center',
            border: '2px dashed var(--glass-border-color)',
            borderRadius: 'var(--radius-2xl)',
            background: 'var(--glass-surface)'
          }}>
            <Layers size={52} color="var(--text-subtle)" style={{ marginBottom: '14px' }} />
            <h4 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.35rem',
              fontWeight: 800,
              marginBottom: '8px',
              color: 'var(--text-primary)'
            }}>
              Diagrama en Blanco
            </h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 24px' }}>
              Usa el micrófono del Asistente por Voz, sube una foto de la pizarra del docente o selecciona una plantilla para comenzar.
            </p>
            <button className="glass-button-pill" onClick={() => loadTemplate('clinica')}>
              <Sparkles size={16} /> Cargar Plantilla Clínica de Ejemplo
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px',
            alignItems: 'start'
          }}>
            {diagram.classes.map(cls => (
              <ClassCard
                key={cls.id}
                umlClass={cls}
                onDeleteClass={onDeleteClass}
                onAddAttribute={onAddAttribute}
                onDeleteAttribute={onDeleteAttribute}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal: Crear Clase Manual */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'var(--glass-blur-md)',
          WebkitBackdropFilter: 'var(--glass-blur-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-card" style={{
            maxWidth: '440px',
            width: '100%',
            padding: '28px',
            boxShadow: 'var(--shadow-glass-elevated)'
          }}>
            <h3 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.3rem',
              fontWeight: 800,
              marginBottom: '18px',
              color: 'var(--text-primary)'
            }}>
              Crear Nueva Clase UML 2.5
            </h3>
            <form onSubmit={handleManualAddClass} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <GlassTextField
                label="Nombre de la Clase / Entidad"
                required
                autoFocus
                placeholder="Ej. Paciente, Doctor, Factura..."
                value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="glass-button-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="glass-button-pill">
                  <Plus size={16} /> Crear Clase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear Relación */}
      {showRelationModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'var(--glass-blur-md)',
          WebkitBackdropFilter: 'var(--glass-blur-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-card" style={{
            maxWidth: '480px',
            width: '100%',
            padding: '28px',
            boxShadow: 'var(--shadow-glass-elevated)'
          }}>
            <h3 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.3rem',
              fontWeight: 800,
              marginBottom: '18px',
              color: 'var(--text-primary)'
            }}>
              Conectar Relación UML (1:N / N:M)
            </h3>
            <form onSubmit={handleCreateRelation} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Clase Origen (Lado 1)
                </label>
                <select
                  className="glass-textfield"
                  value={sourceClassId}
                  onChange={e => setSourceClassId(e.target.value)}
                  required
                  style={{ background: 'var(--glass-surface)', color: 'var(--text-primary)' }}
                >
                  <option value="">Selecciona una clase origen...</option>
                  {diagram.classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Clase Destino (Lado N)
                </label>
                <select
                  className="glass-textfield"
                  value={targetClassId}
                  onChange={e => setTargetClassId(e.target.value)}
                  required
                  style={{ background: 'var(--glass-surface)', color: 'var(--text-primary)' }}
                >
                  <option value="">Selecciona una clase destino...</option>
                  {diagram.classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <GlassTextField
                label="Etiqueta / Verbo de la Relación"
                value={relationLabel}
                onChange={e => setRelationLabel(e.target.value)}
                placeholder="ej. tiene, gestiona, solicita"
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="glass-button-secondary" onClick={() => setShowRelationModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="glass-button-pill">
                  <Link2 size={16} /> Crear Asociación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Escaneo de Foto de Pizarra */}
      {showWhiteboardModal && (
        <WhiteboardScannerModal
          onImportDiagram={onUpdateDiagram}
          onClose={() => setShowWhiteboardModal(false)}
        />
      )}
    </div>
  );
};
