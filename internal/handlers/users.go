package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/laotse-records/studio/internal/database"
	"github.com/laotse-records/studio/internal/models"
)

type UsersHandler struct {
	db *database.DB
}

func NewUsersHandler(db *database.DB) *UsersHandler {
	return &UsersHandler{db: db}
}

// GET /api/users/:username — perfil público
func (h *UsersHandler) GetByUsername(w http.ResponseWriter, r *http.Request) {
	username := chi.URLParam(r, "username")

	var user models.User
	err := h.db.Pool.QueryRow(r.Context(),
		`SELECT id, username, email, role, avatar_url, bio, created_at
		 FROM users WHERE username = $1`, username,
	).Scan(&user.ID, &user.Username, &user.Email, &user.Role,
		&user.AvatarURL, &user.Bio, &user.CreatedAt)
	if err != nil {
		respondError(w, http.StatusNotFound, "user not found")
		return
	}
	respondJSON(w, http.StatusOK, user)
}

// GET /api/users — admin: lista todos los usuarios
func (h *UsersHandler) List(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Pool.Query(r.Context(),
		`SELECT id, username, email, role, avatar_url, bio, created_at
		 FROM users ORDER BY created_at DESC`)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error fetching users")
		return
	}
	defer rows.Close()

	users := make([]models.User, 0)
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Username, &u.Email, &u.Role,
			&u.AvatarURL, &u.Bio, &u.CreatedAt); err != nil {
			continue
		}
		users = append(users, u)
	}
	respondJSON(w, http.StatusOK, users)
}

// PATCH /api/users/:id/role — admin: cambiar rol
func (h *UsersHandler) UpdateRole(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body struct {
		Role string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "invalid body")
		return
	}
	if body.Role != "admin" && body.Role != "artist" && body.Role != "client" {
		respondError(w, http.StatusBadRequest, "role must be admin, artist or client")
		return
	}
	_, err := h.db.Pool.Exec(r.Context(),
		`UPDATE users SET role=$1 WHERE id=$2`, body.Role, id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error updating role")
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"role": body.Role})
}
