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

type PostsHandler struct {
	db *database.DB
}

func NewPostsHandler(db *database.DB) *PostsHandler {
	return &PostsHandler{db: db}
}

// GET /api/posts
func (h *PostsHandler) List(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	limit := 20
	offset := (page - 1) * limit
	currentUserID, _ := r.Context().Value(middleware.UserIDKey).(string)

	rows, err := h.db.Pool.Query(r.Context(), `
		SELECT p.id, p.user_id, p.content, p.image_url, p.audio_url, p.audio_title,
		       p.likes_count, p.created_at,
		       u.id, u.username, u.role, u.avatar_url,
		       EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id=p.id AND pl.user_id=$1) AS liked
		FROM posts p JOIN users u ON u.id=p.user_id
		ORDER BY p.created_at DESC LIMIT $2 OFFSET $3`,
		currentUserID, limit, offset)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error fetching posts")
		return
	}
	defer rows.Close()

	posts := make([]models.Post, 0)
	for rows.Next() {
		var p models.Post
		var a models.User
		if err := rows.Scan(&p.ID, &p.UserID, &p.Content, &p.ImageURL, &p.AudioURL,
			&p.AudioTitle, &p.LikesCount, &p.CreatedAt,
			&a.ID, &a.Username, &a.Role, &a.AvatarURL, &p.Liked); err != nil {
			continue
		}
		p.Author = &a
		posts = append(posts, p)
	}

	var total int
	h.db.Pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM posts`).Scan(&total)
	respondJSON(w, http.StatusOK, models.PaginatedResponse{Items: posts, Total: total, Page: page, Limit: limit})
}

// GET /api/posts/:id
func (h *PostsHandler) GetOne(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	currentUserID, _ := r.Context().Value(middleware.UserIDKey).(string)

	var p models.Post
	var a models.User
	err := h.db.Pool.QueryRow(r.Context(), `
		SELECT p.id, p.user_id, p.content, p.image_url, p.audio_url, p.audio_title,
		       p.likes_count, p.created_at,
		       u.id, u.username, u.role, u.avatar_url,
		       EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id=p.id AND pl.user_id=$2) AS liked
		FROM posts p JOIN users u ON u.id=p.user_id WHERE p.id=$1`, id, currentUserID,
	).Scan(&p.ID, &p.UserID, &p.Content, &p.ImageURL, &p.AudioURL,
		&p.AudioTitle, &p.LikesCount, &p.CreatedAt,
		&a.ID, &a.Username, &a.Role, &a.AvatarURL, &p.Liked)
	if err != nil {
		respondError(w, http.StatusNotFound, "post not found")
		return
	}
	p.Author = &a
	respondJSON(w, http.StatusOK, p)
}

// POST /api/posts
func (h *PostsHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.UserIDKey).(string)
	var req models.CreatePostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Content == "" {
		respondError(w, http.StatusBadRequest, "content is required")
		return
	}

	var p models.Post
	err := h.db.Pool.QueryRow(r.Context(),
		`INSERT INTO posts (user_id,content,image_url,audio_url,audio_title)
		 VALUES ($1,$2,$3,$4,$5)
		 RETURNING id,user_id,content,image_url,audio_url,audio_title,likes_count,created_at`,
		userID, req.Content, req.ImageURL, req.AudioURL, req.AudioTitle,
	).Scan(&p.ID, &p.UserID, &p.Content, &p.ImageURL, &p.AudioURL,
		&p.AudioTitle, &p.LikesCount, &p.CreatedAt)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error creating post")
		return
	}

	var a models.User
	h.db.Pool.QueryRow(r.Context(),
		`SELECT id,username,role,avatar_url FROM users WHERE id=$1`, userID,
	).Scan(&a.ID, &a.Username, &a.Role, &a.AvatarURL)
	p.Author = &a
	respondJSON(w, http.StatusCreated, p)
}

// POST /api/posts/:id/like
func (h *PostsHandler) ToggleLike(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.UserIDKey).(string)
	postID := chi.URLParam(r, "id")

	var liked bool
	h.db.Pool.QueryRow(r.Context(),
		`SELECT EXISTS(SELECT 1 FROM post_likes WHERE post_id=$1 AND user_id=$2)`,
		postID, userID).Scan(&liked)

	if liked {
		h.db.Pool.Exec(r.Context(), `DELETE FROM post_likes WHERE post_id=$1 AND user_id=$2`, postID, userID)
		h.db.Pool.Exec(r.Context(), `UPDATE posts SET likes_count=likes_count-1 WHERE id=$1 AND likes_count>0`, postID)
	} else {
		h.db.Pool.Exec(r.Context(), `INSERT INTO post_likes(post_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING`, postID, userID)
		h.db.Pool.Exec(r.Context(), `UPDATE posts SET likes_count=likes_count+1 WHERE id=$1`, postID)
	}

	var count int
	h.db.Pool.QueryRow(r.Context(), `SELECT likes_count FROM posts WHERE id=$1`, postID).Scan(&count)
	respondJSON(w, http.StatusOK, map[string]interface{}{"liked": !liked, "likes_count": count})
}

// DELETE /api/posts/:id
func (h *PostsHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.UserIDKey).(string)
	role, _ := r.Context().Value(middleware.UserRoleKey).(string)
	postID := chi.URLParam(r, "id")

	var ownerID string
	h.db.Pool.QueryRow(r.Context(), `SELECT user_id FROM posts WHERE id=$1`, postID).Scan(&ownerID)
	if ownerID != userID && role != "admin" {
		respondError(w, http.StatusForbidden, "forbidden")
		return
	}
	h.db.Pool.Exec(r.Context(), `DELETE FROM posts WHERE id=$1`, postID)
	respondJSON(w, http.StatusOK, map[string]bool{"deleted": true})
}
