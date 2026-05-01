export const API_BASE = '/api'
const BASE = API_BASE

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('ltr_token')
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  })

  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Request failed')
  return json.data as T
}

export const api = {
  auth: {
    login:    (email: string, password: string) =>
      request<{ token: string; user: User }>('/auth/login', {
        method: 'POST', body: JSON.stringify({ email, password }),
      }),
    register: (username: string, email: string, password: string) =>
      request<{ token: string; user: User }>('/auth/register', {
        method: 'POST', body: JSON.stringify({ username, email, password }),
      }),
    me: () => request<User>('/auth/me'),
  },

  posts: {
    list:   (page = 1) => request<Paginated<Post>>(`/posts?page=${page}`),
    create: (data: CreatePostPayload) =>
      request<Post>('/posts', { method: 'POST', body: JSON.stringify(data) }),
    like:   (id: string) =>
      request<{ liked: boolean; likes_count: number }>(`/posts/${id}/like`, { method: 'POST' }),
    delete: (id: string) =>
      request<{ deleted: boolean }>(`/posts/${id}`, { method: 'DELETE' }),
  },

  tracks: {
    list:   (page = 1, genre?: string) =>
      request<Paginated<Track>>(`/tracks?page=${page}${genre ? `&genre=${genre}` : ''}`),
    create: (data: CreateTrackPayload) =>
      request<Track>('/tracks', { method: 'POST', body: JSON.stringify(data) }),
    play:   (id: string) => fetch(`${BASE}/tracks/${id}/play`, { method: 'POST' }),
    delete: (id: string) =>
      request<{ deleted: boolean }>(`/tracks/${id}`, { method: 'DELETE' }),
  },

  events: {
    list: () => request<Event[]>('/events'),
  },

  contact: {
    submit: (data: ContactPayload) =>
      request<{ message: string }>('/contact', { method: 'POST', body: JSON.stringify(data) }),
  },
}

// Types
export interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'artist' | 'client'
  avatar_url?: string
  bio?: string
  created_at: string
}

export interface Post {
  id: string
  user_id: string
  author?: User
  content: string
  image_url?: string
  audio_url?: string
  audio_title?: string
  likes_count: number
  liked: boolean
  created_at: string
}

export interface Track {
  id: string
  title: string
  artist_id: string
  artist?: User
  album?: string
  genre?: string
  duration?: number
  file_url: string
  cover_url?: string
  play_count: number
  released_at?: string
  created_at: string
}

export interface Event {
  id: string
  title: string
  description?: string
  location?: string
  event_date: string
  cover_url?: string
  ticket_url?: string
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

export interface CreatePostPayload {
  content: string
  image_url?: string
  audio_url?: string
  audio_title?: string
}

export interface CreateTrackPayload {
  title: string
  album?: string
  genre?: string
  duration?: number
  file_url: string
  cover_url?: string
  released_at?: string
}

export interface ContactPayload {
  name: string
  email: string
  service?: string
  message: string
}

export function formatDuration(seconds?: number): string {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
