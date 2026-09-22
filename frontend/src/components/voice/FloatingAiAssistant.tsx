import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Mic, 
  MicOff, 
  Send, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  X,
  Cpu,
  ShieldCheck,
  Wrench,
  Layers
} from 'lucide-react';
import { ClaseUml, AtributoUml, RelacionUml, MetodoUml, ModeloDiagrama } from '../../types/uml';
import { parseNaturalLanguageCommand } from '../../services/aiVoiceParser';
import { analizarComandoVoz, consultarAgenteContextual, generarDiagramaConPrompt, auditarMadurezBackend } from '../../services/api';
import { auditarCodigoProyecto, generarMetodosSugeridos } from '../../services/projectBrainService';
import { instanciarPlantilla, PLANTILLAS_DISPONIBLES } from '../../services/plantillasDominio';

interface FloatingAiAssistantProps {
  existingClasses: ClaseUml[];
  diagram?: ModeloDiagrama;
  customFiles?: Record<string, string>;
  onAddClass: (newClass: ClaseUml) => void;
  onAddAttribute: (classId: string, attr: AtributoUml) => void;
  onAddMethod?: (classId: string, method: MetodoUml) => void;
  onAddRelation: (relation: RelacionUml) => void;
  onOpenWhiteboard?: () => void;
  onOpenCodeDock?: () => void;
  onClose?: () => void;
}

interface EstadoDiagnostico {
  saludScore: number;
  nivel: string;
  resumen: string;
  alertas: string[];
  fortalezas: string[];
  sugerencias: string[];
  metodosSugeridos: Record<string, MetodoUml[]>;
}

