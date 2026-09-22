package com.archai;

import com.archai.modulo.autenticacion.dto.*;
import com.archai.modulo.autenticacion.entidad.UsuarioEntity;
import com.archai.modulo.autenticacion.repositorio.UsuarioRepository;
import com.archai.modulo.autenticacion.servicio.ServicioAutenticacion;
import com.archai.modulo.diagrama.dto.*;
import com.archai.modulo.diagrama.entidad.DiagramaEntity;
import com.archai.modulo.diagrama.repositorio.DiagramaRepository;
import com.archai.modulo.diagrama.servicio.ServicioDiagrama;
import com.archai.modulo.generador.dto.GeneratedFileDto;
import com.archai.modulo.generador.servicio.*;
import com.archai.modulo.ia.dto.PromptDiagramaSolicitudDto;
import com.archai.modulo.ia.dto.VoiceParseRequestDto;
import com.archai.modulo.ia.dto.VoiceParseResponseDto;
import com.archai.modulo.ia.servicio.ServicioAnalizadorVozIa;
import com.archai.modulo.ia.servicio.ServicioGeneradorDiagramaIa;
import com.archai.modulo.proyecto.dto.*;
import com.archai.modulo.proyecto.entidad.ProyectoEntity;
import com.archai.modulo.proyecto.repositorio.ProyectoRepository;
import com.archai.modulo.proyecto.servicio.ServicioProyecto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.zip.ZipInputStream;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class ArchAiBackendApplicationTests {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ProyectoRepository proyectoRepository;

    @Autowired
    private DiagramaRepository diagramaRepository;

    @Autowired
    private ServicioAutenticacion servicioAutenticacion;

    @Autowired
    private ServicioProyecto servicioProyecto;

    @Autowired
    private ServicioDiagrama servicioDiagrama;

    @Autowired
    private ServicioGeneradorSpringBoot generadorSpringBoot;

    @Autowired
    private ServicioGeneradorPostgresDdl generadorPostgresDdl;

    @Autowired
    private ServicioExportacionZip servicioExportacionZip;

    @Autowired
    private ServicioAnalizadorVozIa servicioAnalizadorVozIa;

    @Autowired
    private ServicioGeneradorDiagramaIa servicioGeneradorDiagramaIa;

    @Test
    void testContextLoads() {
        assertNotNull(usuarioRepository);
        assertNotNull(proyectoRepository);
        assertNotNull(diagramaRepository);
    }

    @Test
    void testModuloAutenticacion() {
        AutenticacionSolicitudDto solicitud = AutenticacionSolicitudDto.builder()
                .usuario("carlos_criado")
                .contrasena("password123")
                .build();

        AutenticacionRespuestaDto respuesta = servicioAutenticacion.autenticar(solicitud);
        assertNotNull(respuesta);
        assertTrue(respuesta.isSuccess());
        assertEquals("Ing. Carlos Criado", respuesta.getUser().getName());
        assertNotNull(respuesta.getToken());
    }

    @Test
    void testModuloProyectosYMiembros() {
        ProyectoDto nuevo = servicioProyecto.crearProyecto(CrearProyectoSolicitudDto.builder()
                .nombre("Proyecto Finanzas Core")
                .descripcion("Arquitectura microservicios bancarios")
                .iconoColor("#7C3AED")
                .propietarioId("usr-admin-01")
                .build());

        assertNotNull(nuevo);
        assertNotNull(nuevo.getId());
        assertEquals("Proyecto Finanzas Core", nuevo.getNombre());

        MiembroProyectoDto miembro = servicioProyecto.invitarMiembro(nuevo.getId(), InvitarMiembroDto.builder()
                .correoOUsuario("elena.ramos@archai.io")
                .rolProyecto("ADMINISTRADOR")
                .build());

        assertNotNull(miembro);
        assertEquals("Dra. Elena Ramos", miembro.getNombre());
    }

    @Test
    void testModuloDiagramasYVersiones() {
        DiagramDto diag = DiagramDto.builder()
                .title("Diagrama Facturación")
                .description("Modelo relacional")
                .classes(List.of(
                        UmlClassDto.builder()
                                .id("c-1")
                                .name("Factura")
                                .stereotype("Entity")
                                .attributes(List.of(
                                        UmlAttributeDto.builder().id("a1").name("id").type("Long").isPrimaryKey(true).build(),
                                        UmlAttributeDto.builder().id("a2").name("numero").type("String").build()
                                ))
                                .build()
                ))
                .build();

        DiagramDto guardado = servicioDiagrama.guardarDiagrama(diag);
        assertNotNull(guardado.getId());

        VersionDiagramaDto version = servicioDiagrama.crearVersion(guardado.getId(), "v1.0", "Version inicial", "usr-admin-01");
        assertNotNull(version);
        assertEquals(1, version.getNumeroVersion());
    }

    @Test
    void testGeneradorSpringBoot() {
        DiagramDto diag = DiagramDto.builder()
                .title("Sistema Logística")
                .classes(List.of(
                        UmlClassDto.builder()
                                .id("c-vehiculo")
                                .name("Vehiculo")
                                .attributes(List.of(
                                        UmlAttributeDto.builder().id("v1").name("id").type("Long").isPrimaryKey(true).build(),
                                        UmlAttributeDto.builder().id("v2").name("placa").type("String").build()
                                ))
                                .build()
                ))
                .build();

        List<GeneratedFileDto> files = generadorSpringBoot.generateProjectFiles(diag);
        assertTrue(files.size() >= 8);
    }

    @Test
    void testAiVoiceParser() {
        VoiceParseRequestDto request = VoiceParseRequestDto.builder()
                .command("crea la clase Medico con atributo matricula String y especialidad String")
                .build();

        VoiceParseResponseDto response = servicioAnalizadorVozIa.parseCommand(request);
        assertNotNull(response);
        assertTrue(response.isSuccess());
        assertEquals("Medico", response.getCreatedClass().getName());
        assertEquals(3, response.getCreatedClass().getAttributes().size());
    }

    @Test
    void testGeneradorDiagramaIa() {
        DiagramDto diag = servicioGeneradorDiagramaIa.generarDiagramaDesdePrompt(PromptDiagramaSolicitudDto.builder()
                .prompt("Crear sistema de clinica hospitalaria con medicos y pacientes")
                .titulo("Clinica IA")
                .build());

        assertNotNull(diag);
        assertTrue(diag.getClasses().size() >= 3);
    }
}
