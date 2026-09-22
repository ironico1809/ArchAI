package com.archai.modulo.ia.dto;

import com.archai.modulo.diagrama.dto.UmlClassDto;
import com.archai.modulo.diagrama.dto.UmlRelationDto;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/** CU-08 · Respuesta del agente IA contextual: análisis, alertas, sugerencias y acciones. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RespuestaContextualDto {

    @JsonProperty("success")
    private boolean success;

    @JsonProperty("respuesta")
    private String respuesta;

    @JsonProperty("alertas")
    @Builder.Default
    private List<String> alertas = new ArrayList<>();

    @JsonProperty("sugerencias")
    @Builder.Default
    private List<String> sugerencias = new ArrayList<>();

    @JsonProperty("clasesSugeridas")
    @Builder.Default
    private List<UmlClassDto> clasesSugeridas = new ArrayList<>();

    @JsonProperty("relacionesSugeridas")
    @Builder.Default
    private List<UmlRelationDto> relacionesSugeridas = new ArrayList<>();

    @JsonProperty("accionEjecutable")
    private String accionEjecutable;
}