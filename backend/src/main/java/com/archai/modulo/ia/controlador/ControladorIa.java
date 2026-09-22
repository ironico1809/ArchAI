package com.archai.modulo.ia.controlador;

import com.archai.modulo.diagrama.dto.DiagramDto;
import com.archai.modulo.ia.dto.ConsultaContextualSolicitudDto;
import com.archai.modulo.ia.dto.PromptDiagramaSolicitudDto;
import com.archai.modulo.ia.dto.RespuestaContextualDto;
import com.archai.modulo.ia.dto.VoiceParseRequestDto;
import com.archai.modulo.ia.dto.VoiceParseResponseDto;
import com.archai.modulo.ia.servicio.ServicioAgenteContextualIa;
import com.archai.modulo.ia.servicio.ServicioAnalizadorVozIa;
import com.archai.modulo.ia.servicio.ServicioGeneradorDiagramaIa;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/ia", "/api/v1/ai"})
@RequiredArgsConstructor
public class ControladorIa {

    private final ServicioAnalizadorVozIa servicioAnalizadorVoz;
    private final ServicioGeneradorDiagramaIa servicioGeneradorDiagrama;
    private final ServicioAgenteContextualIa servicioAgenteContextual;

    @PostMapping({"/voz", "/voice", "/voz/analizar", "/voice/parse"})
    public ResponseEntity<VoiceParseResponseDto> procesarComandoVoz(@RequestBody VoiceParseRequestDto request) {
        return ResponseEntity.ok(servicioAnalizadorVoz.parseCommand(request));
    }

    @PostMapping({"/generar-diagrama", "/generate-diagram"})
    public ResponseEntity<DiagramDto> generarDiagrama(@RequestBody PromptDiagramaSolicitudDto solicitud) {
        return ResponseEntity.ok(servicioGeneradorDiagrama.generarDiagramaDesdePrompt(solicitud));
    }

    @PostMapping({"/contexto", "/context", "/agente-contextual", "/contextual-agent"})
    public ResponseEntity<RespuestaContextualDto> analizarContexto(@RequestBody ConsultaContextualSolicitudDto solicitud) {
        return ResponseEntity.ok(servicioAgenteContextual.analizar(solicitud));
    }
}