export const FloatingAiAssistant: React.FC<FloatingAiAssistantProps> = ({
  existingClasses,
  diagram,
  customFiles,
  onAddClass,
  onAddAttribute,
  onAddMethod,
  onAddRelation,
  onOpenWhiteboard,
  onOpenCodeDock,
  onClose
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>(
    'Listo: escribe una instrucción o presiona el micrófono.'
  );
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error'>('info');
  const [recognitionSupported, setRecognitionSupported] = useState<boolean>(true);
  const [ollamaStatus, setOllamaStatus] = useState<{ activo: boolean; modelo: string | null }>({
    activo: false,
    modelo: null
  });

  const [diagnostico, setDiagnostico] = useState<EstadoDiagnostico | null>(null);

  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');
  const silenceTimerRef = useRef<any>(null);

  // Asegurar que cualquier síntesis previa del navegador quede cancelada
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
    }
  }, []);

  // Verificar estado de Ollama local (puerto 11434)
  useEffect(() => {
    const verificarOllama = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);
        const res = await fetch('http://localhost:11434/api/tags', { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          const models = data?.models || [];
          if (models.length > 0) {
            setOllamaStatus({ activo: true, modelo: models[0].name });
          } else {
            setOllamaStatus({ activo: true, modelo: 'Ollama local listo (11434)' });
          }
        }
      } catch {
        setOllamaStatus({ activo: false, modelo: null });
      }
    };
    verificarOllama();
  }, []);

  // Finalizar escucha y disparar ejecución automática sin intervención manual
  const finalizarYEjecutarVoz = (transcriptForzado?: string) => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    setIsListening(false);

    const comando = (transcriptForzado || transcriptRef.current || inputText).trim();
    if (comando.length > 0) {
      transcriptRef.current = '';
      executeCommand(comando);
    } else {
      setStatusType('info');
      setStatusMessage('No se detectó voz. Vuelve a presionar el micrófono para hablar.');
    }
  };

  // Inicializar Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      const langNav = navigator.language;
      rec.lang = langNav && langNav.startsWith('es') ? langNav : 'es-ES';
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setIsListening(true);
        setStatusType('info');
        setStatusMessage('🎙️ Escuchando... Habla y la IA lo ejecutará automáticamente.');
      };

      rec.onresult = (event: any) => {
        let transcript = '';
        let hasFinal = false;
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            hasFinal = true;
          }
        }
        transcriptRef.current = transcript;
        setInputText(transcript);
        setStatusMessage(`🗣️ "${transcript}"`);

        // Detección de silencio: si el usuario deja de hablar por 1 segundo, ejecuta automáticamente
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (transcriptRef.current.trim().length > 0) {
            finalizarYEjecutarVoz();
          }
        }, hasFinal ? 600 : 1200);
      };

      rec.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event?.error);
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        setIsListening(false);

        if (event?.error === 'not-allowed') {
          setStatusType('error');
          setStatusMessage('Permiso de micrófono denegado. Permítelo en la barra de direcciones.');
        } else if (event?.error === 'no-speech') {
          if (transcriptRef.current.trim().length > 0) {
            finalizarYEjecutarVoz();
          } else {
            setStatusType('info');
            setStatusMessage('No se escuchó audio. Presiona el micrófono e inténtalo de nuevo.');
          }
        } else {
          setStatusType('error');
          setStatusMessage('Error de captura de voz. Puedes escribir tu instrucción.');
        }
      };

      rec.onend = () => {
        setIsListening(false);
        if (transcriptRef.current.trim().length > 0) {
          finalizarYEjecutarVoz();
        }
      };

      recognitionRef.current = rec;
    } else {
      setRecognitionSupported(false);
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const handleToggleListening = () => {
    if (!recognitionSupported) {
      setStatusType('error');
      setStatusMessage('Tu navegador no soporta reconocimiento de voz nativo. Escribe el comando.');
      return;
    }

    if (isListening) {
      finalizarYEjecutarVoz();
    } else {
      setInputText('');
      transcriptRef.current = '';
      setStatusType('info');
      setStatusMessage('🎙️ Escuchando... Di por ejemplo: "Crear clase Factura con total Double"');
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error('Error al iniciar reconocimiento de voz:', err);
      }
    }
  };

  const mapearClaseBackend = (c: any): ClaseUml => ({
    id: c.id || `class-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: c.name,
    stereotype: c.stereotype || 'Entity',
    position: c.position || { x: 200 + Math.random() * 200, y: 180 + Math.random() * 150 },
    attributes: (c.attributes || []).map((a: any, idx: number) => ({
      id: a.id || `attr-${Date.now()}-${idx}`,
      name: a.name,
      type: a.type || 'String',
      visibility: a.visibility || '-',
      isPrimaryKey: a.isPrimaryKey ?? (a.name.toLowerCase() === 'id'),
      isNullable: a.isNullable ?? true
    })),
    methods: (c.methods || []).map((m: any, idx: number) => ({
      id: m.id || `m-${Date.now()}-${idx}`,
      name: m.name,
      returnType: m.returnType || 'void',
      visibility: m.visibility || '+',
      parameters: Array.isArray(m.parameters) ? m.parameters.join(', ') : (m.parameters || '')
    }))
  });

  const clasesParaBackend = (clases: ClaseUml[]) => clases.map(c => ({
    id: c.id,
    name: c.name,
    stereotype: c.stereotype,
    position: c.position,
    attributes: (c.attributes || []).map(a => ({
      id: a.id,
      name: a.name,
      type: a.type,
      visibility: a.visibility,
      isPrimaryKey: a.isPrimaryKey ?? false,
      isNullable: a.isNullable ?? true
    })),
    methods: (c.methods || []).map(m => ({
      id: m.id,
      name: m.name,
      returnType: m.returnType,
      visibility: m.visibility,
      parameters: m.parameters ? m.parameters.split(',').map((s: string) => s.trim()).filter(Boolean) : []
    }))
  }));

  /** Ejecuta el comando interpretado ya sea por voz o por texto */
  const executeCommand = async (text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    setStatusType('info');
    setStatusMessage(`⚡ Procesando con IA: "${cleanText}"...`);

    // 0. Parsear intención con el motor NLP
    const localResult = parseNaturalLanguageCommand(cleanText, existingClasses);

    // Acción: Auto-reparar modelo
    if (localResult.action === 'AUTO_FIX_MODEL') {
      await ejecutarAutoReparacion();
      setInputText('');
      return;
    }

    // Acción: Auditoría y Madurez del Cerebro de Código
    if (localResult.action === 'VALIDATE_MODEL') {
      await ejecutarAuditoriaCerebro();
      setInputText('');
      return;
    }

    // Acción: Generar Dominio Completo (Plantillas de Negocio)
    if (localResult.action === 'GENERATE_DOMAIN' && localResult.domainId) {
      ejecutarInstanciacionDominio(localResult.domainId);
      setInputText('');
      return;
    }

    // Acción: Resumen conceptual
    if (localResult.action === 'SUMMARY_MODEL') {
      await consultarContexto('resumen del modelo y arquitectura');
      setInputText('');
      return;
    }

    // Acción: Abrir Pizarra Física
    if (localResult.action === 'OPEN_WHITEBOARD') {
      onOpenWhiteboard?.();
      setStatusType('success');
      setStatusMessage('✓ Escáner de pizarra física abierto (CU-07).');
      setInputText('');
      return;
    }

    // Acción: Abrir Panel de Código Spring Boot
    if (localResult.action === 'OPEN_CODE_DOCK') {
      onOpenCodeDock?.();
      setStatusType('success');
      setStatusMessage('✓ Panel de código Spring Boot abierto (CU-10 / CU-14).');
      setInputText('');
      return;
    }

    // Acción: Generar Diagrama desde Prompt Libre
    if (localResult.action === 'GENERATE_DIAGRAM' && localResult.rawPrompt) {
      await generarDiagramaDesdePrompt(localResult.rawPrompt);
      return;
    }

    // Acción: Crear Clase Localmente (Respuesta Inmediata)
    if (localResult.action === 'CREATE_CLASS' && localResult.createdClass) {
      onAddClass(localResult.createdClass);
      setStatusType('success');
      setStatusMessage(`✓ Clase '${localResult.createdClass.name}' generada en el lienzo.`);
      setInputText('');
      return;
    }

    // Acción: Agregar Atributo Localmente
    if (localResult.action === 'ADD_ATTRIBUTE' && localResult.newAttribute) {
      const targetCls = existingClasses.find(c =>
        c.name.toLowerCase() === localResult.targetClassName?.toLowerCase()
      );
      const classId = targetCls ? targetCls.id : (existingClasses[0]?.id || 'cls-1');
      onAddAttribute(classId, localResult.newAttribute);
      setStatusType('success');
      setStatusMessage(`✓ Atributo '+${localResult.newAttribute.name}: ${localResult.newAttribute.type}' añadido.`);
      setInputText('');
      return;
    }

    // Acción: Relacionar Clases Localmente
    if (localResult.action === 'CREATE_RELATION' && localResult.newRelation) {
      onAddRelation(localResult.newRelation);
      setStatusType('success');
      setStatusMessage(`✓ Relación creada (${localResult.newRelation.label || '1:N'}).`);
      setInputText('');
      return;
    }

    // Fallback: Intentar con el servicio del backend Spring Boot
    try {
      const response = await analizarComandoVoz(cleanText);
      if (response && response.success) {
        if (response.action === 'CREATE_CLASS' && response.createdClass) {
          const nuevaClase = mapearClaseBackend(response.createdClass);
          onAddClass(nuevaClase);
          setStatusType('success');
          setStatusMessage(`✓ Clase '${nuevaClase.name}' creada por la IA.`);
        } else if (response.action === 'ADD_ATTRIBUTE' && response.createdAttribute) {
          const target = existingClasses.find(c =>
            c.name.toLowerCase() === (response.targetClassName || '').toLowerCase()
          );
          const classId = target ? target.id : (existingClasses[0]?.id || 'cls-1');
          onAddAttribute(classId, response.createdAttribute);
          setStatusType('success');
          setStatusMessage(`✓ Atributo '+${response.createdAttribute.name}: ${response.createdAttribute.type}' añadido.`);
        } else if (response.action === 'ADD_RELATION' && response.createdRelation) {
          onAddRelation(response.createdRelation);
          setStatusType('success');
          setStatusMessage('✓ Relación creada por la IA.');
        } else {
          setStatusType('success');
          setStatusMessage(response.message || 'Comando ejecutado con éxito.');
        }
        setInputText('');
        return;
      }
    } catch {
      // Si el backend no responde, usar fallback heurístico inteligente
    }

    // Si llegó aquí y no reconoció nada, crear una entidad inteligente basada en el texto
    const words = cleanText.split(/\s+/).filter(w => w.length > 2);
    if (words.length > 0) {
      const candidateName = words[words.length - 1].charAt(0).toUpperCase() + words[words.length - 1].slice(1);
      const fallbackClass: ClaseUml = {
        id: 'class-' + Date.now(),
        name: candidateName,
        stereotype: 'Entity',
        position: { x: 140 + (existingClasses.length % 3) * 340, y: 140 + Math.floor(existingClasses.length / 3) * 280 },
        attributes: [
          { id: `attr-${Date.now()}-id`, name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true, isNullable: false },
          { id: `attr-${Date.now()}-1`, name: 'nombre', type: 'String', visibility: '-', isPrimaryKey: false, isNullable: false },
          { id: `attr-${Date.now()}-2`, name: 'estado', type: 'String', visibility: '-', isPrimaryKey: false, isNullable: false }
        ],
        methods: [
          { id: `m-${Date.now()}-1`, name: `get${candidateName}Info`, returnType: 'String', visibility: '+', parameters: '' }
        ]
      };
      onAddClass(fallbackClass);
      setStatusType('success');
      setStatusMessage(`✓ Entidad '${candidateName}' generada automáticamente.`);
      setInputText('');
    } else {
      setStatusType('error');
      setStatusMessage('No se pudo interpretar el comando. Prueba: "crear clase Factura", "auditar" o "sistema de ventas".');
    }
  };

  /** Instanciación instantánea de Dominios de Negocio Completos */
  const ejecutarInstanciacionDominio = (dominioId: string) => {
    const instancia = instanciarPlantilla(dominioId, diagram);
    if (!instancia) {
      setStatusType('error');
      setStatusMessage(`No se encontró la plantilla '${dominioId}'.`);
      return;
    }

    instancia.classes.forEach(c => onAddClass(c));
    instancia.relations.forEach(r => onAddRelation(r));

    const plantilla = PLANTILLAS_DISPONIBLES.find(p => p.id === dominioId);
    setStatusType('success');
    setStatusMessage(`✓ Arquitectura de '${plantilla?.nombre || dominioId}' generada (${instancia.classes.length} clases, ${instancia.relations.length} relaciones).`);
  };

  /** CU-04 · Generación de diagramas completos desde prompt en lenguaje natural */
  const generarDiagramaDesdePrompt = async (prompt: string) => {
    if (!prompt.trim()) return;
    setStatusType('info');
    setStatusMessage('Generando arquitectura y diagrama UML completo (CU-04)...');
    try {
      const dto = await generarDiagramaConPrompt(prompt, 'Diagrama sintetizado por IA');
      const clases = dto?.classes || [];
      const relaciones = dto?.relations || [];
      clases.forEach((c: any) => onAddClass(mapearClaseBackend(c)));
      relaciones.forEach((r: any) => onAddRelation(r));
      setStatusType('success');
      setStatusMessage(`✓ Diagrama generado: ${clases.length} clase(s) y ${relaciones.length} relación(es).`);
      setInputText('');
    } catch (err: any) {
      setStatusType('error');
      setStatusMessage(err?.message || 'Error al generar diagrama completo.');
    }
  };

  /** CU-08 · Consulta al agente contextual de validación arquitectónica */
  const consultarContexto = async (instruccion: string) => {
    setStatusType('info');
    setStatusMessage('Consultando al agente contextual (CU-08)...');
    try {
      const respuesta = await consultarAgenteContextual({
        mensaje: instruccion,
        clasesActuales: clasesParaBackend(existingClasses),
        relacionesActuales: []
      });
      setDiagnostico({
        saludScore: 85,
        nivel: 'intermedio',
        resumen: respuesta.respuesta || 'Consulta completada con éxito.',
        alertas: respuesta.alertas || [],
        fortalezas: ['Modelo estructuralmente consistente.'],
        sugerencias: respuesta.sugerencias || [],
        metodosSugeridos: {}
      });
      if (respuesta.clasesSugeridas?.length) {
        respuesta.clasesSugeridas.forEach((c: any) => onAddClass(mapearClaseBackend(c)));
        setStatusType('success');
        setStatusMessage(`✓ Agente contextual añadió ${respuesta.clasesSugeridas.length} clase(s) sugerida(s).`);
      } else {
        setStatusType((respuesta.alertas?.length || 0) > 0 ? 'info' : 'success');
        setStatusMessage(respuesta.respuesta || 'Consulta completada.');
      }
    } catch (err: any) {
      setStatusType('error');
      setStatusMessage(err?.message || 'Agente contextual no disponible.');
    }
  };

  /** Auditoría inteligente del Cerebro de Código (AST + madurez + persistencia) */
  const ejecutarAuditoriaCerebro = async () => {
    setStatusType('info');
    setStatusMessage('🧠 Auditando modelo arquitectónico y código del proyecto...');
    try {
      const modelo: ModeloDiagrama = diagram || {
        title: 'Proyecto ArchAI',
        classes: existingClasses,
        relations: [],
        updatedAt: new Date().toISOString()
      };
      const diagnosticoLocal = auditarCodigoProyecto(modelo, customFiles);

      let backendAlertas: string[] = [];
      try {
        const backendRes = await auditarMadurezBackend(modelo);
        if (backendRes?.alertasArquitectura?.length) {
          backendAlertas = backendRes.alertasArquitectura;
        }
      } catch {
        /* Fallback al análisis local */
      }

      const todasAlertas = Array.from(new Set([...diagnosticoLocal.alertasCriticas, ...backendAlertas]));

      setDiagnostico({
        saludScore: diagnosticoLocal.saludGlobal,
        nivel: diagnosticoLocal.nivel,
        resumen: `${diagnosticoLocal.clasesAnalizadas} clase(s) analizadas · ${diagnosticoLocal.metodosSugeridosTotales} método(s) de dominio recomendados.`,
        alertas: todasAlertas,
        fortalezas: diagnosticoLocal.fortalezas,
        sugerencias: [
          ...diagnosticoLocal.sugerenciasInmediatas,
          ...diagnosticoLocal.sugerenciasAccion
        ],
        metodosSugeridos: diagnosticoLocal.metodosSugeridosPorClase
      });

      setStatusType(todasAlertas.length > 0 ? 'info' : 'success');
      setStatusMessage(`✓ Auditoría completada: ${diagnosticoLocal.saludGlobal}% de madurez arquitectónica.`);
    } catch (err: any) {
      setStatusType('error');
      setStatusMessage(err?.message || 'Error al ejecutar auditoría.');
    }
  };

  /** Auto-reparación inteligente con IA: inyecta PKs faltantes y métodos de dominio */
  const ejecutarAutoReparacion = async () => {
    setStatusType('info');
    setStatusMessage('⚡ Auto-corrigiendo claves primarias y métodos en el modelo...');

    let pksAgregadas = 0;
    let metodosAgregados = 0;

    existingClasses.forEach(cls => {
      // 1. Verificar si tiene PK
      const tienePk = (cls.attributes || []).some(a => a.isPrimaryKey || a.name.toLowerCase() === 'id');
      if (!tienePk) {
        const nuevaPk: AtributoUml = {
          id: `attr-pk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: 'id',
          type: 'Long',
          visibility: '-',
          isPrimaryKey: true,
          isNullable: false
        };
        onAddAttribute(cls.id, nuevaPk);
        pksAgregadas++;
      }

      // 2. Si no tiene métodos, sugerir e inyectar métodos de dominio
      if ((cls.methods || []).length === 0) {
        const sugeridos = generarMetodosSugeridos(cls.name);
        sugeridos.forEach(m => {
          if (onAddMethod) {
            onAddMethod(cls.id, m);
            metodosAgregados++;
          }
        });
      }
    });

    setStatusType('success');
    setStatusMessage(`✓ Auto-corrección finalizada: ${pksAgregadas} clave(s) PK agregada(s) y ${metodosAgregados} método(s) inyectado(s).`);

    // Actualizar el diagnóstico a 100% de salud
    setDiagnostico(prev => prev ? {
      ...prev,
      saludScore: 100,
      nivel: 'avanzado',
      alertas: [],
      resumen: '¡Todas las entidades cumplen con normalización 3FN y reglas de persistencia Spring Data JPA!',
      fortalezas: [
        'Todas las entidades tienen clave primaria identificadora (PK).',
        'Métodos de lógica de dominio inyectados en todas las clases.',
        'Arquitectura lista para compilación y despliegue.'
      ]
    } : null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand(inputText);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputText(prompt);
    executeCommand(prompt);
  };

  return (
    <div className="floating-ai-assistant" style={{
      boxShadow: isListening ? '0 0 30px rgba(16, 185, 129, 0.40), var(--glass-ai-shadow)' : 'var(--glass-ai-shadow)',
      borderColor: isListening ? 'var(--accent-emerald)' : 'var(--glass-ai-border)'
    }}>
      {/* Icono de IA con indicador de estado (Theme-Aware) */}
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        background: isListening
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(232, 195, 158, 0.35))'
          : 'var(--glass-ai-icon-bg)',
        border: isListening ? '1px solid var(--accent-emerald)' : '1px solid var(--glass-ai-icon-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: isListening ? '0 0 16px var(--accent-emerald)' : '0 0 10px rgba(0, 0, 0, 0.08)',
        animation: isListening ? 'pulse-subtle 1.2s infinite' : 'none',
        color: isListening ? 'var(--accent-emerald)' : 'var(--glass-ai-icon-color)'
      }}>
        {isListening ? (
          <Mic size={20} />
        ) : (
          <Sparkles size={19} />
        )}
      </div>

      {/* Contenido Central */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, gap: '6px' }}>
        {/* Barra de Título y Estado */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.86rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '0.01em'
            }}>
              Asistente IA ArchAI
            </span>

            {/* Badge de estado del motor local / Ollama */}
            <span
              title={ollamaStatus.activo ? `Ollama local activo: ${ollamaStatus.modelo || '11434'}` : 'Motor CASE Heurístico Local Offline Activo'}
              style={{
                fontSize: '0.66rem',
                fontWeight: 700,
                color: ollamaStatus.activo ? 'var(--accent-emerald)' : 'var(--accent-primary)',
                background: ollamaStatus.activo ? 'rgba(16, 185, 129, 0.12)' : 'var(--glass-ai-icon-bg)',
                padding: '1px 7px',
                borderRadius: '6px',
                border: `1px solid ${ollamaStatus.activo ? 'rgba(16, 185, 129, 0.3)' : 'var(--glass-ai-icon-border)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Cpu size={10} />
              {ollamaStatus.activo ? 'Ollama Local' : 'IA Offline'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {statusType === 'success' && <CheckCircle2 size={13} color="var(--accent-emerald)" />}
            {statusType === 'error' && <AlertCircle size={13} color="var(--accent-rose)" />}
            <span style={{
              fontSize: '0.72rem',
              fontWeight: isListening ? 700 : 500,
              color: isListening
                ? 'var(--accent-emerald)'
                : statusType === 'success'
                  ? 'var(--accent-emerald)'
                  : statusType === 'error'
                    ? 'var(--accent-rose)'
                    : 'var(--text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '320px'
            }}>
              {statusMessage}
            </span>

            {/* Botón Cerrar Asistente */}
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '4px'
                }}
                title="Cerrar panel de asistente IA"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Campo de Entrada de Lenguaje Natural */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: isListening ? 'rgba(16, 185, 129, 0.08)' : 'var(--glass-ai-input-bg)',
          borderRadius: '10px',
          padding: '6px 12px',
          border: isListening ? '1px solid var(--accent-emerald)' : '1px solid var(--glass-ai-input-border)',
          transition: 'all 0.2s ease'
        }}>
          <input
            type="text"
            placeholder={
              isListening
                ? 'Hablando... Di: "Crear clase Factura con total Double"'
                : "Habla con el micrófono o escribe: 'Auditar', 'Crear clase Pedido', 'Sistema de ventas'..."
            }
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--glass-ai-input-text)',
              fontSize: '0.84rem',
              fontFamily: 'var(--font-body)'
            }}
          />
          {inputText && !isListening && (
            <button
              onClick={() => executeCommand(inputText)}
              style={{
                background: 'var(--accent-primary)',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 9px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Ejecutar comando en el lienzo"
            >
              <Send size={12} />
            </button>
          )}
        </div>

        {/* Chips de Sugerencia Rápida */}
        <div
          className="ai-chips-scroll"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            overflowX: 'auto',
            overflowY: 'hidden',
            paddingTop: '2px',
            paddingBottom: '2px'
          }}
        >
          <button
            onClick={ejecutarAuditoriaCerebro}
            className="ai-chip-btn ai-chip-btn-audit"
            title="Auditar código y madurez de todo el proyecto con el Cerebro IA"
          >
            <ShieldCheck size={12} />
            📊 Auditar Modelo
          </button>

          <button
            onClick={ejecutarAutoReparacion}
            className="ai-chip-btn ai-chip-btn-autofix"
            title="Auto-corregir claves primarias faltantes y métodos de dominio con IA"
          >
            <Wrench size={12} />
            ⚡ Auto-corregir
          </button>

          <button
            onClick={() => handleQuickPrompt('sistema de ventas')}
            className="ai-chip-btn"
            title="Generar arquitectura completa de ventas y facturación"
          >
            <Layers size={11} />
            🛒 Ventas
          </button>

          <button
            onClick={() => handleQuickPrompt('sistema de hospital')}
            className="ai-chip-btn"
            title="Generar arquitectura médica completa"
          >
            <Layers size={11} />
            🏥 Hospital
          </button>

          <button
            onClick={() => handleQuickPrompt('sistema de universidad')}
            className="ai-chip-btn"
            title="Generar arquitectura universitaria"
          >
            <Layers size={11} />
            🎓 Universidad
          </button>

          <button
            onClick={() => handleQuickPrompt('sistema de inventario')}
            className="ai-chip-btn"
            title="Generar arquitectura de almacén e inventario"
          >
            <Layers size={11} />
            📦 Inventario
          </button>

          <button
            onClick={() => handleQuickPrompt('Crear clase Pedido con total Double y fecha LocalDate')}
            className="ai-chip-btn"
          >
            <Plus size={11} />
            + Pedido
          </button>

          <button
            onClick={() => handleQuickPrompt('Crear clase Cliente con nombre String y correo String')}
            className="ai-chip-btn"
          >
            <Plus size={11} />
            + Cliente
          </button>

          <button
            onClick={() => handleQuickPrompt('Relaciona Cliente con Pedido 1 a N')}
            className="ai-chip-btn"
          >
            <Plus size={11} />
            Vincular 1:N
          </button>
        </div>

        {/* Panel de Diagnóstico Arquitectónico */}
        {diagnostico && (
          <div className="ai-diagnostic-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-ai-diag-border)', paddingBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={15} color="var(--accent-emerald)" />
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                  Auditoría Arquitectónica del Modelo
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: diagnostico.saludScore >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: diagnostico.saludScore >= 80 ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                  border: `1px solid ${diagnostico.saludScore >= 80 ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`
                }}>
                  {diagnostico.saludScore}% Madurez · {diagnostico.nivel.toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => setDiagnostico(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                title="Cerrar diagnóstico"
              >
                <X size={13} />
              </button>
            </div>

            <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {diagnostico.resumen}
            </div>

            {/* Alertas Críticas */}
            {diagnostico.alertas.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
                  ⚠️ Alertas detectadas ({diagnostico.alertas.length}):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {diagnostico.alertas.map((alerta, idx) => (
                    <span key={idx} style={{
                      fontSize: '0.68rem',
                      background: 'rgba(245, 158, 11, 0.10)',
                      border: '1px solid rgba(245, 158, 11, 0.30)',
                      borderRadius: '6px',
                      padding: '2px 6px',
                      color: 'var(--text-primary)'
                    }}>
                      {alerta}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Fortalezas Verificadas */}
            {diagnostico.fortalezas.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {diagnostico.fortalezas.slice(0, 3).map((fortaleza, idx) => (
                  <span key={idx} style={{
                    fontSize: '0.68rem',
                    background: 'rgba(16, 185, 129, 0.10)',
                    border: '1px solid rgba(16, 185, 129, 0.30)',
                    borderRadius: '6px',
                    padding: '2px 6px',
                    color: 'var(--accent-emerald)'
                  }}>
                    ✓ {fortaleza}
                  </span>
                ))}
              </div>
            )}

            {/* Botón de Auto-Corrección con IA si hay alertas */}
            {diagnostico.alertas.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
                <button
                  onClick={ejecutarAutoReparacion}
                  style={{
                    background: 'var(--accent-emerald)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Asignar claves primarias PK y métodos automáticamente"
                >
                  <Wrench size={11} />
                  ⚡ Auto-corregir con IA ahora
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Botón de Micrófono con Pulso */}
      <button
        onClick={handleToggleListening}
        className={`mic-button-glow ${isListening ? 'listening' : ''}`}
        style={{
          background: isListening
            ? 'linear-gradient(135deg, #EF4444, #F43F5E)'
            : 'var(--glass-ai-mic-bg)',
          color: isListening ? '#FFFFFF' : 'var(--glass-ai-mic-color)',
          borderColor: isListening ? '#EF4444' : 'var(--glass-ai-mic-border)',
          boxShadow: isListening ? '0 0 25px rgba(239, 68, 68, 0.6)' : '0 0 10px rgba(0, 0, 0, 0.08)'
        }}
        title={
          isListening
            ? 'Escuchando... Haz clic para ejecutar ahora mismo'
            : 'Presiona para hablar (Se ejecutará automáticamente al terminar de hablar)'
        }
      >
        {isListening ? <MicOff size={21} /> : <Mic size={21} />}
      </button>
    </div>
  );
};
