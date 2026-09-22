package com.archai.modulo.colaboracion.dto;

import com.archai.modulo.autenticacion.dto.PerfilUsuarioDto;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

/** CU-03 · Solicitud para crear una sala colaborativa (anfitrión). */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrearSalaSolicitudDto {

    @JsonProperty("nombreSala")
    @Builder.Default
    private String nombreSala = "Sesión de Ingeniería";

    @JsonProperty("anfitrion")
    private PerfilUsuarioDto anfitrion;
}