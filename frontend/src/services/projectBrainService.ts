import { ClaseUml, ModeloDiagrama, MetodoUml } from '../types/uml';
import { calcularMadurezProyecto } from './softwareMaturity';

export interface DiagnosticoCerebro {
  resumenEjecutivo: string;
  puntuacionSalud: number;
  saludGlobal: number;
  nivel: string;
  clasesAnalizadas: number;
  archivosModificados: number;
  metodosSugeridosTotales: number;
  fortalezas: string[];
  alertasCriticas: string[];
  sugerenciasInmediatas: string[];
  sugerenciasAccion: string[];
  metodosSugeridosPorClase: Record<string, MetodoUml[]>;
  endpointsExcluidos: string[];
}

/**
 * Cerebro del Proyecto (Project Brain Engine):
 * Analiza de forma integral el modelo de clases, relaciones, código generado
 * y estado de madurez, generando diagnósticos y recomendaciones con contexto completo.
 */
export function auditarCodigoProyecto(
  diagram: ModeloDiagrama,
  archivosEditados?: Record<string, string>
): DiagnosticoCerebro {
  const madurez = calcularMadurezProyecto(diagram);
  const clases = diagram.classes || [];
  const relaciones = diagram.relations || [];

  const fortalezas: string[] = [];
  const alertasCriticas: string[] = [];
  const sugerenciasInmediatas: string[] = [];
  const metodosSugeridosPorClase: Record<string, MetodoUml[]> = {};
  const endpointsExcluidos: string[] = [];

  // 1. Análisis de Persistencia y Llaves Primarias
  const totalPk = clases.filter(c => (c.attributes || []).some(a => a.isPrimaryKey || a.name.toLowerCase() === 'id')).length;
  if (totalPk === clases.length && clases.length > 0) {
    fortalezas.push(`Todas las entidades (${totalPk}/${clases.length}) cumplen con la normalización de clave primaria (PK).`);
  } else {
    alertasCriticas.push(`${clases.length - totalPk} clase(s) carecen de identificador primario PK para Spring Data JPA.`);
  }

  // 2. Análisis de Lógica de Negocio y Métodos
  clases.forEach(cls => {
    const metodos = cls.methods || [];
    if (metodos.length === 0) {
      // Sugerir métodos según el nombre de la clase
      const sugeridos: MetodoUml[] = generarMetodosSugeridos(cls.name);
      metodosSugeridosPorClase[cls.id] = sugeridos;
      sugerenciasInmediatas.push(
        `Clase '${cls.name}': Agregar lógica de negocio (ej: ${sugeridos.map(m => m.name + '()').join(', ')}).`
      );
    } else {
      fortalezas.push(`'${cls.name}' implementa ${metodos.length} método(s) de lógica de dominio.`);
    }
  });

  // 3. Análisis de Relaciones e Integridad Referencial
  if (relaciones.length > 0) {
    fortalezas.push(`Modelo relacionalmente conectado con ${relaciones.length} asociación(es) activas.`);
  } else if (clases.length > 1) {
    alertasCriticas.push('El diagrama no tiene relaciones definidas entre tablas; los datos quedarán aislados en PostgreSQL.');
  }

  // 4. Análisis de Archivos Editados por el Usuario
  if (archivosEditados && Object.keys(archivosEditados).length > 0) {
    const editadosCount = Object.keys(archivosEditados).length;
    fortalezas.push(`Se han personalizado ${editadosCount} archivo(s) de código Java/SQL con lógica propia del desarrollador.`);
  }

  // Resumen Ejecutivo del Cerebro de Proyecto
  const resumenEjecutivo = `El software '${diagram.title || 'Proyecto ArchAI'}' cuenta con ${clases.length} clases y ${relaciones.length} relaciones. ` +
    `Su índice de madurez arquitectónica es del ${madurez.porcentajeGlobal}%, con ${madurez.clasesCompletas} de ${clases.length} clases listas para producción.`;

  const totalMetodosSugeridos = Object.values(metodosSugeridosPorClase).reduce((acc, m) => acc + m.length, 0);
  const nivelMadurez = madurez.porcentajeGlobal >= 80 ? 'avanzado' : madurez.porcentajeGlobal >= 50 ? 'intermedio' : 'inicial';

  return {
    resumenEjecutivo,
    puntuacionSalud: madurez.porcentajeGlobal,
    saludGlobal: madurez.porcentajeGlobal,
    nivel: nivelMadurez,
    clasesAnalizadas: clases.length,
    archivosModificados: archivosEditados ? Object.keys(archivosEditados).length : 0,
    metodosSugeridosTotales: totalMetodosSugeridos,
    fortalezas,
    alertasCriticas: [...alertasCriticas, ...madurez.alertasArquitectura],
    sugerenciasInmediatas,
    sugerenciasAccion: [...sugerenciasInmediatas, ...madurez.recomendaciones],
    metodosSugeridosPorClase,
    endpointsExcluidos
  };
}

