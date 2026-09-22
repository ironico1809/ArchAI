package com.archai.modulo.generador.servicio;

import com.archai.modulo.diagrama.dto.DiagramDto;
import com.archai.modulo.diagrama.dto.UmlAttributeDto;
import com.archai.modulo.diagrama.dto.UmlClassDto;
import com.archai.modulo.diagrama.dto.UmlMethodDto;
import com.archai.modulo.diagrama.dto.UmlRelationDto;
import org.springframework.stereotype.Service;

/**
 * CU-13 — Exportación e Importación OMG XMI 2.1.
 * Exporta el modelo UML 2.5 a XMI 2.1 compatible con Enterprise Architect y draw.io.
 */
@Service
public class ServicioXmi {

    public String exportXmi(DiagramDto diagram) {
        StringBuilder sb = new StringBuilder();
        String nombreModelo = escaparXml(diagram.getTitle() != null ? diagram.getTitle() : "ArchAI_Model");

        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.append("<xmi:XMI xmi:version=\"2.1\" xmlns:uml=\"http://schema.omg.org/spec/UML/2.1\" xmlns:xmi=\"http://schema.omg.org/spec/XMI/2.1\">\n");
        sb.append("  <uml:Model xmi:id=\"model-1\" name=\"").append(nombreModelo).append("\">\n");

        if (diagram.getClasses() != null) {
            for (UmlClassDto cls : diagram.getClasses()) {
                String id = escaparXml(cls.getId());
                String nombre = escaparXml(cls.getName());
                sb.append("    <packagedElement xmi:type=\"uml:Class\" xmi:id=\"").append(id)
                        .append("\" name=\"").append(nombre).append("\"");
                if (cls.getStereotype() != null && !cls.getStereotype().isEmpty()) {
                    sb.append(" stereotype=\"").append(escaparXml(cls.getStereotype())).append("\"");
                }
                sb.append(">\n");

                if (cls.getAttributes() != null) {
                    for (UmlAttributeDto attr : cls.getAttributes()) {
                        sb.append("      <ownedAttribute xmi:id=\"").append(escaparXml(attr.getId()))
                                .append("\" name=\"").append(escaparXml(attr.getName()))
                                .append("\" visibility=\"").append(attr.getVisibility() != null ? attr.getVisibility() : "public")
                                .append("\" type=\"").append(attr.getType() != null ? escaparXml(attr.getType()) : "String")
                                .append("\"");
                        if (attr.isPrimaryKey()) {
                            sb.append(" isPrimaryKey=\"true\"");
                        }
                        if (attr.getIsUnique() != null && attr.getIsUnique()) {
                            sb.append(" isUnique=\"true\"");
                        }
                        sb.append("/>\n");
                    }
                }

                if (cls.getMethods() != null) {
                    for (UmlMethodDto metodo : cls.getMethods()) {
                        sb.append("      <ownedOperation xmi:id=\"").append(escaparXml(metodo.getId()))
                                .append("\" name=\"").append(escaparXml(metodo.getName()))
                                .append("\" visibility=\"").append(metodo.getVisibility() != null ? metodo.getVisibility() : "public")
                                .append("\" returnType=\"").append(metodo.getReturnType() != null ? escaparXml(metodo.getReturnType()) : "void")
                                .append("\"/>\n");
                    }
                }
                sb.append("    </packagedElement>\n");
            }
        }

        if (diagram.getRelations() != null) {
            for (UmlRelationDto rel : diagram.getRelations()) {
                sb.append("    <packagedElement xmi:type=\"uml:Association\" xmi:id=\"").append(escaparXml(rel.getId()))
                        .append("\" name=\"a\" source=\"").append(escaparXml(rel.getSourceClassId()))
                        .append("\" target=\"").append(escaparXml(rel.getTargetClassId()))
                        .append("\" associationType=\"").append(escaparXml(rel.getType()))
                        .append("\" sourceMultiplicity=\"").append(escaparXml(rel.getSourceMultiplicity()))
                        .append("\" targetMultiplicity=\"").append(escaparXml(rel.getTargetMultiplicity()))
                        .append("\"/>\n");
            }
        }

        sb.append("  </uml:Model>\n");
        sb.append("</xmi:XMI>\n");
        return sb.toString();
    }

    private String escaparXml(String valor) {
        if (valor == null) {
            return "";
        }
        return valor.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}