package models

import "time"

type User struct {
	ID           string    `json:"id"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Role         string    `json:"role"`
	AvatarURL    *string   `json:"avatar_url,omitempty"`
	Bio          *string   `json:"bio,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}

type Post struct {
	ID         string    `json:"id"`
	UserID     string    `json:"user_id"`
	Author     *User     `json:"author,omitempty"`
	Content    string    `json:"content"`
	ImageURL   *string   `json:"image_url,omitempty"`
	AudioURL   *string   `json:"audio_url,omitempty"`
	AudioTitle *string   `json:"audio_title,omitempty"`
	LikesCount int       `json:"likes_count"`
	Liked      bool      `json:"liked"`
	CreatedAt  time.Time `json:"created_at"`
}

type Track struct {
	ID         string    `json:"id"`
	Title      string    `json:"title"`
	ArtistID   string    `json:"artist_id"`
	Artist     *User     `json:"artist,omitempty"`
	Album      *string   `json:"album,omitempty"`
	Genre      *string   `json:"genre,omitempty"`
	Duration   *int      `json:"duration,omitempty"`
	FileURL    string    `json:"file_url"`
	CoverURL   *string   `json:"cover_url,omitempty"`
	PlayCount  int       `json:"play_count"`
	ReleasedAt *string   `json:"released_at,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}

type Event struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description *string   `json:"description,omitempty"`
	Location    *string   `json:"location,omitempty"`
	EventDate   time.Time `json:"event_date"`
	CoverURL    *string   `json:"cover_url,omitempty"`
	TicketURL   *string   `json:"ticket_url,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

type Contact struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Service   *string   `json:"service,omitempty"`
	Message   string    `json:"message"`
	CreatedAt time.Time `json:"created_at"`
}

// Request / Response DTOs

type RegisterRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  *User  `json:"user"`
}

type CreatePostRequest struct {
	Content    string  `json:"content"`
	ImageURL   *string `json:"image_url,omitempty"`
	AudioURL   *string `json:"audio_url,omitempty"`
	AudioTitle *string `json:"audio_title,omitempty"`
}

type CreateTrackRequest struct {
	Title      string  `json:"title"`
	Album      *string `json:"album,omitempty"`
	Genre      *string `json:"genre,omitempty"`
	Duration   *int    `json:"duration,omitempty"`
	FileURL    string  `json:"file_url"`
	CoverURL   *string `json:"cover_url,omitempty"`
	ReleasedAt *string `json:"released_at,omitempty"`
}

type CreateEventRequest struct {
	Title       string  `json:"title"`
	Description *string `json:"description,omitempty"`
	Location    *string `json:"location,omitempty"`
	EventDate   string  `json:"event_date"`
	CoverURL    *string `json:"cover_url,omitempty"`
	TicketURL   *string `json:"ticket_url,omitempty"`
}

type ContactRequest struct {
	Name    string  `json:"name"`
	Email   string  `json:"email"`
	Service *string `json:"service,omitempty"`
	Message string  `json:"message"`
}

type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

type PaginatedResponse struct {
	Items  interface{} `json:"items"`
	Total  int         `json:"total"`
	Page   int         `json:"page"`
	Limit  int         `json:"limit"`
}
