# ☕ ArchAI Backend — Spring Boot 3 (Java 17) & PostgreSQL

Backend de producción para la herramienta CASE colaborativa con IA **ArchAI**, preparado para ejecución local y despliegue inmediato en la nube (**Render**, **Railway**, **Fly.io**, **AWS**, **Docker**).

---

## 🚀 1. Cómo Ejecutar Localmente

### Opción A: Con Maven Wrapper (Directo)
```bash
# En la carpeta ArchAI-App/backend
.\mvnw.cmd spring-boot:run
```
* El servidor iniciará en: `http://localhost:8000`
* Health check: `http://localhost:8000/api/v1/status`
* Consola H2 (Base de datos en memoria): `http://localhost:8000/h2-console`

### Opción B: Con Docker Compose (Backend + PostgreSQL)
```bash
docker-compose up --build
```
* Levanta un contenedor PostgreSQL 16 en el puerto `5432` y el backend Spring Boot en el puerto `8000`.

---

## ☁️ 2. Cómo Subir a la Nube

### 🟢 Despliegue en Render (Gratis y Automático)
1. Sube tu código a GitHub / GitLab.
2. En [Render.com](https://render.com), haz clic en **New +** -> **Web Service**.
3. Conecta tu repositorio.
4. Render detectará automáticamente el archivo `Dockerfile` (o `render.yaml`).
5. Configura:
   - **Root Directory**: `ArchAI-App/backend`
   - **Environment**: `Docker`
   - **Port**: `8000`
6. (Opcional) Si creas una base de datos PostgreSQL en Render, añade la variable de entorno:
   - `SPRING_DATASOURCE_URL`: `jdbc:postgresql://<host-render>:5432/<db_name>`
   - `SPRING_DATASOURCE_USERNAME`: `<tu_usuario>`
   - `SPRING_DATASOURCE_PASSWORD`: `<tu_contraseña>`
7. Haz clic en **Create Web Service**. ¡Listo!

---

### 🟣 Despliegue en Railway
1. En [Railway.app](https://railway.app), haz clic en **New Project** -> **Deploy from GitHub repo**.
2. Selecciona tu repositorio y la carpeta `ArchAI-App/backend`.
3. Railway detectará el `Dockerfile` y el `railway.json`.
4. Añade un plugin de PostgreSQL con 1 clic en Railway si deseas base de datos persistente.
5. El proyecto se desplegará y te generará una URL pública `https://archai-backend-production.up.railway.app`.

---

## 📡 3. Endpoints REST Disponibles

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/v1/status` | Estado de salud del sistema y módulos activos |
| `POST` | `/api/v1/generator/preview` | Genera y previsualiza código Spring Boot 3, SQL, Postman y XMI |
| `POST` | `/api/v1/generator/zip` | Descarga archivo binario `.zip` con el proyecto Maven completo |
| `POST` | `/api/v1/generator/sql` | Genera script PostgreSQL DDL (`CREATE TABLE`, PKs, FKs) |
| `POST` | `/api/v1/generator/postman` | Genera JSON de colección Postman v2.1.0 con requests CRUD |
| `POST` | `/api/v1/generator/xmi` | Exporta diagrama a XML XMI 2.1 (Enterprise Architect) |
| `POST` | `/api/v1/diagrams/import-xmi` | Importa archivo `.xmi` de Enterprise Architect al canvas |
| `POST` | `/api/v1/diagrams` | Guarda un diagrama UML en base de datos PostgreSQL |
| `GET` | `/api/v1/diagrams` | Lista todos los diagramas guardados |
| `GET` | `/api/v1/diagrams/{id}` | Obtiene un diagrama por ID |
| `DELETE` | `/api/v1/diagrams/{id}` | Elimina un diagrama por ID |
| `GET` | `/api/v1/diagrams/templates/health` | Plantilla del caso de estudio de Licitación Ministerio de Salud |
| `POST` | `/api/v1/ai/voice/parse` | Parser NLP de comandos de voz para crear clases y atributos |
| `WS` | `/ws-archai` | STOMP WebSockets para sincronización de salas y cursores en tiempo real |
