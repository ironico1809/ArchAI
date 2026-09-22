import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Key, 
  X, 
  Check, 
  ZoomIn, 
  ZoomOut, 
  Sparkles,
  LayoutGrid,
  Link as LinkIcon,
  Link2,
  Edit2,
  Zap,
  Layers,
  Palette,
  Box,
  FileCode,
  Database,
  CheckCircle2,
  ChevronUp, 
  ChevronDown, 
  Camera, 
  Lock, 
  Maximize2,
  CircleDot,
  Code2,
  ListFilter,
  PackageOpen,
  StickyNote,
  Server,
  Boxes,
  FolderOpen,
  Hash
} from 'lucide-react';
import { ModeloDiagrama, ClaseUml, AtributoUml, MetodoUml, RelacionUml, Visibilidad, TipoRelacion } from '../../types/uml';
import { InformacionSesion } from '../../types/auth';
import { PLANTILLAS_DISPONIBLES, instanciarPlantilla } from '../../services/plantillasDominio';
import { calcularMadurezClase } from '../../services/softwareMaturity';
import { PermisosUsuario } from '../../types/rbac';
import { ToolboxUml25, DefClasificadorUml, DefPatronUml } from '../lienzo/ToolboxUml25';

/** Helper para inferir tipo reactivamente según el nombre del atributo */
const inferirTipoAtributo = (nombre: string): AtributoUml['type'] => {
  const n = nombre.toLowerCase().trim();
  if (/^(id|codigo|cod)$/i.test(n) || /id$/i.test(n)) return 'Long';
  if (/precio|total|monto|saldo|costo|subtotal|iva|tarifa|comision|arancel/i.test(n)) return 'Double';
  if (/cantidad|stock|edad|numero|num|orden|mes|anio|year|prioridad|puntos|intentos|semestre/i.test(n)) return 'Integer';
  if (/fecha|nacimiento|fec|periodo/i.test(n)) return 'LocalDate';
  if (/hora|tiempo|creado|actualizado|timestamp|horario|registro|expiracion/i.test(n)) return 'LocalDateTime';
  if (/activo|habilitado|es|tiene|borrado|vigente|valido|pagado|completado|bloqueado/i.test(n)) return 'Boolean';
  return 'String';
};

interface InteractiveStudioCanvasProps {
  diagram: ModeloDiagrama;
  session: InformacionSesion;
  selectedClassId: string | null;
  onSelectClass: (classId: string | null) => void;
  onUpdateDiagram: (diagram: ModeloDiagrama) => void;
  onAddClass: (newClass: ClaseUml) => void;
  onDeleteClass: (classId: string) => void;
  onAddAttribute: (classId: string, attr: AtributoUml) => void;
  onDeleteAttribute: (classId: string, attrId: string) => void;
  onAddMethod?: (classId: string, method: MetodoUml) => void;
  onDeleteMethod?: (classId: string, methodId: string) => void;
  onAddRelation?: (relation: RelacionUml) => void;
  onDeleteRelation?: (relationId: string) => void;
  onChangeUserColor?: (color: string) => void;
  remoteCursors?: { id: string; name: string; color: string; x: number; y: number }[];
  onCursorMove?: (pos: { x: number; y: number }) => void;
  // Colaboración en vivo (CU-03): permite emitir el diagrama DURANTE el arrastre (no sólo al soltar)
  // y avisar al padre cuándo un arrastre está en curso (para evitar guardados masivos en la nube).
  onLiveDragUpdate?: (diagram: ModeloDiagrama) => void;
  onDragStateChange?: (dragging: boolean) => void;
  // CU-03 · Arrastre colaborativo fluido a 60 FPS
  onNodeDrag?: (classId: string, pos: { x: number; y: number }) => void;
  remoteDraggingNodes?: Record<string, { name: string; color: string }>;
  // Triggers externos desde la paleta de herramientas
  openNewClassTrigger?: number;
  openTemplatesTrigger?: number;
  openConnectTrigger?: number;
  openAutoOrganizeTrigger?: number;
  onOpenWhiteboard?: () => void;
  onToggleAiAssistant?: () => void;
  isAiAssistantOpen?: boolean;
  userPermissions?: PermisosUsuario;
  userRole?: string;
  onAutoCompletarClase?: (classId: string) => void;
}

const PALETTE_COLORS = [
  { hex: '#334155', name: 'Gray Shadow (Anfitrión)' },
  { hex: '#4a4891', name: 'Índigo Sobrio (Colaborador A)' },
  { hex: '#8892b0', name: 'Gris Lunar (Colaborador B)' },
  { hex: '#e8c39e', name: 'Arena (Colaborador C)' },
  { hex: '#5c688c', name: 'Pizarra Azul (Colaborador D)' },
  { hex: '#a3adde', name: 'Azul Perla (Colaborador E)' }
];

