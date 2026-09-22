package com.archai.modulo.proyecto.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrearProyectoSolicitudDto {

    @JsonProperty("nombre")
    @JsonAlias({"name", "title"})
    private String nombre;

    @JsonProperty("descripcion")
    @JsonAlias({"description"})
    private String descripcion;

    @JsonProperty("iconoColor")
    @JsonAlias({"color", "iconColor"})
    private String iconoColor;

    @JsonProperty("propietarioId")
    @JsonAlias({"ownerId", "userId"})
    private String propietarioId;
}
