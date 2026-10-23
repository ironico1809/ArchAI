import {
  ModeloDiagrama,
  ClaseUml,
  AtributoUml,
  MetodoUml,
  RelacionUml
} from '../types/uml';

/**
 * Exportador de XMI 1.1 "nativo de Sparx" para Enterprise Architect.
 *
 * A diferencia del XMI 2.1 estándar (generateXmiXml, que EA importa sin diagrama),
 * este generador produce el mismo dialecto XMI 1.1 que exporta EA:
 *  - `UML:Class` / `UML:Attribute` / `UML:Operation` / `UML:Association` ...
 *  - `XMI.extension` → `sparx:Diagrams` con `sparx:DiagramObject` (posiciones)
 *    y `sparx:DiagramConnector` (relaciones dibujadas).
 *
 * En EA: Panel de control → Herramientas → Importar/Exportar → "Importar paquete
 * desde XMI" → elegir los .xmi y Aceptar: crea las clases Y el diagrama con su layout.
 */

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function esc(valor: unknown): string {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** GUID estilo Sparx {XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX} */
function guid(): string {
  let raw: string;
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    raw = crypto.randomUUID();
  } else {
    raw = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  return '{' + raw.toUpperCase() + '}';
}

const VISIBILIDAD: Record<string, string> = {
  '+': 'public',
  '-': 'private',
  '#': 'protected',
  '~': 'package'
};

function visibilidad(v?: string): string {
  return VISIBILIDAD[v || ''] || 'public';
}

function multiplicidad(m?: string): string {
  const s = (m || '').trim();
  return s ? s : '1';
}

/** Tamaño proporcional del nodo UML para evitar cortes de texto en Enterprise Architect */
function dimensiones(clase: ClaseUml): { w: number; h: number } {
  const minW = 280;
  const maxNameLen = Math.max(
    clase.name.length,
    ...(clase.attributes || []).map(a => `${a.name}: ${a.type}`.length),
    ...(clase.methods || []).map(m => `${m.name}(${m.parameters || ''}): ${m.returnType}`.length)
  );
  const w = Math.max(minW, Math.min(480, Math.round(maxNameLen * 8.5 + 40)));
  const h = Math.max(140, Math.round(65 + (clase.attributes?.length || 0) * 25 + (clase.methods?.length || 0) * 25));
  return { w, h };
}

/* ------------------------------------------------------------------ */
/* Generador principal                                                 */
/* ------------------------------------------------------------------ */

export function exportarXmiEnterpriseArchitect(diagrama: ModeloDiagrama): string {
  const ahora = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const timestampEA = `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())} ${pad(ahora.getHours())}:${pad(ahora.getMinutes())}:${pad(ahora.getSeconds())}`;
  const nombreModelo = diagrama.title || 'ArchAI_Model';
  const nombreDiagrama = diagrama.title || 'Diagrama_UML';

  const eaId = (prefijo: string = 'EAID_') => {
    const raw = guid().replace(/[{}]/g, '').replace(/-/g, '_').toUpperCase();
    return `${prefijo}${raw}`;
  };

  const idModelo = eaId('MX_EAID_');
  const idPaquete = eaId('EAPK_');
  const idRootClass = 'EAID_11111111_5487_4080_A7F4_41526CB0AA00';
  const idDiagrama = eaId('EAID_');

  /* ---- Registro de tipos (datatypes UML para Long, String, BigDecimal, ...) ---- */
  const tipos = new Map<string, string>(); // lower(name) -> xmi.id
  const xmlTipos: string[] = [];

  const asegurarTipo = (nombreTipo?: string): string | null => {
    const nombre = (nombreTipo || '').trim();
    const clave = nombre.toLowerCase();
    if (!clave) return null;
    if (!tipos.has(clave)) {
      const tid = eaId('EAID_');
      tipos.set(clave, tid);
      xmlTipos.push(
        `          <UML:DataType name="${esc(nombre)}" xmi.id="${tid}" isRoot="false" isLeaf="false" isAbstract="false"/>`
      );
    }
    return tipos.get(clave) || null;
  };

  // Pre-registrar todos los tipos usados para que existan antes de las clases.
  diagrama.classes.forEach((c) => {
    c.attributes?.forEach((a) => asegurarTipo(a.type));
    c.methods?.forEach((m) => {
      asegurarTipo(m.returnType);
      if (m.parameters) {
        m.parameters.split(',').forEach((p) => {
          if (p.includes(':')) {
            asegurarTipo(p.split(':')[1].trim());
          }
        });
      }
    });
  });

  /* ---- Elementos del modelo ---- */
  const idsClases = new Map<string, string>(); // id de la app -> xmi.id
  const idsRelaciones = new Map<string, string>(); // id de la app -> xmi.id
  const xmlClases: string[] = [];
  const xmlRelaciones: string[] = [];

  const atributoXml = (a: AtributoUml): string => {
    const idAttr = eaId('EAID_');
    const idTipo = asegurarTipo(a.type);
    const isPk = a.isPrimaryKey === true;
    const estereotipoAttr = isPk
      ? `\n              <UML:ModelElement.stereotype><UML:Stereotype name="PK"/></UML:ModelElement.stereotype>`
      : '';

    const initialVal = a.defaultValue !== undefined && a.defaultValue !== ''
      ? `\n              <UML:Attribute.initialValue><UML:Expression body="${esc(a.defaultValue)}"><UML:Expression.body>${esc(a.defaultValue)}</UML:Expression.body></UML:Expression></UML:Attribute.initialValue>`
      : `\n              <UML:Attribute.initialValue><UML:Expression/></UML:Attribute.initialValue>`;

    const multXml = a.multiplicity
      ? `\n              <UML:StructuralFeature.multiplicity>` +
        `\n                <UML:Multiplicity>` +
        `\n                  <UML:Multiplicity.range>` +
        `\n                    <UML:MultiplicityRange lower="${esc(a.multiplicity.includes('..') ? a.multiplicity.split('..')[0] : a.multiplicity)}" upper="${esc(a.multiplicity.includes('..') ? a.multiplicity.split('..')[1] : a.multiplicity)}"/>` +
        `\n                  </UML:Multiplicity.range>` +
        `\n                </UML:Multiplicity>` +
        `\n              </UML:StructuralFeature.multiplicity>`
      : '';

    const typeXml = idTipo
      ? `\n              <UML:StructuralFeature.type>` +
        `\n                <UML:Classifier xmi.idref="${idTipo}"/>` +
        `\n              </UML:StructuralFeature.type>`
      : '';

    const taggedVals =
      `\n              <UML:ModelElement.taggedValue>` +
      (a.type ? `\n                <UML:TaggedValue tag="type" value="${esc(a.type)}"/>` : '') +
      `\n                <UML:TaggedValue tag="isPrimaryKey" value="${isPk ? 'true' : 'false'}"/>` +
      `\n                <UML:TaggedValue tag="isNullable" value="${a.isNullable ? 'true' : 'false'}"/>` +
      (a.isDerived ? `\n                <UML:TaggedValue tag="isDerived" value="true"/>` : '') +
      `\n              </UML:ModelElement.taggedValue>`;

    return (
      `            <UML:Attribute name="${esc(a.name)}" xmi.id="${idAttr}" ` +
      `visibility="${visibilidad(a.visibility)}" isStatic="${a.isStatic ? 'true' : 'false'}" ` +
      `changeability="${a.isReadOnly ? 'frozen' : 'changeable'}" ` +
      `targetScope="instance" ownerScope="instance">` +
      estereotipoAttr +
      typeXml +
      multXml +
      initialVal +
      taggedVals +
      `\n            </UML:Attribute>`
    );
  };

  const metodoXml = (m: MetodoUml): string => {
    const idOp = eaId('EAID_');
    const parametros: string[] = [];
    const idRetorno = asegurarTipo(m.returnType);
    if (idRetorno) {
      const idParamRet = eaId('EAID_');
      parametros.push(
        `                <UML:Parameter kind="return" xmi.id="${idParamRet}">` +
        `\n                  <UML:Parameter.type><UML:Classifier xmi.idref="${idRetorno}"/></UML:Parameter.type>` +
        `\n                </UML:Parameter>`
      );
    }
    if (m.parameters && m.parameters.trim()) {
      m.parameters.split(',').forEach((p) => {
        const token = p.trim();
        if (!token) return;
        let pName = token;
        let pType = 'String';
        if (token.includes(':')) {
          const parts = token.split(':');
          pName = parts[0].trim();
          pType = parts[1].trim() || 'String';
        }
        const idParamTipo = asegurarTipo(pType) || asegurarTipo('String');
        const idParam = eaId('EAID_');
        parametros.push(
          `                <UML:Parameter name="${esc(pName)}" kind="in" xmi.id="${idParam}">` +
          (idParamTipo ? `\n                  <UML:Parameter.type><UML:Classifier xmi.idref="${idParamTipo}"/></UML:Parameter.type>` : '') +
          `\n                </UML:Parameter>`
        );
      });
    }

    const taggedVals =
      `\n              <UML:ModelElement.taggedValue>` +
      (m.returnType ? `\n                <UML:TaggedValue tag="type" value="${esc(m.returnType)}"/>` : '') +
      `\n                <UML:TaggedValue tag="isStatic" value="${m.isStatic ? 'true' : 'false'}"/>` +
      `\n                <UML:TaggedValue tag="isAbstract" value="${m.isAbstract ? 'true' : 'false'}"/>` +
      `\n                <UML:TaggedValue tag="isQuery" value="${m.isQuery ? 'true' : 'false'}"/>` +
      `\n              </UML:ModelElement.taggedValue>`;

    return (
      `            <UML:Operation name="${esc(m.name)}" xmi.id="${idOp}" ` +
      `visibility="${visibilidad(m.visibility)}" isStatic="${m.isStatic ? 'true' : 'false'}" ` +
      `isAbstract="${m.isAbstract ? 'true' : 'false'}" isQuery="${m.isQuery ? 'true' : 'false'}" concurrency="sequential">` +
      (parametros.length ? `\n              <UML:BehavioralFeature.parameter>\n${parametros.join('\n')}\n              </UML:BehavioralFeature.parameter>` : '') +
      taggedVals +
      `\n            </UML:Operation>`
    );
  };

  diagrama.classes.forEach((c: ClaseUml) => {
    const id = eaId('EAID_');
    idsClases.set(c.id, id);

    let stName = c.stereotype || '';
    if (stName === 'Enum') stName = 'enumeration';
    const estereotipo = stName
      ? `\n            <UML:ModelElement.stereotype><UML:Stereotype name="${esc(stName)}"/></UML:ModelElement.stereotype>`
      : '';

    const esInterfaz = c.isInterface === true || String(c.stereotype || '').toLowerCase() === 'interface';
    const etiqueta = esInterfaz ? 'UML:Interface' : 'UML:Class';

    const features =
      c.attributes && c.attributes.length
        ? `\n            ${c.attributes.map(atributoXml).join('\n            ')}`
        : '';
    const operations =
      c.methods && c.methods.length
        ? `\n            ${c.methods.map(metodoXml).join('\n            ')}`
        : '';

    const hasFeatures = features || operations;

    const docTaggedValue = c.noteText
      ? `\n              <UML:TaggedValue tag="documentation" value="${esc(c.noteText)}"/>`
      : '';
    const classTaggedValues =
      `\n            <UML:ModelElement.taggedValue>` +
      `\n              <UML:TaggedValue tag="ea_stype" value="${esInterfaz ? 'Interface' : 'Class'}"/>` +
      `\n              <UML:TaggedValue tag="package" value="${idPaquete}"/>` +
      `\n              <UML:TaggedValue tag="ea_eleType" value="element"/>` +
      docTaggedValue +
      `\n            </UML:ModelElement.taggedValue>`;

    xmlClases.push(
      `          <${etiqueta} name="${esc(c.name)}" xmi.id="${id}" namespace="${idPaquete}" ` +
      `isAbstract="${c.isAbstract ? 'true' : 'false'}" isLeaf="false" isRoot="false" isActive="false" visibility="public">` +
      classTaggedValues +
      estereotipo +
      (hasFeatures ? `\n            <UML:Classifier.feature>${features}${operations}\n            </UML:Classifier.feature>` : '') +
      `\n          </${etiqueta}>`
    );
  });

  const extremoAsociacion = (opts: {
    idClase: string;
    multiplicidad?: string;
    rol?: string;
    navegable: 'true' | 'false';
    agregacion: string;
    endType: 'source' | 'target';
  }): string => {
    const idEnd = eaId('EAID_');
    return (
      `              <UML:AssociationEnd xmi.id="${idEnd}" ` +
      `visibility="public" isNavigable="${opts.navegable}" aggregation="${opts.agregacion}" ` +
      `name="${esc(opts.rol || '')}" multiplicity="${multiplicidad(opts.multiplicidad)}" type="${opts.idClase}">` +
      `\n                <UML:ModelElement.taggedValue>` +
      `\n                  <UML:TaggedValue tag="ea_end" value="${opts.endType}"/>` +
      `\n                </UML:ModelElement.taggedValue>` +
      `\n              </UML:AssociationEnd>`
    );
  };

  diagrama.relations.forEach((rel: RelacionUml) => {
    const idOrigen = idsClases.get(rel.sourceClassId);
    const idDestino = idsClases.get(rel.targetClassId);
    if (!idOrigen || !idDestino) return;

    const id = eaId('EAID_');
    idsRelaciones.set(rel.id, id);
    const navegable = rel.type === 'NON_NAVIGABLE' ? 'false' : 'true';

    switch (rel.type) {
      case 'INHERITANCE': {
        xmlRelaciones.push(
          `          <UML:Generalization xmi.id="${id}" subtype="${idOrigen}" supertype="${idDestino}" visibility="public">` +
          `\n            <UML:ModelElement.taggedValue>` +
          `\n              <UML:TaggedValue tag="ea_type" value="Generalization"/>` +
          `\n              <UML:TaggedValue tag="direction" value="Source -&gt; Destination"/>` +
          `\n            </UML:ModelElement.taggedValue>` +
          `\n            <UML:Generalization.child>` +
          `\n              <UML:Class xmi.idref="${idOrigen}"/>` +
          `\n            </UML:Generalization.child>` +
          `\n            <UML:Generalization.parent>` +
          `\n              <UML:Class xmi.idref="${idDestino}"/>` +
          `\n            </UML:Generalization.parent>` +
          `\n          </UML:Generalization>`
        );
        break;
      }
      case 'REALIZATION': {
        xmlRelaciones.push(
          `          <UML:Abstraction xmi.id="${id}" name="Realizes" visibility="public">` +
          `\n            <UML:ModelElement.stereotype><UML:Stereotype name="realizes"/></UML:ModelElement.stereotype>` +
          `\n            <UML:ModelElement.taggedValue>` +
          `\n              <UML:TaggedValue tag="ea_type" value="Realisation"/>` +
          `\n              <UML:TaggedValue tag="direction" value="Source -&gt; Destination"/>` +
          `\n            </UML:ModelElement.taggedValue>` +
          `\n            <UML:Dependency.client><UML:Class xmi.idref="${idOrigen}"/></UML:Dependency.client>` +
          `\n            <UML:Dependency.supplier><UML:Class xmi.idref="${idDestino}"/></UML:Dependency.supplier>` +
          `\n          </UML:Abstraction>`
        );
        break;
      }
      case 'DEPENDENCY':
      case 'USAGE':
      case 'PACKAGE_IMPORT': {
        const estereotipoDependencia = rel.type === 'USAGE'
          ? `\n            <UML:ModelElement.stereotype><UML:Stereotype name="usage"/></UML:ModelElement.stereotype>`
          : '';
        xmlRelaciones.push(
          `          <UML:Dependency xmi.id="${id}" name="${esc(rel.label || 'dependency')}" visibility="public">` +
          estereotipoDependencia +
          `\n            <UML:ModelElement.taggedValue>` +
          `\n              <UML:TaggedValue tag="ea_type" value="Dependency"/>` +
          `\n              <UML:TaggedValue tag="direction" value="Source -&gt; Destination"/>` +
          `\n            </UML:ModelElement.taggedValue>` +
          `\n            <UML:Dependency.client><UML:Class xmi.idref="${idOrigen}"/></UML:Dependency.client>` +
          `\n            <UML:Dependency.supplier><UML:Class xmi.idref="${idDestino}"/></UML:Dependency.supplier>` +
          `\n          </UML:Dependency>`
        );
        break;
      }
      // ASSOCIATION_*, COMPOSITION, AGGREGATION: UML:Association con dos extremos.
      default: {
        const agregacion = rel.type === 'COMPOSITION' ? 'composite' : rel.type === 'AGGREGATION' ? 'aggregate' : 'none';
        const eaType = rel.type === 'COMPOSITION' || rel.type === 'AGGREGATION' ? 'Aggregation' : 'Association';
        const subtype = rel.type === 'COMPOSITION' ? `\n              <UML:TaggedValue tag="subtype" value="Strong"/>` : '';
        xmlRelaciones.push(
          `          <UML:Association xmi.id="${id}" name="${esc(rel.label || 'association')}" visibility="public" isRoot="false" isLeaf="false" isAbstract="false">` +
          `\n            <UML:ModelElement.taggedValue>` +
          `\n              <UML:TaggedValue tag="ea_type" value="${eaType}"/>` +
          `\n              <UML:TaggedValue tag="direction" value="Source -&gt; Destination"/>` +
          subtype +
          `\n            </UML:ModelElement.taggedValue>` +
          `\n            <UML:Association.connection>` +
          `\n${extremoAsociacion({ idClase: idOrigen, multiplicidad: rel.sourceMultiplicity, rol: rel.sourceRole, navegable, agregacion, endType: 'source' })}` +
          `\n${extremoAsociacion({ idClase: idDestino, multiplicidad: rel.targetMultiplicity, rol: rel.targetRole, navegable, agregacion: 'none', endType: 'target' })}` +
          `\n            </UML:Association.connection>` +
          `\n          </UML:Association>`
        );
        break;
      }
    }
  });

  /* ---- Elementos del Diagrama UML (posiciones y relaciones visuales) ---- */
  const elementosDiagrama: string[] = [];

  diagrama.classes.forEach((c, idx) => {
    const id = idsClases.get(c.id);
    if (!id) return;
    const pos = c.position || { x: 80 + (idx % 3) * 300, y: 100 + Math.floor(idx / 3) * 220 };
    const { w, h } = dimensiones(c);
    const left = Math.round(pos.x);
    const top = Math.round(pos.y);
    const right = Math.round(pos.x + w);
    const bottom = Math.round(pos.y + h);
    const duid = eaId('').replace(/^EAID_/, '').substring(0, 8);
    elementosDiagrama.push(
      `        <UML:DiagramElement geometry="Left=${left};Top=${top};Right=${right};Bottom=${bottom};" subject="${id}" seqno="${idx + 1}" style="DUID=${duid};"/>`
    );
  });

  diagrama.relations.forEach((rel) => {
    const idRel = idsRelaciones.get(rel.id);
    if (!idRel) return;
    elementosDiagrama.push(
      `        <UML:DiagramElement geometry="SX=0;SY=0;EX=0;EY=0;EDGE=2;$LLB=;LLT=;LMT=;LMB=;LRT=;LRB=;IRHS=;ILHS=;Path=;" subject="${idRel}" style="Mode=3;Color=-1;LWidth=0;Hidden=0;"/>`
    );
  });

  const diagramaXml =
    `    <UML:Diagram name="${esc(nombreDiagrama)}" xmi.id="${idDiagrama}" diagramType="ClassDiagram" owner="${idPaquete}" toolName="Enterprise Architect 2.5">\n` +
    `      <UML:ModelElement.taggedValue>\n` +
    `        <UML:TaggedValue tag="version" value="1.0"/>\n` +
    `        <UML:TaggedValue tag="author" value="ArchAI"/>\n` +
    `        <UML:TaggedValue tag="created_date" value="${timestampEA}"/>\n` +
    `        <UML:TaggedValue tag="modified_date" value="${timestampEA}"/>\n` +
    `        <UML:TaggedValue tag="package" value="${idPaquete}"/>\n` +
    `        <UML:TaggedValue tag="type" value="Logical"/>\n` +
    `        <UML:TaggedValue tag="ea_localid" value="1"/>\n` +
    `        <UML:TaggedValue tag="EAStyle" value="ShowPrivate=1;ShowProtected=1;ShowPublic=1;HideRelationships=0;Locked=0;Border=1;HighlightForeign=1;PackageContents=1;SequenceNotes=0;ScalePrintImage=0;PPgs.cx=1;PPgs.cy=1;DocSize.cx=823;DocSize.cy=1169;ShowDetails=0;Orientation=L;Zoom=100;ShowTags=0;OpParams=1;VisibleAttributeDetail=0;ShowOpRetType=1;ShowIcons=1;CollabNums=0;HideProps=0;ShowReqs=0;ShowCons=0;PaperSize=9;HideParents=0;UseAlias=0;HideAtts=0;HideOps=0;HideStereo=0;HideElemStereo=0;ShowTests=0;ShowMaint=0;ConnectorNotation=UML 2.1;ExplicitNavigability=0;ShowShape=1;AllDockable=0;AdvancedElementProps=1;AdvancedFeatureProps=1;AdvancedConnectorProps=1;m_bElementClassifier=1;SPT=1;ShowNotes=0;SuppressBrackets=0;SuppConnectorLabels=0;PrintPageHeadFoot=0;ShowAsList=0;"/>\n` +
    `      </UML:ModelElement.taggedValue>\n` +
    `      <UML:Diagram.element>\n` +
    elementosDiagrama.join('\n') +
    `\n      </UML:Diagram.element>\n` +
    `    </UML:Diagram>`;

  /* ---- Ensamblado final nativo Enterprise Architect ---- */
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<XMI xmi.version="1.1" xmlns:UML="omg.org/UML1.3" timestamp="${timestampEA}">\n` +
    `  <XMI.header>\n` +
    `    <XMI.documentation>\n` +
    `      <XMI.exporter>Enterprise Architect</XMI.exporter>\n` +
    `      <XMI.exporterVersion>2.5</XMI.exporterVersion>\n` +
    `    </XMI.documentation>\n` +
    `  </XMI.header>\n` +
    `  <XMI.content>\n` +
    `    <UML:Model name="EA Model" xmi.id="${idModelo}">\n` +
    `      <UML:Namespace.ownedElement>\n` +
    `        <UML:Class name="EARootClass" xmi.id="${idRootClass}" isRoot="true" isLeaf="false" isAbstract="false"/>\n` +
    `        <UML:Package name="${esc(nombreModelo)}" xmi.id="${idPaquete}" isRoot="false" isLeaf="false" isAbstract="false" visibility="public">\n` +
    `          <UML:ModelElement.taggedValue>\n` +
    `            <UML:TaggedValue tag="ea_stype" value="Public"/>\n` +
    `          </UML:ModelElement.taggedValue>\n` +
    `          <UML:Namespace.ownedElement>\n` +
    (xmlTipos.length ? `${xmlTipos.join('\n')}\n` : '') +
    (xmlClases.length ? `${xmlClases.join('\n')}\n` : '') +
    (xmlRelaciones.length ? `${xmlRelaciones.join('\n')}\n` : '') +
    `          </UML:Namespace.ownedElement>\n` +
    `        </UML:Package>\n` +
    `      </UML:Namespace.ownedElement>\n` +
    `    </UML:Model>\n` +
    `${diagramaXml}\n` +
    `  </XMI.content>\n` +
    `  <XMI.difference/>\n` +
    `  <XMI.extensions xmi.extender="Enterprise Architect 2.5">\n` +
    `    <EAModel.paramSub/>\n` +
    `  </XMI.extensions>\n` +
    `</XMI>\n`;

  return xml;
}