export const InteractiveStudioCanvas: React.FC<InteractiveStudioCanvasProps> = ({
  diagram,
  session,
  selectedClassId,
  onSelectClass,
  onUpdateDiagram,
  onAddClass,
  onDeleteClass,
  onAddAttribute,
  onDeleteAttribute,
  onAddMethod,
  onDeleteMethod,
  onAddRelation,
  onDeleteRelation,
  onChangeUserColor,
  remoteCursors = [],
  onCursorMove,
  onLiveDragUpdate,
  onDragStateChange,
  onNodeDrag,
  remoteDraggingNodes = {},
  openNewClassTrigger,
  openTemplatesTrigger,
  openConnectTrigger,
  openAutoOrganizeTrigger,
  onOpenWhiteboard,
  onToggleAiAssistant,
  isAiAssistantOpen,
  userPermissions,
  userRole,
  onAutoCompletarClase
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [draggingClassId, setDraggingClassId] = useState<string | null>(null);

  // Estado del Dock de herramientas unificado (desplegado / minimizado)
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);

  // Estado de la Toolbox UML 2.5+ (desplegada / minimizada)
  const [isToolboxOpen, setIsToolboxOpen] = useState<boolean>(true);
  const [insertStaggerCount, setInsertStaggerCount] = useState<number>(0);

  // Modales asistidos para modelado manual acelerado
  const [showNewClassModal, setShowNewClassModal] = useState<boolean>(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState<boolean>(false);

  // Formulario Asistido de Nueva Clase
  const [newClassName, setNewClassName] = useState<string>('');
  const [newClassStereotype, setNewClassStereotype] = useState<ClaseUml['stereotype']>('Entity');
  const [newClassWithIdPk, setNewClassWithIdPk] = useState<boolean>(true);
  const [newClassWithNombre, setNewClassWithNombre] = useState<boolean>(true);
  const [newClassWithDesc, setNewClassWithDesc] = useState<boolean>(false);
  const [newClassWithPrecio, setNewClassWithPrecio] = useState<boolean>(false);
  const [newClassWithFecha, setNewClassWithFecha] = useState<boolean>(false);
  const [newClassWithActivo, setNewClassWithActivo] = useState<boolean>(true);
  const [newClassLinkWithTargetId, setNewClassLinkWithTargetId] = useState<string>('');
  const [newClassLinkRelType, setNewClassLinkRelType] = useState<TipoRelacion>('ASSOCIATION_1_N');

  // Enlazador Rápido desde la Tarjeta (Fast Linker Popover)
  const [cardFastLinkerClassId, setCardFastLinkerClassId] = useState<string | null>(null);
  const [fastLinkTargetClassId, setFastLinkTargetClassId] = useState<string>('');
  const [fastLinkRelType, setFastLinkRelType] = useState<TipoRelacion>('ASSOCIATION_1_N');
  const [fastLinkLabel, setFastLinkLabel] = useState<string>('');

  // Renombrado Inline de Clase en Tarjeta
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editingClassName, setEditingClassName] = useState<string>('');
  const [editingClassStereotype, setEditingClassStereotype] = useState<ClaseUml['stereotype']>('Entity');

  // Adding Attribute inline state
  const [addingAttrClassId, setAddingAttrClassId] = useState<string | null>(null);
  const [attrName, setAttrName] = useState<string>('');
  const [attrType, setAttrType] = useState<AtributoUml['type']>('String');
  const [attrVis, setAttrVis] = useState<Visibilidad>('-');
  const [attrIsPk, setAttrIsPk] = useState<boolean>(false);

  // Adding Method inline state
  const [addingMethodClassId, setAddingMethodClassId] = useState<string | null>(null);
  const [methodName, setMethodName] = useState<string>('');
  const [methodReturnType, setMethodReturnType] = useState<string>('void');
  const [methodParams, setMethodParams] = useState<string>('');
  const [methodVis, setMethodVis] = useState<Visibilidad>('+');

  // Connection Linking mode state
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [selectedRelationType, setSelectedRelationType] = useState<TipoRelacion>('ASSOCIATION_1_N');

  // Triggers externos desde la paleta vertical
  useEffect(() => {
    if (openNewClassTrigger) setShowNewClassModal(true);
  }, [openNewClassTrigger]);

  useEffect(() => {
    if (openTemplatesTrigger) setShowTemplatesModal(true);
  }, [openTemplatesTrigger]);

  useEffect(() => {
    if (openConnectTrigger && diagram.classes.length > 0) {
      setConnectingSourceId(diagram.classes[0].id);
    }
  }, [openConnectTrigger, diagram.classes]);

  useEffect(() => {
    if (openAutoOrganizeTrigger) handleAutoOrganize();
  }, [openAutoOrganizeTrigger]);

  // Ref to local user cursor element for zero-latency direct transform (avoids full component re-render on every mousemove)
  const myCursorRef = useRef<HTMLDivElement>(null);
  // Tracks when mouse is over a UI overlay panel (Toolbox, etc.) so mousemove doesn't re-show the custom cursor
  const isMouseOverUiPanel = useRef<boolean>(false);

  // Temporary Name Tag on Cursor state (auto-fades to avoid obstructing the screen)
  const [showNameTag, setShowNameTag] = useState<boolean>(true);
  const nameTagTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setShowNameTag(true);
    if (nameTagTimerRef.current) clearTimeout(nameTagTimerRef.current);
    nameTagTimerRef.current = setTimeout(() => {
      setShowNameTag(false);
    }, 2200);
    return () => {
      if (nameTagTimerRef.current) clearTimeout(nameTagTimerRef.current);
    };
  }, [session.currentUser?.avatarColor]);

  // Color picker popover state
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);

  // Cursores de colaboradores remotos en vivo (CU-03 · STOMP)
  // Únicamente se muestran los cursores de compañeros REALES transmitidos por WebSocket
  const activeRemoteCursors = useMemo(() => {
    return remoteCursors || [];
  }, [remoteCursors]);

  const canvasRef = useRef<HTMLDivElement>(null);

  // --- Optimized drag/pan with requestAnimationFrame & Grid Snapping ---
  const frameRef = useRef<number | null>(null);
  const lastMoveRef = useRef<{ clientX: number; clientY: number; left: number; top: number } | null>(null);
  const draggingClassIdRef = useRef<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isPanningRef = useRef<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panRef = useRef(pan);
  const zoomRef = useRef(zoom);
  const dragPosRef = useRef<{ x: number; y: number } | null>(null);

  // Colaboración en vivo (CU-03): throttle para publicar el diagrama DURANTE el arrastre
  const lastLivePublishRef = useRef<number>(0);

  useEffect(() => { panRef.current = pan; }, [pan]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  // Atajo de teclado: Mantener barra espaciadora para paneo ultra fluido estilo Figma/Miro
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const isSpacePressedRef = useRef<boolean>(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag)) return;
      if (e.code === 'Space' && !isSpacePressedRef.current) {
        isSpacePressedRef.current = true;
        setIsSpacePressed(true);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // 🚀 Auto-pan continuo al arrastrar una tabla cerca del borde (elimina por completo el "muro")
  const autoPanRafRef = useRef<number | null>(null);
  const autoPanVelocityRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });

  const stopAutoPanLoop = () => {
    if (autoPanRafRef.current !== null) {
      cancelAnimationFrame(autoPanRafRef.current);
      autoPanRafRef.current = null;
    }
    autoPanVelocityRef.current = { vx: 0, vy: 0 };
  };

  const startAutoPanLoop = () => {
    if (autoPanRafRef.current !== null) return;

    const tick = () => {
      if (!draggingClassIdRef.current) {
        stopAutoPanLoop();
        return;
      }

      const { vx, vy } = autoPanVelocityRef.current;
      if (vx !== 0 || vy !== 0) {
        // Desplazar el lienzo suavemente en la dirección del borde
        const nextPanX = panRef.current.x - vx;
        const nextPanY = panRef.current.y - vy;
        panRef.current = { x: nextPanX, y: nextPanY };
        setPan({ x: nextPanX, y: nextPanY });

        // Actualizar la posición de la tabla en tiempo real en coordenadas de mundo durante el auto-pan
        if (lastMoveRef.current) {
          const data = lastMoveRef.current;
          const mX = data.clientX - data.left;
          const mY = data.clientY - data.top;
          const currentWorldMouseX = (mX - nextPanX) / zoomRef.current;
          const currentWorldMouseY = (mY - nextPanY) / zoomRef.current;
          const currentX = currentWorldMouseX - dragOffsetRef.current.x;
          const currentY = currentWorldMouseY - dragOffsetRef.current.y;
          const SNAP = 8;
          const next = {
            x: Math.round(currentX / SNAP) * SNAP,
            y: Math.round(currentY / SNAP) * SNAP
          };
          dragPosRef.current = next;
          setDragPos(next);
        }
      }

      autoPanRafRef.current = requestAnimationFrame(tick);
    };

    autoPanRafRef.current = requestAnimationFrame(tick);
  };

  // Local drag position (committed to the diagram on mouse up)
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);

  // Handle Dragging of UML Class Cards
  const handleClassMouseDown = (e: React.MouseEvent, cls: ClaseUml) => {
    e.stopPropagation();

    // Si estamos en modo de conexión, hacer clic en esta clase la define como destino
    if (connectingSourceId) {
      if (connectingSourceId !== cls.id) {
        handleCompleteRelation(connectingSourceId, cls.id);
      }
      setConnectingSourceId(null);
      return;
    }

    onSelectClass(cls.id);

    // Si el usuario no tiene permisos de edición (ej. Observador), no permitir arrastrar
    if (userPermissions && !userPermissions.canEditDiagram) {
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldMouseX = (mouseX - panRef.current.x) / zoomRef.current;
    const worldMouseY = (mouseY - panRef.current.y) / zoomRef.current;

    const pos = cls.position || { x: 100, y: 100 };
    const offsetX = worldMouseX - pos.x;
    const offsetY = worldMouseY - pos.y;
    setDraggingClassId(cls.id);
    draggingClassIdRef.current = cls.id;
    dragOffsetRef.current = { x: offsetX, y: offsetY };
    setDragPos(null);
    dragPosRef.current = null;
    // CU-03 · Notificar inicio de arrastre para que el padre no castigue la nube con guardados intermedios
    onDragStateChange?.(true);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      const target = e.target as HTMLElement;
      const isInteractive = Boolean(
        target.closest('.uml-class-node') ||
        target.closest('.glass-dock') ||
        target.closest('.glass-flyout') ||
        target.closest('.glass-command-dock-toggle') ||
        target.closest('button') ||
        target.closest('input') ||
        target.closest('select')
      );

      // Si es botón central, barra espaciadora, o clic en cualquier zona no interactiva del lienzo
      if (e.button === 1 || isSpacePressedRef.current || !isInteractive) {
        if (e.button === 1 || isSpacePressedRef.current) {
          e.preventDefault();
        }
        onSelectClass(null);
        setConnectingSourceId(null);
        isPanningRef.current = true;
        setIsPanning(true);
        const startX = e.clientX - panRef.current.x;
        const startY = e.clientY - panRef.current.y;
        panStartRef.current = { x: startX, y: startY };
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Direct cursor movement without triggering full component tree re-renders
    if (myCursorRef.current) {
      myCursorRef.current.style.transform = `translate3d(${mouseX - 1}px, ${mouseY - 1}px, 0)`;
      // El cursor personalizado se muestra siempre (también sobre paneles UI
      // como la toolbox), ya que el cursor nativo se oculta en el panel.
      myCursorRef.current.style.display = 'flex';
    }

    // CU-03 · Emitir coordenadas del ratón en tiempo real al broker STOMP
    if (onCursorMove) {
      const worldX = Math.round((mouseX - panRef.current.x) / zoomRef.current);
      const worldY = Math.round((mouseY - panRef.current.y) / zoomRef.current);
      onCursorMove({ x: worldX, y: worldY });
    }

    // Buffer dragging/panning to requestAnimationFrame
    if (draggingClassIdRef.current) {
      lastMoveRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        left: rect.left,
        top: rect.top
      };

      // 🚀 Auto-pan continuo al acercarse a los bordes de la pantalla (elimina por completo el "muro")
      const EDGE_ZONE = 90;
      const MAX_SPEED = 32;
      let vx = 0;
      let vy = 0;

      if (mouseX < EDGE_ZONE) {
        vx = -Math.round(Math.pow((EDGE_ZONE - mouseX) / EDGE_ZONE, 1.2) * MAX_SPEED);
      } else if (mouseX > rect.width - EDGE_ZONE) {
        vx = Math.round(Math.pow((mouseX - (rect.width - EDGE_ZONE)) / EDGE_ZONE, 1.2) * MAX_SPEED);
      }

      if (mouseY < EDGE_ZONE) {
        vy = -Math.round(Math.pow((EDGE_ZONE - mouseY) / EDGE_ZONE, 1.2) * MAX_SPEED);
      } else if (mouseY > rect.height - EDGE_ZONE) {
        vy = Math.round(Math.pow((mouseY - (rect.height - EDGE_ZONE)) / EDGE_ZONE, 1.2) * MAX_SPEED);
      }

      autoPanVelocityRef.current = { vx, vy };
      if (vx !== 0 || vy !== 0) {
        startAutoPanLoop();
      } else {
        stopAutoPanLoop();
      }

      if (frameRef.current !== null) return;
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        const data = lastMoveRef.current;
        if (!data || !draggingClassIdRef.current) return;

        const mX = data.clientX - data.left;
        const mY = data.clientY - data.top;
        const currentWorldMouseX = (mX - panRef.current.x) / zoomRef.current;
        const currentWorldMouseY = (mY - panRef.current.y) / zoomRef.current;

        const currentX = currentWorldMouseX - dragOffsetRef.current.x;
        const currentY = currentWorldMouseY - dragOffsetRef.current.y;
        
        // Alineación limpia a grilla de 8px (Snap to Grid)
        const SNAP = 8;
        const nextX = Math.round(currentX / SNAP) * SNAP;
        const nextY = Math.round(currentY / SNAP) * SNAP;

        const next = { x: nextX, y: nextY };
        dragPosRef.current = next;
        setDragPos(next);

        // CU-03 · Colaboración fluida en tiempo real: transmitir coordenadas del nodo a ~33 FPS (~30ms)
        const ahora = Date.now();
        const targetId = draggingClassIdRef.current;
        if (targetId && onNodeDrag && ahora - lastLivePublishRef.current >= 30) {
          lastLivePublishRef.current = ahora;
          onNodeDrag(targetId, next);
        } else if (onLiveDragUpdate && ahora - lastLivePublishRef.current >= 150) {
          lastLivePublishRef.current = ahora;
          if (targetId) {
            onLiveDragUpdate({
              ...diagram,
              classes: diagram.classes.map(c => c.id === targetId ? { ...c, position: next } : c),
              updatedAt: new Date().toISOString()
            });
          }
        }
      });
    } else if (isPanningRef.current) {
      lastMoveRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        left: rect.left,
        top: rect.top
      };

      if (frameRef.current !== null) return;
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        const data = lastMoveRef.current;
        if (!data || !isPanningRef.current) return;

        const nextX = data.clientX - panStartRef.current.x;
        const nextY = data.clientY - panStartRef.current.y;
        panRef.current = { x: nextX, y: nextY };
        setPan({
          x: nextX,
          y: nextY
        });
      });
    }
  };

  const handleMouseEnter = () => {
    if (myCursorRef.current) {
      myCursorRef.current.style.display = 'flex';
    }
  };

  const handleMouseUp = () => {
    stopAutoPanLoop();
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    const targetClassId = draggingClassIdRef.current || draggingClassId;
    let finalPos = dragPosRef.current;

    // Si había un movimiento en buffer pendiente de rAF, computar la posición exacta final ahora en coordenadas de mundo
    if (!finalPos && lastMoveRef.current && targetClassId) {
      const data = lastMoveRef.current;
      const mX = data.clientX - data.left;
      const mY = data.clientY - data.top;
      const currentWorldMouseX = (mX - panRef.current.x) / zoomRef.current;
      const currentWorldMouseY = (mY - panRef.current.y) / zoomRef.current;
      const currentX = currentWorldMouseX - dragOffsetRef.current.x;
      const currentY = currentWorldMouseY - dragOffsetRef.current.y;
      const SNAP = 8;
      finalPos = {
        x: Math.round(currentX / SNAP) * SNAP,
        y: Math.round(currentY / SNAP) * SNAP
      };
    }

    if (targetClassId && finalPos) {
      const updatedClasses = diagram.classes.map(c => {
        if (c.id === targetClassId) {
          return {
            ...c,
            position: { x: finalPos.x, y: finalPos.y }
          };
        }
        return c;
      });

      onUpdateDiagram({
        ...diagram,
        classes: updatedClasses,
        updatedAt: new Date().toISOString()
      });
    }

    isPanningRef.current = false;
    setIsPanning(false);
    draggingClassIdRef.current = null;
    lastMoveRef.current = null;
    dragPosRef.current = null;
    setDraggingClassId(null);
    setDragPos(null);
    // CU-03 · Fin del arrastre: restablecer el guard de nube del padre para que el commit final se respalde
    onDragStateChange?.(false);
  };

  // Captura global de mousemove y mouseup para arrastre ultra fluido y continuo sin perder foco
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!draggingClassIdRef.current && !isPanningRef.current) return;
      handleMouseMove(e as unknown as React.MouseEvent);
    };
    const handleGlobalMouseUp = () => {
      if (draggingClassIdRef.current || isPanningRef.current) {
        handleMouseUp();
      }
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [diagram, draggingClassId]);

  const handleMouseLeave = () => {
    if (myCursorRef.current) {
      myCursorRef.current.style.display = 'none';
    }
  };

  // Doble clic en cualquier zona libre del lienzo para centrar y auto-ajustar inmediatamente a pantalla
  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInteractive = Boolean(
      target.closest('.uml-class-node') ||
      target.closest('.glass-dock') ||
      target.closest('.fast-linker-popover') ||
      target.closest('.color-picker-popover') ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('textarea')
    );
    if (!isInteractive) {
      handleFitToScreen();
    }
  };

  // 🔍 Zoom fluido centrado en la posición del cursor del ratón (Miro/Figma style)
  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const handleNativeWheel = (e: WheelEvent) => {
      // Si el cursor está sobre un panel flotante (Toolbox, dock, etc.),
      // dejar que el navegador haga scroll nativo dentro del panel
      // en lugar de hacer zoom del lienzo. Se valida tanto el ref de
      // hover como el elemento objetivo (protege si el panel se desmonta
      // dejando el ref obsoleto).
      const objetivo = e.target as HTMLElement | null;
      const sobrePanelUi =
        isMouseOverUiPanel.current ||
        (objetivo != null &&
          typeof objetivo.closest === 'function' &&
          objetivo.closest('.glass-toolbox-panel, .glass-command-dock, .glass-command-dock-toggle, .glass-flyout, .glass-panel'));
      if (sobrePanelUi) return;

      e.preventDefault();

      // Desplazamiento horizontal si se mantiene presionada la tecla Shift
      if (e.shiftKey) {
        const nextPanX = Math.round(panRef.current.x - e.deltaY * 0.85);
        panRef.current = { ...panRef.current, x: nextPanX };
        setPan(prev => ({
          ...prev,
          x: nextPanX
        }));
        return;
      }

      const rect = canvasEl.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const currentZoom = zoomRef.current;
      const currentPan = panRef.current;

      // Coordenadas del mundo en el punto exacto bajo el cursor
      const worldX = (mouseX - currentPan.x) / currentZoom;
      const worldY = (mouseY - currentPan.y) / currentZoom;

      // Factor de zoom fluido y continuo (soporta rueda de ratón estándar o trackpad pinch)
      let zoomFactor: number;
      if (Math.abs(e.deltaY) < 25) {
        zoomFactor = 1 - e.deltaY * 0.006;
      } else {
        zoomFactor = e.deltaY < 0 ? 1.10 : 0.90;
      }

      // Rango masivo desbloqueado de 0.05x (visión global de 100k px) a 4.0x (ultra-detalle)
      const nextZoom = Math.max(0.05, Math.min(4.0, Number((currentZoom * zoomFactor).toFixed(3))));
      if (nextZoom === currentZoom) return;

      // Mantener fija en pantalla la posición del elemento apuntado por el cursor
      const nextPanX = Math.round(mouseX - worldX * nextZoom);
      const nextPanY = Math.round(mouseY - worldY * nextZoom);

      zoomRef.current = nextZoom;
      panRef.current = { x: nextPanX, y: nextPanY };

      setZoom(nextZoom);
      setPan({ x: nextPanX, y: nextPanY });
    };

    canvasEl.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      canvasEl.removeEventListener('wheel', handleNativeWheel);
    };
  }, []);

  // Zoom centrado en la pantalla para botones (+ / -) del dock
  const handleZoomStep = (delta: number) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const currentZoom = zoomRef.current;
    const currentPan = panRef.current;

    const nextZoom = Math.max(0.05, Math.min(4.0, Number((currentZoom + delta).toFixed(2))));
    if (nextZoom === currentZoom) return;

    const worldX = (centerX - currentPan.x) / currentZoom;
    const worldY = (centerY - currentPan.y) / currentZoom;

    const nextPanX = Math.round(centerX - worldX * nextZoom);
    const nextPanY = Math.round(centerY - worldY * nextZoom);

    zoomRef.current = nextZoom;
    panRef.current = { x: nextPanX, y: nextPanY };

    setZoom(nextZoom);
    setPan({ x: nextPanX, y: nextPanY });
  };

  // Submit new attribute
  const handleSaveAttribute = (e: React.FormEvent, classId: string) => {
    e.preventDefault();
    if (!attrName.trim()) return;

    const newAttr: AtributoUml = {
      id: 'attr-' + Date.now(),
      name: attrName.trim(),
      type: attrType,
      visibility: attrVis,
      isPrimaryKey: attrIsPk,
      isNullable: false
    };

    onAddAttribute(classId, newAttr);
    setAttrName('');
    setAttrIsPk(false);
    setAddingAttrClassId(null);
  };

  // 1-Click Attribute Preset Chip
  const handleAddAttributePreset = (classId: string, presetName: string, presetType: AtributoUml['type'], isPk = false) => {
    const newAttr: AtributoUml = {
      id: 'attr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: presetName,
      type: presetType,
      visibility: '-',
      isPrimaryKey: isPk,
      isNullable: false
    };
    onAddAttribute(classId, newAttr);
  };

  // 1-Click 4 Audit Fields
  const handleAddAuditFields = (classId: string) => {
    const fields: { name: string; type: AtributoUml['type'] }[] = [
      { name: 'creadoEn', type: 'LocalDateTime' },
      { name: 'actualizadoEn', type: 'LocalDateTime' },
      { name: 'creadoPor', type: 'String' },
      { name: 'activo', type: 'Boolean' }
    ];
    fields.forEach((f, idx) => {
      setTimeout(() => {
        onAddAttribute(classId, {
          id: 'attr-audit-' + Date.now() + '-' + idx,
          name: f.name,
          type: f.type,
          visibility: '-',
          isPrimaryKey: false,
          isNullable: true
        });
      }, idx * 15);
    });
  };

  // Enlace rápido directo desde el popover de la tarjeta
  const handleFastLinkSubmit = (sourceClassId: string) => {
    if (!fastLinkTargetClassId || sourceClassId === fastLinkTargetClassId) return;

    let defaultLabel = 'asocia';
    if (fastLinkRelType === 'COMPOSITION') defaultLabel = 'compone';
    else if (fastLinkRelType === 'AGGREGATION') defaultLabel = 'agrega';
    else if (fastLinkRelType === 'INHERITANCE') defaultLabel = 'extiende';
    else if (fastLinkRelType === 'REALIZATION') defaultLabel = 'implementa';
    else if (fastLinkRelType === 'DEPENDENCY' || fastLinkRelType === 'USAGE') defaultLabel = '«use»';
    else if (fastLinkRelType === 'PACKAGE_IMPORT') defaultLabel = '«import»';
    else if (fastLinkRelType === 'NON_NAVIGABLE') defaultLabel = 'no_navegable';
    else if (fastLinkRelType === 'ASSOCIATION_1_N') defaultLabel = 'tiene';
    else if (fastLinkRelType === 'ASSOCIATION_N_M') defaultLabel = 'vincula';

    const isSpecial = ['INHERITANCE', 'REALIZATION', 'DEPENDENCY', 'USAGE', 'PACKAGE_IMPORT', 'ASSOCIATION_BINARY'].includes(fastLinkRelType);
    const srcMult = isSpecial ? '' : (fastLinkRelType === 'ASSOCIATION_N_M' ? '*' : '1');
    const tgtMult = isSpecial ? '' : (fastLinkRelType === 'COMPOSITION' ? '1..*' : fastLinkRelType === 'ASSOCIATION_1_1' ? '1' : fastLinkRelType === 'NON_NAVIGABLE' ? '0' : '*');

    const newRel: RelacionUml = {
      id: `rel-${Date.now()}`,
      sourceClassId: sourceClassId,
      targetClassId: fastLinkTargetClassId,
      type: fastLinkRelType,
      sourceMultiplicity: srcMult,
      targetMultiplicity: tgtMult,
      label: fastLinkLabel.trim() || defaultLabel
    };

    if (onAddRelation) {
      onAddRelation(newRel);
    } else {
      onUpdateDiagram({
        ...diagram,
        relations: [...diagram.relations, newRel],
        updatedAt: new Date().toISOString()
      });
    }

    setCardFastLinkerClassId(null);
    setFastLinkTargetClassId('');
    setFastLinkLabel('');
  };

  // Crear clase desde el Asistente Modal
  const handleCreateAssistedClass = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = newClassName.trim() || `Entidad${diagram.classes.length + 1}`;
    const newId = 'cls-' + Date.now();

    const initialAttrs: AtributoUml[] = [];
    if (newClassWithIdPk) {
      initialAttrs.push({
        id: `a-${Date.now()}-pk`,
        name: 'id',
        type: 'Long',
        visibility: '-',
        isPrimaryKey: true
      });
    }
    if (newClassWithNombre) {
      initialAttrs.push({
        id: `a-${Date.now()}-nom`,
        name: 'nombre',
        type: 'String',
        visibility: '-'
      });
    }
    if (newClassWithDesc) {
      initialAttrs.push({
        id: `a-${Date.now()}-desc`,
        name: 'descripcion',
        type: 'String',
        visibility: '-'
      });
    }
    if (newClassWithPrecio) {
      initialAttrs.push({
        id: `a-${Date.now()}-prec`,
        name: 'precio',
        type: 'Double',
        visibility: '-'
      });
    }
    if (newClassWithFecha) {
      initialAttrs.push({
        id: `a-${Date.now()}-fec`,
        name: 'fechaCreacion',
        type: 'LocalDateTime',
        visibility: '-'
      });
    }
    if (newClassWithActivo) {
      initialAttrs.push({
        id: `a-${Date.now()}-act`,
        name: 'activo',
        type: 'Boolean',
        visibility: '-'
      });
    }

    const initialMethods: MetodoUml[] = [];
    if (newClassStereotype === 'Entity') {
      initialMethods.push({
        id: `m-${Date.now()}-1`,
        name: 'validar',
        returnType: 'Boolean',
        visibility: '+'
      });
    } else if (newClassStereotype === 'Service') {
      initialMethods.push({
        id: `m-${Date.now()}-1`,
        name: `ejecutar${cleanName}`,
        returnType: 'void',
        visibility: '+'
      });
    }

    // Ubicación inteligente para evitar solapamientos y no desbordar
    const index = diagram.classes.length;
    const maxCols = 3;
    const posX = 60 + (index % maxCols) * 350;
    const posY = 60 + Math.floor(index / maxCols) * 280;

    const createdClass: ClaseUml = {
      id: newId,
      name: cleanName,
      stereotype: newClassStereotype,
      attributes: initialAttrs,
      methods: initialMethods,
      position: { x: posX, y: posY }
    };

    onAddClass(createdClass);
    setTimeout(() => {
      handleFitToScreen([...diagram.classes, createdClass]);
    }, 60);

    // Si seleccionó enlace inmediato con otra tabla
    if (newClassLinkWithTargetId) {
      const target = diagram.classes.find(c => c.id === newClassLinkWithTargetId);
      if (target) {
        setTimeout(() => {
          let defaultLabel = 'asocia';
          if (newClassLinkRelType === 'COMPOSITION') defaultLabel = 'compone';
          else if (newClassLinkRelType === 'INHERITANCE') defaultLabel = 'extiende';
          else if (newClassLinkRelType === 'ASSOCIATION_1_N') defaultLabel = 'tiene';

          const newRel: RelacionUml = {
            id: `rel-${Date.now()}`,
            sourceClassId: newId,
            targetClassId: newClassLinkWithTargetId,
            type: newClassLinkRelType,
            sourceMultiplicity: '1',
            targetMultiplicity: newClassLinkRelType === 'COMPOSITION' ? '0..*' : '*',
            label: defaultLabel
          };
          if (onAddRelation) onAddRelation(newRel);
        }, 80);
      }
    }

    setNewClassName('');
    setNewClassLinkWithTargetId('');
    setShowNewClassModal(false);
  };

  // Insertar arquitectura de plantilla de dominio
  const handleApplyTemplate = (plantillaId: string, replace: boolean) => {
    const inst = instanciarPlantilla(plantillaId, replace ? undefined : diagram);
    if (!inst) return;

    if (replace) {
      onUpdateDiagram({
        title: diagram.title,
        classes: inst.classes,
        relations: inst.relations,
        updatedAt: new Date().toISOString()
      });
    } else {
      onUpdateDiagram({
        ...diagram,
        classes: [...diagram.classes, ...inst.classes],
        relations: [...diagram.relations, ...inst.relations],
        updatedAt: new Date().toISOString()
      });
    }
    setShowTemplatesModal(false);
    setTimeout(() => {
      handleFitToScreen(replace ? inst.classes : [...diagram.classes, ...inst.classes]);
    }, 80);
  };

  // Renombrado Inline de Clase
  const handleStartEditingClass = (cls: ClaseUml, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingClassId(cls.id);
    setEditingClassName(cls.name);
    setEditingClassStereotype(cls.stereotype || 'Entity');
  };

  const handleSaveEditingClass = (classId: string, e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!editingClassName.trim()) return;

    const updated = diagram.classes.map(c => {
      if (c.id === classId) {
        return {
          ...c,
          name: editingClassName.trim(),
          stereotype: editingClassStereotype
        };
      }
      return c;
    });

    onUpdateDiagram({
      ...diagram,
      classes: updated,
      updatedAt: new Date().toISOString()
    });

    setEditingClassId(null);
  };

  // Submit new method
  const handleSaveMethod = (e: React.FormEvent, classId: string) => {
    e.preventDefault();
    if (!methodName.trim()) return;

    const newMethod: MetodoUml = {
      id: 'm-' + Date.now(),
      name: methodName.trim(),
      returnType: methodReturnType.trim() || 'void',
      parameters: methodParams.trim(),
      visibility: methodVis
    };

    if (onAddMethod) {
      onAddMethod(classId, newMethod);
    } else {
      // Fallback update diagram
      const updated = diagram.classes.map(cls => {
        if (cls.id === classId) {
          return {
            ...cls,
            methods: [...cls.methods, newMethod]
          };
        }
        return cls;
      });
      onUpdateDiagram({ ...diagram, classes: updated, updatedAt: new Date().toISOString() });
    }

    setMethodName('');
    setMethodParams('');
    setAddingMethodClassId(null);
  };

  // Create relation between two nodes (UML 2.5 rigorous mappings)
  const handleCompleteRelation = (sourceId: string, targetId: string) => {
    const srcClass = diagram.classes.find(c => c.id === sourceId);
    const tgtClass = diagram.classes.find(c => c.id === targetId);
    if (!srcClass || !tgtClass) return;

    let defaultLabel = 'asocia';
    let srcMult = '1';
    let tgtMult = '*';

    switch (selectedRelationType) {
      case 'ASSOCIATION_1_1':
        defaultLabel = 'asocia';
        srcMult = '1';
        tgtMult = '1';
        break;
      case 'ASSOCIATION_1_N':
        defaultLabel = 'asocia';
        srcMult = '1';
        tgtMult = '0..*';
        break;
      case 'ASSOCIATION_N_M':
        defaultLabel = 'asocia';
        srcMult = '*';
        tgtMult = '*';
        break;
      case 'COMPOSITION':
        defaultLabel = 'compone';
        srcMult = '1';
        tgtMult = '1..*';
        break;
      case 'AGGREGATION':
        defaultLabel = 'agrega';
        srcMult = '1';
        tgtMult = '0..*';
        break;
      case 'INHERITANCE':
        defaultLabel = 'extiende';
        srcMult = '';
        tgtMult = '';
        break;
      case 'REALIZATION':
        defaultLabel = 'implementa';
        srcMult = '';
        tgtMult = '';
        break;
      case 'DEPENDENCY':
      case 'USAGE':
        defaultLabel = '«use»';
        srcMult = '';
        tgtMult = '';
        break;
      case 'PACKAGE_IMPORT':
        defaultLabel = '«import»';
        srcMult = '';
        tgtMult = '';
        break;
      case 'ASSOCIATION_BINARY':
        defaultLabel = 'asocia';
        srcMult = '';
        tgtMult = '';
        break;
      case 'NON_NAVIGABLE':
        defaultLabel = 'no_navegable';
        srcMult = '1';
        tgtMult = '0';
        break;
    }

    const newRel: RelacionUml = {
      id: `rel-${Date.now()}`,
      sourceClassId: sourceId,
      targetClassId: targetId,
      type: selectedRelationType,
      sourceMultiplicity: srcMult,
      targetMultiplicity: tgtMult,
      label: defaultLabel
    };

    if (onAddRelation) {
      onAddRelation(newRel);
    } else {
      onUpdateDiagram({
        ...diagram,
        relations: [...diagram.relations, newRel],
        updatedAt: new Date().toISOString()
      });
    }
  };

  // ─── Handlers de la Toolbox UML 2.5+ ───

  const handleInsertClassifierFromToolbox = (def: DefClasificadorUml) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const stagger = (insertStaggerCount % 6) * 35;
    setInsertStaggerCount(prev => prev + 1);

    const centerX = rect ? Math.round((rect.width / 2 - pan.x) / zoom) + stagger : 300 + stagger;
    const centerY = rect ? Math.round((rect.height / 2 - pan.y) / zoom) + stagger : 200 + stagger;

    const baseName = def.name.replace(/[^a-zA-Z0-9]/g, '') || 'Clase';
    let finalName = baseName;
    let counter = 1;
    while (diagram.classes.some(c => c.name.toLowerCase() === finalName.toLowerCase())) {
      counter++;
      finalName = `${baseName}${counter}`;
    }

    const ts = Date.now();
    const newCls: ClaseUml = {
      id: `cls-${def.stereotype?.toLowerCase() || 'item'}-${ts}`,
      name: finalName,
      stereotype: def.stereotype,
      isAbstract: def.isAbstract,
      isInterface: def.isInterface,
      isInstance: def.isInstance || def.stereotype === 'Instance',
      templateParams: def.templateParams || (def.stereotype === 'Template' ? 'T' : undefined),
      noteText: def.isNote ? def.defaultNoteText : undefined,
      position: { x: centerX, y: centerY },
      attributes: (def.defaultAttributes || []).map((a, idx) => ({
        id: `attr-${ts}-${idx}`,
        name: a.name,
        type: a.type,
        visibility: a.visibility,
        isPrimaryKey: a.isPrimaryKey,
        isStatic: a.isStatic,
        isDerived: a.isDerived,
        isReadOnly: a.isReadOnly,
        defaultValue: a.defaultValue,
        multiplicity: a.multiplicity
      })),
      methods: (def.defaultMethods || []).map((m, idx) => ({
        id: `m-${ts}-${idx}`,
        name: m.name,
        returnType: m.returnType,
        visibility: m.visibility,
        parameters: m.parameters,
        isStatic: m.isStatic,
        isQuery: m.isQuery
      }))
    };

    onAddClass(newCls);
    onSelectClass(newCls.id);
  };

  const handleActivateRelationFromToolbox = (relType: TipoRelacion) => {
    setSelectedRelationType(relType);
    if (selectedClassId) {
      setConnectingSourceId(selectedClassId);
    } else if (diagram.classes.length > 0) {
      setConnectingSourceId(diagram.classes[0].id);
    }
  };

  const handleInsertPatternFromToolbox = (patron: DefPatronUml) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const centerX = rect ? Math.round((rect.width / 2 - pan.x) / zoom) : 400;
    const centerY = rect ? Math.round((rect.height / 2 - pan.y) / zoom) : 250;

    const built = patron.builder({ x: centerX, y: centerY });
    onUpdateDiagram({
      ...diagram,
      classes: [...diagram.classes, ...built.classes],
      relations: [...diagram.relations, ...built.relations],
      updatedAt: new Date().toISOString()
    });
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/archai-toolbox')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    const rawData = e.dataTransfer.getData('application/archai-toolbox');
    if (!rawData) return;
    e.preventDefault();
    try {
      const { type, item } = JSON.parse(rawData);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const dropX = Math.round((e.clientX - rect.left - pan.x) / zoom);
      const dropY = Math.round((e.clientY - rect.top - pan.y) / zoom);

      if (type === 'classifier') {
        const baseName = item.name?.replace(/[^a-zA-Z0-9]/g, '') || 'Clase';
        let finalName = baseName;
        let counter = 1;
        while (diagram.classes.some(c => c.name.toLowerCase() === finalName.toLowerCase())) {
          counter++;
          finalName = `${baseName}${counter}`;
        }

        const ts = Date.now();
        const newCls: ClaseUml = {
          id: `cls-${item.stereotype?.toLowerCase() || 'item'}-${ts}`,
          name: finalName,
          stereotype: item.stereotype,
          isAbstract: item.isAbstract,
          isInterface: item.isInterface,
          isInstance: item.isInstance || item.stereotype === 'Instance',
          templateParams: item.templateParams || (item.stereotype === 'Template' ? 'T' : undefined),
          noteText: item.isNote ? item.defaultNoteText : undefined,
          position: { x: dropX, y: dropY },
          attributes: (item.defaultAttributes || []).map((a: any, idx: number) => ({
            id: `attr-${ts}-${idx}`,
            name: a.name,
            type: a.type,
            visibility: a.visibility,
            isPrimaryKey: a.isPrimaryKey,
            isStatic: a.isStatic,
            isDerived: a.isDerived,
            isReadOnly: a.isReadOnly,
            defaultValue: a.defaultValue,
            multiplicity: a.multiplicity
          })),
          methods: (item.defaultMethods || []).map((m: any, idx: number) => ({
            id: `m-${ts}-${idx}`,
            name: m.name,
            returnType: m.returnType,
            visibility: m.visibility,
            parameters: m.parameters,
            isStatic: m.isStatic,
            isQuery: m.isQuery
          }))
        };
        onAddClass(newCls);
        onSelectClass(newCls.id);
      } else if (type === 'pattern') {
        const built = item.builder ? item.builder({ x: dropX, y: dropY }) : null;
        if (built) {
          onUpdateDiagram({
            ...diagram,
            classes: [...diagram.classes, ...built.classes],
            relations: [...diagram.relations, ...built.relations],
            updatedAt: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.error('Error al procesar drop en el lienzo:', err);
    }
  };

  // Ajustar todo el diagrama a la pantalla visible (Auto-Fit & Centrado inteligente sin desbordamiento)
  const handleFitToScreen = (customClasses?: ClaseUml[]) => {
    const classesToFit = customClasses || diagram.classes;
    if (!canvasRef.current || classesToFit.length === 0) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    // Calcular límites envolventes (bounding box) de todas las clases
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    classesToFit.forEach(cls => {
      const pos = cls.position || { x: 60, y: 40 };
      const cardH = Math.max(160, 65 + (cls.attributes?.length || 0) * 26 + (cls.methods?.length || 0) * 26);
      const cardW = 330;

      if (pos.x < minX) minX = pos.x;
      if (pos.y < minY) minY = pos.y;
      if (pos.x + cardW > maxX) maxX = pos.x + cardW;
      if (pos.y + cardH > maxY) maxY = pos.y + cardH;
    });

    if (!isFinite(minX) || !isFinite(minY)) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }

    const diagramW = Math.max(100, maxX - minX);
    const diagramH = Math.max(100, maxY - minY);

    // Márgenes seguros: 40px a los lados, 40px arriba, 95px abajo para librar el Dock perfectamente
    const padX = 40;
    const padTop = 40;
    const padBottom = 95;

    const availW = Math.max(200, rect.width - padX * 2);
    const availH = Math.max(200, rect.height - padTop - padBottom);

    const scaleX = availW / diagramW;
    const scaleY = availH / diagramH;
    // Si cabe al 100%, dejamos 1.0. Si no cabe, escalamos fluidamente hasta 0.08
    const idealZoom = Number(Math.min(1.0, Math.max(0.08, Math.min(scaleX, scaleY))).toFixed(2));

    // Centrar en el área visible segura
    const targetCenterX = padX + availW / 2;
    const targetCenterY = padTop + availH / 2;

    const diagramCenterX = minX + diagramW / 2;
    const diagramCenterY = minY + diagramH / 2;

    const targetPanX = Math.round(targetCenterX - diagramCenterX * idealZoom);
    const targetPanY = Math.round(targetCenterY - diagramCenterY * idealZoom);

    zoomRef.current = idealZoom;
    panRef.current = { x: targetPanX, y: targetPanY };
    setZoom(idealZoom);
    setPan({ x: targetPanX, y: targetPanY });
  };

  // Auto-Organizar en capas arquitectónicas limpias, compactas y proporcionales
  const handleAutoOrganize = () => {
    const layerCols: Record<string, ClaseUml[]> = {
      Controller: [],
      Service: [],
      Repository: [],
      Entity: [],
      Other: []
    };

    diagram.classes.forEach(c => {
      const st = c.stereotype || 'Entity';
      if (layerCols[st]) {
        layerCols[st].push(c);
      } else {
        layerCols.Other.push(c);
      }
    });

    const arranged: ClaseUml[] = [];
    const totalClasses = diagram.classes.length;

    if (totalClasses <= 4) {
      // Distribución limpia y compacta de 2 niveles:
      // Nivel Superior (y: 40): Controller -> Service -> Repository
      // Nivel Inferior (y: 300): Entity
      const controllers = layerCols.Controller;
      const services = layerCols.Service;
      const repos = layerCols.Repository;
      const entities = layerCols.Entity;
      const others = layerCols.Other;

      let colX = 60;
      controllers.forEach(c => {
        arranged.push({ ...c, position: { x: colX, y: 40 } });
        colX += 350;
      });
      services.forEach(c => {
        arranged.push({ ...c, position: { x: colX, y: 40 } });
        colX += 350;
      });
      repos.forEach(c => {
        arranged.push({ ...c, position: { x: colX, y: 40 } });
        colX += 350;
      });

      // Entities en el nivel inferior (alineada con el repositorio si existe o centrada)
      const entityX = repos.length > 0 ? 760 : (services.length > 0 ? 410 : 60);
      entities.forEach((c, idx) => {
        arranged.push({ ...c, position: { x: entityX, y: 300 + idx * 280 } });
      });
      others.forEach((c, idx) => {
        arranged.push({ ...c, position: { x: 60 + idx * 350, y: 300 } });
      });
    } else {
      // Distribución multi-columna para arquitecturas grandes (máximo 3 columnas de 350px)
      const MAX_COLS = 3;
      const colOrder = ['Controller', 'Service', 'Repository', 'Entity', 'Other'];
      const allOrdered: ClaseUml[] = [];
      colOrder.forEach(k => allOrdered.push(...layerCols[k]));

      allOrdered.forEach((item, idx) => {
        const col = idx % MAX_COLS;
        const row = Math.floor(idx / MAX_COLS);
        arranged.push({
          ...item,
          position: {
            x: 60 + col * 350,
            y: 40 + row * 280
          }
        });
      });
    }

    onUpdateDiagram({
      ...diagram,
      classes: arranged,
      updatedAt: new Date().toISOString()
    });

    // Auto-ajustar inmediatamente el zoom y pan a la nueva disposición compacta
    setTimeout(() => {
      handleFitToScreen(arranged);
    }, 60);
  };

  // Auto-ajustar automáticamente al cargar o cambiar de diagrama
  const lastFittedDiagramRef = useRef<string | null>(null);

  useEffect(() => {
    const key = `${diagram.title}-${diagram.classes.length}`;
    if (lastFittedDiagramRef.current !== key && diagram.classes.length > 0) {
      lastFittedDiagramRef.current = key;
      const timer = setTimeout(() => {
        handleFitToScreen();
      }, 70);
      return () => clearTimeout(timer);
    }
  }, [diagram.title, diagram.classes.length]);

  // Re-ajustar si el usuario redimensiona la ventana
  useEffect(() => {
    const handleResize = () => {
      if (diagram.classes.length > 0) {
        handleFitToScreen();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [diagram.classes]);

  // Local preview of classes while dragging (committed to the diagram on mouse up)
  const displayedClasses = useMemo(() => {
    if (!draggingClassId || !dragPos) return diagram.classes;
    return diagram.classes.map(c =>
      c.id === draggingClassId ? { ...c, position: dragPos } : c
    );
  }, [diagram.classes, draggingClassId, dragPos]);

  // Calculate SVG connector paths dynamically with ultra-smooth cubic bezier S-curves
  const relationPaths = useMemo(() => {
    const classMap = new Map<string, { x: number; y: number; w: number; h: number }>();

    displayedClasses.forEach(cls => {
      const pos = cls.position || { x: 100, y: 100 };
      const approxHeight = Math.max(160, 65 + (cls.attributes?.length || 0) * 26 + (cls.methods?.length || 0) * 26);
      classMap.set(cls.id, {
        x: pos.x,
        y: pos.y,
        w: 310,
        h: approxHeight
      });
    });

    return diagram.relations.map(rel => {
      const src = classMap.get(rel.sourceClassId);
      const tgt = classMap.get(rel.targetClassId);

      if (!src || !tgt) return null;

      const srcCenter = { x: src.x + src.w / 2, y: src.y + src.h / 2 };
      const tgtCenter = { x: tgt.x + tgt.w / 2, y: tgt.y + tgt.h / 2 };

      const dx = tgtCenter.x - srcCenter.x;
      const dy = tgtCenter.y - srcCenter.y;

      let startX = srcCenter.x;
      let startY = srcCenter.y;
      let endX = tgtCenter.x;
      let endY = tgtCenter.y;
      let c1X = srcCenter.x;
      let c1Y = srcCenter.y;
      let c2X = tgtCenter.x;
      let c2Y = tgtCenter.y;

      if (Math.abs(dx) >= Math.abs(dy) * 0.75) {
        if (dx >= 0) {
          // Target is to the right
          startX = src.x + src.w;
          startY = srcCenter.y;
          endX = tgt.x;
          endY = tgtCenter.y;
          const curveDist = Math.max(30, Math.min(180, (endX - startX) * 0.5));
          c1X = startX + curveDist;
          c1Y = startY;
          c2X = endX - curveDist;
          c2Y = endY;
        } else {
          // Target is to the left
          startX = src.x;
          startY = srcCenter.y;
          endX = tgt.x + tgt.w;
          endY = tgtCenter.y;
          const curveDist = Math.max(30, Math.min(180, (startX - endX) * 0.5));
          c1X = startX - curveDist;
          c1Y = startY;
          c2X = endX + curveDist;
          c2Y = endY;
        }
      } else {
        if (dy >= 0) {
          // Target is below
          startX = srcCenter.x;
          startY = src.y + src.h;
          endX = tgtCenter.x;
          endY = tgt.y;
          const curveDist = Math.max(30, Math.min(180, (endY - startY) * 0.5));
          c1X = startX;
          c1Y = startY + curveDist;
          c2X = endX;
          c2Y = endY - curveDist;
        } else {
          // Target is above
          startX = srcCenter.x;
          startY = src.y;
          endX = tgtCenter.x;
          endY = tgt.y + tgt.h;
          const curveDist = Math.max(30, Math.min(180, (startY - endY) * 0.5));
          c1X = startX;
          c1Y = startY - curveDist;
          c2X = endX;
          c2Y = endY + curveDist;
        }
      }

      const pathD = `M ${startX} ${startY} C ${c1X} ${c1Y}, ${c2X} ${c2Y}, ${endX} ${endY}`;
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;

      return {
        id: rel.id,
        pathD,
        label: rel.label || '',
        srcMultiplicity: rel.sourceMultiplicity || '1',
        tgtMultiplicity: rel.targetMultiplicity || '*',
        type: rel.type,
        startX,
        startY,
        endX,
        endY,
        midX,
        midY
      };
    }).filter(Boolean);
  }, [displayedClasses, diagram.relations]);

  const userColor = session.currentUser?.avatarColor || 'var(--accent-primary)';

  return (
    <div
      ref={canvasRef}
      className="studio-canvas-root"
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onDoubleClick={handleCanvasDoubleClick}
      onDragOver={handleCanvasDragOver}
      onDrop={handleCanvasDrop}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg-canvas)',
        cursor: isPanning ? 'grabbing' : (connectingSourceId ? 'crosshair' : isSpacePressed ? 'grab' : 'default')
      }}
    >
      {/* 🌌 Ambient Grid & Dot Pattern Sincronizado 1:1 con Pan y Zoom */}
      <div 
        className="canvas-ambient-backdrop" 
        style={{
          backgroundPosition: `${((pan.x % Math.max(12, Math.round(28 * zoom))) + Math.max(12, Math.round(28 * zoom))) % Math.max(12, Math.round(28 * zoom))}px ${((pan.y % Math.max(12, Math.round(28 * zoom))) + Math.max(12, Math.round(28 * zoom))) % Math.max(12, Math.round(28 * zoom))}px`,
          backgroundSize: `${Math.max(12, Math.round(28 * zoom))}px ${Math.max(12, Math.round(28 * zoom))}px`,
          backgroundImage: `radial-gradient(var(--bg-canvas-grid) ${Math.max(1, Number((1.2 * Math.min(zoom, 1.8)).toFixed(1)))}px, transparent ${Math.max(1, Number((1.2 * Math.min(zoom, 1.8)).toFixed(1)))}px)`
        }}
      />

      {/* SVG Definitions & Relation Lines Layer (Área masiva de 200,000px sin fronteras ni cortes) */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '200000px',
          height: '200000px',
          overflow: 'visible',
          pointerEvents: 'none',
          zIndex: 5,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0'
        }}
      >
        <defs>
          <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Association Arrow */}
          <marker
            id="uml-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--relation-line)" />
          </marker>

          {/* Composition Diamond */}
          <marker
            id="uml-diamond"
            viewBox="0 0 16 16"
            refX="1"
            refY="8"
            markerWidth="12"
            markerHeight="12"
            orient="auto"
          >
            <polygon points="1,8 8,2 15,8 8,14" fill="var(--accent-cyan)" stroke="#ffffff" strokeWidth="1.2" />
          </marker>

          {/* Aggregation Hollow Diamond */}
          <marker
            id="uml-diamond-hollow"
            viewBox="0 0 16 16"
            refX="1"
            refY="8"
            markerWidth="12"
            markerHeight="12"
            orient="auto"
          >
            <polygon points="1,8 8,2 15,8 8,14" fill="var(--bg-canvas)" stroke="var(--accent-cyan)" strokeWidth="1.5" />
          </marker>

          {/* Inheritance Hollow Triangle */}
          <marker
            id="uml-inheritance"
            viewBox="0 0 14 14"
            refX="12"
            refY="7"
            markerWidth="10"
            markerHeight="10"
            orient="auto"
          >
            <polygon points="1,1 12,7 1,13" fill="var(--bg-canvas)" stroke="var(--accent-secondary)" strokeWidth="1.5" />
          </marker>

          {/* Open Arrow (Dependency & directed navigation) */}
          <marker
            id="uml-arrow-open"
            viewBox="0 0 12 12"
            refX="10"
            refY="6"
            markerWidth="9"
            markerHeight="9"
            orient="auto"
          >
            <path d="M 2 2 L 10 6 L 2 10" fill="none" stroke="var(--relation-line)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </marker>

          {/* Non-Navigable Cross (✕) */}
          <marker
            id="uml-cross"
            viewBox="0 0 12 12"
            refX="10"
            refY="6"
            markerWidth="9"
            markerHeight="9"
            orient="auto"
          >
            <line x1="2" y1="2" x2="10" y2="10" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
            <line x1="10" y1="2" x2="2" y2="10" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
          </marker>
        </defs>

        {/* Render Connection Lines (UML 2.5 rigorous rendering) */}
        {relationPaths.map(r => {
          if (!r) return null;
          let markerEnd: string | undefined = 'url(#uml-arrow)';
          let strokeDash = 'none';
          let strokeColor: string | undefined = undefined;

          if (r.type === 'COMPOSITION') {
            markerEnd = 'url(#uml-diamond)';
            strokeDash = 'none';
          } else if (r.type === 'AGGREGATION') {
            markerEnd = 'url(#uml-diamond-hollow)';
            strokeDash = 'none';
          } else if (r.type === 'INHERITANCE') {
            markerEnd = 'url(#uml-inheritance)';
            strokeDash = 'none';
          } else if (r.type === 'REALIZATION') {
            markerEnd = 'url(#uml-inheritance)';
            strokeDash = '6 4';
          } else if (r.type === 'DEPENDENCY' || r.type === 'USAGE') {
            markerEnd = 'url(#uml-arrow-open)';
            strokeDash = '6 4';
          } else if (r.type === 'PACKAGE_IMPORT') {
            markerEnd = 'url(#uml-arrow-open)';
            strokeDash = '8 4 2 4';
          } else if (r.type === 'ASSOCIATION_1_1') {
            markerEnd = undefined;
            strokeDash = 'none';
          } else if (r.type === 'ASSOCIATION_N_M') {
            markerEnd = undefined;
            strokeDash = 'none';
          } else if (r.type === 'ASSOCIATION_BINARY') {
            markerEnd = undefined;
            strokeDash = 'none';
          } else if (r.type === 'NON_NAVIGABLE') {
            markerEnd = 'url(#uml-cross)';
            strokeDash = 'none';
            strokeColor = '#f43f5e';
          } else {
            markerEnd = 'url(#uml-arrow)';
            strokeDash = 'none';
          }

          return (
            <g key={r.id}>
              {/* Outer soft glow line */}
              <path
                d={r.pathD}
                fill="none"
                stroke={strokeColor ? `${strokeColor}44` : 'var(--relation-glow)'}
                strokeWidth="6"
                strokeLinecap="round"
              />
              {/* Core connection line */}
              <path
                d={r.pathD}
                fill="none"
                stroke={strokeColor || 'var(--relation-line)'}
                strokeWidth="2"
                strokeDasharray={strokeDash}
                markerEnd={markerEnd}
              />

              {/* Relation Label Badge */}
              {r.label && (
                <g 
                  transform={`translate(${r.midX - 40}, ${r.midY - 12})`} 
                  style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                  onClick={() => onDeleteRelation && onDeleteRelation(r.id)}
                >
                  <rect
                    width="80"
                    height="24"
                    rx="6"
                    fill="var(--relation-badge-bg)"
                    stroke="var(--relation-badge-border)"
                    strokeWidth="1"
                  />
                  <text
                    x="40"
                    y="16"
                    fill="var(--relation-badge-text)"
                    fontSize="11"
                    fontFamily="Outfit, sans-serif"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {r.label}
                  </text>
                </g>
              )}

              {/* Multiplicities */}
              <text
                x={r.startX + 10}
                y={r.startY - 8}
                fill="#94a3b8"
                fontSize="11"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="700"
              >
                {r.srcMultiplicity}
              </text>
              <text
                x={r.endX - 18}
                y={r.endY - 8}
                fill="#94a3b8"
                fontSize="11"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="700"
              >
                {r.tgtMultiplicity}
              </text>
            </g>
          );
        })}
      </svg>



      {/* Connecting Mode Banner */}
      {connectingSourceId && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--popover-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--accent-cyan)',
            borderRadius: '12px',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 8px 30px var(--glow-cyan)',
            zIndex: 60
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <LinkIcon size={16} color="var(--accent-cyan)" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Modo Conexión: Selecciona la clase destino
            </span>
          </div>

          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {([
              { key: 'ASSOCIATION_1_1' as TipoRelacion, label: '1:1' },
              { key: 'ASSOCIATION_1_N' as TipoRelacion, label: '1:N' },
              { key: 'ASSOCIATION_N_M' as TipoRelacion, label: 'N:M' },
              { key: 'ASSOCIATION_BINARY' as TipoRelacion, label: 'Binaria' },
              { key: 'AGGREGATION' as TipoRelacion, label: 'Agregación' },
              { key: 'COMPOSITION' as TipoRelacion, label: 'Composición' },
              { key: 'INHERITANCE' as TipoRelacion, label: 'Herencia' },
              { key: 'REALIZATION' as TipoRelacion, label: 'Realización' },
              { key: 'DEPENDENCY' as TipoRelacion, label: 'Dependencia' },
              { key: 'USAGE' as TipoRelacion, label: '«use»' },
              { key: 'PACKAGE_IMPORT' as TipoRelacion, label: '«import»' },
              { key: 'NON_NAVIGABLE' as TipoRelacion, label: 'No Nav. ✕' }
            ]).map(rt => (
              <button
                key={rt.key}
                onClick={() => setSelectedRelationType(rt.key)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '0.70rem',
                  fontWeight: 700,
                  border: 'none',
                  background: selectedRelationType === rt.key ? 'var(--accent-primary)' : 'var(--glass-surface-hover)',
                  color: selectedRelationType === rt.key ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {rt.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setConnectingSourceId(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Cancelar conexión"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 🔒 Banner de Modo Solo Lectura (RBAC) */}
      {userPermissions && !userPermissions.canEditDiagram && (
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(232, 195, 158, 0.16)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(232, 195, 158, 0.4)',
            borderRadius: '12px',
            padding: '8px 18px',
            zIndex: 65,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#e8c39e',
            fontSize: '0.78rem',
            fontWeight: 700,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)'
          }}
        >
          <Lock size={15} />
          <span>Modo Solo Lectura (Rol: {userRole || 'Observador'}) · Edición y arrastre de tablas restringidos</span>
        </div>
      )}

      {/* Main Canvas Workspace */}
      <div
        id="canvas-workspace-layer"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: '200000px',
          height: '200000px',
          overflow: 'visible',
          zIndex: 10
        }}
      >
        {/* Render Interactive UML Class Nodes */}
        {displayedClasses.map(cls => {
          const isSelected = selectedClassId === cls.id;
          const isConnectingSource = connectingSourceId === cls.id;
          const pos = cls.position || { x: 120, y: 120 };
          const stereotype = cls.stereotype || 'Entity';

          const stereoStyles: Record<string, { icon: React.ReactNode }> = {
            Class: { icon: <Box size={13} color="currentColor" /> },
            Entity: { icon: <Database size={13} color="currentColor" /> },
            Service: { icon: <Layers size={13} color="currentColor" /> },
            Controller: { icon: <FileCode size={13} color="currentColor" /> },
            Repository: { icon: <Server size={13} color="currentColor" /> },
            Interface: { icon: <CircleDot size={13} color="currentColor" /> },
            Abstract: { icon: <Code2 size={13} color="currentColor" /> },
            Enum: { icon: <ListFilter size={13} color="currentColor" /> },
            DTO: { icon: <PackageOpen size={13} color="currentColor" /> },
            Component: { icon: <Box size={13} color="currentColor" /> },
            Note: { icon: <StickyNote size={13} color="currentColor" /> },
            Template: { icon: <Code2 size={13} color="currentColor" /> },
            Package: { icon: <FolderOpen size={13} color="currentColor" /> },
            Instance: { icon: <CircleDot size={13} color="currentColor" /> },
            DataType: { icon: <Boxes size={13} color="currentColor" /> },
            Primitive: { icon: <Hash size={13} color="currentColor" /> },
            Signal: { icon: <Zap size={13} color="currentColor" /> },
            AssociationClass: { icon: <Link2 size={13} color="currentColor" /> }
          };

          const activeStereo = stereoStyles[stereotype] || stereoStyles.Entity;
          const remoteDragInfo = remoteDraggingNodes?.[cls.id];
          const isRemoteDragging = Boolean(remoteDragInfo && draggingClassId !== cls.id);
          const madurez = calcularMadurezClase(cls, diagram.relations, diagram.classes);
          const canEdit = !userPermissions || userPermissions.canEditDiagram;

          return (
            <div
              key={cls.id}
              className={`uml-class-node ${isSelected ? 'node-selected' : ''} ${draggingClassId === cls.id ? 'dragging' : ''} ${isRemoteDragging ? 'remote-dragging' : ''}`}
              onMouseDown={e => handleClassMouseDown(e, cls)}
              style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                width: '330px',
                borderRadius: '12px',
                outline: isConnectingSource
                  ? '2px dashed var(--accent-cyan)'
                  : isRemoteDragging
                  ? `2px solid ${remoteDragInfo?.color || 'var(--accent-cyan)'}`
                  : 'none',
                boxShadow: isConnectingSource
                  ? '0 0 25px rgba(47, 44, 121, 0.75)'
                  : isRemoteDragging
                  ? `0 0 20px ${remoteDragInfo?.color || 'var(--accent-cyan)'}88, 0 12px 30px rgba(0,0,0,0.18)`
                  : undefined
              }}
            >
              {/* Badge flotante que indica qué compañero está moviendo la tabla en vivo */}
              {isRemoteDragging && remoteDragInfo && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-26px',
                    left: '6px',
                    background: remoteDragInfo.color,
                    color: '#ffffff',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-heading)',
                    padding: '2px 9px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: `0 4px 12px ${remoteDragInfo.color}88`,
                    zIndex: 60,
                    pointerEvents: 'none'
                  }}
                >
                  <Sparkles size={11} />
                  <span>{remoteDragInfo.name} moviendo...</span>
                </div>
              )}
              {/* Card Header (Functional HUD - Glassmorphic with Distinct Stereotype Accent) */}
              <div
                style={{
                  background: 'var(--glass-node-header-bg)',
                  padding: '8px 10px',
                  borderBottom: '1px solid var(--glass-node-header-border)',
                  borderTop: '3px solid var(--glass-node-header-accent)',
                  borderTopLeftRadius: '11px',
                  borderTopRightRadius: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '6px',
                  width: '100%',
                  boxSizing: 'border-box',
                  overflow: 'hidden'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '5px',
                    background: 'var(--glass-node-icon-bg)',
                    border: '1px solid var(--glass-node-header-border)',
                    color: 'var(--glass-node-icon-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {activeStereo.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <div style={{
                      fontSize: '0.64rem',
                      color: 'var(--glass-node-stereo-color)',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      fontFamily: 'var(--font-mono)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      &laquo;{stereotype}&raquo;
                    </div>

                    {/* Renombrado Inline de Clase */}
                    {editingClassId === cls.id && canEdit ? (
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}
                        onClick={e => e.stopPropagation()}
                        onMouseDown={e => e.stopPropagation()}
                      >
                        <select
                          value={editingClassStereotype}
                          onChange={e => setEditingClassStereotype(e.target.value as any)}
                          style={{
                            background: 'var(--glass-node-bg)',
                            border: '1px solid var(--glass-border-color)',
                            borderRadius: '4px',
                            padding: '2px 4px',
                            fontSize: '0.66rem',
                            color: 'var(--text-primary)'
                          }}
                        >
                          <option value="Class">Class</option>
                          <option value="Entity">Entity</option>
                          <option value="Service">Service</option>
                          <option value="Controller">Controller</option>
                          <option value="Repository">Repository</option>
                          <option value="Interface">Interface</option>
                          <option value="Abstract">Abstract</option>
                          <option value="Enum">Enum</option>
                          <option value="DTO">DTO</option>
                          <option value="Component">Component</option>
                          <option value="Note">Note</option>
                          <optgroup label="── UML 2.5+ ──">
                            <option value="Template">Template (Genérica)</option>
                            <option value="Package">Package (Paquete)</option>
                            <option value="Instance">Instance (Objeto)</option>
                            <option value="DataType">DataType</option>
                            <option value="Primitive">Primitive</option>
                            <option value="Signal">Signal (Señal)</option>
                            <option value="AssociationClass">AssociationClass</option>
                          </optgroup>
                        </select>
                        <input
                          type="text"
                          value={editingClassName}
                          onChange={e => setEditingClassName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveEditingClass(cls.id);
                            if (e.key === 'Escape') setEditingClassId(null);
                          }}
                          autoFocus
                          style={{
                            background: 'var(--glass-node-bg)',
                            border: '1px solid var(--accent-cyan)',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            fontSize: '0.84rem',
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            width: '105px'
                          }}
                        />
                        <button
                          onClick={e => handleSaveEditingClass(cls.id, e)}
                          style={{
                            background: 'var(--accent-emerald)',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#fff',
                            padding: '3px 6px',
                            cursor: 'pointer'
                          }}
                          title="Guardar nombre"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setEditingClassId(null); }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            padding: '2px 4px',
                            cursor: 'pointer'
                          }}
                          title="Cancelar"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0, overflow: 'hidden' }}>
                        <h3
                          onDoubleClick={e => { if (canEdit) handleStartEditingClass(cls, e); }}
                          style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: '0.88rem',
                            fontWeight: 800,
                            color: 'var(--glass-node-header-text)',
                            fontStyle: (stereotype === 'Interface' || stereotype === 'Abstract' || cls.isInterface || cls.isAbstract) ? 'italic' : 'normal',
                            letterSpacing: '-0.01em',
                            cursor: canEdit ? 'pointer' : 'default',
                            margin: 0,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            minWidth: 0,
                            flexShrink: 1
                          }}
                          title={canEdit ? `Doble clic o lápiz para renombrar (${cls.name})` : cls.name}
                        >
                          {cls.name}
                        </h3>
                        {/* Badge de Madurez de la Clase */}
                        <span
                          title={`Madurez: ${madurez.porcentaje}% (${madurez.nivel.replace('_', ' ')})\n${madurez.sugerencias.join('\n')}`}
                          style={{
                            fontSize: '0.60rem',
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: '999px',
                            background: `${madurez.color}22`,
                            color: madurez.color,
                            border: `1px solid ${madurez.color}55`,
                            cursor: 'help',
                            flexShrink: 0
                          }}
                        >
                          {madurez.porcentaje}%
                        </span>
                        {canEdit && (
                          <button
                            onClick={e => handleStartEditingClass(cls, e)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--glass-node-stereo-color)',
                              cursor: 'pointer',
                              padding: '1px',
                              display: 'flex',
                              alignItems: 'center',
                              flexShrink: 0
                            }}
                            title="Renombrar clase / cambiar estereotipo"
                          >
                            <Edit2 size={10} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones de la cabecera: Enlazar y Eliminar (Limpias y sin desbordamiento) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  {canEdit && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        const willOpen = cardFastLinkerClassId !== cls.id;
                        setCardFastLinkerClassId(willOpen ? cls.id : null);
                        if (willOpen) {
                          const others = diagram.classes.filter(c => c.id !== cls.id);
                          if (others.length > 0 && (!fastLinkTargetClassId || fastLinkTargetClassId === cls.id)) {
                            setFastLinkTargetClassId(others[0].id);
                          }
                        }
                      }}
                      style={{
                        background: cardFastLinkerClassId === cls.id ? 'var(--accent-primary)' : 'var(--glass-node-btn-bg)',
                        border: cardFastLinkerClassId === cls.id ? '1px solid var(--accent-primary)' : '1px solid var(--glass-node-btn-border)',
                        borderRadius: '6px',
                        padding: '2px 7px',
                        color: cardFastLinkerClassId === cls.id ? '#ffffff' : 'var(--glass-node-btn-text)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '0.67rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        transition: 'all 0.15s ease'
                      }}
                      title="Enlazar con otra tabla UML (selector directo o lienzo)"
                    >
                      <Link2 size={11} />
                      <span>Enlazar</span>
                    </button>
                  )}

                  {canEdit && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onDeleteClass(cls.id);
                      }}
                      style={{
                        background: 'rgba(244, 63, 94, 0.12)',
                        border: '1px solid rgba(244, 63, 94, 0.28)',
                        borderRadius: '6px',
                        padding: '3px 4px',
                        color: '#fb7185',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.15s ease'
                      }}
                      title="Eliminar entidad"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </div>

              {/* Barra de progreso de madurez de la clase (con track visible para evitar sensación de corte) */}
              <div
                style={{
                  width: '100%',
                  height: '3px',
                  background: 'rgba(255, 255, 255, 0.12)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                title={`Nivel de madurez del software: ${madurez.porcentaje}% (${madurez.nivel.replace('_', ' ')})`}
              >
                <div
                  style={{
                    width: `${madurez.porcentaje}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${madurez.color}cc, ${madurez.color})`,
                    boxShadow: `0 0 8px ${madurez.color}99`,
                    borderRadius: '0 2px 2px 0',
                    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
              </div>

              {/* ⚡ Fast Linker Popover integrado en la tarjeta */}
              {cardFastLinkerClassId === cls.id && (
                <div
                  onClick={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                  style={{
                    background: 'var(--popover-bg)',
                    borderBottom: '2px solid var(--accent-cyan)',
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                    animation: 'fadeIn 0.2s ease-out'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Link2 size={14} color="var(--accent-cyan)" />
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Enlazar <strong>{cls.name}</strong> con:
                      </span>
                    </div>
                    <button
                      onClick={() => setCardFastLinkerClassId(null)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                    >
                      <X size={13} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Tabla Destino:</label>
                    <select
                      value={fastLinkTargetClassId}
                      onChange={e => setFastLinkTargetClassId(e.target.value)}
                      style={{
                        background: 'var(--glass-node-bg)',
                        border: '1px solid var(--glass-border-color)',
                        borderRadius: '6px',
                        padding: '5px 8px',
                        fontSize: '0.74rem',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <option value="" disabled>Selecciona tabla destino...</option>
                      {diagram.classes.filter(c => c.id !== cls.id).map(target => (
                        <option key={target.id} value={target.id}>
                          {target.name} ({target.stereotype || 'Entity'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Tipo de Relación:</label>
                      <select
                        value={fastLinkRelType}
                        onChange={e => setFastLinkRelType(e.target.value as TipoRelacion)}
                        style={{
                          background: 'var(--glass-node-bg)',
                          border: '1px solid var(--glass-border-color)',
                          borderRadius: '6px',
                          padding: '5px 6px',
                          fontSize: '0.72rem',
                          color: 'var(--text-primary)'
                        }}
                      >
                        <option value="ASSOCIATION_1_N">1:N (Uno a Muchos)</option>
                        <option value="ASSOCIATION_N_M">N:M (Muchos a Muchos)</option>
                        <option value="ASSOCIATION_1_1">1:1 (Uno a Uno)</option>
                        <option value="ASSOCIATION_BINARY">Binaria (sin multiplicidad)</option>
                        <option value="COMPOSITION">Composición (Contenedor-Parte)</option>
                        <option value="AGGREGATION">Agregación</option>
                        <option value="INHERITANCE">Herencia (Extiende)</option>
                        <option value="REALIZATION">Realización (Implementa)</option>
                        <option value="DEPENDENCY">Dependencia</option>
                        <option value="USAGE">«use» (Uso)</option>
                        <option value="PACKAGE_IMPORT">«import» (Importación)</option>
                        <option value="NON_NAVIGABLE">No Navegable ✕</option>
                      </select>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Etiqueta (opcional):</label>
                      <input
                        type="text"
                        placeholder="ej. tiene, compone"
                        value={fastLinkLabel}
                        onChange={e => setFastLinkLabel(e.target.value)}
                        style={{
                          background: 'var(--glass-node-bg)',
                          border: '1px solid var(--glass-border-color)',
                          borderRadius: '6px',
                          padding: '5px 8px',
                          fontSize: '0.72rem',
                          color: 'var(--text-primary)'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setCardFastLinkerClassId(null);
                        setConnectingSourceId(cls.id);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--accent-cyan)',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 0'
                      }}
                      title="Conectar haciendo clic en otra clase directamente en el lienzo"
                    >
                      <LinkIcon size={11} />
                      <span>Clic en lienzo</span>
                    </button>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => setCardFastLinkerClassId(null)}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--glass-border-color)',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '0.72rem',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleFastLinkSubmit(cls.id)}
                        disabled={!fastLinkTargetClassId}
                        className="btn-studio-primary"
                        style={{
                          padding: '4px 12px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          opacity: fastLinkTargetClassId ? 1 : 0.5,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Check size={12} />
                        <span>Conectar</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Attributes / Fields List */}
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--glass-node-attr-border)' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px'
                }}>
                  <span style={{
                    fontSize: '0.66rem',
                    color: 'var(--text-muted)',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    Atributos ({cls.attributes.length})
                  </span>

                  {canEdit && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setAddingAttrClassId(addingAttrClassId === cls.id ? null : cls.id);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--accent-cyan)',
                        fontSize: '0.68rem',
                        cursor: 'pointer',
                        fontWeight: 700
                      }}
                    >
                      + Atributo
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {cls.attributes.map(attr => (
                    <div
                      key={attr.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.78rem',
                        fontFamily: 'var(--font-mono)',
                        padding: '3px 6px',
                        borderRadius: '4px',
                        background: 'var(--glass-node-attr-item-bg)',
                        border: '1px solid var(--glass-node-attr-item-border)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                        <span style={{
                          color: 'rgba(232, 195, 158, 0.75)',
                          fontWeight: 800,
                          flexShrink: 0
                        }}>
                          {attr.visibility}
                        </span>
                        <span style={{
                          color: 'var(--glass-node-attr-text)',
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }} title={attr.name}>
                          {attr.name}
                        </span>
                        {attr.isPrimaryKey && (
                          <span title="Clave Primaria (PK)" style={{ flexShrink: 0 }}>
                            <Key size={11} color="#e8c39e" />
                          </span>
                        )}
                        <span style={{ color: 'var(--text-subtle)', flexShrink: 0 }}>:</span>
                        <span style={{ color: '#e8c39e', fontWeight: 600, flexShrink: 0 }}>{attr.type}</span>
                      </div>

                      {!attr.isPrimaryKey && canEdit && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onDeleteAttribute(cls.id, attr.id);
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '1px'
                          }}
                          title="Eliminar atributo"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Inline Add Attribute Form con Chips Rápidos e Inferencia Reactiva */}
                {addingAttrClassId === cls.id && (
                  <form
                    onSubmit={e => handleSaveAttribute(e, cls.id)}
                    style={{
                      marginTop: '8px',
                      padding: '10px',
                      background: 'var(--glass-surface-hover)',
                      borderRadius: '8px',
                      border: '1px solid var(--glass-border-color)'
                    }}
                  >
                    {/* Chips de campos comunes en 1 clic */}
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>
                        ⚡ Presets en 1 Clic:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {[
                          { label: '+ id (PK)', name: 'id', type: 'Long' as const, isPk: true },
                          { label: '+ nombre', name: 'nombre', type: 'String' as const, isPk: false },
                          { label: '+ descripcion', name: 'descripcion', type: 'String' as const, isPk: false },
                          { label: '+ correo', name: 'email', type: 'String' as const, isPk: false },
                          { label: '+ precio', name: 'precio', type: 'Double' as const, isPk: false },
                          { label: '+ total', name: 'total', type: 'Double' as const, isPk: false },
                          { label: '+ cantidad', name: 'cantidad', type: 'Integer' as const, isPk: false },
                          { label: '+ fecha', name: 'fechaRegistro', type: 'LocalDate' as const, isPk: false },
                          { label: '+ activo', name: 'activo', type: 'Boolean' as const, isPk: false }
                        ].map(preset => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => handleAddAttributePreset(cls.id, preset.name, preset.type, preset.isPk)}
                            style={{
                              background: 'var(--glass-surface)',
                              border: '1px solid var(--glass-border-color)',
                              borderRadius: '4px',
                              padding: '2px 6px',
                              fontSize: '0.66rem',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              fontWeight: 600
                            }}
                            title={`Añadir campo ${preset.name} (${preset.type})`}
                          >
                            {preset.label}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleAddAuditFields(cls.id)}
                          style={{
                            background: '#2f2c79',
                            border: '1px solid #171a4a',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            fontSize: '0.66rem',
                            color: '#f5e1ce',
                            cursor: 'pointer',
                            fontWeight: 800
                          }}
                          title="Añadir creadoEn, actualizadoEn, creadoPor y activo"
                        >
                          + ⚡ 4 Auditoría
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                      <select
                        value={attrVis}
                        onChange={e => setAttrVis(e.target.value as Visibilidad)}
                        style={{
                          background: 'var(--glass-node-bg)',
                          border: '1px solid var(--glass-border-color)',
                          color: 'var(--text-primary)',
                          borderRadius: '4px',
                          padding: '4px 6px',
                          fontSize: '0.72rem'
                        }}
                      >
                        <option value="-">- Privado</option>
                        <option value="+">+ Público</option>
                        <option value="#"># Protegido</option>
                      </select>
                      <input
                        type="text"
                        placeholder="nombreAtributo (auto-detecta tipo)"
                        value={attrName}
                        onChange={e => {
                          const val = e.target.value;
                          setAttrName(val);
                          const inf = inferirTipoAtributo(val);
                          setAttrType(inf);
                          if (/^id$/i.test(val.trim())) {
                            setAttrIsPk(true);
                          }
                        }}
                        style={{
                          flex: 1,
                          background: 'var(--glass-node-bg)',
                          border: '1px solid var(--glass-border-color)',
                          color: 'var(--text-primary)',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '0.72rem',
                          fontFamily: 'var(--font-mono)'
                        }}
                        autoFocus
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <select
                        value={attrType}
                        onChange={e => setAttrType(e.target.value as any)}
                        style={{
                          flex: 1,
                          background: 'var(--glass-node-bg)',
                          border: '1px solid var(--glass-border-color)',
                          color: 'var(--text-primary)',
                          borderRadius: '4px',
                          padding: '4px 6px',
                          fontSize: '0.72rem'
                        }}
                      >
                        <option value="String">String</option>
                        <option value="Long">Long</option>
                        <option value="Integer">Integer</option>
                        <option value="Double">Double</option>
                        <option value="Boolean">Boolean</option>
                        <option value="LocalDate">LocalDate</option>
                        <option value="LocalDateTime">LocalDateTime</option>
                        <option value="BigDecimal">BigDecimal</option>
                      </select>
                      <button
                        type="submit"
                        style={{
                          background: 'var(--accent-primary)',
                          border: 'none',
                          color: '#ffffff',
                          borderRadius: '4px',
                          padding: '4px 10px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Check size={12} /> Guardar
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Methods & Operations */}
              <div style={{
                padding: '10px 14px',
                background: 'var(--glass-node-method-bg)',
                borderBottomLeftRadius: '11px',
                borderBottomRightRadius: '11px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px'
                }}>
                  <span style={{
                    fontSize: '0.66rem',
                    color: 'var(--text-muted)',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    Métodos ({cls.methods.length})
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {canEdit && madurez.porcentaje < 100 && onAutoCompletarClase && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onAutoCompletarClase(cls.id);
                        }}
                        style={{
                          background: '#2f2c79',
                          border: '1px solid #171a4a',
                          borderRadius: '5px',
                          padding: '2px 7px',
                          color: '#f5e1ce',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          transition: 'all 0.15s ease'
                        }}
                        title={`Sugerir y autocompletar métodos de negocio con IA (${madurez.sugerencias[0] || 'Lógica'})`}
                      >
                        <Zap size={10} />
                        <span>+ Lógica IA</span>
                      </button>
                    )}

                    {canEdit && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setAddingMethodClassId(addingMethodClassId === cls.id ? null : cls.id);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--accent-primary)',
                          fontSize: '0.68rem',
                          cursor: 'pointer',
                          fontWeight: 700
                        }}
                      >
                        + Método
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {cls.methods.map(m => (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.76rem',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-secondary)',
                        padding: '2px 4px',
                        borderRadius: '4px'
                      }}
                    >
                      <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={`${m.name}(${m.parameters || ''}): ${m.returnType}`}>
                        <span style={{ color: 'rgba(232, 195, 158, 0.75)', fontWeight: 800 }}>{m.visibility} </span>
                        <span style={{ color: 'var(--glass-node-attr-text)', fontWeight: 600 }}>{m.name}({m.parameters || ''})</span>: <span style={{ color: '#e8c39e', fontWeight: 700 }}>{m.returnType}</span>
                      </div>

                      {onDeleteMethod && canEdit && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onDeleteMethod(cls.id, m.id);
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '1px'
                          }}
                          title="Eliminar método"
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Inline Add Method Form */}
                {addingMethodClassId === cls.id && (
                  <form
                    onSubmit={e => handleSaveMethod(e, cls.id)}
                    style={{
                      marginTop: '8px',
                      padding: '8px',
                      background: 'var(--glass-surface-hover)',
                      borderRadius: '8px',
                      border: '1px solid var(--glass-border-color)'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                      <select
                        value={methodVis}
                        onChange={e => setMethodVis(e.target.value as Visibilidad)}
                        style={{
                          background: 'var(--glass-node-bg)',
                          border: '1px solid var(--glass-border-color)',
                          color: 'var(--text-primary)',
                          borderRadius: '4px',
                          padding: '4px 6px',
                          fontSize: '0.72rem'
                        }}
                      >
                        <option value="+">+ Público</option>
                        <option value="-">- Privado</option>
                        <option value="#"># Protegido</option>
                      </select>
                      <input
                        type="text"
                        placeholder="nombreMetodo"
                        value={methodName}
                        onChange={e => setMethodName(e.target.value)}
                        style={{
                          flex: 1,
                          background: 'var(--glass-node-bg)',
                          border: '1px solid var(--glass-border-color)',
                          color: 'var(--text-primary)',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '0.72rem',
                          fontFamily: 'var(--font-mono)'
                        }}
                        autoFocus
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input
                        type="text"
                        placeholder="TipoRetorno (ej. void, List<Product>)"
                        value={methodReturnType}
                        onChange={e => setMethodReturnType(e.target.value)}
                        style={{
                          flex: 1,
                          background: 'var(--glass-node-bg)',
                          border: '1px solid var(--glass-border-color)',
                          color: 'var(--text-primary)',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '0.72rem',
                          fontFamily: 'var(--font-mono)'
                        }}
                      />
                      <button
                        type="submit"
                        style={{
                          background: 'var(--accent-primary)',
                          border: 'none',
                          color: '#ffffff',
                          borderRadius: '4px',
                          padding: '4px 10px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Check size={12} /> Guardar
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          );
        })}

        {/* ðŸ‘¥ Remote Collaborators Cursors Layer (Diagram World Space - CU-03) */}
        {!session.isLocalMode && activeRemoteCursors.map(c => (
          <div
            key={c.id}
            className="collaborative-cursor"
            style={{
              position: 'absolute',
              left: `${c.x}px`,
              top: `${c.y}px`,
              zIndex: 50,
              pointerEvents: 'none',
              transition: 'left 0.08s ease-out, top 0.08s ease-out'
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              style={{
                filter: `drop-shadow(0 2px 6px ${c.color}99)`,
                overflow: 'visible'
              }}
            >
              <path
                d="M 1 1 L 7.5 19.5 L 10.5 12.5 L 17.5 9.5 Z"
                fill={c.color}
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
            <div
              className="cursor-pill"
              style={{
                backgroundColor: c.color,
                marginTop: '2px',
                marginLeft: '10px'
              }}
            >
              <Sparkles size={10} />
              <span>{c.name}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ðŸ‘¤ My Personalized Live Mouse Cursor (Screen-Space 1:1 Precision with Chosen Color) */}
      <div
        ref={myCursorRef}
        className="collaborative-cursor"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          zIndex: 999,
          pointerEvents: 'none',
          willChange: 'transform',
          display: 'none'
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          style={{
            filter: `drop-shadow(0 2px 8px ${userColor}aa)`,
            overflow: 'visible'
          }}
        >
          <path
            d="M 1 1 L 7.5 19.5 L 10.5 12.5 L 17.5 9.5 Z"
            fill={userColor}
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
        <div
          className="cursor-pill"
          style={{
            backgroundColor: userColor,
            boxShadow: `0 4px 16px ${userColor}88`,
            marginTop: '2px',
            marginLeft: '10px',
            opacity: showNameTag ? 1 : 0,
            transform: showNameTag ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(-4px)',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
            pointerEvents: 'none'
          }}
        >
          <Sparkles size={10} />
          <span>{session.currentUser?.name || 'Tú'} (Tú)</span>
        </div>
      </div>

      {/* 🛠️ Toolbox de Modelado UML 2.5+ (Clasificadores, Conectores, Patrones) */}
      {isToolboxOpen && (
        <ToolboxUml25
          onInsertClassifier={handleInsertClassifierFromToolbox}
          onActivateRelationMode={handleActivateRelationFromToolbox}
          onInsertPattern={handleInsertPatternFromToolbox}
          isRelationModeActive={Boolean(connectingSourceId)}
          activeRelationType={selectedRelationType}
          onCancelRelationMode={() => setConnectingSourceId(null)}
          onMouseEnterToolbox={() => {
            // Se mantiene el flag para que el zoom del lienzo no interfiera,
            // pero el cursor colaborativo se conserva visible sobre el panel.
            isMouseOverUiPanel.current = true;
          }}
          onMouseLeaveToolbox={() => {
            isMouseOverUiPanel.current = false;
            if (myCursorRef.current) myCursorRef.current.style.display = 'flex';
          }}
        />
      )}

      {/* 🧭 Dock Unificado de Comandos y Herramientas del Lienzo (Glassmorphism HUD) */}
      {isDockCollapsed ? (
        <button
          onClick={() => setIsDockCollapsed(false)}
          className="glass-command-dock-toggle"
          title="Desplegar barra de herramientas y comandos"
          style={{
            position: 'absolute',
            bottom: '18px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 45,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--glass-topbar-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-topbar-border)',
            borderRadius: '20px',
            padding: '6px 14px',
            boxShadow: 'var(--glass-topbar-shadow)',
            color: 'var(--text-primary)',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <Zap size={14} color="var(--accent-primary)" />
          <span>ArchAI Dock</span>
          <ChevronUp size={14} color="var(--text-secondary)" />
        </button>
      ) : (
        <div
          className="glass-command-dock"
          style={{
            position: 'absolute',
            bottom: '18px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 45,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--glass-topbar-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-topbar-border)',
            borderRadius: '16px',
            padding: '6px 10px',
            boxShadow: 'var(--glass-topbar-shadow)',
            maxWidth: 'calc(100vw - 32px)',
            overflowX: 'auto'
          }}
        >
          {/* Botón de Acceso Directo a Toolbox UML 2.5+ */}
          <button
            onClick={() => setIsToolboxOpen(prev => !prev)}
            className="btn-studio-glass dock-btn"
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
              color: isToolboxOpen ? '#e8c39e' : 'var(--text-secondary)',
              background: isToolboxOpen ? 'rgba(232, 195, 158, 0.20)' : undefined,
              borderColor: isToolboxOpen ? 'rgba(232, 195, 158, 0.50)' : undefined,
              boxShadow: isToolboxOpen ? '0 0 14px rgba(232, 195, 158, 0.30)' : undefined,
              whiteSpace: 'nowrap'
            }}
            title="Toolbox UML 2.5+ (Clasificadores, Conectores y Patrones)"
          >
            <Boxes size={14} color="#e8c39e" />
            <span className="dock-btn-label">Toolbox UML 2.5+</span>
          </button>

          {/* Grupo 1: Acciones de Modelado */}
          <button
            onClick={() => setShowNewClassModal(true)}
            className="btn-studio-primary dock-btn"
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
              whiteSpace: 'nowrap'
            }}
            title="Crear nueva tabla/clase con asistente de campos y enlace rápido"
          >
            <Plus size={14} />
            <span className="dock-btn-label">Nueva Tabla</span>
          </button>

          <button
            onClick={() => setShowTemplatesModal(true)}
            className="btn-studio-glass dock-btn"
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap'
            }}
            title="Insertar arquitectura completa en 1 clic (E-Commerce, Hospital, Universidad, RBAC)"
          >
            <Zap size={14} color="#e8c39e" />
            <span className="dock-btn-label">Plantillas</span>
          </button>

          <button
            onClick={() => {
              if (diagram.classes.length >= 2) {
                setConnectingSourceId(diagram.classes[0].id);
              }
            }}
            className="btn-studio-glass dock-btn"
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
              whiteSpace: 'nowrap'
            }}
            title="Activar modo de conexión visual entre clases del lienzo"
          >
            <Link2 size={14} color="#e8c39e" />
            <span className="dock-btn-label">Conectar</span>
          </button>

          {/* Divisor */}
          <div className="dock-divider" style={{ width: '1px', height: '18px', background: 'var(--glass-topbar-border)', margin: '0 2px' }} />

          {/* Grupo 2: Herramientas del Lienzo */}
          <button
            onClick={handleAutoOrganize}
            className="btn-studio-glass dock-btn"
            style={{
              padding: '6px 10px',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
              whiteSpace: 'nowrap'
            }}
            title="Auto-organizar clases en columnas arquitectónicas limpias"
          >
            <LayoutGrid size={14} />
            <span className="dock-btn-label">Auto-Organizar</span>
          </button>

          {onOpenWhiteboard && (
            <button
              onClick={onOpenWhiteboard}
              className="btn-studio-glass dock-btn"
              style={{
                padding: '6px 10px',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap'
              }}
              title="Digitalizar diagrama dibujado a mano con IA (CU-11)"
            >
              <Camera size={14} />
              <span className="dock-btn-label">Pizarra OCR</span>
            </button>
          )}

          {onToggleAiAssistant && (
            <button
              onClick={onToggleAiAssistant}
              className="btn-studio-glass dock-btn"
              style={{
                padding: '6px 12px',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700,
                color: isAiAssistantOpen ? '#000020' : '#e8c39e',
                background: isAiAssistantOpen ? '#e8c39e' : '#2f2c79',
                borderColor: isAiAssistantOpen ? '#e8c39e' : 'rgba(245, 225, 206, 0.14)',
                boxShadow: isAiAssistantOpen ? '0 0 16px rgba(232, 195, 158, 0.45)' : undefined,
                whiteSpace: 'nowrap'
              }}
              title="Alternar asistente de IA por voz y lenguaje natural (CU-06)"
            >
              <Sparkles size={14} color={isAiAssistantOpen ? '#000020' : '#e8c39e'} />
              <span className="dock-btn-label">Asistente IA</span>
            </button>
          )}

          {/* Divisor */}
          <div className="dock-divider" style={{ width: '1px', height: '18px', background: 'var(--glass-topbar-border)', margin: '0 2px' }} />

          {/* Grupo 3: Zoom, Vista y Paleta de Cursor */}
          <button
            onClick={() => handleZoomStep(-0.15)}
            className="dock-icon-btn"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '5px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Alejar (Zoom Out)"
          >
            <ZoomOut size={15} />
          </button>

          <button
            onClick={() => handleFitToScreen()}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '0.74rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              minWidth: '42px',
              textAlign: 'center',
              cursor: 'pointer',
              padding: '2px 4px',
              borderRadius: '4px'
            }}
            title="Click o Doble Clic en el fondo del lienzo para centrar y auto-ajustar todo (Zoom 5% - 400%)"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            onClick={() => handleZoomStep(0.15)}
            className="dock-icon-btn"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '5px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Acercar (Zoom In)"
          >
            <ZoomIn size={15} />
          </button>

          <button
            onClick={() => handleFitToScreen()}
            className="dock-icon-btn"
            style={{
              background: '#2f2c79',
              border: '1px solid #171a4a',
              color: '#f5e1ce',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.74rem',
              fontWeight: 700
            }}
            title="Ajustar y centrar diagrama a la pantalla (evita desbordamientos)"
          >
            <Maximize2 size={13} />
            <span className="dock-btn-label">Ajustar</span>
          </button>

          {/* Selector de Color de Cursor */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="dock-icon-btn"
              style={{
                background: 'transparent',
                border: 'none',
                color: userColor,
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Elegir el color de mi Cursor / Avatar"
            >
              <Palette size={15} />
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: userColor,
                boxShadow: `0 0 8px ${userColor}`
              }} />
            </button>

            {showColorPicker && (
              <div style={{
                position: 'absolute',
                bottom: '42px',
                right: 0,
                background: 'var(--popover-bg)',
                border: '1px solid var(--popover-border)',
                borderRadius: '10px',
                padding: '8px',
                display: 'flex',
                gap: '6px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
                zIndex: 90
              }}>
                {PALETTE_COLORS.map(c => (
                  <button
                    key={c.hex}
                    onClick={() => {
                      if (onChangeUserColor) onChangeUserColor(c.hex);
                      setShowColorPicker(false);
                    }}
                    title={c.name}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: c.hex,
                      border: userColor === c.hex ? '2px solid var(--text-primary)' : '1px solid rgba(125,125,125,0.3)',
                      boxShadow: userColor === c.hex ? `0 0 12px ${c.hex}` : 'none',
                      cursor: 'pointer',
                      transform: userColor === c.hex ? 'scale(1.15)' : 'scale(1)'
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Divisor */}
          <div className="dock-divider" style={{ width: '1px', height: '18px', background: 'var(--glass-topbar-border)', margin: '0 2px' }} />

          {/* Botón Minimizar Dock */}
          <button
            onClick={() => setIsDockCollapsed(true)}
            className="dock-icon-btn"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Minimizar barra de comandos"
          >
            <ChevronDown size={15} />
          </button>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 🚀 Modal Asistido: Crear Nueva Tabla / Clase UML               */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showNewClassModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--glass-modal-overlay)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 130
          }}
          onClick={() => setShowNewClassModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--glass-modal-bg)',
              border: '1px solid var(--glass-modal-border)',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '520px',
              width: '92%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(2, 132, 199, 0.15)',
                  border: '1px solid rgba(2, 132, 199, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Plus size={18} color="var(--accent-cyan)" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                    Nueva Tabla / Clase UML
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Asistente de modelado rápido con campos y enlaces automáticos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewClassModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Nombre de la Clase */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Nombre de la Tabla / Entidad:
              </label>
              <input
                type="text"
                placeholder="ej. Factura, Cliente, DetalleVenta"
                value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
                autoFocus
                style={{
                  background: 'var(--glass-surface)',
                  border: '1px solid var(--glass-border-color)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '0.92rem',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  color: 'var(--text-primary)'
                }}
              />

              {/* Chips Rápidos de Nombres de Dominio */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '4px' }}>Sugerencias:</span>
                {['Cliente', 'Producto', 'Pedido', 'Factura', 'Usuario', 'Rol', 'Categoria', 'Proveedor', 'Pago', 'Empleado'].map(sug => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setNewClassName(sug)}
                    style={{
                      background: newClassName === sug ? 'var(--accent-primary)' : 'var(--glass-surface)',
                      border: '1px solid var(--glass-border-color)',
                      color: newClassName === sug ? '#fff' : 'var(--text-primary)',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Estereotipo Arquitectónico */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Capa Arquitectónica (Estereotipo):
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                {[
                  { key: 'Class' as const, label: 'Class', color: '#2f2c79' },
                  { key: 'Entity' as const, label: 'Entity', color: '#171a4a' },
                  { key: 'Interface' as const, label: 'Interface', color: '#4a4891' },
                  { key: 'Abstract' as const, label: 'Abstract', color: '#5c688c' },
                  { key: 'Service' as const, label: 'Service', color: '#8892b0' },
                  { key: 'Controller' as const, label: 'Controller', color: '#2f2c79' },
                  { key: 'Repository' as const, label: 'Repository', color: '#4a4891' },
                  { key: 'Enum' as const, label: 'Enum', color: '#171a4a' },
                  { key: 'DTO' as const, label: 'DTO', color: '#5c688c' },
                  { key: 'Component' as const, label: 'Component', color: '#8892b0' },
                  { key: 'Template' as const, label: 'Template', color: '#4a4891' },
                  { key: 'Package' as const, label: 'Package', color: '#2f2c79' },
                  { key: 'Instance' as const, label: 'Instance', color: '#e8c39e' },
                  { key: 'DataType' as const, label: 'DataType', color: '#171a4a' },
                  { key: 'Primitive' as const, label: 'Primitive', color: '#8892b0' },
                  { key: 'Signal' as const, label: 'Signal', color: '#5c688c' },
                  { key: 'AssociationClass' as const, label: 'AssocClass', color: '#4a4891' }
                ].map(st => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setNewClassStereotype(st.key as any)}
                    style={{
                      padding: '5px 2px',
                      borderRadius: '8px',
                      border: newClassStereotype === st.key ? `2px solid ${st.color}` : '1px solid var(--glass-border-color)',
                      background: newClassStereotype === st.key ? '#2f2c79' : 'var(--glass-surface)',
                      color: newClassStereotype === st.key ? '#f5e1ce' : 'var(--text-secondary)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    &laquo;{st.label}&raquo;
                  </button>
                ))}
              </div>
            </div>

            {/* Atributos Iniciales en 1 Clic */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Campos / Atributos iniciales:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={newClassWithIdPk} onChange={e => setNewClassWithIdPk(e.target.checked)} />
                  <span>id (Long PK)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={newClassWithNombre} onChange={e => setNewClassWithNombre(e.target.checked)} />
                  <span>nombre (String)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={newClassWithDesc} onChange={e => setNewClassWithDesc(e.target.checked)} />
                  <span>descripcion (String)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={newClassWithPrecio} onChange={e => setNewClassWithPrecio(e.target.checked)} />
                  <span>precio (Double)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={newClassWithFecha} onChange={e => setNewClassWithFecha(e.target.checked)} />
                  <span>fechaCreacion</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={newClassWithActivo} onChange={e => setNewClassWithActivo(e.target.checked)} />
                  <span>activo (Boolean)</span>
                </label>
              </div>
            </div>

            {/* Enlace Inmediato con otra Tabla Existente */}
            {diagram.classes.length > 0 && (
              <div style={{
                background: 'var(--glass-surface)',
                border: '1px solid var(--glass-border-color)',
                borderRadius: '10px',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Link2 size={14} color="var(--accent-cyan)" />
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Enlazar inmediatamente con tabla existente (opcional):
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={newClassLinkWithTargetId}
                    onChange={e => setNewClassLinkWithTargetId(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'var(--glass-node-bg)',
                      border: '1px solid var(--glass-border-color)',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      fontSize: '0.74rem',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="">(No enlazar al crear)</option>
                    {diagram.classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.stereotype || 'Entity'})
                      </option>
                    ))}
                  </select>

                  {newClassLinkWithTargetId && (
                    <select
                      value={newClassLinkRelType}
                      onChange={e => setNewClassLinkRelType(e.target.value as TipoRelacion)}
                      style={{
                        flex: 1,
                        background: 'var(--glass-node-bg)',
                        border: '1px solid var(--glass-border-color)',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        fontSize: '0.74rem',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <option value="ASSOCIATION_1_N">1:N (Uno a Muchos)</option>
                      <option value="ASSOCIATION_N_M">N:M (Muchos a Muchos)</option>
                      <option value="ASSOCIATION_1_1">1:1 (Uno a Uno)</option>
                      <option value="ASSOCIATION_BINARY">Binaria</option>
                      <option value="COMPOSITION">Composición</option>
                      <option value="AGGREGATION">Agregación</option>
                      <option value="INHERITANCE">Herencia</option>
                      <option value="REALIZATION">Realización</option>
                      <option value="DEPENDENCY">Dependencia</option>
                      <option value="USAGE">«use»</option>
                      <option value="PACKAGE_IMPORT">«import»</option>
                      <option value="NON_NAVIGABLE">No Navegable ✕</option>
                    </select>
                  )}
                </div>
              </div>
            )}

            {/* Botones de Acción */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setShowNewClassModal(false)}
                className="btn-studio-glass"
                style={{ padding: '8px 16px', fontSize: '0.8rem' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleCreateAssistedClass()}
                className="btn-studio-primary"
                style={{
                  padding: '8px 20px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <CheckCircle2 size={16} />
                <span>Crear Tabla</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ⚡ Modal: Plantillas de Negocio / Arquitecturas en 1 Clic     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showTemplatesModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--glass-modal-overlay)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 130
          }}
          onClick={() => setShowTemplatesModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--glass-modal-bg)',
              border: '1px solid var(--glass-modal-border)',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '680px',
              width: '94%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#2f2c79',
                  border: '1px solid #171a4a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Zap size={20} color="#e8c39e" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                    Plantillas de Arquitectura de Negocio
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Modela sistemas empresariales completos en 1 solo clic con tablas y relaciones tipadas
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTemplatesModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Grid de Plantillas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {PLANTILLAS_DISPONIBLES.map(plantilla => (
                <div
                  key={plantilla.id}
                  style={{
                    background: 'var(--glass-surface)',
                    border: `1px solid ${plantilla.color}44`,
                    borderLeft: `4px solid ${plantilla.color}`,
                    borderRadius: '12px',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.3rem' }}>{plantilla.icono}</span>
                      <div>
                        <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                          {plantilla.nombre}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: plantilla.color, fontWeight: 700 }}>
                          {plantilla.categoria} · {plantilla.classesCount} Tablas · {plantilla.relationsCount} Relaciones
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleApplyTemplate(plantilla.id, false)}
                        className="btn-studio-primary"
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Añadir estas tablas conservando lo que ya tienes"
                      >
                        <Plus size={13} />
                        <span>Añadir al Lienzo</span>
                      </button>

                      <button
                        onClick={() => handleApplyTemplate(plantilla.id, true)}
                        className="btn-studio-glass"
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.74rem',
                          fontWeight: 700
                        }}
                        title="Reemplazar el lienzo actual con esta plantilla limpia"
                      >
                        Reemplazar Todo
                      </button>
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {plantilla.descripcion}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {plantilla.diagrama.classes.map(c => (
                      <span
                        key={c.id}
                        style={{
                          background: 'var(--glass-node-attr-item-bg)',
                          border: '1px solid var(--glass-border-color)',
                          borderRadius: '4px',
                          padding: '1px 6px',
                          fontSize: '0.68rem',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text-primary)'
                        }}
                      >
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
