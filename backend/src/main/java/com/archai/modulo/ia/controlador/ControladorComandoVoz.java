package com.archai.modulo.ia.controlador;

import com.archai.modulo.ia.dto.VoiceParseRequestDto;
import com.archai.modulo.ia.dto.VoiceParseResponseDto;
import com.archai.modulo.ia.servicio.ServicioAnalizadorVozIa;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/ai/voice", "/api/v1/ia/voz", "/api/v1/voice", "/api/v1/voz"})
@RequiredArgsConstructor
public class ControladorComandoVoz {

    private final ServicioAnalizadorVozIa servicioAnalizadorVoz;

    @PostMapping({"/parse", "/analizar"})
    public ResponseEntity<VoiceParseResponseDto> procesarComandoVoz(@RequestBody VoiceParseRequestDto request) {
        return ResponseEntity.ok(servicioAnalizadorVoz.parseCommand(request));
    }
}
