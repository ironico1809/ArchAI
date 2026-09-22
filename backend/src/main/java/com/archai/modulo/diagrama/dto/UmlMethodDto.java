package com.archai.modulo.diagrama.dto;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UmlMethodDto {
    private String id;
    private String name;
    private String returnType;
    private String visibility;
    private List<String> parameters;
}
