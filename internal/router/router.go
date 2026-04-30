package router

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

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
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	authHandler := handlers.NewAuthHandler(db, jwtSecret)
	postsHandler := handlers.NewPostsHandler(db)
	tracksHandler := handlers.NewTracksHandler(db)
	eventsHandler := handlers.NewEventsHandler(db)
	contactHandler := handlers.NewContactHandler(db)

	auth := middleware.Authenticate(jwtSecret)
	optAuth := middleware.OptionalAuth(jwtSecret)
	adminOrArtist := middleware.RequireRole("admin", "artist")

	r.Route("/api", func(r chi.Router) {
		// Auth
		r.Post("/auth/register", authHandler.Register)
		r.Post("/auth/login", authHandler.Login)
		r.With(auth).Get("/auth/me", authHandler.Me)

		// Posts (feed)
		r.With(optAuth).Get("/posts", postsHandler.List)
		r.With(auth).Post("/posts", postsHandler.Create)
		r.With(auth).Post("/posts/{id}/like", postsHandler.ToggleLike)
		r.With(auth).Delete("/posts/{id}", postsHandler.Delete)

		// Tracks
		r.Get("/tracks", tracksHandler.List)
		r.With(auth, adminOrArtist).Post("/tracks", tracksHandler.Create)
		r.Post("/tracks/{id}/play", tracksHandler.IncrementPlay)
		r.With(auth).Delete("/tracks/{id}", tracksHandler.Delete)

		// Events
		r.Get("/events", eventsHandler.List)
		r.With(auth, middleware.RequireRole("admin")).Post("/events", eventsHandler.Create)

		// Contact
		r.Post("/contact", contactHandler.Submit)
	})

	// Serve React SPA — all non-API routes
	staticDir := "./frontend/dist"
	r.Get("/*", func(w http.ResponseWriter, r *http.Request) {
		path := filepath.Join(staticDir, r.URL.Path)
		// Serve file if exists, else fallback to index.html
		if _, err := os.Stat(path); err == nil && !strings.HasSuffix(path, "/") {
			http.ServeFile(w, r, path)
			return
		}
		http.ServeFile(w, r, filepath.Join(staticDir, "index.html"))
	})

	return r
}
