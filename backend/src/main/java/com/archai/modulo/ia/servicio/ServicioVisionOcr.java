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

    @Value("${archai.ia.gemini-model:gemini-2.5-flash}")
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
                      "stereotype": "Entity",
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
                      "type": "ASSOCIATION_1_N|ASSOCIATION_1_1|ASSOCIATION_N_M|COMPOSITION|AGGREGATION|INHERITANCE",
                      "sourceMultiplicity": "1|0..1|1..*|0..*|0..3|etc",
                      "targetMultiplicity": "1|0..1|1..*|0..*|0..3|etc",
                      "label": "rol o nombre si existe"
                    }
                  ]
                }
                Reglas obligatorias:
                1. Devuelve exclusivamente el JSON sin código markdown, sin backticks y sin explicaciones.
                2. Extrae todas las clases visibles con sus nombres exactos en PascalCase.
                3. Por cada clase, extrae todos los atributos tipados. Si un atributo es identificador o clave primaria (+identificador, id, numSocio, etc.), marca isPrimaryKey: true.
                4. Extrae todos los métodos u operaciones visibles (+devolver(), +prestar(), +calcularFechaFin(), etc.).
                5. Identifica todas las relaciones y multiplicidades indicadas.
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

            String modelo = (geminiModel != null && !geminiModel.isBlank()) ? geminiModel.trim() : "gemini-2.5-flash";
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

        JsonNode classesNode = node.path("classes");
        if (classesNode.isArray()) {
            int idx = 0;
            for (JsonNode cNode : classesNode) {
                String rawName = cNode.path("name").asText("Clase" + (idx + 1)).trim();
                String name = sanitizeClassName(rawName);
                String classId = "cls-" + UUID.randomUUID().toString().substring(0, 8);
                nameToId.put(name.toLowerCase(), classId);
                nameToId.put(rawName.toLowerCase(), classId);

                // Attributes
                List<UmlAttributeDto> attrs = new ArrayList<>();
                JsonNode attrsNode = cNode.path("attributes");
                boolean hasPk = false;
                if (attrsNode.isArray()) {
                    int attrIdx = 0;
                    for (JsonNode aNode : attrsNode) {
                        String attrName = aNode.path("name").asText("attr" + attrIdx).trim();
                        String attrType = normalizeAttrType(aNode.path("type").asText("String"));
                        String visibility = normalizeVisibility(aNode.path("visibility").asText("+"));
                        boolean isPk = aNode.path("isPrimaryKey").asBoolean(false);
                        if (!hasPk && isPkCandidate(attrName, isPk)) {
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

                // Garantizar al menos una clave primaria
                if (!hasPk) {
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
                        .stereotype(cNode.path("stereotype").asText("Entity"))
                        .position(new PositionDto(posX, posY))
                        .attributes(attrs)
                        .methods(methods)
                        .build());
                idx++;
            }
        }

        // Relations
        List<UmlRelationDto> relaciones = new ArrayList<>();
        JsonNode relationsNode = node.path("relations");
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

                    relaciones.add(UmlRelationDto.builder()
                            .id("rel-" + UUID.randomUUID().toString().substring(0, 8))
                            .sourceClassId(srcId)
                            .targetClassId(tgtId)
                            .type(relType)
                            .sourceMultiplicity(srcMult.isEmpty() ? "1" : srcMult)
                            .targetMultiplicity(tgtMult.isEmpty() ? "1..*" : tgtMult)
                            .sourceRole(label)
                            .targetRole("")
                            .build());
                }
            }
        }

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