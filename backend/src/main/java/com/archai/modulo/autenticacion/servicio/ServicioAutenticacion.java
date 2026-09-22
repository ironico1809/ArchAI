package com.archai.modulo.autenticacion.servicio;

import com.archai.comun.excepcion.ExcepcionNegocio;
import com.archai.comun.excepcion.ExcepcionRecursoNoEncontrado;
import com.archai.comun.seguridad.ServicioJwt;
import com.archai.modulo.autenticacion.dto.AutenticacionRespuestaDto;
import com.archai.modulo.autenticacion.dto.AutenticacionSolicitudDto;
import com.archai.modulo.autenticacion.dto.PerfilUsuarioDto;
import com.archai.modulo.autenticacion.dto.RegistroUsuarioDto;
import com.archai.modulo.autenticacion.entidad.UsuarioEntity;
import com.archai.modulo.autenticacion.repositorio.UsuarioRepository;
import com.archai.modulo.colaboracion.dto.InfoSesionDto;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * CU-01 — Iniciar Sesión y Gestión de Perfil de Usuario.
 * Implementa el flujo principal (validar credenciales, emitir JWT, actualizar último
 * acceso) y los flujos alternos 3a (credenciales incorrectas) y 3b (cuenta bloqueada).
 */
@Service
@RequiredArgsConstructor
public class ServicioAutenticacion {

    private static final String ESTADO_ACTIVO = "ACTIVO";

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder codificadorContrasena;
    private final ServicioJwt servicioJwt;

    @Transactional
    public AutenticacionRespuestaDto autenticar(AutenticacionSolicitudDto solicitud) {
        String identificador = limpiar(solicitud.getUsuario());
        String contrasena = limpiar(solicitud.getContrasena());
        String dni = limpiar(solicitud.getDni());

        if (identificador.isEmpty() && dni.isEmpty()) {
            throw new ExcepcionNegocio("Debe ingresar su usuario, correo electrónico o DNI.");
        }
        if (contrasena.isEmpty()) {
            throw new ExcepcionNegocio("Debe ingresar su contraseña.");
        }

        // Flujo alterno 3a: credenciales incorrectas (usuario inexistente)
        UsuarioEntity usuario = buscarUsuario(identificador, dni)
                .orElseThrow(() -> new ExcepcionNegocio("Usuario o contraseña incorrectos."));

        // Flujo alterno 3a: credenciales incorrectas (contraseña inválida)
        if (!contrasenaCoincide(contrasena, usuario.getContrasena())) {
            throw new ExcepcionNegocio("Usuario o contraseña incorrectos.");
        }

        // Flujo alterno 3b: usuario bloqueado o inactivo
        if (usuario.getEstado() != null && !ESTADO_ACTIVO.equalsIgnoreCase(usuario.getEstado())) {
            throw new ExcepcionNegocio("Su cuenta está " + usuario.getEstado().toLowerCase()
                    + ". Contacte al administrador del sistema.");
        }

        // RN-01: migrar contraseñas heredadas en texto plano a BCrypt de forma transparente
        if (!esHashBcrypt(usuario.getContrasena())) {
            usuario.setContrasena(codificadorContrasena.encode(contrasena));
        }

        // Paso 5 del flujo principal: actualizar el timestamp de último acceso
        usuario.setUltimoAcceso(LocalDateTime.now());
        usuarioRepository.save(usuario);

        PerfilUsuarioDto perfil = mapearPerfil(usuario);
        InfoSesionDto sesion = construirSesionParaUsuario(perfil);

        return AutenticacionRespuestaDto.builder()
                .token(servicioJwt.generarToken(usuario.getId(), usuario.getNombre(), usuario.getRol()))
                .success(true)
                .message("Autenticación exitosa en Supabase PostgreSQL")
                .user(perfil)
                .session(sesion)
                .build();
    }

    /** Registro explícito de usuario (precondición del CU-01). */
    @Transactional
    public PerfilUsuarioDto registrar(RegistroUsuarioDto solicitud) {
        String nombre = limpiar(solicitud.getNombre());
        String correo = limpiar(solicitud.getCorreo());
        String nombreUsuario = limpiar(solicitud.getNombreUsuario());
        String contrasena = limpiar(solicitud.getContrasena());
        String dni = limpiar(solicitud.getDni());

        if (nombre.isEmpty()) {
            throw new ExcepcionNegocio("El nombre es obligatorio.");
        }
        if (correo.isEmpty()) {
            throw new ExcepcionNegocio("El correo electrónico es obligatorio.");
        }
        if (contrasena.length() < 6) {
            throw new ExcepcionNegocio("La contraseña debe tener al menos 6 caracteres.");
        }
        // RN-02: correo y nombre de usuario estrictamente únicos
        if (usuarioRepository.existsByCorreoIgnoreCase(correo)) {
            throw new ExcepcionNegocio("El correo electrónico ya está registrado.");
        }
        if (!nombreUsuario.isEmpty() && usuarioRepository.existsByNombreUsuarioIgnoreCase(nombreUsuario)) {
            throw new ExcepcionNegocio("El nombre de usuario ya está registrado.");
        }
        if (!dni.isEmpty() && usuarioRepository.findByDni(dni).isPresent()) {
            throw new ExcepcionNegocio("El DNI ya está registrado.");
        }

        UsuarioEntity usuario = UsuarioEntity.builder()
                .id("usr-" + UUID.randomUUID())
                .nombre(nombre)
                .nombreUsuario(nombreUsuario.isEmpty() ? correo.split("@")[0] : nombreUsuario)
                .correo(correo)
                .contrasena(codificadorContrasena.encode(contrasena))   // RN-01
                .dni(dni.isEmpty() ? null : dni)
                .rol(limpiar(solicitud.getRol()).isEmpty() ? "Desarrollador" : solicitud.getRol().trim())
                .colorAvatar(generarColorAvatar())
                .esAnfitrion(true)
                .estado(ESTADO_ACTIVO)
                .fechaCreacion(LocalDateTime.now())
                .ultimoAcceso(LocalDateTime.now())
                .build();

        return mapearPerfil(usuarioRepository.save(usuario));
    }

