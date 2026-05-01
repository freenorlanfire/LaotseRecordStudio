package email

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

type Client struct {
	apiKey string
	from   string
	to     string
}

func NewClient() *Client {
	from := os.Getenv("EMAIL_FROM")
	if from == "" {
		from = "Lao-tse Records <noreply@laotserecords.com>"
	}
	return &Client{
		apiKey: os.Getenv("RESEND_API_KEY"),
		from:   from,
		to:     os.Getenv("EMAIL_TO"), // tu correo donde recibes
	}
}

func (c *Client) Enabled() bool {
	return c.apiKey != "" && c.to != ""
}

type resendPayload struct {
	From    string   `json:"from"`
	To      []string `json:"to"`
	Subject string   `json:"subject"`
	HTML    string   `json:"html"`
}

func (c *Client) SendContactNotification(name, email, service, message string) error {
	if !c.Enabled() {
		return nil // silencioso si no hay config — el mensaje igual se guarda en DB
	}

	serviceLabel := service
	if serviceLabel == "" {
		serviceLabel = "No especificado"
	}

	html := fmt.Sprintf(`
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<style>
  body { margin:0; padding:0; background:#f5f5f5; font-family:Georgia,serif; }
  .wrap { max-width:580px; margin:40px auto; background:#fff; border-radius:8px; overflow:hidden;
          box-shadow:0 2px 12px rgba(0,0,0,0.08); }
  .header { background:#000; padding:32px 40px; text-align:center; }
  .header h1 { color:#C8960C; font-size:26px; margin:0; letter-spacing:2px; }
  .header p  { color:rgba(255,255,255,0.4); font-size:11px; letter-spacing:4px; margin:6px 0 0; text-transform:uppercase; }
  .body { padding:32px 40px; }
  .body h2 { color:#111; font-size:18px; margin:0 0 24px; border-bottom:2px solid #C8960C; padding-bottom:12px; }
  .field { margin-bottom:18px; }
  .field label { display:block; color:#888; font-size:11px; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; }
  .field span  { display:block; color:#111; font-size:15px; }
  .message-box { background:#f9f7f0; border-left:3px solid #C8960C; padding:16px 20px;
                 border-radius:0 6px 6px 0; color:#333; font-size:14px; line-height:1.7; white-space:pre-wrap; }
  .footer { background:#f5f5f5; padding:20px 40px; text-align:center; }
  .footer p { color:#aaa; font-size:12px; margin:0; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>Lao-tse Records</h1>
    <p>Studio Digital — Nuevo mensaje</p>
  </div>
  <div class="body">
    <h2>📩 Nuevo contacto recibido</h2>
    <div class="field">
      <label>Nombre</label>
      <span>%s</span>
    </div>
    <div class="field">
      <label>Email</label>
      <span><a href="mailto:%s" style="color:#C8960C;">%s</a></span>
    </div>
    <div class="field">
      <label>Servicio de interés</label>
      <span>%s</span>
    </div>
    <div class="field">
      <label>Mensaje</label>
      <div class="message-box">%s</div>
    </div>
  </div>
  <div class="footer">
    <p>%s · Lao-tse Records Studio · laotserecords.com</p>
  </div>
</div>
</body>
</html>`,
		name, email, email, serviceLabel, message,
		time.Now().Format("02 Jan 2006, 15:04"),
	)

	payload := resendPayload{
		From:    c.from,
		To:      []string{c.to},
		Subject: fmt.Sprintf("🎵 Nuevo contacto de %s — Lao-tse Records", name),
		HTML:    html,
	}

	body, _ := json.Marshal(payload)
	req, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := (&http.Client{Timeout: 10 * time.Second}).Do(req)
	if err != nil {
		return fmt.Errorf("resend request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		return fmt.Errorf("resend returned status %d", resp.StatusCode)
	}
	return nil
}
