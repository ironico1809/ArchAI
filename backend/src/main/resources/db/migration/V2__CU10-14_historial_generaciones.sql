-- ==============================================================================
-- V2 · CU-10 a CU-14 — Historial de Generaciones de Artefactos
-- Trazabilidad de cada artefacto generado (Spring Boot, DDL, Postman, XMI, ZIP).
-- ==============================================================================
CREATE TABLE IF NOT EXISTS generaciones (
    id VARCHAR(64) PRIMARY KEY,
    tipo VARCHAR(30) NOT NULL,                -- SPRING_BOOT | DDL | POSTMAN | XMI | ZIP
    titulo_diagrama VARCHAR(200) NOT NULL,
    nombre_archivo VARCHAR(200),
    tamano_bytes BIGINT,
    usuario_id VARCHAR(64),
    fecha_creacion TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para consultas rápidas del historial por tipo y fecha
CREATE INDEX IF NOT EXISTS idx_generaciones_tipo_fecha ON generaciones (tipo, fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_generaciones_fecha ON generaciones (fecha_creacion DESC);