package com.archai.modulo.autenticacion.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AutenticacionSolicitudDto {

    @JsonProperty("usuario")
    @JsonAlias({"username", "correo", "email", "login", "nombreUsuario"})
    private String usuario;

    @JsonProperty("contrasena")
    @JsonAlias({"password", "clave", "pass"})
    private String contrasena;

    @JsonProperty("dni")
    private String dni;

    @JsonProperty("nombre")
    @JsonAlias({"name", "fullName", "nombreCompleto"})
    private String nombre;

    @JsonProperty("rol")
    @JsonAlias({"role", "cargo"})
    private String rol;
}
