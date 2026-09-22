package com.archai.modulo.generador.servicio;

import com.archai.modulo.diagrama.dto.DiagramDto;
import com.archai.modulo.diagrama.dto.UmlAttributeDto;
import com.archai.modulo.diagrama.dto.UmlClassDto;
import com.archai.modulo.diagrama.dto.UmlRelationDto;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ServicioGeneradorPostgresDdl {

    public String generateDdl(DiagramDto diagram) {
        StringBuilder sb = new StringBuilder();
        sb.append("-- ========================================================\n");
        sb.append("-- ArchAI DDL Script for PostgreSQL / Supabase\n");
        sb.append("-- Diagrama: ").append(diagram.getTitle() != null ? diagram.getTitle() : "UML Model").append("\n");
        sb.append("-- Clases UML: ").append(diagram.getClasses() != null ? diagram.getClasses().size() : 0);
        sb.append(" | Relaciones: ").append(diagram.getRelations() != null ? diagram.getRelations().size() : 0).append("\n");
        sb.append("-- Generated according to UML 2.5 Standard\n");
        sb.append("-- ========================================================\n\n");

        if (diagram.getClasses() != null) {
            for (UmlClassDto cls : diagram.getClasses()) {
                String tableName = toSnakeCase(cls.getName()) + "s";
                sb.append("CREATE TABLE IF NOT EXISTS ").append(tableName).append(" (\n");

                boolean hasId = false;
                List<String> colDefs = new java.util.ArrayList<>();

                if (cls.getAttributes() != null) {
                    for (UmlAttributeDto attr : cls.getAttributes()) {
                        String colName = toSnakeCase(attr.getName());
                        String pgType = mapToPgType(attr.getType());
                        StringBuilder col = new StringBuilder("    ").append(colName).append(" ").append(pgType);

                        if (attr.isPrimaryKey() || "id".equalsIgnoreCase(colName)) {
                            hasId = true;
                            col.append(" PRIMARY KEY");
                        }
                        if (!attr.isNullable()) {
                            col.append(" NOT NULL");
                        }
                        if (Boolean.TRUE.equals(attr.getIsUnique())) {
                            col.append(" UNIQUE");
                        }
                        colDefs.add(col.toString());
                    }
                }

                if (!hasId) {
                    colDefs.add(0, "    id BIGSERIAL PRIMARY KEY");
                }

                // Claves foráneas derivadas de relaciones entrantes
                if (diagram.getRelations() != null) {
                    for (UmlRelationDto rel : diagram.getRelations()) {
                        if (cls.getId() != null && cls.getId().equals(rel.getTargetClassId())) {
                            UmlClassDto src = findClassById(diagram, rel.getSourceClassId());
                            if (src != null) {
                                String srcCol = toSnakeCase(src.getName()) + "_id";
                                String srcTable = toSnakeCase(src.getName()) + "s";
                                colDefs.add("    " + srcCol + " BIGINT REFERENCES " + srcTable + "(id) ON DELETE CASCADE");
                            }
                        }
                    }
                }

                sb.append(String.join(",\n", colDefs)).append("\n);\n\n");

                // Índices para claves foráneas
                if (diagram.getRelations() != null) {
                    for (UmlRelationDto rel : diagram.getRelations()) {
                        if (cls.getId() != null && cls.getId().equals(rel.getTargetClassId())) {
                            UmlClassDto src = findClassById(diagram, rel.getSourceClassId());
                            if (src != null) {
                                String srcCol = toSnakeCase(src.getName()) + "_id";
                                String idxName = "idx_" + tableName + "_" + srcCol;
                                sb.append("CREATE INDEX IF NOT EXISTS ").append(idxName)
                                        .append(" ON ").append(tableName).append(" (").append(srcCol).append(");\n");
                            }
                        }
                    }
                }

                sb.append("\n");
            }
        }

        return sb.toString();
    }

    private UmlClassDto findClassById(DiagramDto diagram, String id) {
        if (diagram == null || diagram.getClasses() == null || id == null) return null;
        return diagram.getClasses().stream().filter(c -> id.equals(c.getId())).findFirst().orElse(null);
    }

    private String mapToPgType(String type) {
        if (type == null) return "VARCHAR(255)";
        return switch (type.trim().toLowerCase()) {
            case "int", "integer" -> "INTEGER";
            case "long", "bigint" -> "BIGSERIAL";
            case "double", "float", "decimal", "numeric" -> "NUMERIC(12,2)";
            case "bool", "boolean" -> "BOOLEAN DEFAULT true";
            case "date" -> "DATE";
            case "datetime", "timestamp", "localdatetime" -> "TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP";
            default -> "VARCHAR(255)";
        };
    }

    private String toSnakeCase(String str) {
        if (str == null) return "";
        return str.replaceAll("([a-z])([A-Z]+)", "$1_$2").toLowerCase();
    }
}
