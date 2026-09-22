package com.archai.modulo.diagrama.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComentarioDiagramaDto {

    @JsonProperty("id")
    private String id;

    @JsonProperty("diagramaId")
    private String diagramaId;

    @JsonProperty("usuarioId")
    private String usuarioId;

    @JsonProperty("usuarioNombre")
    private String usuarioNombre;

    @JsonProperty("usuarioAvatarColor")
    private String usuarioAvatarColor;

    @JsonProperty("texto")
    private String texto;

    @JsonProperty("posicionX")
    private Double posicionX;

    @JsonProperty("posicionY")
    private Double posicionY;

    @JsonProperty("resuelto")
    private Boolean resuelto;

    @JsonProperty("fechaCreacion")
    private LocalDateTime fechaCreacion;
}
