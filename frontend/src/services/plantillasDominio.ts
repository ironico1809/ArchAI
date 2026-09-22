import { ModeloDiagrama, ClaseUml, RelacionUml } from '../types/uml';

export interface PlantillaDominio {
  id: string;
  nombre: string;
  icono: string;
  categoria: string;
  descripcion: string;
  color: string;
  classesCount: number;
  relationsCount: number;
  diagrama: {
    classes: ClaseUml[];
    relations: RelacionUml[];
  };
}

export const PLANTILLAS_DISPONIBLES: PlantillaDominio[] = [
  {
    id: 'ecommerce',
    nombre: 'E-Commerce y Facturación',
    icono: '🛒',
    categoria: 'Comercio & Finanzas',
    descripcion: 'Gestión completa de tienda en línea: Clientes, Pedidos, Detalle de Carrito, Catálogo de Productos, Facturación Electrónica y Pagos.',
    color: '#0284c7',
    classesCount: 6,
    relationsCount: 5,
    diagrama: {
      classes: [
        {
          id: 'cls-cliente',
          name: 'Cliente',
          stereotype: 'Entity',
          position: { x: 80, y: 120 },
          attributes: [
            { id: 'attr-cli-1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'attr-cli-2', name: 'nombre', type: 'String', visibility: '-' },
            { id: 'attr-cli-3', name: 'email', type: 'String', visibility: '-' },
            { id: 'attr-cli-4', name: 'telefono', type: 'String', visibility: '-' },
            { id: 'attr-cli-5', name: 'direccion', type: 'String', visibility: '-' },
            { id: 'attr-cli-6', name: 'activo', type: 'Boolean', visibility: '-' }
          ],
          methods: [
            { id: 'm-cli-1', name: 'validarEmail', returnType: 'Boolean', visibility: '+' },
            { id: 'm-cli-2', name: 'obtenerHistorialPedidos', returnType: 'List<Pedido>', visibility: '+' }
          ]
        },
        {
          id: 'cls-pedido',
          name: 'Pedido',
          stereotype: 'Entity',
          position: { x: 440, y: 120 },
          attributes: [
            { id: 'attr-ped-1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'attr-ped-2', name: 'clienteId', type: 'Long', visibility: '-' },
            { id: 'attr-ped-3', name: 'fechaPedido', type: 'LocalDateTime', visibility: '-' },
            { id: 'attr-ped-4', name: 'estado', type: 'String', visibility: '-' },
            { id: 'attr-ped-5', name: 'total', type: 'Double', visibility: '-' }
          ],
          methods: [
            { id: 'm-ped-1', name: 'calcularTotal', returnType: 'Double', visibility: '+' },
            { id: 'm-ped-2', name: 'confirmarPedido', returnType: 'void', visibility: '+' }
          ]
        },
        {
          id: 'cls-detalle',
          name: 'DetallePedido',
          stereotype: 'Entity',
          position: { x: 800, y: 120 },
          attributes: [
            { id: 'attr-det-1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'attr-det-2', name: 'pedidoId', type: 'Long', visibility: '-' },
            { id: 'attr-det-3', name: 'productoId', type: 'Long', visibility: '-' },
            { id: 'attr-det-4', name: 'cantidad', type: 'Integer', visibility: '-' },
            { id: 'attr-det-5', name: 'precioUnitario', type: 'Double', visibility: '-' },
            { id: 'attr-det-6', name: 'subtotal', type: 'Double', visibility: '-' }
          ],
          methods: [
            { id: 'm-det-1', name: 'calcularSubtotal', returnType: 'Double', visibility: '+' }
          ]
        },
        {
          id: 'cls-producto',
          name: 'Producto',
          stereotype: 'Entity',
          position: { x: 1140, y: 120 },
          attributes: [
            { id: 'attr-prod-1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'attr-prod-2', name: 'nombre', type: 'String', visibility: '-' },
            { id: 'attr-prod-3', name: 'descripcion', type: 'String', visibility: '-' },
            { id: 'attr-prod-4', name: 'precio', type: 'Double', visibility: '-' },
            { id: 'attr-prod-5', name: 'stock', type: 'Integer', visibility: '-' },
            { id: 'attr-prod-6', name: 'categoria', type: 'String', visibility: '-' }
          ],
          methods: [
            { id: 'm-prod-1', name: 'actualizarStock', returnType: 'Boolean', visibility: '+' },
            { id: 'm-prod-2', name: 'esDisponible', returnType: 'Boolean', visibility: '+' }
          ]
        },
        {
          id: 'cls-factura',
          name: 'Factura',
          stereotype: 'Entity',
          position: { x: 440, y: 460 },
          attributes: [
            { id: 'attr-fac-1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'attr-fac-2', name: 'pedidoId', type: 'Long', visibility: '-' },
            { id: 'attr-fac-3', name: 'numeroFactura', type: 'String', visibility: '-' },
            { id: 'attr-fac-4', name: 'fechaEmision', type: 'LocalDateTime', visibility: '-' },
            { id: 'attr-fac-5', name: 'subtotal', type: 'Double', visibility: '-' },
            { id: 'attr-fac-6', name: 'iva', type: 'Double', visibility: '-' },
            { id: 'attr-fac-7', name: 'total', type: 'Double', visibility: '-' }
          ],
          methods: [
            { id: 'm-fac-1', name: 'generarPdf', returnType: 'byte[]', visibility: '+' },
            { id: 'm-fac-2', name: 'emitirComprobante', returnType: 'void', visibility: '+' }
          ]
        },
        {
          id: 'cls-pago',
          name: 'Pago',
          stereotype: 'Entity',
          position: { x: 800, y: 460 },
          attributes: [
            { id: 'attr-pag-1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'attr-pag-2', name: 'facturaId', type: 'Long', visibility: '-' },
            { id: 'attr-pag-3', name: 'monto', type: 'Double', visibility: '-' },
            { id: 'attr-pag-4', name: 'metodoPago', type: 'String', visibility: '-' },
            { id: 'attr-pag-5', name: 'fechaPago', type: 'LocalDateTime', visibility: '-' },
            { id: 'attr-pag-6', name: 'estado', type: 'String', visibility: '-' }
          ],
          methods: [
            { id: 'm-pag-1', name: 'procesarTransaccion', returnType: 'Boolean', visibility: '+' },
            { id: 'm-pag-2', name: 'reembolsar', returnType: 'Boolean', visibility: '+' }
          ]
        }
      ],
      relations: [
        {
          id: 'rel-ecom-1',
          sourceClassId: 'cls-cliente',
          targetClassId: 'cls-pedido',
          type: 'ASSOCIATION_1_N',
          sourceMultiplicity: '1',
          targetMultiplicity: '*',
          label: 'realiza'
        },
        {
          id: 'rel-ecom-2',
          sourceClassId: 'cls-pedido',
          targetClassId: 'cls-detalle',
          type: 'COMPOSITION',
          sourceMultiplicity: '1',
          targetMultiplicity: '1..*',
          label: 'contiene'
        },
        {
          id: 'rel-ecom-3',
          sourceClassId: 'cls-producto',
          targetClassId: 'cls-detalle',
          type: 'ASSOCIATION_1_N',
          sourceMultiplicity: '1',
          targetMultiplicity: '*',
          label: 'se incluye en'
        },
        {
          id: 'rel-ecom-4',
          sourceClassId: 'cls-pedido',
          targetClassId: 'cls-factura',
          type: 'ASSOCIATION_1_1',
          sourceMultiplicity: '1',
          targetMultiplicity: '1',
          label: 'genera'
        },
        {
          id: 'rel-ecom-5',
          sourceClassId: 'cls-factura',
          targetClassId: 'cls-pago',
          type: 'ASSOCIATION_1_N',
          sourceMultiplicity: '1',
          targetMultiplicity: '1..*',
          label: 'registra'
        }
      ]
    }
  },
  {
    id: 'hospital',
    nombre: 'Hospital y Clínica Médica',
    icono: '🏥',
    categoria: 'Salud & Medicina',
    descripcion: 'Atención a Pacientes, Médicos Especialistas, Gestión de Citas Clínicas, Historiales Médicos y Recetas Farmacéuticas.',
    color: '#059669',
    classesCount: 5,
    relationsCount: 4,
    diagrama: {
      classes: [
        {
          id: 'cls-paciente',
          name: 'Paciente',
          stereotype: 'Entity',
          position: { x: 80, y: 120 },
          attributes: [
            { id: 'attr-pac-1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'attr-pac-2', name: 'nombreCompleto', type: 'String', visibility: '-' },
            { id: 'attr-pac-3', name: 'dni', type: 'String', visibility: '-' },
            { id: 'attr-pac-4', name: 'fechaNacimiento', type: 'LocalDate', visibility: '-' },
            { id: 'attr-pac-5', name: 'telefono', type: 'String', visibility: '-' },
            { id: 'attr-pac-6', name: 'tipoSangre', type: 'String', visibility: '-' }
          ],
          methods: [
            { id: 'm-pac-1', name: 'calcularEdad', returnType: 'Integer', visibility: '+' }
          ]
        },
        {
          id: 'cls-medico',
          name: 'Medico',
          stereotype: 'Entity',
          position: { x: 440, y: 120 },
          attributes: [
            { id: 'attr-med-1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'attr-med-2', name: 'nombreCompleto', type: 'String', visibility: '-' },
            { id: 'attr-med-3', name: 'especialidad', type: 'String', visibility: '-' },
            { id: 'attr-med-4', name: 'matricula', type: 'String', visibility: '-' },
            { id: 'attr-med-5', name: 'email', type: 'String', visibility: '-' },
            { id: 'attr-med-6', name: 'activo', type: 'Boolean', visibility: '-' }
          ],
          methods: [
            { id: 'm-med-1', name: 'estaDisponible', returnType: 'Boolean', visibility: '+' }
          ]
        },
        {
          id: 'cls-cita',
          name: 'CitaMedica',
          stereotype: 'Entity',
          position: { x: 260, y: 440 },
          attributes: [
            { id: 'attr-cit-1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'attr-cit-2', name: 'pacienteId', type: 'Long', visibility: '-' },
            { id: 'attr-cit-3', name: 'medicoId', type: 'Long', visibility: '-' },
            { id: 'attr-cit-4', name: 'fechaHora', type: 'LocalDateTime', visibility: '-' },
            { id: 'attr-cit-5', name: 'motivo', type: 'String', visibility: '-' },
            { id: 'attr-cit-6', name: 'estado', type: 'String', visibility: '-' }
          ],
          methods: [
            { id: 'm-cit-1', name: 'cancelar', returnType: 'void', visibility: '+' },
            { id: 'm-cit-2', name: 'reprogramar', returnType: 'void', visibility: '+' }
          ]
        },
        {
          id: 'cls-historial',
          name: 'HistorialClinico',
          stereotype: 'Entity',
          position: { x: 620, y: 440 },
          attributes: [
            { id: 'attr-his-1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'attr-his-2', name: 'pacienteId', type: 'Long', visibility: '-' },
            { id: 'attr-his-3', name: 'antecedentes', type: 'String', visibility: '-' },
            { id: 'attr-his-4', name: 'alergias', type: 'String', visibility: '-' },
            { id: 'attr-his-5', name: 'fechaApertura', type: 'LocalDate', visibility: '-' }
          ],
          methods: [
            { id: 'm-his-1', name: 'agregarDiagnostico', returnType: 'void', visibility: '+' }
          ]
        },
        {
          id: 'cls-receta',
          name: 'RecetaMedica',
          stereotype: 'Entity',
          position: { x: 960, y: 440 },
          attributes: [
            { id: 'attr-rec-1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'attr-rec-2', name: 'citaId', type: 'Long', visibility: '-' },
            { id: 'attr-rec-3', name: 'medicamentos', type: 'String', visibility: '-' },
            { id: 'attr-rec-4', name: 'indicaciones', type: 'String', visibility: '-' },
            { id: 'attr-rec-5', name: 'fechaEmision', type: 'LocalDate', visibility: '-' }
          ],
          methods: [
            { id: 'm-rec-1', name: 'imprimirReceta', returnType: 'byte[]', visibility: '+' }
          ]
        }
      ],
      relations: [
        {
          id: 'rel-hosp-1',
          sourceClassId: 'cls-paciente',
          targetClassId: 'cls-cita',
          type: 'ASSOCIATION_1_N',
          sourceMultiplicity: '1',
          targetMultiplicity: '*',
          label: 'agenda'
        },
        {
          id: 'rel-hosp-2',
          sourceClassId: 'cls-medico',
          targetClassId: 'cls-cita',
          type: 'ASSOCIATION_1_N',
          sourceMultiplicity: '1',
          targetMultiplicity: '*',
          label: 'atiende'
        },
        {
          id: 'rel-hosp-3',
          sourceClassId: 'cls-paciente',
          targetClassId: 'cls-historial',
          type: 'ASSOCIATION_1_1',
          sourceMultiplicity: '1',
          targetMultiplicity: '1',
          label: 'posee'
        },
        {
          id: 'rel-hosp-4',
          sourceClassId: 'cls-cita',
          targetClassId: 'cls-receta',
          type: 'COMPOSITION',
          sourceMultiplicity: '1',
          targetMultiplicity: '0..*',
          label: 'prescribe'
        }
      ]
    }
  },
  {
    id: 'universidad',
    nombre: 'Universidad & Matrícula',
    icono: '🎓',
    categoria: 'Educación Superior',
    descripcion: 'Sistema de Estudiantes, Profesores, Cursos del Plan de Estudios, Matrículas Académicas y Registro de Calificaciones.',
    color: '#7c3aed',
    classesCount: 5,
    relationsCount: 4,
    diagrama: {
      classes: [
        {
          id: 'cls-estudiante',
          name: 'Estudiante',
          stereotype: 'Entity',
          position: { x: 80, y: 120 },
          attributes: [
            { id: 'attr-est-1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'attr-est-2', name: 'nombre', type: 'String', visibility: '-' },
            { id: 'attr-est-3', name: 'matricula', type: 'String', visibility: '-' },
            { id: 'attr-est-4', name: 'carrera', type: 'String', visibility: '-' },
            { id: 'attr-est-5', name: 'email', type: 'String', visibility: '-' },
            { id: 'attr-est-6', name: 'semestre', type: 'Integer', visibility: '-' }
          ],
          methods: [
            { id: 'm-est-1', name: 'calcularPpa', returnType: 'Double', visibility: '+' }
          ]
        },
        {
          id: 'cls-profesor',
          name: 'Profesor',
          stereotype: 'Entity',
          position: { x: 800, y: 120 },
          attributes: [
            { id: 'attr-pro-1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'attr-pro-2', name: 'nombre', type: 'String', visibility: '-' },
            { id: 'attr-pro-3', name: 'departamento', type: 'String', visibility: '-' },
            { id: 'attr-pro-4', name: 'gradoAcademico', type: 'String', visibility: '-' },
            { id: 'attr-pro-5', name: 'email', type: 'String', visibility: '-' }
          ],
          methods: [
            { id: 'm-pro-1', name: 'asignarCargaHoraria', returnType: 'void', visibility: '+' }
          ]
        },
        {
          id: 'cls-curso',
          name: 'Curso',
          stereotype: 'Entity',
          position: { x: 440, y: 120 },
          attributes: [
            { id: 'attr-cur-1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'attr-cur-2', name: 'codigo', type: 'String', visibility: '-' },
            { id: 'attr-cur-3', name: 'nombre', type: 'String', visibility: '-' },
            { id: 'attr-cur-4', name: 'creditos', type: 'Integer', visibility: '-' },
            { id: 'attr-cur-5', name: 'descripcion', type: 'String', visibility: '-' }
          ],
          methods: [
            { id: 'm-cur-1', name: 'hayCupoDisponible', returnType: 'Boolean', visibility: '+' }
          ]
        },
        {
          id: 'cls-matricula',
          name: 'Matricula',
          stereotype: 'Entity',
          position: { x: 260, y: 440 },
          attributes: [
            { id: 'attr-mat-1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'attr-mat-2', name: 'estudianteId', type: 'Long', visibility: '-' },
            { id: 'attr-mat-3', name: 'cursoId', type: 'Long', visibility: '-' },
            { id: 'attr-mat-4', name: 'periodo', type: 'String', visibility: '-' },
            { id: 'attr-mat-5', name: 'fechaMatricula', type: 'LocalDate', visibility: '-' }
          ],
          methods: [
            { id: 'm-mat-1', name: 'anularMatricula', returnType: 'void', visibility: '+' }
          ]
        },
        {
          id: 'cls-calificacion',
          name: 'Calificacion',
          stereotype: 'Entity',
          position: { x: 620, y: 440 },
          attributes: [
            { id: 'attr-cal-1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'attr-cal-2', name: 'matriculaId', type: 'Long', visibility: '-' },
            { id: 'attr-cal-3', name: 'notaPrimerParcial', type: 'Double', visibility: '-' },
            { id: 'attr-cal-4', name: 'notaSegundoParcial', type: 'Double', visibility: '-' },
            { id: 'attr-cal-5', name: 'examenFinal', type: 'Double', visibility: '-' },
            { id: 'attr-cal-6', name: 'promedioFinal', type: 'Double', visibility: '-' }
          ],
          methods: [
            { id: 'm-cal-1', name: 'calcularPromedio', returnType: 'Double', visibility: '+' },
            { id: 'm-cal-2', name: 'estaAprobado', returnType: 'Boolean', visibility: '+' }
          ]
        }
      ],
      relations: [
        {
          id: 'rel-uni-1',
          sourceClassId: 'cls-profesor',
          targetClassId: 'cls-curso',
          type: 'ASSOCIATION_1_N',
          sourceMultiplicity: '1',
          targetMultiplicity: '*',
          label: 'dicta'
        },
        {
          id: 'rel-uni-2',
          sourceClassId: 'cls-estudiante',
          targetClassId: 'cls-matricula',
          type: 'ASSOCIATION_1_N',
          sourceMultiplicity: '1',
          targetMultiplicity: '*',
          label: 'se inscribe en'
        },
        {
          id: 'rel-uni-3',
          sourceClassId: 'cls-curso',
          targetClassId: 'cls-matricula',
          type: 'ASSOCIATION_1_N',
          sourceMultiplicity: '1',
          targetMultiplicity: '*',
          label: 'registra'
        },
        {
          id: 'rel-uni-4',
          sourceClassId: 'cls-matricula',
          targetClassId: 'cls-calificacion',
          type: 'COMPOSITION',
          sourceMultiplicity: '1',
          targetMultiplicity: '1',
          label: 'obtiene'
        }
      ]
    }
  },
  {
    id: 'seguridad-rbac',
    nombre: 'Seguridad & Control de Acceso (RBAC)',
    icono: '🔐',
    categoria: 'Seguridad & Infraestructura',
    descripcion: 'Autenticación y Autorización por Roles: Usuarios, Roles, Permisos, Asignación de Roles y Control de Sesiones JWT.',
    color: '#d97706',
    classesCount: 5,
    relationsCount: 4,
    diagrama: {
      classes: [
        {
          id: 'cls-usuario',
          name: 'Usuario',
          stereotype: 'Entity',
          position: { x: 80, y: 120 },
          attributes: [
            { id: 'attr-usr-1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'attr-usr-2', name: 'username', type: 'String', visibility: '-' },
            { id: 'attr-usr-3', name: 'email', type: 'String', visibility: '-' },
            { id: 'attr-usr-4', name: 'passwordHash', type: 'String', visibility: '-' },
            { id: 'attr-usr-5', name: 'activo', type: 'Boolean', visibility: '-' },
            { id: 'attr-usr-6', name: 'ultimoAcceso', type: 'LocalDateTime', visibility: '-' }
          ],
          methods: [
            { id: 'm-usr-1', name: 'validarPassword', returnType: 'Boolean', visibility: '+' },
            { id: 'm-usr-2', name: 'bloquearCuenta', returnType: 'void', visibility: '+' }
          ]
        },
        {
          id: 'cls-rol',
          name: 'Rol',
          stereotype: 'Entity',
          position: { x: 440, y: 120 },
          attributes: [
            { id: 'attr-rol-1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'attr-rol-2', name: 'nombre', type: 'String', visibility: '-' },
            { id: 'attr-rol-3', name: 'descripcion', type: 'String', visibility: '-' },
            { id: 'attr-rol-4', name: 'codigo', type: 'String', visibility: '-' }
          ],
          methods: [
            { id: 'm-rol-1', name: 'tienePermiso', returnType: 'Boolean', visibility: '+' }
          ]
        },
        {
          id: 'cls-permiso',
          name: 'Permiso',
          stereotype: 'Entity',
          position: { x: 800, y: 120 },
          attributes: [
            { id: 'attr-per-1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'attr-per-2', name: 'nombre', type: 'String', visibility: '-' },
            { id: 'attr-per-3', name: 'modulo', type: 'String', visibility: '-' },
            { id: 'attr-per-4', name: 'accion', type: 'String', visibility: '-' }
          ],
          methods: []
        },
        {
          id: 'cls-usuario-rol',
          name: 'UsuarioRol',
          stereotype: 'Entity',
          position: { x: 260, y: 440 },
          attributes: [
            { id: 'attr-ur-1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'attr-ur-2', name: 'usuarioId', type: 'Long', visibility: '-' },
            { id: 'attr-ur-3', name: 'rolId', type: 'Long', visibility: '-' },
            { id: 'attr-ur-4', name: 'asignadoEn', type: 'LocalDateTime', visibility: '-' }
          ],
          methods: []
        },
        {
          id: 'cls-sesion',
          name: 'SesionActiva',
          stereotype: 'Entity',
          position: { x: 620, y: 440 },
          attributes: [
            { id: 'attr-ses-1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'attr-ses-2', name: 'usuarioId', type: 'Long', visibility: '-' },
            { id: 'attr-ses-3', name: 'tokenJwt', type: 'String', visibility: '-' },
            { id: 'attr-ses-4', name: 'ipOrigen', type: 'String', visibility: '-' },
            { id: 'attr-ses-5', name: 'expiracion', type: 'LocalDateTime', visibility: '-' }
          ],
          methods: [
            { id: 'm-ses-1', name: 'esValida', returnType: 'Boolean', visibility: '+' },
            { id: 'm-ses-2', name: 'revocar', returnType: 'void', visibility: '+' }
          ]
        }
      ],
      relations: [
        {
          id: 'rel-rbac-1',
          sourceClassId: 'cls-usuario',
          targetClassId: 'cls-usuario-rol',
          type: 'COMPOSITION',
          sourceMultiplicity: '1',
          targetMultiplicity: '1..*',
          label: 'tiene asignado'
        },
        {
          id: 'rel-rbac-2',
          sourceClassId: 'cls-rol',
          targetClassId: 'cls-usuario-rol',
          type: 'ASSOCIATION_1_N',
          sourceMultiplicity: '1',
          targetMultiplicity: '*',
          label: 'asigna a'
        },
        {
          id: 'rel-rbac-3',
          sourceClassId: 'cls-rol',
          targetClassId: 'cls-permiso',
          type: 'ASSOCIATION_N_M',
          sourceMultiplicity: '*',
          targetMultiplicity: '*',
          label: 'incluye'
        },
        {
          id: 'rel-rbac-4',
          sourceClassId: 'cls-usuario',
          targetClassId: 'cls-sesion',
          type: 'COMPOSITION',
          sourceMultiplicity: '1',
          targetMultiplicity: '0..*',
          label: 'inicia'
        }
      ]
    }
  },
  {
    id: 'inventario',
    nombre: 'Inventario & Almacén',
    icono: '📦',
    categoria: 'Logística & Operaciones',
    descripcion: 'Control de existencias, bodegas, movimientos de entrada/salida y proveedores.',
    color: '#059669',
    classesCount: 4,
    relationsCount: 3,
    diagrama: {
      classes: [
        {
          id: 'cls-almacen',
          name: 'Almacen',
          stereotype: 'Entity',
          position: { x: 80, y: 140 },
          attributes: [
            { id: 'attr-alm-1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'attr-alm-2', name: 'codigo', type: 'String', visibility: '-' },
            { id: 'attr-alm-3', name: 'nombre', type: 'String', visibility: '-' },
            { id: 'attr-alm-4', name: 'ubicacion', type: 'String', visibility: '-' },
            { id: 'attr-alm-5', name: 'capacidadMaxima', type: 'Integer', visibility: '-' }
          ],
          methods: [
            { id: 'm-alm-1', name: 'consultarCapacidadDisponible', returnType: 'Integer', visibility: '+' }
          ]
        },
        {
          id: 'cls-prod-inv',
          name: 'Producto',
          stereotype: 'Entity',
          position: { x: 460, y: 140 },
          attributes: [
            { id: 'attr-pinv-1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'attr-pinv-2', name: 'sku', type: 'String', visibility: '-' },
            { id: 'attr-pinv-3', name: 'nombre', type: 'String', visibility: '-' },
            { id: 'attr-pinv-4', name: 'stockActual', type: 'Integer', visibility: '-' },
            { id: 'attr-pinv-5', name: 'stockMinimo', type: 'Integer', visibility: '-' },
            { id: 'attr-pinv-6', name: 'precioUnitario', type: 'Double', visibility: '-' }
          ],
          methods: [
            { id: 'm-pinv-1', name: 'esBajoStock', returnType: 'Boolean', visibility: '+' },
            { id: 'm-pinv-2', name: 'recalcularExistencias', returnType: 'void', visibility: '+' }
          ]
        },
        {
          id: 'cls-movimiento',
          name: 'MovimientoInventario',
          stereotype: 'Entity',
          position: { x: 840, y: 140 },
          attributes: [
            { id: 'attr-mov-1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'attr-mov-2', name: 'tipo', type: 'String', visibility: '-' },
            { id: 'attr-mov-3', name: 'cantidad', type: 'Integer', visibility: '-' },
            { id: 'attr-mov-4', name: 'fechaMovimiento', type: 'LocalDateTime', visibility: '-' },
            { id: 'attr-mov-5', name: 'observaciones', type: 'String', visibility: '-' }
          ],
          methods: [
            { id: 'm-mov-1', name: 'aplicarKardex', returnType: 'Boolean', visibility: '+' }
          ]
        },
        {
          id: 'cls-proveedor',
          name: 'Proveedor',
          stereotype: 'Entity',
          position: { x: 460, y: 460 },
          attributes: [
            { id: 'attr-prov-1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'attr-prov-2', name: 'razonSocial', type: 'String', visibility: '-' },
            { id: 'attr-prov-3', name: 'ruc', type: 'String', visibility: '-' },
            { id: 'attr-prov-4', name: 'telefono', type: 'String', visibility: '-' },
            { id: 'attr-prov-5', name: 'correo', type: 'String', visibility: '-' }
          ],
          methods: [
            { id: 'm-prov-1', name: 'validarRuc', returnType: 'Boolean', visibility: '+' }
          ]
        }
      ],
      relations: [
        {
          id: 'rel-inv-1',
          sourceClassId: 'cls-almacen',
          targetClassId: 'cls-movimiento',
          type: 'ASSOCIATION_1_N',
          sourceMultiplicity: '1',
          targetMultiplicity: '*',
          label: 'registra'
        },
        {
          id: 'rel-inv-2',
          sourceClassId: 'cls-prod-inv',
          targetClassId: 'cls-movimiento',
          type: 'ASSOCIATION_1_N',
          sourceMultiplicity: '1',
          targetMultiplicity: '*',
          label: 'involucra'
        },
        {
          id: 'rel-inv-3',
          sourceClassId: 'cls-proveedor',
          targetClassId: 'cls-prod-inv',
          type: 'ASSOCIATION_1_N',
          sourceMultiplicity: '1',
          targetMultiplicity: '*',
          label: 'suministra'
        }
      ]
    }
  },
  {
    id: 'biblioteca',
    nombre: 'Biblioteca & Préstamos',
    icono: '📚',
    categoria: 'Educación & Cultura',
    descripcion: 'Catálogo de obras literarias, autores, lectores/socios y control de préstamos con multas.',
    color: '#8b5cf6',
    classesCount: 4,
    relationsCount: 3,
    diagrama: {
      classes: [
        {
          id: 'cls-libro',
          name: 'Libro',
          stereotype: 'Entity',
          position: { x: 80, y: 140 },
          attributes: [
            { id: 'attr-lib-1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'attr-lib-2', name: 'isbn', type: 'String', visibility: '-' },
            { id: 'attr-lib-3', name: 'titulo', type: 'String', visibility: '-' },
            { id: 'attr-lib-4', name: 'editorial', type: 'String', visibility: '-' },
            { id: 'attr-lib-5', name: 'ejemplaresDisponibles', type: 'Integer', visibility: '-' }
          ],
          methods: [
            { id: 'm-lib-1', name: 'prestarEjemplar', returnType: 'Boolean', visibility: '+' },
            { id: 'm-lib-2', name: 'devolverEjemplar', returnType: 'void', visibility: '+' }
          ]
        },
        {
          id: 'cls-autor',
          name: 'Autor',
          stereotype: 'Entity',
          position: { x: 80, y: 460 },
          attributes: [
            { id: 'attr-aut-1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'attr-aut-2', name: 'nombreCompleto', type: 'String', visibility: '-' },
            { id: 'attr-aut-3', name: 'nacionalidad', type: 'String', visibility: '-' },
            { id: 'attr-aut-4', name: 'biografia', type: 'String', visibility: '-' }
          ],
          methods: [
            { id: 'm-aut-1', name: 'obtenerBibliografia', returnType: 'List<String>', visibility: '+' }
          ]
        },
        {
          id: 'cls-socio',
          name: 'Socio',
          stereotype: 'Entity',
          position: { x: 480, y: 140 },
          attributes: [
            { id: 'attr-soc-1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'attr-soc-2', name: 'numeroCarnet', type: 'String', visibility: '-' },
            { id: 'attr-soc-3', name: 'nombre', type: 'String', visibility: '-' },
            { id: 'attr-soc-4', name: 'correo', type: 'String', visibility: '-' },
            { id: 'attr-soc-5', name: 'estado', type: 'String', visibility: '-' }
          ],
          methods: [
            { id: 'm-soc-1', name: 'puedeSolicitarPrestamo', returnType: 'Boolean', visibility: '+' }
          ]
        },
        {
          id: 'cls-prestamo',
          name: 'Prestamo',
          stereotype: 'Entity',
          position: { x: 880, y: 140 },
          attributes: [
            { id: 'attr-pres-1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'attr-pres-2', name: 'fechaSalida', type: 'LocalDate', visibility: '-' },
            { id: 'attr-pres-3', name: 'fechaLimiteDevolucion', type: 'LocalDate', visibility: '-' },
            { id: 'attr-pres-4', name: 'fechaEntregaReal', type: 'LocalDate', visibility: '-' },
            { id: 'attr-pres-5', name: 'multaGenerada', type: 'Double', visibility: '-' }
          ],
          methods: [
            { id: 'm-pres-1', name: 'calcularDiasRetraso', returnType: 'Integer', visibility: '+' },
            { id: 'm-pres-2', name: 'liquidarMulta', returnType: 'void', visibility: '+' }
          ]
        }
      ],
      relations: [
        {
          id: 'rel-bib-1',
          sourceClassId: 'cls-autor',
          targetClassId: 'cls-libro',
          type: 'ASSOCIATION_1_N',
          sourceMultiplicity: '1',
          targetMultiplicity: '*',
          label: 'escribe'
        },
        {
          id: 'rel-bib-2',
          sourceClassId: 'cls-socio',
          targetClassId: 'cls-prestamo',
          type: 'ASSOCIATION_1_N',
          sourceMultiplicity: '1',
          targetMultiplicity: '*',
          label: 'solicita'
        },
        {
          id: 'rel-bib-3',
          sourceClassId: 'cls-libro',
          targetClassId: 'cls-prestamo',
          type: 'ASSOCIATION_1_N',
          sourceMultiplicity: '1',
          targetMultiplicity: '*',
          label: 'se presta en'
        }
      ]
    }
  },
  {
    id: 'hotel',
    nombre: 'Hotel & Reservaciones',
    icono: '🏨',
    categoria: 'Turismo & Hospitalidad',
    descripcion: 'Huéspedes, habitaciones por categoría, reservas con fechas de check-in/out y liquidación.',
    color: '#f59e0b',
    classesCount: 4,
    relationsCount: 3,
    diagrama: {
      classes: [
        {
          id: 'cls-habitacion',
          name: 'Habitacion',
          stereotype: 'Entity',
          position: { x: 80, y: 140 },
          attributes: [
            { id: 'attr-hab-1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'attr-hab-2', name: 'numero', type: 'String', visibility: '-' },
            { id: 'attr-hab-3', name: 'tipo', type: 'String', visibility: '-' },
            { id: 'attr-hab-4', name: 'precioPorNoche', type: 'Double', visibility: '-' },
            { id: 'attr-hab-5', name: 'estado', type: 'String', visibility: '-' }
          ],
          methods: [
            { id: 'm-hab-1', name: 'verificarDisponibilidad', returnType: 'Boolean', visibility: '+' }
          ]
        },
        {
          id: 'cls-huesped',
          name: 'Huesped',
          stereotype: 'Entity',
          position: { x: 480, y: 140 },
          attributes: [
            { id: 'attr-hue-1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'attr-hue-2', name: 'dniPasaporte', type: 'String', visibility: '-' },
            { id: 'attr-hue-3', name: 'nombreCompleto', type: 'String', visibility: '-' },
            { id: 'attr-hue-4', name: 'telefono', type: 'String', visibility: '-' },
            { id: 'attr-hue-5', name: 'correo', type: 'String', visibility: '-' }
          ],
          methods: [
            { id: 'm-hue-1', name: 'registrarHistorial', returnType: 'void', visibility: '+' }
          ]
        },
        {
          id: 'cls-reserva',
          name: 'Reserva',
          stereotype: 'Entity',
          position: { x: 880, y: 140 },
          attributes: [
            { id: 'attr-res-1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'attr-res-2', name: 'codigoReserva', type: 'String', visibility: '-' },
            { id: 'attr-res-3', name: 'fechaCheckIn', type: 'LocalDate', visibility: '-' },
            { id: 'attr-res-4', name: 'fechaCheckOut', type: 'LocalDate', visibility: '-' },
            { id: 'attr-res-5', name: 'totalEstadia', type: 'Double', visibility: '-' },
            { id: 'attr-res-6', name: 'estado', type: 'String', visibility: '-' }
          ],
          methods: [
            { id: 'm-res-1', name: 'calcularTotalNoches', returnType: 'Double', visibility: '+' },
            { id: 'm-res-2', name: 'hacerCheckIn', returnType: 'void', visibility: '+' }
          ]
        },
        {
          id: 'cls-pago-hotel',
          name: 'PagoHotel',
          stereotype: 'Entity',
          position: { x: 880, y: 460 },
          attributes: [
            { id: 'attr-pagh-1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
            { id: 'attr-pagh-2', name: 'monto', type: 'Double', visibility: '-' },
            { id: 'attr-pagh-3', name: 'medioPago', type: 'String', visibility: '-' },
            { id: 'attr-pagh-4', name: 'fechaPago', type: 'LocalDateTime', visibility: '-' }
          ],
          methods: [
            { id: 'm-pagh-1', name: 'emitirRecibo', returnType: 'String', visibility: '+' }
          ]
        }
      ],
      relations: [
        {
          id: 'rel-hot-1',
          sourceClassId: 'cls-huesped',
          targetClassId: 'cls-reserva',
          type: 'ASSOCIATION_1_N',
          sourceMultiplicity: '1',
          targetMultiplicity: '*',
          label: 'reserva'
        },
        {
          id: 'rel-hot-2',
          sourceClassId: 'cls-habitacion',
          targetClassId: 'cls-reserva',
          type: 'ASSOCIATION_1_N',
          sourceMultiplicity: '1',
          targetMultiplicity: '*',
          label: 'se asigna en'
        },
        {
          id: 'rel-hot-3',
          sourceClassId: 'cls-reserva',
          targetClassId: 'cls-pago-hotel',
          type: 'ASSOCIATION_1_1',
          sourceMultiplicity: '1',
          targetMultiplicity: '1',
          label: 'se liquida con'
        }
      ]
    }
  }
];

/**
 * Función que crea instancias frescas de las clases y relaciones de una plantilla
 * para evitar colisiones de IDs con los elementos ya existentes en el lienzo.
 */
export const instanciarPlantilla = (
  plantillaId: string,
  diagramaExistente?: ModeloDiagrama
): { classes: ClaseUml[]; relations: RelacionUml[] } | null => {
  const plantilla = PLANTILLAS_DISPONIBLES.find(p => p.id === plantillaId);
  if (!plantilla) return null;

  const timestamp = Date.now();
  const idMap = new Map<string, string>();

  // Generar IDs únicos para clases
  plantilla.diagrama.classes.forEach((c, idx) => {
    idMap.set(c.id, `cls-p-${timestamp}-${idx}`);
  });

  // Calcular desplazamiento para no solapar si ya hay clases
  const offsetX = (diagramaExistente?.classes?.length || 0) > 0 ? 60 : 0;
  const offsetY = (diagramaExistente?.classes?.length || 0) > 0 ? 60 : 0;

  const nuevasClases: ClaseUml[] = plantilla.diagrama.classes.map((c, cIdx) => ({
    ...c,
    id: idMap.get(c.id) || `cls-p-${timestamp}-${cIdx}`,
    position: {
      x: (c.position?.x || 100) + offsetX,
      y: (c.position?.y || 100) + offsetY
    },
    attributes: c.attributes.map((a, aIdx) => ({
      ...a,
      id: `attr-p-${timestamp}-${cIdx}-${aIdx}`
    })),
    methods: c.methods.map((m, mIdx) => ({
      ...m,
      id: `m-p-${timestamp}-${cIdx}-${mIdx}`
    }))
  }));

  const nuevasRelaciones: RelacionUml[] = plantilla.diagrama.relations.map((r, rIdx) => ({
    ...r,
    id: `rel-p-${timestamp}-${rIdx}`,
    sourceClassId: idMap.get(r.sourceClassId) || r.sourceClassId,
    targetClassId: idMap.get(r.targetClassId) || r.targetClassId
  }));

  return { classes: nuevasClases, relations: nuevasRelaciones };
};
