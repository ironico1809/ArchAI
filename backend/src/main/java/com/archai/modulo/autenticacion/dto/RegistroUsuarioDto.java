package com.archai.modulo.autenticacion.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

/** CU-01 · Registro explícito de usuario (precondición: estar registrado). */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistroUsuarioDto {

    @JsonProperty("nombre")
    @JsonAlias({"name", "nombreCompleto", "fullName"})
    private String nombre;

    @JsonProperty("nombreUsuario")
    @JsonAlias({"username", "nombre_usuario"})
    private String nombreUsuario;

    @JsonProperty("correo")
    @JsonAlias({"email", "correoElectronico"})
    private String correo;

    @JsonProperty("contrasena")
    @JsonAlias({"password", "clave", "pass"})
    private String contrasena;

    @JsonProperty("dni")
    private String dni;

    @JsonProperty("rol")
    @JsonAlias({"role", "cargo"})
    private String rol;
}
