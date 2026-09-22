export type Visibilidad = '+' | '-' | '#' | '~';

export interface AtributoUml {
  id: string;
  name: string;
  type: 'Long' | 'String' | 'Integer' | 'Double' | 'Boolean' | 'LocalDate' | 'LocalDateTime' | 'BigDecimal' | string;
  visibility: Visibilidad;
  isPrimaryKey?: boolean;
  isNullable?: boolean;
  isStatic?: boolean;     // UML 2.5: Miembro estático (subrayado)
  isDerived?: boolean;    // UML 2.5: Atributo derivado (prefijo '/')
  isReadOnly?: boolean;   // UML 2.5: Inmutable {readOnly}
  multiplicity?: string;  // UML 2.5: [1], [0..1], [*], [1..*]
  defaultValue?: string;  // UML 2.5: = valor
}

export interface MetodoUml {
  id: string;
  name: string;
  returnType: string;
  visibility: Visibilidad;
  parameters?: string;
  isAbstract?: boolean;
  isStatic?: boolean;     // UML 2.5: Método estático (subrayado)
  isQuery?: boolean;      // UML 2.5: Operación de solo lectura {query}
}

export type TipoRelacion = 
  | 'ASSOCIATION_1_1'
  | 'ASSOCIATION_1_N' 
  | 'ASSOCIATION_N_M' 
  | 'ASSOCIATION_BINARY'
  | 'NON_NAVIGABLE'
  | 'COMPOSITION' 
  | 'AGGREGATION' 
  | 'INHERITANCE'
  | 'REALIZATION'
  | 'DEPENDENCY'
  | 'USAGE'
  | 'PACKAGE_IMPORT';

export interface RelacionUml {
  id: string;
  sourceClassId: string;
  targetClassId: string;
  type: TipoRelacion;
  sourceMultiplicity: string; // '1', '0..1', '*'
  targetMultiplicity: string; // '1', '0..*', '*'
  label?: string;
  sourceRole?: string;        // UML 2.5: Rol del extremo origen (ej. +autor)
  targetRole?: string;        // UML 2.5: Rol del extremo destino (ej. +revisor)
}

export type EstereotipoUml = 
  | 'Class'
  | 'Entity' 
  | 'Service' 
  | 'Controller' 
  | 'Repository' 
  | 'Enum'
  | 'Interface'
  | 'Abstract'
  | 'DTO'
  | 'Component'
  | 'Note'
  | 'DataType'
  | 'Primitive'
  | 'Template'
  | 'Package'
  | 'Instance'
  | 'Signal'
  | 'AssociationClass';

export interface ClaseUml {
  id: string;
  name: string;
  stereotype?: EstereotipoUml | string;
  isAbstract?: boolean;
  isInterface?: boolean;
  isInstance?: boolean;       // UML 2.5: Objeto concreto en tiempo de ejecución (subrayado)
  templateParams?: string;    // UML 2.5: Parámetros genéricos [T, K]
  noteText?: string;
  attributes: AtributoUml[];
  methods: MetodoUml[];
  position?: { x: number; y: number };
}

export interface ModeloDiagrama {
  title: string;
  classes: ClaseUml[];
  relations: RelacionUml[];
  updatedAt: string;
}

export type DiagramModel = ModeloDiagrama;

