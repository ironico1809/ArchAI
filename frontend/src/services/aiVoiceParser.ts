import { ClaseUml, AtributoUml, RelacionUml } from '../types/uml';

export interface ParseResult {
  success: boolean;
  action: 'CREATE_CLASS' | 'ADD_ATTRIBUTE' | 'CREATE_RELATION' | 'VALIDATE_MODEL' | 'SUMMARY_MODEL' | 'GENERATE_DIAGRAM' | 'OPEN_WHITEBOARD' | 'OPEN_CODE_DOCK' | 'UNKNOWN';
  reasoning: string;
  createdClass?: ClaseUml;
  targetClassName?: string;
  newAttribute?: AtributoUml;
  newRelation?: RelacionUml;
  rawPrompt?: string;
  message: string;
}

// Normalizador de tipos Java / UML en español e inglés
export function normalizeType(rawType: string): AtributoUml['type'] {
  const t = rawType.toLowerCase().trim();
  if (t.includes('long') || t.includes('id') || t.includes('identificador') || t.includes('bigint')) return 'Long';
  if (t.includes('string') || t.includes('texto') || t.includes('cadena') || t.includes('nombre') || t.includes('descripcion') || t.includes('correo') || t.includes('email') || t.includes('telefono') || t.includes('direccion') || t.includes('ciudad') || t.includes('pais') || t.includes('titulo') || t.includes('codigo')) return 'String';
  if (t.includes('int') || t.includes('integer') || t.includes('entero') || t.includes('edad') || t.includes('numero') || t.includes('cantidad') || t.includes('stock') || t.includes('contador') || t.includes('anio') || t.includes('mes')) return 'Integer';
  if (t.includes('double') || t.includes('float') || t.includes('decimal') || t.includes('monto') || t.includes('precio') || t.includes('total') || t.includes('saldo') || t.includes('costo') || t.includes('tarifa') || t.includes('sueldo')) return 'Double';
  if (t.includes('bool') || t.includes('boolean') || t.includes('booleano') || t.includes('activo') || t.includes('estado') || t.includes('habilitado') || t.includes('pagado')) return 'Boolean';
  if (t.includes('datetime') || t.includes('timestamp') || t.includes('hora') || t.includes('tiempo')) return 'LocalDateTime';
  if (t.includes('date') || t.includes('fecha') || t.includes('nacimiento')) return 'LocalDate';
  return 'String';
}

export function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Analizador léxico y semántico de comandos de voz y texto en lenguaje natural para UML.
 * Funciona de forma 100% offline en el navegador sin dependencias externas.
 */
