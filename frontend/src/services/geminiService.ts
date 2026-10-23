/**
 * ─────────────────────────────────────────────────────────────
 * GEMINI (GOOGLE AI) — Motor de IA en la nube por tokens
 * ─────────────────────────────────────────────────────────────
 * Proveedor PRINCIPAL del agente cuando hay clave configurada
 * (VITE_GEMINI_API_KEY en frontend/.env). No consume RAM local y
 * garantiza salida JSON estructurada (responseMimeType json).
 * Ollama local queda como fallback offline automático (ver
 * ollamaService.ts y agenteDiagrama.ts).
 */

export function obtenerGeminiApiKey(): string {
  return (
    (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim() ||
    (typeof window !== 'undefined' ? (window as any)?.__ARCHAI_GEMINI_KEY || localStorage.getItem('archai_gemini_api_key') : '') ||
    ''
  ).trim();
}

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

/** Modelo por defecto; se puede cambiar con VITE_GEMINI_MODEL. */
export const MODELO_GEMINI = (import.meta.env.VITE_GEMINI_MODEL as string | undefined)?.trim() || 'gemini-flash-latest';

/** ¿Hay clave de Gemini configurada en el entorno? */
export function geminiDisponible(): boolean {
  return obtenerGeminiApiKey().length > 0;
}

/** Verifica que la clave sea válida (GET /models). No consume tokens. */
export async function verificarEstadoGemini(timeoutMs = 2500): Promise<{ online: boolean; model: string | null }> {
  const apiKey = obtenerGeminiApiKey();
  if (!apiKey) return { online: false, model: null };
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${BASE_URL}/models?key=${encodeURIComponent(apiKey)}`, { signal: controller.signal });
    clearTimeout(tid);
    if (res.ok) return { online: true, model: MODELO_GEMINI };
  } catch {
    /* sin conexión o clave inválida → reportar offline */
  }
  return { online: false, model: null };
}

interface ConfiguracionGeneracion {
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: 'application/json' | 'text/plain';
}

/**
 * Llamada generativa a Gemini. Devuelve el texto de la primera candidata
 * o null si falla (red, clave, 429, JSON vacío...).
 */
export async function generarContenidoGemini(
  prompt: string,
  systemPrompt: string,
  config: ConfiguracionGeneracion = {},
  timeoutMs = 120000
): Promise<string | null> {
  const apiKey = obtenerGeminiApiKey();
  if (!apiKey) return null;

  const payload = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: config.temperature ?? 0.2,
      maxOutputTokens: config.maxOutputTokens ?? 1500,
      ...(config.responseMimeType ? { responseMimeType: config.responseMimeType } : {})
    }
  };

  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(
      `${BASE_URL}/models/${MODELO_GEMINI}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      }
    );
    clearTimeout(tid);
    if (!res.ok) return null;

    const data = await res.json();
    const parts: any[] = data?.candidates?.[0]?.content?.parts || [];
    const texto = parts.map((p: any) => (typeof p?.text === 'string' ? p.text : '')).join('').trim();
    return texto || null;
  } catch {
    return null;
  }
}

/**
 * Chat libre del asistente (saludos / ayuda / preguntas / arquitectura) en español con Gemini.
 */
export async function generarRespuestaGemini(
  prompt: string,
  contextoDiagrama?: string,
  timeoutMs = 20000
): Promise<{ text: string; success: boolean }> {
  const systemMessage = `Eres ArchAI Assistant, el copiloto oficial de inteligencia artificial de ArchAI Studio (Herramienta CASE Colaborativa para modelado de arquitecturas UML 2.5 y backend Spring Boot 3).
Tu rol es asistir al arquitecto/usuario en el chat con recomendaciones técnicas precisas, explicaciones claras de modelado y respuestas profesionales.
${contextoDiagrama ? `Contexto del diagrama UML actual en el lienzo: ${contextoDiagrama}` : ''}
Pautas para tus respuestas:
1. Responde siempre en español, con un tono amable, experto, directo y profesional.
2. Si te preguntan sobre UML, patrones de diseño, relaciones (1:N, N:M, clases asociativas en T, herencia, composición) o persistencia JPA, responde con rigor técnico UML 2.5.
3. Si el usuario te saluda, salúdalo con calidez e infórmale brevemente de lo que puedes hacer:
   - Diseñar sistemas completos (ej.: "Crea un sistema de ventas", "Crea un sistema de clínica").
   - Modificar el lienzo actual (ej.: "Agrega una clase Factura con total Double", "Agrega un método calcularTotal a Venta").
   - Auditar calidad y normalización (ej.: "Auditar modelo", "Auto-corregir").
4. Mantén las respuestas fluidas y concisas (2 a 4 oraciones claras), salvo que el usuario pida una explicación detallada o una comparativa de arquitectura.`;

  const texto = await generarContenidoGemini(
    prompt,
    systemMessage,
    { temperature: 0.6, maxOutputTokens: 800 },
    timeoutMs
  );
  return texto ? { text: texto, success: true } : { text: '', success: false };
}