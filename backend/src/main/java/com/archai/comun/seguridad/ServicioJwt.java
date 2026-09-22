package com.archai.comun.seguridad;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * CU-01 · Emisor y validador de tokens JWT firmados (HS256) con expiración configurable.
 * No requiere librerías externas: usa HMAC-SHA256 del JDK y Jackson para el payload.
 */
@Component
public class ServicioJwt {

    private final ObjectMapper objectMapper;
    private final byte[] secreto;
    private final long expiracionMinutos;

    public ServicioJwt(
            ObjectMapper objectMapper,
            @Value("${archai.jwt.secreto:archai_studio_firma_jwt_ciclo1_2026_clave_segura}") String secreto,
            @Value("${archai.jwt.expiracion-minutos:480}") long expiracionMinutos) {
        this.objectMapper = objectMapper;
        this.secreto = secreto.getBytes(StandardCharsets.UTF_8);
        this.expiracionMinutos = expiracionMinutos;
    }

    /** Genera un JWT firmado con los datos mínimos del perfil. */
    public String generarToken(String id, String nombre, String rol) {
        long iat = Instant.now().getEpochSecond();
        long exp = iat + expiracionMinutos * 60;
        try {
            Map<String, Object> header = new LinkedHashMap<>();
            header.put("alg", "HS256");
            header.put("typ", "JWT");

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("sub", id);
            payload.put("nombre", nombre);
            payload.put("rol", rol);
            payload.put("iat", iat);
            payload.put("exp", exp);

            String base = base64Url(objectMapper.writeValueAsBytes(header))
                    + "." + base64Url(objectMapper.writeValueAsBytes(payload));
            return base + "." + firmar(base);
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo generar el token JWT", ex);
        }
    }

    /** Valida la firma y la expiración; devuelve el payload si el token es válido. */
    @SuppressWarnings("unchecked")
    public Optional<Map<String, Object>> validarToken(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        String[] partes = token.split("\\.");
        if (partes.length != 3) {
            return Optional.empty();
        }
        String base = partes[0] + "." + partes[1];
        if (!firmar(base).equals(partes[2])) {
            return Optional.empty();
        }
        try {
            byte[] json = Base64.getUrlDecoder().decode(partes[1]);
            Map<String, Object> payload = objectMapper.readValue(json, Map.class);
            Object exp = payload.get("exp");
            if (exp instanceof Number && ((Number) exp).longValue() < Instant.now().getEpochSecond()) {
                return Optional.empty();
            }
            return Optional.of(payload);
        } catch (Exception ex) {
            return Optional.empty();
        }
    }

    private String firmar(String base) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secreto, "HmacSHA256"));
            return base64Url(mac.doFinal(base.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo firmar el token JWT", ex);
        }
    }

    private String base64Url(byte[] datos) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(datos);
    }
}
