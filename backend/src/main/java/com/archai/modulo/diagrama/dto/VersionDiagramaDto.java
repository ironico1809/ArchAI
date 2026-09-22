package com.archai.modulo.diagrama.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VersionDiagramaDto {

    @JsonProperty("id")
    private String id;

    @JsonProperty("diagramaId")
    private String diagramaId;

    @JsonProperty("numeroVersion")
    private Integer numeroVersion;

    @JsonProperty("etiqueta")
    private String etiqueta;

    @JsonProperty("descripcionCambio")
    private String descripcionCambio;

    @JsonProperty("autorId")
    private String autorId;

    @JsonProperty("autorNombre")
    private String autorNombre;

    @JsonProperty("fechaCreacion")
    private LocalDateTime fechaCreacion;

    @JsonProperty("diagrama")
    private DiagramDto diagrama;
}
