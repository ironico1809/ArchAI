import { ModeloDiagrama } from '../types/uml';

/**
 * 🛒 Proyecto 1 - Diagrama 1: Comercio Electrónico Core
 */
export const DIAGRAMA_ECOMMERCE_CORE: ModeloDiagrama = {
  title: 'Sistema de Comercio Electrónico v1.2',
  updatedAt: new Date().toISOString(),
  classes: [
    {
      id: 'cls-ecom-ctrl',
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
      id: 'cls-ecom-srv',
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
      id: 'cls-ecom-repo',
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
      id: 'cls-ecom-prod',
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
      id: 'rel-ecom-1',
      sourceClassId: 'cls-ecom-ctrl',
      targetClassId: 'cls-ecom-srv',
      type: 'ASSOCIATION_1_N',
      sourceMultiplicity: '1',
      targetMultiplicity: '1',
      label: 'delega'
    },
    {
      id: 'rel-ecom-2',
      sourceClassId: 'cls-ecom-srv',
      targetClassId: 'cls-ecom-repo',
      type: 'ASSOCIATION_1_N',
      sourceMultiplicity: '1',
      targetMultiplicity: '1',
      label: 'consulta'
    },
    {
      id: 'rel-ecom-3',
      sourceClassId: 'cls-ecom-repo',
      targetClassId: 'cls-ecom-prod',
      type: 'COMPOSITION',
      sourceMultiplicity: '1',
      targetMultiplicity: '0..*',
      label: 'administra'
    }
  ]
};

/**
 * 🛡️ Proyecto 1 - Diagrama 2: Módulo de Seguridad y RBAC
 */
