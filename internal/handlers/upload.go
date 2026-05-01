package handlers

import (
	"crypto/sha1"
	"fmt"
	"net/http"
	"os"
	"sort"
	"strconv"
	"strings"
	"time"
)

// UploadSignResponse — devuelto al frontend para subir directo a Cloudinary
type UploadSignResponse struct {
	Signature string `json:"signature"`
	Timestamp int64  `json:"timestamp"`
	CloudName string `json:"cloud_name"`
	APIKey    string `json:"api_key"`
	Folder    string `json:"folder"`
}

// POST /api/upload/sign?type=audio|image
// Genera una firma Cloudinary para que el navegador suba directo (sin pasar por el servidor).
func UploadSign(w http.ResponseWriter, r *http.Request) {
	apiSecret := os.Getenv("CLOUDINARY_API_SECRET")
	cloudName := os.Getenv("CLOUDINARY_CLOUD_NAME")
	apiKey    := os.Getenv("CLOUDINARY_API_KEY")

	if apiSecret == "" || cloudName == "" || apiKey == "" {
		respondError(w, http.StatusServiceUnavailable, "Cloudinary not configured")
		return
	}

	uploadType := r.URL.Query().Get("type") // "audio" o "image"
	folder     := "laotse/tracks"
	if uploadType == "cover" {
		folder = "laotse/covers"
	}

	timestamp := time.Now().Unix()

	// Parámetros que se firman — deben ser los mismos que mandará el frontend
	params := map[string]string{
		"folder":    folder,
		"timestamp": strconv.FormatInt(timestamp, 10),
	}

	// Construir la cadena firmada: parámetros ordenados + api_secret
	keys := make([]string, 0, len(params))
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	parts := make([]string, 0, len(keys))
	for _, k := range keys {
		parts = append(parts, k+"="+params[k])
	}
	toSign := strings.Join(parts, "&") + apiSecret

	h := sha1.New()
	h.Write([]byte(toSign))
	signature := fmt.Sprintf("%x", h.Sum(nil))

	respondJSON(w, http.StatusOK, UploadSignResponse{
		Signature: signature,
		Timestamp: timestamp,
		CloudName: cloudName,
		APIKey:    apiKey,
		Folder:    folder,
	})
}
