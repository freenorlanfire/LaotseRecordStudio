import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api, User } from '../lib/api'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:      null,
      token:     null,
      isLoading: false,
      error:     null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const res = await api.auth.login(email, password)
          localStorage.setItem('ltr_token', res.token)
          set({ user: res.user, token: res.token, isLoading: false })
        } catch (err: unknown) {
          set({ error: (err as Error).message, isLoading: false })
          throw err
        }
      },

      register: async (username, email, password) => {
        set({ isLoading: true, error: null })
        try {
          const res = await api.auth.register(username, email, password)
          localStorage.setItem('ltr_token', res.token)
          set({ user: res.user, token: res.token, isLoading: false })
        } catch (err: unknown) {
          set({ error: (err as Error).message, isLoading: false })
          throw err
        }
      },

      logout: () => {
        localStorage.removeItem('ltr_token')
        set({ user: null, token: null })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'ltr-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    },
  ),
)
