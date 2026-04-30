import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, ChevronDown,
} from 'lucide-react'
import { usePlayerStore, useCurrentTrack } from '../../store/playerStore'
import { formatDuration } from '../../lib/api'

export function GlobalPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const track    = useCurrentTrack()
  const {
    isPlaying, volume, currentTime, duration, isMuted,
    togglePlay, next, prev, seek, setVolume, toggleMute,
    setCurrentTime, setDuration,
  } = usePlayerStore()

  // Sync audio element with store
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !track) return
    if (audio.src !== track.file_url) {
      audio.src = track.file_url
      audio.load()
    }
    if (isPlaying) audio.play().catch(() => {})
    else audio.pause()
  }, [track, isPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = isMuted ? 0 : volume
  }, [volume, isMuted])

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime((e.target as HTMLAudioElement).currentTime)}
        onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
        onEnded={next}
      />

      <AnimatePresence>
        {track && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0,   opacity: 1 }}
            exit={{   y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 inset-x-0 z-50
                       bg-black/95 backdrop-blur-xl
                       border-t border-gold/20
                       shadow-[0_-10px_60px_rgba(0,0,0,0.8)]"
          >
            {/* Progress bar */}
            <div
              className="h-0.5 bg-studio-muted cursor-pointer group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                seek(((e.clientX - rect.left) / rect.width) * duration)
              }}
            >
              <motion.div
                className="h-full bg-gold-gradient relative"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2
                                bg-gold rounded-full opacity-0 group-hover:opacity-100
                                transition-opacity shadow-[0_0_6px_rgba(212,175,55,0.8)]" />
              </motion.div>
            </div>

            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
              {/* Track info */}
              <div className="flex items-center gap-3 w-64 min-w-0">
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0
                                bg-studio-card border border-studio-border">
                  {track.cover_url ? (
                    <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <WaveformIcon active={isPlaying} />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{track.title}</p>
                  <p className="text-xs text-white/40 truncate">{track.artist?.username ?? '—'}</p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex-1 flex items-center justify-center gap-4">
                <button
                  onClick={prev}
                  className="p-2 text-white/50 hover:text-gold transition-colors"
                >
                  <SkipBack size={18} />
                </button>

                <button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-gold flex items-center justify-center
                             hover:bg-gold-300 transition-colors shadow-[0_0_15px_rgba(212,175,55,0.3)]
                             active:scale-95"
                >
                  {isPlaying
                    ? <Pause  size={18} className="text-black" />
                    : <Play   size={18} className="text-black translate-x-0.5" />
                  }
                </button>

                <button
                  onClick={next}
                  className="p-2 text-white/50 hover:text-gold transition-colors"
                >
                  <SkipForward size={18} />
                </button>
              </div>

              {/* Time + Volume */}
              <div className="hidden sm:flex items-center gap-3 w-64 justify-end">
                <span className="text-xs text-white/40 tabular-nums">
                  {formatDuration(Math.floor(currentTime))} / {formatDuration(Math.floor(duration))}
                </span>

                <button
                  onClick={toggleMute}
                  className="p-1.5 text-white/50 hover:text-gold transition-colors"
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>

                <input
                  type="range"
                  min={0} max={1} step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-20 accent-gold cursor-pointer"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function WaveformIcon({ active }: { active: boolean }) {
  return (
    <div className="flex items-end gap-0.5 h-5">
      {[1, 2, 3, 4, 3].map((h, i) => (
        <div
          key={i}
          className="waveform-bar"
          style={{
            height: `${h * 4}px`,
            animationDelay: active ? `${i * 0.12}s` : '0s',
            animationPlayState: active ? 'running' : 'paused',
          }}
        />
      ))}
    </div>
  )
}
