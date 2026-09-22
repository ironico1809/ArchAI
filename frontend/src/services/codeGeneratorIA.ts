// ─────────────────────────────────────────────────────────────────────────────
// codeGeneratorIA.ts — GENERADOR DE PROYECTO COMPLETO (BACKEND IA + ANDROID)
// Spring Boot 3 + Spring AI (Ollama local / qwen2.5:3b) + H2 embebida + JWT
// + React Native (TypeScript) para Android — 100% offline en tu red local.
// ─────────────────────────────────────────────────────────────────────────────

import { ModeloDiagrama } from '../types/uml';
import { GeneratedFile } from '../types/generation';

// ── Helpers (auto-contenidos) ────────────────────────────────────────────────
function toSnakeCase(str: string): string {
  if (!str) return '';
  return str.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

function toKebabCase(str: string): string {
  if (!str) return '';
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function uncapitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function mapJavaToTsType(javaType: string): string {
  switch (javaType?.trim()) {
    case 'Long': return 'number';
    case 'Integer': case 'int': return 'number';
    case 'Double': case 'double': return 'number';
    case 'BigDecimal': return 'number';
    case 'Boolean': case 'boolean': return 'boolean';
    case 'LocalDate': case 'LocalDateTime': return 'string';
    default: return 'string';
  }
}

function isDateField(name: string, type: string): boolean {
  const t = (type || '').toLowerCase().trim();
  const n = (name || '').toLowerCase().trim();
  return (
    t === 'localdate' ||
    t === 'date' ||
    t === 'localdatetime' ||
    t === 'timestamp' ||
    n.includes('fecha') ||
    n.includes('date') ||
    n.endsWith('_at') ||
    n.endsWith('at')
  );
}

function isDateTimeField(name: string, type: string): boolean {
  const t = (type || '').toLowerCase().trim();
  const n = (name || '').toLowerCase().trim();
  return t === 'localdatetime' || t === 'timestamp' || n.includes('fechahora') || n.includes('fecha_hora') || n.includes('datetime');
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. BACKEND SPRING BOOT 3 + IA LOCAL (OLLAMA) + H2 + JWT + SWAGGER
// ─────────────────────────────────────────────────────────────────────────────
export function generateBackendCompletoConIA(diagram: ModeloDiagrama): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const basePackage = 'com.archai';
  const pkg = 'src/main/java/com/archai/';
  const artifactId = (diagram.title || 'archai-backend').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const appName = (diagram.title || 'ArchAI_App').replace(/\s+/g, '_');
  const projectTitle = diagram.title || 'ArchAI Studio';

  // ── pom.xml con Spring AI (Ollama), H2, Security y JJWT ──
  files.push({
    filename: 'pom.xml',
    path: 'pom.xml',
    language: 'xml',
    content: `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.3</version>
        <relativePath/>
    </parent>
    <groupId>com.archai</groupId>
    <artifactId>${artifactId}</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <name>${projectTitle}</name>
    <description>API REST generada por ArchAI con IA local (Ollama), H2 embebida y JWT — funciona offline</description>
    <properties>
        <java.version>17</java.version>
        <spring-ai.version>1.0.0</spring-ai.version>
        <jjwt.version>0.12.6</jjwt.version>
        <springdoc.version>2.5.0</springdoc.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>

        <!-- IA local offline: Ollama (modelo qwen2.5:3b) -->
        <dependency>
            <groupId>org.springframework.ai</groupId>
            <artifactId>spring-ai-starter-model-ollama</artifactId>
        </dependency>

        <!-- Base de datos embebida H2 (offline) — PostgreSQL disponible como perfil opcional -->
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- JWT: emisión y verificación de tokens -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>\${jjwt.version}</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>\${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>\${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>

        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <version>1.18.30</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>\${springdoc.version}</version>
        </dependency>
    </dependencies>
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.ai</groupId>
                <artifactId>spring-ai-bom</artifactId>
                <version>\${spring-ai.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.11.0</version>
                <configuration>
                    <source>17</source>
                    <target>17</target>
                    <annotationProcessorPaths>
                        <path>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                            <version>1.18.30</version>
                        </path>
                    </annotationProcessorPaths>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
`
  });

  // ── docker-compose-ollama.yml (IA local, sin internet) ──
  files.push({
    filename: 'docker-compose-ollama.yml',
    path: 'docker-compose-ollama.yml',
    language: 'xml',
    content: `services:
  ollama:
    image: ollama/ollama:0.5.7
    container_name: archai-ollama
    ports:
      - "11434:11434"
    volumes:
      - ./data/ollama:/root/.ollama
    restart: unless-stopped
`
  });

  // ── application.yml (H2 embebida en archivo + Ollama) ──
  files.push({
    filename: 'application.yml',
    path: 'src/main/resources/application.yml',
    language: 'java',
    content: `
server:
  port: \${PORT:8088}

spring:
  application:
    name: ${appName}
  jackson:
    serialization:
      fail-on-empty-beans: false
  datasource:
    url: jdbc:h2:mem:archaidb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
    driver-class-name: org.h2.Driver
    username: sa
    password: ""
  h2:
    console:
      enabled: true
      path: /h2-console
  jpa:
    database-platform: org.hibernate.dialect.H2Dialect
    hibernate:
      ddl-auto: update
    show-sql: false
    properties:
      hibernate:
        format_sql: true
    open-in-view: true
  ai:
    ollama:
      # OLLAMA_URL se usa sobre todo en Docker (http://ollama:11434); en local queda localhost
      base-url: \${OLLAMA_URL:http://localhost:11434}
      chat:
        options:
          model: \${OLLAMA_MODEL:qwen2.5:3b}
      embedding:
        options:
          model: nomic-embed-text
    model:
      chat: ollama
      embedding: ollama

springdoc:
  api-docs:
    path: /api-docs
  swagger-ui:
    path: /swagger-ui.html

jwt:
  # En producción cambia JWT_SECRET. Mínimo 32 caracteres.
  secret: \${JWT_SECRET:archai-demo-secret-key-00-change-me-in-production-1234}
  expiration-ms: 86400000
`
  });

  // ── Application.java ──
  files.push({
    filename: 'Application.java',
    path: `${pkg}Application.java`,
    language: 'java',
    content: `package ${basePackage};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Punto de entrada del backend generado por ArchAI.
 * Stack: Spring Boot 3 + Spring AI (Ollama local) + H2 embebida + JWT.
 * Proyecto: ${projectTitle}
 */
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
        System.out.println("==========================================================");
        System.out.println("  ArchAI backend listo:");
        System.out.println("  - API:        http://localhost:8080/api/v1/...");
        System.out.println("  - Swagger:    http://localhost:8080/swagger-ui.html");
        System.out.println("  - H2 console: http://localhost:8080/h2-console (JDBC URL: jdbc:h2:file:./data/appdb, user: sa)");
        System.out.println("  - IA local:   Ollama qwen2.5:3b en http://localhost:11434");
        System.out.println("==========================================================");
    }
}
`
  });

  // ── config/OpenApiConfig.java ──
  files.push({
    filename: 'OpenApiConfig.java',
    path: `${pkg}config/OpenApiConfig.java`,
    language: 'java',
    content: `package ${basePackage}.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("${projectTitle}")
                        .version("1.0.0")
                        .description("API generada por ArchAI con IA local (Ollama) — Swagger accesible desde el celular por LAN.")
                        .contact(new Contact().name("ArchAI Studio")));
    }
}
`
  });

  // ── config/GlobalExceptionHandler.java ──
  files.push({
    filename: 'GlobalExceptionHandler.java',
    path: `${pkg}config/GlobalExceptionHandler.java`,
    language: 'java',
    content: `package ${basePackage}.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(IllegalArgumentException ex) {
        return response(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGlobal(Exception ex) {
        return response(HttpStatus.INTERNAL_SERVER_ERROR, ex.getMessage());
    }

    private ResponseEntity<Map<String, Object>> response(HttpStatus status, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        return ResponseEntity.status(status).body(body);
    }
}
`
  });

  // ── config/CorsConfig.java ──
  files.push({
    filename: 'CorsConfig.java',
    path: `${pkg}config/CorsConfig.java`,
    language: 'java',
    content: `package ${basePackage}.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Habilita CORS para apps móviles (React Native / Flutter) y web en LAN. */
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(false);
    }
}
`
  });

  // ── config/SecurityConfig.java ──
  files.push({
    filename: 'SecurityConfig.java',
    path: `${pkg}config/SecurityConfig.java`,
    language: 'java',
    content: `package ${basePackage}.config;

import ${basePackage}.security.JwtAuthFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> {})
            .csrf(csrf -> csrf.disable())
            .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/h2-console/**").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/ai/**").permitAll()
                .requestMatchers("/api/v1/**").permitAll()
                .requestMatchers("/v3/api-docs/**", "/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                .anyRequest().authenticated()
            )
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
`
  });

  // ── security/JwtService.java ──
  files.push({
    filename: 'JwtService.java',
    path: `${pkg}security/JwtService.java`,
    language: 'java',
    content: `package ${basePackage}.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    @Value("\${jwt.secret}")
    private String secretKey;

    @Value("\${jwt.expiration-ms}")
    private long expirationMs;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String email) {
        return Jwts.builder()
                .subject(email)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    public String extractEmail(String token) {
        return getClaims(token).getSubject();
    }

    public boolean validateToken(String token) {
        try {
            return !getClaims(token).getExpiration().before(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
`
  });

  // ── security/JwtAuthFilter.java ──
  files.push({
    filename: 'JwtAuthFilter.java',
    path: `${pkg}security/JwtAuthFilter.java`,
    language: 'java',
    content: `package ${basePackage}.security;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            if (jwtService.validateToken(token)) {
                String email = jwtService.extractEmail(token);
                var authentication = new UsernamePasswordAuthenticationToken(
                        email, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }
        chain.doFilter(request, response);
    }
}
`
  });

  // ── security/AuthRequest.java + AuthResponse.java (records) ──
  files.push({
    filename: 'AuthRequest.java',
    path: `${pkg}security/AuthRequest.java`,
    language: 'java',
    content: `package ${basePackage}.security;

public record AuthRequest(String email, String password) {}
`
  });
  files.push({
    filename: 'AuthResponse.java',
    path: `${pkg}security/AuthResponse.java`,
    language: 'java',
    content: `package ${basePackage}.security;

public record AuthResponse(String token, String email, String name) {}
`
  });

  // ── security/AuthController.java ──
  files.push({
    filename: 'AuthController.java',
    path: `${pkg}security/AuthController.java`,
    language: 'java',
    content: `package ${basePackage}.security;

import ${basePackage}.domain.entity.User;
import ${basePackage}.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository, JwtService jwtService, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new IllegalArgumentException("Credenciales inválidas");
        }
        String token = jwtService.generateToken(user.getEmail());
        return ResponseEntity.ok(new AuthResponse(token, user.getEmail(), user.getName()));
    }

    @GetMapping("/demo")
    public ResponseEntity<?> demo() {
        return ResponseEntity.ok(java.util.Map.of(
                "email", "demo@archai.io",
                "password", "password123",
                "note", "Usuario de demostración sembrado automáticamente"));
    }
}
`
  });

  // ── domain/entity/User.java ──
  files.push({
    filename: 'User.java',
    path: `${pkg}domain/entity/User.java`,
    language: 'java',
    content: `package ${basePackage}.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String password;
}
`
  });

  // ── repository/UserRepository.java ──
  files.push({
    filename: 'UserRepository.java',
    path: `${pkg}repository/UserRepository.java`,
    language: 'java',
    content: `package ${basePackage}.repository;

import ${basePackage}.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
}
`
  });

  // ── init/DataInitializer.java (siembra usuario demo offline) ──
  files.push({
    filename: 'DataInitializer.java',
    path: `${pkg}init/DataInitializer.java`,
    language: 'java',
    content: `package ${basePackage}.init;

import ${basePackage}.domain.entity.User;
import ${basePackage}.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        userRepository.findByEmail("demo@archai.io").orElseGet(() -> {
            User demo = User.builder()
                    .email("demo@archai.io")
                    .name("Usuario Demo ArchAI")
                    .password(passwordEncoder.encode("password123"))
                    .build();
            return userRepository.save(demo);
        });
        System.out.println("[ArchAI] Usuario demo listo: demo@archai.io / password123");
    }
}
`
  });

  // ── ai/AiService.java (Agente con herramientas CRUD) ──
  files.push({
    filename: 'AiService.java',
    path: `${pkg}ai/AiService.java`,
    language: 'java',
    content: `package ${basePackage}.ai;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.stereotype.Service;

/**
 * Servicio de agente IA generado por ArchAI.
 * Usa ChatClient con herramientas (@Tool) para ejecutar operaciones CRUD
 * en la base de datos a traves de lenguaje natural.
 */
@Service
@Slf4j
public class AiService {

    private final ChatClient chatClient;
    private final AgentTools agentTools;

    private static final String SYSTEM_PROMPT = """
            Eres un asistente inteligente de gestion de datos para el sistema: ${projectTitle}.
            Puedes ejecutar operaciones en la base de datos usando las herramientas disponibles.

            REGLAS IMPORTANTES:
            1. Cuando el usuario pida crear, agregar, registrar, guardar, modificar, actualizar,
               eliminar, borrar o consultar datos, DEBES usar las herramientas disponibles para
               ejecutar la operacion real en la base de datos.
            2. No digas simplemente que puedes hacer algo — HAZLO usando las herramientas.
            3. Responde siempre en español.
            4. Despues de ejecutar una herramienta, explica al usuario lo que hiciste y muestra
               los resultados de forma clara y legible.
            5. Si te falta informacion para completar una operacion, pregunta al usuario los datos
               que necesitas antes de ejecutar.
            6. Para fechas usa formato YYYY-MM-DD. Para fecha y hora usa YYYY-MM-DDTHH:MM:SS.
            """;

    public AiService(ChatModel chatModel, AgentTools agentTools) {
        this.chatClient = ChatClient.builder(chatModel).build();
        this.agentTools = agentTools;
    }

    /**
     * Procesa un mensaje del usuario usando el agente con herramientas CRUD.
     */
    public String chat(String userMessage) {
        log.info("[AiAgent] Mensaje recibido: {}", userMessage);
        try {
            String response = chatClient.prompt()
                    .system(SYSTEM_PROMPT)
                    .user(userMessage)
                    .tools(agentTools)
                    .call()
                    .content();
            log.info("[AiAgent] Respuesta generada.");
            return response;
        } catch (Exception e) {
            log.error("[AiAgent] Error procesando mensaje: {}", e.getMessage(), e);
            return "Error al procesar tu solicitud: " + e.getMessage();
        }
    }
}
`
  });

  // ── ai/AiController.java ──
  files.push({
    filename: 'AiController.java',
    path: `${pkg}ai/AiController.java`,
    language: 'java',
    content: `package ${basePackage}.ai;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(originPatterns = "*")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    /** POST /api/ai/chat — body: {"message": "..."} → {"reply": "...", "model": "qwen2.5:3b"} */
    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, String> body) {
        String message = body.getOrDefault("message", "");
        if (message.isBlank()) {
            throw new IllegalArgumentException("El campo 'message' es obligatorio");
        }
        String reply = aiService.chat(message);
        return ResponseEntity.ok(Map.of("reply", reply, "model", "qwen2.5:3b"));
    }

    /** GET /api/ai/health — comprueba que Ollama esta respondiendo. */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "model", "qwen2.5:3b",
                "modo", "offline-local",
                "endpoint", "http://localhost:11434"));
    }
}
`
  });


  // ── README.md del backend ──
  files.push({
    filename: 'README.md',
    path: 'README.md',
    language: 'xml',
    content: `# ${projectTitle} — Backend generado por ArchAI (IA local)

Stack: **Spring Boot 3 · Spring AI · Ollama (qwen2.5:3b) · H2 embebida · JWT · Swagger**

## Requisitos
- Java 17+ y Maven 3.8+
- Docker (opcional, para Ollama) — o instala Ollama en https://ollama.com

## Puesta en marcha (100% offline, sin internet)
\`\`\`bash
# 1) Levanta la IA local (una sola vez descarga el modelo)
docker compose up -d ollama
docker exec -it archai-ollama ollama pull qwen2.5:3b

# 2) Arranca el backend
mvn spring-boot:run
\`\`\`

> También puedes instalar Ollama nativo (https://ollama.com) y ejecutar \`ollama pull qwen2.5:3b\`.

## Qué verás
| Recurso | URL |
|---|---|
| Swagger (probar API + celular) | http://localhost:8080/swagger-ui.html |
| Chat IA local | POST http://localhost:8080/api/ai/chat  body: {"message":"hola"} |
| Estado IA | GET http://localhost:8080/api/ai/health |
| Login JWT | POST http://localhost:8080/api/auth/login |
| Consola H2 | http://localhost:8080/h2-console (JDBC: jdbc:h2:file:./data/appdb, user: sa) |

Credenciales demo: **demo@archai.io / password123**

## Probar desde tu celular Android (misma red Wi-Fi)
1. Averigua la IP de tu PC: \`ipconfig\` → IPv4 (ej. \`192.168.1.14\`).
2. En el celular abre: \`http://192.168.x.x:8080/swagger-ui.html\`.
3. La app React Native del proyecto hermano \`frontend/\` apunta a esa IP (edita \`src/config/appConfig.ts\`).

## Cambiar la base de datos (opcional: PostgreSQL)
Comenta las líneas H2 en \`src/main/resources/application.yml\` y usa:
\`\`\`yaml
url: \${DATABASE_URL:jdbc:postgresql://localhost:5432/${toSnakeCase(projectTitle)}}
username: \${DATABASE_USER:postgres}
password: \${DATABASE_PASSWORD:postgres}
\`\`\`
`
  });

  // ── Entidades del diagrama UML → Entity / Repository / Service / Controller / DTO ──
  (diagram.classes || []).forEach(cls => {
    const className = capitalize(cls.name);
    const tableName = toSnakeCase(className) + 's';
    const varName = uncapitalize(className);
    const endpoint = toKebabCase(className) + 's';

    if (cls.stereotype === 'Note') return;

    if (cls.stereotype === 'Enum') {
      const enumLiterals = (cls.attributes || []).map(a => a.name.toUpperCase().replace(/[^A-Z0-9_]/g, '_')).join(',\n    ');
      files.push({
        filename: `${className}.java`,
        path: `${pkg}domain/enums/${className}.java`,
        language: 'java',
        content: `package ${basePackage}.domain.enums;

public enum ${className} {
    ${enumLiterals || 'VALOR_DEFECTO'};
}
`
      });
      return;
    }

    if (cls.stereotype === 'Interface' || cls.isInterface) {
      let ifaceMethods = '';
      (cls.methods || []).forEach(m => {
        ifaceMethods += `    ${m.returnType || 'void'} ${m.name}(${m.parameters || ''});\n\n`;
      });
      files.push({
        filename: `${className}.java`,
        path: `${pkg}service/${className}.java`,
        language: 'java',
        content: `package ${basePackage}.service;

public interface ${className} {
${ifaceMethods}}
`
      });
      return;
    }

    const outgoingRelations = (diagram.relations || []).filter(r => r.sourceClassId === cls.id);
    const incomingRelations = (diagram.relations || []).filter(r => r.targetClassId === cls.id);

    // ── Entity ──
    let entity = `package ${basePackage}.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "${tableName}")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ${className} {

`;
    let hasId = false;
    const seenAttrs = new Set<string>();
    (cls.attributes || []).forEach(attr => {
      const fieldName = uncapitalize(attr.name);
      if (seenAttrs.has(fieldName)) return;
      seenAttrs.add(fieldName);

      if (attr.isPrimaryKey || fieldName.toLowerCase() === 'id') {
        hasId = true;
        entity += `    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

`;
      } else {
        // Si ya existe una relación @ManyToOne hacia esta entidad, no duplicar la columna primitiva
        const isFkToIncoming = incomingRelations.some(rel => {
          const sourceCls = diagram.classes.find(c => c.id === rel.sourceClassId);
          if (!sourceCls) return false;
          const sourceName = sourceCls.name.toLowerCase();
          const fLower = fieldName.toLowerCase();
          return fLower === sourceName || fLower === `${sourceName}id` || fLower === `${toSnakeCase(sourceName)}_id`;
        });
        if (isFkToIncoming) return;

        const colName = toSnakeCase(fieldName);
        const isNullable = attr.isNullable !== false;
        entity += `    @Column(name = "${colName}", nullable = ${isNullable})
    private ${attr.type} ${fieldName};

`;
      }
    });
    if (!hasId) {
      entity += `    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

`;
    }

    const seenOutgoing = new Set<string>();
    outgoingRelations.forEach(rel => {
      const targetCls = diagram.classes.find(c => c.id === rel.targetClassId);
      if (targetCls) {
        const targetClass = capitalize(targetCls.name);
        const targetVar = uncapitalize(targetClass);
        const fieldName = `${targetVar}List`;
        if (!seenOutgoing.has(fieldName)) {
          seenOutgoing.add(fieldName);
          entity += `    // Relación UML: ${rel.type || '1:N'} hacia ${targetClass}
    @OneToMany(mappedBy = "${varName}", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<${targetClass}> ${fieldName} = new ArrayList<>();

`;
        }
      }
    });

    const seenIncoming = new Set<string>();
    incomingRelations.forEach(rel => {
      const sourceCls = diagram.classes.find(c => c.id === rel.sourceClassId);
      if (sourceCls) {
        const sourceClass = capitalize(sourceCls.name);
        const sourceVar = uncapitalize(sourceClass);
        if (!seenIncoming.has(sourceVar)) {
          seenIncoming.add(sourceVar);
          const fkCol = toSnakeCase(sourceClass) + '_id';
          entity += `    // Relación UML: referencia ${rel.type || 'N:1'} desde ${sourceClass}
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "${fkCol}")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ${sourceClass} ${sourceVar};

`;
        }
      }
    });

    if (cls.methods && cls.methods.length > 0) {
      cls.methods.forEach(m => {
        const retType = m.returnType && m.returnType !== 'void' ? m.returnType : 'void';
        const params = m.parameters || '';
        const returnStmt = retType === 'void' ? '' : '        return null;\n';
        entity += `    /** Operación UML: ${m.name} */
    public ${retType} ${m.name}(${params}) {
        // TODO: Implementar lógica de negocio de ${m.name}
${returnStmt}    }

`;
      });
    }

    entity += `}
`;
    files.push({
      filename: `${className}.java`,
      path: `${pkg}domain/entity/${className}.java`,
      language: 'java',
      content: entity
    });

    // ── Repository ──
    let repo = `package ${basePackage}.repository;

import ${basePackage}.domain.entity.${className};
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ${className}Repository extends JpaRepository<${className}, Long> {

    // Consultas derivadas desde relaciones UML
`;
    const seenRepoMethods = new Set<string>();
    incomingRelations.forEach(rel => {
      const sourceCls = diagram.classes.find(c => c.id === rel.sourceClassId);
      if (sourceCls) {
        const methodName = `findBy${capitalize(sourceCls.name)}Id`;
        if (!seenRepoMethods.has(methodName)) {
          seenRepoMethods.add(methodName);
          repo += `    List<${className}> ${methodName}(Long ${uncapitalize(sourceCls.name)}Id);
`;
        }
      }
    });
    repo += `}
`;
    files.push({
      filename: `${className}Repository.java`,
      path: `${pkg}repository/${className}Repository.java`,
      language: 'java',
      content: repo
    });

    // ── Service ──
    let service = `package ${basePackage}.service;

import ${basePackage}.domain.entity.${className};
import ${basePackage}.repository.${className}Repository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class ${className}Service {

    private final ${className}Repository repository;

    @Transactional(readOnly = true)
    public List<${className}> findAll() { return repository.findAll(); }

    @Transactional(readOnly = true)
    public Optional<${className}> findById(Long id) { return repository.findById(id); }

    public ${className} save(${className} entity) { return repository.save(entity); }

    public ${className} update(Long id, ${className} updatedEntity) {
        return repository.findById(id)
                .map(existing -> {
                    updatedEntity.setId(id);
                    return repository.save(updatedEntity);
                })
                .orElseThrow(() -> new IllegalArgumentException("${className} no encontrado con ID: " + id));
    }

    public void deleteById(Long id) {
        if (!repository.existsById(id)) {
            throw new IllegalArgumentException("${className} no existe con ID: " + id);
        }
        repository.deleteById(id);
    }
}
`;
    files.push({
      filename: `${className}Service.java`,
      path: `${pkg}service/${className}Service.java`,
      language: 'java',
      content: service
    });

    // ── Controller ──
    let controller = `package ${basePackage}.controller;

import ${basePackage}.domain.entity.${className};
import ${basePackage}.service.${className}Service;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/${endpoint}")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = "*")
public class ${className}Controller {

    private final ${className}Service service;

    @GetMapping
    public ResponseEntity<List<${className}>> getAll() { return ResponseEntity.ok(service.findAll()); }

    @GetMapping("/{id}")
    public ResponseEntity<${className}> getById(@PathVariable Long id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<${className}> create(@RequestBody ${className} entity) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.save(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<${className}> update(@PathVariable Long id, @RequestBody ${className} entity) {
        return ResponseEntity.ok(service.update(id, entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
`;
    files.push({
      filename: `${className}Controller.java`,
      path: `${pkg}controller/${className}Controller.java`,
      language: 'java',
      content: controller
    });

    // ── DTO ──
    let dto = `package ${basePackage}.domain.dto;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ${className}Dto {

`;
    const seenDtoAttrs = new Set<string>();
    (cls.attributes || []).forEach(attr => {
      const attrName = uncapitalize(attr.name);
      if (!seenDtoAttrs.has(attrName)) {
        seenDtoAttrs.add(attrName);
        dto += `    private ${attr.type} ${attrName};
`;
      }
    });
    incomingRelations.forEach(rel => {
      const sourceCls = diagram.classes.find(c => c.id === rel.sourceClassId);
      if (sourceCls) {
        const fieldName = `${uncapitalize(sourceCls.name)}Id`;
        if (!seenDtoAttrs.has(fieldName)) {
          seenDtoAttrs.add(fieldName);
          dto += `    private Long ${fieldName};
`;
        }
      }
    });
    dto += `}
`;
    files.push({
      filename: `${className}Dto.java`,
      path: `${pkg}domain/dto/${className}Dto.java`,
      language: 'java',
      content: dto
    });
  });

  // ── ai/AgentTools.java (Herramientas CRUD del agente IA — generado dinamicamente) ──
  const entityClasses = (diagram.classes || []).filter((cls: any) =>
    cls.stereotype !== 'Note' && cls.stereotype !== 'Enum' && cls.stereotype !== 'Interface' && !cls.isInterface
  );

  const entityImports = entityClasses.map((cls: any) => {
    const cn = capitalize(cls.name);
    return `import ${basePackage}.domain.entity.${cn};\nimport ${basePackage}.service.${cn}Service;`;
  }).join('\n');

  const serviceFields = entityClasses.map((cls: any) => {
    const cn = capitalize(cls.name);
    const vn = uncapitalize(cn);
    return `    private final ${cn}Service ${vn}Service;`;
  }).join('\n');

  const toolMethods = entityClasses.map((cls: any) => {
    const cn = capitalize(cls.name);
    const vn = uncapitalize(cn);
    const incomingRelations = (diagram.relations || []).filter((r: any) => r.targetClassId === cls.id);
    const relationParams = incomingRelations.map((rel: any) => {
      const sourceCls = (diagram.classes || []).find((c: any) => c.id === rel.sourceClassId);
      if (!sourceCls) return null;
      const sCn = capitalize(sourceCls.name);
      const sVn = uncapitalize(sCn);
      return {
        paramName: `${sVn}Id`,
        sourceClass: sCn,
        sourceVar: sVn,
        setter: `set${sCn}`,
        desc: `${sVn}Id (Long: ID de ${sCn} relacionado)`
      };
    }).filter(Boolean) as Array<{ paramName: string; sourceClass: string; sourceVar: string; setter: string; desc: string }>;

    const primitiveAttrs = (cls.attributes || []).filter((attr: any) => {
      const fn = uncapitalize(attr.name);
      if (attr.isPrimaryKey || fn.toLowerCase() === 'id') return false;
      if (['List', 'ArrayList', 'Set'].includes(attr.type || '')) return false;
      if (relationParams.some(rp => rp.paramName.toLowerCase() === fn.toLowerCase())) return false;
      return true;
    });

    const paramListItems = [
      ...primitiveAttrs.map((attr: any) => {
        const t = attr.type || 'String';
        const fn = uncapitalize(attr.name);
        if (t === 'LocalDate' || t === 'LocalDateTime') return `String ${fn}`;
        return `${t} ${fn}`;
      }),
      ...relationParams.map(rp => `Long ${rp.paramName}`)
    ];
    const paramList = paramListItems.join(', ');

    const paramDescItems = [
      ...primitiveAttrs.map((attr: any) => {
        const t = attr.type || 'String';
        const fn = uncapitalize(attr.name);
        if (t === 'LocalDate') return `${fn} (YYYY-MM-DD)`;
        if (t === 'LocalDateTime') return `${fn} (YYYY-MM-DDTHH:MM:SS)`;
        return `${fn} (${t})`;
      }),
      ...relationParams.map(rp => rp.desc)
    ];
    const paramDesc = paramDescItems.join(', ') || 'sin parametros adicionales';

    const setterCalls = [
      ...primitiveAttrs.map((attr: any) => {
        const t = attr.type || 'String';
        const fn = uncapitalize(attr.name);
        const setter = `set${capitalize(fn)}`;
        if (t === 'LocalDate') {
          return `            if (${fn} != null && !${fn}.isBlank()) { try { entity.${setter}(java.time.LocalDate.parse(${fn}.trim())); } catch (Exception ignored) {} }`;
        } else if (t === 'LocalDateTime') {
          return `            if (${fn} != null && !${fn}.isBlank()) { try { entity.${setter}(java.time.LocalDateTime.parse(${fn}.trim())); } catch (Exception ignored) {} }`;
        }
        return `            entity.${setter}(${fn});`;
      }),
      ...relationParams.map(rp => {
        return `            if (${rp.paramName} != null) { ${rp.sourceVar}Service.findById(${rp.paramName}).ifPresent(entity::${rp.setter}); }`;
      })
    ].join('\n');

    const patchCalls = [
      ...primitiveAttrs.map((attr: any) => {
        const t = attr.type || 'String';
        const fn = uncapitalize(attr.name);
        const setter = `set${capitalize(fn)}`;
        if (t === 'LocalDate') {
          return `                if (${fn} != null && !${fn}.isBlank()) { try { existing.${setter}(java.time.LocalDate.parse(${fn}.trim())); } catch (Exception ignored) {} }`;
        } else if (t === 'LocalDateTime') {
          return `                if (${fn} != null && !${fn}.isBlank()) { try { existing.${setter}(java.time.LocalDateTime.parse(${fn}.trim())); } catch (Exception ignored) {} }`;
        } else if (t === 'String') {
          return `                if (${fn} != null && !${fn}.isBlank()) existing.${setter}(${fn});`;
        }
        return `                if (${fn} != null) existing.${setter}(${fn});`;
      }),
      ...relationParams.map(rp => {
        return `                if (${rp.paramName} != null) { ${rp.sourceVar}Service.findById(${rp.paramName}).ifPresent(existing::${rp.setter}); }`;
      })
    ].join('\n');

    return `
    @Tool(description = "Lista todos los registros de ${cn}. Devuelve JSON con todos los campos.")
    public String listar${cn}s() {
        try {
            java.util.List<${cn}> items = ${vn}Service.findAll();
            if (items.isEmpty()) return "No hay registros de ${cn}.";
            return objectMapper.writeValueAsString(items);
        } catch (Exception e) {
            return "Error al listar ${cn}: " + e.getMessage();
        }
    }

    @Tool(description = "Busca un ${cn} por ID. Parametros: id (Long).")
    public String buscar${cn}PorId(Long id) {
        try {
            var opt = ${vn}Service.findById(id);
            if (opt.isEmpty()) return "${cn} con ID " + id + " no encontrado.";
            return objectMapper.writeValueAsString(opt.get());
        } catch (Exception e) {
            return "Error buscando ${cn}: " + e.getMessage();
        }
    }

    @Tool(description = "Crea un nuevo ${cn}. Parametros: ${paramDesc}.")
    public String crear${cn}(${paramList}) {
        try {
            ${cn} entity = new ${cn}();
${setterCalls}
            ${cn} saved = ${vn}Service.save(entity);
            return "${cn} creado con ID " + saved.getId() + ". Datos: " + objectMapper.writeValueAsString(saved);
        } catch (Exception e) {
            return "Error al crear ${cn}: " + e.getMessage();
        }
    }

    @Tool(description = "Actualiza un ${cn} existente. Modifica unicamente los campos proporcionados sin borrar los datos existentes. Parametros: id (Long), ${paramDesc}.")
    public String actualizar${cn}(Long id, ${paramList}) {
        try {
            var opt = ${vn}Service.findById(id);
            if (opt.isEmpty()) return "${cn} con ID " + id + " no encontrado.";
            ${cn} existing = opt.get();
${patchCalls}
            ${cn} updated = ${vn}Service.save(existing);
            return "${cn} actualizado exitosamente. Datos: " + objectMapper.writeValueAsString(updated);
        } catch (Exception e) {
            return "Error al actualizar ${cn}: " + e.getMessage();
        }
    }

    @Tool(description = "Elimina un ${cn} por su ID. Parametros: id (Long).")
    public String eliminar${cn}(Long id) {
        try {
            var opt = ${vn}Service.findById(id);
            if (opt.isEmpty()) return "${cn} con ID " + id + " no encontrado para eliminar.";
            ${vn}Service.deleteById(id);
            return "${cn} con ID " + id + " eliminado exitosamente.";
        } catch (Exception e) {
            return "Error al eliminar ${cn}: " + e.getMessage();
        }
    }`;
  }).join('\n');

  files.push({
    filename: 'AgentTools.java',
    path: `${pkg}ai/AgentTools.java`,
    language: 'java',
    content: `package ${basePackage}.ai;

${entityImports}
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

/**
 * Herramientas del agente IA generadas por ArchAI.
 * Cada metodo con @Tool puede ser invocado por el modelo de lenguaje (Ollama qwen2.5:3b)
 * para ejecutar operaciones CRUD reales sobre la base de datos.
 * Generado automaticamente segun el diagrama UML del proyecto.
 */
@Component
@RequiredArgsConstructor
public class AgentTools {

${serviceFields}

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule());
${toolMethods}
}
`
  });

  return files;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. FRONTEND REACT NATIVE (ANDROID) — TypeScript, AsyncStorage offline, JWT
// ─────────────────────────────────────────────────────────────────────────────
export function generateReactNativeApp(diagram: ModeloDiagrama): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const entities = (diagram.classes || []).filter(
    c => c.stereotype !== 'Note' && c.stereotype !== 'Enum' && c.stereotype !== 'Interface' && !c.isInterface
  );
  const appName = (diagram.title || 'ArchAIApp').replace(/[^a-zA-Z0-9]/g, '');

  // ── package.json ──
  files.push({
    filename: 'package.json',
    path: 'package.json',
    language: 'json',
    content: JSON.stringify({
      name: (diagram.title || 'archai-app').toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      version: '1.0.0',
      private: true,
      scripts: {
        android: 'react-native run-android',
        ios: 'react-native run-ios',
        start: 'react-native start'
      },
      dependencies: {
        'react': '18.2.0',
        'react-native': '0.73.4',
        '@react-navigation/native': '^6.1.9',
        '@react-navigation/native-stack': '^6.9.17',
        'react-native-screens': '^3.29.0',
        'react-native-safe-area-context': '^4.8.2',
        '@react-native-async-storage/async-storage': '^1.21.0',
        'axios': '^1.6.7'
      },
      devDependencies: {
        '@types/react': '^18.2.0',
        'typescript': '^5.3.0',
        '@react-native/babel-preset': '^0.73.21',
        '@react-native/metro-config': '^0.73.5',
        '@react-native/typescript-config': '^0.73.1'
      }
    }, null, 2)
  });

  // ── tsconfig.json ──
  files.push({
    filename: 'tsconfig.json',
    path: 'tsconfig.json',
    language: 'json',
    content: `{
  "extends": "@react-native/typescript-config/tsconfig.json",
  "compilerOptions": {
    "skipLibCheck": true
  }
}
`
  });

  // ── babel.config.js ──
  files.push({
    filename: 'babel.config.js',
    path: 'babel.config.js',
    language: 'xml',
    content: `module.exports = {
  presets: ['module:@react-native/babel-preset'],
};
`
  });

  // ── app.json ──
  files.push({
    filename: 'app.json',
    path: 'app.json',
    language: 'json',
    content: JSON.stringify({
      name: 'ArchAIApp',
      displayName: projectTitleOrFallback(diagram.title)
    }, null, 2)
  });

  // ── index.js ──
  files.push({
    filename: 'index.js',
    path: 'index.js',
    language: 'xml',
    content: `import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
`
  });

  // ── metro.config.js ──
  files.push({
    filename: 'metro.config.js',
    path: 'metro.config.js',
    language: 'xml',
    content: `const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const config = {};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
`
  });

  // ── src/config/appConfig.ts ──
  files.push({
    filename: 'appConfig.ts',
    path: 'src/config/appConfig.ts',
    language: 'xml',
    content: `/**
 * Configuración de conexión al backend generado por ArchAI.
 * IMPORTANTE: cambia BASE_URL por la IP de tu PC en la red Wi-Fi.
 * Cómo obtenerla en Windows: abre cmd y ejecuta "ipconfig" (IPv4).
 */
export const APP_CONFIG = {
  // Apunta al backend en la misma red Wi-Fi (IP de tu PC).
  // Usa 10.0.2.2 si pruebas en el emulador de Android de la misma máquina.
  // Método alternativo: edita el default directamente aquí abajo.
  BASE_URL: (globalThis as any).process?.env?.BASE_URL || 'http://192.168.1.19:8088/api',
  // Credenciales sembradas por el DataInitializer del backend
  DEMO_EMAIL: 'demo@archai.io',
  DEMO_PASSWORD: 'password123',
  // Modelo local de IA (Ollama)
  AI_MODEL: 'qwen2.5:3b',
};
`
  });

  // ── src/services/apiClient.ts ──
  files.push({
    filename: 'apiClient.ts',
    path: 'src/services/apiClient.ts',
    language: 'xml',
    content: `import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '../config/appConfig';

/** Cliente HTTP con JWT y caché offline (AsyncStorage). */
export const api = axios.create({
  baseURL: APP_CONFIG.BASE_URL,
  timeout: 120000,
});

// Inyectar automáticamente el token JWT en cada petición
api.interceptors.request.use(async (config) => {
  try {
    const session = await loadSession();
    if (session?.token) {
      config.headers.Authorization = 'Bearer ' + session.token;
    }
  } catch (_) {}
  return config;
});

const TOKEN_KEY = 'archai_token';
const USER_KEY = 'archai_user';

export async function saveSession(token: string, email: string, name: string) {
  try {
    await AsyncStorage.multiSet([
      [TOKEN_KEY, token],
      [USER_KEY, JSON.stringify({ email, name })],
    ]);
  } catch (e) { /* almacenamiento no disponible */ }
}

export async function loadSession(): Promise<{ token: string; email: string; name: string } | null> {
  try {
    const [[, token], [, userJson]] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
    if (token && userJson) return { token, ...JSON.parse(userJson) };
  } catch (e) { /* sin sesión */ }
  return null;
}

export async function clearSession() {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}

/** Login contra el backend. Devuelve el token JWT. */
export async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password });
  await saveSession(data.token, data.email, data.name);
  return data;
}

/** Chat con la IA local del backend (Ollama). */
export async function chatWithAI(message: string) {
  const { data } = await api.post('/ai/chat', { message });
  return data.reply as string;
}

/** Caché offline genérico para listas (guardar/leer). */
export async function cacheList(entity: string, items: unknown) {
  try { await AsyncStorage.setItem('cache_' + entity, JSON.stringify(items)); } catch (e) { /* noop */ }
}
export async function loadCachedList(entity: string): Promise<unknown[] | null> {
  try {
    const raw = await AsyncStorage.getItem('cache_' + entity);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}
`
  });

  // ── src/types/models.ts (tipos TS desde el diagrama UML) ──
  let modelsTs = `/**
 * Tipos TypeScript generados desde el diagrama UML por ArchAI.
 */
`;
  entities.forEach(cls => {
    modelsTs += `\nexport interface ${capitalize(cls.name)} {\n  id?: number;\n`;
    (cls.attributes || []).forEach(attr => {
      const fieldName = uncapitalize(attr.name);
      if (attr.isPrimaryKey || fieldName.toLowerCase() === 'id') return;
      const tsType = mapJavaToTsType(attr.type);
      const optional = attr.isNullable !== false ? '?' : '';
      modelsTs += `  ${fieldName}${optional}: ${tsType};\n`;
    });
    modelsTs += `}\n`;
  });
  files.push({
    filename: 'models.ts',
    path: 'src/types/models.ts',
    language: 'xml',
    content: modelsTs
  });

  // ── App.tsx ──
  let navigation = '';
  entities.forEach(cls => {
    const name = capitalize(cls.name);
    navigation += `        <Stack.Screen name="${name}List" component={${name}ListScreen} options={{ title: '${name}s' }} />\n`;
    navigation += `        <Stack.Screen name="${name}Form" component={${name}FormScreen} options={{ title: '${name}' }} />\n`;
  });

  files.push({
    filename: 'App.tsx',
    path: 'App.tsx',
    language: 'xml',
    content: `import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from './src/screens/HomeScreen';
import { ChatScreen } from './src/screens/ChatScreen';
${entities.map(c => `import { ${capitalize(c.name)} } from './src/types/models';`).join('\n')}
${entities.map(c => `import { ${capitalize(c.name)}ListScreen, ${capitalize(c.name)}FormScreen } from './src/screens/${capitalize(c.name)}Screens';`).join('\n')}

export type RootStackParamList = {
  Home: undefined;
  Chat: undefined;
${entities.map(c => `  ${capitalize(c.name)}List: undefined;\n  ${capitalize(c.name)}Form: { item?: ${capitalize(c.name)} } | undefined;`).join('\n')}
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: '${diagram.title || 'ArchAI App'}' }} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ title: '🤖 Asistente IA (qwen2.5:3b)' }} />
${navigation}      </Stack.Navigator>
    </NavigationContainer>
  );
}
`
  });

  // ── src/screens/HomeScreen.tsx ──
  // ── src/screens/HomeScreen.tsx (Dashboard Dinámico con KPIs, Logout y Dock) ──
  const kpiColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];
  const kpiIcons = ['👥', '👨‍⚕️', '📅', '📋', '💊', '📦', '🏢', '🏷️', '📊', '💼'];

  let kpiFetches = '';
  let kpiStatesDef = '';
  let kpiStatesInit = '';
  let kpiStatesExtract = '';
  let kpiCards = '';
  let moduleCards = '';
  let bottomNavTabs = '';

  entities.forEach((cls, idx) => {
    const name = capitalize(cls.name);
    const plural = toKebabCase(cls.name) + 's';
    const varName = uncapitalize(cls.name);
    const color = kpiColors[idx % kpiColors.length];
    const icon = kpiIcons[idx % kpiIcons.length];

    kpiStatesDef += `  ${varName}: number;\n`;
    kpiStatesInit += `    ${varName}: 0,\n`;
    kpiFetches += `        api.get('/v1/${plural}'),\n`;
    kpiStatesExtract += `        ${varName}: res[${idx}].status === 'fulfilled' && Array.isArray((res[${idx}] as any).value.data) ? (res[${idx}] as any).value.data.length : 0,\n`;

    kpiCards += `          <TouchableOpacity
            style={[styles.kpiCard, { borderColor: '${color}' }]}
            onPress={() => navigation.navigate('${name}List')}
            activeOpacity={0.8}
          >
            <Text style={styles.kpiIcon}>${icon}</Text>
            <Text style={styles.kpiValue}>{stats.${varName}}</Text>
            <Text style={styles.kpiLabel}>${name}</Text>
          </TouchableOpacity>\n`;

    moduleCards += `        <TouchableOpacity
          style={styles.moduleCard}
          onPress={() => navigation.navigate('${name}List')}
          activeOpacity={0.8}
        >
          <View style={styles.moduleIconBox}>
            <Text style={styles.moduleIcon}>${icon}</Text>
          </View>
          <View style={styles.moduleInfo}>
            <Text style={styles.moduleTitle}>${name}</Text>
            <Text style={styles.moduleDesc}>Gestión y control de registros de ${name}</Text>
            <Text style={styles.moduleRoute}>/api/v1/${plural} • {stats.${varName}} registros</Text>
          </View>
          <Text style={styles.moduleArrow}>›</Text>
        </TouchableOpacity>\n`;

    if (idx < 3) {
      bottomNavTabs += `        <TouchableOpacity style={styles.bottomTab} onPress={() => navigation.navigate('${name}List')} activeOpacity={0.7}>
          <Text style={styles.bottomTabIcon}>${icon}</Text>
          <Text style={styles.bottomTabText}>${name}</Text>
        </TouchableOpacity>\n`;
    }
  });

  files.push({
    filename: 'HomeScreen.tsx',
    path: 'src/screens/HomeScreen.tsx',
    language: 'xml',
    content: `import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  StatusBar,
} from 'react-native';
import { api, loadSession, clearSession } from '../services/apiClient';

interface DashboardStats {
${kpiStatesDef}}

export function HomeScreen({ navigation }: any) {
  const [user, setUser] = useState<string>('Administrador');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [stats, setStats] = useState<DashboardStats>({
${kpiStatesInit}  });

  const loadData = useCallback(async () => {
    try {
      const session = await loadSession();
      if (session && session.name) setUser(session.name);

      const res = await Promise.allSettled([
${kpiFetches}      ]);

      setStats({
${kpiStatesExtract}      });
    } catch (_) {}
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Deseas cerrar tu sesión actual en este dispositivo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await clearSession();
            setUser('Invitado');
            Alert.alert('Sesión finalizada', 'Has cerrado sesión exitosamente.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.screenWrapper}>
      <StatusBar barStyle="light-content" backgroundColor="#090d16" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e8c39e" />}
      >
        <View style={styles.headerCard}>
          <View style={styles.headerLeft}>
            <View style={styles.clinicTag}>
              <Text style={styles.clinicTagText}>🌟 ${diagram.title || 'ARCHAI SISTEMA'}</Text>
            </View>
            <Text style={styles.welcomeText}>Hola, {user} 👋</Text>
            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.statusText}>Sistema Online • H2 & Ollama Local</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.aiBanner}
          onPress={() => navigation.navigate('Chat')}
          activeOpacity={0.85}
        >
          <View style={styles.aiBannerLeft}>
            <Text style={styles.aiBannerBadge}>🧠 IA LOCAL INTEGRADA</Text>
            <Text style={styles.aiBannerTitle}>Asistente Inteligente</Text>
            <Text style={styles.aiBannerDesc}>
              Consulta resúmenes, análisis y datos del sistema con qwen2.5:3b 100% offline.
            </Text>
            <View style={styles.aiActionRow}>
              <Text style={styles.aiActionText}>Abrir Chat IA ➔</Text>
            </View>
          </View>
          <View style={styles.aiBannerIconWrap}>
            <Text style={styles.aiBannerIcon}>🤖</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>MÉTRICAS DEL SISTEMA (KPIS)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpiScroll}>
${kpiCards}        </ScrollView>

        <Text style={styles.sectionTitle}>MÓDULOS DEL SISTEMA</Text>
${moduleCards}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Backend Spring Boot 3 & Ollama local</Text>
          <Text style={styles.footerSub}>Generado con ArchAI CASE Studio</Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomTab} onPress={() => {}} activeOpacity={0.7}>
          <Text style={styles.bottomTabIcon}>🏠</Text>
          <Text style={[styles.bottomTabText, styles.bottomTabActiveText]}>Inicio</Text>
        </TouchableOpacity>
${bottomNavTabs}        <TouchableOpacity style={styles.bottomTab} onPress={() => navigation.navigate('Chat')} activeOpacity={0.7}>
          <Text style={styles.bottomTabIcon}>🤖</Text>
          <Text style={[styles.bottomTabText, { color: '#e8c39e' }]}>IA Chat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: '#090d16' },
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 90 },
  headerCard: {
    backgroundColor: '#12182b',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#1f2742',
    marginBottom: 16,
  },
  headerLeft: { flex: 1 },
  clinicTag: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  clinicTagText: { color: '#60a5fa', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  welcomeText: { fontSize: 22, fontWeight: '800', color: '#f5e1ce' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginRight: 6 },
  statusText: { color: '#8892b0', fontSize: 11 },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  logoutIcon: { fontSize: 16, marginBottom: 2 },
  logoutText: { color: '#ef4444', fontSize: 11, fontWeight: '700' },
  aiBanner: {
    backgroundColor: '#231f61',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#4338ca',
    marginBottom: 20,
  },
  aiBannerLeft: { flex: 1, paddingRight: 10 },
  aiBannerBadge: { color: '#fbbf24', fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  aiBannerTitle: { color: '#ffffff', fontSize: 17, fontWeight: '800', marginBottom: 4 },
  aiBannerDesc: { color: '#c7d2fe', fontSize: 12, lineHeight: 16, marginBottom: 10 },
  aiActionRow: { backgroundColor: '#3730a3', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start' },
  aiActionText: { color: '#e8c39e', fontSize: 12, fontWeight: '700' },
  aiBannerIconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  aiBannerIcon: { fontSize: 34 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#8892b0', letterSpacing: 1, marginBottom: 10, marginTop: 4 },
  kpiScroll: { marginBottom: 20, flexDirection: 'row' },
  kpiCard: {
    backgroundColor: '#12182b',
    borderRadius: 14,
    padding: 14,
    width: 110,
    marginRight: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  kpiIcon: { fontSize: 22, marginBottom: 6 },
  kpiValue: { color: '#ffffff', fontSize: 20, fontWeight: '900' },
  kpiLabel: { color: '#8892b0', fontSize: 11, marginTop: 2, textAlign: 'center' },
  moduleCard: {
    backgroundColor: '#12182b',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1f2742',
  },
  moduleIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#1c243f', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  moduleIcon: { fontSize: 20 },
  moduleInfo: { flex: 1 },
  moduleTitle: { color: '#f5e1ce', fontSize: 15, fontWeight: '700' },
  moduleDesc: { color: '#8892b0', fontSize: 11, marginTop: 2 },
  moduleRoute: { color: '#60a5fa', fontSize: 10, marginTop: 4, fontWeight: '600' },
  moduleArrow: { color: '#8892b0', fontSize: 24, fontWeight: '300', marginLeft: 8 },
  footerContainer: { marginTop: 20, alignItems: 'center', paddingVertical: 12 },
  footerText: { color: '#64748b', fontSize: 11, fontWeight: '600' },
  footerSub: { color: '#475569', fontSize: 10, marginTop: 2 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: '#0c101d',
    borderTopWidth: 1,
    borderTopColor: '#1f2742',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 8,
  },
  bottomTab: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  bottomTabIcon: { fontSize: 18, marginBottom: 2 },
  bottomTabText: { color: '#8892b0', fontSize: 10, fontWeight: '700' },
  bottomTabActiveText: { color: '#60a5fa' },
});
`
  });

  // ── src/screens/ChatScreen.tsx ──
  files.push({
    filename: 'ChatScreen.tsx',
    path: 'src/screens/ChatScreen.tsx',
    language: 'xml',
    content: `import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { chatWithAI } from '../services/apiClient';

interface Message { role: 'user' | 'ai'; text: string; }

export function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);
    try {
      const reply = await chatWithAI(text);
      const aiMsg: Message = { role: 'ai', text: reply || 'Respuesta de la IA.' };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errDetail = err && err.message ? String(err.message) : 'Verifica si Ollama está en ejecución';
      const fallbackMsg: Message = {
        role: 'ai',
        text: '⚠️ Asistente IA no disponible: ' + errDetail,
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(_, i) => String(i)}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
            <Text style={item.role === 'user' ? styles.userText : styles.aiText}>{item.text}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Escribe una pregunta para qwen2.5:3b (IA local, sin internet)</Text>}
      />
      {loading && <ActivityIndicator color="#e8c39e" style={{ marginBottom: 8 }} />}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Pregúntale a la IA local…"
          placeholderTextColor="#8892b0"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={send}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={send} disabled={loading}>
          <Text style={styles.sendText}>➤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000020' },
  empty: { color: '#8892b0', textAlign: 'center', marginTop: 30, fontSize: 13 },
  bubble: { maxWidth: '85%', borderRadius: 12, padding: 12, marginVertical: 4 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#2f2c79' },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: '#171a4a' },
  userText: { color: '#f5e1ce', fontSize: 14 },
  aiText: { color: '#e8c39e', fontSize: 14 },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1, borderTopColor: '#171a4a' },
  input: { flex: 1, backgroundColor: '#171a4a', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: '#f5e1ce', fontSize: 14 },
  sendBtn: { marginLeft: 8, backgroundColor: '#2f2c79', borderRadius: 10, padding: 12, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: '#e8c39e', fontSize: 16, fontWeight: '800' },
});
`
  });

  // ── Componente Reutilizable DatePickerField (Calendario Interactivo) ──
  files.push({
    filename: 'DatePickerField.tsx',
    path: 'src/components/DatePickerField.tsx',
    language: 'xml',
    content: `import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';

interface DatePickerFieldProps {
  label: string;
  value?: string;
  onChange: (dateStr: string) => void;
  isDateTime?: boolean;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function DatePickerField({ label, value, onChange, isDateTime }: DatePickerFieldProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const initDate = () => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  };

  const parsed = initDate();
  const [year, setYear] = useState(parsed.getFullYear());
  const [month, setMonth] = useState(parsed.getMonth());
  const [selectedDay, setSelectedDay] = useState(parsed.getDate());
  const [hour, setHour] = useState(parsed.getHours());
  const [minute, setMinute] = useState(parsed.getMinutes());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDay(today.getDate());
    setHour(today.getHours());
    setMinute(today.getMinutes());
  };

  const confirmDate = (dayOverride?: number) => {
    const d = dayOverride ?? selectedDay;
    const yStr = String(year).padStart(4, '0');
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    if (isDateTime) {
      const hh = String(hour).padStart(2, '0');
      const mm = String(minute).padStart(2, '0');
      onChange(\`\${yStr}-\${mStr}-\${dStr}T\${hh}:\${mm}:00\`);
    } else {
      onChange(\`\${yStr}-\${mStr}-\${dStr}\`);
    }
    setModalVisible(false);
  };

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.triggerBtn}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.calendarIcon}>📅</Text>
        <Text style={value ? styles.valueText : styles.placeholderText}>
          {value || \`Seleccionar \${label} (AAAA-MM-DD)\`}
        </Text>
        <Text style={styles.triggerArrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📅 Seleccionar Fecha</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.monthSelector}>
              <TouchableOpacity style={styles.navBtn} onPress={() => setYear(y => y - 1)}>
                <Text style={styles.navBtnText}>«</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navBtn} onPress={handlePrevMonth}>
                <Text style={styles.navBtnText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthLabel}>
                {MONTH_NAMES[month]} {year}
              </Text>
              <TouchableOpacity style={styles.navBtn} onPress={handleNextMonth}>
                <Text style={styles.navBtnText}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navBtn} onPress={() => setYear(y => y + 1)}>
                <Text style={styles.navBtnText}>»</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.weekHeader}>
              {DAYS_OF_WEEK.map((d, i) => (
                <Text key={i} style={styles.weekDayText}>{d}</Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {calendarCells.map((day, idx) => {
                if (day === null) {
                  return <View key={'empty-' + idx} style={styles.emptyCell} />;
                }
                const isSelected = day === selectedDay;
                return (
                  <TouchableOpacity
                    key={'day-' + day}
                    style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                    onPress={() => setSelectedDay(day)}
                  >
                    <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {isDateTime && (
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Hora:</Text>
                <TouchableOpacity
                  style={styles.timeBtn}
                  onPress={() => setHour(h => (h + 1) % 24)}
                >
                  <Text style={styles.timeBtnText}>{String(hour).padStart(2, '0')} hrs</Text>
                </TouchableOpacity>
                <Text style={styles.timeSep}>:</Text>
                <TouchableOpacity
                  style={styles.timeBtn}
                  onPress={() => setMinute(m => (m + 5) % 60)}
                >
                  <Text style={styles.timeBtnText}>{String(minute).padStart(2, '0')} min</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.todayBtn} onPress={handleToday}>
                <Text style={styles.todayBtnText}>Hoy</Text>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={() => confirmDate()}
                >
                  <Text style={styles.confirmBtnText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 12 },
  label: { color: '#f5e1ce', fontSize: 13, fontWeight: '700', marginBottom: 4 },
  triggerBtn: {
    backgroundColor: '#171a4a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#2f2c79',
  },
  calendarIcon: { fontSize: 16, marginRight: 8 },
  valueText: { color: '#f5e1ce', fontSize: 14, flex: 1, fontWeight: '600' },
  placeholderText: { color: '#8892b0', fontSize: 14, flex: 1 },
  triggerArrow: { color: '#8892b0', fontSize: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#0c1024',
    borderRadius: 18,
    padding: 18,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#232a52',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: { color: '#f5e1ce', fontSize: 16, fontWeight: '800' },
  closeBtn: { color: '#8892b0', fontSize: 18, fontWeight: '700', paddingHorizontal: 6 },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#171a4a',
    borderRadius: 10,
    padding: 8,
    marginBottom: 12,
  },
  navBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  navBtnText: { color: '#e8c39e', fontSize: 16, fontWeight: '800' },
  monthLabel: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  weekDayText: { width: 38, textAlign: 'center', color: '#8892b0', fontSize: 11, fontWeight: '700' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  emptyCell: { width: 44, height: 38 },
  dayCell: {
    width: 44,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  dayCellSelected: { backgroundColor: '#2f2c79', borderWidth: 1, borderColor: '#e8c39e' },
  dayText: { color: '#f5e1ce', fontSize: 13, fontWeight: '600' },
  dayTextSelected: { color: '#e8c39e', fontWeight: '800' },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1a2242',
    gap: 8,
  },
  timeLabel: { color: '#8892b0', fontSize: 12 },
  timeBtn: { backgroundColor: '#171a4a', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  timeBtnText: { color: '#e8c39e', fontSize: 13, fontWeight: '700' },
  timeSep: { color: '#f5e1ce', fontSize: 16, fontWeight: '700' },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1a2242',
  },
  todayBtn: { backgroundColor: '#171a4a', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  todayBtnText: { color: '#8892b0', fontSize: 12, fontWeight: '700' },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  cancelBtnText: { color: '#8892b0', fontSize: 13 },
  confirmBtn: { backgroundColor: '#2f2c79', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  confirmBtnText: { color: '#e8c39e', fontSize: 13, fontWeight: '800' },
});
`
  });

  // ── Pantallas CRUD por entidad ──
  entities.forEach(cls => {
    const name = capitalize(cls.name);
    const plural = toKebabCase(cls.name) + 's';
    const fields = (cls.attributes || []).filter(a =>
      !(a.isPrimaryKey || a.name.toLowerCase() === 'id')
    );

    const listItemFields = fields.slice(0, 2).map(f => `            <Text style={styles.itemSub}>${f.name}: {String(item.${uncapitalize(f.name)})}</Text>`).join('\n');

    const formFields = fields.map(f => {
      const fname = uncapitalize(f.name);
      if (isDateField(f.name, f.type)) {
        return `            <DatePickerField
              label="${f.name}"
              value={form.${fname} !== undefined ? String(form.${fname}) : ''}
              isDateTime={${isDateTimeField(f.name, f.type)}}
              onChange={val => setForm(prev => ({ ...prev, ${fname}: val }))}
            />`;
      }
      const isMulti = f.type === 'BigDecimal';
      return `            <Text style={styles.label}>${f.name}</Text>
            <TextInput
              style={styles.input}
              placeholder="${f.type}"
              placeholderTextColor="#8892b0"
              value={form.${fname} !== undefined ? String(form.${fname}) : ''}
              onChangeText={t => setForm(prev => ({ ...prev, ${fname}: ${isMulti ? 't' : `coerce('${f.type}', t)`} }))}
            />`;
    }).join('\n');

    const buildPayload = fields.map(f => {
      const fname = uncapitalize(f.name);
      return `    ${fname}: form.${fname},`;
    }).join('\n');

    files.push({
      filename: `${name}Screens.tsx`,
      path: `src/screens/${name}Screens.tsx`,
      language: 'xml',
      content: `import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { api, cacheList, loadCachedList } from '../services/apiClient';
import { DatePickerField } from '../components/DatePickerField';
import { ${name} } from '../types/models';

// ---------- LISTA ----------
export function ${name}ListScreen({ navigation }: any) {
  const [items, setItems] = useState<${name}[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<${name}[]>('/v1/${plural}');
      setItems(data);
      cacheList('${plural}', data);
    } catch (e) {
      const cached = await loadCachedList('${plural}');
      if (cached) setItems(cached as ${name}[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);${''}

  const remove = (id: number) => {
    Alert.alert('Eliminar', '¿Eliminar registro #' + id + '?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
          try { await api.delete('/v1/${plural}/' + id); load(); }
          catch (e: any) { Alert.alert('Error', e?.message || 'No se pudo eliminar'); }
        } },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(_, i) => String(i)}
        refreshing={loading}
        onRefresh={load}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.itemTitle}>#{(item as any).id ?? '…'} ${name}</Text>
${listItemFields}
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('${name}Form', { item })}>
                <Text style={styles.editText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.delBtn} onPress={() => remove((item as any).id)}>
                <Text style={styles.delText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          loading
            ? <ActivityIndicator color="#e8c39e" style={{ marginTop: 30 }} />
            : <Text style={styles.empty}>Sin registros. Toca "Nuevo" para crear.</Text>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('${name}Form', {})}>
        <Text style={styles.fabText}>＋ Nuevo ${name}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------- FORMULARIO (crear / editar) ----------
const coerce = (t: string, v: string) => {
  switch (t) {
    case 'Long': case 'Integer': case 'Double': case 'BigDecimal': return v === '' ? undefined : Number(v);
    case 'Boolean': return v === 'true';
    default: return v;
  }
};

export function ${name}FormScreen({ route, navigation }: any) {
  const editing: ${name} | undefined = route?.params?.item;
  const [form, setForm] = useState<${name}>(editing ?? {});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const body = {
${buildPayload}      };
      if (editing?.id) {
        await api.put('/v1/${plural}/' + editing.id, body);
      } else {
        await api.post('/v1/${plural}', body);
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollViewWrapper>
${formFields}
      <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
        <Text style={styles.saveText}>{saving ? 'Guardando…' : editing?.id ? '💾 Actualizar' : '💾 Crear'}</Text>
      </TouchableOpacity>
    </ScrollViewWrapper>
  );
}

const ScrollViewWrapper = ({ children }: any) => (
  <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
    {children}
  </ScrollView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000020' },
  card: { backgroundColor: '#171a4a', borderRadius: 12, padding: 14, marginBottom: 10 },
  itemTitle: { color: '#f5e1ce', fontSize: 15, fontWeight: '800' },
  itemSub: { color: '#8892b0', fontSize: 12, marginTop: 4 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, gap: 8 },
  editBtn: { backgroundColor: '#2f2c79', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  editText: { color: '#e8c39e', fontSize: 12, fontWeight: '700' },
  delBtn: { backgroundColor: 'rgba(239,68,68,0.2)', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  delText: { color: '#ef4444', fontSize: 12, fontWeight: '700' },
  fab: { position: 'absolute', right: 16, bottom: 20, backgroundColor: '#2f2c79', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12 },
  fabText: { color: '#e8c39e', fontSize: 14, fontWeight: '800' },
  empty: { color: '#8892b0', textAlign: 'center', marginTop: 40 },
  formContainer: { flexGrow: 1, backgroundColor: '#000020', padding: 16, paddingBottom: 80 },
  label: { color: '#f5e1ce', fontSize: 13, fontWeight: '700', marginTop: 12, marginBottom: 4 },
  input: { backgroundColor: '#171a4a', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#f5e1ce', fontSize: 14 },
  saveBtn: { backgroundColor: '#2f2c79', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 20 },
  saveText: { color: '#e8c39e', fontSize: 15, fontWeight: '800' },
});
`
    });
  });

  // ── Android build & gradle files ──
  files.push({
    filename: 'settings.gradle',
    path: 'android/settings.gradle',
    language: 'xml',
    content: `rootProject.name = 'ArchAIApp'
apply from: file("../node_modules/@react-native-community/cli-platform-android/native_modules.gradle"); applyNativeModulesSettingsGradle(settings)
include ':app'
includeBuild('../node_modules/@react-native/gradle-plugin')
`
  });

  files.push({
    filename: 'gradle.properties',
    path: 'android/gradle.properties',
    language: 'xml',
    content: `android.useAndroidX=true
android.enableJetifier=true
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
`
  });

  files.push({
    filename: 'build.gradle',
    path: 'android/build.gradle',
    language: 'xml',
    content: `buildscript {
    ext {
        buildToolsVersion = "34.0.0"
        minSdkVersion = 21
        compileSdkVersion = 34
        targetSdkVersion = 34
        ndkVersion = "25.1.8937393"
        kotlinVersion = "1.8.0"
    }
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:8.1.1")
        classpath("com.facebook.react:react-native-gradle-plugin")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")
    }
}

apply plugin: "com.facebook.react.rootproject"
`
  });

  files.push({
    filename: 'build.gradle',
    path: 'android/app/build.gradle',
    language: 'xml',
    content: `apply plugin: "com.android.application"
apply plugin: "org.jetbrains.kotlin.android"
apply plugin: "com.facebook.react"

react {
}

def enableProguardInReleaseBuilds = false
def jscFlavor = 'org.webkit:android-jsc:+'

android {
    ndkVersion rootProject.ext.ndkVersion
    buildToolsVersion rootProject.ext.buildToolsVersion
    compileSdk rootProject.ext.compileSdkVersion

    namespace "com.archai.app"
    defaultConfig {
        applicationId "com.archai.app"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "1.0"
    }
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            signingConfig signingConfigs.debug
            minifyEnabled enableProguardInReleaseBuilds
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
}

dependencies {
    implementation("com.facebook.react:react-android")
    implementation("com.facebook.react:hermes-android")
}

apply from: file("../../node_modules/@react-native-community/cli-platform-android/native_modules.gradle"); applyNativeModulesAppBuildGradle(project)
`
  });

  files.push({
    filename: 'MainActivity.java',
    path: 'android/app/src/main/java/com/archai/app/MainActivity.java',
    language: 'java',
    content: `package com.archai.app;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;
import android.os.Bundle;

public class MainActivity extends ReactActivity {

  @Override
  protected String getMainComponentName() {
    return "ArchAIApp";
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(null);
  }

  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new DefaultReactActivityDelegate(
        this,
        getMainComponentName(),
        DefaultNewArchitectureEntryPoint.getFabricEnabled());
  }
}
`
  });

  files.push({
    filename: 'MainApplication.java',
    path: 'android/app/src/main/java/com/archai/app/MainApplication.java',
    language: 'java',
    content: `package com.archai.app;

import android.app.Application;
import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.soloader.SoLoader;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost =
      new DefaultReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
          return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
          @SuppressWarnings("UnnecessaryLocalVariable")
          List<ReactPackage> packages = new PackageList(this).getPackages();
          return packages;
        }

        @Override
        protected String getJSMainModuleName() {
          return "index";
        }

        @Override
        protected boolean isNewArchEnabled() {
          return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
        }

        @Override
        protected Boolean isHermesEnabled() {
          return BuildConfig.IS_HERMES_ENABLED;
        }
      };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, false);
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      DefaultNewArchitectureEntryPoint.load();
    }
  }
}
`
  });

  files.push({
    filename: 'styles.xml',
    path: 'android/app/src/main/res/values/styles.xml',
    language: 'xml',
    content: `<resources>
    <style name="AppTheme" parent="Theme.AppCompat.DayNight.NoActionBar">
    </style>
</resources>
`
  });

  files.push({
    filename: 'strings.xml',
    path: 'android/app/src/main/res/values/strings.xml',
    language: 'xml',
    content: `<resources>
    <string name="app_name">${appName}</string>
</resources>
`
  });

  // ── Android cleartext (HTTP en red local) ──
  files.push({
    filename: 'AndroidManifest.xml',
    path: 'android/app/src/main/AndroidManifest.xml',
    language: 'xml',
    content: `<manifest xmlns:android="http://schemas.android.com/apk/res/android">

  <uses-permission android:name="android.permission.INTERNET" />

  <!-- Permite HTTP en la red local (Wi-Fi) para conectar con el backend de tu PC -->
  <application
    android:name=".MainApplication"
    android:label="${appName}"
    android:usesCleartextTraffic="true"
    android:networkSecurityConfig="@xml/network_security_config"
    android:theme="@style/AppTheme">
    <activity android:name=".MainActivity" android:exported="true" android:configChanges="keyboard|keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize|uiMode">
      <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
      </intent-filter>
    </activity>
  </application>
</manifest>
`
  });

  files.push({
    filename: 'network_security_config.xml',
    path: 'android/app/src/main/res/xml/network_security_config.xml',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<!-- Habilita cleartext (http://) para la red local del backend generado por ArchAI -->
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>
`
  });

  // ── README.md del frontend ──
  files.push({
    filename: 'README.md',
    path: 'README.md',
    language: 'xml',
    content: `# ${projectTitleOrFallback(diagram.title)} — App móvil React Native (Android)

Generada por **ArchAI**. Se conecta al backend IA (Ollama local) por Wi-Fi y funciona offline.

## Requisitos
- Node 18+ y Android Studio (SDK + emulador o celular con depuración USB)
- El **backend** corriendo en tu PC (ver \`../README.md\` del proyecto hermano)

## Instalar y probar en tu celular

\`\`\`bash
# 1) Crea el proyecto base y copia estos archivos encima
npx @react-native-community/cli init ${appName}

# 2) Copia src/, App.tsx, package.json, tsconfig.json, babel.config.js
#    y android/app/src/main/ dentro del proyecto recién creado

# 3) Apunta BASE_URL a la IP de tu PC (misma red Wi-Fi)
#    Edita src/config/appConfig.ts  →  http://192.168.x.x:8080/api

# 4) Instala dependencias y corre en el celular por USB
cd ${appName}
npm install
npx react-native run-android
\`\`\`

> Si pruebas en el **emulador**, usa \`BASE_URL=http://10.0.2.2:8080/api\`.

## Funcionalidades
- **CRUD completo** de cada entidad del diagrama UML (pantallas Lista + Formulario)
- **Caché offline** con AsyncStorage: si el backend no responde, muestra los últimos datos
- **Asistente IA local**: chat con qwen2.5:3b (Ollama) a través de \`POST /api/ai/chat\`
- **Login JWT**: demo@archai.io / password123
`
  });

  return files;
}

function projectTitleOrFallback(title?: string): string {
  return title || 'ArchAI Studio';
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. FRONTEND FLUTTER (DART) — Material 3, NavigationBar Dock, Ollama IA, CRUD
// ─────────────────────────────────────────────────────────────────────────────
function mapJavaToDartType(javaType?: string): string {
  const t = (javaType || '').trim().toLowerCase();
  if (t === 'long' || t === 'integer' || t === 'int' || t === 'short' || t === 'byte') return 'int';
  if (t === 'double' || t === 'float' || t === 'bigdecimal' || t === 'number') return 'double';
  if (t === 'boolean' || t === 'bool') return 'bool';
  return 'String';
}

export function generateFlutterApp(diagram: ModeloDiagrama): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const entities = (diagram.classes || []).filter(
    c => c.stereotype !== 'Note' && c.stereotype !== 'Enum' && c.stereotype !== 'Interface' && !c.isInterface
  );
  const rawTitle = diagram.title || 'ArchAI_App';
  const appNameSnake = toSnakeCase(rawTitle).replace(/[^a-z0-9_]/g, '_') || 'archai_app';
  const projectTitle = projectTitleOrFallback(diagram.title);

  // ── pubspec.yaml ──
  files.push({
    filename: 'pubspec.yaml',
    path: 'pubspec.yaml',
    language: 'xml',
    content: `name: ${appNameSnake}
description: "${projectTitle} generado por ArchAI con IA local y Spring Boot"
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  http: ^1.2.0
  shared_preferences: ^2.2.2
  intl: ^0.19.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
`
  });

  // ── android/app/build.gradle ──
  files.push({
    filename: 'build.gradle',
    path: 'android/app/build.gradle',
    language: 'xml',
    content: `plugins {
    id "com.android.application"
    id "kotlin-android"
    id "dev.flutter.flutter-gradle-plugin"
}

android {
    namespace "com.archai.${appNameSnake}"
    compileSdk 34
    ndkVersion "25.1.8937393"

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = '17'
    }

    defaultConfig {
        applicationId "com.archai.${appNameSnake}"
        minSdkVersion 21
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }

    buildTypes {
        release {
            signingConfig signingConfigs.debug
        }
    }
}

flutter {
    source '../..'
}
`
  });

  // ── android/app/src/main/AndroidManifest.xml ──
  files.push({
    filename: 'AndroidManifest.xml',
    path: 'android/app/src/main/AndroidManifest.xml',
    language: 'xml',
    content: `<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
    <application
        android:label="${projectTitle}"
        android:name="\${applicationName}"
        android:icon="@mipmap/ic_launcher"
        android:usesCleartextTraffic="true">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:theme="@style/LaunchTheme"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"
            android:hardwareAccelerated="true"
            android:windowSoftInputMode="adjustResize">
            <meta-data
              android:name="io.flutter.embedding.android.NormalTheme"
              android:resource="@style/NormalTheme"
              />
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
        <meta-data
            android:name="flutterEmbedding"
            android:value="2" />
    </application>
</manifest>
`
  });

  // ── lib/config/app_config.dart ──
  files.push({
    filename: 'app_config.dart',
    path: 'lib/config/app_config.dart',
    language: 'xml',
    content: `class AppConfig {
  /// URL del backend Spring Boot generado por ArchAI.
  /// Para celular físico en red Wi-Fi: usa la IP de tu PC (ej: http://192.168.1.19:8088/api)
  /// Para emulador de Android Studio: usa http://10.0.2.2:8088/api
  static const String baseUrl = 'http://192.168.1.19:8088/api';
  static const String demoEmail = 'demo@archai.io';
  static const String demoPassword = 'password123';
  static const String aiModel = 'qwen2.5:3b';
}
`
  });

  // ── lib/services/api_service.dart ──
  files.push({
    filename: 'api_service.dart',
    path: 'lib/services/api_service.dart',
    language: 'xml',
    content: `import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';

class ApiService {
  static const String _tokenKey = 'archai_token';
  static const String _userKey = 'archai_user';

  static Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_tokenKey);
    final headers = <String, String>{
      'Content-Type': 'application/json; charset=UTF-8',
      'Accept': 'application/json',
    };
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer \$token';
    }
    return headers;
  }

  static Future<void> saveSession(String token, String name, String email) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_userKey, jsonEncode({'name': name, 'email': email}));
  }

  static Future<Map<String, String>?> getSession() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_tokenKey);
    final userJson = prefs.getString(_userKey);
    if (token != null && userJson != null) {
      final user = jsonDecode(userJson);
      return {'token': token, 'name': user['name'] ?? '', 'email': user['email'] ?? ''};
    }
    return null;
  }

  static Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
  }

  static Future<dynamic> get(String endpoint) async {
    final headers = await _getHeaders();
    final res = await http.get(Uri.parse('\${AppConfig.baseUrl}\$endpoint'), headers: headers);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return jsonDecode(utf8.decode(res.bodyBytes));
    }
    throw Exception('Error \${res.statusCode}: \${res.body}');
  }

  static Future<dynamic> post(String endpoint, Map<String, dynamic> body) async {
    final headers = await _getHeaders();
    final res = await http.post(
      Uri.parse('\${AppConfig.baseUrl}\$endpoint'),
      headers: headers,
      body: jsonEncode(body),
    );
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return jsonDecode(utf8.decode(res.bodyBytes));
    }
    throw Exception('Error \${res.statusCode}: \${res.body}');
  }

  static Future<dynamic> put(String endpoint, Map<String, dynamic> body) async {
    final headers = await _getHeaders();
    final res = await http.put(
      Uri.parse('\${AppConfig.baseUrl}\$endpoint'),
      headers: headers,
      body: jsonEncode(body),
    );
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return jsonDecode(utf8.decode(res.bodyBytes));
    }
    throw Exception('Error \${res.statusCode}: \${res.body}');
  }

  static Future<void> delete(String endpoint) async {
    final headers = await _getHeaders();
    final res = await http.delete(Uri.parse('\${AppConfig.baseUrl}\$endpoint'), headers: headers);
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw Exception('Error al eliminar: \${res.body}');
    }
  }

  static Future<String> chatWithAI(String message) async {
    try {
      final headers = await _getHeaders();
      final res = await http.post(
        Uri.parse('\${AppConfig.baseUrl}/ai/chat'),
        headers: headers,
        body: jsonEncode({'message': message}),
      ).timeout(const Duration(seconds: 120));
      if (res.statusCode == 200) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
        return data['reply'] ?? 'Respuesta de la IA recibida.';
      }
      return '⚠️ Error en asistente (\${res.statusCode}): \${res.body}';
    } catch (e) {
      return '⚠️ No se pudo contactar con la IA local: \$e';
    }
  }
}
`
  });

  // ── Modelos Dart para cada clase ──
  entities.forEach(cls => {
    const className = capitalize(cls.name);
    const fileName = toSnakeCase(cls.name);
    const attrs = (cls.attributes || []).filter(a => !(a.isPrimaryKey || a.name.toLowerCase() === 'id'));

    let fieldsDef = '  final int? id;\n';
    let ctorParams = '    this.id,\n';
    let fromJsonFields = `      id: json['id'] is int ? json['id'] : (json['id'] != null ? int.tryParse(json['id'].toString()) : null),\n`;
    let toJsonFields = `      if (id != null) 'id': id,\n`;

    attrs.forEach(attr => {
      const varName = uncapitalize(attr.name);
      const dartType = mapJavaToDartType(attr.type);
      fieldsDef += `  final ${dartType}? ${varName};\n`;
      ctorParams += `    this.${varName},\n`;

      if (dartType === 'int') {
        fromJsonFields += `      ${varName}: json['${varName}'] is int ? json['${varName}'] : (json['${varName}'] != null ? int.tryParse(json['${varName}'].toString()) : null),\n`;
      } else if (dartType === 'double') {
        fromJsonFields += `      ${varName}: json['${varName}'] is num ? (json['${varName}'] as num).toDouble() : (json['${varName}'] != null ? double.tryParse(json['${varName}'].toString()) : null),\n`;
      } else if (dartType === 'bool') {
        fromJsonFields += `      ${varName}: json['${varName}'] is bool ? json['${varName}'] : (json['${varName}']?.toString().toLowerCase() == 'true'),\n`;
      } else {
        fromJsonFields += `      ${varName}: json['${varName}']?.toString(),\n`;
      }

      toJsonFields += `      '${varName}': ${varName},\n`;
    });

    files.push({
      filename: `${fileName}.dart`,
      path: `lib/models/${fileName}.dart`,
      language: 'xml',
      content: `class ${className} {
${fieldsDef}
  ${className}({
${ctorParams}  });

  factory ${className}.fromJson(Map<String, dynamic> json) {
    return ${className}(
${fromJsonFields}    );
  }

  Map<String, dynamic> toJson() {
    return {
${toJsonFields}    };
  }
}
`
    });
  });

  // ── Pantallas CRUD para cada clase ──
  entities.forEach(cls => {
    const className = capitalize(cls.name);
    const fileName = toSnakeCase(cls.name);
    const plural = toKebabCase(cls.name) + 's';
    const attrs = (cls.attributes || []).filter(a => !(a.isPrimaryKey || a.name.toLowerCase() === 'id'));

    // Búsqueda en lista
    const searchConditions = attrs.slice(0, 3).map(a => {
      const vname = uncapitalize(a.name);
      return `(it.${vname}?.toString().toLowerCase().contains(q) ?? false)`;
    }).join(' ||\n                   ') || 'false';

    // Líneas de resumen en el card
    const cardSummaryWidgets = attrs.slice(0, 3).map(a => {
      const vname = uncapitalize(a.name);
      return `                                      Text('${a.name}: \${item.${vname} ?? "-"}', style: const TextStyle(color: Color(0xFF8892B0), fontSize: 13)),`;
    }).join('\n');

    // Controladores de formulario
    let ctlDefs = '';
    let ctlInits = '';
    let ctlDisposes = '';
    let ctlPayload = '';
    let formFieldsWidgets = '';

    attrs.forEach(a => {
      const vname = uncapitalize(a.name);
      const dartType = mapJavaToDartType(a.type);
      const ctlName = `_${vname}Controller`;
      ctlDefs += `  final ${ctlName} = TextEditingController();\n`;
      ctlInits += `    ${ctlName}.text = widget.item?.${vname}?.toString() ?? '';\n`;
      ctlDisposes += `    ${ctlName}.dispose();\n`;

      if (dartType === 'int') {
        ctlPayload += `      '${vname}': int.tryParse(${ctlName}.text.trim()),\n`;
      } else if (dartType === 'double') {
        ctlPayload += `      '${vname}': double.tryParse(${ctlName}.text.trim()),\n`;
      } else if (dartType === 'bool') {
        ctlPayload += `      '${vname}': ${ctlName}.text.trim().toLowerCase() == 'true',\n`;
      } else {
        ctlPayload += `      '${vname}': ${ctlName}.text.trim(),\n`;
      }

      if (isDateField(a.name, a.type)) {
        formFieldsWidgets += `              Text('${a.name}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 6),
              TextFormField(
                controller: ${ctlName},
                readOnly: true,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'Seleccionar ${a.name} (AAAA-MM-DD)',
                  hintStyle: const TextStyle(color: Color(0xFF64748B)),
                  filled: true,
                  fillColor: const Color(0xFF12182B),
                  suffixIcon: const Icon(Icons.calendar_month, color: Color(0xFFE8C39E)),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF1E293B))),
                ),
                onTap: () async {
                  final now = DateTime.now();
                  DateTime? initial;
                  if (${ctlName}.text.isNotEmpty) {
                    initial = DateTime.tryParse(${ctlName}.text);
                  }
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: initial ?? now,
                    firstDate: DateTime(1900),
                    lastDate: DateTime(2100),
                    builder: (context, child) {
                      return Theme(
                        data: ThemeData.dark().copyWith(
                          colorScheme: const ColorScheme.dark(
                            primary: Color(0xFF2F2C79),
                            onPrimary: Color(0xFFE8C39E),
                            surface: Color(0xFF12182B),
                            onSurface: Colors.white,
                          ),
                          dialogBackgroundColor: const Color(0xFF12182B),
                        ),
                        child: child!,
                      );
                    },
                  );
                  if (picked != null) {
                    final y = picked.year.toString().padLeft(4, '0');
                    final m = picked.month.toString().padLeft(2, '0');
                    final d = picked.day.toString().padLeft(2, '0');
                    ${ctlName}.text = '\$y-\$m-\$d';
                  }
                },
              ),
              const SizedBox(height: 16),
`;
      } else {
        formFieldsWidgets += `              Text('${a.name}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 6),
              TextFormField(
                controller: ${ctlName},
                style: const TextStyle(color: Colors.white),
                keyboardType: ${dartType === 'int' || dartType === 'double' ? 'TextInputType.number' : 'TextInputType.text'},
                decoration: InputDecoration(
                  hintText: 'Ingresa ${a.name} (${a.type || 'String'})',
                  hintStyle: const TextStyle(color: Color(0xFF64748B)),
                  filled: true,
                  fillColor: const Color(0xFF12182B),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF1E293B))),
                ),
              ),
              const SizedBox(height: 16),
`;
      }
    });

    files.push({
      filename: `${fileName}_screens.dart`,
      path: `lib/screens/${fileName}_screens.dart`,
      language: 'xml',
      content: `import 'package:flutter/material.dart';
import '../models/${fileName}.dart';
import '../services/api_service.dart';

class ${className}ListScreen extends StatefulWidget {
  const ${className}ListScreen({super.key});

  @override
  State<${className}ListScreen> createState() => _${className}ListScreenState();
}

class _${className}ListScreenState extends State<${className}ListScreen> {
  List<${className}> _items = [];
  bool _loading = true;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await ApiService.get('/v1/${plural}');
      if (res is List) {
        setState(() {
          _items = res.map((e) => ${className}.fromJson(e as Map<String, dynamic>)).toList();
          _loading = false;
        });
      } else {
        setState(() => _loading = false);
      }
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al cargar ${className}s: \$e')),
        );
      }
    }
  }

  Future<void> _delete(int id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF12182B),
        title: const Text('Eliminar ${className}', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: Text('¿Deseas eliminar el registro #\$id?', style: const TextStyle(color: Color(0xFF8892B0))),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancelar', style: TextStyle(color: Colors.white70)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Eliminar', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await ApiService.delete('/v1/${plural}/\$id');
        _load();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Registro eliminado')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error al eliminar: \$e')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _search.trim().isEmpty
        ? _items
        : _items.where((it) {
            final q = _search.toLowerCase();
            return (it.id?.toString().contains(q) ?? false) ||
                   ${searchConditions};
          }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFF090D16),
      appBar: AppBar(
        backgroundColor: const Color(0xFF12182B),
        title: const Text('${className}s', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Color(0xFF38BDF8)),
            onPressed: _load,
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Buscar ${className}...',
                hintStyle: const TextStyle(color: Color(0xFF8892B0)),
                prefixIcon: const Icon(Icons.search, color: Color(0xFF38BDF8)),
                filled: true,
                fillColor: const Color(0xFF12182B),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
              onChanged: (v) => setState(() => _search = v),
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF38BDF8)))
                : RefreshIndicator(
                    onRefresh: _load,
                    color: const Color(0xFF38BDF8),
                    backgroundColor: const Color(0xFF12182B),
                    child: filtered.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.inbox, size: 64, color: Color(0xFF475569)),
                                const SizedBox(height: 12),
                                const Text('No hay registros', style: TextStyle(color: Color(0xFF8892B0), fontSize: 16)),
                              ],
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                            itemCount: filtered.length,
                            itemBuilder: (ctx, i) {
                              final item = filtered[i];
                              return Card(
                                color: const Color(0xFF12182B),
                                margin: const EdgeInsets.only(bottom: 10),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14),
                                  side: const BorderSide(color: Color(0xFF1E293B)),
                                ),
                                child: Padding(
                                  padding: const EdgeInsets.all(14),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            '#\${item.id ?? "..."} ${className}',
                                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF38BDF8)),
                                          ),
                                          Row(
                                            children: [
                                              IconButton(
                                                icon: const Icon(Icons.edit, size: 20, color: Color(0xFFFCD34D)),
                                                onPressed: () async {
                                                  final ok = await Navigator.push(
                                                    context,
                                                    MaterialPageRoute(builder: (_) => ${className}FormScreen(item: item)),
                                                  );
                                                  if (ok == true) _load();
                                                },
                                              ),
                                              IconButton(
                                                icon: const Icon(Icons.delete_outline, size: 20, color: Colors.redAccent),
                                                onPressed: () => item.id != null ? _delete(item.id!) : null,
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                      const Divider(color: Color(0xFF1E293B)),
${cardSummaryWidgets}
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFF38BDF8),
        icon: const Icon(Icons.add, color: Color(0xFF090D16)),
        label: const Text('Nuevo ${className}', style: TextStyle(color: Color(0xFF090D16), fontWeight: FontWeight.bold)),
        onPressed: () async {
          final ok = await Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const ${className}FormScreen()),
          );
          if (ok == true) _load();
        },
      ),
    );
  }
}

class ${className}FormScreen extends StatefulWidget {
  final ${className}? item;
  const ${className}FormScreen({super.key, this.item});

  @override
  State<${className}FormScreen> createState() => _${className}FormScreenState();
}

class _${className}FormScreenState extends State<${className}FormScreen> {
  final _formKey = GlobalKey<FormState>();
${ctlDefs}  bool _saving = false;

  @override
  void initState() {
    super.initState();
${ctlInits}  }

  @override
  void dispose() {
${ctlDisposes}    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final payload = <String, dynamic>{
${ctlPayload}    };

    try {
      if (widget.item?.id != null) {
        await ApiService.put('/v1/${plural}/\${widget.item!.id}', payload);
      } else {
        await ApiService.post('/v1/${plural}', payload);
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(widget.item != null ? 'Actualizado con éxito' : 'Creado con éxito')),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: \$e')),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.item != null;
    return Scaffold(
      backgroundColor: const Color(0xFF090D16),
      appBar: AppBar(
        backgroundColor: const Color(0xFF12182B),
        title: Text(isEdit ? 'Editar ${className}' : 'Nuevo ${className}', style: const TextStyle(color: Colors.white)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
${formFieldsWidgets}              const SizedBox(height: 24),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF38BDF8),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: _saving ? null : _save,
                child: _saving
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF090D16)),
                      )
                    : Text(
                        isEdit ? '💾 Actualizar' : '💾 Crear',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF090D16)),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
`
    });
  });

  // ── lib/screens/chat_screen.dart (Asistente IA local Ollama) ──
  files.push({
    filename: 'chat_screen.dart',
    path: 'lib/screens/chat_screen.dart',
    language: 'xml',
    content: `import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ChatMessage {
  final String text;
  final bool isUser;
  final DateTime time;

  ChatMessage({required this.text, required this.isUser, DateTime? time})
      : time = time ?? DateTime.now();
}

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final List<ChatMessage> _messages = [
    ChatMessage(
      text: '¡Hola! Soy tu asistente inteligente offline potenciado por qwen2.5:3b de Ollama. Puedo responder preguntas, analizar registros y ayudarte a redactar notas.',
      isUser: false,
    ),
  ];
  final _textController = TextEditingController();
  final _scrollController = ScrollController();
  bool _loading = false;

  final List<String> _quickSuggestions = [
    '¿Qué registros hay pendientes?',
    'Resumen del estado actual',
    'Ayúdame a redactar un informe',
  ];

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _send(String text) async {
    final clean = text.trim();
    if (clean.isEmpty || _loading) return;

    _textController.clear();
    setState(() {
      _messages.add(ChatMessage(text: clean, isUser: true));
      _loading = true;
    });
    _scrollToBottom();

    final reply = await ApiService.chatWithAI(clean);
    if (mounted) {
      setState(() {
        _messages.add(ChatMessage(text: reply, isUser: false));
        _loading = false;
      });
      _scrollToBottom();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF090D16),
      appBar: AppBar(
        backgroundColor: const Color(0xFF12182B),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFF4338CA).withOpacity(0.4),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.auto_awesome, color: Color(0xFF818CF8), size: 18),
            ),
            const SizedBox(width: 10),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Asistente IA', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                Text('qwen2.5:3b (Ollama Local)', style: TextStyle(fontSize: 11, color: Color(0xFF10B981))),
              ],
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (ctx, i) {
                final m = _messages[i];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    mainAxisAlignment: m.isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (!m.isUser) ...[
                        CircleAvatar(
                          radius: 16,
                          backgroundColor: const Color(0xFF4338CA),
                          child: const Icon(Icons.smart_toy, size: 18, color: Colors.white),
                        ),
                        const SizedBox(width: 8),
                      ],
                      Flexible(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: m.isUser ? const Color(0xFF0284C7) : const Color(0xFF12182B),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: m.isUser ? const Color(0xFF0284C7) : const Color(0xFF1E293B),
                            ),
                          ),
                          child: Text(
                            m.text,
                            style: const TextStyle(color: Colors.white, fontSize: 14, height: 1.4),
                          ),
                        ),
                      ),
                      if (m.isUser) const SizedBox(width: 8),
                    ],
                  ),
                );
              },
            ),
          ),
          if (_loading)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              alignment: Alignment.centerLeft,
              child: Row(
                children: [
                  const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF38BDF8)),
                  ),
                  const SizedBox(width: 10),
                  const Text('Pensando con IA local...', style: TextStyle(color: Color(0xFF8892B0), fontSize: 12)),
                ],
              ),
            ),
          // Sugerencias rápidas
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            child: Row(
              children: _quickSuggestions.map((s) => Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ActionChip(
                  backgroundColor: const Color(0xFF12182B),
                  side: const BorderSide(color: Color(0xFF1E293B)),
                  label: Text(s, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                  onPressed: () => _send(s),
                ),
              )).toList(),
            ),
          ),
          // Input bar
          Container(
            padding: const EdgeInsets.all(12),
            decoration: const BoxDecoration(
              color: Color(0xFF12182B),
              border: Border(top: BorderSide(color: Color(0xFF1E293B))),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _textController,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'Pregunta algo al asistente...',
                      hintStyle: const TextStyle(color: Color(0xFF64748B)),
                      filled: true,
                      fillColor: const Color(0xFF090D16),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: const BorderSide(color: Color(0xFF1E293B)),
                      ),
                    ),
                    onSubmitted: _send,
                  ),
                ),
                const SizedBox(width: 8),
                CircleAvatar(
                  backgroundColor: const Color(0xFF38BDF8),
                  child: IconButton(
                    icon: const Icon(Icons.send, color: Color(0xFF090D16), size: 18),
                    onPressed: () => _send(_textController.text),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
`
  });

  // ── lib/screens/dashboard_screen.dart (Dashboard con KPIs dinámicos, Logout y Módulos) ──
  const kpiColorsFlutter = ['0xFF38BDF8', '0xFF10B981', '0xFFF59E0B', '0xFF8B5CF6', '0xFFEC4899', '0xFF06B6D4'];
  const kpiIconsFlutter = ['Icons.people_outline', 'Icons.medical_services_outlined', 'Icons.calendar_month_outlined', 'Icons.description_outlined', 'Icons.medication_outlined', 'Icons.folder_outlined'];

  let screenImports = '';
  let kpiStateVars = '';
  let kpiFetchesCode = '';
  let kpiCardsWidgets = '';
  let moduleCardsWidgets = '';

  entities.forEach((cls, idx) => {
    const className = capitalize(cls.name);
    const fileName = toSnakeCase(cls.name);
    const plural = toKebabCase(cls.name) + 's';
    const varName = `_total${className}`;
    const colorHex = kpiColorsFlutter[idx % kpiColorsFlutter.length];
    const iconFlutter = kpiIconsFlutter[idx % kpiIconsFlutter.length];

    screenImports += `import '${fileName}_screens.dart';\n`;
    kpiStateVars += `  int ${varName} = 0;\n`;
    kpiFetchesCode += `      final res${className} = await ApiService.get('/v1/${plural}').catchError((_) => []);
      if (res${className} is List) ${varName} = res${className}.length;\n`;

    kpiCardsWidgets += `              _buildKpiCard(
                context,
                title: '${className}s',
                count: ${varName},
                icon: ${iconFlutter},
                color: const Color(${colorHex}),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ${className}ListScreen())),
              ),
`;

    moduleCardsWidgets += `              _buildModuleCard(
                context,
                title: '${className}s',
                subtitle: 'Gestionar catálogo',
                icon: ${iconFlutter},
                color: const Color(${colorHex}),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ${className}ListScreen())),
              ),
`;
  });

  files.push({
    filename: 'dashboard_screen.dart',
    path: 'lib/screens/dashboard_screen.dart',
    language: 'xml',
    content: `import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'chat_screen.dart';
${screenImports}
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  String _userName = 'Administrador';
  bool _loading = true;
${kpiStateVars}
  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    setState(() => _loading = true);
    final session = await ApiService.getSession();
    if (session != null && session['name'] != null && session['name']!.isNotEmpty) {
      _userName = session['name']!;
    }

    try {
${kpiFetchesCode}      if (mounted) setState(() => _loading = false);
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _handleLogout() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF12182B),
        title: const Text('Cerrar Sesión', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: const Text('¿Deseas cerrar tu sesión actual en este dispositivo?', style: TextStyle(color: Color(0xFF8892B0))),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancelar', style: TextStyle(color: Colors.white70)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            onPressed: () async {
              Navigator.pop(ctx);
              await ApiService.clearSession();
              setState(() => _userName = 'Invitado');
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Sesión cerrada correctamente')),
                );
              }
            },
            child: const Text('Cerrar Sesión', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF090D16),
      appBar: AppBar(
        backgroundColor: const Color(0xFF12182B),
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '${projectTitle}',
              style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.bold),
            ),
            Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(color: Color(0xFF10B981), shape: BoxShape.circle),
                ),
                const SizedBox(width: 5),
                Text(
                  'En línea • \$_userName',
                  style: const TextStyle(color: Color(0xFF8892B0), fontSize: 11),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.redAccent, size: 20),
            tooltip: 'Cerrar Sesión',
            onPressed: _handleLogout,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadDashboardData,
        color: const Color(0xFF38BDF8),
        backgroundColor: const Color(0xFF12182B),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Banner IA Asistente
              Container(
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF1E1B4B), Color(0xFF312E81)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF4338CA)),
                ),
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF59E0B).withOpacity(0.2),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text('IA LOCAL ACTIVA', style: TextStyle(color: Color(0xFFFCD34D), fontSize: 10, fontWeight: FontWeight.bold)),
                          ),
                          const SizedBox(height: 8),
                          const Text('Asistente Inteligente', style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          const Text('Consulta datos, resume registros y haz preguntas usando Ollama (qwen2.5:3b).', style: TextStyle(color: Color(0xFFC7D2FE), fontSize: 12)),
                          const SizedBox(height: 12),
                          ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF4F46E5),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            icon: const Icon(Icons.chat_bubble_outline, size: 16, color: Colors.white),
                            label: const Text('Abrir Chat IA', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ChatScreen())),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      width: 60,
                      height: 60,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.smart_toy_outlined, color: Color(0xFF818CF8), size: 34),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              // KPIs
              const Text('MÉTRICAS DEL SISTEMA', style: TextStyle(color: Color(0xFF8892B0), fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1)),
              const SizedBox(height: 12),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
${kpiCardsWidgets}                  ],
                ),
              ),
              const SizedBox(height: 24),
              // Módulos
              const Text('MÓDULOS DE GESTIÓN', style: TextStyle(color: Color(0xFF8892B0), fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1)),
              const SizedBox(height: 12),
              GridView.count(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                children: [
${moduleCardsWidgets}                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildKpiCard(
    BuildContext context, {
    required String title,
    required int count,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        width: 125,
        margin: const EdgeInsets.only(right: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFF12182B),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 10),
            Text(
              _loading ? '...' : '\$count',
              style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            Text(title, style: const TextStyle(color: Color(0xFF8892B0), fontSize: 12), overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
  }

  Widget _buildModuleCard(
    BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFF12182B),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFF1E293B)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: color.withOpacity(0.15), borderRadius: BorderRadius.circular(10)),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(height: 10),
            Text(title, style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold), overflow: TextOverflow.ellipsis),
            const SizedBox(height: 2),
            Text(subtitle, style: const TextStyle(color: Color(0xFF8892B0), fontSize: 11), overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
  }
}
`
  });

  // ── lib/main.dart (Material 3 Dark Theme + Dock NavigationBar) ──
  const topNavEntities = entities.slice(0, 2);
  let mainImports = `import 'screens/dashboard_screen.dart';\nimport 'screens/chat_screen.dart';\n`;
  topNavEntities.forEach(cls => {
    mainImports += `import 'screens/${toSnakeCase(cls.name)}_screens.dart';\n`;
  });

  let navDestinations = `        NavigationDestination(
          icon: Icon(Icons.dashboard_outlined),
          selectedIcon: Icon(Icons.dashboard, color: Color(0xFF38BDF8)),
          label: 'Inicio',
        ),
`;
  let tabScreens = `      const DashboardScreen(),\n`;

  topNavEntities.forEach((cls, i) => {
    const className = capitalize(cls.name);
    const icon = kpiIconsFlutter[i % kpiIconsFlutter.length];
    navDestinations += `        NavigationDestination(
          icon: Icon(${icon}),
          selectedIcon: Icon(${icon}, color: Color(0xFF38BDF8)),
          label: '${className}s',
        ),
`;
    tabScreens += `      const ${className}ListScreen(),\n`;
  });

  navDestinations += `        NavigationDestination(
          icon: Icon(Icons.smart_toy_outlined),
          selectedIcon: Icon(Icons.smart_toy, color: Color(0xFF38BDF8)),
          label: 'Chat IA',
        ),
`;
  tabScreens += `      const ChatScreen(),\n`;

  files.push({
    filename: 'main.dart',
    path: 'lib/main.dart',
    language: 'xml',
    content: `import 'package:flutter/material.dart';
${mainImports}
void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ArchAIApp());
}

class ArchAIApp extends StatelessWidget {
  const ArchAIApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '${projectTitle}',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF090D16),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF38BDF8),
          surface: Color(0xFF12182B),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF12182B),
          elevation: 0,
        ),
      ),
      home: const MainShell(),
    );
  }
}

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
${tabScreens}  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: Color(0xFF1E293B))),
        ),
        child: NavigationBar(
          backgroundColor: const Color(0xFF12182B),
          indicatorColor: const Color(0xFF38BDF8).withOpacity(0.2),
          selectedIndex: _currentIndex,
          onDestinationSelected: (idx) => setState(() => _currentIndex = idx),
          destinations: const [
${navDestinations}          ],
        ),
      ),
    );
  }
}
`
  });

  // ── README.md de Flutter ──
  files.push({
    filename: 'README.md',
    path: 'README.md',
    language: 'xml',
    content: `# ${projectTitle} — App Móvil Flutter (Android / iOS)

Generada automáticamente por **ArchAI**. Se conecta al backend Spring Boot 3 con IA local (Ollama) por Wi-Fi.

## Requisitos
- Flutter SDK 3.12+ (\`flutter doctor\`)
- Android Studio o celular con depuración USB conectada
- El **backend** corriendo en tu red local (ver \`../backend/README.md\`)

## Instrucciones de Ejecución

\`\`\`bash
# 1) Entrar al directorio
cd frontend_flutter

# 2) Descargar dependencias
flutter pub get

# 3) Configurar IP de tu PC (si es necesario)
# Edita lib/config/app_config.dart con la IP de tu máquina en la red Wi-Fi:
#   static const String baseUrl = 'http://192.168.x.x:8088/api';

# 4) Correr en tu celular o emulador
flutter run
\`\`\`

## Características Incluidas
- **Dashboard completo** con métricas en tiempo real (KPIs) y módulos interactivos
- **Cerrar Sesión (Logout)** con diálogo de confirmación
- **CRUD completo** para cada entidad del diagrama UML (Listado, Búsqueda, Creación, Edición y Eliminación)
- **Barra de Navegación Dock** inferior fluida (Material 3)
- **Asistente IA local** integrado con Ollama (qwen2.5:3b)
- **Autenticación JWT** persistente mediante \`shared_preferences\`
`
  });

  return files;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. EMPAQUETADO DEL PROYECTO COMPLETO (backend + React Native + Flutter)
// ─────────────────────────────────────────────────────────────────────────────
export interface CompletoProjectFile {
  path: string;
  content: string;
  filename: string;
}

export function generateProjectoCompleto(diagram: ModeloDiagrama): CompletoProjectFile[] {
  const backend = generateBackendCompletoConIA(diagram).map(f => ({
    path: `backend/${f.path}`,
    content: f.content,
    filename: f.filename
  }));
  const frontend = generateReactNativeApp(diagram).map(f => ({
    path: `frontend/${f.path}`,
    content: f.content,
    filename: f.filename
  }));
  const flutter = generateFlutterApp(diagram).map(f => ({
    path: `frontend_flutter/${f.path}`,
    content: f.content,
    filename: f.filename
  }));
  const rootReadme: CompletoProjectFile = {
    path: 'README.md',
    filename: 'README.md',
    content: `# ${diagram.title || 'ArchAI Studio'} — Proyecto completo generado por ArchAI

Este proyecto fue generado automáticamente por **ArchAI CASE Studio** a partir del diagrama UML.

## Estructura
- **backend/** — API Spring Boot 3 con IA local (Ollama qwen2.5:3b), H2 embebida y JWT. 100% offline.
- **frontend/** — App móvil React Native (Android) con Dashboard, KPIs, CRUD, caché offline y chat IA.
- **frontend_flutter/** — App móvil Flutter (Android / iOS) con Material 3, Dashboard, Dock bar, CRUD completo y chat IA.

## Inicio rápido (todo en la misma red Wi-Fi, sin internet)
\`\`\`bash
# 1) IA local
cd backend && docker compose up -d ollama && docker exec -it archai-ollama ollama pull qwen2.5:3b

# 2) Backend
cd backend && mvn spring-boot:run
#   → Swagger en http://192.168.x.x:8080/swagger-ui.html

# 3) App móvil Flutter (recomendado):
cd frontend_flutter && flutter pub get && flutter run

# 4) O bien App móvil React Native:
#    Ver instrucciones en frontend/README.md
\`\`\`

Credenciales demo: **demo@archai.io / password123**
`
  };
  return [rootReadme, ...backend, ...frontend, ...flutter];
}