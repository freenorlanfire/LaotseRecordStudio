package router

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/laotse-records/studio/internal/database"
	"github.com/laotse-records/studio/internal/handlers"
	"github.com/laotse-records/studio/internal/middleware"
)

func New(db *database.DB, jwtSecret string) http.Handler {
	r := chi.NewRouter()

	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.Timeout(60 * time.Second))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Request-ID"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	authHandler    := handlers.NewAuthHandler(db, jwtSecret)
	postsHandler   := handlers.NewPostsHandler(db)
	tracksHandler  := handlers.NewTracksHandler(db)
	eventsHandler  := handlers.NewEventsHandler(db)
	contactHandler := handlers.NewContactHandler(db)
	usersHandler   := handlers.NewUsersHandler(db)

	auth          := middleware.Authenticate(jwtSecret)
	optAuth       := middleware.OptionalAuth(jwtSecret)
	adminOrArtist := middleware.RequireRole("admin", "artist")
	adminOnly     := middleware.RequireRole("admin")

	r.Route("/api", func(r chi.Router) {

		// ── Docs (Swagger UI) ────────────────────────────────
		r.Get("/docs",         handlers.SwaggerUI)
		r.Get("/swagger.json", handlers.OpenAPISpec)

		// ── Health ───────────────────────────────────────────
		r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
			// Also ping the DB
			dbOk := db.Pool.Ping(r.Context()) == nil
			status := "ok"
			if !dbOk {
				status = "db_unreachable"
			}
			w.Header().Set("Content-Type", "application/json")
			code := http.StatusOK
			if !dbOk {
				code = http.StatusServiceUnavailable
			}
			w.WriteHeader(code)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"status":    status,
				"service":   "laotse-records-studio",
				"db":        dbOk,
				"timestamp": time.Now().UTC(),
			})
		})

		// ── Auth ─────────────────────────────────────────────
		r.Post("/auth/register", authHandler.Register)
		r.Post("/auth/login",    authHandler.Login)
		r.With(auth).Get("/auth/me",      authHandler.Me)
		r.With(auth).Put("/auth/profile", authHandler.UpdateProfile)

		// ── Users ─────────────────────────────────────────────
		r.Get("/users/{username}",         usersHandler.GetByUsername)   // perfil público
		r.With(auth, adminOnly).Get("/users", usersHandler.List)         // admin: listar usuarios
		r.With(auth, adminOnly).Patch("/users/{id}/role", usersHandler.UpdateRole) // admin: cambiar rol

		// ── Posts (El Muro) ──────────────────────────────────
		r.With(optAuth).Get("/posts",             postsHandler.List)
		r.With(auth).Post("/posts",               postsHandler.Create)
		r.With(optAuth).Get("/posts/{id}",        postsHandler.GetOne)
		r.With(auth).Post("/posts/{id}/like",     postsHandler.ToggleLike)
		r.With(auth).Delete("/posts/{id}",        postsHandler.Delete)

		// ── Tracks (Catálogo) ────────────────────────────────
		r.Get("/tracks",                          tracksHandler.List)
		r.With(auth, adminOrArtist).Post("/tracks", tracksHandler.Create)
		r.Get("/tracks/{id}",                     tracksHandler.GetOne)
		r.Post("/tracks/{id}/play",               tracksHandler.IncrementPlay)
		r.With(auth, adminOrArtist).Put("/tracks/{id}", tracksHandler.Update)
		r.With(auth).Delete("/tracks/{id}",       tracksHandler.Delete)

		// ── Events ───────────────────────────────────────────
		r.Get("/events",                          eventsHandler.List)
		r.Get("/events/{id}",                     eventsHandler.GetOne)
		r.With(auth, adminOnly).Post("/events",   eventsHandler.Create)
		r.With(auth, adminOnly).Put("/events/{id}", eventsHandler.Update)
		r.With(auth, adminOnly).Delete("/events/{id}", eventsHandler.Delete)

		// ── Contact / Servicios ──────────────────────────────
		r.Post("/contact",                        contactHandler.Submit)
		r.With(auth, adminOnly).Get("/contacts",  contactHandler.List) // admin: ver mensajes
	})

	// ── SPA fallback ─────────────────────────────────────────
	staticDir := "./frontend/dist"
	r.Get("/*", func(w http.ResponseWriter, r *http.Request) {
		path := filepath.Join(staticDir, filepath.Clean(r.URL.Path))
		if info, err := os.Stat(path); err == nil && !info.IsDir() {
			http.ServeFile(w, r, path)
			return
		}
		http.ServeFile(w, r, filepath.Join(staticDir, "index.html"))
	})

	return r
}
