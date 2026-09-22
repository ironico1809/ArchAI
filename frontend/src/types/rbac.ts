export type RolEquipo = 
  | 'Arquitecto de Software'
  | 'Líder Técnico'
  | 'Desarrollador Backend'
  | 'Ingeniero Frontend'
  | 'Analista QA'
  | 'Observador';

export interface PermisosUsuario {
  canEditDiagram: boolean;      // Crear, mover y editar clases y atributos
  canConnectRelations: boolean; // Crear y modificar relaciones
  canGenerateCode: boolean;     // Previsualizar y descargar Spring Boot, SQL, Postman y ZIP
  canUseAi: boolean;            // Usar Asistente de Voz, prompts y Agente Contextual
  canManageTeam: boolean;       // Cambiar roles y permisos de los miembros
}

export interface MiembroEquipo {
  id: string;
  name: string;
  email: string;
  role: RolEquipo;
  avatarColor: string;
  isHost: boolean;
  permissions: PermisosUsuario;
}

export const PERMISOS_POR_DEFECTO_ROL: Record<RolEquipo, PermisosUsuario> = {
  'Arquitecto de Software': {
    canEditDiagram: true,
    canConnectRelations: true,
    canGenerateCode: true,
    canUseAi: true,
    canManageTeam: true
  },
  'Líder Técnico': {
    canEditDiagram: true,
    canConnectRelations: true,
    canGenerateCode: true,
    canUseAi: true,
    canManageTeam: true
  },
  'Desarrollador Backend': {
    canEditDiagram: true,
    canConnectRelations: true,
    canGenerateCode: true,
    canUseAi: true,
    canManageTeam: false
  },
  'Ingeniero Frontend': {
    canEditDiagram: false,
    canConnectRelations: false,
    canGenerateCode: true,
    canUseAi: true,
    canManageTeam: false
  },
  'Analista QA': {
    canEditDiagram: false,
    canConnectRelations: false,
    canGenerateCode: true,
    canUseAi: true,
    canManageTeam: false
  },
  'Observador': {
    canEditDiagram: false,
    canConnectRelations: false,
    canGenerateCode: false,
    canUseAi: false,
    canManageTeam: false
  }
};

export function obtenerPermisosRol(rol: RolEquipo): PermisosUsuario {
  return PERMISOS_POR_DEFECTO_ROL[rol] || PERMISOS_POR_DEFECTO_ROL['Desarrollador Backend'];
}
