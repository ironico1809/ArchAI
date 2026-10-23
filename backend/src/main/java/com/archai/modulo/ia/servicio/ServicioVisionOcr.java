package com.archai.modulo.ia.servicio;

import com.archai.comun.excepcion.ExcepcionNegocio;
import com.archai.modulo.diagrama.dto.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

/**
 * CU-07 — Digitalización de Pizarra por Foto (Visión Artificial Multimodal + Heurística Offline).
 * 
 * Arquitectura híbrida inteligente:
 *   1. Motor Primario (Online): Google Gemini 2.5 Flash Vision.
 *      - Analiza la imagen multimodalmente.
 *      - Reconoce nombres exactos de clases, atributos tipados, visibilidades (+, -, #),
 *        claves primarias (@Id), métodos con tipos de retorno y relaciones con multiplicidades.
 *   2. Motor Secundario (Offline / Fallback): Visión Heurística de Computer Vision local.
 *      - Umbral de Otsu + Detección de componentes conectados (BFS).
 *      - Si no hay conexión o no hay API key, garantiza operatividad continua sin caídas.
 */
@Service
public class ServicioVisionOcr {

    private static final Logger log = LoggerFactory.getLogger(ServicioVisionOcr.class);

    private static final int MAX_ANCHO = 800;
    private static final int MIN_COMPONENTE_AREA = 350;
    private static final int MAX_COMPONENTES = 6;

    private final ObjectMapper objectMapper;

    @Value("${archai.ia.gemini-api-key:}")
    private String geminiApiKey;

    @Value("${archai.ia.gemini-model:gemini-3.8-flash}")
    private String geminiModel;

    public ServicioVisionOcr(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
    }

    public DiagramDto procesarImagenPizarra(MultipartFile archivo, String titulo) {
        if (archivo == null || archivo.isEmpty()) {
            throw new ExcepcionNegocio("Debe subir una fotografía de la pizarra (JPEG/PNG).");
        }

        byte[] bytes;
        try {
            bytes = archivo.getBytes();
        } catch (IOException e) {
            throw new ExcepcionNegocio("No se pudo leer el archivo de imagen.");
        }

        BufferedImage original;
        try {
            original = ImageIO.read(new ByteArrayInputStream(bytes));
        } catch (IOException e) {
            throw new ExcepcionNegocio("No se pudo decodificar la imagen. Formato no soportado (use JPEG o PNG).");
        }

        if (original == null) {
            throw new ExcepcionNegocio("La imagen está vacía o corrupta. Verifique el archivo e intente de nuevo.");
        }

        // Verificación rápida local de trazos: si la imagen está 100% en blanco, rechazar de inmediato
        BufferedImage gris = aEscalaDeGrises(redimensionar(original));
        int[][] binaria = binarizarOtsu(gris);
        List<Componente> componentes = detectarComponentes(binaria, gris.getWidth(), gris.getHeight());

        if (componentes.isEmpty()) {
            throw new ExcepcionNegocio("No se detectaron trazos legibles en la imagen. Mejore la iluminación o acerque la cámara.");
        }

        // 1. Motor Primario: Intentar con Gemini 2.5 Flash Vision
        DiagramDto resultadoVision = procesarConGeminiVision(original, bytes, archivo.getContentType(), titulo);
        if (resultadoVision != null && resultadoVision.getClasses() != null && !resultadoVision.getClasses().isEmpty()) {
            log.info("Diagrama extraído con éxito por Gemini Vision: {} clases, {} relaciones.",
                    resultadoVision.getClasses().size(), resultadoVision.getRelations().size());
            return resultadoVision;
        }

        // 2. Motor Secundario: Fallback heurístico offline (Otsu + BFS)
        log.info("Aplicando fallback heurístico offline (Otsu + BFS)...");
        return procesarHeuristicoConComponentes(componentes, titulo);
    }

    private byte[] prepararImagenParaGemini(BufferedImage original, byte[] fallbackBytes) {
        if (original == null) return fallbackBytes;
        try {
            BufferedImage escalada = redimensionar(original);
            BufferedImage rgb = new BufferedImage(escalada.getWidth(), escalada.getHeight(), BufferedImage.TYPE_INT_RGB);
            var g = rgb.createGraphics();
            g.drawImage(escalada, 0, 0, java.awt.Color.WHITE, null);
            g.dispose();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(rgb, "jpg", baos);
            byte[] res = baos.toByteArray();
            return (res != null && res.length > 0) ? res : fallbackBytes;
        } catch (Exception e) {
            log.warn("No se pudo comprimir la imagen para Gemini, enviando original: {}", e.getMessage());
            return fallbackBytes;
        }
    }

