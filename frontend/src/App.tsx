import { useState } from 'react';
import { InformacionSesion } from './types/auth';
import { ModeloDiagrama } from './types/uml';
import { PaginaInicioSesion, PaginaEstudioCanvas, PaginaGestorProyectos } from './paginas';

export default function App() {
  const [session, setSession] = useState<InformacionSesion | null>(() => {
    const saved = localStorage.getItem('archai_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [currentView, setCurrentView] = useState<'proyectos' | 'estudio'>(() => {
    const saved = localStorage.getItem('archai_current_view');
    return (saved === 'estudio' || saved === 'proyectos') ? saved : 'proyectos';
  });

  const [selectedDiagramId, setSelectedDiagramId] = useState<string | undefined>(() => {
    return localStorage.getItem('archai_selected_diagram_id') || undefined;
  });

  const [selectedProjectTitle, setSelectedProjectTitle] = useState<string | undefined>(() => {
    return localStorage.getItem('archai_selected_project_title') || undefined;
  });

  const [selectedDiagram, setSelectedDiagram] = useState<ModeloDiagrama | undefined>(() => {
    const diagId = localStorage.getItem('archai_selected_diagram_id');
    if (diagId) {
      try {
        const porId = localStorage.getItem(`archai_diagram_${diagId}`);
        if (porId) return JSON.parse(porId);
      } catch {}
    }
    const saved = localStorage.getItem('archai_selected_diagram');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return undefined;
  });

  const handleLoginSuccess = (sesion: InformacionSesion, targetView?: 'proyectos' | 'estudio') => {
    setSession(sesion);
    const view = targetView || 'proyectos';
    setCurrentView(view);
    try {
      localStorage.setItem('archai_current_view', view);
    } catch {}
  };

  const handleLogout = () => {
    localStorage.removeItem('archai_session');
    localStorage.removeItem('archai_token');
    localStorage.removeItem('archai_current_view');
    localStorage.removeItem('archai_selected_diagram_id');
    localStorage.removeItem('archai_selected_project_title');
    localStorage.removeItem('archai_selected_diagram');
    setSession(null);
    setCurrentView('proyectos');
    setSelectedDiagram(undefined);
    setSelectedProjectTitle(undefined);
    setSelectedDiagramId(undefined);
  };

  const handleOpenStudio = (diagram?: ModeloDiagrama, projectTitle?: string, diagramId?: string) => {
    setSelectedDiagram(diagram);
    setSelectedProjectTitle(projectTitle);
    setSelectedDiagramId(diagramId);
    setCurrentView('estudio');

    try {
      localStorage.setItem('archai_current_view', 'estudio');
      if (diagramId) localStorage.setItem('archai_selected_diagram_id', diagramId);
      else localStorage.removeItem('archai_selected_diagram_id');

      if (projectTitle) localStorage.setItem('archai_selected_project_title', projectTitle);
      else localStorage.removeItem('archai_selected_project_title');

      if (diagram) localStorage.setItem('archai_selected_diagram', JSON.stringify(diagram));
      else localStorage.removeItem('archai_selected_diagram');
    } catch (e) {
      console.warn('Error al guardar estado de navegación local', e);
    }
  };

  const handleBackToProjects = () => {
    setCurrentView('proyectos');
    try {
      localStorage.setItem('archai_current_view', 'proyectos');
    } catch {}
  };

  if (!session) {
    return <PaginaInicioSesion alIniciarSesion={handleLoginSuccess} />;
  }

  if (currentView === 'proyectos') {
    return (
      <PaginaGestorProyectos
        session={session}
        onLogout={handleLogout}
        onOpenStudio={handleOpenStudio}
      />
    );
  }

  return (
    <PaginaEstudioCanvas
      session={session}
      onLogout={handleLogout}
      initialDiagram={selectedDiagram}
      projectTitle={selectedProjectTitle}
      diagramId={selectedDiagramId}
      onOpenProjects={handleBackToProjects}
    />
  );
}
