# =========================================================
# Multi-Stage Build Dockerfile para ArchAI Backend (Java 17)
# Optimizado para Render, Railway, AWS, Fly.io, Heroku o VPS
# =========================================================

# Stage 1: Build & Dependencies
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder
WORKDIR /app

# Copiar configuración Maven y descargar dependencias en capa cacheada
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copiar código fuente y compilar JAR empaquetado
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Minimal Production Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Crear usuario sin privilegios root para máxima seguridad
RUN addgroup -S archai && adduser -S archai -G archai
USER archai

# Copiar el ejecutable JAR desde el builder
COPY --from=builder /app/target/archai-backend-*.jar app.jar

# Exponer puerto dinámico de la nube o 8000 por defecto
EXPOSE 8000

# Variables de entorno JVM optimizadas para contenedores
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
