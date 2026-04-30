# Lao-tse Records — Studio Digital

Plataforma de streaming musical y red social para el sello discográfico **Lao-tse Records**. Construida con Go + React 19, diseñada para desplegarse en Railway como binario único.

---

## Stack

| Capa | Tecnología |
|------|------------|
| Backend | Go 1.22 + chi router |
| Base de datos | PostgreSQL 16 |
| Frontend | React 19 + Vite 5 |
| Estilos | Tailwind CSS 3 + Framer Motion |
| Estado | Zustand |
| Auth | JWT (HS256, 72h TTL) |
| Deploy | Railway (Docker) |

---

## Inicio Rápido

### 1. Requisitos

- Go 1.22+
- Node.js 20+
- PostgreSQL 14+

### 2. Clonar y configurar

```bash
git clone <repo-url>
cd LaotseRecordStudio

# Variables de entorno
cp .env.example .env
# Edita .env con tu DATABASE_URL y JWT_SECRET
```

### 3. Backend (Go)

```bash
go mod tidy
go run .
# API disponible en http://localhost:8080
```

### 4. Frontend (React)

```bash
cd frontend
npm install
npm run dev
# App disponible en http://localhost:5173
```

El proxy de Vite redirige `/api/*` → `localhost:8080` automáticamente.

### 5. Build de producción

```bash
# Build del frontend
cd frontend && npm run build && cd ..

# Build del binario Go (sirve el SPA)
go build -o server .
./server
```

---

## API Reference

### Auth

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registro de usuario |
| POST | `/api/auth/login` | Login → devuelve JWT |
| GET  | `/api/auth/me` | Perfil del usuario autenticado |

### Posts (El Muro)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET  | `/api/posts?page=1` | Opcional | Listado paginado |
| POST | `/api/posts` | ✅ | Crear post |
| POST | `/api/posts/:id/like` | ✅ | Toggle like |
| DELETE | `/api/posts/:id` | ✅ | Eliminar post |

### Tracks (Catálogo)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET  | `/api/tracks?page=1&genre=` | — | Catálogo paginado |
| POST | `/api/tracks` | artist/admin | Subir track |
| POST | `/api/tracks/:id/play` | — | Incrementar play count |
| DELETE | `/api/tracks/:id` | ✅ | Eliminar track |

### Eventos

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET  | `/api/events` | — | Próximos eventos |
| POST | `/api/events` | admin | Crear evento |

### Contacto

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/contact` | Enviar formulario |

---

## Roles de usuario

| Rol | Permisos |
|-----|----------|
| `client` | Leer, postear, dar likes |
| `artist` | Todo de client + subir tracks |
| `admin` | Control total |

---

## Despliegue en Railway

1. Crear proyecto en [railway.app](https://railway.app)
2. Agregar plugin **PostgreSQL** → Railway provee `DATABASE_URL` automáticamente
3. Conectar repositorio GitHub
4. Configurar variables de entorno:
   - `JWT_SECRET` → string aleatorio largo
   - `ENV` → `production`
5. Railway detecta el `Dockerfile` y despliega automáticamente

---

## Estructura del proyecto

```
LaotseRecordStudio/
├── main.go                    # Punto de entrada
├── go.mod / go.sum
├── Dockerfile
├── railway.toml
├── .env.example
├── internal/
│   ├── config/                # Variables de entorno
│   ├── database/              # Conexión PostgreSQL + schema
│   ├── models/                # Structs y DTOs
│   ├── handlers/              # Controladores HTTP
│   ├── middleware/            # JWT auth
│   └── router/                # Rutas chi + SPA fallback
└── frontend/
    ├── src/
    │   ├── App.tsx             # Router principal
    │   ├── pages/             # Home, Feed, Catalog, Events, Services
    │   ├── components/
    │   │   ├── Layout/        # Navbar, GlobalPlayer
    │   │   └── Auth/          # LoginModal
    │   ├── store/             # Zustand (auth, player)
    │   └── lib/               # API client + types
    ├── index.html
    ├── tailwind.config.js
    └── vite.config.ts
```

---

## Paleta de diseño

| Token | Valor | Uso |
|-------|-------|-----|
| `gold` | `#D4AF37` | Acentos, botones primarios, activos |
| `studio-black` | `#000000` | Fondo principal |
| `studio-card` | `#111111` | Tarjetas |
| `studio-border` | `#1A1A1A` | Bordes sutiles |

Tipografías: **Cormorant Garamond** (display), **Dancing Script** (logo), **Inter** (body).
