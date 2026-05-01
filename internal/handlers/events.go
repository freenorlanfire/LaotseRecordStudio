package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/laotse-records/studio/internal/database"
	"github.com/laotse-records/studio/internal/models"
)

type EventsHandler struct{ db *database.DB }

func NewEventsHandler(db *database.DB) *EventsHandler { return &EventsHandler{db: db} }

// GET /api/events
func (h *EventsHandler) List(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Pool.Query(r.Context(),
		`SELECT id,title,description,location,event_date,cover_url,ticket_url,created_at
		 FROM events WHERE event_date >= NOW() ORDER BY event_date ASC LIMIT 50`)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error fetching events")
		return
	}
	defer rows.Close()
	events := make([]models.Event, 0)
	for rows.Next() {
		var e models.Event
		if err := rows.Scan(&e.ID, &e.Title, &e.Description, &e.Location,
			&e.EventDate, &e.CoverURL, &e.TicketURL, &e.CreatedAt); err != nil {
			continue
		}
		events = append(events, e)
	}
	respondJSON(w, http.StatusOK, events)
}

// GET /api/events/:id
func (h *EventsHandler) GetOne(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var e models.Event
	err := h.db.Pool.QueryRow(r.Context(),
		`SELECT id,title,description,location,event_date,cover_url,ticket_url,created_at
		 FROM events WHERE id=$1`, id,
	).Scan(&e.ID, &e.Title, &e.Description, &e.Location,
		&e.EventDate, &e.CoverURL, &e.TicketURL, &e.CreatedAt)
	if err != nil {
		respondError(w, http.StatusNotFound, "event not found")
		return
	}
	respondJSON(w, http.StatusOK, e)
}

// POST /api/events
func (h *EventsHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Title == "" || req.EventDate == "" {
		respondError(w, http.StatusBadRequest, "title and event_date required")
		return
	}
	var e models.Event
	err := h.db.Pool.QueryRow(r.Context(),
		`INSERT INTO events(title,description,location,event_date,cover_url,ticket_url)
		 VALUES($1,$2,$3,$4,$5,$6)
		 RETURNING id,title,description,location,event_date,cover_url,ticket_url,created_at`,
		req.Title, req.Description, req.Location, req.EventDate, req.CoverURL, req.TicketURL,
	).Scan(&e.ID, &e.Title, &e.Description, &e.Location,
		&e.EventDate, &e.CoverURL, &e.TicketURL, &e.CreatedAt)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error creating event")
		return
	}
	respondJSON(w, http.StatusCreated, e)
}

// PUT /api/events/:id
func (h *EventsHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req models.CreateEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid body")
		return
	}
	var e models.Event
	err := h.db.Pool.QueryRow(r.Context(),
		`UPDATE events SET
			title=COALESCE(NULLIF($1,''),title),
			description=$2, location=$3,
			event_date=COALESCE(NULLIF($4,'')::timestamptz, event_date),
			cover_url=$5, ticket_url=$6
		 WHERE id=$7
		 RETURNING id,title,description,location,event_date,cover_url,ticket_url,created_at`,
		req.Title, req.Description, req.Location, req.EventDate, req.CoverURL, req.TicketURL, id,
	).Scan(&e.ID, &e.Title, &e.Description, &e.Location,
		&e.EventDate, &e.CoverURL, &e.TicketURL, &e.CreatedAt)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error updating event")
		return
	}
	respondJSON(w, http.StatusOK, e)
}

// DELETE /api/events/:id
func (h *EventsHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.db.Pool.Exec(r.Context(), `DELETE FROM events WHERE id=$1`, id)
	respondJSON(w, http.StatusOK, map[string]bool{"deleted": true})
}

// ── Contact ──────────────────────────────────────────────────────────────────

type ContactHandler struct{ db *database.DB }

func NewContactHandler(db *database.DB) *ContactHandler { return &ContactHandler{db: db} }

// POST /api/contact
func (h *ContactHandler) Submit(w http.ResponseWriter, r *http.Request) {
	var req models.ContactRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Name == "" || req.Email == "" || req.Message == "" {
		respondError(w, http.StatusBadRequest, "name, email and message required")
		return
	}
	_, err := h.db.Pool.Exec(r.Context(),
		`INSERT INTO contacts(name,email,service,message) VALUES($1,$2,$3,$4)`,
		req.Name, req.Email, req.Service, req.Message)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error saving contact")
		return
	}
	respondJSON(w, http.StatusCreated, map[string]string{"message": "Thank you, we'll be in touch soon."})
}

// GET /api/contacts — admin only
func (h *ContactHandler) List(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Pool.Query(r.Context(),
		`SELECT id,name,email,service,message,created_at FROM contacts ORDER BY created_at DESC`)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error")
		return
	}
	defer rows.Close()

	contacts := make([]models.Contact, 0)
	for rows.Next() {
		var c models.Contact
		if err := rows.Scan(&c.ID, &c.Name, &c.Email, &c.Service, &c.Message, &c.CreatedAt); err != nil {
			continue
		}
		contacts = append(contacts, c)
	}
	respondJSON(w, http.StatusOK, contacts)
}
