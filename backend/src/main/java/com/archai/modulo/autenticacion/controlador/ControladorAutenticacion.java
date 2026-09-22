package com.archai.modulo.autenticacion.controlador;

import com.archai.modulo.autenticacion.dto.AutenticacionRespuestaDto;
import com.archai.modulo.autenticacion.dto.AutenticacionSolicitudDto;
import com.archai.modulo.autenticacion.dto.PerfilUsuarioDto;
import com.archai.modulo.autenticacion.dto.RegistroUsuarioDto;
import com.archai.modulo.autenticacion.servicio.ServicioAutenticacion;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/auth", "/api/v1/autenticacion"})
@RequiredArgsConstructor
public class ControladorAutenticacion {

    private final ServicioAutenticacion servicioAutenticacion;

    @PostMapping({"/login", "/iniciar-sesion"})
    public ResponseEntity<AutenticacionRespuestaDto> login(@RequestBody AutenticacionSolicitudDto solicitud) {
        return ResponseEntity.ok(servicioAutenticacion.autenticar(solicitud));
    }

    /** CU-01 · Registro explícito de nuevo usuario (precondición del inicio de sesión). */
    @PostMapping({"/registro", "/register", "/registrar"})
    public ResponseEntity<PerfilUsuarioDto> registrar(@RequestBody RegistroUsuarioDto solicitud) {
        return ResponseEntity.ok(servicioAutenticacion.registrar(solicitud));
    }

    /** CU-01 · Gestión de perfil: actualizar datos personales, rol y color de avatar. */
    @PutMapping({"/perfil/{id}", "/users/{id}/perfil"})
    public ResponseEntity<PerfilUsuarioDto> actualizarPerfil(@PathVariable String id, @RequestBody PerfilUsuarioDto solicitud) {
        return ResponseEntity.ok(servicioAutenticacion.actualizarPerfil(id, solicitud));
    }

    @GetMapping({"/users", "/usuarios"})
    public ResponseEntity<List<PerfilUsuarioDto>> listarUsuarios() {
        return ResponseEntity.ok(servicioAutenticacion.listarUsuarios());
    }

    @GetMapping({"/users/{id}", "/usuarios/{id}"})
    public ResponseEntity<PerfilUsuarioDto> obtenerPorId(@PathVariable String id) {
        return servicioAutenticacion.obtenerPerfilPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping({"/status", "/estado"})
    public ResponseEntity<String> status() {
        return ResponseEntity.ok("Módulo de autenticación ArchAI conectado a la tabla 'usuarios' en Supabase PostgreSQL.");
    }
}
