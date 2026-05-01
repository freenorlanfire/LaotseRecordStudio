# ── Stage 1: Build React frontend ──────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install --legacy-peer-deps

COPY frontend/ .
RUN npm run build

# ── Stage 2: Build Go binary ────────────────────────────────────────────────
FROM golang:1.22-alpine AS go-builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server .

# ── Stage 3: Final minimal image ────────────────────────────────────────────
FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

COPY --from=go-builder  /app/server            ./server
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

ENV PORT=8080 \
    ENV=production

EXPOSE 8080

CMD ["./server"]
