import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Database, 
  Layers, 
  FileCode, 
  CircleDot, 
  Code2, 
  ListFilter, 
  PackageOpen, 
  Component as ComponentIcon, 
  StickyNote, 
  Search, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Link2, 
  Zap, 
  Plus,
  Server,
  FolderOpen,
  Hash,
  Boxes
} from 'lucide-react';
import { ClaseUml, TipoRelacion, EstereotipoUml } from '../../types/uml';

export interface DefClasificadorUml {
  id: string;
  name: string;
  stereotype: EstereotipoUml;
  description: string;
  umlNotation: string;
  badge: string;
  color: string;
  bgGradient: string;
  borderAccent: string;
  isAbstract?: boolean;
  isInterface?: boolean;
  isInstance?: boolean;
  isNote?: boolean;
  templateParams?: string;
  defaultAttributes: {
    name: string;
    type: any;
    visibility: any;
    isPrimaryKey?: boolean;
    isStatic?: boolean;
    isDerived?: boolean;
    isReadOnly?: boolean;
    defaultValue?: string;
    multiplicity?: string;
  }[];
  defaultMethods: {
    name: string;
    returnType: string;
    visibility: any;
    parameters?: string;
    isStatic?: boolean;
    isQuery?: boolean;
  }[];
  defaultNoteText?: string;
}

export interface DefRelacionUml {
  id: string;
  name: string;
  type: TipoRelacion;
  symbol: string;
  lineStyle: 'solid' | 'dashed';
  arrowNotation: string;
  multiplicityHint: string;
  description: string;
  color: string;
}

