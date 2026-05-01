# CONTEXT — Lao-tse Records Studio
> Última actualización: 2026-05-01

---

## ¿Qué es este proyecto?

**Lao-tse Records Studio** es la plataforma digital oficial del sello discográfico Lao-tse Records. Funciona como:

1. **Red social musical** ("El Muro") — artistas, productores y fans comparten posts con audio e imagen.
2. **Catálogo de streaming** — archivo oficial de todas las producciones del sello con player global.
3. **Vitrina de servicios** — Producción, Abogacía Musical, Distribución y Coaching.
4. **Agenda de eventos** — Conciertos, lanzamientos y showcases.

---

## Stack Técnico

| Capa | Tecnología | Versión |
|------|------------|---------|
| Backend | Go + chi router | 1.22 |
| Base de datos | PostgreSQL | 16 (Railway) |
| Frontend | React + Vite | 18.3 |
| Estilos | Tailwind CSS | 3.4 |
| Animaciones | Framer Motion | 11 |
| Estado global | Zustand | 4.5 |
| Auth | JWT HS256 | 72h TTL |
| Deploy | Railway (Docker) | — |

---

## Repositorio GitHub

```
https://github.com/freenorlanfire/LaotseRecordStudio.git
```
Branch principal: `main` → Railway autodespliega en cada push.

---

## Variables de Entorno (Railway)

| Variable | Valor en producción |
|----------|---------------------|
| `DATABASE_URL` | `postgresql://postgres:***@postgres.railway.internal:5432/railway` |
| `JWT_SECRET` | String aleatorio base64 (32 bytes) |
| `ENV` | `production` |
| `PORT` | Inyectado automáticamente por Railway |

> ⚠️ Nunca subir `.env` al repositorio. Está en `.gitignore`.

---

## API — Todos los Endpoints

### Health
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/health` | — | Status del servidor y DB |

### Auth
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Registro de usuario |
| POST | `/api/auth/login` | — | Login → JWT |
| GET | `/api/auth/me` | ✅ | Perfil propio |
| PUT | `/api/auth/profile` | ✅ | Actualizar avatar_url y bio |

### Users
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/users/:username` | — | Perfil público por username |
| GET | `/api/users` | admin | Listar todos los usuarios |
| PATCH | `/api/users/:id/role` | admin | Cambiar rol de usuario |

### Posts (El Muro)
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/posts?page=1` | Opcional | Feed paginado (20/página) |
| GET | `/api/posts/:id` | Opcional | Post individual |
| POST | `/api/posts` | ✅ | Crear post |
| POST | `/api/posts/:id/like` | ✅ | Toggle like |
| DELETE | `/api/posts/:id` | ✅ | Borrar (propio o admin) |

### Tracks (Catálogo)
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/tracks?page=1&genre=X&q=búsqueda` | — | Catálogo paginado |
| GET | `/api/tracks/:id` | — | Track individual |
| POST | `/api/tracks` | artist/admin | Subir track |
| PUT | `/api/tracks/:id` | artist/admin | Editar track |
| POST | `/api/tracks/:id/play` | — | Incrementar play count |
| DELETE | `/api/tracks/:id` | ✅ | Eliminar (propio o admin) |

### Events
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/events` | — | Próximos eventos |
| GET | `/api/events/:id` | — | Evento individual |
| POST | `/api/events` | admin | Crear evento |
| PUT | `/api/events/:id` | admin | Editar evento |
| DELETE | `/api/events/:id` | admin | Eliminar evento |

### Contact
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/contact` | — | Enviar formulario de contacto |
| GET | `/api/contacts` | admin | Ver todos los mensajes |

---

## Roles de usuario

| Rol | Permisos |
|-----|----------|
| `client` | Leer, postear en el muro, dar likes |
| `artist` | Todo de client + subir y editar sus tracks |
| `admin` | Control total — también puede cambiar roles vía API |

Para promover a alguien a admin, ejecutar en Railway → Postgres → Query:
```sql
UPDATE users SET role='admin' WHERE email='tu@email.com';
```

---

## Historial de fixes de Deploy

| Commit | Problema | Solución |
|--------|----------|----------|
| `fix: add go.sum` | `go.sum` no estaba en el repo | `go mod tidy` + push |
| `fix: use npm install` | `npm ci` requiere `package-lock.json` | Cambiar a `npm install` |
| `fix: downgrade React 18` | React 19 peer deps conflict | Bajar a React 18.3.1 |
| `fix: vite build only` | `tsc -b` bloqueaba por imports no usados | Solo `vite build`, tsconfig relajado |
| `fix: add /api/health` | Healthcheck Railway fallaba con 404 | Crear endpoint `/api/health` |
| `feat: all endpoints` | Endpoints faltantes en router | Agregar users, events CRUD, contacts list |

