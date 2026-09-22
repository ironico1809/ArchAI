# =========================================================
# Multi-Stage Build Dockerfile para ArchAI Frontend (React + Vite)
# Optimizado para AWS App Runner, Lightsail, EC2 o NGINX
# =========================================================

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar dependencias y cachear
COPY package.json package-lock.json ./
RUN npm ci

# Argumento para inyectar la URL del backend durante el build
ARG VITE_ARCHAI_API_URL=http://localhost:8000
ENV VITE_ARCHAI_API_URL=$VITE_ARCHAI_API_URL

# Copiar código fuente y compilar bundle de producción
COPY . .
RUN npm run build

# Stage 2: NGINX Alpine Runtime
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
