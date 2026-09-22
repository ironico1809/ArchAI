import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Sparkles, 
  Send, 
  Terminal, 
  Lightbulb,
  Bot,
  User
} from 'lucide-react';
import { ClaseUml, RelacionUml } from '../../types/uml';
import { parseNaturalLanguageCommand, ParseResult } from '../../services/aiVoiceParser';
import { GlassChatBubble } from '../glass/GlassChatBubble';

interface VoiceAgentWidgetProps {
  existingClasses: ClaseUml[];
  onAddClass: (newClass: ClaseUml) => void;
  onAddAttribute: (className: string, attribute: any) => void;
  onAddRelation: (relation: RelacionUml) => void;
}

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'user' | 'agent' | 'success' | 'error';
  text: string;
}

export const VoiceAgentWidget: React.FC<VoiceAgentWidgetProps> = ({
  existingClasses,
  onAddClass,
  onAddAttribute,
  onAddRelation
}) => {
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'agent',
      text: '🤖 Asistente IA Local activo. Dicta por voz o escribe en lenguaje natural para modelar el Diagrama UML 2.5.'
    }
  ]);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'es-ES';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setInputText(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Tu navegador no soporta Web Speech API. Puedes escribir tus comandos directamente en la caja de texto.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInputText('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleExecuteCommand = (commandToRun?: string) => {
    const text = (commandToRun || inputText).trim();
    if (!text) return;

    // Log de entrada del usuario
    const userLog: LogEntry = {
      id: 'usr-' + Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'user',
      text: text
    };

    // Procesar con el parser local NLP
    const result: ParseResult = parseNaturalLanguageCommand(text, existingClasses);

    const agentLog: LogEntry = {
      id: 'ai-' + Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: result.success ? 'success' : 'error',
      text: result.reasoning
    };

    setLogs(prev => [userLog, agentLog, ...prev.slice(0, 7)]);

    if (result.success) {
      if (result.action === 'CREATE_CLASS' && result.createdClass) {
        onAddClass(result.createdClass);
      } else if (result.action === 'ADD_ATTRIBUTE' && result.targetClassName && result.newAttribute) {
        onAddAttribute(result.targetClassName, result.newAttribute);
      } else if (result.action === 'CREATE_RELATION' && result.newRelation) {
        onAddRelation(result.newRelation);
      }
    }

    setInputText('');
  };

  const QUICK_PROMPTS = [
    'Crear clase Paciente con id Long, nombre String, edad Integer y telefono String',
    'Crear clase Medico con id Long, nombre String, especialidad String y colegiatura Integer',
    'Crear clase Factura con numero String, total Double y fecha LocalDate',
    'Relacionar Medico con Paciente'
  ];

  return (
    <div className="glass-card" style={{
      padding: '28px 32px',
      marginBottom: '26px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--glass-accent-secondary), var(--glass-accent))',
            padding: '10px',
            borderRadius: '14px',
            boxShadow: 'var(--glow-cyan)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            color: '#ffffff'
          }}>
            <Sparkles size={22} />
          </div>
          <div>
            <h3 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.25rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)'
            }}>
              Asistente por Voz e <span className="gradient-text">IA Local</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Dicta comandos para modelar el diagrama sin conexión a internet (Examen Offline)
            </p>
          </div>
        </div>

        {/* Voice Recognition Pulse Button */}
        <button
          onClick={toggleListening}
          className={isListening ? 'glass-button-pill mic-recording-pulse' : 'glass-button-pill'}
          style={{
            padding: '10px 22px',
            fontSize: '0.88rem'
          }}
        >
          {isListening ? (
            <>
              <Mic size={18} /> Escuchando... (Haz clic para parar)
            </>
          ) : (
            <>
              <Mic size={18} /> Dictar Comando de Voz
            </>
          )}
        </button>
      </div>

      {/* Input Box & Action */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '18px' }}>
        <input
          type="text"
          className="glass-textfield"
          placeholder="Escribe o dicta: 'Crea la clase Paciente con id Long y nombre String'..."
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleExecuteCommand();
          }}
          style={{ fontSize: '0.95rem' }}
        />
        <button
          className="glass-button-pill"
          onClick={() => handleExecuteCommand()}
          disabled={!inputText.trim()}
          style={{ padding: '0 26px', flexShrink: 0 }}
        >
          <Send size={16} /> Procesar
        </button>
      </div>

      {/* Quick Prompt Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '22px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          <Lightbulb size={14} color="var(--glass-warning)" /> Prompts rápidos:
        </span>
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleExecuteCommand(prompt)}
            className="glass-button-secondary"
            style={{
              padding: '5px 14px',
              fontSize: '0.78rem',
              borderRadius: 'var(--radius-full)'
            }}
          >
            + {prompt}
          </button>
        ))}
      </div>

      {/* Chat Bubbles Feed (Asymmetric Corners) */}
      <div style={{
        background: 'var(--glass-surface)',
        backdropFilter: 'var(--glass-blur-sm)',
        border: '1px solid var(--glass-border-color)',
        borderRadius: 'var(--radius-xl)',
        padding: '16px 20px',
        maxHeight: '220px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '12px', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
          <Terminal size={14} /> CONSOLA DE INTERACCIÓN Y RAZONAMIENTO DEL AGENTE CASE
        </div>
        
        {logs.map(log => (
          <GlassChatBubble
            key={log.id}
            isUser={log.type === 'user'}
            timestamp={log.timestamp}
            userIcon={<User size={16} color="#FFFFFF" />}
            aiIcon={<Bot size={16} color="var(--glass-accent)" />}
          >
            {log.text}
          </GlassChatBubble>
        ))}
      </div>
    </div>
  );
};
