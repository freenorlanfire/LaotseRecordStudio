# ARCHITECTURE — Lao-tse Records Studio

## Diagrama de capas

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENTE (Browser)                    │
│                                                          │
│  React 19 SPA                                            │
│  ├── BrowserRouter (react-router-dom)                    │
│  │   ├── /            → Home.tsx                         │
│  │   ├── /feed        → FeedPage.tsx                     │
│  │   ├── /catalog     → CatalogPage.tsx                  │
│  │   ├── /events      → EventsPage.tsx                   │
│  │   └── /services    → ServicesPage.tsx                 │
│  │                                                       │
│  ├── Layout (siempre montado)                            │
│  │   ├── Navbar.tsx    — navegación + auth               │
│  │   └── GlobalPlayer.tsx — reproductor persistente      │
│  │                                                       │
│  ├── Zustand Stores                                      │
│  │   ├── authStore    (persiste en localStorage)         │
│  │   └── playerStore  (efímero, en memoria)              │
│  │                                                       │
│  └── lib/api.ts        — fetch wrapper tipado            │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/JSON
                    /api/* ↕ REST
┌────────────────────────▼────────────────────────────────┐
│                    SERVIDOR (Go)                          │
│                                                          │
│  main.go                                                 │
│  └── router/router.go (chi)                              │
│      ├── Middleware: Logger, Recoverer, CORS             │
│      ├── /api/auth/*  → handlers/auth.go                 │
│      ├── /api/posts/* → handlers/posts.go                │
│      ├── /api/tracks/*→ handlers/tracks.go               │
│      ├── /api/events/*→ handlers/events.go               │
│      ├── /api/contact → handlers/events.go               │
│      └── /*           → static files (frontend/dist)     │
│                                                          │
│  middleware/auth.go                                      │
│  ├── Authenticate()   — require JWT                      │
│  ├── OptionalAuth()   — JWT si existe                    │
│  └── RequireRole()    — admin | artist | client          │
│                                                          │
│  internal/database/database.go                           │
│  └── pgxpool (25 conexiones max, 5 min)                  │
└────────────────────────┬────────────────────────────────┘
                         │ pgx/v5
┌────────────────────────▼────────────────────────────────┐
│                 PostgreSQL (Railway)                      │
│                                                          │
│  users        posts        post_likes                    │
│  tracks       events       contacts                      │
└─────────────────────────────────────────────────────────┘
```

## Flujo de request autenticado

```
Browser
  │  GET /api/posts  (Authorization: Bearer <jwt>)
  ▼
chi Router
  │
  ├── middleware.Logger         → log request
  ├── middleware.Recoverer      → recover panics
  ├── cors.Handler              → CORS headers
  ├── OptionalAuth(secret)      → parse JWT si existe
  │     └── context.WithValue(userID, role)
  │
  └── PostsHandler.List(w, r)
        │
        ├── r.Context().Value(UserIDKey) → userID
        ├── db.Pool.Query(...)           → rows
        └── respondJSON(w, 200, data)   → JSON
```

## Modelo de base de datos (ERD simplificado)

```
┌──────────────┐       ┌──────────────┐       ┌────────────────┐
│    users     │       │    posts     │       │  post_likes    │
├──────────────┤       ├──────────────┤       ├────────────────┤
│ id (UUID PK) │──┐    │ id (UUID PK) │──┐    │ post_id (FK)   │
│ username     │  │    │ user_id (FK) │◄─┘    │ user_id (FK)   │
│ email        │  └───►│ content      │       │ created_at     │
│ password_hash│  │    │ image_url    │       └────────────────┘
│ role         │  │    │ audio_url    │
│ avatar_url   │  │    │ likes_count  │
│ bio          │  │    │ created_at   │
│ created_at   │  │    └──────────────┘
└──────────────┘  │
                  │    ┌──────────────┐
                  │    │    tracks    │
                  │    ├──────────────┤
                  └───►│ artist_id    │
                       │ title        │
                       │ album        │
                       │ genre        │
                       │ duration     │
                       │ file_url     │
                       │ cover_url    │
                       │ play_count   │
                       │ released_at  │
                       └──────────────┘

┌──────────────┐    ┌──────────────┐
│    events    │    │   contacts   │
├──────────────┤    ├──────────────┤
│ title        │    │ name         │
│ description  │    │ email        │
│ location     │    │ service      │
│ event_date   │    │ message      │
│ cover_url    │    │ created_at   │
│ ticket_url   │    └──────────────┘
└──────────────┘
```

## Estructura de archivos

```
LaotseRecordStudio/
├── main.go
├── go.mod
├── go.sum
├── Dockerfile
├── railway.toml
├── .env.example
├── .gitignore
├── README.md
├── CONTEXT.md
└── ARCHITECTURE.md
│
├── internal/
│   ├── config/
│   │   └── config.go          # Load() → *Config desde env
│   ├── database/
│   │   └── database.go        # Connect(), Migrate(), schema SQL
│   ├── models/
│   │   └── models.go          # Structs + DTOs (Request/Response)
│   ├── handlers/
│   │   ├── helpers.go         # respondJSON(), respondError()
│   │   ├── auth.go            # Register, Login, Me
│   │   ├── posts.go           # List, Create, ToggleLike, Delete
│   │   ├── tracks.go          # List, Create, IncrementPlay, Delete
│   │   └── events.go          # List, Create, Contact.Submit
│   ├── middleware/
│   │   └── auth.go            # Authenticate, OptionalAuth, RequireRole
│   └── router/
│       └── router.go          # chi router + SPA fallback
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── tsconfig.json
    └── src/
        ├── main.tsx
        ├── App.tsx             # BrowserRouter + Routes + GlobalPlayer
        ├── index.css           # Tailwind + custom layer components
        ├── lib/
        │   └── api.ts          # fetch wrapper + types + formatDuration
        ├── store/
        │   ├── authStore.ts    # Zustand auth (persisted)
        │   └── playerStore.ts  # Zustand player (in-memory)
        ├── components/
        │   ├── Layout/
        │   │   ├── Navbar.tsx
        │   │   └── GlobalPlayer.tsx
        │   └── Auth/
        │       └── LoginModal.tsx
        └── pages/
            ├── Home.tsx
            ├── FeedPage.tsx
            ├── CatalogPage.tsx
            ├── EventsPage.tsx
            └── ServicesPage.tsx
```

## Decisiones de seguridad

| Amenaza | Mitigación |
|---------|------------|
| SQL Injection | `pgx` con queries parametrizadas (`$1`, `$2`, ...) en todos los handlers |
| XSS | React escapa HTML por defecto; sin `dangerouslySetInnerHTML` |
| CSRF | JWT en header `Authorization` (no cookie), inmune a CSRF |
| Brute force | bcrypt cost factor 10; se puede agregar rate limiting con chi middleware |
| Token expiry | JWT con `ExpiresAt` a 72h; renovación automática pendiente |
| CORS | Configurado en chi middleware; cambiar `AllowedOrigins` en producción |
| Contraseñas | bcrypt con salt automático, hash nunca expuesto en JSON (`json:"-"`) |

## Guía de extensión

### Agregar un nuevo endpoint

1. Añadir el struct de handler en `internal/handlers/`
2. Añadir el método HTTP y ruta en `internal/router/router.go`
3. Si necesita un nuevo modelo, añadirlo en `internal/models/models.go`
4. Si necesita nueva tabla, añadirla al `schema` en `internal/database/database.go`

### Agregar una nueva página

1. Crear `frontend/src/pages/NuevaPagina.tsx`
2. Añadir `<Route>` en `frontend/src/App.tsx`
3. Añadir link en el array `LINKS` de `frontend/src/components/Layout/Navbar.tsx`
