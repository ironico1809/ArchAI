package com.archai.modulo.generador.dto;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectGenerationResponseDto {
    private String diagramTitle;
    private List<GeneratedFileDto> files;
    private String postgresDdl;
    private String postmanCollectionJson;
    private String xmiContent;
    private String message;
}
