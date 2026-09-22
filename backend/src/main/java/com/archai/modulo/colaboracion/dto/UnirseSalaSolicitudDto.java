package com.archai.modulo.colaboracion.dto;

import com.archai.modulo.autenticacion.dto.PerfilUsuarioDto;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

/** CU-03 · Solicitud para unirse a una sala colaborativa mediante PIN (ARC-######). */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UnirseSalaSolicitudDto {

    @JsonProperty("pin")
    private String pin;

    @JsonProperty("usuario")
    private PerfilUsuarioDto usuario;
}