export const DIAGRAMA_SEGURIDAD_RBAC: ModeloDiagrama = {
  title: 'Módulo de Seguridad y RBAC',
  updatedAt: new Date().toISOString(),
  classes: [
    {
      id: 'cls-auth-ctrl',
      name: 'AuthController',
      stereotype: 'Controller',
      attributes: [
        { id: 'ac1', name: 'authService', type: 'String', visibility: '-' },
        { id: 'ac2', name: 'jwtProvider', type: 'String', visibility: '-' }
      ],
      methods: [
        { id: 'am1', name: 'login', returnType: 'ResponseEntity', visibility: '+', parameters: 'LoginDto' },
        { id: 'am2', name: 'register', returnType: 'ResponseEntity', visibility: '+', parameters: 'RegisterDto' },
        { id: 'am3', name: 'refreshToken', returnType: 'TokenDto', visibility: '+', parameters: 'String' }
      ],
      position: { x: 60, y: 40 }
    },
    {
      id: 'cls-auth-srv',
      name: 'AuthService',
      stereotype: 'Service',
      attributes: [
        { id: 'as1', name: 'usuarioRepository', type: 'String', visibility: '-' },
        { id: 'as2', name: 'passwordEncoder', type: 'String', visibility: '-' }
      ],
      methods: [
        { id: 'asm1', name: 'authenticate', returnType: 'AuthResult', visibility: '+', parameters: 'String, String' },
        { id: 'asm2', name: 'validateToken', returnType: 'Boolean', visibility: '+', parameters: 'String' },
        { id: 'asm3', name: 'revokeSession', returnType: 'void', visibility: '+', parameters: 'Long' }
      ],
      position: { x: 410, y: 40 }
    },
    {
      id: 'cls-auth-repo',
      name: 'UsuarioRepository',
      stereotype: 'Repository',
      attributes: [
        { id: 'ar1', name: 'entityManager', type: 'String', visibility: '-' }
      ],
      methods: [
        { id: 'arm1', name: 'findByEmail', returnType: 'Optional<Usuario>', visibility: '+', parameters: 'String' },
        { id: 'arm2', name: 'existsByUsername', returnType: 'Boolean', visibility: '+', parameters: 'String' },
        { id: 'arm3', name: 'save', returnType: 'Usuario', visibility: '+', parameters: 'Usuario' }
      ],
      position: { x: 760, y: 40 }
    },
    {
      id: 'cls-auth-user',
      name: 'Usuario',
      stereotype: 'Entity',
      attributes: [
        { id: 'au1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
        { id: 'au2', name: 'username', type: 'String', visibility: '-' },
        { id: 'au3', name: 'email', type: 'String', visibility: '-' },
        { id: 'au4', name: 'passwordHash', type: 'String', visibility: '-' },
        { id: 'au5', name: 'isActive', type: 'Boolean', visibility: '-' }
      ],
      methods: [
        { id: 'aum1', name: 'isAccountNonLocked', returnType: 'Boolean', visibility: '+' },
        { id: 'aum2', name: 'verifyPassword', returnType: 'Boolean', visibility: '+', parameters: 'String' }
      ],
      position: { x: 760, y: 300 }
    },
    {
      id: 'cls-auth-role',
      name: 'Rol',
      stereotype: 'Entity',
      attributes: [
        { id: 'ro1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
        { id: 'ro2', name: 'nombre', type: 'String', visibility: '-' },
        { id: 'ro3', name: 'nivelJerarquia', type: 'Integer', visibility: '-' }
      ],
      methods: [
        { id: 'rom1', name: 'tienePermiso', returnType: 'Boolean', visibility: '+', parameters: 'String' }
      ],
      position: { x: 410, y: 300 }
    }
  ],
  relations: [
    {
      id: 'rel-auth-1',
      sourceClassId: 'cls-auth-ctrl',
      targetClassId: 'cls-auth-srv',
      type: 'ASSOCIATION_1_N',
      sourceMultiplicity: '1',
      targetMultiplicity: '1',
      label: 'delega'
    },
    {
      id: 'rel-auth-2',
      sourceClassId: 'cls-auth-srv',
      targetClassId: 'cls-auth-repo',
      type: 'ASSOCIATION_1_N',
      sourceMultiplicity: '1',
      targetMultiplicity: '1',
      label: 'consulta'
    },
    {
      id: 'rel-auth-3',
      sourceClassId: 'cls-auth-repo',
      targetClassId: 'cls-auth-user',
      type: 'COMPOSITION',
      sourceMultiplicity: '1',
      targetMultiplicity: '0..*',
      label: 'persiste'
    },
    {
      id: 'rel-auth-4',
      sourceClassId: 'cls-auth-user',
      targetClassId: 'cls-auth-role',
      type: 'ASSOCIATION_1_N',
      sourceMultiplicity: '*',
      targetMultiplicity: '1..*',
      label: 'asigna'
    }
  ]
};

/**
 * 💳 Proyecto 2: Plataforma Fintech & Billetera Digital
 */
export const DIAGRAMA_FINTECH_LEDGER: ModeloDiagrama = {
  title: 'Ledger Transaccional y Saldos',
  updatedAt: new Date().toISOString(),
  classes: [
    {
      id: 'cls-fin-ctrl',
      name: 'WalletController',
      stereotype: 'Controller',
      attributes: [
        { id: 'fc1', name: 'transferService', type: 'String', visibility: '-' }
      ],
      methods: [
        { id: 'fcm1', name: 'transferFunds', returnType: 'ResponseEntity', visibility: '+', parameters: 'TransferDto' },
        { id: 'fcm2', name: 'getBalance', returnType: 'AccountBalanceDto', visibility: '+', parameters: 'Long' },
        { id: 'fcm3', name: 'getTransactions', returnType: 'List<Tx>', visibility: '+', parameters: 'Long' }
      ],
      position: { x: 60, y: 40 }
    },
    {
      id: 'cls-fin-srv',
      name: 'TransferService',
      stereotype: 'Service',
      attributes: [
        { id: 'fs1', name: 'accountRepository', type: 'String', visibility: '-' },
        { id: 'fs2', name: 'auditLogger', type: 'String', visibility: '-' }
      ],
      methods: [
        { id: 'fsm1', name: 'executeTransfer', returnType: 'Receipt', visibility: '+', parameters: 'Long, Long, Double' },
        { id: 'fsm2', name: 'freezeAccount', returnType: 'Boolean', visibility: '+', parameters: 'Long' },
        { id: 'fsm3', name: 'reconcileLedger', returnType: 'Report', visibility: '+' }
      ],
      position: { x: 410, y: 40 }
    },
    {
      id: 'cls-fin-repo',
      name: 'AccountRepository',
      stereotype: 'Repository',
      attributes: [
        { id: 'fr1', name: 'dataSourcePool', type: 'String', visibility: '-' }
      ],
      methods: [
        { id: 'frm1', name: 'findByAccountNo', returnType: 'Optional<BankAccount>', visibility: '+', parameters: 'Long' },
        { id: 'frm2', name: 'updateBalance', returnType: 'void', visibility: '+', parameters: 'Long, Double' },
        { id: 'frm3', name: 'saveEntry', returnType: 'void', visibility: '+', parameters: 'Transaction' }
      ],
      position: { x: 760, y: 40 }
    },
    {
      id: 'cls-fin-acc',
      name: 'BankAccount',
      stereotype: 'Entity',
      attributes: [
        { id: 'fa1', name: 'accountNumber', type: 'Long', visibility: '-', isPrimaryKey: true },
        { id: 'fa2', name: 'holderName', type: 'String', visibility: '-' },
        { id: 'fa3', name: 'balance', type: 'Double', visibility: '-' },
        { id: 'fa4', name: 'currency', type: 'String', visibility: '-' },
        { id: 'fa5', name: 'isActive', type: 'Boolean', visibility: '-' }
      ],
      methods: [
        { id: 'fam1', name: 'deposit', returnType: 'void', visibility: '+', parameters: 'Double' },
        { id: 'fam2', name: 'withdraw', returnType: 'Boolean', visibility: '+', parameters: 'Double' }
      ],
      position: { x: 760, y: 300 }
    },
    {
      id: 'cls-fin-tx',
      name: 'Transaction',
      stereotype: 'Entity',
      attributes: [
        { id: 'ft1', name: 'txId', type: 'Long', visibility: '-', isPrimaryKey: true },
        { id: 'ft2', name: 'originAccount', type: 'Long', visibility: '-' },
        { id: 'ft3', name: 'targetAccount', type: 'Long', visibility: '-' },
        { id: 'ft4', name: 'amount', type: 'Double', visibility: '-' },
        { id: 'ft5', name: 'timestamp', type: 'LocalDateTime', visibility: '-' }
      ],
      methods: [
        { id: 'ftm1', name: 'signTransaction', returnType: 'String', visibility: '+' },
        { id: 'ftm2', name: 'isSettled', returnType: 'Boolean', visibility: '+' }
      ],
      position: { x: 410, y: 300 }
    }
  ],
  relations: [
    {
      id: 'rel-fin-1',
      sourceClassId: 'cls-fin-ctrl',
      targetClassId: 'cls-fin-srv',
      type: 'ASSOCIATION_1_N',
      sourceMultiplicity: '1',
      targetMultiplicity: '1',
      label: 'delega'
    },
    {
      id: 'rel-fin-2',
      sourceClassId: 'cls-fin-srv',
      targetClassId: 'cls-fin-repo',
      type: 'ASSOCIATION_1_N',
      sourceMultiplicity: '1',
      targetMultiplicity: '1',
      label: 'audita'
    },
    {
      id: 'rel-fin-3',
      sourceClassId: 'cls-fin-repo',
      targetClassId: 'cls-fin-acc',
      type: 'COMPOSITION',
      sourceMultiplicity: '1',
      targetMultiplicity: '0..*',
      label: 'gestiona'
    },
    {
      id: 'rel-fin-4',
      sourceClassId: 'cls-fin-acc',
      targetClassId: 'cls-fin-tx',
      type: 'ASSOCIATION_1_N',
      sourceMultiplicity: '1',
      targetMultiplicity: '*',
      label: 'registra'
    }
  ]
};

/**
 * 🩺 Proyecto 3: Telemetría IoT y Dispositivos Médicos
 */
export const DIAGRAMA_IOT_TELEMETRIA: ModeloDiagrama = {
  title: 'Monitorización de Sensores ICU',
  updatedAt: new Date().toISOString(),
  classes: [
    {
      id: 'cls-iot-ctrl',
      name: 'TelemetryController',
      stereotype: 'Controller',
      attributes: [
        { id: 'ic1', name: 'vitalService', type: 'String', visibility: '-' }
      ],
      methods: [
        { id: 'icm1', name: 'ingestPacket', returnType: 'ResponseEntity', visibility: '+', parameters: 'TelemetryDto' },
        { id: 'icm2', name: 'getLiveVitals', returnType: 'SseEmitter', visibility: '+', parameters: 'Long' },
        { id: 'icm3', name: 'triggerAlert', returnType: 'void', visibility: '+', parameters: 'Long' }
      ],
      position: { x: 60, y: 40 }
    },
    {
      id: 'cls-iot-srv',
      name: 'VitalSignService',
      stereotype: 'Service',
      attributes: [
        { id: 'is1', name: 'deviceRepository', type: 'String', visibility: '-' },
        { id: 'is2', name: 'aiDiagnosticEngine', type: 'String', visibility: '-' }
      ],
      methods: [
        { id: 'ism1', name: 'analyzeHeartRate', returnType: 'Diagnostic', visibility: '+', parameters: 'Integer' },
        { id: 'ism2', name: 'checkThresholds', returnType: 'Boolean', visibility: '+', parameters: 'VitalTelemetry' },
        { id: 'ism3', name: 'broadcastEmergency', returnType: 'void', visibility: '+', parameters: 'Alert' }
      ],
      position: { x: 410, y: 40 }
    },
    {
      id: 'cls-iot-repo',
      name: 'DeviceRepository',
      stereotype: 'Repository',
      attributes: [
        { id: 'ir1', name: 'timeSeriesClient', type: 'String', visibility: '-' }
      ],
      methods: [
        { id: 'irm1', name: 'findByDeviceId', returnType: 'Optional<MedicalDevice>', visibility: '+', parameters: 'String' },
        { id: 'irm2', name: 'recordVital', returnType: 'void', visibility: '+', parameters: 'VitalTelemetry' },
        { id: 'irm3', name: 'getHistory', returnType: 'List<VitalTelemetry>', visibility: '+', parameters: 'String' }
      ],
      position: { x: 760, y: 40 }
    },
    {
      id: 'cls-iot-dev',
      name: 'MedicalDevice',
      stereotype: 'Entity',
      attributes: [
        { id: 'id1', name: 'serialNumber', type: 'String', visibility: '-', isPrimaryKey: true },
        { id: 'id2', name: 'wardRoom', type: 'String', visibility: '-' },
        { id: 'id3', name: 'patientId', type: 'Long', visibility: '-' },
        { id: 'id4', name: 'batteryPct', type: 'Integer', visibility: '-' },
        { id: 'id5', name: 'isOnline', type: 'Boolean', visibility: '-' }
      ],
      methods: [
        { id: 'idm1', name: 'pingDevice', returnType: 'Boolean', visibility: '+' },
        { id: 'idm2', name: 'calibrateSensor', returnType: 'void', visibility: '+' }
      ],
      position: { x: 760, y: 300 }
    },
    {
      id: 'cls-iot-tel',
      name: 'VitalTelemetry',
      stereotype: 'Entity',
      attributes: [
        { id: 'it1', name: 'sampleId', type: 'Long', visibility: '-', isPrimaryKey: true },
        { id: 'it2', name: 'heartRateBpm', type: 'Integer', visibility: '-' },
        { id: 'it3', name: 'spO2Pct', type: 'Double', visibility: '-' },
        { id: 'it4', name: 'systolicBp', type: 'Integer', visibility: '-' },
        { id: 'it5', name: 'recordedAt', type: 'LocalDateTime', visibility: '-' }
      ],
      methods: [
        { id: 'itm1', name: 'isCritical', returnType: 'Boolean', visibility: '+' },
        { id: 'itm2', name: 'calculateRiskScore', returnType: 'Integer', visibility: '+' }
      ],
      position: { x: 410, y: 300 }
    }
  ],
  relations: [
    {
      id: 'rel-iot-1',
      sourceClassId: 'cls-iot-ctrl',
      targetClassId: 'cls-iot-srv',
      type: 'ASSOCIATION_1_N',
      sourceMultiplicity: '1',
      targetMultiplicity: '1',
      label: 'transmite'
    },
    {
      id: 'rel-iot-2',
      sourceClassId: 'cls-iot-srv',
      targetClassId: 'cls-iot-repo',
      type: 'ASSOCIATION_1_N',
      sourceMultiplicity: '1',
      targetMultiplicity: '1',
      label: 'persiste'
    },
    {
      id: 'rel-iot-3',
      sourceClassId: 'cls-iot-repo',
      targetClassId: 'cls-iot-dev',
      type: 'COMPOSITION',
      sourceMultiplicity: '1',
      targetMultiplicity: '0..*',
      label: 'monitorea'
    },
    {
      id: 'rel-iot-4',
      sourceClassId: 'cls-iot-dev',
      targetClassId: 'cls-iot-tel',
      type: 'ASSOCIATION_1_N',
      sourceMultiplicity: '1',
      targetMultiplicity: '*',
      label: 'emite'
    }
  ]
};

/**
 * 🏥 Proyecto: Sistema Clínico Hospitalario (CU-02 / CU-04)
 */
export const DIAGRAMA_HOSPITAL_CLINICO: ModeloDiagrama = {
  title: 'Sistema Clínico Hospitalario',
  updatedAt: new Date().toISOString(),
  classes: [
    {
      id: 'cls-hosp-ctrl',
      name: 'ConsultaMedicaController',
      stereotype: 'Controller',
      attributes: [
        { id: 'hca1', name: 'atencionService', type: 'String', visibility: '-' }
      ],
      methods: [
        { id: 'hcm1', name: 'agendarConsulta', returnType: 'ResponseEntity', visibility: '+', parameters: 'AgendarConsultaDto' },
        { id: 'hcm2', name: 'obtenerHistorialPaciente', returnType: 'ResponseEntity', visibility: '+', parameters: 'Long' },
        { id: 'hcm3', name: 'registrarDiagnostico', returnType: 'ResponseEntity', visibility: '+', parameters: 'Long, DiagnosticoDto' }
      ],
      position: { x: 60, y: 40 }
    },
    {
      id: 'cls-hosp-srv',
      name: 'AtencionClinicaService',
      stereotype: 'Service',
      attributes: [
        { id: 'hsa1', name: 'pacienteRepository', type: 'String', visibility: '-' },
        { id: 'hsa2', name: 'consultaRepository', type: 'String', visibility: '-' }
      ],
      methods: [
        { id: 'hsm1', name: 'registrarPaciente', returnType: 'Paciente', visibility: '+', parameters: 'PacienteDto' },
        { id: 'hsm2', name: 'crearConsulta', returnType: 'ConsultaMedica', visibility: '+', parameters: 'Long, Long, LocalDateTime' },
        { id: 'hsm3', name: 'emitirRecetaDigital', returnType: 'Receta', visibility: '+', parameters: 'Long, List<String>' }
      ],
      position: { x: 410, y: 40 }
    },
    {
      id: 'cls-hosp-repo',
      name: 'HistorialClinicoRepository',
      stereotype: 'Repository',
      attributes: [
        { id: 'hra1', name: 'entityManager', type: 'String', visibility: '-' }
      ],
      methods: [
        { id: 'hrm1', name: 'findByRutPaciente', returnType: 'Optional<Paciente>', visibility: '+', parameters: 'String' },
        { id: 'hrm2', name: 'findConsultasByMedico', returnType: 'List<ConsultaMedica>', visibility: '+', parameters: 'Long' },
        { id: 'hrm3', name: 'saveConsulta', returnType: 'ConsultaMedica', visibility: '+', parameters: 'ConsultaMedica' }
      ],
      position: { x: 760, y: 40 }
    },
    {
      id: 'cls-hosp-pac',
      name: 'Paciente',
      stereotype: 'Entity',
      attributes: [
        { id: 'hpa1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
        { id: 'hpa2', name: 'nombreCompleto', type: 'String', visibility: '-' },
        { id: 'hpa3', name: 'rutDni', type: 'String', visibility: '-' },
        { id: 'hpa4', name: 'grupoSanguineo', type: 'String', visibility: '-' },
        { id: 'hpa5', name: 'alergias', type: 'String', visibility: '-' }
      ],
      methods: [
        { id: 'hpm1', name: 'esMenorDeEdad', returnType: 'Boolean', visibility: '+' },
        { id: 'hpm2', name: 'calcularEdad', returnType: 'Integer', visibility: '+' }
      ],
      position: { x: 60, y: 320 }
    },
    {
      id: 'cls-hosp-med',
      name: 'MedicoEspecialista',
      stereotype: 'Entity',
      attributes: [
        { id: 'hma1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
        { id: 'hma2', name: 'nombre', type: 'String', visibility: '-' },
        { id: 'hma3', name: 'especialidad', type: 'String', visibility: '-' },
        { id: 'hma4', name: 'colegiaturaMedica', type: 'String', visibility: '-' },
        { id: 'hma5', name: 'estaDisponible', type: 'Boolean', visibility: '-' }
      ],
      methods: [
        { id: 'hmm1', name: 'verificarTurno', returnType: 'Boolean', visibility: '+' },
        { id: 'hmm2', name: 'registrarDisponibilidad', returnType: 'void', visibility: '+', parameters: 'Boolean' }
      ],
      position: { x: 410, y: 320 }
    },
    {
      id: 'cls-hosp-con',
      name: 'ConsultaMedica',
      stereotype: 'Entity',
      attributes: [
        { id: 'hca_1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
        { id: 'hca_2', name: 'fechaHora', type: 'LocalDateTime', visibility: '-' },
        { id: 'hca_3', name: 'motivoConsulta', type: 'String', visibility: '-' },
        { id: 'hca_4', name: 'diagnostico', type: 'String', visibility: '-' },
        { id: 'hca_5', name: 'estado', type: 'String', visibility: '-' }
      ],
      methods: [
        { id: 'hcm_1', name: 'cerrarConsulta', returnType: 'void', visibility: '+' },
        { id: 'hcm_2', name: 'requiereHospitalizacion', returnType: 'Boolean', visibility: '+' }
      ],
      position: { x: 760, y: 320 }
    }
  ],
  relations: [
    {
      id: 'rel-hosp-1',
      sourceClassId: 'cls-hosp-ctrl',
      targetClassId: 'cls-hosp-srv',
      type: 'ASSOCIATION_1_N',
      sourceMultiplicity: '1',
      targetMultiplicity: '1',
      label: 'delega'
    },
    {
      id: 'rel-hosp-2',
      sourceClassId: 'cls-hosp-srv',
      targetClassId: 'cls-hosp-repo',
      type: 'ASSOCIATION_1_N',
      sourceMultiplicity: '1',
      targetMultiplicity: '1',
      label: 'consulta'
    },
    {
      id: 'rel-hosp-3',
      sourceClassId: 'cls-hosp-repo',
      targetClassId: 'cls-hosp-con',
      type: 'COMPOSITION',
      sourceMultiplicity: '1',
      targetMultiplicity: '0..*',
      label: 'persiste'
    },
    {
      id: 'rel-hosp-4',
      sourceClassId: 'cls-hosp-pac',
      targetClassId: 'cls-hosp-con',
      type: 'ASSOCIATION_1_N',
      sourceMultiplicity: '1',
      targetMultiplicity: '*',
      label: 'solicita'
    },
    {
      id: 'rel-hosp-5',
      sourceClassId: 'cls-hosp-med',
      targetClassId: 'cls-hosp-con',
      type: 'ASSOCIATION_1_N',
      sourceMultiplicity: '1',
      targetMultiplicity: '*',
      label: 'atiende'
    }
  ]
};

/**
 * 📦 Proyecto: Plataforma E-Commerce B2B (CU-02 / CU-04)
 */
export const DIAGRAMA_ECOMMERCE_B2B: ModeloDiagrama = {
  title: 'Plataforma E-Commerce B2B',
  updatedAt: new Date().toISOString(),
  classes: [
    {
      id: 'cls-b2b-ctrl',
      name: 'OrderB2BController',
      stereotype: 'Controller',
      attributes: [
        { id: 'bca1', name: 'billingService', type: 'String', visibility: '-' },
        { id: 'bca2', name: 'creditValidator', type: 'String', visibility: '-' }
      ],
      methods: [
        { id: 'bcm1', name: 'crearOrdenMayorista', returnType: 'ResponseEntity', visibility: '+', parameters: 'OrderB2BDto' },
        { id: 'bcm2', name: 'consultarCatalogoEmpresarial', returnType: 'ResponseEntity', visibility: '+', parameters: 'Long' },
        { id: 'bcm3', name: 'aprobarLineaCredito', returnType: 'ResponseEntity', visibility: '+', parameters: 'Long' }
      ],
      position: { x: 60, y: 40 }
    },
    {
      id: 'cls-b2b-srv',
      name: 'BillingB2BService',
      stereotype: 'Service',
      attributes: [
        { id: 'bsa1', name: 'orderRepo', type: 'String', visibility: '-' },
        { id: 'bsa2', name: 'pricingEngine', type: 'String', visibility: '-' }
      ],
      methods: [
        { id: 'bsm1', name: 'procesarOrdenB2B', returnType: 'FacturaB2B', visibility: '+', parameters: 'PedidoMayorista' },
        { id: 'bsm2', name: 'verificarLimiteCredito', returnType: 'Boolean', visibility: '+', parameters: 'Long, Double' },
        { id: 'bsm3', name: 'aplicarDescuentoPorVolumen', returnType: 'Double', visibility: '+', parameters: 'Long' }
      ],
      position: { x: 410, y: 40 }
    },
    {
      id: 'cls-b2b-repo',
      name: 'OrderB2BRepository',
      stereotype: 'Repository',
      attributes: [
        { id: 'bra1', name: 'persistenceManager', type: 'String', visibility: '-' }
      ],
      methods: [
        { id: 'brm1', name: 'findByFolio', returnType: 'Optional<PedidoMayorista>', visibility: '+', parameters: 'String' },
        { id: 'brm2', name: 'findByEmpresaId', returnType: 'List<PedidoMayorista>', visibility: '+', parameters: 'Long' },
        { id: 'brm3', name: 'saveOrder', returnType: 'PedidoMayorista', visibility: '+', parameters: 'PedidoMayorista' }
      ],
      position: { x: 760, y: 40 }
    },
    {
      id: 'cls-b2b-emp',
      name: 'EmpresaCliente',
      stereotype: 'Entity',
      attributes: [
        { id: 'bea1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
        { id: 'bea2', name: 'razonSocial', type: 'String', visibility: '-' },
        { id: 'bea3', name: 'rutTributario', type: 'String', visibility: '-' },
        { id: 'bea4', name: 'lineaCreditoDisponible', type: 'Double', visibility: '-' },
        { id: 'bea5', name: 'emailContacto', type: 'String', visibility: '-' }
      ],
      methods: [
        { id: 'bem1', name: 'tieneCreditoSuficiente', returnType: 'Boolean', visibility: '+', parameters: 'Double' },
        { id: 'bem2', name: 'descontarCredito', returnType: 'void', visibility: '+', parameters: 'Double' }
      ],
      position: { x: 60, y: 320 }
    },
    {
      id: 'cls-b2b-ped',
      name: 'PedidoMayorista',
      stereotype: 'Entity',
      attributes: [
        { id: 'bpa1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
        { id: 'bpa2', name: 'folioOrden', type: 'String', visibility: '-' },
        { id: 'bpa3', name: 'montoTotalNeto', type: 'Double', visibility: '-' },
        { id: 'bpa4', name: 'estado', type: 'String', visibility: '-' },
        { id: 'bpa5', name: 'plazoPagoDias', type: 'Integer', visibility: '-' }
      ],
      methods: [
        { id: 'bpm1', name: 'calcularIva', returnType: 'Double', visibility: '+' },
        { id: 'bpm2', name: 'autorizarDespacho', returnType: 'Boolean', visibility: '+' }
      ],
      position: { x: 410, y: 320 }
    },
    {
      id: 'cls-b2b-prod',
      name: 'ProductoMayorista',
      stereotype: 'Entity',
      attributes: [
        { id: 'bpra1', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
        { id: 'bpra2', name: 'sku', type: 'String', visibility: '-' },
        { id: 'bpra3', name: 'nombre', type: 'String', visibility: '-' },
        { id: 'bpra4', name: 'precioUnitarioMayorista', type: 'Double', visibility: '-' },
        { id: 'bpra5', name: 'stockPallets', type: 'Integer', visibility: '-' }
      ],
      methods: [
        { id: 'bprm1', name: 'validarCantidadMinima', returnType: 'Boolean', visibility: '+', parameters: 'Integer' },
        { id: 'bprm2', name: 'reservarStock', returnType: 'Boolean', visibility: '+', parameters: 'Integer' }
      ],
      position: { x: 760, y: 320 }
    }
  ],
  relations: [
    {
      id: 'rel-b2b-1',
      sourceClassId: 'cls-b2b-ctrl',
      targetClassId: 'cls-b2b-srv',
      type: 'ASSOCIATION_1_N',
      sourceMultiplicity: '1',
      targetMultiplicity: '1',
      label: 'delega'
    },
    {
      id: 'rel-b2b-2',
      sourceClassId: 'cls-b2b-srv',
      targetClassId: 'cls-b2b-repo',
      type: 'ASSOCIATION_1_N',
      sourceMultiplicity: '1',
      targetMultiplicity: '1',
      label: 'gestiona'
    },
    {
      id: 'rel-b2b-3',
      sourceClassId: 'cls-b2b-repo',
      targetClassId: 'cls-b2b-ped',
      type: 'COMPOSITION',
      sourceMultiplicity: '1',
      targetMultiplicity: '0..*',
      label: 'persiste'
    },
    {
      id: 'rel-b2b-4',
      sourceClassId: 'cls-b2b-emp',
      targetClassId: 'cls-b2b-ped',
      type: 'ASSOCIATION_1_N',
      sourceMultiplicity: '1',
      targetMultiplicity: '*',
      label: 'emite'
    },
    {
      id: 'rel-b2b-5',
      sourceClassId: 'cls-b2b-ped',
      targetClassId: 'cls-b2b-prod',
      type: 'ASSOCIATION_1_N',
      sourceMultiplicity: '*',
      targetMultiplicity: '*',
      label: 'incluye'
    }
  ]
};

export const MAPA_DIAGRAMAS_DEFECTO: Record<string, ModeloDiagrama> = {
  'diag-core-mvc': DIAGRAMA_ECOMMERCE_CORE,
  'diag-auth-jwt': DIAGRAMA_SEGURIDAD_RBAC,
  'diag-ledger-tx': DIAGRAMA_FINTECH_LEDGER,
  'diag-telemetria': DIAGRAMA_IOT_TELEMETRIA,
  'diag-hospital': DIAGRAMA_HOSPITAL_CLINICO,
  'diag-ecom-b2b': DIAGRAMA_ECOMMERCE_B2B
};

/**
 * Resuelve y retorna el modelo de diagrama arquitectónico adaptado al dominio real del proyecto
 */
export const resolverDiagramaPorDominio = (
  diagramId: string,
  titulo?: string,
  descripcion?: string
): ModeloDiagrama => {
  if (MAPA_DIAGRAMAS_DEFECTO[diagramId]) {
    return JSON.parse(JSON.stringify(MAPA_DIAGRAMAS_DEFECTO[diagramId]));
  }

  const query = `${diagramId} ${titulo || ''} ${descripcion || ''}`.toLowerCase();

  // 1. Dominio Clínico / Hospitalario / Salud / Pacientes / Médicos
  if (
    query.includes('hospit') ||
    query.includes('clíni') ||
    query.includes('clinic') ||
    query.includes('médic') ||
    query.includes('medic') ||
    query.includes('paciente') ||
    query.includes('salud') ||
    query.includes('sistem-1071')
  ) {
    const diag = JSON.parse(JSON.stringify(DIAGRAMA_HOSPITAL_CLINICO));
    if (titulo) diag.title = titulo;
    return diag;
  }

  // 2. Dominio E-Commerce B2B / Mayorista / Empresas / Facturación
  if (
    query.includes('b2b') ||
    query.includes('mayorista') ||
    query.includes('plataf-8328') ||
    query.includes('facturaci') ||
    (query.includes('comercio') && query.includes('empresa'))
  ) {
    const diag = JSON.parse(JSON.stringify(DIAGRAMA_ECOMMERCE_B2B));
    if (titulo) diag.title = titulo;
    return diag;
  }

  // 3. Dominio E-Commerce B2C Estándar
  if (
    query.includes('e-commerce') ||
    query.includes('ecommerce') ||
    query.includes('tienda') ||
    query.includes('catálogo') ||
    query.includes('catalogo') ||
    query.includes('ecom-882')
  ) {
    const diag = JSON.parse(JSON.stringify(DIAGRAMA_ECOMMERCE_CORE));
    if (titulo) diag.title = titulo;
    return diag;
  }

  // 4. Dominio Fintech / Banca / Billetera / Ledger
  if (
    query.includes('fintech') ||
    query.includes('billetera') ||
    query.includes('banco') ||
    query.includes('ledger') ||
    query.includes('saldo') ||
    query.includes('cuenta') ||
    query.includes('fin-304')
  ) {
    const diag = JSON.parse(JSON.stringify(DIAGRAMA_FINTECH_LEDGER));
    if (titulo) diag.title = titulo;
    return diag;
  }

  // 5. Dominio Telemetría IoT / Sensores / Dispositivos
  if (
    query.includes('iot') ||
    query.includes('telemetr') ||
    query.includes('sensor') ||
    query.includes('dispositivo') ||
    query.includes('icu') ||
    query.includes('iot-915')
  ) {
    const diag = JSON.parse(JSON.stringify(DIAGRAMA_IOT_TELEMETRIA));
    if (titulo) diag.title = titulo;
    return diag;
  }

  // 6. Dominio Seguridad & RBAC
  if (
    query.includes('seguridad') ||
    query.includes('rbac') ||
    query.includes('jwt') ||
    query.includes('auth') ||
    query.includes('login') ||
    query.includes('permiso')
  ) {
    const diag = JSON.parse(JSON.stringify(DIAGRAMA_SEGURIDAD_RBAC));
    if (titulo) diag.title = titulo;
    return diag;
  }

  // 7. Fallback dinámico en 4 capas personalizadas según el nombre del proyecto
  const cleanTitle = titulo || 'Nuevo Diagrama UML';
  const cleanBase = cleanTitle
    .replace(/Diagrama Principal - /i, '')
    .replace(/[^a-zA-Z0-9]/g, '') || 'Modulo';

  return {
    title: cleanTitle,
    updatedAt: new Date().toISOString(),
    classes: [
      {
        id: `cls-${diagramId}-ctrl`,
        name: `${cleanBase}Controller`,
        stereotype: 'Controller',
        attributes: [
          { id: 'a1', name: 'service', type: 'String', visibility: '-' }
        ],
        methods: [
          { id: 'm1', name: 'handleRequest', returnType: 'ResponseEntity', visibility: '+' }
        ],
        position: { x: 60, y: 40 }
      },
      {
        id: `cls-${diagramId}-srv`,
        name: `${cleanBase}Service`,
        stereotype: 'Service',
        attributes: [
          { id: 'a2', name: 'repository', type: 'String', visibility: '-' }
        ],
        methods: [
          { id: 'm2', name: 'procesar', returnType: `${cleanBase}Entity`, visibility: '+' }
        ],
        position: { x: 410, y: 40 }
      },
      {
        id: `cls-${diagramId}-repo`,
        name: `${cleanBase}Repository`,
        stereotype: 'Repository',
        attributes: [
          { id: 'a3', name: 'entityManager', type: 'String', visibility: '-' }
        ],
        methods: [
          { id: 'm3', name: 'findById', returnType: `Optional<${cleanBase}Entity>`, visibility: '+' }
        ],
        position: { x: 760, y: 40 }
      },
      {
        id: `cls-${diagramId}-ent`,
        name: `${cleanBase}Entity`,
        stereotype: 'Entity',
        attributes: [
          { id: 'a4', name: 'id', type: 'Long', visibility: '-', isPrimaryKey: true },
          { id: 'a5', name: 'nombre', type: 'String', visibility: '-' },
          { id: 'a6', name: 'creadoEn', type: 'LocalDateTime', visibility: '-' }
        ],
        methods: [
          { id: 'm4', name: 'validar', returnType: 'Boolean', visibility: '+' }
        ],
        position: { x: 410, y: 320 }
      }
    ],
    relations: [
      {
        id: `rel-${diagramId}-1`,
        sourceClassId: `cls-${diagramId}-ctrl`,
        targetClassId: `cls-${diagramId}-srv`,
        type: 'ASSOCIATION_1_N',
        sourceMultiplicity: '1',
        targetMultiplicity: '1',
        label: 'delega'
      },
      {
        id: `rel-${diagramId}-2`,
        sourceClassId: `cls-${diagramId}-srv`,
        targetClassId: `cls-${diagramId}-repo`,
        type: 'ASSOCIATION_1_N',
        sourceMultiplicity: '1',
        targetMultiplicity: '1',
        label: 'consulta'
      },
      {
        id: `rel-${diagramId}-3`,
        sourceClassId: `cls-${diagramId}-repo`,
        targetClassId: `cls-${diagramId}-ent`,
        type: 'COMPOSITION',
        sourceMultiplicity: '1',
        targetMultiplicity: '0..*',
        label: 'persiste'
      }
    ]
  };
};

/**
 * Obtiene el diagrama correspondiente buscando en almacenamiento local persistente primero,
 * aplicando saneamiento de caché para evitar que un proyecto cargue clases de otro dominio.
 */
export const obtenerDiagramaPorId = (
  diagramId: string,
  tituloFallback?: string,
  proyectoInfo?: { nombre?: string; descripcion?: string } | string
): ModeloDiagrama => {
  const desc = typeof proyectoInfo === 'object' ? proyectoInfo?.descripcion : '';
  const nombrePrj = typeof proyectoInfo === 'object' ? proyectoInfo?.nombre : (typeof proyectoInfo === 'string' ? proyectoInfo : '');
  const textoCompleto = `${diagramId} ${tituloFallback || ''} ${nombrePrj || ''} ${desc || ''}`.toLowerCase();

  // 1. Verificar si hay cambios guardados en localStorage para este diagrama
  try {
    const guardado = localStorage.getItem(`archai_diagram_${diagramId}`);
    if (guardado) {
      const parsed = JSON.parse(guardado);
      if (parsed?.classes?.length) {
        // Detección y saneamiento de caché cruzada:
        // Si el diagrama guardado contiene ProductController pero el proyecto actual es de Hospital o Fintech o IoT,
        // descartamos la caché contaminada para no forzar el mismo diagrama en proyectos diferentes.
        const tieneProductEcom = parsed.classes.some((c: any) => c.name === 'ProductController' || c.name === 'Product');
        const esOtroDominio =
          textoCompleto.includes('hospit') ||
          textoCompleto.includes('clíni') ||
          textoCompleto.includes('clinic') ||
          textoCompleto.includes('médic') ||
          textoCompleto.includes('medic') ||
          textoCompleto.includes('paciente') ||
          textoCompleto.includes('fintech') ||
          textoCompleto.includes('iot') ||
          textoCompleto.includes('b2b');

        if (!tieneProductEcom || !esOtroDominio) {
          return parsed;
        }
      }
    }
  } catch {}

  // 2. Buscar por ID en mapa de diagramas por defecto
  if (MAPA_DIAGRAMAS_DEFECTO[diagramId]) {
    return JSON.parse(JSON.stringify(MAPA_DIAGRAMAS_DEFECTO[diagramId]));
  }

  // 3. Resolver según el dominio arquitectónico del proyecto
  return resolverDiagramaPorDominio(diagramId, tituloFallback || nombrePrj, desc);
};
