package com.archai.modulo.diagrama.controlador;

import com.archai.modulo.diagrama.dto.DiagramDto;
import com.archai.modulo.diagrama.dto.VersionDiagramaDto;
import com.archai.modulo.diagrama.servicio.ServicioDiagrama;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/diagrams", "/api/v1/diagramas"})
@RequiredArgsConstructor
public class ControladorDiagrama {

    private final ServicioDiagrama servicioDiagrama;

    @GetMapping
    public ResponseEntity<List<DiagramDto>> listarDiagramas(@RequestParam(required = false) String proyectoId) {
        return ResponseEntity.ok(servicioDiagrama.listarDiagramas(proyectoId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DiagramDto> obtenerDiagramaPorId(@PathVariable String id) {
        return servicioDiagrama.obtenerPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping({"", "/save", "/guardar"})
    public ResponseEntity<DiagramDto> guardarDiagrama(@RequestBody DiagramDto diagram) {
        return ResponseEntity.ok(servicioDiagrama.guardarDiagrama(diagram));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarDiagrama(@PathVariable String id) {
        servicioDiagrama.eliminarDiagrama(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/versiones")
    public ResponseEntity<List<VersionDiagramaDto>> listarVersiones(@PathVariable String id) {
        return ResponseEntity.ok(servicioDiagrama.listarVersiones(id));
    }

    @PostMapping("/{id}/versiones")
    public ResponseEntity<VersionDiagramaDto> crearVersion(@PathVariable String id, @RequestBody Map<String, String> body) {
        String etiqueta = body != null ? body.get("etiqueta") : null;
        String descripcion = body != null ? body.get("descripcionCambio") : null;
        String autorId = body != null ? body.get("autorId") : null;
        return ResponseEntity.ok(servicioDiagrama.crearVersion(id, etiqueta, descripcion, autorId));
    }

    @PostMapping("/{id}/versiones/{versionId}/restaurar")
    public ResponseEntity<DiagramDto> restaurarVersion(@PathVariable String id, @PathVariable String versionId) {
        return ResponseEntity.ok(servicioDiagrama.restaurarVersion(id, versionId));
    }
}
