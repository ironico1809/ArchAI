import { geminiDisponible, verificarEstadoGemini, generarRespuestaGemini } from './geminiService';

export interface OllamaStatus {
  online: boolean;
  model: string | null;
  models: string[];
}

/**
 * Verifica si Ollama está activo en el sistema local y devuelve los modelos disponibles.
 */
export async function verificarEstadoOllama(): Promise<OllamaStatus> {
  // Motor principal en la nube: Gemini si hay clave configurada (VITE_GEMINI_API_KEY).
  // Sin clave o clave inválida/sin red → probar Ollama local como fallback.
  if (geminiDisponible()) {
    const gem = await verificarEstadoGemini();
    if (gem.online && gem.model) {
      return { online: true, model: gem.model, models: [gem.model] };
    }
  }

  const endpoints = ['/api/ollama/api/tags', 'http://127.0.0.1:11434/api/tags'];
  
  for (const ep of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(ep, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const models = (data.models || []).map((m: any) => m.name as string);
        // Priorizar qwen2.5:0.5b por velocidad y bajo consumo de memoria, o qwen2.5:3b
        const preferredModel = models.find((m: string) => m.includes('qwen2.5:0.5b')) ||
                               models.find((m: string) => m.includes('qwen2.5:3b')) ||
                               models[0] || null;
        return {
          online: true,
          model: preferredModel,
          models
        };
      }
    } catch {
      // Probar siguiente endpoint
    }
  }
  return { online: false, model: null, models: [] };
}

/**
 * Consulta a Ollama con soporte para streaming o respuesta completa en lenguaje natural.
 */
export async function generarRespuestaOllama(
  prompt: string,
  modelToUse?: string,
  contextoDiagrama?: string
): Promise<{ text: string; success: boolean }> {
  // 1) Gemini en la nube cuando hay clave configurada (evita cargar RAM local)
  if (geminiDisponible()) {
    const gem = await generarRespuestaGemini(prompt, contextoDiagrama);
    if (gem.success && gem.text) return gem;
    // Si Gemini falla (red/429/clave), seguir con Ollama local como fallback
  }

  let model = modelToUse;
  if (!model) {
    const status = await verificarEstadoOllama();
    if (!status.online || !status.model) {
      return { text: '', success: false };
    }
    model = status.model;
  }

  const systemMessage = `Eres ArchAI Assistant, copiloto de inteligencia artificial de ArchAI Studio para diseño y modelado de arquitecturas de software UML y Spring Boot.
Responde siempre en español, de forma concisa (máximo 2 a 3 oraciones claras), cordial y profesional.
${contextoDiagrama ? `Contexto del modelo UML actual: ${contextoDiagrama}` : ''}
Si el usuario te saluda, dale la bienvenida amablemente a ArchAI y explícale que puedes crear clases, relaciones, generar sistemas de negocio o auditar la calidad 3FN de su arquitectura.`;

  const payload = {
    model,
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: prompt }
    ],
    stream: false,
    options: {
      temperature: 0.6,
      num_ctx: 1024,
      num_gpu: 0 // Ejecución CPU estable para no agotar la VRAM de la GPU
    }
  };

  const endpoints = ['/api/ollama/api/chat', 'http://127.0.0.1:11434/api/chat'];

  for (const ep of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const content = data?.message?.content || data?.response || '';
        if (content.trim()) {
          return { text: content.trim(), success: true };
        }
      }
    } catch {
      // Continuar al siguiente endpoint si falla
    }
  }

  return { text: '', success: false };
}
