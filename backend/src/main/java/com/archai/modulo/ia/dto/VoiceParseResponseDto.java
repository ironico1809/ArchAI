package com.archai.modulo.ia.dto;

import com.archai.modulo.diagrama.dto.UmlAttributeDto;
import com.archai.modulo.diagrama.dto.UmlClassDto;
import com.archai.modulo.diagrama.dto.UmlRelationDto;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoiceParseResponseDto {
    private boolean success;
    private String action; // CREATE_CLASS, ADD_ATTRIBUTE, ADD_RELATION, UNKNOWN
    private String rawCommand;
    private UmlClassDto createdClass;
    private UmlAttributeDto createdAttribute;
    private UmlRelationDto createdRelation;
    private String targetClassName;
    private String message;
}
