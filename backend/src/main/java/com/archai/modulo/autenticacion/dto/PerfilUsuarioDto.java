package com.archai.modulo.autenticacion.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PerfilUsuarioDto {

    @JsonProperty("id")
    private String id;

    @JsonProperty("dni")
    private String dni;

    @JsonProperty("name")
    private String name;

    @JsonProperty("username")
    private String username;

    @JsonProperty("email")
    private String email;

    @JsonProperty("role")
    private String role;

    @JsonProperty("avatarColor")
    private String avatarColor;

    @JsonProperty("isHost")
    private Boolean isHost;
}