export interface DefPatronUml {
  id: string;
  name: string;
  category: string;
  description: string;
  badge: string;
  color: string;
  classesCount: number;
  relationsCount: number;
  builder: (center: { x: number; y: number }) => { classes: ClaseUml[]; relations: any[] };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CATÁLOGO DE CLASIFICADORES ESTRUCTURALES (UML 2.5 STANDARD)
// ─────────────────────────────────────────────────────────────────────────────

export const CLASIFICADORES_UML_25: DefClasificadorUml[] = [
  {
    id: 'uml-class',
    name: 'Clase Estándar',
    stereotype: 'Class',
    description: 'Estructura estándar de clases con atributos y operaciones',
    umlNotation: 'Class',
    badge: 'Class',
    color: '#e8c39e',
    bgGradient: '#2f2c79',
    borderAccent: '#2f2c79',
    defaultAttributes: [
      { name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
      { name: 'nombre', type: 'String', visibility: '-' }
    ],
    defaultMethods: [
      { name: 'validar', returnType: 'Boolean', visibility: '+' }
    ]
  },
  {
    id: 'uml-entity',
    name: 'Entidad Persistente',
    stereotype: 'Entity',
    description: 'Tabla persistente JPA / SQL con clave primaria @Id y columnas',
    umlNotation: '«Entity»',
    badge: '«Entity»',
    color: '#e8c39e',
    bgGradient: '#2f2c79',
    borderAccent: '#2f2c79',
    defaultAttributes: [
      { name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
      { name: 'nombre', type: 'String', visibility: '-' },
      { name: 'activo', type: 'Boolean', visibility: '-' }
    ],
    defaultMethods: [
      { name: 'actualizarEstado', returnType: 'void', visibility: '+', parameters: 'Boolean' }
    ]
  },
  {
    id: 'uml-interface',
    name: 'Interfaz',
    stereotype: 'Interface',
    description: 'Contrato formal abstracto de operaciones; tipografía en cursiva',
    umlNotation: '«Interface»',
    badge: '«Interface»',
    color: '#e8c39e',
    bgGradient: '#2f2c79',
    borderAccent: '#2f2c79',
    isInterface: true,
    defaultAttributes: [],
    defaultMethods: [
      { name: 'ejecutarOperacion', returnType: 'void', visibility: '+', parameters: 'Object' },
      { name: 'obtenerResultado', returnType: 'String', visibility: '+' }
    ]
  },
  {
    id: 'uml-abstract',
    name: 'Clase Abstracta',
    stereotype: 'Abstract',
    description: 'Clase base no instanciable que define operaciones polimórficas',
    umlNotation: '«Abstract»',
    badge: '«Abstract»',
    color: '#e8c39e',
    bgGradient: '#2f2c79',
    borderAccent: '#2f2c79',
    isAbstract: true,
    defaultAttributes: [
      { name: 'id', type: 'Long', visibility: '#', isPrimaryKey: true },
      { name: 'fechaRegistro', type: 'LocalDate', visibility: '#' }
    ],
    defaultMethods: [
      { name: 'procesar', returnType: 'void', visibility: '+', parameters: 'Object' },
      { name: 'validarReglas', returnType: 'Boolean', visibility: '#' }
    ]
  },
  {
    id: 'uml-service',
    name: 'Servicio de Negocio',
    stereotype: 'Service',
    description: 'Capa de lógica transaccional de dominio y orquestación (@Service)',
    umlNotation: '«Service»',
    badge: '«Service»',
    color: '#e8c39e',
    bgGradient: '#2f2c79',
    borderAccent: '#2f2c79',
    defaultAttributes: [
      { name: 'repository', type: 'String', visibility: '-' }
    ],
    defaultMethods: [
      { name: 'procesarTransaccion', returnType: 'Boolean', visibility: '+', parameters: 'Object' },
      { name: 'consultarPorId', returnType: 'Optional', visibility: '+', parameters: 'Long' }
    ]
  },
  {
    id: 'uml-controller',
    name: 'Controlador REST',
    stereotype: 'Controller',
    description: 'Frontera de comunicación HTTP REST API y endpoints (@RestController)',
    umlNotation: '«Controller»',
    badge: '«Controller»',
    color: '#e8c39e',
    bgGradient: '#2f2c79',
    borderAccent: '#2f2c79',
    defaultAttributes: [
      { name: 'service', type: 'String', visibility: '-' }
    ],
    defaultMethods: [
      { name: 'handleCreate', returnType: 'ResponseEntity', visibility: '+', parameters: 'Object' },
      { name: 'handleGetById', returnType: 'ResponseEntity', visibility: '+', parameters: 'Long' },
      { name: 'handleDelete', returnType: 'ResponseEntity', visibility: '+', parameters: 'Long' }
    ]
  },
  {
    id: 'uml-repository',
    name: 'Repositorio / DAO',
    stereotype: 'Repository',
    description: 'Abstracción de persistencia y consultas de datos (JpaRepository)',
    umlNotation: '«Repository»',
    badge: '«Repository»',
    color: '#e8c39e',
    bgGradient: '#2f2c79',
    borderAccent: '#2f2c79',
    defaultAttributes: [
      { name: 'dataSource', type: 'String', visibility: '-' }
    ],
    defaultMethods: [
      { name: 'findAll', returnType: 'List', visibility: '+' },
      { name: 'findById', returnType: 'Optional', visibility: '+', parameters: 'Long' },
      { name: 'save', returnType: 'Object', visibility: '+', parameters: 'Object' }
    ]
  },
  {
    id: 'uml-enum',
    name: 'Enumeración',
    stereotype: 'Enum',
    description: 'Conjunto tipado de literales constantes o estados de dominio',
    umlNotation: '«Enumeration»',
    badge: '«Enum»',
    color: '#e8c39e',
    bgGradient: '#2f2c79',
    borderAccent: '#2f2c79',
    defaultAttributes: [
      { name: 'ACTIVO', type: 'String', visibility: '+' },
      { name: 'PENDIENTE', type: 'String', visibility: '+' },
      { name: 'CANCELADO', type: 'String', visibility: '+' }
    ],
    defaultMethods: [
      { name: 'getDescripcion', returnType: 'String', visibility: '+' }
    ]
  },
  {
    id: 'uml-dto',
    name: 'DTO / Record',
    stereotype: 'DTO',
    description: 'Objeto plano de transferencia de datos / Value Object sin persistencia',
    umlNotation: '«DTO»',
    badge: '«DTO»',
    color: '#e8c39e',
    bgGradient: '#2f2c79',
    borderAccent: '#2f2c79',
    defaultAttributes: [
      { name: 'id', type: 'Long', visibility: '+', isReadOnly: true },
      { name: 'resumen', type: 'String', visibility: '+', isReadOnly: true }
    ],
    defaultMethods: [
      { name: 'aCadena', returnType: 'String', visibility: '+', isQuery: true }
    ]
  },
  {
    id: 'uml-component',
    name: 'Componente / Subsistema',
    stereotype: 'Component',
    description: 'Unidad modular de funcionalidad empaquetada con puertos e interfaces',
    umlNotation: '«Component»',
    badge: '«Component»',
    color: '#e8c39e',
    bgGradient: '#2f2c79',
    borderAccent: '#2f2c79',
    defaultAttributes: [
      { name: 'modulo', type: 'String', visibility: '+' }
    ],
    defaultMethods: [
      { name: 'iniciar', returnType: 'void', visibility: '+' },
      { name: 'detener', returnType: 'void', visibility: '+' }
    ]
  },
  {
    id: 'uml-note',
    name: 'Nota / Restricción',
    stereotype: 'Note',
    description: 'Anotación textual o restricción OCL con esquina doblada',
    umlNotation: 'Note',
    badge: 'Nota',
    color: '#e8c39e',
    bgGradient: '#2f2c79',
    borderAccent: '#2f2c79',
    isNote: true,
    defaultAttributes: [],
    defaultMethods: [],
    defaultNoteText: 'Restricción UML 2.5:\nTodos los métodos de negocio deben validar invariantes antes de persistir.'
  },
  {
    id: 'uml-template',
    name: 'Clase Genérica [T]',
    stereotype: 'Template',
    description: 'Clase parametrizada con tipos genéricos [T, K] en la esquina superior derecha',
    umlNotation: 'Class<T>',
    badge: '[ T ]',
    color: '#e8c39e',
    bgGradient: '#2f2c79',
    borderAccent: '#2f2c79',
    templateParams: 'T',
    defaultAttributes: [
      { name: 'elementos', type: 'List<T>', visibility: '-' },
      { name: 'capacidad', type: 'Integer', visibility: '-' }
    ],
    defaultMethods: [
      { name: 'agregar', returnType: 'void', visibility: '+', parameters: 'T item' },
      { name: 'obtener', returnType: 'T', visibility: '+', parameters: 'Integer indice', isQuery: true }
    ]
  },
  {
    id: 'uml-package',
    name: 'Paquete / Módulo',
    stereotype: 'Package',
    description: 'Espacio de nombres jerárquico o módulo con pestaña superior tipo carpeta',
    umlNotation: 'package',
    badge: '«package»',
    color: '#e8c39e',
    bgGradient: '#2f2c79',
    borderAccent: '#2f2c79',
    defaultAttributes: [
      { name: 'version', type: 'String', visibility: '+', isReadOnly: true, defaultValue: '"1.0.0"' }
    ],
    defaultMethods: [
      { name: 'inicializarModulo', returnType: 'void', visibility: '+' }
    ]
  },
  {
    id: 'uml-instance',
    name: 'Objeto / Instancia',
    stereotype: 'Instance',
    description: 'Especificación de instancia en ejecución con nombre y tipo subrayados',
    umlNotation: '<u>obj:Clase</u>',
    badge: '<u>Instancia</u>',
    color: '#e8c39e',
    bgGradient: '#2f2c79',
    borderAccent: '#2f2c79',
    isInstance: true,
    defaultAttributes: [
      { name: 'id', type: 'Long', visibility: '-', defaultValue: '1001', isReadOnly: true },
      { name: 'estado', type: 'String', visibility: '-', defaultValue: '"ACTIVO"' }
    ],
    defaultMethods: [
      { name: 'ejecutar', returnType: 'void', visibility: '+' }
    ]
  },
  {
    id: 'uml-datatype',
    name: 'Tipo de Dato («dataType»)',
    stereotype: 'DataType',
    description: 'Clasificador de valor sin identidad independiente de ciclo de vida',
    umlNotation: '«dataType»',
    badge: '«dataType»',
    color: '#e8c39e',
    bgGradient: '#2f2c79',
    borderAccent: '#2f2c79',
    defaultAttributes: [
      { name: 'calle', type: 'String', visibility: '+' },
      { name: 'ciudad', type: 'String', visibility: '+' },
      { name: 'codigoPostal', type: 'String', visibility: '+' }
    ],
    defaultMethods: [
      { name: 'formatearDireccion', returnType: 'String', visibility: '+', isQuery: true }
    ]
  },
  {
    id: 'uml-primitive',
    name: 'Tipo Primitivo («primitive»)',
    stereotype: 'Primitive',
    description: 'Tipo de dato atómico elemental sin compartimentos internos (int, String, etc.)',
    umlNotation: '«primitive»',
    badge: '«primitive»',
    color: '#e8c39e',
    bgGradient: '#2f2c79',
    borderAccent: '#2f2c79',
    defaultAttributes: [],
    defaultMethods: []
  },
  {
    id: 'uml-signal',
    name: 'Señal / Evento («signal»)',
    stereotype: 'Signal',
    description: 'Evento de comunicación o mensaje asíncrono emitido en el dominio',
    umlNotation: '«signal»',
    badge: '«signal»',
    color: '#e8c39e',
    bgGradient: '#2f2c79',
    borderAccent: '#2f2c79',
    defaultAttributes: [
      { name: 'ocurridoEn', type: 'LocalDateTime', visibility: '+', isReadOnly: true },
      { name: 'origenEvento', type: 'String', visibility: '+', isReadOnly: true }
    ],
    defaultMethods: []
  },
  {
    id: 'uml-association-class',
    name: 'Clase de Asociación',
    stereotype: 'AssociationClass',
    description: 'Asociación que posee atributos y operaciones propias entre dos entidades',
    umlNotation: 'AssocClass',
    badge: '«assocClass»',
    color: '#e8c39e',
    bgGradient: '#2f2c79',
    borderAccent: '#2f2c79',
    defaultAttributes: [
      { name: 'fechaAsignacion', type: 'LocalDate', visibility: '-' },
      { name: 'rolAsignado', type: 'String', visibility: '-' },
      { name: 'antiguedad', type: 'Integer', visibility: '-', isDerived: true }
    ],
    defaultMethods: [
      { name: 'calcularDiasActivo', returnType: 'Integer', visibility: '+', isQuery: true }
    ]
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. CATÁLOGO DE RELACIONES Y CONECTORES (UML 2.5 STANDARD)
// ─────────────────────────────────────────────────────────────────────────────

export const RELACIONES_UML_25: DefRelacionUml[] = [
  {
    id: 'rel-assoc-1-1',
    name: 'Asociación Simple',
    type: 'ASSOCIATION_1_1',
    symbol: '1 ─── 1',
    lineStyle: 'solid',
    arrowNotation: 'Línea continua sin flecha o bidireccional',
    multiplicityHint: '1 a 1',
    description: 'Vínculo estructural simétrico directo entre dos instancias',
    color: '#e8c39e'
  },
  {
    id: 'rel-assoc-1-n',
    name: 'Asociación Dirigida',
    type: 'ASSOCIATION_1_N',
    symbol: '1 ───> *',
    lineStyle: 'solid',
    arrowNotation: 'Línea continua con flecha abierta',
    multiplicityHint: '1 a Mucho (0..*)',
    description: 'Navegabilidad unidireccional de origen a destino',
    color: '#e8c39e'
  },
  {
    id: 'rel-assoc-n-m',
    name: 'Asociación N a M',
    type: 'ASSOCIATION_N_M',
    symbol: '* ─── *',
    lineStyle: 'solid',
    arrowNotation: 'Línea continua cardinalidad múltiple',
    multiplicityHint: 'Muchos a Muchos (*..*)',
    description: 'Relación bidireccional de cardinalidad múltiple',
    color: '#e8c39e'
  },
  {
    id: 'rel-assoc-binary',
    name: 'Asociación Binaria Plana',
    type: 'ASSOCIATION_BINARY',
    symbol: '─────',
    lineStyle: 'solid',
    arrowNotation: 'Línea continua sin extremos de flecha',
    multiplicityHint: 'Vínculo simétrico',
    description: 'Asociación básica y simétrica no dirigida entre dos clasificadores',
    color: '#e8c39e'
  },
  {
    id: 'rel-aggregation',
    name: 'Agregación',
    type: 'AGGREGATION',
    symbol: '◇─────',
    lineStyle: 'solid',
    arrowNotation: 'Rombo hueco en el extremo propietario',
    multiplicityHint: '1 a 0..*',
    description: 'Relación "tiene un" débil; el ciclo de vida de la parte es independiente',
    color: '#e8c39e'
  },
  {
    id: 'rel-composition',
    name: 'Composición',
    type: 'COMPOSITION',
    symbol: '◆─────',
    lineStyle: 'solid',
    arrowNotation: 'Rombo sólido relleno en el extremo contenedor',
    multiplicityHint: '1 a 1..*',
    description: 'Relación "parte-todo" estricta; la parte no subsiste sin el contenedor',
    color: '#e8c39e'
  },
  {
    id: 'rel-inheritance',
    name: 'Generalización / Herencia',
    type: 'INHERITANCE',
    symbol: '──────▷',
    lineStyle: 'solid',
    arrowNotation: 'Línea sólida con triángulo cerrado hueco en la clase padre',
    multiplicityHint: 'Subtipo es-un',
    description: 'Especialización o derivación de clase base (extends)',
    color: '#e8c39e'
  },
  {
    id: 'rel-realization',
    name: 'Realización / Impl.',
    type: 'REALIZATION',
    symbol: '- - - -▷',
    lineStyle: 'dashed',
    arrowNotation: 'Línea punteada con triángulo hueco en la interfaz',
    multiplicityHint: 'Contrato implements',
    description: 'Una clase concreta implementa las operaciones de una interfaz',
    color: '#e8c39e'
  },
  {
    id: 'rel-dependency',
    name: 'Dependencia («use»)',
    type: 'DEPENDENCY',
    symbol: '- - - ->',
    lineStyle: 'dashed',
    arrowNotation: 'Línea punteada con flecha abierta en el componente requerido',
    multiplicityHint: 'Invocación / Uso',
    description: 'Relación temporal de uso o llamada entre capas o servicios',
    color: '#e8c39e'
  },
  {
    id: 'rel-usage',
    name: 'Uso («use»)',
    type: 'USAGE',
    symbol: '- - - ->',
    lineStyle: 'dashed',
    arrowNotation: 'Línea punteada etiquetada «use»',
    multiplicityHint: '«use»',
    description: 'Dependencia de uso en que un elemento requiere a otro para su función completa',
    color: '#e8c39e'
  },
  {
    id: 'rel-pkg-import',
    name: 'Importación («import»)',
    type: 'PACKAGE_IMPORT',
    symbol: '- · - ->',
    lineStyle: 'dashed',
    arrowNotation: 'Línea discontinua con flecha «import»',
    multiplicityHint: '«import»',
    description: 'Adiciona el contenido de un espacio de nombres a otro paquete',
    color: '#e8c39e'
  },
  {
    id: 'rel-non-navigable',
    name: 'No Navegable (✕)',
    type: 'NON_NAVIGABLE',
    symbol: '───✕',
    lineStyle: 'solid',
    arrowNotation: 'Línea con cruz ✕ que prohíbe explícitamente el recorrido',
    multiplicityHint: 'Prohibido (✕)',
    description: 'Declara formalmente que el extremo de la asociación no puede ser navegado',
    color: '#e8c39e'
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// 3. CATÁLOGO DE PATRONES ARQUITECTÓNICOS ACELERADORES (1 CLIC)
// ─────────────────────────────────────────────────────────────────────────────

export const PATRONES_UML_25: DefPatronUml[] = [
  {
    id: 'patron-clean-arch',
    name: 'Tríada Clean Architecture',
    category: 'Arquitectura',
    badge: '4 Capas',
    color: '#2f2c79',
    description: 'Controller REST + Service + Repository + Entity interconectados',
    classesCount: 4,
    relationsCount: 3,
    builder: (center) => {
      const ts = Date.now();
      const ctrlId = `c-ctrl-${ts}`;
      const srvId = `c-srv-${ts}`;
      const repoId = `c-repo-${ts}`;
      const entId = `c-ent-${ts}`;

      const classes: ClaseUml[] = [
        {
          id: ctrlId,
          name: 'OrderController',
          stereotype: 'Controller',
          position: { x: center.x - 380, y: center.y - 120 },
          attributes: [{ id: `a1-${ts}`, name: 'service', type: 'String', visibility: '-' }],
          methods: [
            { id: `m1-${ts}`, name: 'createOrder', returnType: 'ResponseEntity', visibility: '+', parameters: 'OrderDto' },
            { id: `m2-${ts}`, name: 'getOrder', returnType: 'ResponseEntity', visibility: '+', parameters: 'Long' }
          ]
        },
        {
          id: srvId,
          name: 'OrderService',
          stereotype: 'Service',
          position: { x: center.x - 380, y: center.y + 160 },
          attributes: [{ id: `a2-${ts}`, name: 'repository', type: 'String', visibility: '-' }],
          methods: [
            { id: `m3-${ts}`, name: 'processOrder', returnType: 'Order', visibility: '+', parameters: 'OrderDto' },
            { id: `m4-${ts}`, name: 'validateStock', returnType: 'Boolean', visibility: '+', parameters: 'Long' }
          ]
        },
        {
          id: repoId,
          name: 'OrderRepository',
          stereotype: 'Repository',
          position: { x: center.x + 80, y: center.y + 160 },
          attributes: [{ id: `a3-${ts}`, name: 'dataSource', type: 'String', visibility: '-' }],
          methods: [
            { id: `m5-${ts}`, name: 'findByCustomer', returnType: 'List<Order>', visibility: '+', parameters: 'Long' },
            { id: `m6-${ts}`, name: 'save', returnType: 'Order', visibility: '+', parameters: 'Order' }
          ]
        },
        {
          id: entId,
          name: 'Order',
          stereotype: 'Entity',
          position: { x: center.x + 80, y: center.y - 120 },
          attributes: [
            { id: `a4-${ts}`, name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: `a5-${ts}`, name: 'totalAmount', type: 'Double', visibility: '-' },
            { id: `a6-${ts}`, name: 'status', type: 'String', visibility: '-' }
          ],
          methods: [
            { id: `m7-${ts}`, name: 'calculateTotal', returnType: 'Double', visibility: '+' }
          ]
        }
      ];

      const relations = [
        {
          id: `r-ctrl-srv-${ts}`,
          sourceClassId: ctrlId,
          targetClassId: srvId,
          type: 'DEPENDENCY' as TipoRelacion,
          sourceMultiplicity: '1',
          targetMultiplicity: '1',
          label: '«use»'
        },
        {
          id: `r-srv-repo-${ts}`,
          sourceClassId: srvId,
          targetClassId: repoId,
          type: 'DEPENDENCY' as TipoRelacion,
          sourceMultiplicity: '1',
          targetMultiplicity: '1',
          label: '«use»'
        },
        {
          id: `r-repo-ent-${ts}`,
          sourceClassId: repoId,
          targetClassId: entId,
          type: 'COMPOSITION' as TipoRelacion,
          sourceMultiplicity: '1',
          targetMultiplicity: '0..*',
          label: 'administra'
        }
      ];

      return { classes, relations };
    }
  },
  {
    id: 'patron-master-detail',
    name: 'Maestro - Detalle (1:N)',
    category: 'Diseño de Dominio',
    badge: 'Composición',
    color: '#4a4891',
    description: 'Entidad raíz (Factura) con composición estricta hacia DetalleFactura',
    classesCount: 2,
    relationsCount: 1,
    builder: (center) => {
      const ts = Date.now();
      const masterId = `c-inv-${ts}`;
      const detailId = `c-invitem-${ts}`;

      const classes: ClaseUml[] = [
        {
          id: masterId,
          name: 'Factura',
          stereotype: 'Entity',
          position: { x: center.x - 220, y: center.y },
          attributes: [
            { id: `a1-${ts}`, name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: `a2-${ts}`, name: 'numeroFactura', type: 'String', visibility: '-' },
            { id: `a3-${ts}`, name: 'fechaEmision', type: 'LocalDate', visibility: '-' },
            { id: `a4-${ts}`, name: 'total', type: 'Double', visibility: '-' }
          ],
          methods: [
            { id: `m1-${ts}`, name: 'calcularTotal', returnType: 'Double', visibility: '+' }
          ]
        },
        {
          id: detailId,
          name: 'DetalleFactura',
          stereotype: 'Entity',
          position: { x: center.x + 180, y: center.y },
          attributes: [
            { id: `b1-${ts}`, name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: `b2-${ts}`, name: 'descripcion', type: 'String', visibility: '-' },
            { id: `b3-${ts}`, name: 'cantidad', type: 'Integer', visibility: '-' },
            { id: `b4-${ts}`, name: 'precioUnitario', type: 'Double', visibility: '-' },
            { id: `b5-${ts}`, name: 'subtotal', type: 'Double', visibility: '-' }
          ],
          methods: [
            { id: `m2-${ts}`, name: 'calcularSubtotal', returnType: 'Double', visibility: '+' }
          ]
        }
      ];

      const relations = [
        {
          id: `r-master-det-${ts}`,
          sourceClassId: masterId,
          targetClassId: detailId,
          type: 'COMPOSITION' as TipoRelacion,
          sourceMultiplicity: '1',
          targetMultiplicity: '1..*',
          label: 'compone'
        }
      ];

      return { classes, relations };
    }
  },
  {
    id: 'patron-interface-impl',
    name: 'Interfaz e Implementación',
    category: 'Diseño OO',
    badge: 'Realización',
    color: '#8892b0',
    description: '«Interface» IUsuarioService realizada (- - -▷) por UsuarioServiceImpl',
    classesCount: 2,
    relationsCount: 1,
    builder: (center) => {
      const ts = Date.now();
      const ifaceId = `c-iface-${ts}`;
      const implId = `c-impl-${ts}`;

      const classes: ClaseUml[] = [
        {
          id: ifaceId,
          name: 'IUsuarioService',
          stereotype: 'Interface',
          isInterface: true,
          position: { x: center.x - 20, y: center.y - 140 },
          attributes: [],
          methods: [
            { id: `m1-${ts}`, name: 'registrarUsuario', returnType: 'Usuario', visibility: '+', parameters: 'UsuarioDto' },
            { id: `m2-${ts}`, name: 'autenticar', returnType: 'String', visibility: '+', parameters: 'String, String' }
          ]
        },
        {
          id: implId,
          name: 'UsuarioServiceImpl',
          stereotype: 'Service',
          position: { x: center.x - 20, y: center.y + 120 },
          attributes: [
            { id: `a1-${ts}`, name: 'usuarioRepository', type: 'String', visibility: '-' }
          ],
          methods: [
            { id: `m3-${ts}`, name: 'registrarUsuario', returnType: 'Usuario', visibility: '+', parameters: 'UsuarioDto' },
            { id: `m4-${ts}`, name: 'autenticar', returnType: 'String', visibility: '+', parameters: 'String, String' }
          ]
        }
      ];

      const relations = [
        {
          id: `r-iface-impl-${ts}`,
          sourceClassId: implId,
          targetClassId: ifaceId,
          type: 'REALIZATION' as TipoRelacion,
          sourceMultiplicity: '',
          targetMultiplicity: '',
          label: 'implementa'
        }
      ];

      return { classes, relations };
    }
  },
  {
    id: 'patron-polymorphic-inheritance',
    name: 'Herencia Polimórfica',
    category: 'Diseño OO',
    badge: 'Generalización',
    color: '#5c688c',
    description: 'Clase abstracta base Persona con subclases Cliente y Empleado (──▷)',
    classesCount: 3,
    relationsCount: 2,
    builder: (center) => {
      const ts = Date.now();
      const baseId = `c-base-${ts}`;
      const subAId = `c-suba-${ts}`;
      const subBId = `c-subb-${ts}`;

      const classes: ClaseUml[] = [
        {
          id: baseId,
          name: 'Persona',
          stereotype: 'Abstract',
          isAbstract: true,
          position: { x: center.x - 20, y: center.y - 140 },
          attributes: [
            { id: `p1-${ts}`, name: 'id', type: 'Long', visibility: '#', isPrimaryKey: true },
            { id: `p2-${ts}`, name: 'nombreCompleto', type: 'String', visibility: '#' },
            { id: `p3-${ts}`, name: 'correoElectronico', type: 'String', visibility: '#' }
          ],
          methods: [
            { id: `pm1-${ts}`, name: 'obtenerRol', returnType: 'String', visibility: '+' }
          ]
        },
        {
          id: subAId,
          name: 'Cliente',
          stereotype: 'Entity',
          position: { x: center.x - 240, y: center.y + 140 },
          attributes: [
            { id: `c1-${ts}`, name: 'limiteCredito', type: 'Double', visibility: '-' }
          ],
          methods: [
            { id: `cm1-${ts}`, name: 'solicitarCredito', returnType: 'Boolean', visibility: '+', parameters: 'Double' }
          ]
        },
        {
          id: subBId,
          name: 'Empleado',
          stereotype: 'Entity',
          position: { x: center.x + 200, y: center.y + 140 },
          attributes: [
            { id: `e1-${ts}`, name: 'salarioBase', type: 'Double', visibility: '-' },
            { id: `e2-${ts}`, name: 'cargo', type: 'String', visibility: '-' }
          ],
          methods: [
            { id: `em1-${ts}`, name: 'calcularBono', returnType: 'Double', visibility: '+' }
          ]
        }
      ];

      const relations = [
        {
          id: `r-suba-base-${ts}`,
          sourceClassId: subAId,
          targetClassId: baseId,
          type: 'INHERITANCE' as TipoRelacion,
          sourceMultiplicity: '',
          targetMultiplicity: '',
          label: 'extiende'
        },
        {
          id: `r-subb-base-${ts}`,
          sourceClassId: subBId,
          targetClassId: baseId,
          type: 'INHERITANCE' as TipoRelacion,
          sourceMultiplicity: '',
          targetMultiplicity: '',
          label: 'extiende'
        }
      ];

      return { classes, relations };
    }
  },
  {
    id: 'patron-entity-enum',
    name: 'Entidad con Enum de Estado',
    category: 'Dominio',
    badge: 'Asociación',
    color: '#e8c39e',
    description: 'Entidad de negocio asociada a una Enumeración tipada de estados',
    classesCount: 2,
    relationsCount: 1,
    builder: (center) => {
      const ts = Date.now();
      const entId = `c-ped-${ts}`;
      const enumId = `c-estped-${ts}`;

      const classes: ClaseUml[] = [
        {
          id: entId,
          name: 'Pedido',
          stereotype: 'Entity',
          position: { x: center.x - 200, y: center.y },
          attributes: [
            { id: `p1-${ts}`, name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: `p2-${ts}`, name: 'codigoSeguimiento', type: 'String', visibility: '-' },
            { id: `p3-${ts}`, name: 'montoTotal', type: 'Double', visibility: '-' }
          ],
          methods: [
            { id: `m1-${ts}`, name: 'transicionarEstado', returnType: 'void', visibility: '+', parameters: 'EstadoPedido' }
          ]
        },
        {
          id: enumId,
          name: 'EstadoPedido',
          stereotype: 'Enum',
          position: { x: center.x + 180, y: center.y },
          attributes: [
            { id: `e1-${ts}`, name: 'CREADO', type: 'String', visibility: '+' },
            { id: `e2-${ts}`, name: 'PAGADO', type: 'String', visibility: '+' },
            { id: `e3-${ts}`, name: 'EN_ENVIO', type: 'String', visibility: '+' },
            { id: `e4-${ts}`, name: 'ENTREGADO', type: 'String', visibility: '+' },
            { id: `e5-${ts}`, name: 'CANCELADO', type: 'String', visibility: '+' }
          ],
          methods: [
            { id: `em1-${ts}`, name: 'esTerminal', returnType: 'Boolean', visibility: '+' }
          ]
        }
      ];

      const relations = [
        {
          id: `r-ped-enum-${ts}`,
          sourceClassId: entId,
          targetClassId: enumId,
          type: 'ASSOCIATION_1_1' as TipoRelacion,
          sourceMultiplicity: '1',
          targetMultiplicity: '1',
          label: 'estado'
        }
      ];

      return { classes, relations };
    }
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// PROPS DEL COMPONENTE TOOLBOX UML 2.5+
// ─────────────────────────────────────────────────────────────────────────────

interface ToolboxUml25Props {
  onInsertClassifier: (def: DefClasificadorUml) => void;
  onActivateRelationMode: (relType: TipoRelacion) => void;
  onInsertPattern: (patron: DefPatronUml) => void;
  isRelationModeActive?: boolean;
  activeRelationType?: TipoRelacion | null;
  onCancelRelationMode?: () => void;
  onMouseEnterToolbox?: () => void;
  onMouseLeaveToolbox?: () => void;
}

export const ToolboxUml25: React.FC<ToolboxUml25Props> = ({
  onInsertClassifier,
  onActivateRelationMode,
  onInsertPattern,
  isRelationModeActive = false,
  activeRelationType = null,
  onCancelRelationMode,
  onMouseEnterToolbox,
  onMouseLeaveToolbox
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'todos' | 'clasificadores' | 'relaciones' | 'patrones'>('todos');

  // Filtrado reactivo en tiempo real
  const filteredClassifiers = useMemo(() => {
    if (!searchTerm.trim()) return CLASIFICADORES_UML_25;
    const term = searchTerm.toLowerCase();
    return CLASIFICADORES_UML_25.filter(c => 
      c.name.toLowerCase().includes(term) ||
      c.stereotype.toLowerCase().includes(term) ||
      c.description.toLowerCase().includes(term) ||
      c.badge.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const filteredRelations = useMemo(() => {
    if (!searchTerm.trim()) return RELACIONES_UML_25;
    const term = searchTerm.toLowerCase();
    return RELACIONES_UML_25.filter(r => 
      r.name.toLowerCase().includes(term) ||
      r.type.toLowerCase().includes(term) ||
      r.description.toLowerCase().includes(term) ||
      r.symbol.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const filteredPatterns = useMemo(() => {
    if (!searchTerm.trim()) return PATRONES_UML_25;
    const term = searchTerm.toLowerCase();
    return PATRONES_UML_25.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      p.badge.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  // Manejador Drag Start para transferir la especificación al lienzo
  const handleDragStart = (e: React.DragEvent, type: 'classifier' | 'pattern', item: any) => {
    e.dataTransfer.setData('application/archai-toolbox', JSON.stringify({ type, item }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Render para estado minimizado
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="glass-toolbox-minimized-trigger"
        title="Desplegar Toolbox UML 2.5+ (Clasificadores, Conectores y Patrones)"
        style={{
          position: 'absolute',
          top: '70px',
          left: '14px',
          zIndex: 35,
          background: 'var(--glass-topbar-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-topbar-border)',
          borderRadius: '12px',
          padding: '8px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'none',
          boxShadow: 'var(--glass-topbar-shadow)',
          color: 'var(--text-primary)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '6px',
          background: 'linear-gradient(135deg, #171a4a, #2f2c79)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#f5e1ce'
        }}>
          <Box size={14} />
        </div>
        <span style={{ fontSize: '0.76rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
          Toolbox UML 2.5+
        </span>
        <span style={{
          fontSize: '0.62rem',
          fontWeight: 800,
          padding: '1px 5px',
          borderRadius: '4px',
          background: 'rgba(232, 195, 158, 0.18)',
          color: 'var(--text-secondary)',
          border: '1px solid rgba(232, 195, 158, 0.35)'
        }}>
          {CLASIFICADORES_UML_25.length + RELACIONES_UML_25.length}
        </span>
        <ChevronRight size={14} color="var(--text-secondary)" />
      </button>
    );
  }

  return (
    <div
      className="glass-toolbox-panel"
      onWheel={e => e.stopPropagation()}
      onMouseEnter={onMouseEnterToolbox}
      onMouseLeave={onMouseLeaveToolbox}
      style={{
        position: 'absolute',
        top: '70px',
        left: '14px',
        width: '310px',
        maxHeight: 'calc(100vh - 170px)',
        zIndex: 35,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--glass-flyout-bg)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid var(--glass-flyout-border)',
        borderRadius: '16px',
        boxShadow: 'var(--glass-topbar-shadow)',
        overflow: 'hidden',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'none'
      }}
    >
      {/* ── Cabecera de la Toolbox ── */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--glass-flyout-border)',
        background: 'rgba(125, 125, 125, 0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '7px',
            background: '#2f2c79',
            border: '1px solid #2f2c79',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#e8c39e',
            boxShadow: '0 0 10px rgba(0, 0, 32, 0.40)'
          }}>
            <Box size={14} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.84rem',
                fontWeight: 800,
                color: 'var(--text-primary)'
              }}>
                Toolbox UML 2.5+
              </span>
              <span style={{
                fontSize: '0.60rem',
                fontWeight: 800,
                padding: '1px 5px',
                borderRadius: '4px',
                background: '#2f2c79',
                color: '#e8c39e',
                border: '1px solid #2f2c79'
              }}>
                ISO 19505
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.67rem', color: 'var(--text-muted)' }}>
              Arrastra o haz clic para modelar en el lienzo
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'none',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Minimizar Toolbox"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* ── Barra de Búsqueda ── */}
      <div style={{ padding: '8px 10px 4px 10px', flexShrink: 0 }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: 'var(--glass-surface)',
          border: '1px solid var(--glass-border-color)',
          borderRadius: '8px',
          padding: '0 8px'
        }}>
          <Search size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Buscar clasificador o relación..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              padding: '6px 8px',
              fontSize: '0.74rem',
              color: 'var(--text-primary)'
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'none',
                padding: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ── Pestañas de Categoría ── */}
      <div style={{
        display: 'flex',
        padding: '6px 10px',
        gap: '4px',
        borderBottom: '1px solid var(--glass-flyout-border)',
        flexShrink: 0
      }}>
        {[
          { key: 'todos' as const, label: 'Todos' },
          { key: 'clasificadores' as const, label: 'Clasificadores' },
          { key: 'relaciones' as const, label: 'Relaciones' },
          { key: 'patrones' as const, label: 'Patrones' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              padding: '4px 2px',
              fontSize: '0.67rem',
              fontWeight: 700,
              borderRadius: '6px',
              border: 'none',
              background: activeTab === tab.key ? '#e8c39e' : 'transparent',
              color: activeTab === tab.key ? '#000020' : 'var(--text-primary)',
              cursor: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Banner de Guía Rápida Intuitiva UML 2.5+ ── */}
      <div style={{
        padding: '6px 10px',
        background: 'rgba(232, 195, 158, 0.20)',
        borderBottom: '1px solid rgba(232, 195, 158, 0.45)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.66rem',
        color: 'var(--text-secondary)',
        flexShrink: 0
      }}>
        <span style={{ fontSize: '0.82rem' }}>💡</span>
        <span>Haz clic en <strong>+</strong> o arrastra al lienzo para modelar</span>
      </div>

      {/* ── Banner de Modo Relación Activo ── */}
      {isRelationModeActive && (
        <div style={{
          padding: '6px 10px',
          background: 'rgba(232, 195, 158, 0.25)',
          borderBottom: '1px solid rgba(232, 195, 158, 0.50)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.68rem',
          color: 'var(--text-secondary)',
          fontWeight: 700,
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Link2 size={12} />
            <span>Conectando: {activeRelationType}</span>
          </div>
          {onCancelRelationMode && (
            <button
              onClick={onCancelRelationMode}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'none',
                padding: '2px'
              }}
              title="Cancelar conexión"
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}

      {/* ── Contenido con Scroll de Componentes ── */}
      <div
        onWheel={e => { e.stopPropagation(); }}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          cursor: 'none'
        }}
      >
        {/* SECCIÓN: CLASIFICADORES ESTRUCTURALES */}
        {(activeTab === 'todos' || activeTab === 'clasificadores') && filteredClassifiers.length > 0 && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '6px'
            }}>
              <span style={{
                fontSize: '0.64rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--text-muted)'
              }}>
                Clasificadores UML ({filteredClassifiers.length})
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {filteredClassifiers.map(c => (
                <div
                  key={c.id}
                  draggable
                  onDragStart={e => handleDragStart(e, 'classifier', c)}
                  onClick={() => onInsertClassifier(c)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    background: 'var(--glass-surface)',
                    border: '1px solid var(--glass-border-color)',
                    cursor: 'none',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--glass-surface-hover)';
                    e.currentTarget.style.borderColor = c.color;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--glass-surface)';
                    e.currentTarget.style.borderColor = 'var(--glass-border-color)';
                  }}
                  title={`Clic para insertar en el centro o arrastra al lienzo.\n${c.description}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '5px',
                      background: c.bgGradient,
                      border: `1px solid ${c.borderAccent}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: c.color,
                      flexShrink: 0
                    }}>
                      {c.isInterface ? (
                        <CircleDot size={12} />
                      ) : c.isAbstract ? (
                        <Code2 size={12} />
                      ) : c.stereotype === 'Entity' ? (
                        <Database size={12} />
                      ) : c.stereotype === 'Service' ? (
                        <Layers size={12} />
                      ) : c.stereotype === 'Controller' ? (
                        <FileCode size={12} />
                      ) : c.stereotype === 'Repository' ? (
                        <Server size={12} />
                      ) : c.stereotype === 'Enum' ? (
                        <ListFilter size={12} />
                      ) : c.stereotype === 'DTO' ? (
                        <PackageOpen size={12} />
                      ) : c.stereotype === 'Component' ? (
                        <ComponentIcon size={12} />
                      ) : c.stereotype === 'Package' ? (
                        <FolderOpen size={12} />
                      ) : c.stereotype === 'Template' ? (
                        <Code2 size={12} />
                      ) : c.stereotype === 'Instance' ? (
                        <CircleDot size={12} />
                      ) : c.stereotype === 'DataType' ? (
                        <Boxes size={12} />
                      ) : c.stereotype === 'Primitive' ? (
                        <Hash size={12} />
                      ) : c.stereotype === 'Signal' ? (
                        <Zap size={12} />
                      ) : c.stereotype === 'AssociationClass' ? (
                        <Link2 size={12} />
                      ) : c.isNote ? (
                        <StickyNote size={12} />
                      ) : (
                        <Box size={12} />
                      )}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        fontStyle: (c.isInterface || c.isAbstract) ? 'italic' : 'normal',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {c.name}
                      </div>
                      <div style={{
                        fontSize: '0.64rem',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {c.description}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <span style={{
                      fontSize: '0.58rem',
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: c.bgGradient,
                      color: c.color,
                      border: `1px solid ${c.borderAccent}55`
                    }}>
                      {c.badge}
                    </span>
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        background: 'var(--glass-surface)',
                        border: '1px solid var(--glass-border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary)'
                      }}
                      title="Insertar en el lienzo con 1 clic"
                    >
                      <Plus size={11} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECCIÓN: RELACIONES Y CONECTORES */}
        {(activeTab === 'todos' || activeTab === 'relaciones') && filteredRelations.length > 0 && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '6px'
            }}>
              <span style={{
                fontSize: '0.64rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--text-muted)'
              }}>
                Conectores y Relaciones ({filteredRelations.length})
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {filteredRelations.map(r => {
                const isActive = activeRelationType === r.type && isRelationModeActive;
                return (
                  <button
                    key={r.id}
                    onClick={() => onActivateRelationMode(r.type)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      borderRadius: '8px',
                      background: isActive ? 'rgba(232, 195, 158, 0.20)' : 'var(--glass-surface)',
                      border: isActive ? '1px solid #e8c39e' : '1px solid var(--glass-border-color)',
                      cursor: 'none',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--glass-surface-hover)';
                        e.currentTarget.style.borderColor = '#e8c39e';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--glass-surface)';
                        e.currentTarget.style.borderColor = 'var(--glass-border-color)';
                      }
                    }}
                    title={`${r.description}\nNotación: ${r.arrowNotation}\nMultiplicidad: ${r.multiplicityHint}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        color: '#e8c39e',
                        minWidth: '52px'
                      }}>
                        {r.symbol}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {r.name}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.multiplicityHint}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <span style={{
                        fontSize: '0.58rem',
                        fontWeight: 800,
                        padding: '1px 4px',
                        borderRadius: '4px',
                        background: '#2f2c79',
                        color: '#e8c39e',
                        border: '1px solid #2f2c79'
                      }}>
                        {r.lineStyle === 'dashed' ? 'Punteada' : 'Sólida'}
                      </span>
                      <Link2 size={12} color={isActive ? '#e8c39e' : 'var(--text-muted)'} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SECCIÓN: PATRONES ARQUITECTÓNICOS */}
        {(activeTab === 'todos' || activeTab === 'patrones') && filteredPatterns.length > 0 && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '6px'
            }}>
              <span style={{
                fontSize: '0.64rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--text-muted)'
              }}>
                Patrones y Presets 1 Clic ({filteredPatterns.length})
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filteredPatterns.map(p => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={e => handleDragStart(e, 'pattern', p)}
                  onClick={() => onInsertPattern(p)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '10px',
                    background: 'var(--glass-surface)',
                    border: '1px solid var(--glass-border-color)',
                    cursor: 'none',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--glass-surface-hover)';
                    e.currentTarget.style.borderColor = p.color;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--glass-surface)';
                    e.currentTarget.style.borderColor = 'var(--glass-border-color)';
                  }}
                  title={`Insertar patrón ${p.name} en el lienzo (${p.classesCount} clases, ${p.relationsCount} relaciones)`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {p.name}
                    </span>
                    <span style={{
                      fontSize: '0.60rem',
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: `${p.color}22`,
                      color: p.color,
                      border: `1px solid ${p.color}55`
                    }}>
                      {p.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginBottom: '4px', lineHeight: '1.3' }}>
                    {p.description}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-subtle)' }}>
                    <span>{p.classesCount} Clases · {p.relationsCount} Relación(es)</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--accent-primary)', fontWeight: 700 }}>
                      <Zap size={11} /> + Insertar
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mensaje de Sin Resultados */}
        {filteredClassifiers.length === 0 && filteredRelations.length === 0 && filteredPatterns.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '24px 12px',
            color: 'var(--text-muted)',
            fontSize: '0.74rem'
          }}>
            No se encontraron elementos UML para "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
};
