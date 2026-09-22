package com.archai.modulo.autenticacion.dto;

import com.archai.modulo.colaboracion.dto.InfoSesionDto;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AutenticacionRespuestaDto {

    @JsonProperty("token")
    private String token;

    @JsonProperty("success")
    private boolean success;

    @JsonProperty("message")
    private String message;

    @JsonProperty("user")
    private PerfilUsuarioDto user;

    @JsonProperty("session")
    private InfoSesionDto session;
}
