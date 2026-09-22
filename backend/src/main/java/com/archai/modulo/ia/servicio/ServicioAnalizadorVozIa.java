package com.archai.modulo.ia.servicio;

import com.archai.modulo.diagrama.dto.PositionDto;
import com.archai.modulo.diagrama.dto.UmlAttributeDto;
import com.archai.modulo.diagrama.dto.UmlClassDto;
import com.archai.modulo.diagrama.dto.UmlRelationDto;
import com.archai.modulo.ia.dto.VoiceParseRequestDto;
import com.archai.modulo.ia.dto.VoiceParseResponseDto;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ServicioAnalizadorVozIa {

    public VoiceParseResponseDto parseCommand(VoiceParseRequestDto request) {
        if (request == null || request.getCommand() == null || request.getCommand().trim().isEmpty()) {
            return VoiceParseResponseDto.builder()
                    .success(false)
                    .action("UNKNOWN")
                    .rawCommand("")
                    .message("El comando de voz no contiene texto audible.")
                    .build();
        }

        String cmd = request.getCommand().trim().toLowerCase();

        if (cmd.contains("clase") || cmd.contains("entidad") || cmd.contains("tabla")) {
            return parseCreateClass(cmd);
        }

        if (cmd.contains("atributo") || cmd.contains("campo") || cmd.contains("columna")) {
            return parseAddAttribute(cmd);
        }

        if (cmd.contains("relaciona") || cmd.contains("asocia") || cmd.contains("hereda") || cmd.contains("compone")) {
            return parseAddRelation(cmd);
        }

        return VoiceParseResponseDto.builder()
                .success(false)
                .action("UNKNOWN")
                .rawCommand(request.getCommand())
                .message("No se reconoció la instrucción CASE. Intenta decir: 'Crea la clase Paciente' o 'Agrega atributo edad Integer'")
                .build();
    }

    private VoiceParseResponseDto parseCreateClass(String cmd) {
        Pattern pattern = Pattern.compile("(?:crea|crear|agrega|agregar|nueva)?\\s*(?:la)?\\s*(?:clase|entidad|tabla)\\s+([a-zA-Z0-9_]+)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(cmd);

        String className = "NuevaClase";
        if (matcher.find()) {
            className = capitalize(matcher.group(1));
        }

        List<UmlAttributeDto> attributes = new ArrayList<>();
        attributes.add(UmlAttributeDto.builder()
                .id("attr-" + UUID.randomUUID())
                .name("id")
                .type("Long")
                .visibility("+")
                .isPrimaryKey(true)
                .isNullable(false)
                .build());

        // Detectar atributos: "con atributo precio tipo Double", "con nombre String", "y fecha LocalDate"
        Pattern attrPattern = Pattern.compile("(?:(?:con\\s+)?(?:atributos?|campos?|columnas?)|y|,|\\s+)\\s+([a-zA-Z0-9_]+)(?:\\s+(?:(?:de\\s+)?tipo\\s+)?(string|int|integer|long|double|float|boolean|date|localdatetime))?", Pattern.CASE_INSENSITIVE);
        Matcher attrMatcher = attrPattern.matcher(cmd);
        while (attrMatcher.find()) {
            String attrName = attrMatcher.group(1);
            if (attrName == null) continue;
            String lowerName = attrName.toLowerCase();
            if ("la".equals(lowerName) || "el".equals(lowerName) || "clase".equals(lowerName) ||
                "entidad".equals(lowerName) || "tabla".equals(lowerName) || "con".equals(lowerName) ||
                "tipo".equals(lowerName) || "de".equals(lowerName) || "un".equals(lowerName) || "una".equals(lowerName) ||
                className.equalsIgnoreCase(attrName)) {
                continue;
            }
            String rawType = attrMatcher.group(2);
            String attrType = "String";
            if (rawType != null) {
                if ("int".equalsIgnoreCase(rawType)) {
                    attrType = "Integer";
                } else if ("float".equalsIgnoreCase(rawType)) {
                    attrType = "Double";
                } else {
                    attrType = capitalize(rawType);
                }
            } else {
                // Inferencia inteligente según nombre
                if (lowerName.contains("precio") || lowerName.contains("monto") || lowerName.contains("total") || lowerName.contains("costo") || lowerName.contains("saldo")) {
                    attrType = "Double";
                } else if (lowerName.contains("edad") || lowerName.contains("cantidad") || lowerName.contains("stock") || lowerName.contains("numero")) {
                    attrType = "Integer";
                } else if (lowerName.contains("fecha") || lowerName.contains("nacimiento")) {
                    attrType = "LocalDate";
                } else if (lowerName.contains("hora") || lowerName.contains("tiempo")) {
                    attrType = "LocalDateTime";
                } else if (lowerName.contains("activo") || lowerName.contains("estado") || lowerName.contains("habilitado")) {
                    attrType = "Boolean";
                } else if ("id".equals(lowerName) || lowerName.contains("identificador")) {
                    continue; // Ya se agregó como clave primaria
                }
            }
            attributes.add(UmlAttributeDto.builder()
                    .id("attr-" + UUID.randomUUID())
                    .name(attrName)
                    .type(attrType)
                    .visibility("+")
                    .isPrimaryKey(false)
                    .isNullable(false)
                    .build());
        }

        UmlClassDto created = UmlClassDto.builder()
                .id("cls-" + UUID.randomUUID())
                .name(className)
                .stereotype("Entity")
                .position(new PositionDto(250.0, 200.0))
                .attributes(attributes)
                .methods(new ArrayList<>())
                .build();

        return VoiceParseResponseDto.builder()
                .success(true)
                .action("CREATE_CLASS")
                .rawCommand(cmd)
                .createdClass(created)
                .message("Clase '" + className + "' construida con éxito vía Asistente de Voz IA.")
                .build();
    }

    private VoiceParseResponseDto parseAddAttribute(String cmd) {
        Pattern pattern = Pattern.compile("(?:agrega|agregar|nuevo|poner)?\\s*(?:el)?\\s*(?:atributo|campo|columna)\\s+([a-zA-Z0-9_]+)(?:\\s+(?:(?:de\\s+)?tipo\\s+)?(string|int|integer|long|double|float|boolean|date|localdatetime))?", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(cmd);

        String attrName = "nuevoCampo";
        String attrType = "String";

        if (matcher.find()) {
            attrName = matcher.group(1);
            if (matcher.group(2) != null) {
                attrType = capitalize(matcher.group(2));
            }
        }

        // Buscar clase destino (ej: "a la clase Producto", "en Producto")
        String targetClass = null;
        Pattern targetPattern = Pattern.compile("(?:a|en|para)\\s+(?:la\\s+clase\\s+|la\\s+entidad\\s+)?([a-zA-Z0-9_]+)", Pattern.CASE_INSENSITIVE);
        Matcher targetMatcher = targetPattern.matcher(cmd);
        if (targetMatcher.find()) {
            targetClass = capitalize(targetMatcher.group(1));
        }

        UmlAttributeDto attribute = UmlAttributeDto.builder()
                .id("attr-" + UUID.randomUUID())
                .name(attrName)
                .type(attrType)
                .visibility("+")
                .isPrimaryKey(false)
                .isNullable(false)
                .build();

        return VoiceParseResponseDto.builder()
                .success(true)
                .action("ADD_ATTRIBUTE")
                .rawCommand(cmd)
                .createdAttribute(attribute)
                .targetClassName(targetClass)
                .message("Atributo '" + attrName + " (" + attrType + ")' creado" + (targetClass != null ? " para la clase '" + targetClass + "'" : "") + ".")
                .build();
    }

    private VoiceParseResponseDto parseAddRelation(String cmd) {
        String type = "ASSOCIATION_1_N";
        if (cmd.contains("muchos a muchos")) type = "ASSOCIATION_N_M";
        if (cmd.contains("uno a uno")) type = "ASSOCIATION_1_1";
        if (cmd.contains("hereda") || cmd.contains("herencia")) type = "INHERITANCE";
        if (cmd.contains("compone") || cmd.contains("composicion")) type = "COMPOSITION";

        UmlRelationDto relation = UmlRelationDto.builder()
                .id("rel-" + UUID.randomUUID())
                .type(type)
                .sourceMultiplicity("1")
                .targetMultiplicity(type.equals("ASSOCIATION_1_N") ? "0..*" : "1")
                .build();

        return VoiceParseResponseDto.builder()
                .success(true)
                .action("ADD_RELATION")
                .rawCommand(cmd)
                .createdRelation(relation)
                .message("Relación (" + type + ") interpretada.")
                .build();
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }
}
