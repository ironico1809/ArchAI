package com.archai.modulo.ia.dto;

import com.archai.modulo.diagrama.dto.UmlClassDto;
import com.archai.modulo.diagrama.dto.UmlRelationDto;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/** CU-08 · Solicitud al agente IA contextual: mensaje + contexto actual del modelo. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsultaContextualSolicitudDto {

    @JsonProperty("mensaje")
    private String mensaje;

    @JsonProperty("clasesActuales")
    @Builder.Default
    private List<UmlClassDto> clasesActuales = new ArrayList<>();

    @JsonProperty("relacionesActuales")
    @Builder.Default
    private List<UmlRelationDto> relacionesActuales = new ArrayList<>();

    @JsonProperty("contextoExtra")
    private String contextoExtra;
}