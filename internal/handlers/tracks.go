package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/laotse-records/studio/internal/database"
	"github.com/laotse-records/studio/internal/middleware"
	"github.com/laotse-records/studio/internal/models"
)

type TracksHandler struct {
	db *database.DB
}

func NewTracksHandler(db *database.DB) *TracksHandler {
	return &TracksHandler{db: db}
}

// scanTracks lee filas de tracks con su artista
func scanTracks(rows pgx.Rows) []models.Track {
	tracks := make([]models.Track, 0)
	for rows.Next() {
		var t models.Track
		var a models.User
		if err := rows.Scan(
			&t.ID, &t.Title, &t.ArtistID, &t.Album, &t.Genre,
			&t.Duration, &t.FileURL, &t.CoverURL, &t.PlayCount,
			&t.ReleasedAt, &t.CreatedAt,
			&a.ID, &a.Username, &a.AvatarURL,
		); err != nil {
			continue
		}
		t.Artist = &a
		tracks = append(tracks, t)
	}
	return tracks
}

const trackSelect = `
	SELECT t.id, t.title, t.artist_id, t.album, t.genre, t.duration,
	       t.file_url, t.cover_url, t.play_count, t.released_at, t.created_at,
	       u.id, u.username, u.avatar_url
	FROM tracks t JOIN users u ON u.id = t.artist_id`

// GET /api/tracks
func (h *TracksHandler) List(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	limit  := 24
	offset := (page - 1) * limit
	genre  := r.URL.Query().Get("genre")
	search := r.URL.Query().Get("q")

	var (
		rows pgx.Rows
		err  error
		ctx  = r.Context()
	)

	switch {
	case search != "":
		like := "%" + search + "%"
		rows, err = h.db.Pool.Query(ctx,
			trackSelect+` WHERE t.title ILIKE $1 OR u.username ILIKE $1
			ORDER BY t.created_at DESC LIMIT $2 OFFSET $3`,
			like, limit, offset)
	case genre != "":
		rows, err = h.db.Pool.Query(ctx,
			trackSelect+` WHERE t.genre = $1
			ORDER BY t.created_at DESC LIMIT $2 OFFSET $3`,
			genre, limit, offset)
	default:
		rows, err = h.db.Pool.Query(ctx,
			trackSelect+` ORDER BY t.created_at DESC LIMIT $1 OFFSET $2`,
			limit, offset)
	}

	if err != nil {
		respondError(w, http.StatusInternalServerError, "error fetching tracks")
		return
	}
	defer rows.Close()

	tracks := scanTracks(rows)

	var total int
	h.db.Pool.QueryRow(ctx, `SELECT COUNT(*) FROM tracks`).Scan(&total)

	respondJSON(w, http.StatusOK, models.PaginatedResponse{
		Items: tracks, Total: total, Page: page, Limit: limit,
	})
}

// GET /api/tracks/:id
func (h *TracksHandler) GetOne(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var t models.Track
	var a models.User
	err := h.db.Pool.QueryRow(r.Context(),
		trackSelect+` WHERE t.id = $1`, id,
	).Scan(
		&t.ID, &t.Title, &t.ArtistID, &t.Album, &t.Genre, &t.Duration,
		&t.FileURL, &t.CoverURL, &t.PlayCount, &t.ReleasedAt, &t.CreatedAt,
		&a.ID, &a.Username, &a.AvatarURL,
	)
	if err != nil {
		respondError(w, http.StatusNotFound, "track not found")
		return
	}
	t.Artist = &a
	respondJSON(w, http.StatusOK, t)
}

// POST /api/tracks
func (h *TracksHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.UserIDKey).(string)
	var req models.CreateTrackRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Title == "" || req.FileURL == "" {
		respondError(w, http.StatusBadRequest, "title and file_url required")
		return
	}

	var t models.Track
	err := h.db.Pool.QueryRow(r.Context(),
		`INSERT INTO tracks(title,artist_id,album,genre,duration,file_url,cover_url,released_at)
		 VALUES($1,$2,$3,$4,$5,$6,$7,$8)
		 RETURNING id,title,artist_id,album,genre,duration,file_url,cover_url,play_count,released_at,created_at`,
		req.Title, userID, req.Album, req.Genre, req.Duration,
		req.FileURL, req.CoverURL, req.ReleasedAt,
	).Scan(
		&t.ID, &t.Title, &t.ArtistID, &t.Album, &t.Genre, &t.Duration,
		&t.FileURL, &t.CoverURL, &t.PlayCount, &t.ReleasedAt, &t.CreatedAt,
	)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error creating track")
		return
	}
	respondJSON(w, http.StatusCreated, t)
}

// PUT /api/tracks/:id
func (h *TracksHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.UserIDKey).(string)
	role, _   := r.Context().Value(middleware.UserRoleKey).(string)
	id        := chi.URLParam(r, "id")

	var ownerID string
	h.db.Pool.QueryRow(r.Context(), `SELECT artist_id FROM tracks WHERE id=$1`, id).Scan(&ownerID)
	if ownerID != userID && role != "admin" {
		respondError(w, http.StatusForbidden, "forbidden")
		return
	}

	var req models.CreateTrackRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid body")
		return
	}

	var t models.Track
	err := h.db.Pool.QueryRow(r.Context(),
		`UPDATE tracks SET
			title      = COALESCE(NULLIF($1,''), title),
			album      = $2,
			genre      = $3,
			duration   = $4,
			file_url   = COALESCE(NULLIF($5,''), file_url),
			cover_url  = $6,
			released_at= $7
		 WHERE id = $8
		 RETURNING id,title,artist_id,album,genre,duration,file_url,cover_url,play_count,released_at,created_at`,
		req.Title, req.Album, req.Genre, req.Duration,
		req.FileURL, req.CoverURL, req.ReleasedAt, id,
	).Scan(
		&t.ID, &t.Title, &t.ArtistID, &t.Album, &t.Genre, &t.Duration,
		&t.FileURL, &t.CoverURL, &t.PlayCount, &t.ReleasedAt, &t.CreatedAt,
	)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error updating track")
		return
	}
	respondJSON(w, http.StatusOK, t)
}

// POST /api/tracks/:id/play
func (h *TracksHandler) IncrementPlay(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.db.Pool.Exec(r.Context(), `UPDATE tracks SET play_count = play_count+1 WHERE id=$1`, id)
	respondJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

// DELETE /api/tracks/:id
func (h *TracksHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.UserIDKey).(string)
	role, _   := r.Context().Value(middleware.UserRoleKey).(string)
	id        := chi.URLParam(r, "id")

	var artistID string
	h.db.Pool.QueryRow(r.Context(), `SELECT artist_id FROM tracks WHERE id=$1`, id).Scan(&artistID)
	if artistID != userID && role != "admin" {
		respondError(w, http.StatusForbidden, "forbidden")
		return
	}
	h.db.Pool.Exec(r.Context(), `DELETE FROM tracks WHERE id=$1`, id)
	respondJSON(w, http.StatusOK, map[string]bool{"deleted": true})
}

// listTracksForArtist — helper interno
func listTracksForArtist(ctx context.Context, db *database.DB, artistID string) []models.Track {
	rows, err := db.Pool.Query(ctx,
		trackSelect+` WHERE t.artist_id = $1 ORDER BY t.created_at DESC`, artistID)
	if err != nil {
		return nil
	}
	defer rows.Close()
	return scanTracks(rows)
}
