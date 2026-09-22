export type GenerationTab = 'springboot' | 'postgres' | 'postman' | 'xmi';

export interface GeneratedFile {
  filename: string;
  path: string;
  language: 'java' | 'sql' | 'json' | 'xml';
  content: string;
}

export interface GeneratedProject {
  projectName: string;
  files: GeneratedFile[];
  ddlSql: string;
  postmanJson: string;
  xmiXml: string;
}

/** CU-10..CU-14 · Entrada del historial de generaciones registrada por el backend. */
export interface GeneracionHistorial {
  id: string;
  tipo: 'SPRING_BOOT' | 'DDL' | 'POSTMAN' | 'XMI' | 'ZIP' | string;
  tituloDiagrama: string;
  nombreArchivo?: string;
  tamanoBytes?: number;
  usuarioId?: string;
  fechaCreacion: string;
}
