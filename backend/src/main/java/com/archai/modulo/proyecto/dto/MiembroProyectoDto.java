package com.archai.modulo.proyecto.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MiembroProyectoDto {

    @JsonProperty("id")
    private String id;

    @JsonProperty("usuarioId")
    private String usuarioId;

    @JsonProperty("nombre")
    private String nombre;

    @JsonProperty("correo")
    private String correo;

    @JsonProperty("avatarColor")
    private String avatarColor;

    @JsonProperty("rolProyecto")
    private String rolProyecto; // PROPIETARIO, ADMINISTRADOR, EDITOR, LECTOR

    @JsonProperty("fechaAgregado")
    private LocalDateTime fechaAgregado;
}
