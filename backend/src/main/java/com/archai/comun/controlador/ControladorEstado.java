package com.archai.comun.controlador;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/status", "/api/v1/estado", "/status", "/estado"})
public class ControladorEstado {

    @GetMapping
    public ResponseEntity<Map<String, Object>> getEstadoSistema() {
        Map<String, Object> estado = new HashMap<>();
        estado.put("aplicacion", "ArchAI Backend Engine - Spring Boot 3 & Clean Architecture");
        estado.put("version", "1.0.0");
        estado.put("estado", "OPERATIVO");
        estado.put("modulos", new String[]{
                "com.archai.modulo.autenticacion",
                "com.archai.modulo.proyecto",
                "com.archai.modulo.diagrama",
                "com.archai.modulo.generador",
                "com.archai.modulo.ia",
                "com.archai.modulo.colaboracion"
        });
        estado.put("baseDeDatos", "Supabase PostgreSQL (sa-east-1)");
        estado.put("servidorTimestamp", LocalDateTime.now().toString());
        return ResponseEntity.ok(estado);
    }
}
