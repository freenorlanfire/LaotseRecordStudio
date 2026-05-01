import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, ArrowRight, Music2, Radio, Gavel, Mic2 } from 'lucide-react'
import { api, Track, Event } from '../lib/api'
import { usePlayerStore } from '../store/playerStore'

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.1 } } },
  item:      { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.6 } } },
}

export default function Home() {
  const [featuredTracks, setFeaturedTracks] = useState<Track[]>([])
  const [events,         setEvents]         = useState<Event[]>([])
  const { playTrack } = usePlayerStore()

  useEffect(() => {
    api.tracks.list(1).then(r => setFeaturedTracks(r.items.slice(0, 4)))
    api.events.list().then(setEvents)
  }, [])

  return (
    <div className="min-h-screen">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

        {/* Fondo oscuro */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#050505] to-black" />

        {/* Blob blanco difuminado — arriba izquierda */}
        <motion.div
          animate={{ scale:[1,1.15,1], opacity:[0.04,0.08,0.04] }}
          transition={{ duration:9, repeat:Infinity, ease:'easeInOut' }}
          className="absolute top-1/4 left-1/5 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background:'radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)', filter:'blur(80px)' }}
        />
        {/* Blob dorado difuminado — abajo derecha */}
        <motion.div
          animate={{ scale:[1.1,1,1.1], opacity:[0.05,0.12,0.05] }}
          transition={{ duration:12, repeat:Infinity, ease:'easeInOut', delay:2 }}
          className="absolute bottom-1/4 right-1/5 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background:'radial-gradient(circle, rgba(200,150,12,0.8) 0%, transparent 70%)', filter:'blur(90px)' }}
        />
        {/* Blob blanco pequeño — centro */}
        <motion.div
          animate={{ opacity:[0.02,0.05,0.02], scale:[1,1.2,1] }}
          transition={{ duration:7, repeat:Infinity, ease:'easeInOut', delay:4 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] pointer-events-none"
          style={{ background:'radial-gradient(ellipse, rgba(255,255,255,0.3) 0%, transparent 65%)', filter:'blur(60px)' }}
        />

        {/* CONTENIDO */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">

          {/* Logo imagen real */}
          <motion.div
            initial={{ opacity:0, scale:0.85 }}
            animate={{ opacity:1, scale:1 }}
            transition={{ duration:1.2, ease:'easeOut' }}
            className="mb-4 flex justify-center"
          >
            <img
              src="/img/LaotseRecordStudio-3.png"
              alt="Lao-tse Records"
              className="w-64 sm:w-80 md:w-96 object-contain drop-shadow-[0_0_40px_rgba(200,150,12,0.4)]
                         animate-float"
            />
          </motion.div>

          <motion.p
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            transition={{ duration:1, delay:0.6 }}
            className="font-display text-xs sm:text-sm tracking-[0.5em] text-white/30 uppercase mb-3"
          >
            Records Studio
          </motion.p>

          <motion.p
            initial={{ opacity:0, y:20 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.8, delay:0.8 }}
            className="text-white/45 text-base sm:text-lg max-w-xl mx-auto mb-12 leading-relaxed text-balance"
          >
            Donde el arte se convierte en legado. Sello discográfico de élite para artistas que buscan la excelencia.
          </motion.p>

          <motion.div
            initial={{ opacity:0, y:20 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.8, delay:1 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <Link to="/catalog" className="btn-gold text-base px-8 py-3.5">
              <Play size={18} className="fill-black" />
              Escuchar Ahora
            </Link>
            <Link to="/services" className="btn-outline-gold text-base px-8 py-3.5">
              Nuestros Servicios <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div className="absolute bottom-10 left-1/2 -translate-x-1/2"
          animate={{ y:[0,8,0] }} transition={{ duration:2, repeat:Infinity }}>
          <div className="w-5 h-8 border border-white/15 rounded-full flex justify-center pt-1.5">
            <div className="w-1 h-2 bg-white/30 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* ── FEATURED TRACKS ──────────────────────────────────── */}
      {featuredTracks.length > 0 && (
        <section className="py-24 px-4 max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="font-display text-xs tracking-[0.4em] mb-2 uppercase"
                 style={{ color:'rgba(200,150,12,0.7)' }}>Lo más reciente</p>
              <h2 className="font-display text-4xl text-white">Catálogo Destacado</h2>
            </div>
            <Link to="/catalog"
              className="text-sm font-medium flex items-center gap-2 text-white/40 hover:text-white transition-colors">
              Ver todo <ArrowRight size={16} />
            </Link>
          </div>

          <motion.div
            variants={stagger.container} initial="hidden" whileInView="show"
            viewport={{ once:true, amount:0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {featuredTracks.map(track => (
              <motion.div key={track.id} variants={stagger.item}>
                <TrackCard track={track} onPlay={() => playTrack(track, featuredTracks)} />
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {/* ── SERVICES ─────────────────────────────────────────── */}
      <section className="py-24 px-4 border-y border-studio-border"
               style={{ background:'linear-gradient(180deg,#050505 0%,#000 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-display text-xs tracking-[0.4em] uppercase mb-3"
               style={{ color:'rgba(200,150,12,0.7)' }}>Servicios Profesionales</p>
            <h2 className="font-display text-4xl text-white mb-4">Todo lo que necesita tu carrera</h2>
            <p className="text-white/35 max-w-xl mx-auto">
              Desde la producción hasta la protección legal de tu música.
            </p>
          </div>

          <motion.div
            variants={stagger.container} initial="hidden" whileInView="show"
            viewport={{ once:true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {SERVICES.map(s => (
              <motion.div key={s.title} variants={stagger.item}
                className="card-studio p-8 group transition-all duration-300 hover:-translate-y-1"
                style={{ '--hover-border':'rgba(200,150,12,0.3)' } as React.CSSProperties}
                onMouseEnter={e => (e.currentTarget.style.borderColor='rgba(200,150,12,0.3)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor='')}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-colors"
                     style={{ background:'rgba(200,150,12,0.1)' }}
                     onMouseEnter={e => (e.currentTarget.style.background='rgba(200,150,12,0.2)')}
                >
                  <s.Icon size={24} style={{ color:'#C8960C' }} />
                </div>
                <h3 className="font-display text-xl text-white mb-3">{s.title}</h3>
                <p className="text-white/35 text-sm leading-relaxed">{s.desc}</p>
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

      {/* ── EVENTS ──────────────────────────────────────────── */}
      {events.length > 0 && (
        <section className="py-24 px-4 max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="font-display text-xs tracking-[0.4em] uppercase mb-2"
                 style={{ color:'rgba(200,150,12,0.7)' }}>Próximamente</p>
              <h2 className="font-display text-4xl text-white">Eventos</h2>
            </div>
            <Link to="/events"
              className="text-sm flex items-center gap-2 text-white/40 hover:text-white transition-colors">
              Ver agenda <ArrowRight size={16} />
            </Link>
          </div>
          <div className="space-y-4">
            {events.slice(0,3).map(ev => <EventRow key={ev.id} event={ev} />)}
          </div>
        </section>
      )}
    </div>
  )
}

function TrackCard({ track, onPlay }: { track: Track; onPlay: () => void }) {
  return (
    <div onClick={onPlay}
      className="card-studio overflow-hidden group cursor-pointer transition-all duration-300
                 hover:-translate-y-1"
      onMouseEnter={e => {
        e.currentTarget.style.borderColor='rgba(200,150,12,0.3)'
        e.currentTarget.style.boxShadow='0 10px 40px rgba(200,150,12,0.08)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor=''
        e.currentTarget.style.boxShadow=''
      }}
    >
      <div className="aspect-square relative overflow-hidden">
        {track.cover_url
          ? <img src={track.cover_url} alt={track.title}
                 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          : <div className="w-full h-full bg-studio-muted flex items-center justify-center">
              <Music2 size={40} className="text-white/10" />
            </div>
        }
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100
                        flex items-center justify-center transition-opacity duration-300">
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
               style={{ background:'#C8960C', boxShadow:'0 0 20px rgba(200,150,12,0.5)' }}>
            <Play size={20} className="text-black fill-black translate-x-0.5" />
          </div>
        </div>
      </div>
      <div className="p-4">
        <p className="text-white font-medium text-sm truncate">{track.title}</p>
        <p className="text-white/35 text-xs mt-1 truncate">{track.artist?.username}</p>
        {track.genre && (
          <span className="mt-2 inline-block text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full"
                style={{ color:'rgba(200,150,12,0.8)', background:'rgba(200,150,12,0.1)' }}>
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
    <div className="card-studio p-5 flex items-center gap-5 transition-colors duration-200 group"
         onMouseEnter={e => (e.currentTarget.style.borderColor='rgba(200,150,12,0.3)')}
         onMouseLeave={e => (e.currentTarget.style.borderColor='')}>
      <div className="flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center transition-colors"
           style={{ background:'rgba(200,150,12,0.1)' }}>
        <span className="font-bold text-lg leading-none" style={{ color:'#C8960C' }}>
          {date.getDate().toString().padStart(2,'0')}
        </span>
        <span className="text-xs uppercase tracking-wider" style={{ color:'rgba(200,150,12,0.5)' }}>
          {date.toLocaleString('es',{month:'short'})}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{event.title}</p>
        {event.location && <p className="text-white/35 text-sm mt-0.5">{event.location}</p>}
      </div>
      {event.ticket_url && (
        <a href={event.ticket_url} target="_blank" rel="noopener noreferrer"
           onClick={e => e.stopPropagation()}
           className="flex-shrink-0 btn-outline-gold text-xs py-2 px-4">
          Tickets
        </a>
      )}
    </div>
  )
}

const SERVICES = [
  { Icon: Music2, title:'Producción Musical',  desc:'Grabación, mezcla y masterización de élite con los mejores ingenieros de sonido.' },
  { Icon: Gavel,  title:'Abogacía Musical',    desc:'Protección legal de tus derechos de autor, contratos discográficos y licencias.' },
  { Icon: Radio,  title:'Distribución Digital', desc:'Coloca tu música en todas las plataformas globales con estrategia de marketing.' },
]
