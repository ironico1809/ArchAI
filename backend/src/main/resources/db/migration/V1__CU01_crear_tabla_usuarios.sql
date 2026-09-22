-- ==============================================================================
-- ArchAI Studio · Migración V1 · CASO DE USO CU-01
-- "Iniciar Sesión y Gestión de Perfil de Usuario"
-- Tabla: usuarios (RN-01 contraseñas BCrypt, RN-02 unicidad)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id             VARCHAR(64)  PRIMARY KEY,
    nombre         VARCHAR(255) NOT NULL,
    nombre_usuario VARCHAR(64)  NOT NULL UNIQUE,
    correo         VARCHAR(128) NOT NULL UNIQUE,
    contrasena     VARCHAR(128) NOT NULL,
    dni            VARCHAR(32)  UNIQUE,
    rol            VARCHAR(64)  NOT NULL DEFAULT 'Desarrollador',
    color_avatar   VARCHAR(32)  DEFAULT '#2563EB',
    es_anfitrion   BOOLEAN      DEFAULT FALSE,
    estado         VARCHAR(20)  DEFAULT 'ACTIVO',
    fecha_creacion TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Índices de búsqueda usados por el login (correo / nombre de usuario / DNI)
CREATE INDEX IF NOT EXISTS idx_usuarios_correo         ON usuarios(correo);
CREATE INDEX IF NOT EXISTS idx_usuarios_nombre_usuario ON usuarios(nombre_usuario);
CREATE INDEX IF NOT EXISTS idx_usuarios_dni            ON usuarios(dni);