    @Transactional(readOnly = true)
    public List<PerfilUsuarioDto> listarUsuarios() {
        return usuarioRepository.findAll().stream()
                .map(this::mapearPerfil)
                .collect(Collectors.toList());
    }

    /** CU-01 · Gestión de perfil: actualización parcial de datos personales y preferencias. */
    @Transactional
    public PerfilUsuarioDto actualizarPerfil(String id, PerfilUsuarioDto solicitud) {
        UsuarioEntity usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Usuario no encontrado: " + id));

        if (solicitud.getName() != null && !solicitud.getName().trim().isEmpty()) {
            usuario.setNombre(solicitud.getName().trim());
        }
        if (solicitud.getEmail() != null && !solicitud.getEmail().trim().isEmpty()) {
            String correo = solicitud.getEmail().trim();
            if (!usuario.getCorreo().equalsIgnoreCase(correo)
                    && usuarioRepository.existsByCorreoIgnoreCase(correo)) {
                throw new ExcepcionNegocio("El correo electrónico ya está registrado por otro usuario.");
            }
            usuario.setCorreo(correo);
        }
        if (solicitud.getUsername() != null && !solicitud.getUsername().trim().isEmpty()) {
            String nombreUsuario = solicitud.getUsername().trim();
            if (!usuario.getNombreUsuario().equalsIgnoreCase(nombreUsuario)
                    && usuarioRepository.existsByNombreUsuarioIgnoreCase(nombreUsuario)) {
                throw new ExcepcionNegocio("El nombre de usuario ya está registrado por otro usuario.");
            }
            usuario.setNombreUsuario(nombreUsuario);
        }
        if (solicitud.getDni() != null && !solicitud.getDni().trim().isEmpty()) {
            usuario.setDni(solicitud.getDni().trim());
        }
        if (solicitud.getRole() != null && !solicitud.getRole().trim().isEmpty()) {
            usuario.setRol(solicitud.getRole().trim());
        }
        if (solicitud.getAvatarColor() != null && !solicitud.getAvatarColor().trim().isEmpty()) {
            usuario.setColorAvatar(solicitud.getAvatarColor().trim());
        }

        return mapearPerfil(usuarioRepository.save(usuario));
    }

    @Transactional(readOnly = true)
    public Optional<PerfilUsuarioDto> obtenerPerfilPorId(String id) {
        return usuarioRepository.findById(id).map(this::mapearPerfil);
    }

    public PerfilUsuarioDto mapearPerfil(UsuarioEntity u) {
        return PerfilUsuarioDto.builder()
                .id(u.getId())
                .dni(u.getDni())
                .name(u.getNombre())
                .username(u.getNombreUsuario())
                .email(u.getCorreo())
                .role(u.getRol())
                .avatarColor(u.getColorAvatar())
                .isHost(u.getEsAnfitrion())
                .build();
    }

    private Optional<UsuarioEntity> buscarUsuario(String identificador, String dni) {
        if (!identificador.isEmpty()) {
            Optional<UsuarioEntity> porCorreo = usuarioRepository.findByCorreoIgnoreCase(identificador);
            if (porCorreo.isPresent()) {
                return porCorreo;
            }
            Optional<UsuarioEntity> porNombreUsuario = usuarioRepository.findByNombreUsuarioIgnoreCase(identificador);
            if (porNombreUsuario.isPresent()) {
                return porNombreUsuario;
            }
        }
        if (!dni.isEmpty()) {
            return usuarioRepository.findByDni(dni);
        }
        return Optional.empty();
    }

    private boolean contrasenaCoincide(String contrasenaCruda, String contrasenaAlmacenada) {
        if (contrasenaAlmacenada == null) {
            return false;
        }
        if (esHashBcrypt(contrasenaAlmacenada)) {
            return codificadorContrasena.matches(contrasenaCruda, contrasenaAlmacenada);
        }
        // Compatibilidad con datos heredados en texto plano
        return contrasenaAlmacenada.equals(contrasenaCruda);
    }

    private boolean esHashBcrypt(String valor) {
        return valor != null && valor.length() == 60 && valor.startsWith("$2");
    }

    private String limpiar(String valor) {
        return valor == null ? "" : valor.trim();
    }

    private InfoSesionDto construirSesionParaUsuario(PerfilUsuarioDto user) {
        List<PerfilUsuarioDto> participants = new ArrayList<>();
        participants.add(user);

        List<UsuarioEntity> otros = usuarioRepository.findAll();
        for (UsuarioEntity otro : otros) {
            if (!otro.getId().equals(user.getId()) && participants.size() < 4) {
                participants.add(mapearPerfil(otro));
            }
        }

        return InfoSesionDto.builder()
                .roomId("ARC-" + (int) (100000 + Math.random() * 900000))
                .roomName("Sesión de Ingeniería")
                .hostName(user.getName())
                .createdAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm")))
                .currentUser(user)
                .participants(participants)
                .isLocalMode(false)
                .build();
    }

    private String generarColorAvatar() {
        String[] colors = {"#2563EB", "#7C3AED", "#059669", "#D97706", "#DC2626", "#0891B2", "#4F46E5"};
        return colors[(int) (Math.random() * colors.length)];
    }
}
