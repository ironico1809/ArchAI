import { ClaseUml, ModeloDiagrama, RelacionUml } from '../types/uml';

export interface DetalleMadurezClase {
  tienePk: boolean;
  tieneAtributos: boolean;
  tieneMetodos: boolean;
  tieneRelaciones: boolean;
  tieneApi: boolean;
}

export interface ResultadoMadurezClase {
  claseId: string;
  nombreClase: string;
  porcentaje: number;
  nivel: 'inicial' | 'en_progreso' | 'avanzado' | 'completo';
  color: string;
  detalles: DetalleMadurezClase;
  sugerencias: string[];
}

export interface ResultadoMadurezProyecto {
  porcentajeGlobal: number;
  totalClases: number;
  clasesCompletas: number;
  clasesEnProgreso: number;
  clasesIniciales: number;
  porClase: Record<string, ResultadoMadurezClase>;
  alertasArquitectura: string[];
  recomendaciones: string[];
}

/**
 * Calcula la madurez de una clase individual en base a criterios de ingeniería:
 * 1. Persistencia (25%): atributos definidos y clave primaria (PK).
 * 2. Lógica de negocio (25%): al menos un método propio con retorno y/o parámetros.
 * 3. Integridad relacional (25%): conectada con otras entidades del dominio.
 * 4. Exposición de API (25%): arquitectura en capas (Service / Controller correspondiente o atributos tipados).
 */
export function calcularMadurezClase(
  cls: ClaseUml,
  relaciones: RelacionUml[],
  todasLasClases: ClaseUml[]
): ResultadoMadurezClase {
  const tieneAtributos = (cls.attributes || []).length > 0;
  const tienePk = (cls.attributes || []).some(a => a.isPrimaryKey || a.name.toLowerCase() === 'id');
  const tieneMetodos = (cls.methods || []).length > 0;
  
  // Relaciones donde participa como origen o destino
  const tieneRelaciones = relaciones.some(
    r => r.sourceClassId === cls.id || r.targetClassId === cls.id
  );

  // Verificación de API: si es Entity, comprobar si existe Service/Controller asociado en el modelo
  const esEntidad = !cls.stereotype || cls.stereotype === 'Entity';
  let tieneApi = false;

  if (esEntidad) {
    const tieneController = todasLasClases.some(
      c => c.stereotype === 'Controller' && c.name.toLowerCase().includes(cls.name.toLowerCase())
    );
    const tieneService = todasLasClases.some(
      c => c.stereotype === 'Service' && c.name.toLowerCase().includes(cls.name.toLowerCase())
    );
    // Si ya existe controller/service explícito, o si tiene métodos CRUD suficientes
    tieneApi = tieneController || tieneService || tieneMetodos;
  } else {
    // Si es Controller o Service, cumple el rol de API si tiene métodos
    tieneApi = tieneMetodos;
  }

  let puntos = 0;
  const sugerencias: string[] = [];

  // Ponderación de puntos:
  if (tienePk) {
    puntos += 25;
  } else {
    sugerencias.push('Falta definir una Llave Primaria (id PK)');
  }

  if (tieneAtributos) {
    puntos += 15;
  } else {
    sugerencias.push('Agregar campos o atributos a la entidad');
  }

  if (tieneMetodos) {
    puntos += 25;
  } else {
    sugerencias.push('Agregar métodos de negocio (ej: calcular, validar, procesar)');
  }

  if (tieneRelaciones) {
    puntos += 20;
  } else {
    sugerencias.push('Conectar con otras tablas mediante relaciones 1:N o N:M');
  }

  if (tieneApi) {
    puntos += 15;
  }

  // Normalizar a máximo 100
  const porcentaje = Math.min(100, puntos);

  let nivel: ResultadoMadurezClase['nivel'] = 'inicial';
  let color = '#EF4444'; // rojo

  if (porcentaje >= 90) {
    nivel = 'completo';
    color = '#10B981'; // verde esmeralda
  } else if (porcentaje >= 65) {
    nivel = 'avanzado';
    color = '#38BDF8'; // cian brillante
  } else if (porcentaje >= 40) {
    nivel = 'en_progreso';
    color = '#F59E0B'; // ámbar
  }

  return {
    claseId: cls.id,
    nombreClase: cls.name,
    porcentaje,
    nivel,
    color,
    detalles: {
      tienePk,
      tieneAtributos,
      tieneMetodos,
      tieneRelaciones,
      tieneApi
    },
    sugerencias
  };
}

/**
 * Evalúa la madurez global del proyecto en base a todas las clases y relaciones.
 */
export function calcularMadurezProyecto(diagram: ModeloDiagrama): ResultadoMadurezProyecto {
  const clases = diagram.classes || [];
  const relaciones = diagram.relations || [];

  if (clases.length === 0) {
    return {
      porcentajeGlobal: 0,
      totalClases: 0,
      clasesCompletas: 0,
      clasesEnProgreso: 0,
      clasesIniciales: 0,
      porClase: {},
      alertasArquitectura: ['El diagrama no contiene clases definidas todavía.'],
      recomendaciones: ['Crea tu primera clase con "+ Nueva Tabla" o usa una plantilla.']
    };
  }

  const porClase: Record<string, ResultadoMadurezClase> = {};
  let sumaPorcentajes = 0;
  let clasesCompletas = 0;
  let clasesEnProgreso = 0;
  let clasesIniciales = 0;

  clases.forEach(cls => {
    const res = calcularMadurezClase(cls, relaciones, clases);
    porClase[cls.id] = res;
    sumaPorcentajes += res.porcentaje;

    if (res.nivel === 'completo') clasesCompletas++;
    else if (res.nivel === 'avanzado' || res.nivel === 'en_progreso') clasesEnProgreso++;
    else clasesIniciales++;
  });

  const porcentajeGlobal = Math.round(sumaPorcentajes / clases.length);
  const alertasArquitectura: string[] = [];
  const recomendaciones: string[] = [];

  // Verificaciones globales de arquitectura
  const clasesSinPk = clases.filter(c => !porClase[c.id].detalles.tienePk);
  if (clasesSinPk.length > 0) {
    alertasArquitectura.push(
      `${clasesSinPk.length} tabla(s) carecen de clave primaria: ${clasesSinPk.map(c => c.name).join(', ')}`
    );
  }

  const clasesAisladas = clases.filter(c => !porClase[c.id].detalles.tieneRelaciones && clases.length > 1);
  if (clasesAisladas.length > 0) {
    alertasArquitectura.push(
      `${clasesAisladas.length} tabla(s) aisladas sin relaciones foráneas: ${clasesAisladas.map(c => c.name).join(', ')}`
    );
  }

  if (clasesCompletas === clases.length) {
    recomendaciones.push('¡Excelente! Todas las clases cuentan con persistencia, métodos y relaciones completas.');
  } else {
    recomendaciones.push('Agrega métodos de negocio a las clases en progreso para alcanzar el 100% de madurez.');
  }

  return {
    porcentajeGlobal,
    totalClases: clases.length,
    clasesCompletas,
    clasesEnProgreso,
    clasesIniciales,
    porClase,
    alertasArquitectura,
    recomendaciones
  };
}
