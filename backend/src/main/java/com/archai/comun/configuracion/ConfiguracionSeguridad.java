package com.archai.comun.configuracion;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * CU-01 · RN-01: las contraseñas se encriptan con BCrypt (nunca en texto plano).
 * Se usa spring-security-crypto de forma aislada: no activa el filtro de seguridad
 * global, por lo que el resto de endpoints sigue expuesto para el examen.
 */
@Configuration
public class ConfiguracionSeguridad {

    @Bean
    public PasswordEncoder codificadorContrasena() {
        return new BCryptPasswordEncoder();
    }
}
