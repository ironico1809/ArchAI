package com.archai.modulo.generador.servicio;

import com.archai.modulo.generador.dto.GeneracionDto;
import com.archai.modulo.generador.entidad.GeneracionEntity;
import com.archai.modulo.generador.repositorio.GeneracionRepositorio;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * CU-10...CU-14 — Servicio de trazabilidad del historial de generaciones.
 * Cada artefacto generado por el motor queda registrado para auditoría.
 */
@Service
@RequiredArgsConstructor
public class ServicioHistorialGeneraciones {

    private final GeneracionRepositorio repositorio;

    @Transactional
    public GeneracionEntity registrar(String tipo, String tituloDiagrama, String nombreArchivo,
                                      Long tamanoBytes, String usuarioId) {
        GeneracionEntity generacion = GeneracionEntity.builder()
                .tipo(tipo)
                .tituloDiagrama(tituloDiagrama != null ? tituloDiagrama : "Diagrama sin título")
                .nombreArchivo(nombreArchivo)
                .tamanoBytes(tamanoBytes)
                .usuarioId(usuarioId)
                .build();
        return repositorio.save(generacion);
    }

    @Transactional(readOnly = true)
    public List<GeneracionDto> listar() {
        return repositorio.findTop50ByOrderByFechaCreacionDesc().stream()
                .map(this::aDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GeneracionDto> listarPorTipo(String tipo) {
        return repositorio.findByTipoOrderByFechaCreacionDesc(tipo).stream()
                .map(this::aDto)
                .toList();
    }

    @Transactional
    public void eliminar(String id) {
        repositorio.deleteById(id);
    }

    private GeneracionDto aDto(GeneracionEntity e) {
        return GeneracionDto.builder()
                .id(e.getId())
                .tipo(e.getTipo())
                .tituloDiagrama(e.getTituloDiagrama())
                .nombreArchivo(e.getNombreArchivo())
                .tamanoBytes(e.getTamanoBytes())
                .usuarioId(e.getUsuarioId())
                .fechaCreacion(e.getFechaCreacion())
                .build();
    }
}