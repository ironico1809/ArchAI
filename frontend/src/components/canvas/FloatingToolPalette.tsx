import {
  Table2,
  Code2,
  ArrowRight,
  GitFork,
  Folder,
  Zap
} from 'lucide-react';

interface FloatingToolPaletteProps {
  activeTool: string;
  onSelectTool: (tool: string) => void;
  onOpenWhiteboard: () => void;
  onOpenNewClass?: () => void;
  onOpenTemplates?: () => void;
  onOpenCodeDock?: () => void;
  onStartConnection?: () => void;
  onAutoOrganize?: () => void;
}

export const FloatingToolPalette: React.FC<FloatingToolPaletteProps> = ({
  activeTool,
  onSelectTool,
  onOpenWhiteboard,
  onOpenNewClass,
  onOpenTemplates,
  onOpenCodeDock,
  onStartConnection,
  onAutoOrganize
}) => {
  return (
    <div className="floating-toolbar">
      {/* 1. Crear Clase Asistida */}
      <button
        onClick={() => {
          onSelectTool('class');
          onOpenNewClass?.();
        }}
        title="Crear Nueva Clase / Tabla UML"
        className={`toolbar-btn ${activeTool === 'class' ? 'active' : ''}`}
      >
        <Table2 size={16} />
      </button>

      {/* 1.1 Plantillas de Arquitectura en 1 Clic */}
      <button
        onClick={() => {
          onSelectTool('templates');
          onOpenTemplates?.();
        }}
        title="Plantillas de Negocio en 1 Clic (E-Commerce, Hospital, Universidad, RBAC)"
        className={`toolbar-btn ${activeTool === 'templates' ? 'active' : ''}`}
        style={{ color: '#f59e0b' }}
      >
        <Zap size={16} />
      </button>

      {/* 2. Editor de Código y DDL */}
      <button
        onClick={() => {
          onSelectTool('code');
          onOpenCodeDock?.();
        }}
        title="Generador de Código Spring Boot y DDL"
        className={`toolbar-btn ${activeTool === 'code' ? 'active' : ''}`}
      >
        <Code2 size={16} />
      </button>

      {/* 3. Conector de Asociación / Enlace de Tablas */}
      <button
        onClick={() => {
          onSelectTool('relation');
          onStartConnection?.();
        }}
        title="Enlazar Tablas (Modo Conexión 1:N, N:M)"
        className={`toolbar-btn ${activeTool === 'relation' ? 'active' : ''}`}
      >
        <ArrowRight size={16} />
      </button>

      {/* 4. Auto-Organizar en Capas */}
      <button
        onClick={() => {
          onSelectTool('organize');
          onAutoOrganize?.();
        }}
        title="Auto-organizar diagrama por capas arquitectónicas"
        className={`toolbar-btn ${activeTool === 'organize' ? 'active' : ''}`}
      >
        <GitFork size={16} />
      </button>

      {/* 5. Escanear Foto de Pizarra (IA Visión OCR) */}
      <button
        onClick={onOpenWhiteboard}
        title="Escanear Foto de Pizarra (IA Visión)"
        className="toolbar-btn"
      >
        <Folder size={16} />
      </button>
    </div>
  );
};
