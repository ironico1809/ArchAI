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
  Volume2,
  VolumeX,
  Cpu
} from 'lucide-react';
import { ClaseUml, AtributoUml, RelacionUml, ModeloDiagrama } from '../../types/uml';
import { parseNaturalLanguageCommand } from '../../services/aiVoiceParser';
import { analizarComandoVoz, consultarAgenteContextual, generarDiagramaConPrompt, auditarMadurezBackend } from '../../services/api';
import { auditarCodigoProyecto } from '../../services/projectBrainService';

interface FloatingAiAssistantProps {
  existingClasses: ClaseUml[];
  diagram?: ModeloDiagrama;
  customFiles?: Record<string, string>;
  onAddClass: (newClass: ClaseUml) => void;
  onAddAttribute: (classId: string, attr: AtributoUml) => void;
  onAddRelation: (relation: RelacionUml) => void;
  onOpenWhiteboard?: () => void;
  onOpenCodeDock?: () => void;
  onClose?: () => void;
}

export const FloatingAiAssistant: React.FC<FloatingAiAssistantProps> = ({
  existingClasses,
  diagram,
  customFiles,
  onAddClass,
  onAddAttribute,
  onAddRelation,
  onOpenWhiteboard,
  onOpenCodeDock,
  onClose
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>(
    'Listo: haz clic en el micrófono y habla, o escribe un comando.'
  );
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error'>('info');
  const [recognitionSupported, setRecognitionSupported] = useState<boolean>(true);
  const [voiceFeedbackEnabled, setVoiceFeedbackEnabled] = useState<boolean>(true);
  const [ollamaStatus, setOllamaStatus] = useState<{ activo: boolean; modelo: string | null }>({
    activo: false,
    modelo: null
  });

  const [diagnostico, setDiagnostico] = useState<{
    respuesta: string;
    alertas: string[];
    sugerencias: string[];
  } | null>(null);

  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');
  const silenceTimerRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);

  // Mantener isListeningRef sincronizado para cierres asíncronos
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

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

  // Sintetizador de voz (Text-to-Speech) para confirmación auditiva
  const hablarRespuesta = (texto: string) => {
    if (!voiceFeedbackEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(texto);
      utterance.lang = 'es-ES';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const spanishVoice = voices.find(v => v.lang.startsWith('es'));
      if (spanishVoice) utterance.voice = spanishVoice;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Error en síntesis de voz:', e);
    }
  };

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
        setStatusMessage('🎙️ Escuchando... Habla y se creará automáticamente.');
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

        // Detección inteligente de silencio: si el usuario deja de hablar por 1 segundo, ejecuta automáticamente
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
        // Si al terminar quedó una transcripción acumulada, ejecutarla automáticamente
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
      // Usuario hace clic mientras escucha: forzar ejecución inmediata de lo que haya dicho
      finalizarYEjecutarVoz();
    } else {
      setInputText('');
      transcriptRef.current = '';
      setStatusType('info');
      setStatusMessage('🎙️ Escuchando... Di: "Crear clase Factura con total Double"');
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error('Error al iniciar reconocimiento de voz:', err);
      }
    }
  };

  const mapearClaseBackend = (c: any): ClaseUml => ({
    id: c.id,
    name: c.name,
    stereotype: c.stereotype || 'Entity',
    position: c.position || { x: 200 + Math.random() * 200, y: 180 + Math.random() * 150 },
    attributes: (c.attributes || []).map((a: any) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      visibility: a.visibility,
      isPrimaryKey: a.isPrimaryKey,
      isNullable: a.isNullable
    })),
    methods: (c.methods || []).map((m: any) => ({
      id: m.id,
      name: m.name,
      returnType: m.returnType,
      visibility: m.visibility,
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

    // 0. Evaluar meta-comandos locales en el analizador
    const localResult = parseNaturalLanguageCommand(cleanText, existingClasses);

    if (/auditar|madurez|cerebro|diagnostico|salud/i.test(cleanText)) {
      await ejecutarAuditoriaCerebro();
      setInputText('');
      return;
    }

    if (localResult.action === 'VALIDATE_MODEL') {
      await consultarContexto('validar el modelo y normalización 3FN');
      hablarRespuesta('Auditoría del modelo UML completada.');
      setInputText('');
      return;
    }

    if (localResult.action === 'SUMMARY_MODEL') {
      await consultarContexto('resumen del modelo y arquitectura');
      hablarRespuesta('Resumen conceptual generado.');
      setInputText('');
      return;
    }

    if (localResult.action === 'OPEN_WHITEBOARD') {
      onOpenWhiteboard?.();
      setStatusType('success');
      setStatusMessage('✓ Escáner de pizarra física abierto (CU-07).');
      hablarRespuesta('Abriendo escáner de pizarra.');
      setInputText('');
      return;
    }

    if (localResult.action === 'OPEN_CODE_DOCK') {
      onOpenCodeDock?.();
      setStatusType('success');
      setStatusMessage('✓ Panel de código Spring Boot abierto (CU-10 / CU-14).');
      hablarRespuesta('Abriendo generador de código Spring Boot.');
      setInputText('');
      return;
    }

    if (localResult.action === 'GENERATE_DIAGRAM' && localResult.rawPrompt) {
      await generarDiagramaDesdePrompt(localResult.rawPrompt);
      return;
    }

    // 1. Intentar primero con el servicio del backend Spring Boot (CU-06)
    try {
      const response = await analizarComandoVoz(cleanText);
      if (response && response.success) {
        if (response.action === 'CREATE_CLASS' && response.createdClass) {
          const nuevaClase = mapearClaseBackend(response.createdClass);
          onAddClass(nuevaClase);
          setStatusType('success');
          setStatusMessage(`✓ Clase '${nuevaClase.name}' creada en el lienzo.`);
          hablarRespuesta(`Clase ${nuevaClase.name} creada con éxito.`);
        } else if (response.action === 'ADD_ATTRIBUTE' && response.createdAttribute) {
          const target = existingClasses.find(c =>
            c.name.toLowerCase() === (response.targetClassName || '').toLowerCase()
          );
          const classId = target ? target.id : (existingClasses[0]?.id || 'cls-product');
          onAddAttribute(classId, response.createdAttribute);
          setStatusType('success');
          setStatusMessage(`✓ Atributo '+${response.createdAttribute.name}: ${response.createdAttribute.type}' añadido.`);
          hablarRespuesta(`Atributo ${response.createdAttribute.name} añadido a la clase.`);
        } else if (response.action === 'ADD_RELATION' && response.createdRelation) {
          onAddRelation(response.createdRelation);
          setStatusType('success');
          setStatusMessage('✓ Relación creada por la IA.');
          hablarRespuesta('Relación entre entidades creada con éxito.');
        } else {
          setStatusType('success');
          setStatusMessage(response.message || 'Comando ejecutado con éxito.');
        }
        setInputText('');
        return;
      }
    } catch (err) {
      console.warn('Servicio IA de Spring Boot no disponible, usando motor local del cliente:', err);
    }

    // 2. Fallback de alta velocidad: Motor Heurístico Local del Navegador
    if (localResult.success) {
      if (localResult.action === 'CREATE_CLASS' && localResult.createdClass) {
        onAddClass(localResult.createdClass);
        setStatusType('success');
        setStatusMessage(`✓ Clase '${localResult.createdClass.name}' generada por la IA Local.`);
        hablarRespuesta(`Clase ${localResult.createdClass.name} creada con éxito.`);
      } else if (localResult.action === 'ADD_ATTRIBUTE' && localResult.newAttribute) {
        const targetCls = existingClasses.find(c =>
          c.name.toLowerCase() === localResult.targetClassName?.toLowerCase()
        );
        const classId = targetCls ? targetCls.id : (existingClasses[0]?.id || 'cls-product');
        onAddAttribute(classId, localResult.newAttribute);
        setStatusType('success');
        setStatusMessage(`✓ Atributo '+${localResult.newAttribute.name}: ${localResult.newAttribute.type}' añadido.`);
        hablarRespuesta(`Atributo ${localResult.newAttribute.name} añadido.`);
      } else if (localResult.action === 'CREATE_RELATION' && localResult.newRelation) {
        onAddRelation(localResult.newRelation);
        setStatusType('success');
        setStatusMessage(`✓ Relación creada (${localResult.newRelation.label || '1:N'}).`);
        hablarRespuesta('Relación creada entre las entidades.');
      }
      setInputText('');
    } else {
      setStatusType('error');
      setStatusMessage(localResult.message || 'Comando no reconocido. Prueba: "crear clase Factura con total Double"');
      hablarRespuesta('No reconocí el comando. Prueba diciendo: crear clase Factura con total Double.');
    }
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
      hablarRespuesta(`Diagrama generado con ${clases.length} clases y ${relaciones.length} relaciones.`);
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
        respuesta: respuesta.respuesta || 'Consulta completada.',
        alertas: respuesta.alertas || [],
        sugerencias: respuesta.sugerencias || []
      });
      if (respuesta.clasesSugeridas?.length) {
        respuesta.clasesSugeridas.forEach((c: any) => onAddClass(mapearClaseBackend(c)));
        setStatusType('success');
        setStatusMessage(`✓ Agente contextual añadió ${respuesta.clasesSugeridas.length} clase(s) sugerida(s).`);
      } else {
        setStatusType((respuesta.alertas?.length || 0) > 0 ? 'error' : 'success');
        setStatusMessage(respuesta.respuesta || 'Consulta completada.');
      }
    } catch (err: any) {
      setStatusType('error');
      setStatusMessage(err?.message || 'Agente contextual no disponible.');
    }
  };

  /** Auditoría inteligente del Cerebro de Código (AST + madurez + archivos modificados) */
  const ejecutarAuditoriaCerebro = async () => {
    setStatusType('info');
    setStatusMessage('🧠 Auditando código y madurez arquitectónica del proyecto...');
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
        // Fallback al análisis local
      }

      const todasAlertas = Array.from(new Set([...diagnosticoLocal.alertasCriticas, ...backendAlertas]));

      setDiagnostico({
        respuesta: `🧠 AUDITORÍA DEL CEREBRO DE CÓDIGO (Salud: ${diagnosticoLocal.saludGlobal}% · Nivel ${diagnosticoLocal.nivel.toUpperCase()})\n` +
          `• ${diagnosticoLocal.clasesAnalizadas} clases analizadas | ${diagnosticoLocal.archivosModificados} archivo(s) editado(s) por el equipo\n` +
          `• ${diagnosticoLocal.metodosSugeridosTotales} métodos sugeridos listos para autocompletar.`,
        alertas: todasAlertas,
        sugerencias: [
          ...diagnosticoLocal.fortalezas,
          ...diagnosticoLocal.sugerenciasAccion
        ]
      });

      setStatusType(todasAlertas.length > 0 ? 'info' : 'success');
      setStatusMessage(`✓ Auditoría de código completada (${diagnosticoLocal.saludGlobal}% de madurez arquitectónica).`);
      hablarRespuesta(`Auditoría completada. La salud global del código es del ${diagnosticoLocal.saludGlobal} por ciento.`);
    } catch (err: any) {
      setStatusType('error');
      setStatusMessage(err?.message || 'Error al ejecutar auditoría del cerebro de código.');
    }
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
      boxShadow: isListening ? '0 0 30px rgba(6, 182, 212, 0.45), var(--glass-ai-shadow)' : 'var(--glass-ai-shadow)',
      borderColor: isListening ? 'rgba(6, 182, 212, 0.6)' : 'var(--glass-ai-border)'
    }}>
      {/* Icono de IA con indicador de estado */}
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        background: isListening
          ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.35), rgba(139, 92, 246, 0.35))'
          : 'rgba(6, 182, 212, 0.15)',
        border: isListening ? '1px solid var(--accent-cyan)' : '1px solid rgba(6, 182, 212, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: isListening ? '0 0 16px var(--accent-cyan)' : '0 0 12px rgba(6, 182, 212, 0.25)',
        animation: isListening ? 'pulse-subtle 1.2s infinite' : 'none'
      }}>
        {isListening ? (
          <Mic size={20} color="var(--accent-cyan)" />
        ) : (
          <Sparkles size={19} color="var(--accent-cyan)" />
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
              Asistente IA por Voz
            </span>

            {/* Badge de estado del motor local / Ollama */}
            <span
              title={ollamaStatus.activo ? `Ollama local activo: ${ollamaStatus.modelo || '11434'}` : 'Motor CASE Heurístico Local Offline Activo'}
              style={{
                fontSize: '0.66rem',
                fontWeight: 700,
                color: ollamaStatus.activo ? '#10B981' : 'var(--accent-cyan)',
                background: ollamaStatus.activo ? 'rgba(16, 185, 129, 0.12)' : 'rgba(56, 189, 248, 0.12)',
                padding: '1px 7px',
                borderRadius: '6px',
                border: `1px solid ${ollamaStatus.activo ? 'rgba(16, 185, 129, 0.3)' : 'rgba(56, 189, 248, 0.25)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Cpu size={10} />
              {ollamaStatus.activo ? 'Ollama Local' : 'IA Local (Offline)'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {statusType === 'success' && <CheckCircle2 size={13} color="var(--accent-emerald)" />}
            {statusType === 'error' && <AlertCircle size={13} color="var(--accent-rose)" />}
            <span style={{
              fontSize: '0.72rem',
              fontWeight: isListening ? 700 : 500,
              color: isListening
                ? 'var(--accent-cyan)'
                : statusType === 'success'
                  ? 'var(--accent-emerald)'
                  : statusType === 'error'
                    ? 'var(--accent-rose)'
                    : 'var(--text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '280px'
            }}>
              {statusMessage}
            </span>

            {/* Alternador de Voz (TTS) */}
            <button
              onClick={() => setVoiceFeedbackEnabled(!voiceFeedbackEnabled)}
              style={{
                background: 'transparent',
                border: 'none',
                color: voiceFeedbackEnabled ? 'var(--accent-cyan)' : 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
              title={voiceFeedbackEnabled ? 'Voz activada (La IA hablará de vuelta). Clic para silenciar' : 'Voz silenciada. Clic para activar'}
            >
              {voiceFeedbackEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>

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

        {/* Campo de Entrada de Lenguaje Natural con onda visual al hablar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: isListening ? 'rgba(6, 182, 212, 0.08)' : 'var(--glass-ai-input-bg)',
          borderRadius: '10px',
          padding: '6px 12px',
          border: isListening ? '1px solid var(--accent-cyan)' : '1px solid var(--glass-ai-input-border)',
          transition: 'all 0.2s ease'
        }}>
          <input
            type="text"
            placeholder={
              isListening
                ? 'Hablando... Di: "Crear clase Factura con total Double"'
                : "Habla con el micrófono o escribe: 'Crear clase Pedido con total Double'..."
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
                color: '#ffffff',
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
            paddingTop: '4px',
            paddingBottom: '4px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          <button
            onClick={ejecutarAuditoriaCerebro}
            className="ai-chip-btn"
            style={{
              background: 'rgba(6, 182, 212, 0.18)',
              border: '1px solid rgba(6, 182, 212, 0.45)',
              borderRadius: '7px',
              padding: '4px 10px',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--accent-cyan)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
            title="Auditar código y madurez de todo el proyecto con el Cerebro IA"
          >
            <Sparkles size={11} />
            📊 Auditar Código
          </button>

          <button
            onClick={() => handleQuickPrompt('Crear clase Pedido con total Double y fecha LocalDate')}
            className="ai-chip-btn"
            style={{
              background: 'rgba(125, 125, 125, 0.12)',
              border: '1px solid var(--glass-topbar-border)',
              borderRadius: '7px',
              padding: '4px 10px',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <Plus size={11} color="var(--accent-cyan)" />
            + Pedido (total, fecha)
          </button>

          <button
            onClick={() => handleQuickPrompt('Crear clase Cliente con nombre String y correo String')}
            className="ai-chip-btn"
            style={{
              background: 'rgba(125, 125, 125, 0.12)',
              border: '1px solid var(--glass-topbar-border)',
              borderRadius: '7px',
              padding: '4px 10px',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <Plus size={11} color="var(--accent-cyan)" />
            + Cliente (nombre, correo)
          </button>

          <button
            onClick={() => handleQuickPrompt('Relaciona Cliente con Pedido 1 a N')}
            className="ai-chip-btn"
            style={{
              background: 'rgba(125, 125, 125, 0.12)',
              border: '1px solid var(--glass-topbar-border)',
              borderRadius: '7px',
              padding: '4px 10px',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <Plus size={11} color="var(--accent-cyan)" />
            Vincular 1:N
          </button>

          <button
            onClick={() => consultarContexto('validar el modelo y normalizacion 3FN')}
            className="ai-chip-btn"
            style={{
              background: 'rgba(245, 158, 11, 0.14)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: '7px',
              padding: '4px 10px',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: '#F59E0B',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
            title="Validar el modelo con el agente contextual (CU-08)"
          >
            <CheckCircle2 size={11} />
            Validar 3FN
          </button>

          <button
            onClick={() => consultarContexto('resumen del modelo')}
            className="ai-chip-btn"
            style={{
              background: 'rgba(56, 189, 248, 0.14)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '7px',
              padding: '4px 10px',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: 'var(--accent-cyan)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
            title="Resumen del modelo con el agente contextual (CU-08)"
          >
            <Sparkles size={11} />
            Resumen IA
          </button>

          <button
            onClick={() => generarDiagramaDesdePrompt(
              'Sistema de ventas y facturacion con Cliente, Venta, DetalleVenta y Producto'
            )}
            className="ai-chip-btn"
            style={{
              background: 'rgba(139, 92, 246, 0.14)',
              border: '1px solid rgba(139, 92, 246, 0.35)',
              borderRadius: '7px',
              padding: '4px 10px',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: '#A78BFA',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
            title="Generar diagrama completo desde un prompt de negocio (CU-04)"
          >
            <Sparkles size={11} />
            Generar Ventas
          </button>
        </div>

        {/* Panel de diagnóstico del agente contextual (CU-08) */}
        {diagnostico && (
          <div style={{
            background: 'var(--glass-surface-elevated)',
            border: '1px solid var(--glass-border-color)',
            borderRadius: '10px',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            maxHeight: '150px',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'var(--font-heading)' }}>
                Diagnóstico del Agente Contextual (CU-08)
              </span>
              <button
                onClick={() => setDiagnostico(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                title="Cerrar diagnóstico"
              >
                <X size={13} />
              </button>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {diagnostico.respuesta}
            </div>
            {diagnostico.alertas.length > 0 && (
              <div style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 600 }}>
                ⚠️ {diagnostico.alertas.length} alerta(s): {diagnostico.alertas.slice(0, 3).join(' · ')}
              </div>
            )}
            {diagnostico.sugerencias.length > 0 && (
              <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                💡 Sugerencias: {diagnostico.sugerencias.slice(0, 3).join(' · ')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Botón de Micrófono con Pulso y Auto-Ejecución */}
      <button
        onClick={handleToggleListening}
        className={`mic-button-glow ${isListening ? 'listening' : ''}`}
        style={{
          background: isListening
            ? 'linear-gradient(135deg, #EF4444, #F43F5E)'
            : 'var(--glass-ai-mic-bg)',
          color: isListening ? '#FFFFFF' : 'var(--glass-ai-mic-color)',
          boxShadow: isListening ? '0 0 25px rgba(239, 68, 68, 0.6)' : '0 0 12px var(--glow-cyan)'
        }}
        title={
          isListening
            ? 'Escuchando... Haz clic para ejecutar ahora mismo'
            : 'Presiona para hablar (Se ejecutará solo al terminar de hablar)'
        }
      >
        {isListening ? <MicOff size={21} /> : <Mic size={21} />}
      </button>
    </div>
  );
};
