package com.archai.modulo.generador.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeneratedFileDto {
    private String filename;
    private String path;
    private String language;
    private String content;
}
