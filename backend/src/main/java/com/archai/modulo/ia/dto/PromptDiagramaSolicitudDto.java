package com.archai.modulo.ia.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromptDiagramaSolicitudDto {

    @JsonProperty("prompt")
    @JsonAlias({"descripcion", "requerimiento", "text"})
    private String prompt;

    @JsonProperty("titulo")
    @JsonAlias({"title", "nombre"})
    private String titulo;

    @JsonProperty("proyectoId")
    private String proyectoId;
}
