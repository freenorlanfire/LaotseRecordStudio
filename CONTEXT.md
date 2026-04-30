# CONTEXT — Lao-tse Records Studio

## ¿Qué es este proyecto?

**Lao-tse Records Studio** es la plataforma digital oficial del sello discográfico Lao-tse Records. Funciona simultáneamente como:

1. **Red social musical** ("El Muro") — donde artistas, productores y fans comparten contenido, audios e imágenes.
2. **Catálogo de streaming** — archivo oficial de todas las producciones del sello.
3. **Vitrina de servicios** — Producción, Abogacía Musical, Distribución y Coaching.
4. **Agenda de eventos** — Conciertos, lanzamientos y showcases.

---

## Decisiones de arquitectura

### Binario único (Go sirve el SPA)

El backend Go construye y sirve el build estático de React. Esto simplifica el despliegue en Railway a un solo servicio con un solo Dockerfile. En producción no hay servidor Node separado.

- Rutas `/api/*` → controladores Go
- Cualquier otra ruta → `frontend/dist/index.html` (React Router toma el control)

### PostgreSQL relacional

Se eligió PostgreSQL sobre una base de datos NoSQL porque:
- El muro social requiere JOINs eficientes (post + author)
- Los likes necesitan integridad referencial (tabla `post_likes` con PK compuesto)
- El catálogo de tracks tiene relaciones claras con artistas
- Railway ofrece PostgreSQL como plugin nativo con conexión automática

### JWT stateless

Autenticación sin sesiones en servidor. Los tokens duran 72 horas. El frontend los guarda en `localStorage` con la clave `ltr_token`. El store de Zustand persiste `user` y `token` en `localStorage` vía `persist` middleware.

### Zustand para estado global

Dos stores principales:
- **`authStore`**: usuario, token, login/logout. Persiste en `localStorage`.
- **`playerStore`**: cola de reproducción, índice, `isPlaying`, volumen. **No persiste** (se reinicia al refrescar, es correcto para un player de audio).

El `GlobalPlayer` es un componente fijo en el DOM que nunca se desmonta, garantizando reproducción continua entre navegaciones.

### URLs de media (CDN-ready)

Los archivos de audio y fotos se almacenan como URLs en la base de datos. Esto permite integrar cualquier CDN (Cloudinary, Supabase Storage, AWS S3) sin cambios en la lógica de negocio — solo cambia la URL que se guarda.

---

## Flujo de autenticación

```
Usuario → POST /api/auth/login
        ← { token, user }
        → localStorage.setItem('ltr_token', token)
        → authStore.setState({ user, token })

Peticiones autenticadas:
        → Header: Authorization: Bearer <token>
        → middleware/auth.go valida JWT
        → Inyecta userID y role en context
```

---

## Modelo de datos simplificado

```
users ──┬──< posts ──< post_likes
        │
        └──< tracks

events (standalone)
contacts (standalone)
```

---

## Variables de entorno necesarias

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `DATABASE_URL` | ✅ | Cadena de conexión PostgreSQL |
| `JWT_SECRET` | ✅ | Clave para firmar tokens JWT |
| `PORT` | No (default: 8080) | Puerto del servidor HTTP |
| `ENV` | No (default: development) | `development` o `production` |

---

## Convenciones de código

### Backend (Go)
- Package per layer: `config`, `database`, `models`, `handlers`, `middleware`, `router`
- Handlers retornan siempre `{ success: bool, data?: any, error?: string }`
- Errores de BD no se exponen al cliente (mensajes genéricos)
- Migraciones inline en `database.go` con `CREATE TABLE IF NOT EXISTS`

### Frontend (React)
- Un archivo por componente/página, sin barrel exports innecesarios
- `api.ts` como único punto de contacto con el backend
- Tailwind con tokens custom (`gold`, `studio-*`) definidos en `tailwind.config.js`
- Clases utility reutilizables en `index.css` como `@layer components`

---

## Próximas funcionalidades (backlog sugerido)

- [ ] Upload directo a Cloudinary (firma en backend, upload desde frontend)
- [ ] Perfil de artista (`/artist/:username`) con discografía
- [ ] Sistema de comentarios en posts
- [ ] Dashboard admin (estadísticas, gestión de usuarios)
- [ ] Notificaciones en tiempo real (WebSockets o SSE)
- [ ] Player con modo shuffle y repeat
- [ ] Suscripción/Follow entre usuarios
- [ ] Integración con Spotify para cruzar datos de streams
