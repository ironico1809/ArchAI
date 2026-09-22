package com.archai.modulo.generador.servicio;

import com.archai.comun.excepcion.ExcepcionNegocio;
import com.archai.modulo.diagrama.dto.*;
import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * CU-13 — Importación OMG XMI 2.1.
 * Parsea un documento XMI 2.1 (exportado por ArchAI, Enterprise Architect o draw.io)
 * y lo convierte en un DiagramDto editable en el lienzo UML.
 */
@Service
public class ServicioImportacionXmi {

    public DiagramDto importarXmi(String contenidoXmi, String titulo) {
        if (contenidoXmi == null || contenidoXmi.trim().isEmpty()) {
            throw new ExcepcionNegocio("El contenido XMI está vacío. Suba un archivo .xmi válido.");
        }

        Document documento;
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            DocumentBuilder builder = factory.newDocumentBuilder();
            documento = builder.parse(new ByteArrayInputStream(contenidoXmi.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new ExcepcionNegocio("No se pudo analizar el archivo XMI. Verifique que sea un documento XML 2.1 válido.");
        }

        List<UmlClassDto> clases = new ArrayList<>();
        List<UmlRelationDto> relaciones = new ArrayList<>();
        String nombreModelo = (titulo != null && !titulo.trim().isEmpty()) ? titulo : null;

        // Nombre del modelo desde <uml:Model ... name="..."> (solo si no se indicó título)
        NodeList modelos = documento.getElementsByTagName("*");
        for (int i = 0; i < modelos.getLength() && nombreModelo == null; i++) {
            Node nodo = modelos.item(i);
            if (nodo.getNodeType() == Node.ELEMENT_NODE) {
                Element el = (Element) nodo;
                String local = el.getLocalName() != null ? el.getLocalName() : el.getNodeName();
                if (local.contains("Model") || local.endsWith("Model")) {
                    String name = el.getAttribute("name");
                    if (name != null && !name.isEmpty()) {
                        nombreModelo = name;
                    }
                    break;
                }
            }
        }

        NodeList elementos = documento.getElementsByTagName("*");
        for (int i = 0; i < elementos.getLength(); i++) {
            Node nodo = elementos.item(i);
            if (nodo.getNodeType() != Node.ELEMENT_NODE) {
                continue;
            }
            Element el = (Element) nodo;
            String local = el.getLocalName() != null ? el.getLocalName() : el.getNodeName();
            String tipo = el.getAttribute("xmi:type");
            if (tipo == null || tipo.isEmpty()) {
                tipo = el.getAttribute("type");
            }

            if (tipo != null && tipo.contains("Class")) {
                clases.add(parsearClase(el));
            } else if (tipo != null && tipo.contains("Association")) {
                UmlRelationDto relacion = parsearAsociacion(el);
                if (relacion != null) {
                    relaciones.add(relacion);
                }
            } else if (local != null && local.contains("packagedElement")) {
                // Formato simple donde packagedElement solo tiene type="uml:Class"
                String attrType = el.getAttribute("xmi:type");
                if (attrType != null && attrType.contains("Class")) {
                    clases.add(parsearClase(el));
                } else if (attrType != null && attrType.contains("Association")) {
                    UmlRelationDto relacion = parsearAsociacion(el);
                    if (relacion != null) {
                        relaciones.add(relacion);
                    }
                }
            }
        }

        if (clases.isEmpty() && relaciones.isEmpty()) {
            throw new ExcepcionNegocio("No se encontraron clases ni asociaciones UML en el documento XMI.");
        }

        String nombreFinal = (nombreModelo != null && !nombreModelo.isBlank())
                ? nombreModelo
                : "Modelo Importado desde XMI";

        return DiagramDto.builder()
                .id("diag-xmi-" + UUID.randomUUID())
                .title(nombreFinal)
                .description("Importado desde OMG XMI 2.1: " + clases.size() + " clase(s) y " + relaciones.size() + " relación(es).")
                .classes(clases)
                .relations(relaciones)
                .build();
    }

    private UmlClassDto parsearClase(Element el) {
        String id = valorOGenerado(el.getAttribute("xmi:id"), "cls-");
        String nombre = el.getAttribute("name");
        if (nombre == null || nombre.isEmpty()) {
            nombre = "ClaseImportada";
        }
        String estereotipo = el.getAttribute("stereotype");

        List<UmlAttributeDto> atributos = new ArrayList<>();
        List<UmlMethodDto> metodos = new ArrayList<>();

        NodeList hijos = el.getChildNodes();
        for (int i = 0; i < hijos.getLength(); i++) {
            Node hijo = hijos.item(i);
            if (hijo.getNodeType() != Node.ELEMENT_NODE) {
                continue;
            }
            Element hijoS = (Element) hijo;
            String local = hijoS.getLocalName() != null ? hijoS.getLocalName() : hijoS.getNodeName();

            if (local.contains("ownedAttribute") || local.contains("attribute") || local.equals("ownedAttribute")) {
                String attrId = valorOGenerado(hijoS.getAttribute("xmi:id"), "attr-");
                String attrNombre = hijoS.getAttribute("name");
                String tipo = hijoS.getAttribute("type");
                String visibilidad = hijoS.getAttribute("visibility");
                String pkRa = hijoS.getAttribute("isPrimaryKey");

                atributos.add(UmlAttributeDto.builder()
                        .id(attrId)
                        .name(attrNombre.isEmpty() ? "campo" : attrNombre)
                        .type(tipo.isEmpty() ? "String" : tipo)
                        .visibility(visibilidad.isEmpty() ? "+" : visibilidad)
                        .isPrimaryKey(Boolean.parseBoolean(pkRa) || "id".equalsIgnoreCase(attrNombre))
                        .isNullable(!Boolean.parseBoolean(pkRa))
                        .build());
            } else if (local.contains("ownedOperation") || local.contains("operation")) {
                String metodoId = valorOGenerado(hijoS.getAttribute("xmi:id"), "m-");
                String metodoNombre = hijoS.getAttribute("name");
                String retorno = hijoS.getAttribute("returnType");
                String visibilidad = hijoS.getAttribute("visibility");

                metodos.add(UmlMethodDto.builder()
                        .id(metodoId)
                        .name(metodoNombre.isEmpty() ? "operacion" : metodoNombre)
                        .returnType(retorno.isEmpty() ? "void" : retorno)
                        .visibility(visibilidad.isEmpty() ? "+" : visibilidad)
                        .parameters(new ArrayList<>())
                        .build());
            }
        }

        return UmlClassDto.builder()
                .id(id)
                .name(nombre)
                .stereotype(estereotipo.isEmpty() ? "Entity" : estereotipo)
                .position(new PositionDto(200.0, 160.0))
                .attributes(atributos)
                .methods(metodos)
                .build();
    }

    private UmlRelationDto parsearAsociacion(Element el) {
        String origen = el.getAttribute("source");
        String destino = el.getAttribute("target");
        if (origen == null || destino == null || origen.isEmpty() || destino.isEmpty()) {
            // Intentar leer memberEnd / ownedEnd anidados
            NodeList hijos = el.getChildNodes();
            List<String> extremos = new ArrayList<>();
            for (int i = 0; i < hijos.getLength(); i++) {
                Node hijo = hijos.item(i);
                if (hijo.getNodeType() == Node.ELEMENT_NODE) {
                    Element hijoS = (Element) hijo;
                    String local = hijoS.getLocalName() != null ? hijoS.getLocalName() : hijoS.getNodeName();
                    if (local.contains("memberEnd") || local.contains("ownedEnd") || local.contains("end")) {
                        String tipo = hijoS.getAttribute("xmi:type");
                        if (tipo != null && tipo.contains("uml:Class")) {
                            extremos.add(hijoS.getAttribute("xmi:id"));
                        }
                    }
                }
            }
            if (extremos.size() >= 2) {
                origen = extremos.get(0);
                destino = extremos.get(1);
            }
        }
        if (origen.isEmpty() || destino.isEmpty()) {
            return null;
        }

        String tipoRelacion = el.getAttribute("associationType");
        String multOrigen = el.getAttribute("sourceMultiplicity");
        String multDestino = el.getAttribute("targetMultiplicity");

        return UmlRelationDto.builder()
                .id(valorOGenerado(el.getAttribute("xmi:id"), "rel-"))
                .sourceClassId(origen)
                .targetClassId(destino)
                .type(tipoRelacion.isEmpty() ? "ASSOCIATION_1_N" : tipoRelacion)
                .sourceMultiplicity(multOrigen.isEmpty() ? "1" : multOrigen)
                .targetMultiplicity(multDestino.isEmpty() ? "0..*" : multDestino)
                .build();
    }

    private String valorOGenerado(String valor, String prefijo) {
        if (valor != null && !valor.trim().isEmpty()) {
            return valor.trim();
        }
        return prefijo + UUID.randomUUID();
    }
}