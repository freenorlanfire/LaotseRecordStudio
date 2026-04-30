import { create } from 'zustand'
import { Track, api } from '../lib/api'

interface PlayerState {
  queue:          Track[]
  currentIndex:   number
  isPlaying:      boolean
  volume:         number
  currentTime:    number
  duration:       number
  isMuted:        boolean

  playTrack:      (track: Track, queue?: Track[]) => void
  playQueue:      (queue: Track[], startIndex?: number) => void
  togglePlay:     () => void
  next:           () => void
  prev:           () => void
  seek:           (time: number) => void
  setVolume:      (v: number) => void
  toggleMute:     () => void
  setCurrentTime: (t: number) => void
  setDuration:    (d: number) => void
  stop:           () => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue:        [],
  currentIndex: 0,
  isPlaying:    false,
  volume:       0.8,
  currentTime:  0,
  duration:     0,
  isMuted:      false,

  playTrack: (track, queue) => {
    const q = queue ?? [track]
    const idx = q.findIndex((t) => t.id === track.id)
    set({ queue: q, currentIndex: idx >= 0 ? idx : 0, isPlaying: true, currentTime: 0 })
    api.tracks.play(track.id)
  },

  playQueue: (queue, startIndex = 0) => {
    set({ queue, currentIndex: startIndex, isPlaying: true, currentTime: 0 })
    if (queue[startIndex]) api.tracks.play(queue[startIndex].id)
  },

  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

  next: () => {
    const { queue, currentIndex } = get()
    if (currentIndex < queue.length - 1) {
      const next = currentIndex + 1
      set({ currentIndex: next, isPlaying: true, currentTime: 0 })
      api.tracks.play(queue[next].id)
    }
  },

  prev: () => {
    const { queue, currentIndex, currentTime } = get()
    if (currentTime > 3) {
      set({ currentTime: 0 })
    } else if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1, currentTime: 0 })
    }
  },

  seek:           (time) => set({ currentTime: time }),
  setVolume:      (volume) => set({ volume, isMuted: false }),
  toggleMute:     () => set((s) => ({ isMuted: !s.isMuted })),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration:    (duration) => set({ duration }),
  stop:           () => set({ isPlaying: false, currentTime: 0, queue: [], currentIndex: 0 }),
}))

export const useCurrentTrack = () => {
  const { queue, currentIndex } = usePlayerStore()
  return queue[currentIndex] ?? null
}
