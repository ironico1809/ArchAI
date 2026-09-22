import React, { useState, useEffect, useRef, useMemo } from 'react';
import { InformacionSesion, PerfilUsuario, RolUsuario } from '../../types/auth';
import { ModeloDiagrama, ClaseUml, RelacionUml, AtributoUml, MetodoUml } from '../../types/uml';
import { BarraLateralNavegacion } from '../../components/navegacion/BarraLateralNavegacion';
import { BarraSuperior } from '../../components/navegacion/BarraSuperior';
import { PanelEstructuraProyecto } from '../../components/lienzo/PanelEstructuraProyecto';
import { LienzoInteractivoStudio } from '../../components/lienzo/LienzoInteractivoStudio';
import { AsistenteIaFlotante } from '../../components/asistente_ia/AsistenteIaFlotante';
import { PanelGeneracionCodigo } from '../../components/generador/PanelGeneracionCodigo';
import { ModalEscanerPizarra } from '../../components/lienzo/ModalEscanerPizarra';
import { PanelColaboracion } from '../../components/colaboracion/PanelColaboracion';
import { ModalGestionEquipo } from '../../components/equipo/ModalGestionEquipo';
import { RolEquipo, PermisosUsuario, MiembroEquipo, obtenerPermisosRol } from '../../types/rbac';
import { calcularMadurezProyecto } from '../../services/softwareMaturity';
import { generarMetodosSugeridos } from '../../services/projectBrainService';
import { ClienteStomp } from '../../services/stompClient';
import { generateXmiXml } from '../../services/codeGenerator';
import {
  guardarDiagramaEnNube,
  listarVersiones,
  crearVersion,
  restaurarVersion,
  actualizarPerfil,
  diagramaDesdeBackend,
  listarProyectos,
  listarDiagramas,
  obtenerDiagrama,
  construirPayloadDiagrama,
  obtenerDiagramaSala,
  actualizarDiagramaSala,
  encolarOperacionOffline,
  sincronizarColaOffline,
  obtenerColaOffline
} from '../../services/api';
import { Share2, Copy, Check, X, Save, History, UserCircle, CloudOff, RotateCcw, Upload, Settings2, RefreshCw } from 'lucide-react';

interface PaginaEstudioCanvasProps {
  session: InformacionSesion;
  onLogout: () => void;
  initialDiagram?: ModeloDiagrama;
  onOpenProjects?: () => void;
  projectTitle?: string;
  diagramId?: string;
}

