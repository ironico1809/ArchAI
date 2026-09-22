package com.archai.modulo.diagrama.controlador;

import com.archai.modulo.diagrama.dto.DiagramDto;
import com.archai.modulo.diagrama.servicio.ServicioAuditoriaArquitectura;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auditoria")
public class ControladorAuditoriaArquitectura {

    private final ServicioAuditoriaArquitectura servicioAuditoria;

    public ControladorAuditoriaArquitectura(ServicioAuditoriaArquitectura servicioAuditoria) {
        this.servicioAuditoria = servicioAuditoria;
    }

    @PostMapping("/madurez")
    public ResponseEntity<Map<String, Object>> auditarMadurez(@RequestBody DiagramDto diagram) {
        Map<String, Object> reporte = servicioAuditoria.auditarMadurez(diagram);
        return ResponseEntity.ok(reporte);
    }
}