    /**
     * Motor Primario: Llama a la API multimodal de Gemini 2.5 Flash para extraer
     * el AST completo del diagrama UML a partir de la imagen en base64.
     */
    private DiagramDto procesarConGeminiVision(BufferedImage original, byte[] fallbackBytes, String mimeType, String titulo) {
        String apiKey = obtenerApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            log.info("GEMINI_API_KEY no detectada ni en propiedades ni en variables de entorno. Omitiendo visión multimodal.");
            return null;
        }

        try {
            log.info("Iniciando procesamiento de visión multimodal con Gemini 2.5 Flash...");
            byte[] bytesAEnviar = prepararImagenParaGemini(original, fallbackBytes);
            String base64Image = Base64.getEncoder().encodeToString(bytesAEnviar);
            String effectiveMime = "image/jpeg";
            String prompt = """
                Analiza esta imagen que contiene un diagrama de clases UML (pizarra, boceto o captura digital) y extrae exhaustivamente todas las clases, atributos tipados, métodos, visibilidades y relaciones en formato JSON estricto con esta estructura:
                {
                  "title": "Nombre descriptivo del diagrama",
                  "classes": [
                    {
                      "name": "NombreClasePascalCase",
                      "stereotype": "Entity|AssociationClass|Interface|Abstract",
                      "attributes": [
                        { "name": "nombreCampo", "type": "Long|String|Integer|Double|Boolean|LocalDate|LocalDateTime", "visibility": "+|-|#", "isPrimaryKey": boolean }
                      ],
                      "methods": [
                        { "name": "nombreMetodo", "returnType": "void|String|Boolean|Integer|Double|LocalDate", "visibility": "+|-|#" }
                      ],
                      "position": { "x": 100, "y": 100 }
                    }
                  ],
                  "relations": [
                    {
                      "sourceClassName": "ClaseOrigen",
                      "targetClassName": "ClaseDestino",
                      "type": "ASSOCIATION_1_N|ASSOCIATION_1_1|ASSOCIATION_N_M|COMPOSITION|AGGREGATION|INHERITANCE|ASSOCIATION_CLASS",
                      "sourceMultiplicity": "1|0..1|1..*|0..*|0..3|*|etc",
                      "targetMultiplicity": "1|0..1|1..*|0..*|0..3|*|etc",
                      "label": "rol o nombre si existe",
                      "associationClassName": "NombreClaseAsociativaSiExiste"
                    }
                  ]
                }
                Reglas obligatorias:
                1. Devuelve exclusivamente el JSON sin código markdown, sin backticks y sin explicaciones.
                2. Extrae todas las clases visibles con sus nombres exactos en PascalCase.
                3. REGLA ESTRICTA DE CLASES ASOCIATIVAS (AssociationClass) EN RELACIONES:
                   Si una clase está conectada mediante una línea punteada o discontinua a una línea de relación entre dos entidades maestras A y B (ej. DetalleVenta entre Venta y Producto):
                   - Asigna a dicha clase "stereotype": "AssociationClass".
                   - Define UNA ÚNICA relación entre las dos entidades maestras A y B (con tipo "ASSOCIATION_N_M" o según las multiplicidades dibujadas) indicando "associationClassName": "<NombreClaseAsociativa>".
                   - ESTÁ TERMINANTEMENTE PROHIBIDO generar relaciones directas separadas entre A y la clase asociativa, o entre B y la clase asociativa. La única relación es entre A y B vinculada por "associationClassName" (la conexión en T punteada hacia la clase asociativa se genera de manera automática).
                4. REGLA UNIVERSAL DE CLASES ASOCIATIVAS (AssociationClass): Cualquier clase que en el diagrama esté unida mediante una línea discontinua a una relación entre dos entidades (ejemplos en cualquier dominio: Detalle en ventas, Inscripcion o Matricula en educación, Cita o Consulta en salud, Asignacion en proyectos, Reserva en hotelería/vuelos, Suministro en logística, etc.) es una CLASE ASOCIATIVA. En UML 2.5, una clase asociativa NO lleva clave primaria artificial ("id"). Extrae ÚNICAMENTE los atributos que estén explícitamente dibujados o escritos dentro de dicha caja con isPrimaryKey: false. NUNCA inventes ni agregues un campo "id" a una clase asociativa si no aparece dibujado.
                5. Para las demás entidades estándar, si un atributo es identificador o clave primaria (+identificador, id, numSocio, etc.), marca isPrimaryKey: true. Si una clase normal no tiene identificador visible, no inventes campos innecesarios.
                6. Extrae todos los métodos u operaciones visibles (+devolver(), +prestar(), +calcularFechaFin(), etc.). Si una clase no tiene métodos dibujados en la pizarra, su lista "methods" debe ser una lista vacía [].
                7. Identifica todas las relaciones y multiplicidades indicadas.
                """;

            String promptJsonEscaped = objectMapper.writeValueAsString(prompt);

            String requestBody = "{\n"
                    + "  \"contents\": [{\n"
                    + "    \"parts\": [\n"
                    + "      { \"text\": " + promptJsonEscaped + " },\n"
                    + "      { \"inline_data\": { \"mime_type\": \"" + effectiveMime + "\", \"data\": \"" + base64Image + "\" } }\n"
                    + "    ]\n"
                    + "  }],\n"
                    + "  \"generationConfig\": { \"response_mime_type\": \"application/json\" }\n"
                    + "}";

            String modelo = (geminiModel != null && !geminiModel.isBlank()) ? geminiModel.trim() : "gemini-3.8-flash";
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelo + ":generateContent?key=" + apiKey;

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(15))
                    .build();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                    .timeout(Duration.ofSeconds(50))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() != 200) {
                log.warn("Gemini Vision devolvió código HTTP {}: {}", response.statusCode(), response.body());
                return null;
            }

            JsonNode rootNode = objectMapper.readTree(response.body());
            JsonNode textPart = rootNode.path("candidates").path(0).path("content").path("parts").path(0).path("text");
            if (textPart.isMissingNode() || textPart.asText().isBlank()) {
                return null;
            }

            String geminiJson = textPart.asText().trim();
            if (geminiJson.startsWith("```json")) {
                geminiJson = geminiJson.substring(7);
            }
            if (geminiJson.startsWith("```")) {
                geminiJson = geminiJson.substring(3);
            }
            if (geminiJson.endsWith("```")) {
                geminiJson = geminiJson.substring(0, geminiJson.length() - 3);
            }
            geminiJson = geminiJson.trim();

            JsonNode parsed = objectMapper.readTree(geminiJson);
            return mapearJsonADiagramDto(parsed, titulo);
        } catch (Exception e) {
            log.error("Error al procesar imagen con Gemini Vision:", e);
            return null;
        }
    }

    private DiagramDto mapearJsonADiagramDto(JsonNode node, String tituloSolicitado) {
        String diagramTitle = (tituloSolicitado != null && !tituloSolicitado.isBlank())
                ? tituloSolicitado.trim()
                : node.path("title").asText("Diagrama Extraído por Visión IA");

        List<UmlClassDto> clases = new ArrayList<>();
        Map<String, String> nameToId = new HashMap<>();

        // 1. Recolectar nombres de clases asociativas referenciadas en las relaciones (cualquier dominio)
        JsonNode relationsNode = node.path("relations");
        Set<String> assocClassNamesFromRelations = new HashSet<>();
        if (relationsNode.isArray()) {
            for (JsonNode rNode : relationsNode) {
                String acn = rNode.path("associationClassName").asText("").trim().toLowerCase();
                if (!acn.isEmpty()) {
                    assocClassNamesFromRelations.add(acn);
                }
                String rType = rNode.path("type").asText("").toUpperCase();
                if (rType.contains("ASSOCIATION_CLASS") || rType.contains("ASOCIATIVA")) {
                    String lbl = rNode.path("label").asText("").trim().toLowerCase();
                    if (!lbl.isEmpty()) assocClassNamesFromRelations.add(lbl);
                    String tgt = rNode.path("targetClassName").asText("").trim().toLowerCase();
                    if (!tgt.isEmpty()) assocClassNamesFromRelations.add(tgt);
                }
            }
        }

        JsonNode classesNode = node.path("classes");
        if (classesNode.isArray()) {
            int idx = 0;
            for (JsonNode cNode : classesNode) {
                String rawName = cNode.path("name").asText("Clase" + (idx + 1)).trim();
                String name = sanitizeClassName(rawName);
                String classId = "cls-" + UUID.randomUUID().toString().substring(0, 8);
                nameToId.put(name.toLowerCase(), classId);
                nameToId.put(rawName.toLowerCase(), classId);

                String rawStereotype = cNode.path("stereotype").asText("Entity").trim();
                boolean isAssociationClass = "AssociationClass".equalsIgnoreCase(rawStereotype)
                        || "association_class".equalsIgnoreCase(rawStereotype)
                        || rawStereotype.toLowerCase().contains("association")
                        || rawStereotype.toLowerCase().contains("asociativa")
                        || assocClassNamesFromRelations.contains(name.toLowerCase())
                        || assocClassNamesFromRelations.contains(rawName.toLowerCase())
                        || name.toLowerCase().endsWith("asociativa")
                        || rawName.toLowerCase().endsWith("asociativa")
                        || name.toLowerCase().contains("detalle")
                        || rawName.toLowerCase().contains("detalle")
                        || name.toLowerCase().contains("linea")
                        || name.toLowerCase().contains("item")
                        || name.toLowerCase().contains("intermedia")
                        || name.toLowerCase().contains("inscripcion")
                        || name.toLowerCase().contains("matricula")
                        || name.toLowerCase().contains("reserva");

                // Attributes
                List<UmlAttributeDto> attrs = new ArrayList<>();
                JsonNode attrsNode = cNode.path("attributes");
                boolean hasPk = false;
                if (attrsNode.isArray()) {
                    int attrIdx = 0;
                    for (JsonNode aNode : attrsNode) {
                        String attrName = aNode.path("name").asText("attr" + attrIdx).trim();

                        // Si es clase asociativa, omitir cualquier 'id' artificial
                        if (isAssociationClass && attrName.equalsIgnoreCase("id")) {
                            continue;
                        }

                        String attrType = normalizeAttrType(aNode.path("type").asText("String"));
                        String visibility = normalizeVisibility(aNode.path("visibility").asText("+"));
                        boolean isPk = !isAssociationClass && aNode.path("isPrimaryKey").asBoolean(false);
                        if (!isAssociationClass && !hasPk && isPkCandidate(attrName, isPk)) {
                            isPk = true;
                            hasPk = true;
                        }

                        attrs.add(UmlAttributeDto.builder()
                                .id("attr-" + classId + "-" + attrIdx++)
                                .name(attrName)
                                .type(attrType)
                                .visibility(visibility)
                                .isPrimaryKey(isPk)
                                .isNullable(!isPk)
                                .build());
                    }
                }

                // Garantizar al menos una clave primaria SOLO en entidades normales
                if (!hasPk && !isAssociationClass) {
                    if (!attrs.isEmpty()) {
                        attrs.get(0).setPrimaryKey(true);
                        attrs.get(0).setNullable(false);
                    } else {
                        attrs.add(UmlAttributeDto.builder()
                                .id("attr-" + classId + "-0")
                                .name("id")
                                .type("Long")
                                .visibility("+")
                                .isPrimaryKey(true)
                                .isNullable(false)
                                .build());
                    }
                }

                // Methods
                List<UmlMethodDto> methods = new ArrayList<>();
                JsonNode methodsNode = cNode.path("methods");
                if (methodsNode.isArray()) {
                    int mIdx = 0;
                    for (JsonNode mNode : methodsNode) {
                        String mName = mNode.path("name").asText("metodo" + mIdx).trim();
                        String retType = normalizeAttrType(mNode.path("returnType").asText("void"));
                        String visibility = normalizeVisibility(mNode.path("visibility").asText("+"));
                        methods.add(UmlMethodDto.builder()
                                .id("met-" + classId + "-" + mIdx++)
                                .name(mName)
                                .returnType(retType)
                                .visibility(visibility)
                                .parameters(new ArrayList<>())
                                .build());
                    }
                }

                // Position
                double posX = cNode.path("position").path("x").asDouble(100.0 + (idx % 3) * 320.0);
                double posY = cNode.path("position").path("y").asDouble(120.0 + (idx / 3) * 260.0);

                clases.add(UmlClassDto.builder()
                        .id(classId)
                        .name(name)
                        .stereotype(isAssociationClass ? "AssociationClass" : rawStereotype)
                        .position(new PositionDto(posX, posY))
                        .attributes(attrs)
                        .methods(methods)
                        .build());
                idx++;
            }
        }

        // Relations
        List<UmlRelationDto> relaciones = new ArrayList<>();
        if (relationsNode.isArray()) {
            for (JsonNode rNode : relationsNode) {
                String srcName = rNode.path("sourceClassName").asText("").toLowerCase().trim();
                String tgtName = rNode.path("targetClassName").asText("").toLowerCase().trim();

                String srcId = nameToId.get(srcName);
                String tgtId = nameToId.get(tgtName);

                if (srcId != null && tgtId != null && !srcId.equals(tgtId)) {
                    String relType = normalizeRelationType(rNode.path("type").asText("ASSOCIATION_1_N"));
                    String srcMult = rNode.path("sourceMultiplicity").asText("1").trim();
                    String tgtMult = rNode.path("targetMultiplicity").asText("1..*").trim();
                    String label = rNode.path("label").asText("").trim();
                    String assocClassName = rNode.path("associationClassName").asText("").toLowerCase().trim();
                    String assocClassId = !assocClassName.isEmpty() ? nameToId.get(assocClassName) : null;

                    relaciones.add(UmlRelationDto.builder()
                            .id("rel-" + UUID.randomUUID().toString().substring(0, 8))
                            .sourceClassId(srcId)
                            .targetClassId(tgtId)
                            .type(relType)
                            .sourceMultiplicity(srcMult.isEmpty() ? "1" : srcMult)
                            .targetMultiplicity(tgtMult.isEmpty() ? "1..*" : tgtMult)
                            .sourceRole(label)
                            .targetRole("")
                            .associationClassId(assocClassId)
                            .build());
                }
            }
        }

        // UML 2.5 — Post-procesamiento estricto de Clases Asociativas:
        // Una clase asociativa SOLO debe estar conectada mediante el enlace perpendicular en T (associationClassId).
        // Se descartan de manera universal aristas binarias directas redundantes hacia las entidades asociadas.

        // 1. Identificar todas las clases asociativas
        Set<String> assocClassIds = new HashSet<>();
        for (UmlClassDto cls : clases) {
            if ("AssociationClass".equalsIgnoreCase(cls.getStereotype())) {
                assocClassIds.add(cls.getId());
            }
        }
        for (UmlRelationDto rel : relaciones) {
            if (rel.getAssociationClassId() != null && !rel.getAssociationClassId().isBlank()) {
                assocClassIds.add(rel.getAssociationClassId());
            }
        }

        // 2. Si la IA reconoció conexiones directas A -> C y B -> C pero omitió la relación directa A <-> B:
        // Sintetizar la relación A <-> B (ASSOCIATION_N_M) con associationClassId = C.id
        for (String acId : assocClassIds) {
            List<UmlRelationDto> directRelsToAc = new ArrayList<>();
            for (UmlRelationDto r : relaciones) {
                if ((acId.equals(r.getSourceClassId()) || acId.equals(r.getTargetClassId()))
                        && (r.getAssociationClassId() == null || r.getAssociationClassId().isBlank())) {
                    directRelsToAc.add(r);
                }
            }

            Set<String> connectedEntities = new LinkedHashSet<>();
            for (UmlRelationDto r : directRelsToAc) {
                String other = acId.equals(r.getSourceClassId()) ? r.getTargetClassId() : r.getSourceClassId();
                if (other != null && !other.equals(acId)) {
                    connectedEntities.add(other);
                }
            }

            if (connectedEntities.size() >= 2) {
                List<String> entityList = new ArrayList<>(connectedEntities);
                String entA = entityList.get(0);
                String entB = entityList.get(1);

                Optional<UmlRelationDto> existingDirect = relaciones.stream()
                        .filter(r -> (entA.equals(r.getSourceClassId()) && entB.equals(r.getTargetClassId())) ||
                                     (entB.equals(r.getSourceClassId()) && entA.equals(r.getTargetClassId())))
                        .findFirst();

                if (existingDirect.isPresent()) {
                    existingDirect.get().setAssociationClassId(acId);
                    existingDirect.get().setType("ASSOCIATION_N_M");
                } else {
                    UmlClassDto acCls = clases.stream().filter(c -> c.getId().equals(acId)).findFirst().orElse(null);
                    String acName = acCls != null ? acCls.getName() : "";
                    relaciones.add(UmlRelationDto.builder()
                            .id("rel-" + UUID.randomUUID().toString().substring(0, 8))
                            .sourceClassId(entA)
                            .targetClassId(entB)
                            .type("ASSOCIATION_N_M")
                            .sourceMultiplicity("*")
                            .targetMultiplicity("1..*")
                            .sourceRole(acName)
                            .targetRole("")
                            .associationClassId(acId)
                            .build());
                }
            }
        }

        // 3. Purga universal de aristas directas redundantes hacia cualquier clase asociativa activa
        Set<String> activeAssocClassIds = new HashSet<>();
        for (UmlRelationDto r : relaciones) {
            if (r.getAssociationClassId() != null && !r.getAssociationClassId().isBlank()) {
                activeAssocClassIds.add(r.getAssociationClassId());
            }
        }
        for (UmlClassDto c : clases) {
            if ("AssociationClass".equalsIgnoreCase(c.getStereotype())) {
                activeAssocClassIds.add(c.getId());
            }
        }

        relaciones.removeIf(r -> {
            boolean sourceIsAssoc = activeAssocClassIds.contains(r.getSourceClassId());
            boolean targetIsAssoc = activeAssocClassIds.contains(r.getTargetClassId());
            if (sourceIsAssoc || targetIsAssoc) {
                log.info("Descartando relación binaria redundante a clase asociativa: {} -> {}", r.getSourceClassId(), r.getTargetClassId());
                return true;
            }
            return false;
        });

        return DiagramDto.builder()
                .id("diag-vision-" + UUID.randomUUID().toString().substring(0, 8))
                .title(diagramTitle)
                .description("Diagrama extraído automáticamente con Visión Artificial Multimodal (Gemini 2.5 Flash). "
                        + clases.size() + " clases y " + relaciones.size() + " relaciones detectadas.")
                .classes(clases)
                .relations(relaciones)
                .build();
    }

    private String sanitizeClassName(String name) {
        if (name == null || name.isBlank()) return "Clase";
        String clean = name.replaceAll("[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_]", "");
        if (clean.isEmpty()) return "Clase";
        return Character.toUpperCase(clean.charAt(0)) + clean.substring(1);
    }

    private String normalizeAttrType(String raw) {
        if (raw == null || raw.isBlank()) return "String";
        String lower = raw.toLowerCase().trim();
        if (lower.equals("void")) return "void";
        if (lower.contains("long") || lower.contains("bigint")) return "Long";
        if (lower.contains("int") || lower.contains("entero")) return "Integer";
        if (lower.contains("double") || lower.contains("float") || lower.contains("decimal") || lower.contains("numeric")) return "Double";
        if (lower.contains("bool")) return "Boolean";
        if (lower.contains("date") || lower.contains("fecha")) return "LocalDate";
        if (lower.contains("time") || lower.contains("timestamp") || lower.contains("hora")) return "LocalDateTime";
        return "String";
    }

    private String normalizeVisibility(String raw) {
        if (raw == null || raw.isBlank()) return "+";
        String trim = raw.trim();
        if (trim.contains("-")) return "-";
        if (trim.contains("#")) return "#";
        return "+";
    }

    private boolean isPkCandidate(String name, boolean explicitPk) {
        if (explicitPk) return true;
        if (name == null) return false;
        String lower = name.toLowerCase();
        return lower.equals("id") || lower.equals("identificador") || lower.equals("codigo")
                || lower.contains("numsociio") || lower.contains("numsocio");
    }

    private String normalizeRelationType(String raw) {
        if (raw == null || raw.isBlank()) return "ASSOCIATION_1_N";
        String upper = raw.toUpperCase().trim();
        if (upper.contains("1_1") || upper.contains("1_0_1")) return "ASSOCIATION_1_1";
        if (upper.contains("N_M") || upper.contains("M_N")) return "ASSOCIATION_N_M";
        if (upper.contains("COMPOSITION")) return "COMPOSITION";
        if (upper.contains("AGGREGATION")) return "AGGREGATION";
        if (upper.contains("INHERITANCE") || upper.contains("HERENCIA")) return "INHERITANCE";
        return "ASSOCIATION_1_N";
    }

    private String obtenerApiKey() {
        if (geminiApiKey != null && !geminiApiKey.trim().isEmpty()) {
            return geminiApiKey.trim();
        }
        String sysProp = System.getProperty("GEMINI_API_KEY");
        if (sysProp != null && !sysProp.trim().isEmpty()) {
            return sysProp.trim();
        }
        String env = System.getenv("GEMINI_API_KEY");
        if (env != null && !env.trim().isEmpty()) {
            return env.trim();
        }
        String viteEnv = System.getenv("VITE_GEMINI_API_KEY");
        if (viteEnv != null && !viteEnv.trim().isEmpty()) {
            return viteEnv.trim();
        }
        String sysVite = System.getProperty("VITE_GEMINI_API_KEY");
        if (sysVite != null && !sysVite.trim().isEmpty()) {
            return sysVite.trim();
        }
        return leerClaveDesdeEnvLocal();
    }

    private String leerClaveDesdeEnvLocal() {
        List<java.nio.file.Path> rutas = List.of(
                java.nio.file.Path.of(".env"),
                java.nio.file.Path.of("backend", ".env"),
                java.nio.file.Path.of("..", "backend", ".env"),
                java.nio.file.Path.of("frontend", ".env"),
                java.nio.file.Path.of("..", "frontend", ".env")
        );
        for (java.nio.file.Path p : rutas) {
            try {
                if (java.nio.file.Files.exists(p)) {
                    List<String> lineas = java.nio.file.Files.readAllLines(p);
                    for (String l : lineas) {
                        String trim = l.trim();
                        if (trim.startsWith("GEMINI_API_KEY=") || trim.startsWith("VITE_GEMINI_API_KEY=")) {
                            String val = trim.substring(trim.indexOf('=') + 1).trim();
                            if (!val.isEmpty()) return val;
                        }
                    }
                }
            } catch (Exception ignored) {
            }
        }
        return null;
    }

    /**
     * Motor Secundario: Pipeline heurístico offline en caso de que Gemini no esté disponible.
     */
    private DiagramDto procesarHeuristicoConComponentes(List<Componente> componentes, String titulo) {
        List<UmlClassDto> clases = new ArrayList<>();
        List<UmlRelationDto> relaciones = new ArrayList<>();

        for (int i = 0; i < componentes.size(); i++) {
            Componente c = componentes.get(i);
            String nombreClase = "Entidad" + (char) ('A' + Math.min(i, 25));

            UmlClassDto clase = UmlClassDto.builder()
                    .id("ocr-cls-" + UUID.randomUUID())
                    .name(nombreClase)
                    .stereotype("Entity")
                    .position(new PositionDto((double) c.centroX, (double) c.centroY))
                    .attributes(List.of(
                            UmlAttributeDto.builder().id("ocr-" + i + "-1").name("id").type("Long").visibility("+").isPrimaryKey(true).isNullable(false).build(),
                            UmlAttributeDto.builder().id("ocr-" + i + "-2").name("descripcion").type("String").visibility("+").isPrimaryKey(false).isNullable(true).build()
                    ))
                    .methods(new ArrayList<>())
                    .build();
            clases.add(clase);
        }

        for (int i = 0; i + 1 < clases.size(); i++) {
            UmlClassDto origen = clases.get(i);
            UmlClassDto destino = clases.get(i + 1);
            relaciones.add(UmlRelationDto.builder()
                    .id("ocr-rel-" + UUID.randomUUID())
                    .sourceClassId(origen.getId())
                    .targetClassId(destino.getId())
                    .type("ASSOCIATION_1_N")
                    .sourceMultiplicity("1")
                    .targetMultiplicity("0..*")
                    .build());
        }

        String nombreTitulo = (titulo != null && !titulo.trim().isEmpty())
                ? titulo.trim()
                : "Diagrama Digitalizado de Pizarra (OCR)";

        return DiagramDto.builder()
                .id("diag-ocr-" + UUID.randomUUID())
                .title(nombreTitulo)
                .description("Digitalización por visión artificial heurística: " + clases.size()
                        + " cajas UML y " + relaciones.size() + " relaciones inferidas.")
                .classes(clases)
                .relations(relaciones)
                .build();
    }

    // ── Paso 2: Redimensionado proporcional ──────────────────────────────────
    private BufferedImage redimensionar(BufferedImage img) {
        int ancho = img.getWidth();
        int alto = img.getHeight();
        if (ancho <= MAX_ANCHO) {
            return img;
        }
        double escala = (double) MAX_ANCHO / ancho;
        int nuevoAlto = Math.max(1, (int) (alto * escala));
        BufferedImage escalada = new BufferedImage(MAX_ANCHO, nuevoAlto, BufferedImage.TYPE_INT_RGB);
        var g = escalada.createGraphics();
        g.drawImage(img, 0, 0, MAX_ANCHO, nuevoAlto, null);
        g.dispose();
        return escalada;
    }

    // ── Paso 3a: Escala de grises ─────────────────────────────────────────────
    private BufferedImage aEscalaDeGrises(BufferedImage img) {
        BufferedImage gris = new BufferedImage(img.getWidth(), img.getHeight(), BufferedImage.TYPE_BYTE_GRAY);
        var g = gris.createGraphics();
        g.drawImage(img, 0, 0, null);
        g.dispose();
        return gris;
    }

    // ── Paso 3b: Binarización automática (umbral de Otsu) ────────────────────
    private int[][] binarizarOtsu(BufferedImage gris) {
        int w = gris.getWidth();
        int h = gris.getHeight();
        int[] histograma = new int[256];
        for (int y = 0; y < h; y++) {
            for (int x = 0; x < w; x++) {
                int grisValor = gris.getRGB(x, y) & 0xFF;
                histograma[grisValor]++;
            }
        }

        int totalPixeles = w * h;
        double sumaTotal = 0;
        for (int i = 0; i < 256; i++) {
            sumaTotal += (double) i * histograma[i];
        }

        double mejorVarianza = -1;
        int umbral = 128;
        double sumaFondo = 0;
        int pesosFondo = 0;

        for (int t = 0; t < 256; t++) {
            pesosFondo += histograma[t];
            if (pesosFondo == 0) continue;
            int pesosPrimerPlano = totalPixeles - pesosFondo;
            if (pesosPrimerPlano == 0) break;

            sumaFondo += (double) t * histograma[t];
            double mediaFondo = sumaFondo / pesosFondo;
            double mediaPrimerPlano = (sumaTotal - sumaFondo) / pesosPrimerPlano;

            double varianzaEntreClases = (double) pesosFondo * pesosPrimerPlano
                    * (mediaFondo - mediaPrimerPlano) * (mediaFondo - mediaPrimerPlano);
            if (varianzaEntreClases > mejorVarianza) {
                mejorVarianza = varianzaEntreClases;
                umbral = t;
            }
        }

        int[][] binaria = new int[h][w];
        for (int y = 0; y < h; y++) {
            for (int x = 0; x < w; x++) {
                int valor = gris.getRGB(x, y) & 0xFF;
                binaria[y][x] = (valor <= umbral) ? 1 : 0;
            }
        }
        return binaria;
    }

    // ── Paso 4 y 5: Detección de componentes conectados (BFS) ────────────────
    private List<Componente> detectarComponentes(int[][] binaria, int w, int h) {
        boolean[][] visitado = new boolean[h][w];
        List<Componente> resultado = new ArrayList<>();

        int[] colaX = new int[w * h];
        int[] colaY = new int[w * h];

        for (int y = 0; y < h; y++) {
            for (int x = 0; x < w; x++) {
                if (binaria[y][x] == 1 && !visitado[y][x]) {
                    int head = 0, tail = 0;
                    colaX[tail] = x;
                    colaY[tail] = y;
                    tail++;
                    visitado[y][x] = true;

                    int minX = x, maxX = x, minY = y, maxY = y;
                    int area = 0;

                    while (head < tail) {
                        int cx = colaX[head];
                        int cy = colaY[head];
                        head++;
                        area++;

                        if (cx < minX) minX = cx;
                        if (cx > maxX) maxX = cx;
                        if (cy < minY) minY = cy;
                        if (cy > maxY) maxY = cy;

                        for (int dy = -1; dy <= 1; dy++) {
                            for (int dx = -1; dx <= 1; dx++) {
                                int nx = cx + dx;
                                int ny = cy + dy;
                                if (nx >= 0 && nx < w && ny >= 0 && ny < h
                                        && binaria[ny][nx] == 1 && !visitado[ny][nx]) {
                                    visitado[ny][nx] = true;
                                    colaX[tail] = nx;
                                    colaY[tail] = ny;
                                    tail++;
                                }
                            }
                        }
                    }

                    int anchoComp = maxX - minX + 1;
                    int altoComp = maxY - minY + 1;
                    if (area >= MIN_COMPONENTE_AREA && anchoComp >= 18 && altoComp >= 12) {
                        Componente componente = new Componente();
                        componente.minX = minX;
                        componente.maxX = maxX;
                        componente.minY = minY;
                        componente.maxY = maxY;
                        componente.area = area;
                        componente.centroX = (minX + maxX) / 2;
                        componente.centroY = (minY + maxY) / 2;
                        resultado.add(componente);
                    }
                }
            }
        }

        resultado.sort(Comparator.comparingInt((Componente c) -> c.centroY).thenComparingInt(c -> c.centroX));

        return resultado.size() > MAX_COMPONENTES
                ? new ArrayList<>(resultado.subList(0, MAX_COMPONENTES))
                : resultado;
    }

    private static class Componente {
        int minX, maxX, minY, maxY;
        int area;
        int centroX;
        int centroY;
    }
}