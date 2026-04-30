import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, Music2, Search, Loader2 } from 'lucide-react'
import { api, Track, formatDuration } from '../lib/api'
import { usePlayerStore, useCurrentTrack } from '../store/playerStore'
import clsx from 'clsx'

const GENRES = ['Todos', 'Reggaeton', 'Salsa', 'Trap', 'R&B', 'Pop', 'Hip-Hop', 'Electronic', 'Jazz']

export default function CatalogPage() {
  const [tracks,  setTracks]  = useState<Track[]>([])
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(1)
  const [loading, setLoading] = useState(true)
  const [genre,   setGenre]   = useState('')
  const [search,  setSearch]  = useState('')

  const { playQueue, playTrack, isPlaying, togglePlay } = usePlayerStore()
  const currentTrack = useCurrentTrack()

  const fetch = useCallback(async (p: number, g: string) => {
    setLoading(true)
    const res = await api.tracks.list(p, g || undefined)
    setTracks((prev) => p === 1 ? res.items : [...prev, ...res.items])
    setTotal(res.total)
    setLoading(false)
  }, [])

  useEffect(() => {
    setTracks([])
    setPage(1)
    fetch(1, genre)
  }, [genre, fetch])

  const filtered = search
    ? tracks.filter((t) =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.artist?.username.toLowerCase().includes(search.toLowerCase()),
      )
    : tracks

  const handlePlay = (track: Track) => {
    if (currentTrack?.id === track.id) {
      togglePlay()
    } else {
      playTrack(track, filtered)
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-32 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <p className="font-display text-xs tracking-[0.4em] text-gold/60 uppercase mb-2">
            Música Oficial
          </p>
          <h1 className="font-display text-4xl text-white mb-2">Catálogo</h1>
          <p className="text-white/40">El archivo musical de Lao-tse Records.</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Buscar artista o título…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-studio pl-10 py-2.5 text-sm"
            />
          </div>

          {/* Genre filter */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {GENRES.map((g) => {
              const val = g === 'Todos' ? '' : g
              return (
                <button
                  key={g}
                  onClick={() => setGenre(val)}
                  className={clsx(
                    'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all',
                    genre === val
                      ? 'bg-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                      : 'bg-studio-card border border-studio-border text-white/50 hover:text-white hover:border-gold/30',
                  )}
                >
                  {g}
                </button>
              )
            })}
          </div>
        </div>

        {/* Play All */}
        {filtered.length > 0 && (
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => playQueue(filtered, 0)}
              className="btn-gold"
            >
              <Play size={18} className="fill-black" />
              Reproducir Todo
            </button>
            <span className="text-white/30 text-sm">{total} canciones</span>
          </div>
        )}

        {/* Track list — table layout on desktop, cards on mobile */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-x-6 gap-y-0
                          text-xs uppercase tracking-widest text-white/30 pb-3 border-b border-studio-border mb-2 px-4">
            <span>#</span>
            <span>Título</span>
            <span>Álbum / Género</span>
            <span>Reproducciones</span>
            <span>Duración</span>
          </div>

          <div className="space-y-1">
            {filtered.map((track, i) => (
              <TrackRow
                key={track.id}
                track={track}
                index={i + 1}
                isActive={currentTrack?.id === track.id}
                isPlaying={currentTrack?.id === track.id && isPlaying}
                onClick={() => handlePlay(track)}
              />
            ))}
          </div>
        </div>

        {/* Mobile cards */}
        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((track) => (
            <TrackCardMobile
              key={track.id}
              track={track}
              isActive={currentTrack?.id === track.id}
              isPlaying={currentTrack?.id === track.id && isPlaying}
              onClick={() => handlePlay(track)}
            />
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 size={28} className="animate-spin text-gold/50" />
          </div>
        )}

        {!loading && tracks.length === 0 && (
          <div className="text-center py-24 text-white/20">
            <Music2 size={48} className="mx-auto mb-4" />
            <p>No hay canciones en esta categoría todavía.</p>
          </div>
        )}

        {!loading && tracks.length < total && (
          <div className="text-center mt-10">
            <button
              onClick={() => { const next = page + 1; setPage(next); fetch(next, genre) }}
              className="btn-outline-gold"
            >
              Cargar más
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function TrackRow({
  track, index, isActive, isPlaying, onClick,
}: {
  track: Track; index: number; isActive: boolean; isPlaying: boolean; onClick: () => void
}) {
  return (
    <motion.div
      whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
      onClick={onClick}
      className={clsx(
        'grid grid-cols-[auto_1fr_1fr_auto_auto] gap-x-6 items-center px-4 py-3 rounded-xl cursor-pointer group transition-colors',
        isActive && 'bg-gold/5',
      )}
    >
      <div className="w-5 text-center">
        {isPlaying ? (
          <div className="flex items-end gap-0.5 h-4 justify-center">
            {[1, 2, 3].map((h, i) => (
              <div key={i} className="waveform-bar" style={{ height: `${h * 4}px`, animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
        ) : (
          <>
            <span className={clsx('text-xs group-hover:hidden', isActive ? 'text-gold' : 'text-white/30')}>
              {index}
            </span>
            <Play size={14} className="text-gold hidden group-hover:block" />
          </>
        )}
      </div>

      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-studio-muted">
          {track.cover_url
            ? <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><Music2 size={14} className="text-white/20" /></div>
          }
        </div>
        <div className="min-w-0">
          <p className={clsx('text-sm font-medium truncate', isActive ? 'text-gold' : 'text-white')}>{track.title}</p>
          <p className="text-xs text-white/40 truncate">{track.artist?.username}</p>
        </div>
      </div>

      <div className="min-w-0">
        <p className="text-sm text-white/40 truncate">{track.album ?? track.genre ?? '—'}</p>
      </div>

      <span className="text-sm text-white/30 tabular-nums">{track.play_count.toLocaleString()}</span>
      <span className="text-sm text-white/30 tabular-nums">{formatDuration(track.duration)}</span>
    </motion.div>
  )
}

function TrackCardMobile({
  track, isActive, isPlaying, onClick,
}: {
  track: Track; isActive: boolean; isPlaying: boolean; onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'card-studio overflow-hidden flex items-center gap-4 p-4 cursor-pointer group',
        'hover:border-gold/30 transition-all',
        isActive && 'border-gold/30',
      )}
    >
      <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-studio-muted">
        {track.cover_url
          ? <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Music2 size={18} className="text-white/20" /></div>
        }
        {isPlaying && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Pause size={14} className="text-gold" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={clsx('font-medium text-sm truncate', isActive ? 'text-gold' : 'text-white')}>{track.title}</p>
        <p className="text-xs text-white/40 truncate">{track.artist?.username}</p>
        <p className="text-xs text-white/20 mt-0.5">{formatDuration(track.duration)}</p>
      </div>
      <Play size={18} className={clsx('flex-shrink-0 transition-colors', isActive ? 'text-gold' : 'text-white/20 group-hover:text-gold')} />
    </div>
  )
}
