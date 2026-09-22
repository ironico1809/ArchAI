package com.archai.modulo.ia.servicio;

import com.archai.modulo.diagrama.dto.*;
import com.archai.modulo.ia.dto.PromptDiagramaSolicitudDto;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ServicioGeneradorDiagramaIa {

    public DiagramDto generarDiagramaDesdePrompt(PromptDiagramaSolicitudDto solicitud) {
        String prompt = solicitud.getPrompt() != null ? solicitud.getPrompt().toLowerCase() : "";
        String title = solicitud.getTitulo() != null && !solicitud.getTitulo().isEmpty()
                ? solicitud.getTitulo()
                : "Sistema de Arquitectura IA";

        List<UmlClassDto> classes = new ArrayList<>();
        List<UmlRelationDto> relations = new ArrayList<>();

        if (prompt.contains("clinica") || prompt.contains("hospital") || prompt.contains("medico") || prompt.contains("paciente")) {
            UmlClassDto paciente = crearClase("Paciente", 120.0, 150.0, List.of(
                    crearAttr("id", "Long", true),
                    crearAttr("nombre", "String", false),
                    crearAttr("ci", "String", false),
                    crearAttr("telefono", "String", false)
            ));
            UmlClassDto medico = crearClase("Medico", 500.0, 150.0, List.of(
                    crearAttr("id", "Long", true),
                    crearAttr("nombre", "String", false),
                    crearAttr("especialidad", "String", false),
                    crearAttr("matricula", "String", false)
            ));
            UmlClassDto consulta = crearClase("Consulta", 310.0, 380.0, List.of(
                    crearAttr("id", "Long", true),
                    crearAttr("fecha", "LocalDateTime", false),
                    crearAttr("diagnostico", "String", false),
                    crearAttr("costo", "Double", false)
            ));

            classes.add(paciente);
            classes.add(medico);
            classes.add(consulta);

            relations.add(crearRel(paciente.getId(), consulta.getId(), "ASSOCIATION_1_N", "1", "0..*"));
            relations.add(crearRel(medico.getId(), consulta.getId(), "ASSOCIATION_1_N", "1", "0..*"));
        } else if (prompt.contains("ecommerce") || prompt.contains("tienda") || prompt.contains("producto") || prompt.contains("pedido")) {
            UmlClassDto cliente = crearClase("Cliente", 120.0, 150.0, List.of(
                    crearAttr("id", "Long", true),
                    crearAttr("nombre", "String", false),
                    crearAttr("correo", "String", false),
                    crearAttr("direccion", "String", false)
            ));
            UmlClassDto pedido = crearClase("Pedido", 450.0, 150.0, List.of(
                    crearAttr("id", "Long", true),
                    crearAttr("fechaPedido", "LocalDateTime", false),
                    crearAttr("total", "Double", false),
                    crearAttr("estado", "String", false)
            ));
            UmlClassDto producto = crearClase("Producto", 450.0, 420.0, List.of(
                    crearAttr("id", "Long", true),
                    crearAttr("nombre", "String", false),
                    crearAttr("precio", "Double", false),
                    crearAttr("stock", "Integer", false)
            ));

            classes.add(cliente);
            classes.add(pedido);
            classes.add(producto);

            relations.add(crearRel(cliente.getId(), pedido.getId(), "ASSOCIATION_1_N", "1", "0..*"));
            relations.add(crearRel(pedido.getId(), producto.getId(), "ASSOCIATION_N_M", "1..*", "1..*"));
        } else {
            // Modelo genérico modular
            UmlClassDto usuario = crearClase("Usuario", 150.0, 180.0, List.of(
                    crearAttr("id", "Long", true),
                    crearAttr("nombre", "String", false),
                    crearAttr("correo", "String", false)
            ));
            UmlClassDto registro = crearClase("RegistroActividad", 480.0, 180.0, List.of(
                    crearAttr("id", "Long", true),
                    crearAttr("descripcion", "String", false),
                    crearAttr("fecha", "LocalDateTime", false)
            ));

            classes.add(usuario);
            classes.add(registro);
            relations.add(crearRel(usuario.getId(), registro.getId(), "ASSOCIATION_1_N", "1", "0..*"));
        }

        return DiagramDto.builder()
                .id("diag-" + UUID.randomUUID())
                .proyectoId(solicitud.getProyectoId())
                .title(title)
                .description("Generado automáticamente por ArchAI Asistente de IA")
                .classes(classes)
                .relations(relations)
                .build();
    }

    private UmlClassDto crearClase(String name, Double x, Double y, List<UmlAttributeDto> attrs) {
        return UmlClassDto.builder()
                .id("cls-" + UUID.randomUUID())
                .name(name)
                .stereotype("Entity")
                .position(new PositionDto(x, y))
                .attributes(attrs)
                .methods(new ArrayList<>())
                .build();
    }

    private UmlAttributeDto crearAttr(String name, String type, boolean isPk) {
        return UmlAttributeDto.builder()
                .id("attr-" + UUID.randomUUID())
                .name(name)
                .type(type)
                .visibility("+")
                .isPrimaryKey(isPk)
                .isNullable(false)
                .build();
    }

    private UmlRelationDto crearRel(String src, String tgt, String type, String srcMult, String tgtMult) {
        return UmlRelationDto.builder()
                .id("rel-" + UUID.randomUUID())
                .sourceClassId(src)
                .targetClassId(tgt)
                .type(type)
                .sourceMultiplicity(srcMult)
                .targetMultiplicity(tgtMult)
                .build();
    }
}
