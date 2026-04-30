package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/laotse-records/studio/internal/database"
	"github.com/laotse-records/studio/internal/middleware"
	"github.com/laotse-records/studio/internal/models"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	db        *database.DB
	jwtSecret string
}

func NewAuthHandler(db *database.DB, secret string) *AuthHandler {
	return &AuthHandler{db: db, jwtSecret: secret}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Username == "" || req.Email == "" || len(req.Password) < 8 {
		respondError(w, http.StatusBadRequest, "username, email and password (min 8 chars) required")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error processing request")
		return
	}

	var user models.User
	err = h.db.Pool.QueryRow(r.Context(),
		`INSERT INTO users (username, email, password_hash) VALUES ($1,$2,$3)
		 RETURNING id, username, email, role, avatar_url, bio, created_at`,
		req.Username, req.Email, string(hash),
	).Scan(&user.ID, &user.Username, &user.Email, &user.Role, &user.AvatarURL, &user.Bio, &user.CreatedAt)
	if err != nil {
		respondError(w, http.StatusConflict, "username or email already exists")
		return
	}

	token, err := h.generateToken(&user)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error generating token")
		return
	}

	respondJSON(w, http.StatusCreated, models.AuthResponse{Token: token, User: &user})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	var user models.User
	err := h.db.Pool.QueryRow(r.Context(),
		`SELECT id, username, email, password_hash, role, avatar_url, bio, created_at
		 FROM users WHERE email=$1`,
		req.Email,
	).Scan(&user.ID, &user.Username, &user.Email, &user.PasswordHash, &user.Role, &user.AvatarURL, &user.Bio, &user.CreatedAt)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		respondError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	token, err := h.generateToken(&user)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error generating token")
		return
	}

	respondJSON(w, http.StatusOK, models.AuthResponse{Token: token, User: &user})
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.UserIDKey).(string)

	var user models.User
	err := h.db.Pool.QueryRow(r.Context(),
		`SELECT id, username, email, role, avatar_url, bio, created_at FROM users WHERE id=$1`,
		userID,
	).Scan(&user.ID, &user.Username, &user.Email, &user.Role, &user.AvatarURL, &user.Bio, &user.CreatedAt)
	if err != nil {
		respondError(w, http.StatusNotFound, "user not found")
		return
	}

	respondJSON(w, http.StatusOK, user)
}

func (h *AuthHandler) generateToken(user *models.User) (string, error) {
	claims := middleware.Claims{
		UserID: user.ID,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(72 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(h.jwtSecret))
}
