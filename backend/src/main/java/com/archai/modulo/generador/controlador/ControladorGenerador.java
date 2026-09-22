package com.archai.modulo.generador.controlador;

import com.archai.modulo.diagrama.dto.DiagramDto;
import com.archai.modulo.generador.dto.GeneracionDto;
import com.archai.modulo.generador.dto.GeneratedFileDto;
import com.archai.modulo.generador.dto.ProjectGenerationResponseDto;
import com.archai.modulo.generador.dto.SolicitudImportacionXmiDto;
import com.archai.modulo.generador.servicio.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping({"/api/v1/generator", "/api/v1/generador"})
@RequiredArgsConstructor
public class ControladorGenerador {

    private final ServicioGeneradorSpringBoot generadorSpringBoot;
    private final ServicioGeneradorPostgresDdl generadorDdl;
    private final ServicioGeneradorPostman generadorPostman;
    private final ServicioXmi servicioXmi;
    private final ServicioExportacionZip servicioExportacionZip;
    private final ServicioImportacionXmi servicioImportacionXmi;
    private final ServicioHistorialGeneraciones servicioHistorial;

    @PostMapping({"/preview", "/previsualizar", "/generate", "/generar"})
    public ResponseEntity<ProjectGenerationResponseDto> previewProject(@RequestBody DiagramDto diagram) {
        List<GeneratedFileDto> springFiles = generadorSpringBoot.generateProjectFiles(diagram);
        String sqlDdl = generadorDdl.generateDdl(diagram);
        String postmanJson = generadorPostman.generateCollectionJson(diagram);
        String xmiContent = servicioXmi.exportXmi(diagram);

        ProjectGenerationResponseDto response = ProjectGenerationResponseDto.builder()
                .diagramTitle(diagram.getTitle() != null ? diagram.getTitle() : "ArchAI_Project")
                .files(springFiles)
                .postgresDdl(sqlDdl)
                .postmanCollectionJson(postmanJson)
                .xmiContent(xmiContent)
                .message("Proyecto generado con éxito según estándar UML 2.5 y Spring Boot 3.")
                .build();

        // CU-10..CU-14 · Trazabilidad del historial
        servicioHistorial.registrar("SPRING_BOOT", diagram.getTitle(),
                (diagram.getTitle() != null ? diagram.getTitle() : "ArchAI_Backend") + ".zip",
                null, diagram.getCreadorId());

        return ResponseEntity.ok(response);
    }

    @PostMapping(value = {"/zip", "/descargar-zip"}, produces = "application/zip")
    public ResponseEntity<byte[]> downloadProjectZip(@RequestBody DiagramDto diagram) throws IOException {
        byte[] zipBytes = servicioExportacionZip.createProjectZip(diagram);
        String filename = (diagram.getTitle() != null ? diagram.getTitle().replaceAll("[^a-zA-Z0-9_-]", "_") : "ArchAI_Project") + ".zip";

        // CU-14 · Trazabilidad del historial
        servicioHistorial.registrar("ZIP", diagram.getTitle(), filename,
                (long) zipBytes.length, diagram.getCreadorId());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(zipBytes);
    }

    @PostMapping(value = {"/sql", "/generar-sql"}, produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> getPostgresDdl(@RequestBody DiagramDto diagram) {
        String ddl = generadorDdl.generateDdl(diagram);
        servicioHistorial.registrar("DDL", diagram.getTitle(), "schema_postgres.sql",
                (long) ddl.length(), diagram.getCreadorId());
        return ResponseEntity.ok(ddl);
    }

    @PostMapping(value = {"/postman", "/generar-postman"}, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getPostmanCollection(@RequestBody DiagramDto diagram) {
        String collection = generadorPostman.generateCollectionJson(diagram);
        servicioHistorial.registrar("POSTMAN", diagram.getTitle(), "postman_collection.json",
                (long) collection.length(), diagram.getCreadorId());
        return ResponseEntity.ok(collection);
    }

    @PostMapping(value = {"/xmi", "/generar-xmi"}, produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> getXmiExport(@RequestBody DiagramDto diagram) {
        String xmi = servicioXmi.exportXmi(diagram);
        servicioHistorial.registrar("XMI", diagram.getTitle(), "model.xmi",
                (long) xmi.length(), diagram.getCreadorId());
        return ResponseEntity.ok(xmi);
    }

    /** CU-13 · Importar un documento OMG XMI 2.1 y reconstruir el DiagramDto editable. */
    @PostMapping({"/xmi/importar", "/importar-xmi", "/xmi/import"})
    public ResponseEntity<DiagramDto> importarXmi(@RequestBody SolicitudImportacionXmiDto solicitud) {
        return ResponseEntity.ok(servicioImportacionXmi.importarXmi(solicitud.getXmiContent(), solicitud.getTitulo()));
    }

    // ─────────────────────────── Historial de Generaciones (CU-10..CU-14) ───────────────────────────

    @GetMapping({"/historial", "/history", "/generaciones"})
    public ResponseEntity<List<GeneracionDto>> getHistorial(
            @RequestParam(required = false) String tipo) {
        if (tipo != null && !tipo.isBlank()) {
            return ResponseEntity.ok(servicioHistorial.listarPorTipo(tipo));
        }
        return ResponseEntity.ok(servicioHistorial.listar());
    }

    @DeleteMapping("/historial/{id}")
    public ResponseEntity<Void> eliminarGeneracion(@PathVariable String id) {
        servicioHistorial.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}