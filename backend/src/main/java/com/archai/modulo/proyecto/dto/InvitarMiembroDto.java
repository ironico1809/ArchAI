package com.archai.modulo.proyecto.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvitarMiembroDto {

    @JsonProperty("correoOUsuario")
    @JsonAlias({"emailOrUsername", "email", "usuario", "username", "usuarioId"})
    private String correoOUsuario;

    @JsonProperty("rolProyecto")
    @JsonAlias({"role", "rol"})
    private String rolProyecto; // ADMINISTRADOR, EDITOR, LECTOR
}
