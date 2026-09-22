package com.archai.modulo.generador.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

/** CU-13 · Solicitud de importación de un archivo OMG XMI 2.1. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SolicitudImportacionXmiDto {

    @JsonProperty("xmiContent")
    @JsonAlias({"xmi", "contenidoXmi", "xml"})
    private String xmiContent;

    @JsonProperty("titulo")
    @JsonAlias({"title", "nombre"})
    private String titulo;
}