package com.archai.modulo.proyecto.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProyectoDto {

    @JsonProperty("id")
    private String id;

    @JsonProperty("nombre")
    private String nombre;

    @JsonProperty("descripcion")
    private String descripcion;

    @JsonProperty("codigoAcceso")
    private String codigoAcceso;

    @JsonProperty("iconoColor")
    private String iconoColor;

    @JsonProperty("estado")
    private String estado;

    @JsonProperty("propietarioId")
    private String propietarioId;

    @JsonProperty("propietarioNombre")
    private String propietarioNombre;

    @JsonProperty("fechaCreacion")
    private LocalDateTime fechaCreacion;

    @JsonProperty("fechaActualizacion")
    private LocalDateTime fechaActualizacion;

    @JsonProperty("totalDiagramas")
    private Integer totalDiagramas;

    @JsonProperty("miembros")
    private List<MiembroProyectoDto> miembros;
}
