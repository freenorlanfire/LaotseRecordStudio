package handlers

import (
	"fmt"
	"net/http"
)

// SwaggerUI sirve la documentación interactiva en /api/docs
func SwaggerUI(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	fmt.Fprint(w, swaggerHTML)
}

// OpenAPISpec sirve la especificación OpenAPI 3.0 en /api/swagger.json
func OpenAPISpec(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprint(w, openAPIJSON)
}

const swaggerHTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Lao-tse Records — API Docs</title>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"/>
  <style>
    body { margin:0; background:#000; }
    .swagger-ui .topbar { background:#000; border-bottom:1px solid #1c1c1c; }
    .swagger-ui .topbar-wrapper img { content:url('/img/LaotseRecordStudio-1.jpg'); height:36px; }
    .swagger-ui .info .title { color:#C8960C; font-family:'Georgia',serif; }
    .swagger-ui .info { margin:20px 0; }
    .swagger-ui .scheme-container { background:#0e0e0e; padding:16px; border-radius:8px; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/swagger.json',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: 'BaseLayout',
      deepLinking: true,
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
    })
  </script>
</body>
</html>`

const openAPIJSON = `{
  "openapi": "3.0.3",
  "info": {
    "title": "Lao-tse Records Studio API",
    "description": "API oficial de la plataforma Lao-tse Records Studio. Red social musical y catálogo de streaming.",
    "version": "1.0.0",
    "contact": { "name": "Lao-tse Records", "url": "https://laotserecords.com" }
  },
  "servers": [{ "url": "/api", "description": "Production" }],
  "tags": [
    { "name": "Health",   "description": "Estado del servidor" },
    { "name": "Auth",     "description": "Autenticación y sesión" },
    { "name": "Users",    "description": "Perfiles de usuario" },
    { "name": "Posts",    "description": "El Muro — red social" },
    { "name": "Tracks",   "description": "Catálogo musical" },
    { "name": "Events",   "description": "Agenda de eventos" },
    { "name": "Contact",  "description": "Formularios de contacto" }
  ],
  "components": {
    "securitySchemes": {
      "BearerAuth": { "type": "http", "scheme": "bearer", "bearerFormat": "JWT" }
    },
    "schemas": {
      "User": {
        "type": "object",
        "properties": {
          "id":         { "type": "string", "format": "uuid" },
          "username":   { "type": "string" },
          "email":      { "type": "string" },
          "role":       { "type": "string", "enum": ["admin","artist","client"] },
          "avatar_url": { "type": "string", "nullable": true },
          "bio":        { "type": "string", "nullable": true },
          "created_at": { "type": "string", "format": "date-time" }
        }
      },
      "Post": {
        "type": "object",
        "properties": {
          "id":          { "type": "string" },
          "user_id":     { "type": "string" },
          "author":      { "$ref": "#/components/schemas/User" },
          "content":     { "type": "string" },
          "image_url":   { "type": "string", "nullable": true },
          "audio_url":   { "type": "string", "nullable": true },
          "audio_title": { "type": "string", "nullable": true },
          "likes_count": { "type": "integer" },
          "liked":       { "type": "boolean" },
          "created_at":  { "type": "string" }
        }
      },
      "Track": {
        "type": "object",
        "properties": {
          "id":          { "type": "string" },
          "title":       { "type": "string" },
          "artist_id":   { "type": "string" },
          "artist":      { "$ref": "#/components/schemas/User" },
          "album":       { "type": "string", "nullable": true },
          "genre":       { "type": "string", "nullable": true },
          "duration":    { "type": "integer", "nullable": true },
          "file_url":    { "type": "string" },
          "cover_url":   { "type": "string", "nullable": true },
          "play_count":  { "type": "integer" },
          "released_at": { "type": "string", "nullable": true },
          "created_at":  { "type": "string" }
        }
      },
      "Event": {
        "type": "object",
        "properties": {
          "id":          { "type": "string" },
          "title":       { "type": "string" },
          "description": { "type": "string", "nullable": true },
          "location":    { "type": "string", "nullable": true },
          "event_date":  { "type": "string", "format": "date-time" },
          "cover_url":   { "type": "string", "nullable": true },
          "ticket_url":  { "type": "string", "nullable": true }
        }
      },
      "APIResponse": {
        "type": "object",
        "properties": {
          "success": { "type": "boolean" },
          "data":    { "type": "object" },
          "error":   { "type": "string" }
        }
      }
    }
  },
  "paths": {
    "/health": {
      "get": {
        "tags": ["Health"], "summary": "Estado del servidor y base de datos",
        "responses": { "200": { "description": "OK" } }
      }
    },
    "/auth/register": {
      "post": {
        "tags": ["Auth"], "summary": "Registro de usuario",
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": {
            "type": "object", "required": ["username","email","password"],
            "properties": {
              "username": { "type": "string" },
              "email":    { "type": "string" },
              "password": { "type": "string", "minLength": 8 }
            }
          }}}
        },
        "responses": { "201": { "description": "Usuario creado + JWT" } }
      }
    },
    "/auth/login": {
      "post": {
        "tags": ["Auth"], "summary": "Login — devuelve JWT",
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": {
            "type": "object", "required": ["email","password"],
            "properties": {
              "email":    { "type": "string" },
              "password": { "type": "string" }
            }
          }}}
        },
        "responses": { "200": { "description": "JWT + User" }, "401": { "description": "Credenciales inválidas" } }
      }
    },
    "/auth/me": {
      "get": {
        "tags": ["Auth"], "summary": "Perfil del usuario autenticado",
        "security": [{ "BearerAuth": [] }],
        "responses": { "200": { "description": "User object" } }
      }
    },
    "/auth/profile": {
      "put": {
        "tags": ["Auth"], "summary": "Actualizar avatar y bio",
        "security": [{ "BearerAuth": [] }],
        "requestBody": {
          "content": { "application/json": { "schema": {
            "type": "object",
            "properties": {
              "avatar_url": { "type": "string" },
              "bio":        { "type": "string" }
            }
          }}}
        },
        "responses": { "200": { "description": "User actualizado" } }
      }
    },
    "/users/{username}": {
      "get": {
        "tags": ["Users"], "summary": "Perfil público por username",
        "parameters": [{ "in": "path", "name": "username", "required": true, "schema": { "type": "string" } }],
        "responses": { "200": { "description": "User" }, "404": { "description": "No encontrado" } }
      }
    },
    "/users": {
      "get": {
        "tags": ["Users"], "summary": "Listar usuarios (admin)",
        "security": [{ "BearerAuth": [] }],
        "responses": { "200": { "description": "Array de usuarios" } }
      }
    },
    "/users/{id}/role": {
      "patch": {
        "tags": ["Users"], "summary": "Cambiar rol de usuario (admin)",
        "security": [{ "BearerAuth": [] }],
        "parameters": [{ "in": "path", "name": "id", "required": true, "schema": { "type": "string" } }],
        "requestBody": {
          "content": { "application/json": { "schema": {
            "type": "object",
            "properties": { "role": { "type": "string", "enum": ["admin","artist","client"] } }
          }}}
        },
        "responses": { "200": { "description": "Rol actualizado" } }
      }
    },
    "/posts": {
      "get": {
        "tags": ["Posts"], "summary": "Feed paginado",
        "parameters": [{ "in": "query", "name": "page", "schema": { "type": "integer", "default": 1 } }],
        "responses": { "200": { "description": "Lista paginada de posts" } }
      },
      "post": {
        "tags": ["Posts"], "summary": "Crear post",
        "security": [{ "BearerAuth": [] }],
        "requestBody": {
          "content": { "application/json": { "schema": {
            "type": "object", "required": ["content"],
            "properties": {
              "content":     { "type": "string" },
              "image_url":   { "type": "string" },
              "audio_url":   { "type": "string" },
              "audio_title": { "type": "string" }
            }
          }}}
        },
        "responses": { "201": { "description": "Post creado" } }
      }
    },
    "/posts/{id}/like": {
      "post": {
        "tags": ["Posts"], "summary": "Toggle like",
        "security": [{ "BearerAuth": [] }],
        "parameters": [{ "in": "path", "name": "id", "required": true, "schema": { "type": "string" } }],
        "responses": { "200": { "description": "liked + likes_count" } }
      }
    },
    "/posts/{id}": {
      "delete": {
        "tags": ["Posts"], "summary": "Eliminar post",
        "security": [{ "BearerAuth": [] }],
        "parameters": [{ "in": "path", "name": "id", "required": true, "schema": { "type": "string" } }],
        "responses": { "200": { "description": "Eliminado" } }
      }
    },
    "/tracks": {
      "get": {
        "tags": ["Tracks"], "summary": "Catálogo paginado",
        "parameters": [
          { "in": "query", "name": "page",  "schema": { "type": "integer" } },
          { "in": "query", "name": "genre", "schema": { "type": "string"  } },
          { "in": "query", "name": "q",     "schema": { "type": "string"  } }
        ],
        "responses": { "200": { "description": "Tracks paginados" } }
      },
      "post": {
        "tags": ["Tracks"], "summary": "Subir track (artist/admin)",
        "security": [{ "BearerAuth": [] }],
        "requestBody": {
          "content": { "application/json": { "schema": {
            "type": "object", "required": ["title","file_url"],
            "properties": {
              "title":       { "type": "string" },
              "album":       { "type": "string" },
              "genre":       { "type": "string" },
              "duration":    { "type": "integer" },
              "file_url":    { "type": "string" },
              "cover_url":   { "type": "string" },
              "released_at": { "type": "string" }
            }
          }}}
        },
        "responses": { "201": { "description": "Track creado" } }
      }
    },
    "/tracks/{id}/play": {
      "post": {
        "tags": ["Tracks"], "summary": "Incrementar play count",
        "parameters": [{ "in": "path", "name": "id", "required": true, "schema": { "type": "string" } }],
        "responses": { "200": { "description": "OK" } }
      }
    },
    "/events": {
      "get": {
        "tags": ["Events"], "summary": "Próximos eventos",
        "responses": { "200": { "description": "Lista de eventos" } }
      },
      "post": {
        "tags": ["Events"], "summary": "Crear evento (admin)",
        "security": [{ "BearerAuth": [] }],
        "requestBody": {
          "content": { "application/json": { "schema": {
            "type": "object", "required": ["title","event_date"],
            "properties": {
              "title":       { "type": "string" },
              "description": { "type": "string" },
              "location":    { "type": "string" },
              "event_date":  { "type": "string", "format": "date-time" },
              "cover_url":   { "type": "string" },
              "ticket_url":  { "type": "string" }
            }
          }}}
        },
        "responses": { "201": { "description": "Evento creado" } }
      }
    },
    "/contact": {
      "post": {
        "tags": ["Contact"], "summary": "Enviar formulario de contacto",
        "requestBody": {
          "content": { "application/json": { "schema": {
            "type": "object", "required": ["name","email","message"],
            "properties": {
              "name":    { "type": "string" },
              "email":   { "type": "string" },
              "service": { "type": "string" },
              "message": { "type": "string" }
            }
          }}}
        },
        "responses": { "201": { "description": "Enviado" } }
      }
    },
    "/contacts": {
      "get": {
        "tags": ["Contact"], "summary": "Ver mensajes recibidos (admin)",
        "security": [{ "BearerAuth": [] }],
        "responses": { "200": { "description": "Lista de contactos" } }
      }
    }
  }
}`
