package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
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

func (h *TracksHandler) List(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	limit := 24
	offset := (page - 1) * limit
	genre := r.URL.Query().Get("genre")

	query := `
		SELECT t.id, t.title, t.artist_id, t.album, t.genre, t.duration,
		       t.file_url, t.cover_url, t.play_count, t.released_at, t.created_at,
		       u.id, u.username, u.avatar_url
		FROM tracks t
		JOIN users u ON u.id = t.artist_id`

	args := []interface{}{}
	if genre != "" {
		query += ` WHERE t.genre = $1`
		args = append(args, genre)
		query += ` ORDER BY t.created_at DESC LIMIT $2 OFFSET $3`
		args = append(args, limit, offset)
	} else {
		query += ` ORDER BY t.created_at DESC LIMIT $1 OFFSET $2`
		args = append(args, limit, offset)
	}

	rows, err := h.db.Pool.Query(r.Context(), query, args...)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error fetching tracks")
		return
	}
	defer rows.Close()

	tracks := make([]models.Track, 0)
	for rows.Next() {
		var t models.Track
		var artist models.User
		if err := rows.Scan(
			&t.ID, &t.Title, &t.ArtistID, &t.Album, &t.Genre, &t.Duration,
			&t.FileURL, &t.CoverURL, &t.PlayCount, &t.ReleasedAt, &t.CreatedAt,
			&artist.ID, &artist.Username, &artist.AvatarURL,
		); err != nil {
			continue
		}
		t.Artist = &artist
		tracks = append(tracks, t)
	}

	var total int
	if genre != "" {
		h.db.Pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM tracks WHERE genre=$1`, genre).Scan(&total)
	} else {
		h.db.Pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM tracks`).Scan(&total)
	}

	respondJSON(w, http.StatusOK, models.PaginatedResponse{
		Items: tracks, Total: total, Page: page, Limit: limit,
	})
}

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

	var track models.Track
	err := h.db.Pool.QueryRow(r.Context(),
		`INSERT INTO tracks (title, artist_id, album, genre, duration, file_url, cover_url, released_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
		 RETURNING id, title, artist_id, album, genre, duration, file_url, cover_url, play_count, released_at, created_at`,
		req.Title, userID, req.Album, req.Genre, req.Duration, req.FileURL, req.CoverURL, req.ReleasedAt,
	).Scan(&track.ID, &track.Title, &track.ArtistID, &track.Album, &track.Genre, &track.Duration,
		&track.FileURL, &track.CoverURL, &track.PlayCount, &track.ReleasedAt, &track.CreatedAt)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error creating track")
		return
	}

	respondJSON(w, http.StatusCreated, track)
}

func (h *TracksHandler) IncrementPlay(w http.ResponseWriter, r *http.Request) {
	trackID := chi.URLParam(r, "id")
	h.db.Pool.Exec(r.Context(), `UPDATE tracks SET play_count = play_count + 1 WHERE id=$1`, trackID)
	respondJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (h *TracksHandler) Delete(w http.ResponseWriter, r *http.Request) {
	role, _ := r.Context().Value(middleware.UserRoleKey).(string)
	userID, _ := r.Context().Value(middleware.UserIDKey).(string)
	trackID := chi.URLParam(r, "id")

	var artistID string
	h.db.Pool.QueryRow(r.Context(), `SELECT artist_id FROM tracks WHERE id=$1`, trackID).Scan(&artistID)

	if artistID != userID && role != "admin" {
		respondError(w, http.StatusForbidden, "forbidden")
		return
	}

	h.db.Pool.Exec(r.Context(), `DELETE FROM tracks WHERE id=$1`, trackID)
	respondJSON(w, http.StatusOK, map[string]bool{"deleted": true})
}
