package com.archai.modulo.colaboracion.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MensajeColaboracionDto {
    private String tipo; // CURSOR_MOVE, CLASS_ADD, CLASS_UPDATE, CLASS_DELETE, RELATION_ADD, CHAT_MESSAGE
    private String emisorId;
    private String emisorNombre;
    private String salaId;
    private Object payload;
    private long timestamp;
}
