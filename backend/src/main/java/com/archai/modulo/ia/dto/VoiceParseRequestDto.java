package com.archai.modulo.ia.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoiceParseRequestDto {
    private String command;
}