/**
 * Genera métodos de negocio semánticamente inteligentes según el nombre de la entidad.
 */
export function generarMetodosSugeridos(nombreClase: string): MetodoUml[] {
  const lower = nombreClase.toLowerCase();
  const idBase = `m-${lower}-${Date.now().toString(36)}`;

  if (lower.includes('factura') || lower.includes('venta') || lower.includes('orden') || lower.includes('pedido')) {
    return [
      { id: `${idBase}-1`, name: 'calcularTotal', returnType: 'Double', visibility: '+', parameters: '' },
      { id: `${idBase}-2`, name: 'aplicarDescuento', returnType: 'Double', visibility: '+', parameters: 'Double porcentaje' },
      { id: `${idBase}-3`, name: 'confirmarPago', returnType: 'Boolean', visibility: '+', parameters: 'String metodoPago' }
    ];
  }

  if (lower.includes('producto') || lower.includes('item') || lower.includes('articulo')) {
    return [
      { id: `${idBase}-1`, name: 'actualizarStock', returnType: 'Boolean', visibility: '+', parameters: 'Integer cantidad' },
      { id: `${idBase}-2`, name: 'validarDisponibilidad', returnType: 'Boolean', visibility: '+', parameters: '' },
      { id: `${idBase}-3`, name: 'ajustarPrecio', returnType: 'void', visibility: '+', parameters: 'Double nuevoPrecio' }
    ];
  }

  if (lower.includes('cliente') || lower.includes('usuario') || lower.includes('paciente') || lower.includes('persona')) {
    return [
      { id: `${idBase}-1`, name: 'validarIdentificacion', returnType: 'Boolean', visibility: '+', parameters: '' },
      { id: `${idBase}-2`, name: 'actualizarContacto', returnType: 'void', visibility: '+', parameters: 'String nuevoCorreo' },
      { id: `${idBase}-3`, name: 'esClienteActivo', returnType: 'Boolean', visibility: '+', parameters: '' }
    ];
  }

  // Genérico de negocio
  return [
    { id: `${idBase}-1`, name: `validar${nombreClase}`, returnType: 'Boolean', visibility: '+', parameters: '' },
    { id: `${idBase}-2`, name: `procesar${nombreClase}`, returnType: 'void', visibility: '+', parameters: '' }
  ];
}

/**
 * Explica en lenguaje natural la arquitectura y diseño de una clase específica.
 */
export function explicarArquitecturaClase(cls: ClaseUml, diagram: ModeloDiagrama): string {
  const attrs = cls.attributes || [];
  const mets = cls.methods || [];
  const rels = (diagram.relations || []).filter(r => r.sourceClassId === cls.id || r.targetClassId === cls.id);

  let desc = `### 🏛️ Arquitectura de la Clase **${cls.name}**\n\n`;
  desc += `* **Estereotipo**: \`${cls.stereotype || 'Entity'}\`\n`;
  desc += `* **Atributos de Persistencia (${attrs.length})**: ${attrs.map(a => `\`${a.name}: ${a.type}\``).join(', ')}\n`;
  desc += `* **Métodos de Negocio (${mets.length})**: ${mets.length > 0 ? mets.map(m => `\`${m.name}(): ${m.returnType}\``).join(', ') : 'Ninguno definido (Recomendado agregar lógica)'}\n`;
  desc += `* **Relaciones Activas (${rels.length})**: `;
  
  if (rels.length === 0) {
    desc += `Tabla independiente sin llaves foráneas.\n`;
  } else {
    const nombresRel = rels.map(r => {
      const otroId = r.sourceClassId === cls.id ? r.targetClassId : r.sourceClassId;
      const otra = diagram.classes.find(c => c.id === otroId);
      return `${otra?.name || 'Otra'} (${r.type})`;
    });
    desc += `${nombresRel.join(' · ')}\n`;
  }

  desc += `\n**Mapeo Spring Boot 3**: Genera entidad JPA con \`@Entity\`, repositorio \`${cls.name}Repository\`, servicio \`${cls.name}Service\` y controlador REST \`${cls.name}Controller\` bajo la ruta \`/api/v1/${cls.name.toLowerCase()}s\`.\n`;
  return desc;
}
