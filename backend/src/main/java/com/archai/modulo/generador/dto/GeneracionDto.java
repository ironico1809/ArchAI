package com.archai.modulo.generador.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO de trazabilidad para el historial de generaciones (CU-10...CU-14).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeneracionDto {
    private String id;
    private String tipo;
    private String tituloDiagrama;
    private String nombreArchivo;
    private Long tamanoBytes;
    private String usuarioId;
    private LocalDateTime fechaCreacion;
}