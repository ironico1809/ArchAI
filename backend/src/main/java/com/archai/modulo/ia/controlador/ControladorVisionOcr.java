package com.archai.modulo.ia.controlador;

import com.archai.modulo.diagrama.dto.DiagramDto;
import com.archai.modulo.ia.servicio.ServicioVisionOcr;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * CU-07 — Digitalización de Pizarra por Foto (OCR).
 * Recibe la fotografía (JPEG/PNG) y devuelve un DiagramDto con clases UML inferidas.
 */
@RestController
@RequestMapping({"/api/v1/ia", "/api/v1/ai"})
@RequiredArgsConstructor
public class ControladorVisionOcr {

    private final ServicioVisionOcr servicioVisionOcr;

    @PostMapping(value = {"/ocr-pizarra", "/ocr-whiteboard", "/pizarra/ocr"},
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DiagramDto> procesarPizarra(
            @RequestParam("archivo") MultipartFile archivo,
            @RequestParam(value = "titulo", required = false) String titulo) {
        return ResponseEntity.ok(servicioVisionOcr.procesarImagenPizarra(archivo, titulo));
    }
}