export function parseNaturalLanguageCommand(text: string, existingClasses: ClaseUml[]): ParseResult {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // 0. Meta-comandos de voz directos (Acciones de la aplicación)
  if (lower.includes('validar') || lower.includes('auditar') || lower.includes('normalizar') || lower.includes('3fn') || lower.includes('revisar modelo')) {
    return {
      success: true,
      action: 'VALIDATE_MODEL',
      reasoning: 'Comando de auditoría del modelo UML y normalización 3FN detectado.',
      message: 'Iniciando validación arquitectónica del modelo (CU-08)...'
    };
  }

  if (lower.includes('resumen') || lower.includes('explicar modelo') || lower.includes('describir diagrama')) {
    return {
      success: true,
      action: 'SUMMARY_MODEL',
      reasoning: 'Comando de resumen conceptual del modelo detectado.',
      message: 'Generando diagnóstico y resumen con el agente contextual...'
    };
  }

  if (lower.includes('escanear pizarra') || lower.includes('abrir pizarra') || lower.includes('foto pizarra') || lower.includes('camara pizarra')) {
    return {
      success: true,
      action: 'OPEN_WHITEBOARD',
      reasoning: 'Comando para escaneo de pizarra física OCR detectado.',
      message: 'Abriendo escáner de pizarra física (CU-07)...'
    };
  }

  if (lower.includes('generar codigo') || lower.includes('ver codigo') || lower.includes('spring boot') || lower.includes('descargar zip')) {
    return {
      success: true,
      action: 'OPEN_CODE_DOCK',
      reasoning: 'Comando para panel de generación de código Spring Boot detectado.',
      message: 'Desplegando dock de generación de código y empaquetado ZIP (CU-10 / CU-14)...'
    };
  }

  if ((lower.startsWith('generar diagrama') || lower.startsWith('diagrama de') || lower.startsWith('sistema de') || lower.startsWith('crear sistema')) && clean.split(/\s+/).length >= 4) {
    return {
      success: true,
      action: 'GENERATE_DIAGRAM',
      rawPrompt: clean,
      reasoning: 'Prompt descriptivo para sintetizar un diagrama completo por IA detectado.',
      message: `Generando arquitectura completa desde el prompt: "${clean}" (CU-04)...`
    };
  }

  // 1. Crear clase o entidad (ej: "crear clase Producto con precio Double y stock Integer", "crea la entidad Cliente con nombre y correo")
  const esCreacionClase =
    lower.includes('crear clase') || lower.includes('crea la clase') || lower.includes('crea una clase') ||
    lower.includes('crea clase') || lower.includes('agrega clase') || lower.includes('agregar clase') ||
    lower.includes('nueva clase') || lower.includes('nueva entidad') || lower.includes('crear entidad') ||
    lower.includes('crea entidad') || lower.includes('crear tabla') || lower.includes('crea tabla') ||
    lower.includes('nueva tabla') || (lower.startsWith('clase ') && clean.split(/\s+/).length >= 2);

  if (esCreacionClase) {
    let className = '';
    const classMatch = lower.match(/(?:clase|entidad|tabla)\s+(?:de\s+|del\s+|la\s+|el\s+)?([a-záéíóúñ0-9_]+)/i);
    if (classMatch && classMatch[1]) {
      className = capitalize(classMatch[1]);
    } else {
      className = 'Entidad' + Math.floor(Math.random() * 100);
    }

    // Identificar estereotipo
    let stereotype: ClaseUml['stereotype'] = 'Entity';
    if (lower.includes('controller') || lower.includes('controlador')) stereotype = 'Controller';
    else if (lower.includes('service') || lower.includes('servicio')) stereotype = 'Service';
    else if (lower.includes('repository') || lower.includes('repositorio')) stereotype = 'Repository';
    else if (lower.includes('enum')) stereotype = 'Enum';

    const attributes: AtributoUml[] = [
      {
        id: 'attr-' + Date.now() + '-id',
        name: 'id',
        type: 'Long',
        visibility: '-',
        isPrimaryKey: true,
        isNullable: false
      }
    ];

    // Extraer atributos
    const withIndex = lower.indexOf('con');
    if (withIndex !== -1) {
      const attributesChunk = clean.slice(withIndex + 3);
      // Limpiar palabras conectoras
      const rawTokens = attributesChunk
        .replace(/[,;]/g, ' ')
        .split(/\s+/)
        .map(w => w.trim())
        .filter(w => w.length > 0);

      const stopWords = new Set(['atributo', 'atributos', 'campo', 'campos', 'columna', 'columnas', 'tipo', 'de', 'el', 'la', 'un', 'una', 'y', 'e', 'con']);
      const knownTypeTokens = new Set(['string', 'int', 'integer', 'long', 'double', 'float', 'boolean', 'bool', 'date', 'localdate', 'localdatetime', 'datetime', 'texto', 'numero', 'entero', 'decimal', 'fecha', 'hora']);

      const filteredTokens = rawTokens.filter(t => !stopWords.has(t.toLowerCase()));

      let i = 0;
      let attrCount = 0;
      while (i < filteredTokens.length) {
        const token = filteredTokens[i];
        const tokenLower = token.toLowerCase();

        if (tokenLower === 'id' || tokenLower === 'identificador') {
          i++;
          continue;
        }

        let attrName = tokenLower;
        let attrType: AtributoUml['type'] = 'String';

        // Comprobar si el token siguiente es un tipo de dato explícito
        if (i + 1 < filteredTokens.length && knownTypeTokens.has(filteredTokens[i + 1].toLowerCase())) {
          attrType = normalizeType(filteredTokens[i + 1]);
          i += 2;
        } else {
          // Inferir tipo según semántica del nombre
          attrType = normalizeType(tokenLower);
          i += 1;
        }

        // Evitar duplicados
        if (!attributes.some(a => a.name.toLowerCase() === attrName)) {
          attributes.push({
            id: `attr-${Date.now()}-${attrCount++}`,
            name: attrName,
            type: attrType,
            visibility: '-',
            isPrimaryKey: false,
            isNullable: false
          });
        }
      }
    }

    // Calcular posición óptima sin solapar
    const cols = 3;
    const baseOffset = existingClasses.length;
    const posX = 120 + (baseOffset % cols) * 340;
    const posY = 140 + Math.floor(baseOffset / cols) * 280;

    const newClass: ClaseUml = {
      id: 'class-' + Date.now(),
      name: className,
      stereotype,
      attributes,
      methods: [
        {
          id: `m-${Date.now()}-1`,
          name: `get${className}Info`,
          returnType: 'String',
          visibility: '+',
          parameters: ''
        }
      ],
      position: { x: posX, y: posY }
    };

    return {
      success: true,
      action: 'CREATE_CLASS',
      reasoning: `Se analizó el comando de voz/texto. Se identificó la entidad '${className}' con estereotipo <<${stereotype}>> y ${attributes.length} atributo(s): ${attributes.map(a => `${a.name}: ${a.type}`).join(', ')}.`,
      createdClass: newClass,
      message: `Clase UML '${className}' generada con éxito.`
    };
  }

  // 2. Agregar atributo a clase existente
  if (lower.includes('agrega atributo') || lower.includes('agregar atributo') || lower.includes('añade atributo') ||
      lower.includes('añadir atributo') || lower.includes('nuevo atributo') || lower.includes('agrega campo') ||
      lower.includes('agregar campo') || lower.includes('poner atributo') || lower.includes('poner campo')) {

    const attrMatch = lower.match(/(?:atributo|campo|columna)\s+([a-záéíóúñ0-9_]+)/i);
    const classMatch = lower.match(/(?:a|en|para)\s+(?:la\s+clase\s+|la\s+entidad\s+)?([a-záéíóúñ0-9_]+)/i);

    if (attrMatch) {
      const attrName = attrMatch[1].toLowerCase();
      let targetName = classMatch ? capitalize(classMatch[1]) : (existingClasses[0]?.name || 'Clase');
      const attrType = normalizeType(lower);

      const newAttr: AtributoUml = {
        id: 'attr-' + Date.now(),
        name: attrName,
        type: attrType,
        visibility: '-',
        isPrimaryKey: false,
        isNullable: false
      };

      return {
        success: true,
        action: 'ADD_ATTRIBUTE',
        reasoning: `Se detectó la inserción del atributo '${attrName}: ${attrType}' para la clase '${targetName}'.`,
        targetClassName: targetName,
        newAttribute: newAttr,
        message: `Atributo '${attrName} (${attrType})' añadido a la clase '${targetName}'.`
      };
    }
  }

  // 3. Relacionar clases
  if (lower.includes('relaciona') || lower.includes('relacionar') || lower.includes('conecta') ||
      lower.includes('conectar') || lower.includes('asocia') || lower.includes('asociar') ||
      lower.includes('vincula') || lower.includes('vincular') || lower.includes('hereda') ||
      lower.includes('compone')) {

    const matchedClasses = existingClasses.filter(c => lower.includes(c.name.toLowerCase()));
    if (matchedClasses.length >= 2) {
      let relType: RelacionUml['type'] = 'ASSOCIATION_1_N';
      let srcMult = '1';
      let tgtMult = '0..*';
      let relLabel = 'gestiona';

      if (lower.includes('muchos a muchos') || lower.includes('n a m') || lower.includes('n:m')) {
        relType = 'ASSOCIATION_N_M';
        srcMult = '0..*';
        tgtMult = '0..*';
        relLabel = 'asocia';
      } else if (lower.includes('uno a uno') || lower.includes('1 a 1') || lower.includes('1:1')) {
        relType = 'ASSOCIATION_1_1';
        srcMult = '1';
        tgtMult = '1';
        relLabel = 'contiene';
      } else if (lower.includes('hereda') || lower.includes('herencia') || lower.includes('subclase')) {
        relType = 'INHERITANCE';
        srcMult = '1';
        tgtMult = '1';
        relLabel = 'extiende';
      } else if (lower.includes('compone') || lower.includes('composicion')) {
        relType = 'COMPOSITION';
        srcMult = '1';
        tgtMult = '0..*';
        relLabel = 'compone';
      }

      const rel: RelacionUml = {
        id: 'rel-' + Date.now(),
        sourceClassId: matchedClasses[0].id,
        targetClassId: matchedClasses[1].id,
        type: relType,
        sourceMultiplicity: srcMult,
        targetMultiplicity: tgtMult,
        label: relLabel
      };

      return {
        success: true,
        action: 'CREATE_RELATION',
        reasoning: `Se generó la relación ${relType} entre '${matchedClasses[0].name}' y '${matchedClasses[1].name}'.`,
        newRelation: rel,
        message: `Relación creada entre ${matchedClasses[0].name} (${srcMult}) y ${matchedClasses[1].name} (${tgtMult}).`
      };
    }
  }

  return {
    success: false,
    action: 'UNKNOWN',
    reasoning: 'No se pudo mapear el comando a una operación UML. Prueba decir: "Crear clase Factura con numero String, total Double y fecha LocalDate".',
    message: 'Comando no reconocido. Prueba: "crear clase Factura con total Double" o presiona los chips rápidos.'
  };
}