---

## Arquitectura — Patrón de binario único

```
Railway
  └── Go binary (./server)
        ├── /api/*         → handlers Go + PostgreSQL
        └── /*             → frontend/dist/ (React SPA)
                               └── index.html (fallback SPA routing)
```

El Dockerfile tiene 3 stages:
1. **frontend-builder** (node:20-alpine) → `npm install + vite build`
2. **go-builder** (golang:1.22-alpine) → `go build -o server`
3. **final** (alpine:3.19) → copia `server` + `frontend/dist`

---

## Estructura del proyecto

```
LaotseRecordStudio/
├── main.go                    ← Entry point, graceful shutdown
├── go.mod / go.sum
├── Dockerfile                 ← Multi-stage build
├── railway.toml               ← Config Railway (healthcheck, restart)
├── .env.example               ← Template de variables
├── .gitignore
├── README.md
├── CONTEXT.md                 ← Este archivo
├── ARCHITECTURE.md            ← Diagramas y decisiones técnicas
│
├── internal/
│   ├── config/config.go       ← Load() desde env vars
│   ├── database/database.go   ← pgxpool + schema SQL (CREATE IF NOT EXISTS)
│   ├── models/models.go       ← Structs Go + DTOs request/response
│   ├── handlers/
│   │   ├── helpers.go         ← respondJSON(), respondError()
│   │   ├── auth.go            ← Register, Login, Me, UpdateProfile
│   │   ├── users.go           ← GetByUsername, List, UpdateRole
│   │   ├── posts.go           ← List, GetOne, Create, ToggleLike, Delete
│   │   ├── tracks.go          ← List, GetOne, Create, Update, Play, Delete
│   │   └── events.go          ← Events CRUD + Contact handlers
│   ├── middleware/auth.go      ← Authenticate, OptionalAuth, RequireRole
│   └── router/router.go       ← chi routes + SPA fallback + /api/health
│
└── frontend/src/
    ├── App.tsx                 ← BrowserRouter + 5 rutas
    ├── index.css               ← Tailwind + custom components layer
    ├── lib/api.ts              ← fetch wrapper tipado + todos los types
    ├── store/
    │   ├── authStore.ts        ← Zustand persisted (user, token)
    │   └── playerStore.ts      ← Zustand efímero (queue, isPlaying)
    ├── components/
    │   ├── Layout/Navbar.tsx   ← Scroll-aware, mobile, auth badge
    │   ├── Layout/GlobalPlayer.tsx ← Player fijo, nunca se desmonta
    │   └── Auth/LoginModal.tsx ← Login/Register con ojo + validaciones
    └── pages/
        ├── Home.tsx            ← Hero + featured tracks + servicios
        ├── FeedPage.tsx        ← Muro social con likes y audio inline
        ├── CatalogPage.tsx     ← Tabla + cards + filtro género + búsqueda
        ├── EventsPage.tsx      ← Agenda con fechas y tickets
        └── ServicesPage.tsx    ← 4 servicios + formulario de contacto
```

---

## Cómo agregar funcionalidades

### Nuevo endpoint backend
1. Handler en `internal/handlers/nombre.go`
2. Registrar ruta en `internal/router/router.go`
3. Si hay nuevo modelo: `internal/models/models.go`
4. Si hay nueva tabla: añadir al `schema` en `internal/database/database.go`

### Nueva página frontend
1. Crear `frontend/src/pages/NuevaPagina.tsx`
2. Añadir `<Route>` en `frontend/src/App.tsx`
3. Añadir link en el array `LINKS` de `Navbar.tsx`
4. Si llama a la API: añadir método en `frontend/src/lib/api.ts`

### Workflow de deploy
```bash
# Desarrollar localmente
cd frontend && npm run dev   # en terminal 1
go run .                     # en terminal 2

# Subir cambios → Railway autodespliega
git add -A
git commit -m "feat/fix: descripción"
git push origin main
```

---

## Backlog sugerido

- [ ] Upload directo de audio/imagen a Cloudinary (firma backend)
- [ ] Perfil público de artista con discografía completa
- [ ] Sistema de comentarios en posts
- [ ] Dashboard admin con métricas (plays, likes, usuarios)
- [ ] Notificaciones en tiempo real (WebSockets)
- [ ] Player con shuffle, repeat, cola editable
- [ ] Sistema de followers entre usuarios
- [ ] Integración Stripe para tickets de eventos
