package com.archai.modulo.generador.entidad;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * CU-10...CU-14 — Registro de auditoría del historial de generaciones.
 * Cada artefacto generado (Spring Boot, DDL, Postman, XMI, ZIP) queda
 * persistido como trazabilidad para el historial del proyecto.
 */
@Entity
@Table(name = "generaciones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeneracionEntity {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    /** Tipo de artefacto generado: SPRING_BOOT | DDL | POSTMAN | XMI | ZIP */
    @Column(name = "tipo", nullable = false, length = 30)
    private String tipo;

    @Column(name = "titulo_diagrama", nullable = false, length = 200)
    private String tituloDiagrama;

    @Column(name = "nombre_archivo", length = 200)
    private String nombreArchivo;

    @Column(name = "tamano_bytes")
    private Long tamanoBytes;

    @Column(name = "usuario_id", length = 64)
    private String usuarioId;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @PrePersist
    public void alCrear() {
        if (this.id == null || this.id.isBlank()) this.id = java.util.UUID.randomUUID().toString();
        if (this.fechaCreacion == null) this.fechaCreacion = LocalDateTime.now();
    }
}