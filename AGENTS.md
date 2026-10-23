# AGENTS.md — ArchAI-App (código frontend + backend)

> Este archivo cubre el código de la aplicación. **Pero antes de tocar cualquier archivo de
> código, LEE LA DOCUMENTACIÓN del proyecto** que está en la carpeta hermana:
> `../../Obsidian_ArchAI_Vault` (o `../Obsidian_ArchAI_Vault` si abre este repo desde `ArchAI-App`).
>
> Ruta completa: `C:\Users\HP\Documents\Tarea U\Software\ArchAI\Obsidian_ArchAI_Vault`

## ⛔ REGLA OBLIGATORIA: LEE EL OBSIDIAN ANTES DEL CÓDIGO

1. `00 - INDICE GENERAL MOC.md` y `07 - GUIA RAPIDA PARA AGENTES Onboarding.md` siempre.
2. Después la nota específica de la tarea:
   - Frontend → `05 - MAPA DE MODULOS FRONTEND Y CONEXIONES.md`
   - Backend/API → `06 - BACKEND SPRING BOOT API Y MODULOS.md`
   - IA/Ollama → `03 - AGENTE IA LOCAL OLLAMA (FASE 1 GENERAR Y MODIFICAR).md`
   - XMI/EA → `04 - EXPORTACION XMI ENTERPRISE ARCHITECT Y OMG.md`
   - Caso de uso → `CU-XX ....md`

## Reglas

- **NO** hacer `git push` ni `git commit` (lo hace el usuario).
- **NO** sobrescribir trabajo sin commitear (`agenteDiagrama.ts`, `exportarXmiEA.ts`,
  `ollamaService.ts`, `FloatingAiAssistant.tsx`, `index.css`, `aiVoiceParser.ts`, `vite.config.ts`).
- **Alias ES → implementación EN**: `asistente_ia/`, `lienzo/`, `navegacion/`, `generador/`,
  `colaboracion/` son re-exports de `voice/`, `canvas/`, `layout/`, `dock/`, `collaboration/`.
  Editar la implementación inglesa.
- **Entorno**: backend `http://localhost:8000/api/v1` · frontend dev `https://localhost:443`
  (HTTPS mkcert, host `main.d2nlfe2rkbsyt.amplifyapp.com`) · Ollama `127.0.0.1:11434`
  (proxy Vite `/api/ollama` con fix CORS en `vite.config.ts` — no reescribir).