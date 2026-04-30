import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, ArrowRight, Music2, Radio, Gavel, CalendarDays } from 'lucide-react'
import { api, Track, Event } from '../lib/api'
import { usePlayerStore } from '../store/playerStore'

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.1 } } },
  item:      { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } },
}

export default function Home() {
  const [featuredTracks, setFeaturedTracks] = useState<Track[]>([])
  const [events,         setEvents]         = useState<Event[]>([])
  const { playTrack } = usePlayerStore()

  useEffect(() => {
    api.tracks.list(1).then((r) => setFeaturedTracks(r.items.slice(0, 4)))
    api.events.list().then(setEvents)
  }, [])

  return (
    <div className="min-h-screen">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-dark-gradient" />
        <div className="absolute inset-0 bg-hero-radial" />
        <div className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(212,175,55,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(212,175,55,0.05) 0%, transparent 50%)',
          }}
        />

        {/* Decorative blobs */}
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gold/5 blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-gold/5 blur-3xl pointer-events-none"
        />

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="font-display text-xs tracking-[0.6em] text-gold/60 uppercase mb-6">
              Bienvenido al
            </p>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="font-script text-7xl sm:text-9xl text-gold leading-none mb-4
                       drop-shadow-[0_0_40px_rgba(212,175,55,0.3)]"
          >
            Lao-tse
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="font-display text-lg sm:text-2xl tracking-[0.5em] text-white/40 uppercase mb-8"
          >
            Records Studio
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-white/50 text-lg max-w-xl mx-auto mb-12 leading-relaxed text-balance"
          >
            Donde el arte se convierte en legado. Sello discográfico de élite para artistas que buscan la excelencia.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <Link to="/catalog" className="btn-gold text-base px-8 py-3.5">
              <Play size={18} className="fill-black" />
              Escuchar Ahora
            </Link>
            <Link to="/services" className="btn-outline-gold text-base px-8 py-3.5">
              Nuestros Servicios
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-5 h-8 border border-gold/30 rounded-full flex justify-center pt-1.5">
            <div className="w-1 h-2 bg-gold/50 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* ── Featured Tracks ───────────────────────────────── */}
      {featuredTracks.length > 0 && (
        <section className="py-24 px-4 max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="font-display text-xs tracking-[0.4em] text-gold/60 uppercase mb-2">
                Lo más reciente
              </p>
              <h2 className="font-display text-4xl text-white">Catálogo Destacado</h2>
            </div>
            <Link to="/catalog" className="nav-link flex items-center gap-2 text-gold/70 hover:text-gold">
              Ver todo <ArrowRight size={16} />
            </Link>
          </div>

          <motion.div
            variants={stagger.container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {featuredTracks.map((track) => (
              <motion.div key={track.id} variants={stagger.item}>
                <TrackCard track={track} onPlay={() => playTrack(track, featuredTracks)} />
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {/* ── Services Teaser ───────────────────────────────── */}
      <section className="py-24 px-4 bg-studio-dark border-y border-studio-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-display text-xs tracking-[0.4em] text-gold/60 uppercase mb-3">
              Servicios Profesionales
            </p>
            <h2 className="font-display text-4xl text-white mb-4">
              Todo lo que necesita tu carrera
            </h2>
            <p className="text-white/40 max-w-xl mx-auto">
              Desde la producción hasta la protección legal de tu música.
            </p>
          </div>

          <motion.div
            variants={stagger.container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {SERVICES.map((s) => (
              <motion.div
                key={s.title}
                variants={stagger.item}
                className="card-studio p-8 group hover:border-gold/30 transition-colors duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-6
                                group-hover:bg-gold/20 transition-colors">
                  <s.Icon size={24} className="text-gold" />
                </div>
                <h3 className="font-display text-xl text-white mb-3">{s.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center mt-12">
            <Link to="/services" className="btn-gold">
              Ver Todos los Servicios <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Upcoming Events ───────────────────────────────── */}
      {events.length > 0 && (
        <section className="py-24 px-4 max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="font-display text-xs tracking-[0.4em] text-gold/60 uppercase mb-2">
                Próximamente
              </p>
              <h2 className="font-display text-4xl text-white">Eventos</h2>
            </div>
            <Link to="/events" className="nav-link flex items-center gap-2 text-gold/70 hover:text-gold">
              Ver agenda <ArrowRight size={16} />
            </Link>
          </div>
          <div className="space-y-4">
            {events.slice(0, 3).map((ev) => (
              <EventRow key={ev.id} event={ev} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function TrackCard({ track, onPlay }: { track: Track; onPlay: () => void }) {
  return (
    <div
      className="card-studio overflow-hidden group cursor-pointer hover:border-gold/30
                 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(212,175,55,0.1)]"
      onClick={onPlay}
    >
      <div className="aspect-square relative overflow-hidden">
        {track.cover_url ? (
          <img src={track.cover_url} alt={track.title}
               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full bg-studio-muted flex items-center justify-center">
            <Music2 size={40} className="text-gold/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100
                        flex items-center justify-center transition-opacity duration-300">
          <div className="w-12 h-12 rounded-full bg-gold flex items-center justify-center
                          shadow-[0_0_20px_rgba(212,175,55,0.5)]">
            <Play size={20} className="text-black fill-black translate-x-0.5" />
          </div>
        </div>
      </div>
      <div className="p-4">
        <p className="text-white font-medium text-sm truncate">{track.title}</p>
        <p className="text-white/40 text-xs mt-1 truncate">{track.artist?.username}</p>
        {track.genre && (
          <span className="mt-2 inline-block text-[10px] tracking-widest uppercase
                           text-gold/60 bg-gold/10 px-2 py-0.5 rounded-full">
            {track.genre}
          </span>
        )}
      </div>
    </div>
  )
}

function EventRow({ event }: { event: Event }) {
  const date = new Date(event.event_date)
  return (
    <div className="card-studio p-5 flex items-center gap-5 hover:border-gold/30 transition-colors duration-200 group">
      <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gold/10 flex flex-col items-center justify-center
                      group-hover:bg-gold/20 transition-colors">
        <span className="text-gold font-bold text-lg leading-none">
          {date.getDate().toString().padStart(2, '0')}
        </span>
        <span className="text-gold/60 text-xs uppercase tracking-wider">
          {date.toLocaleString('es', { month: 'short' })}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{event.title}</p>
        {event.location && (
          <p className="text-white/40 text-sm mt-0.5">{event.location}</p>
        )}
      </div>
      {event.ticket_url && (
        <a
          href={event.ticket_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0 btn-outline-gold text-xs py-2 px-4"
        >
          Tickets
        </a>
      )}
    </div>
  )
}

const SERVICES = [
  {
    Icon: Music2,
    title: 'Producción Musical',
    desc: 'Grabación, mezcla y masterización de élite con los mejores ingenieros de sonido.',
  },
  {
    Icon: Gavel,
    title: 'Abogacía Musical',
    desc: 'Protección legal de tus derechos de autor, contratos discográficos y licencias.',
  },
  {
    Icon: Radio,
    title: 'Distribución Digital',
    desc: 'Coloca tu música en todas las plataformas globales con estrategia de marketing.',
  },
]
