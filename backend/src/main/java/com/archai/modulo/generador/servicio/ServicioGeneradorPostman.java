package com.archai.modulo.generador.servicio;

import com.archai.modulo.diagrama.dto.DiagramDto;
import com.archai.modulo.diagrama.dto.UmlAttributeDto;
import com.archai.modulo.diagrama.dto.UmlClassDto;
import org.springframework.stereotype.Service;

@Service
public class ServicioGeneradorPostman {

    public String generateCollectionJson(DiagramDto diagram) {
        String title = diagram.getTitle() != null ? diagram.getTitle() : "ArchAI API";
        StringBuilder sb = new StringBuilder();
        sb.append("{\n");
        sb.append("  \"info\": {\n");
        sb.append("    \"name\": \"").append(escaparJson(title)).append(" Collection\",\n");
        sb.append("    \"schema\": \"https://schema.getpostman.com/json/collection/v2.1.0/collection.json\"\n");
        sb.append("  },\n");
        sb.append("  \"item\": [\n");

        if (diagram.getClasses() != null && !diagram.getClasses().isEmpty()) {
            for (int i = 0; i < diagram.getClasses().size(); i++) {
                UmlClassDto cls = diagram.getClasses().get(i);
                String resource = toSnakeCase(cls.getName()) + "s";
                String sampleBody = construirCuerpoEjemplo(cls);

                sb.append("    {\n");
                sb.append("      \"name\": \"").append(escaparJson(cls.getName())).append("\",\n");
                sb.append("      \"item\": [\n");

                // 1. GET - Listar todos
                sb.append("        {\n");
                sb.append("          \"name\": \"Listar todos (").append(escaparJson(cls.getName())).append(")\",\n");
                sb.append("          \"request\": {\n");
                sb.append("            \"method\": \"GET\",\n");
                sb.append("            \"header\": [],\n");
                sb.append("            \"url\": { \"raw\": \"{{base_url}}/api/v1/").append(resource).append("\", \"host\": [\"{{base_url}}\"], \"path\": [\"api\", \"v1\", \"").append(resource).append("\"] }\n");
                sb.append("          }\n");
                sb.append("        },\n");

                // 2. POST - Crear nuevo
                sb.append("        {\n");
                sb.append("          \"name\": \"Crear nuevo (").append(escaparJson(cls.getName())).append(")\",\n");
                sb.append("          \"request\": {\n");
                sb.append("            \"method\": \"POST\",\n");
                sb.append("            \"header\": [{ \"key\": \"Content-Type\", \"value\": \"application/json\" }],\n");
                sb.append("            \"body\": { \"mode\": \"raw\", \"raw\": \"").append(escaparJson(sampleBody)).append("\" },\n");
                sb.append("            \"url\": { \"raw\": \"{{base_url}}/api/v1/").append(resource).append("\", \"host\": [\"{{base_url}}\"], \"path\": [\"api\", \"v1\", \"").append(resource).append("\"] }\n");
                sb.append("          }\n");
                sb.append("        },\n");

                // 3. GET - Por ID
                sb.append("        {\n");
                sb.append("          \"name\": \"Obtener por ID (").append(escaparJson(cls.getName())).append(")\",\n");
                sb.append("          \"request\": {\n");
                sb.append("            \"method\": \"GET\",\n");
                sb.append("            \"header\": [],\n");
                sb.append("            \"url\": { \"raw\": \"{{base_url}}/api/v1/").append(resource).append("/1\", \"host\": [\"{{base_url}}\"], \"path\": [\"api\", \"v1\", \"").append(resource).append("\", \"1\"] }\n");
                sb.append("          }\n");
                sb.append("        },\n");

                // 4. PUT - Actualizar
                sb.append("        {\n");
                sb.append("          \"name\": \"Actualizar (").append(escaparJson(cls.getName())).append(")\",\n");
                sb.append("          \"request\": {\n");
                sb.append("            \"method\": \"PUT\",\n");
                sb.append("            \"header\": [{ \"key\": \"Content-Type\", \"value\": \"application/json\" }],\n");
                sb.append("            \"body\": { \"mode\": \"raw\", \"raw\": \"").append(escaparJson(sampleBody)).append("\" },\n");
                sb.append("            \"url\": { \"raw\": \"{{base_url}}/api/v1/").append(resource).append("/1\", \"host\": [\"{{base_url}}\"], \"path\": [\"api\", \"v1\", \"").append(resource).append("\", \"1\"] }\n");
                sb.append("          }\n");
                sb.append("        },\n");

                // 5. DELETE - Eliminar
                sb.append("        {\n");
                sb.append("          \"name\": \"Eliminar (").append(escaparJson(cls.getName())).append(")\",\n");
                sb.append("          \"request\": {\n");
                sb.append("            \"method\": \"DELETE\",\n");
                sb.append("            \"header\": [],\n");
                sb.append("            \"url\": { \"raw\": \"{{base_url}}/api/v1/").append(resource).append("/1\", \"host\": [\"{{base_url}}\"], \"path\": [\"api\", \"v1\", \"").append(resource).append("\", \"1\"] }\n");
                sb.append("          }\n");
                sb.append("        }\n");

                sb.append("      ]\n");
                sb.append("    }");
                if (i < diagram.getClasses().size() - 1) sb.append(",");
                sb.append("\n");
            }
        }

        sb.append("  ],\n");
        sb.append("  \"variable\": [\n");
        sb.append("    { \"key\": \"base_url\", \"value\": \"http://localhost:8000\", \"type\": \"string\" }\n");
        sb.append("  ]\n");
        sb.append("}\n");
        return sb.toString();
    }

    private String construirCuerpoEjemplo(UmlClassDto cls) {
        StringBuilder json = new StringBuilder("{\\n");
        boolean primero = true;
        if (cls.getAttributes() != null) {
            for (UmlAttributeDto attr : cls.getAttributes()) {
                if (attr.isPrimaryKey() || "id".equalsIgnoreCase(attr.getName())) {
                    continue;
                }
                if (!primero) json.append(",\\n");
                json.append("  \\\"").append(attr.getName()).append("\\\": ");
                String type = attr.getType() != null ? attr.getType().toLowerCase() : "string";
                if (type.contains("string")) {
                    json.append("\\\"Ejemplo ").append(attr.getName()).append("\\\"");
                } else if (type.contains("long") || type.contains("int")) {
                    json.append("100");
                } else if (type.contains("double") || type.contains("float") || type.contains("decimal")) {
                    json.append("49.99");
                } else if (type.contains("bool")) {
                    json.append("true");
                } else if (type.contains("date")) {
                    json.append("\\\"2026-09-22\\\"");
                } else {
                    json.append("\\\"valor\\\"");
                }
                primero = false;
            }
        }
        json.append("\\n}");
        return json.toString();
    }

    private String toSnakeCase(String input) {
        if (input == null) return "entidad";
        return input.replaceAll("([a-z])([A-Z])", "$1_$2").toLowerCase();
    }

    private String escaparJson(String valor) {
        if (valor == null) return "";
        return valor.replace("\"", "\\\"");
    }
}