const DIAGRAMA_INICIAL_DEFECTO: ModeloDiagrama = {
  title: 'Sistema de Comercio Electrónico v1.2',
  updatedAt: new Date().toISOString(),
  classes: [
    {
      id: 'cls-controller',
      name: 'ProductController',
      stereotype: 'Controller',
      attributes: [
        { id: 'ca1', name: 'service', type: 'String', visibility: '-' }
      ],
      methods: [
        { id: 'cm1', name: 'handleCreate', returnType: 'ResponseEntity', visibility: '+', parameters: 'ProductDto' },
        { id: 'cm2', name: 'handleGet', returnType: 'ResponseEntity', visibility: '+', parameters: 'Long' },
        { id: 'cm3', name: 'handleUpdate', returnType: 'ResponseEntity', visibility: '+', parameters: 'Long, ProductDto' }
      ],
      position: { x: 60, y: 40 }
    },
    {
      id: 'cls-service',
      name: 'ProductService',
      stereotype: 'Service',
      attributes: [
        { id: 'sa1', name: 'repository', type: 'String', visibility: '-' }
      ],
      methods: [
        { id: 'sm1', name: 'createProduct', returnType: 'Product', visibility: '+', parameters: 'ProductDto' },
        { id: 'sm2', name: 'getProductById', returnType: 'Product', visibility: '+', parameters: 'Long' },
        { id: 'sm3', name: 'updateStock', returnType: 'Boolean', visibility: '+', parameters: 'Long, Integer' }
      ],
      position: { x: 410, y: 40 }
    },
    {
      id: 'cls-repository',
      name: 'ProductRepository',
      stereotype: 'Repository',
      attributes: [
        { id: 'ra1', name: 'dataSource', type: 'String', visibility: '-' }
      ],
      methods: [
        { id: 'rm1', name: 'findAll', returnType: 'List<Product>', visibility: '+' },
        { id: 'rm2', name: 'findById', returnType: 'Optional<Product>', visibility: '+', parameters: 'Long' },
        { id: 'rm3', name: 'save', returnType: 'Product', visibility: '+', parameters: 'Product' },
        { id: 'rm4', name: 'delete', returnType: 'void', visibility: '+', parameters: 'Long' }
      ],
      position: { x: 760, y: 40 }
    },
    {
      id: 'cls-product',
      name: 'Product',
      stereotype: 'Entity',
      attributes: [
        { id: 'pa1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
        { id: 'pa2', name: 'name', type: 'String', visibility: '-' },
        { id: 'pa3', name: 'price', type: 'Double', visibility: '-' },
        { id: 'pa4', name: 'stock', type: 'Integer', visibility: '-' }
      ],
      methods: [
        { id: 'pm1', name: 'calculateDiscount', returnType: 'Double', visibility: '+', parameters: 'Double' },
        { id: 'pm2', name: 'updateStock', returnType: 'Boolean', visibility: '+', parameters: 'Integer' }
      ],
      position: { x: 760, y: 300 }
    }
  ],
  relations: [
    {
      id: 'rel-ctrl-srv',
      sourceClassId: 'cls-controller',
      targetClassId: 'cls-service',
      type: 'ASSOCIATION_1_N',
      sourceMultiplicity: '1',
      targetMultiplicity: '1',
      label: 'delega'
    },
    {
      id: 'rel-srv-repo',
      sourceClassId: 'cls-service',
      targetClassId: 'cls-repository',
      type: 'ASSOCIATION_1_N',
      sourceMultiplicity: '1',
      targetMultiplicity: '1',
      label: 'consulta'
    },
    {
      id: 'rel-repo-prod',
      sourceClassId: 'cls-repository',
      targetClassId: 'cls-product',
      type: 'COMPOSITION',
      sourceMultiplicity: '1',
      targetMultiplicity: '0..*',
      label: 'administra'
    }
  ]
};

export const PaginaEstudioCanvas: React.FC<PaginaEstudioCanvasProps> = ({
  session,
  onLogout,
  initialDiagram,
  onOpenProjects,
  projectTitle,
  diagramId
}) => {
  const [currentSession, setCurrentSession] = useState<InformacionSesion>(session);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('archai_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  const [diagram, setDiagram] = useState<ModeloDiagrama>(() => {
    if (diagramId) {
      try {
        const guardado = localStorage.getItem(`archai_diagram_${diagramId}`);
        if (guardado) {
          const parsed = JSON.parse(guardado);
          if (parsed?.classes?.length) {
            const pTitle = (projectTitle || initialDiagram?.title || '').toLowerCase();
            const esHosp = pTitle.includes('hospit') || pTitle.includes('clíni') || pTitle.includes('clinic') || pTitle.includes('médic') || pTitle.includes('salud');
            const tieneProduct = parsed.classes.some((c: any) => c.name === 'ProductController' || c.name === 'Product');
            if (!(tieneProduct && esHosp)) {
              return parsed;
            }
          }
        }
      } catch {}
    }
    if (initialDiagram) return initialDiagram;
    try {
      const guardadoGeneral = localStorage.getItem('archai_selected_diagram');
      if (guardadoGeneral) {
        const parsed = JSON.parse(guardadoGeneral);
        if (parsed?.classes?.length) return parsed;
      }
    } catch {}
    if (projectTitle) return { ...DIAGRAMA_INICIAL_DEFECTO, title: projectTitle };
    return DIAGRAMA_INICIAL_DEFECTO;
  });
  const [selectedClassId, setSelectedClassId] = useState<string | null>('cls-service');
  const [activeRailTab, setActiveRailTab] = useState<'canvas' | 'team' | 'settings'>('canvas');
  const [isCodeDockOpen, setIsCodeDockOpen] = useState<boolean>(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState<boolean>(false);
  const [showWhiteboardModal, setShowWhiteboardModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [shareCopied, setShareCopied] = useState<boolean>(false);

  useEffect(() => {
    if (diagramId) {
      try {
        const guardado = localStorage.getItem(`archai_diagram_${diagramId}`);
        if (guardado) {
          const parsed = JSON.parse(guardado);
          if (parsed?.classes?.length) {
            const pTitle = (projectTitle || initialDiagram?.title || '').toLowerCase();
            const esHosp = pTitle.includes('hospit') || pTitle.includes('clíni') || pTitle.includes('clinic') || pTitle.includes('médic') || pTitle.includes('salud');
            const tieneProduct = parsed.classes.some((c: any) => c.name === 'ProductController' || c.name === 'Product');
            if (!(tieneProduct && esHosp)) {
              setDiagram(parsed);
              return;
            }
          }
        }
      } catch {}
    }
    if (initialDiagram) {
      setDiagram(initialDiagram);
    } else if (projectTitle) {
      setDiagram(prev => ({ ...prev, title: projectTitle }));
    }
  }, [initialDiagram, projectTitle, diagramId]);

  // Persistir automáticamente cualquier cambio del diagrama en su clave local única y en archai_selected_diagram
  useEffect(() => {
    if (diagram && diagram.classes) {
      try {
        if (diagramId) {
          localStorage.setItem(`archai_diagram_${diagramId}`, JSON.stringify(diagram));
        }
        localStorage.setItem('archai_selected_diagram', JSON.stringify(diagram));
      } catch (e) {
        console.warn('Error al persistir diagrama local', e);
      }
    }
  }, [diagram, diagramId]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('archai_theme', theme);
  }, [theme]);

  // ───────────────── CU-01/CU-04 · Cargar el diagrama PROPIO del usuario al entrar ─────────────────
  // Si entra a una sala colaborativa como invitado, se sincroniza el diagrama de la sala y no el personal.
  useEffect(() => {
    let activo = true;
    const idUsuario = currentSession.currentUser.id;
    if (!idUsuario) return;
    // Si se abrió un proyecto o diagrama específico, NO pisarlo con el primer diagrama por defecto de la nube
    if (initialDiagram || diagramId) return;
    if (!currentSession.currentUser.isHost && currentSession.roomId && currentSession.roomId !== 'LOCAL-MODE') {
      return;
    }

    const claveIdDiagramaPropio = `archai_diagrama_id_${idUsuario}`;

    (async () => {
      try {
        // 1. Diagrama previamente guardado por ESTE usuario en la nube
        const guardadoId = localStorage.getItem(claveIdDiagramaPropio);
        if (guardadoId) {
          const remoto = await obtenerDiagrama(guardadoId);
          if (activo && remoto) {
            const modelo = diagramaDesdeBackend(remoto);
            if (modelo?.classes?.length) {
              setDiagram(modelo);
              setGuardadoEn(guardadoId);
              return;
            }
          }
        }
        // 2. Primer proyecto del usuario → primer diagrama de ese proyecto
        const proyectos = await listarProyectos(idUsuario);
        if (!activo || !proyectos?.length) return;
        const diagramas = await listarDiagramas(proyectos[0].id);
        if (!activo || !diagramas?.length) return;
        const primerId = diagramas[0].id;
        const remoto = await obtenerDiagrama(primerId);
        if (!activo || !remoto) return;
        const modelo = diagramaDesdeBackend(remoto);
        if (!modelo?.classes?.length) return;
        setDiagram(modelo);
        setGuardadoEn(primerId);
        localStorage.setItem(claveIdDiagramaPropio, primerId);
      } catch {
        /* sin conexión o sin diagrama en nube: se conserva el diagrama actual */
      }
    })();

    return () => { activo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ───────────────── CU-03 · Carga y Sincronización Inmediata de la Sala Colaborativa ─────────────────
  useEffect(() => {
    const pin = currentSession.roomId;
    if (!pin || pin === 'LOCAL-MODE') return;
    // Si se abrió un proyecto o diagrama específico, NO pisarlo con el diagrama previo de la sala
    if (initialDiagram || diagramId) return;
    let activo = true;

    (async () => {
      try {
        const datosSala = await obtenerDiagramaSala(pin);
        if (activo && datosSala && datosSala.classes && datosSala.classes.length > 0) {
          const modelo = diagramaDesdeBackend(datosSala);
          diagramRef.current = modelo;
          ultimaAplicacionRemotaRef.current = Date.now();
          setDiagram(modelo);
          setSaveInfo({ tipo: 'ok', texto: `Sincronizado con la sala ${pin} (${modelo.classes.length} clases).` });
        }
      } catch {
        // Sala recién creada o sin diagrama persistido aún en el backend
      }
    })();

    return () => { activo = false; };
  }, [currentSession.roomId]);

  // Espejo del diagrama para comparar cambios de forma no destructiva

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // ─────────────────────── CU-03 · Edición Colaborativa en Tiempo Real (STOMP) ───────────────────────

  const [estadoColab, setEstadoColab] = useState<'conectando' | 'conectado' | 'simulado'>('conectando');
  const [remoteCursors, setRemoteCursors] = useState<{ id: string; name: string; color: string; x: number; y: number }[]>([]);
  const [remoteDraggingNodes, setRemoteDraggingNodes] = useState<Record<string, { name: string; color: string }>>({});
  const timersRemoteDragRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [pinCambioSala, setPinCambioSala] = useState<string>('');
  const stompRef = useRef<ClienteStomp | null>(null);
  const diagramRef = useRef<ModeloDiagrama>(diagram);
  const primeraCargaRef = useRef<boolean>(true);
  const esActualizacionRemotaRef = useRef<boolean>(false);
  const ultimaPublicacionRef = useRef<number>(0);
  const ultimaAplicacionRemotaRef = useRef<number>(0);
  const ultimoCursorLocalRef = useRef<number>(0);
  const temporizadorDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // CU-03: Identificador único por pestaña para permitir pruebas simultáneas incluso con el mismo usuario
  const miInstanciaIdRef = useRef<string>(
    'tab-' + Math.random().toString(36).slice(2, 8) + '-' + Date.now().toString(36)
  );
  // CU-03: bandera para NO golpear la nube con guardados durante un arrastre en curso (solo al soltar)
  const arrastreEnCursoRef = useRef<boolean>(false);

  // Espejo del diagrama para comparar cambios sin reintroducir dependencias circulares
  useEffect(() => { diagramRef.current = diagram; }, [diagram]);

  // Conexión STOMP a la sala: suscribe /topic/collab/{salaId} y anuncia la llegada
  useEffect(() => {
    const habitacionId = currentSession.roomId;
    if (!habitacionId) return;
    let activo = true;

    const emisorIdInstancia = `${currentSession.currentUser.id}#${miInstanciaIdRef.current}`;

    const cliente = new ClienteStomp(
      habitacionId,
      emisorIdInstancia,
      currentSession.currentUser.name,
      (payload: any) => {
        if (!activo) return;
        const tipo = payload?.tipo;
        const emisorId = payload?.emisorId;

        // Ignorar únicamente ecos de esta misma pestaña
        if (emisorId === emisorIdInstancia) return;

        // 1. Detección de nuevo participante en la sala
        if (tipo === 'join' || tipo === 'solicitar_diagrama') {
          const datosUsuario = payload?.payload?.usuario;
          if (datosUsuario && datosUsuario.id) {
            setCurrentSession(prev => {
              const existe = prev.participants.some(p => p.id === datosUsuario.id || p.name === datosUsuario.name);
              if (existe) return prev;
              return {
                ...prev,
                participants: [...prev.participants, datosUsuario]
              };
            });
          }

          // Si tenemos el diagrama o somos anfitrión, enviarlo de inmediato para sincronizar al recién llegado
          if (currentSession.currentUser.isHost || (diagramRef.current.classes && diagramRef.current.classes.length > 0)) {
            setTimeout(() => {
              if (stompRef.current?.estaConectado()) {
                stompRef.current.publicar('diagrama', construirPayloadDiagrama(diagramRef.current));
              }
            }, 120);
          }
          return;
        }

        // 2. Cursor en vivo de colaboradores (CU-03)
        if (tipo === 'cursor') {
          const coords = payload?.payload;
          if (!coords || coords.x === undefined || coords.y === undefined) return;
          setRemoteCursors(prev => {
            const filtrados = prev.filter(c => c.id !== emisorId);
            return [
              ...filtrados,
              {
                id: emisorId,
                name: payload.emisorNombre || 'Colaborador',
                color: coords.color || '#00E5FF',
                x: coords.x,
                y: coords.y
              }
            ];
          });
          return;
        }

        // 3. Movimiento fluido de nodos/tablas en tiempo real a 25 FPS (~40ms)
        if (tipo === 'nodo_mover') {
          const datos = payload?.payload;
          if (!datos || !datos.classId || datos.x === undefined || datos.y === undefined) return;
          const classId = datos.classId;
          const x = datos.x;
          const y = datos.y;
          const nombre = payload.emisorNombre || 'Colaborador';
          const color = datos.color || '#2f2c79';

          // Registrar quién está moviendo la tabla para mostrar indicador visual
          setRemoteDraggingNodes(prev => ({
            ...prev,
            [classId]: { name: nombre, color }
          }));

          // Limpiar automáticamente el estado tras 1.2s de inactividad
          if (timersRemoteDragRef.current[classId]) {
            clearTimeout(timersRemoteDragRef.current[classId]);
          }
          timersRemoteDragRef.current[classId] = setTimeout(() => {
            setRemoteDraggingNodes(prev => {
              const next = { ...prev };
              delete next[classId];
              return next;
            });
          }, 1200);

          // Actualizar posición de la tabla directamente en el diagrama local sin disparar eco
          esActualizacionRemotaRef.current = true;
          ultimaAplicacionRemotaRef.current = Date.now();
          diagramRef.current = {
            ...diagramRef.current,
            classes: diagramRef.current.classes.map(c =>
              c.id === classId ? { ...c, position: { x, y } } : c
            )
          };
          setDiagram(prev => {
            return {
              ...prev,
              classes: prev.classes.map(c =>
                c.id === classId ? { ...c, position: { x, y } } : c
              )
            };
          });
          return;
        }

        // 4. Recepción de diagrama modificado por un compañero (commit final)
        if (tipo === 'diagrama') {
          const datos = payload?.payload;
          if (!datos || typeof datos !== 'object') return;
          try {
            const remoto = diagramaDesdeBackend(datos);
            if (!remoto.classes || remoto.classes.length === 0) return;
            setRemoteDraggingNodes({});
            esActualizacionRemotaRef.current = true;
            ultimaAplicacionRemotaRef.current = Date.now();
            diagramRef.current = remoto;
            setDiagram(remoto);
          } catch {
            /* frame inválido: se ignora */
          }
        }
      },
      (estado) => {
        if (!activo) return;
        if (estado.includes('Conectado')) setEstadoColab('conectado');
        else if (estado.includes('Error') || estado.includes('sin conexión') || estado.includes('Desconectado')) setEstadoColab('simulado');
        else setEstadoColab('conectando');
      }
    );
    stompRef.current = cliente;

    cliente.connect(7000)
      .then(() => {
        if (!activo) return;
        setEstadoColab('conectado');
        cliente.publicar('join', {
          texto: 'unirse a la sala',
          usuario: currentSession.currentUser
        });
        // Si no somos el anfitrión y no abrimos un proyecto específico, pedir el diagrama oficial de la sala
        if (!currentSession.currentUser.isHost && !initialDiagram && !diagramId) {
          cliente.publicar('solicitar_diagrama', {});
        } else {
          // Si somos el anfitrión, respaldar de inmediato el diagrama oficial en la memoria del backend
          if (habitacionId && habitacionId !== 'LOCAL-MODE' && diagramRef.current.classes?.length > 0) {
            actualizarDiagramaSala(habitacionId, diagramRef.current).catch(() => {});
          }
        }
      })
      .catch(() => {
        if (!activo) return;
        setEstadoColab('simulado');
      });

    return () => {
      activo = false;
      stompRef.current?.disconnect();
      stompRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSession.roomId]);

  // Difunde los cambios locales del diagrama por STOMP con Trailing Debounce ultrarrápido (60ms)
  useEffect(() => {
    if (primeraCargaRef.current) {
      primeraCargaRef.current = false;
      return;
    }
    // Si el cambio proviene de una recepción remota por STOMP, no rebotarlo
    if (esActualizacionRemotaRef.current) {
      esActualizacionRemotaRef.current = false;
      return;
    }

    const cliente = stompRef.current;
    if (!cliente || !cliente.estaConectado()) return;

    // Reiniciar el temporizador trailing: garantiza que el estado final siempre se emita
    if (temporizadorDebounceRef.current) {
      clearTimeout(temporizadorDebounceRef.current);
    }

    const diagramaActual = diagram;

    temporizadorDebounceRef.current = setTimeout(() => {
      if (!stompRef.current?.estaConectado()) return;
      ultimaPublicacionRef.current = Date.now();
      const payload = construirPayloadDiagrama(diagramaActual);
      stompRef.current.publicar('diagrama', payload);

      // Respaldar también en backend para nuevos ingresantes o reconexiones
      if (!arrastreEnCursoRef.current && currentSession.roomId && currentSession.roomId !== 'LOCAL-MODE') {
        actualizarDiagramaSala(currentSession.roomId, diagramaActual).catch(() => {});
      }
    }, 60);

    return () => {
      if (temporizadorDebounceRef.current) {
        clearTimeout(temporizadorDebounceRef.current);
      }
    };
  }, [diagram]);

  // Manejador para emitir la posición del ratón en tiempo real al broker STOMP (~18 FPS)
  const manejarCursorMove = (pos: { x: number; y: number }) => {
    const ahora = Date.now();
    if (ahora - ultimoCursorLocalRef.current < 55) return;
    ultimoCursorLocalRef.current = ahora;
    const cliente = stompRef.current;
    if (!cliente || !cliente.estaConectado()) return;
    cliente.publicar('cursor', {
      x: pos.x,
      y: pos.y,
      color: currentSession.currentUser.avatarColor || '#2f2c79'
    });
  };

  // CU-03 · Emitir movimiento fluido de tablas/nodos en tiempo real (~25 FPS)
  const manejarNodeDrag = (classId: string, pos: { x: number; y: number }) => {
    const cliente = stompRef.current;
    if (!cliente || !cliente.estaConectado()) return;
    cliente.publicar('nodo_mover', {
      classId,
      x: pos.x,
      y: pos.y,
      color: currentSession.currentUser.avatarColor || '#2f2c79'
    });
  };

  /** CU-09 · Reenvía la cola offline desde la vista de configuración. */
  const manejarSincronizarCola = async (): Promise<void> => {
    try {
      const n = await sincronizarColaOffline();
      setSaveInfo({ tipo: 'ok', texto: n > 0
        ? `${n} operación(es) offline sincronizada(s) con la nube (CU-09).`
        : 'La cola offline está vacía: todo sincronizado.' });
    } catch (err: any) {
      setSaveInfo({ tipo: 'error', texto: err?.message || 'No se pudo sincronizar la cola offline.' });
    }
  };

  const handleExportXmi = () => {
    const xml = generateXmiXml(diagram);
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${diagram.title.toLowerCase().replace(/\s+/g, '_')}_model.xmi`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAddClass = (newClass: ClaseUml) => {
    setDiagram(prev => ({
      ...prev,
      classes: [...prev.classes, newClass],
      updatedAt: new Date().toISOString()
    }));
    setSelectedClassId(newClass.id);
  };

  const handleDeleteClass = (classId: string) => {
    setDiagram(prev => ({
      ...prev,
      classes: prev.classes.filter(c => c.id !== classId),
      relations: prev.relations.filter(r => r.sourceClassId !== classId && r.targetClassId !== classId),
      updatedAt: new Date().toISOString()
    }));
    if (selectedClassId === classId) {
      setSelectedClassId(null);
    }
  };

  const handleAddAttribute = (classId: string, attribute: AtributoUml) => {
    setDiagram(prev => ({
      ...prev,
      classes: prev.classes.map(cls => {
        if (cls.id === classId || cls.name.toLowerCase() === classId.toLowerCase()) {
          return {
            ...cls,
            attributes: [...cls.attributes, attribute]
          };
        }
        return cls;
      }),
      updatedAt: new Date().toISOString()
    }));
  };

  const handleDeleteAttribute = (classId: string, attrId: string) => {
    setDiagram(prev => ({
      ...prev,
      classes: prev.classes.map(cls => {
        if (cls.id === classId) {
          return {
            ...cls,
            attributes: cls.attributes.filter(a => a.id !== attrId)
          };
        }
        return cls;
      }),
      updatedAt: new Date().toISOString()
    }));
  };

  const handleAddMethod = (classId: string, method: MetodoUml) => {
    setDiagram(prev => ({
      ...prev,
      classes: prev.classes.map(cls => {
        if (cls.id === classId) {
          return {
            ...cls,
            methods: [...cls.methods, method]
          };
        }
        return cls;
      }),
      updatedAt: new Date().toISOString()
    }));
  };

  const handleDeleteMethod = (classId: string, methodId: string) => {
    setDiagram(prev => ({
      ...prev,
      classes: prev.classes.map(cls => {
        if (cls.id === classId) {
          return {
            ...cls,
            methods: cls.methods.filter(m => m.id !== methodId)
          };
        }
        return cls;
      }),
      updatedAt: new Date().toISOString()
    }));
  };

  const handleAddRelation = (relation: RelacionUml) => {
    setDiagram(prev => ({
      ...prev,
      relations: [...prev.relations, relation],
      updatedAt: new Date().toISOString()
    }));
  };

  const handleDeleteRelation = (relationId: string) => {
    setDiagram(prev => ({
      ...prev,
      relations: prev.relations.filter(r => r.id !== relationId),
      updatedAt: new Date().toISOString()
    }));
  };

  const handleChangeUserColor = (color: string) => {
    const updatedUser = { ...currentSession.currentUser, avatarColor: color };
    const updatedParticipants = currentSession.participants.map(p =>
      p.id === currentSession.currentUser.id ? { ...p, avatarColor: color } : p
    );
    const updatedSession: InformacionSesion = {
      ...currentSession,
      currentUser: updatedUser,
      participants: updatedParticipants
    };
    setCurrentSession(updatedSession);
    localStorage.setItem('archai_session', JSON.stringify(updatedSession));
  };

  const handleWhiteboardImport = (importedDiagram: ModeloDiagrama) => {
    setDiagram(importedDiagram);
    setShowWhiteboardModal(false);
  };

  const handleCopySharePin = () => {
    if (currentSession?.roomId) {
      navigator.clipboard.writeText(currentSession.roomId);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  /** CU-03 · Cambiar o conectarse a otra sala en caliente */
  const manejarCambiarSala = async (nuevoPin: string) => {
    const pinLimpio = nuevoPin.trim().toUpperCase();
    if (!pinLimpio) return;

    if (stompRef.current) {
      stompRef.current.disconnect();
      stompRef.current = null;
    }

    const sesionActualizada: InformacionSesion = {
      ...currentSession,
      roomId: pinLimpio,
      roomName: `Sala ${pinLimpio}`
    };
    setCurrentSession(sesionActualizada);
    localStorage.setItem('archai_session', JSON.stringify(sesionActualizada));
    localStorage.setItem('archai_ultima_sala', pinLimpio);
    setShowShareModal(false);
    setPinCambioSala('');
    setSaveInfo({ tipo: 'ok', texto: `Conectado a la sala ${pinLimpio}. Sincronizando diagrama…` });
  };

  // ───────────────────────── CU-01 · Perfil · CU-05 · Nube/Versiones · CU-09 · Offline ─────────────────────────

  const [showGuardarModal, setShowGuardarModal] = useState<boolean>(false);
  const [showVersionesModal, setShowVersionesModal] = useState<boolean>(false);
  const [showPerfilModal, setShowPerfilModal] = useState<boolean>(false);
  const [versiones, setVersiones] = useState<any[]>([]);
  const [guardadoEn, setGuardadoEn] = useState<string | null>(localStorage.getItem('archai_diagrama_id'));
  const [saveInfo, setSaveInfo] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [online, setOnline] = useState<boolean>(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [guardando, setGuardando] = useState<boolean>(false);

  // ───────────────────────── RBAC, Madurez de Software & Cerebro de Código ─────────────────────────
  const [currentRole, setCurrentRole] = useState<RolEquipo>('Arquitecto de Software');
  const [userPermissions, setUserPermissions] = useState<PermisosUsuario>(() => obtenerPermisosRol('Arquitecto de Software'));
  const [isTeamModalOpen, setIsTeamModalOpen] = useState<boolean>(false);
  const [customCodeMap, setCustomCodeMap] = useState<Record<string, string>>({});

  const [miembros, setMiembros] = useState<MiembroEquipo[]>([
    {
      id: currentSession.currentUser.id || 'usr-master',
      name: currentSession.currentUser.name || 'Carlos Criado',
      email: currentSession.currentUser.email || 'carlos.criado@archai.io',
      role: 'Arquitecto de Software',
      avatarColor: '#2f2c79',
      isHost: true,
      permissions: obtenerPermisosRol('Arquitecto de Software')
    },
    {
      id: 'usr-elena',
      name: 'Elena Ramos',
      email: 'elena.tech@archai.io',
      role: 'Líder Técnico',
      avatarColor: '#171a4a',
      isHost: false,
      permissions: obtenerPermisosRol('Líder Técnico')
    },
    {
      id: 'usr-lucas',
      name: 'Lucas Vaca',
      email: 'lucas.backend@archai.io',
      role: 'Desarrollador Backend',
      avatarColor: '#4a4891',
      isHost: false,
      permissions: obtenerPermisosRol('Desarrollador Backend')
    },
    {
      id: 'usr-sofia',
      name: 'Sofia Morales',
      email: 'sofia.front@archai.io',
      role: 'Ingeniero Frontend',
      avatarColor: '#5c688c',
      isHost: false,
      permissions: obtenerPermisosRol('Ingeniero Frontend')
    },
    {
      id: 'usr-diego',
      name: 'Diego Arze',
      email: 'diego.qa@archai.io',
      role: 'Analista QA',
      avatarColor: '#3a3670',
      isHost: false,
      permissions: obtenerPermisosRol('Analista QA')
    },
    {
      id: 'usr-guest',
      name: 'Observador Demo',
      email: 'stakeholder@demo.com',
      role: 'Observador',
      avatarColor: '#8892b0',
      isHost: false,
      permissions: obtenerPermisosRol('Observador')
    }
  ]);

  const maturityScore = useMemo(() => {
    return calcularMadurezProyecto(diagram).porcentajeGlobal;
  }, [diagram]);

  const handleRoleChange = (newRole: RolEquipo) => {
    setCurrentRole(newRole);
    const newPerms = obtenerPermisosRol(newRole);
    setUserPermissions(newPerms);
    setMiembros(prev => prev.map(m => m.id === currentSession.currentUser.id ? { ...m, role: newRole, permissions: newPerms } : m));
    setSaveInfo({ tipo: 'ok', texto: `Rol conmutado a: ${newRole}. Permisos aplicados en vivo.` });
  };

  const handleActualizarMiembro = (miembroActualizado: MiembroEquipo) => {
    setMiembros(prev => prev.map(m => m.id === miembroActualizado.id ? miembroActualizado : m));
    if (miembroActualizado.id === currentSession.currentUser.id) {
      setCurrentRole(miembroActualizado.role);
      setUserPermissions(miembroActualizado.permissions);
    }
    setSaveInfo({ tipo: 'ok', texto: `Permisos de ${miembroActualizado.name} actualizados.` });
  };

  const handleAutoCompletarClase = (classId: string) => {
    setDiagram(prev => {
      const cls = prev.classes.find(c => c.id === classId);
      if (!cls) return prev;
      const metodosSugeridos = generarMetodosSugeridos(cls.name);
      const nombresActuales = new Set(cls.methods.map(m => m.name.toLowerCase()));
      const metodosAInsertar = metodosSugeridos
        .filter(m => !nombresActuales.has(m.name.toLowerCase()))
        .map((m, idx) => ({
          id: `m-sug-${Date.now()}-${idx}`,
          name: m.name,
          returnType: m.returnType,
          visibility: m.visibility,
          parameters: m.parameters
        }));

      if (metodosAInsertar.length === 0) {
        setSaveInfo({ tipo: 'ok', texto: `La clase ${cls.name} ya cuenta con sus métodos de negocio clave.` });
        return prev;
      }

      setSaveInfo({ tipo: 'ok', texto: `⚡ ${metodosAInsertar.length} método(s) de negocio autocompletados en ${cls.name}.` });

      return {
        ...prev,
        updatedAt: new Date().toISOString(),
        classes: prev.classes.map(c => c.id === classId ? { ...c, methods: [...c.methods, ...metodosAInsertar] } : c)
      };
    });
  };

  useEffect(() => {
    const irEnLinea = () => setOnline(true);
    const irFueraDeLinea = () => setOnline(false);
    window.addEventListener('online', irEnLinea);
    window.addEventListener('offline', irFueraDeLinea);
    return () => {
      window.removeEventListener('online', irEnLinea);
      window.removeEventListener('offline', irFueraDeLinea);
    };
  }, []);

  // Auto-dismiss para notificaciones y toasts informativos (4 segundos)
  useEffect(() => {
    if (saveInfo) {
      const timer = setTimeout(() => setSaveInfo(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [saveInfo]);

  /** CU-05 · Guardar el diagrama en la nube (con fallback a cola offline CU-09). */
  const manejarGuardarEnNube = async () => {
    setGuardando(true);
    setSaveInfo(null);
    const payload = construirPayloadDiagrama(diagram, { creadorId: currentSession.currentUser.id });
    if (!online) {
      encolarOperacionOffline('guardar-diagrama', '/api/v1/diagramas', payload);
      setSaveInfo({ tipo: 'ok', texto: 'Sin conexión: el diagrama se encoló y se sincronizará automáticamente (CU-09).' });
      setGuardando(false);
      return;
    }
    try {
      const guardado = await guardarDiagramaEnNube(diagram, undefined, currentSession.currentUser.id);
      const id = guardado?.id;
      if (id) {
        setGuardadoEn(id);
        localStorage.setItem('archai_diagrama_id', id);
        setSaveInfo({ tipo: 'ok', texto: `Diagrama guardado en la nube (id: ${id}).` });
      }
    } catch (err: any) {
      encolarOperacionOffline('guardar-diagrama', '/api/v1/diagramas', payload);
      setSaveInfo({ tipo: 'error', texto: `${err?.message || 'Error al guardar'}. Se encoló para sincronizar después.` });
    } finally {
      setGuardando(false);
    }
  };

  /** CU-05 · Listar versiones del diagrama guardado. */
  const cargarVersiones = async () => {
    if (!guardadoEn) {
      setVersiones([]);
      return;
    }
    try {
      const lista = await listarVersiones(guardadoEn);
      setVersiones(lista);
    } catch {
      setVersiones([]);
    }
  };

  const manejarAbrirVersiones = () => {
    setShowVersionesModal(true);
    cargarVersiones();
  };

  /** CU-05 · Crear una versión con etiqueta (o guardar primero si aún no existe). */
  const manejarCrearVersion = async (etiqueta: string, descripcion: string) => {
    try {
      let idDiagrama = guardadoEn;
      if (!idDiagrama) {
        const guardado = await guardarDiagramaEnNube(diagram, undefined, currentSession.currentUser.id);
        idDiagrama = guardado?.id;
        if (idDiagrama) {
          setGuardadoEn(idDiagrama);
          localStorage.setItem('archai_diagrama_id', idDiagrama);
        }
      }
      if (idDiagrama) {
        await crearVersion(idDiagrama, etiqueta.trim() || undefined as any, descripcion.trim(), currentSession.currentUser.id);
        await cargarVersiones();
      }
    } catch (err: any) {
      setSaveInfo({ tipo: 'error', texto: err?.message || 'No se pudo crear la versión.' });
    }
  };

  /** CU-05 · Restaurar una versión anterior en el lienzo. */
  const manejarRestaurarVersion = async (versionId: string) => {
    if (!guardadoEn) return;
    try {
      const restaurado = await restaurarVersion(guardadoEn, versionId);
      setDiagram(diagramaDesdeBackend(restaurado));
      setShowVersionesModal(false);
      setSaveInfo({ tipo: 'ok', texto: 'Versión restaurada en el lienzo (CU-05).' });
    } catch (err: any) {
      setSaveInfo({ tipo: 'error', texto: err?.message || 'No se pudo restaurar la versión.' });
    }
  };

  /** CU-01 · Actualizar perfil de usuario en el backend. */
  const manejarActualizarPerfil = async (cambios: { name?: string; email?: string; role?: string; avatarColor?: string }) => {
    try {
      const perfil = await actualizarPerfil(currentSession.currentUser.id, cambios as any);
      const usuarioActualizado = { ...currentSession.currentUser, ...perfil };
      const sesionActualizada: InformacionSesion = {
        ...currentSession,
        currentUser: usuarioActualizado,
        participants: currentSession.participants.map(p =>
          p.id === currentSession.currentUser.id ? usuarioActualizado : p
        )
      };
      setCurrentSession(sesionActualizada);
      localStorage.setItem('archai_session', JSON.stringify(sesionActualizada));
      setShowPerfilModal(false);
      setSaveInfo({ tipo: 'ok', texto: 'Perfil actualizado en la nube (CU-01).' });
    } catch (err: any) {
      setSaveInfo({ tipo: 'error', texto: err?.message || 'No se pudo actualizar el perfil.' });
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      backgroundColor: 'var(--bg-app)',
      position: 'relative'
    }}>
      {/* 1. Barra Lateral de Navegación */}
      <BarraLateralNavegacion
        activeTab={activeRailTab}
        onSelectTab={setActiveRailTab}
        currentUser={currentSession.currentUser}
        onLogout={onLogout}
        onOpenProjects={onOpenProjects}
      />

      {/* Área Central del Estudio */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        height: '100%',
        position: 'relative'
      }}>
        {/* 2. Barra Superior con Selector de Tema */}
        <BarraSuperior
          session={currentSession}
          projectTitle={diagram.title}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onOpenProjects={onOpenProjects}
          onExportXmi={handleExportXmi}
          onToggleCodeDock={() => setIsCodeDockOpen(prev => !prev)}
          isCodeDockOpen={isCodeDockOpen}
          onShare={() => setShowShareModal(true)}
          onLogout={onLogout}
          onGuardarNube={() => setShowGuardarModal(true)}
          onVersiones={manejarAbrirVersiones}
          onPerfil={() => setShowPerfilModal(true)}
          online={online}
          onCambiarSala={manejarCambiarSala}
          maturityScore={maturityScore}
          userRole={currentRole}
          onQuickRoleChange={handleRoleChange}
          onOpenTeamModal={() => setIsTeamModalOpen(true)}
          onOpenMaturityAudit={() => setIsAiAssistantOpen(true)}
        />

        {/* Espacio de Trabajo Central (Lienzo + Paneles Flotantes + Dock) */}
        <div style={{
          flex: 1,
          display: 'flex',
          position: 'relative',
          minHeight: 0,
          overflow: 'hidden'
        }}>
          {/* Lienzo Interactivo UML (sólo visible en la vista "canvas") */}
          {activeRailTab === 'canvas' && (
            <>
          <LienzoInteractivoStudio
            diagram={diagram}
            session={currentSession}
            selectedClassId={selectedClassId}
            onSelectClass={setSelectedClassId}
            onUpdateDiagram={setDiagram}
            onAddClass={handleAddClass}
            onDeleteClass={handleDeleteClass}
            onAddAttribute={handleAddAttribute}
            onDeleteAttribute={handleDeleteAttribute}
            onAddMethod={handleAddMethod}
            onDeleteMethod={handleDeleteMethod}
            onAddRelation={handleAddRelation}
            onDeleteRelation={handleDeleteRelation}
            onChangeUserColor={handleChangeUserColor}
            remoteCursors={remoteCursors}
            onCursorMove={manejarCursorMove}
            // CU-03 · Movimiento colaborativo fluido en tiempo real a 25 FPS
            onNodeDrag={manejarNodeDrag}
            remoteDraggingNodes={remoteDraggingNodes}
            onDragStateChange={(enCurso) => { arrastreEnCursoRef.current = enCurso; }}
            onOpenWhiteboard={() => setShowWhiteboardModal(true)}
            onToggleAiAssistant={() => setIsAiAssistantOpen(prev => !prev)}
            isAiAssistantOpen={isAiAssistantOpen}
            userPermissions={userPermissions}
            userRole={currentRole}
            onAutoCompletarClase={handleAutoCompletarClase}
          />

          {/* 3. Panel Flotante de Estructura del Proyecto */}
          <PanelEstructuraProyecto
            classes={diagram.classes}
            selectedClassId={selectedClassId}
            onSelectClass={setSelectedClassId}
            usuarioId={currentSession.currentUser.id}
            onCargarDiagrama={(d) => {
              setDiagram(d);
              setSaveInfo({ tipo: 'ok', texto: `Diagrama cargado: ${d.title}` });
            }}
            onNotificar={(texto, tipo = 'ok') => setSaveInfo({ tipo, texto })}
          />

          {/* 5. Asistente de IA Flotante (NLP y Comandos por Voz) */}
          {isAiAssistantOpen && (
            <AsistenteIaFlotante
              existingClasses={diagram.classes}
              diagram={diagram}
              customFiles={customCodeMap}
              onAddClass={handleAddClass}
              onAddAttribute={handleAddAttribute}
              onAddMethod={handleAddMethod}
              onAddRelation={handleAddRelation}
              onOpenWhiteboard={() => setShowWhiteboardModal(true)}
              onOpenCodeDock={() => setIsCodeDockOpen(true)}
              onClose={() => setIsAiAssistantOpen(false)}
            />
          )}

          {/* 6. Panel Lateral de Generación de Código y DDL */}
          <PanelGeneracionCodigo
            isOpen={isCodeDockOpen}
            onClose={() => setIsCodeDockOpen(false)}
            diagram={diagram}
            onCustomCodeChange={setCustomCodeMap}
            onImportarDiagrama={(d) => {
              setDiagram(d);
              setSaveInfo({ tipo: 'ok', texto: 'Diagrama reconstruido desde XMI (CU-13).' });
            }}
          />
            </>
          )}

          {/* 7. Vista de Equipo y Colaboración en Vivo (CU-03) */}
          {activeRailTab === 'team' && (
            <div style={{
              position: 'absolute',
              inset: 0,
              zIndex: 28,
              overflowY: 'auto',
              padding: '20px'
            }}>
              <div style={{ maxWidth: '720px' }}>
                <PanelColaboracion session={currentSession} />
                <div style={{
                  marginTop: '10px',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  background: 'var(--glass-surface)',
                  border: '1px solid var(--glass-border-color)',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {estadoColab === 'conectado'
                    ? '🟢 Edición en vivo: cada cambio del lienzo se transmite a los participantes de la sala.'
                    : estadoColab === 'conectando'
                      ? '🟡 Conectando al broker STOMP /ws-stomp…'
                      : '⚪ Backend sin conexión: solo modo local (sin sincronización).'}
                  <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {currentSession.roomId}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 8. Configuración del Estudio (tema, offline, datos de sesión) */}
          {activeRailTab === 'settings' && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 28, overflowY: 'auto', padding: '20px', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
              <div className="glass-card" style={{ width: '390px', maxWidth: '100%', padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Settings2 size={18} color="var(--accent-primary)" />
                  <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Configuración del Estudio
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Tema visual</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => setTheme('light')} className="btn-studio-glass" style={{ padding: '4px 12px', fontSize: '0.72rem', fontWeight: 700, opacity: theme === 'light' ? 1 : 0.6 }}>
                        ☀️ Claro
                      </button>
                      <button onClick={() => setTheme('dark')} className="btn-studio-glass" style={{ padding: '4px 12px', fontSize: '0.72rem', fontWeight: 700, opacity: theme === 'dark' ? 1 : 0.6 }}>
                        🌙 Oscuro
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Cola offline (CU-09)</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', fontWeight: 700, color: obtenerColaOffline().length > 0 ? '#e8c39e' : 'var(--accent-emerald)' }}>
                      {obtenerColaOffline().length} pendiente(s)
                    </span>
                  </div>
                  <button
                    onClick={manejarSincronizarCola}
                    className="btn-studio-primary"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.78rem' }}
                  >
                    <RefreshCw size={14} /> Sincronizar cola offline
                  </button>

                  <div style={{ borderTop: '1px solid var(--glass-border-color)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>Sesión actual</div>
                    <div>
                      <UserCircle size={13} color="var(--accent-primary)" style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      <strong>{currentSession.currentUser.name}</strong> · {currentSession.currentUser.role}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-muted)' }}>PIN de sala: {currentSession.roomId}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Colaboración: {estadoColab === 'conectado' ? 'STOMP en vivo' : estadoColab === 'conectando' ? 'conectando…' : 'local'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
                      ArchAI CASE v1.0 · Spring Boot 3 · React 18 · XMI UML 2.5
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Escáner de Pizarra OCR */}
      {showWhiteboardModal && (
        <ModalEscanerPizarra
          onImportDiagram={handleWhiteboardImport}
          onClose={() => setShowWhiteboardModal(false)}
        />
      )}

      {/* Modal de Gestión de Equipo y Permisos RBAC */}
      <ModalGestionEquipo
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        miembros={miembros}
        onActualizarMiembro={handleActualizarMiembro}
        onCambiarMiRol={handleRoleChange}
        currentUserId={currentSession.currentUser.id}
      />

      {/* Modal de Compartir PIN */}
      {showShareModal && (
        <div className="glass-dialog-overlay">
          <div className="glass-dialog-card" style={{
            maxWidth: '430px',
            width: '90%'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Share2 size={20} color="var(--accent-cyan)" />
                <h3 style={{
                  margin: 0,
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--text-primary)'
                }}>
                  Compartir Sesión Colaborativa
                </h3>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Invita a otros ingenieros a conectarse en tiempo real compartiendo el PIN de la sala:
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--modal-pin-box-bg)',
              border: '1px solid var(--modal-pin-box-border)',
              borderRadius: '12px',
              padding: '12px 16px'
            }}>
              <div>
                <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Código de Sala (PIN)
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--modal-pin-box-color)', letterSpacing: '0.08em' }}>
                  {currentSession.roomId}
                </div>
              </div>

              <button
                onClick={handleCopySharePin}
                className="btn-studio-primary"
                style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {shareCopied ? <Check size={14} /> : <Copy size={14} />}
                <span>{shareCopied ? '¡Copiado!' : 'Copiar PIN'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <div>• <strong>Anfitrión:</strong> <span style={{ color: 'var(--text-primary)' }}>{currentSession.hostName}</span></div>
              <div>• <strong>Participantes conectados:</strong> <span style={{ color: 'var(--text-primary)' }}>{currentSession.participants.length}</span></div>
            </div>

            {/* CU-03 · Cambiar o conectarse a otra sala en caliente */}
            <div style={{ borderTop: '1px solid var(--glass-border-color)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '0.80rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Cambiar de sala o unirse al equipo:
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="Ej: ARC-123456"
                  value={pinCambioSala}
                  onChange={e => setPinCambioSala(e.target.value.toUpperCase())}
                  style={{
                    flex: 1,
                    background: 'var(--glass-surface)',
                    border: '1px solid var(--glass-border-color)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.86rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={() => manejarCambiarSala(pinCambioSala)}
                  disabled={!pinCambioSala.trim()}
                  className="btn-studio-primary"
                  style={{ padding: '8px 14px', fontSize: '0.78rem', whiteSpace: 'nowrap', opacity: pinCambioSala.trim() ? 1 : 0.5 }}
                >
                  Conectar
                </button>
              </div>

              {/* Botón directo para unirse a la sala común de pruebas */}
              <button
                onClick={() => manejarCambiarSala('ARC-GRUPO04')}
                className="btn-studio-glass"
                style={{
                  padding: '8px 12px',
                  fontSize: '0.76rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  color: '#f5e1ce',
                  border: '1px solid #171a4a',
                  background: '#2f2c79'
                }}
              >
                <span>⚡ Unirse a sala de prueba común: <strong>ARC-GRUPO04</strong></span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CU-05 · Modal Guardar en la Nube */}
      {showGuardarModal && (
        <ModalGuardarNube
          tituloDiagrama={diagram.title}
          guardadoEn={guardadoEn}
          guardando={guardando}
          online={online}
          onGuardar={manejarGuardarEnNube}
          onAbrirVersiones={() => {
            setShowGuardarModal(false);
            manejarAbrirVersiones();
          }}
          onCerrar={() => setShowGuardarModal(false)}
        />
      )}

      {/* CU-05 · Modal de Versiones */}
      {showVersionesModal && (
        <ModalVersiones
          versiones={versiones}
          guardadoEn={guardadoEn}
          onCrearVersion={manejarCrearVersion}
          onRestaurar={manejarRestaurarVersion}
          onCerrar={() => setShowVersionesModal(false)}
        />
      )}

      {/* CU-01 · Modal de Perfil */}
      {showPerfilModal && (
        <ModalPerfilUsuario
          usuario={currentSession.currentUser}
          onGuardar={manejarActualizarPerfil}
          onCerrar={() => setShowPerfilModal(false)}
        />
      )}

      {/* Toast informativo (CU-01 / CU-05 / CU-09) */}
      {saveInfo && (
        <div
          style={{
            position: 'fixed',
            top: '72px',
            right: isCodeDockOpen ? '436px' : '24px',
            zIndex: 999,
            maxWidth: '380px',
            padding: '10px 16px',
            borderRadius: '12px',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: saveInfo.tipo === 'ok' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
            background: saveInfo.tipo === 'ok' ? 'rgba(16, 185, 129, 0.16)' : 'rgba(244, 63, 94, 0.16)',
            border: `1px solid ${saveInfo.tipo === 'ok' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'}`,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease-out',
            transition: 'right 0.25s ease'
          }}
        >
          <span>{saveInfo.tipo === 'ok' ? '✅' : '⚠️'}</span>
          <span style={{ flex: 1 }}>{saveInfo.texto}</span>
          <button
            onClick={() => setSaveInfo(null)}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: '2px', marginLeft: '4px' }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

/* ───────────── CU-05 · Modal Guardar en la Nube ───────────── */

interface ModalGuardarNubeProps {
  tituloDiagrama: string;
  guardadoEn: string | null;
  guardando: boolean;
  online: boolean;
  onGuardar: () => void;
  onAbrirVersiones: () => void;
  onCerrar: () => void;
}

const ModalGuardarNube: React.FC<ModalGuardarNubeProps> = ({
  tituloDiagrama,
  guardadoEn,
  guardando,
  online,
  onGuardar,
  onAbrirVersiones,
  onCerrar
}) => (
  <div className="glass-dialog-overlay">
    <div className="glass-dialog-card" style={{
      maxWidth: '440px',
      width: '90%'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Save size={20} color="var(--accent-emerald)" />
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            Guardar en la Nube
          </h3>
        </div>
        <button onClick={onCerrar} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
          <X size={18} />
        </button>
      </div>

      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
        <strong>Diagrama:</strong> <span style={{ color: 'var(--text-primary)' }}>{tituloDiagrama}</span>
      </p>

      {!online && (
        <div style={{
          padding: '10px 12px',
          borderRadius: '8px',
          fontSize: '0.78rem',
          fontWeight: 600,
          color: '#e8c39e',
          background: 'rgba(232, 195, 158, 0.15)',
          border: '1px solid rgba(232, 195, 158, 0.35)',
          display: 'flex',
          gap: '6px',
          alignItems: 'center'
        }}>
          <CloudOff size={14} /> Modo offline activo (CU-09): el guardado se encola y se sincroniza al reconectar.
        </div>
      )}

      {guardadoEn && (
        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Último guardado en nube: <strong>{guardadoEn}</strong>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={onGuardar}
          disabled={guardando}
          className="btn-studio-primary"
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: guardando ? 0.6 : 1 }}
        >
          <Upload size={16} />
          {guardando ? 'Guardando...' : 'Guardar ahora'}
        </button>
        <button onClick={onAbrirVersiones} className="btn-studio-glass" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <History size={14} /> Ver versiones
        </button>
      </div>
    </div>
  </div>
);

/* ───────────── CU-05 · Modal de Versiones ───────────── */

interface ModalVersionesProps {
  versiones: any[];
  guardadoEn: string | null;
  onCrearVersion: (etiqueta: string, descripcion: string) => void;
  onRestaurar: (versionId: string) => void;
  onCerrar: () => void;
}

const ModalVersiones: React.FC<ModalVersionesProps> = ({
  versiones,
  guardadoEn,
  onCrearVersion,
  onRestaurar,
  onCerrar
}) => {
  const [etiqueta, setEtiqueta] = useState('');
  const [descripcion, setDescripcion] = useState('');

  return (
    <div className="glass-dialog-overlay">
      <div className="glass-dialog-card" style={{
        maxWidth: '520px',
        width: '92%',
        maxHeight: '82vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={20} color="var(--accent-primary)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
              Historial de Versiones
            </h3>
          </div>
          <button onClick={onCerrar} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {!guardadoEn && (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            El diagrama aún no se ha guardado en la nube. Crea una versión para guardarlo y versionarlo automáticamente (CU-05).
          </div>
        )}

        {/* Formulario de nueva versión */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            value={etiqueta}
            onChange={e => setEtiqueta(e.target.value)}
            placeholder="Etiqueta de la versión (ej. v1.2-clases-finales)"
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid var(--glass-border-color)',
              background: 'var(--glass-surface)',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              outline: 'none'
            }}
          />
          <input
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            placeholder="Descripción del cambio (opcional)"
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid var(--glass-border-color)',
              background: 'var(--glass-surface)',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              outline: 'none'
            }}
          />
          <button
            onClick={() => {
              onCrearVersion(etiqueta || 'versión sin etiqueta', descripcion);
              setEtiqueta('');
              setDescripcion('');
            }}
            className="btn-studio-primary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Upload size={15} /> Crear versión
          </button>
        </div>

        {/* Lista de versiones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {versiones.length === 0 && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>
              Sin versiones registradas todavía.
            </div>
          )}
          {versiones.map(v => (
            <div
              key={v.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid var(--glass-border-color)',
                background: 'var(--glass-surface)'
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    background: 'var(--accent-primary)',
                    color: '#fff',
                    borderRadius: '6px',
                    padding: '1px 6px',
                    fontSize: '0.66rem',
                    fontWeight: 800
                  }}>
                    v{v.numeroVersion}
                  </span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {v.etiqueta}
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {v.descripcionCambio || '—'} · {v.autorNombre || 'anónimo'}
                </div>
              </div>
              <button
                onClick={() => onRestaurar(v.id)}
                className="btn-studio-glass"
                style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem', padding: '6px 10px', flexShrink: 0 }}
                title="Restaurar esta versión en el lienzo"
              >
                <RotateCcw size={13} /> Restaurar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ───────────── CU-01 · Modal de Perfil de Usuario ───────────── */

interface ModalPerfilUsuarioProps {
  usuario: PerfilUsuario;
  onGuardar: (cambios: { name?: string; email?: string; role?: string; avatarColor?: string }) => void;
  onCerrar: () => void;
}

const ROLES_PERFIL: RolUsuario[] = [
  'Arquitecto de Software',
  'Ingeniero de Datos',
  'Desarrollador Backend',
  'Ingeniero Frontend',
  'Líder Técnico'
];

const COLORES_AVATAR = ['#2f2c79', '#171a4a', '#4a4891', '#5c688c', '#8892b0', '#3a3670', '#1e2547'];

const ModalPerfilUsuario: React.FC<ModalPerfilUsuarioProps> = ({ usuario, onGuardar, onCerrar }) => {
  const [nombre, setNombre] = useState(usuario.name);
  const [correo, setCorreo] = useState(usuario.email);
  const [rol, setRol] = useState<RolUsuario>(usuario.role || 'Arquitecto de Software');
  const [color, setColor] = useState(usuario.avatarColor || COLORES_AVATAR[0]);

  return (
    <div className="glass-dialog-overlay">
      <div className="glass-dialog-card" style={{
        maxWidth: '440px',
        width: '90%'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCircle size={20} color="var(--accent-primary)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
              Mi Perfil
            </h3>
          </div>
          <button onClick={onCerrar} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Nombre completo
            <input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              style={{
                width: '100%',
                marginTop: '4px',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid var(--glass-border-color)',
                background: 'var(--glass-surface)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
                boxSizing: 'border-box',
                display: 'block'
              }}
            />
          </label>

          <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Correo electrónico
            <input
              value={correo}
              onChange={e => setCorreo(e.target.value)}
              type="email"
              style={{
                width: '100%',
                marginTop: '4px',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid var(--glass-border-color)',
                background: 'var(--glass-surface)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
                boxSizing: 'border-box',
                display: 'block'
              }}
            />
          </label>

          <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Rol profesional
            <select
              value={rol}
              onChange={e => setRol(e.target.value as RolUsuario)}
              style={{
                width: '100%',
                marginTop: '4px',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid var(--glass-border-color)',
                background: 'var(--glass-surface)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
                boxSizing: 'border-box',
                display: 'block',
                cursor: 'pointer'
              }}
            >
              {ROLES_PERFIL.map(r => (
                <option key={r} value={r} style={{ background: 'var(--glass-modal-bg)', color: 'var(--text-primary)' }}>
                  {r}
                </option>
              ))}
            </select>
          </label>

          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Color de avatar
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              {COLORES_AVATAR.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '8px',
                    backgroundColor: c,
                    border: color === c ? '3px solid var(--text-primary)' : '2px solid var(--glass-border-color)',
                    cursor: 'pointer',
                    boxShadow: color === c ? `0 0 10px ${c}` : 'none'
                  }}
                  title={c}
                />
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => onGuardar({ name: nombre.trim(), email: correo.trim(), role: rol, avatarColor: color })}
          className="btn-studio-primary"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <Upload size={15} /> Guardar cambios en la nube
        </button>
      </div>
    </div>
  );
};
