package com.archai.modulo.diagrama.servicio;

import com.archai.modulo.diagrama.dto.DiagramDto;
import com.archai.modulo.diagrama.dto.UmlClassDto;
import com.archai.modulo.diagrama.dto.UmlRelationDto;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ServicioAuditoriaArquitectura {

    public Map<String, Object> auditarMadurez(DiagramDto diagram) {
        Map<String, Object> resultado = new LinkedHashMap<>();
        List<UmlClassDto> clases = diagram.getClasses() != null ? diagram.getClasses() : Collections.emptyList();
        List<UmlRelationDto> relaciones = diagram.getRelations() != null ? diagram.getRelations() : Collections.emptyList();

        if (clases.isEmpty()) {
            resultado.put("puntuacion", 0);
            resultado.put("nivel", "INICIAL");
            resultado.put("totalClases", 0);
            resultado.put("alertas", List.of("El modelo no contiene clases definidas todavía."));
            resultado.put("recomendaciones", List.of("Cree su primera entidad o cargue una plantilla de dominio."));
            return resultado;
        }

        int totalPuntos = 0;
        List<String> alertas = new ArrayList<>();
        List<String> fortalezas = new ArrayList<>();
        List<String> sugerencias = new ArrayList<>();
        Map<String, Integer> puntuacionPorClase = new HashMap<>();

        long clasesConPk = clases.stream().filter(c -> c.getAttributes() != null &&
                c.getAttributes().stream().anyMatch(a -> a.isPrimaryKey() || "id".equalsIgnoreCase(a.getName()))).count();

        long clasesConMetodos = clases.stream().filter(c -> c.getMethods() != null && !c.getMethods().isEmpty()).count();

        // 1. Evaluación de Persistencia (25%)
        if (clasesConPk == clases.size()) {
            totalPuntos += 25;
            fortalezas.add("El 100% de las clases tienen clave primaria PK para persistencia JPA.");
        } else {
            int puntosPk = (int) Math.round(25.0 * clasesConPk / clases.size());
            totalPuntos += puntosPk;
            alertas.add((clases.size() - clasesConPk) + " clase(s) no tienen clave primaria definida.");
            sugerencias.add("Defina atributos identificadores 'id Long PK' en todas las tablas.");
        }

        // 2. Evaluación de Lógica de Negocio (25%)
        if (clasesConMetodos == clases.size()) {
            totalPuntos += 25;
            fortalezas.add("Todas las clases declaran métodos y operaciones de negocio.");
        } else {
            int puntosMetodos = (int) Math.round(25.0 * clasesConMetodos / clases.size());
            totalPuntos += puntosMetodos;
            alertas.add((clases.size() - clasesConMetodos) + " clase(s) carecen de métodos de negocio.");
            sugerencias.add("Incorpore métodos (ej: calcular, validar, procesar) en las entidades y servicios.");
        }

        // 3. Integridad Relacional (25%)
        if (!relaciones.isEmpty()) {
            totalPuntos += 25;
            fortalezas.add("El modelo presenta " + relaciones.size() + " relación(es) de cardinalidad activas.");
        } else if (clases.size() > 1) {
            alertas.add("No existen asociaciones entre clases; las tablas quedarán desvinculadas.");
            sugerencias.add("Conecte las entidades con relaciones 1:N o N:M para integridad referencial.");
        } else {
            totalPuntos += 25;
        }

        // 4. Arquitectura en Capas (25%)
        boolean tieneController = clases.stream().anyMatch(c -> "Controller".equalsIgnoreCase(c.getStereotype()));
        boolean tieneService = clases.stream().anyMatch(c -> "Service".equalsIgnoreCase(c.getStereotype()));
        boolean tieneRepository = clases.stream().anyMatch(c -> "Repository".equalsIgnoreCase(c.getStereotype()));

        int puntosCapas = 0;
        if (tieneController) puntosCapas += 8;
        if (tieneService) puntosCapas += 9;
        if (tieneRepository) puntosCapas += 8;
        if (puntosCapas == 0) {
            // Si son todas Entities, el generador sintetiza las capas automáticamente
            puntosCapas = 20;
            fortalezas.add("Entidades de datos listas para síntesis automática de controladores y servicios.");
        } else {
            fortalezas.add("El diagrama refleja explícitamente capas arquitectónicas MVC.");
        }
        totalPuntos += puntosCapas;

        int puntuacionFinal = Math.min(100, Math.max(0, totalPuntos));
        String nivel = puntuacionFinal >= 85 ? "COMPLETO" : puntuacionFinal >= 60 ? "AVANZADO" : puntuacionFinal >= 35 ? "EN_PROGRESO" : "INICIAL";

        resultado.put("puntuacion", puntuacionFinal);
        resultado.put("nivel", nivel);
        resultado.put("totalClases", clases.size());
        resultado.put("totalRelaciones", relaciones.size());
        resultado.put("clasesConPk", clasesConPk);
        resultado.put("clasesConMetodos", clasesConMetodos);
        resultado.put("fortalezas", fortalezas);
        resultado.put("alertas", alertas);
        resultado.put("sugerencias", sugerencias);

        return resultado;
    }
}
