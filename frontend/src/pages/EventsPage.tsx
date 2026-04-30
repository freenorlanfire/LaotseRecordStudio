import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, MapPin, Ticket, Loader2 } from 'lucide-react'
import { api, Event } from '../lib/api'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function EventsPage() {
  const [events,  setEvents]  = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.events.list().then(setEvents).finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen pt-24 pb-32 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <p className="font-display text-xs tracking-[0.4em] text-gold/60 uppercase mb-2">
            Agenda
          </p>
          <h1 className="font-display text-4xl text-white">Próximos Eventos</h1>
          <p className="text-white/40 mt-2">Conciertos, lanzamientos y showcases de Lao-tse Records.</p>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 size={28} className="animate-spin text-gold/50" />
          </div>
        )}

        {!loading && events.length === 0 && (
          <div className="text-center py-24 text-white/20">
            <CalendarDays size={48} className="mx-auto mb-4" />
            <p>No hay eventos próximos. Vuelve pronto.</p>
          </div>
        )}

        <div className="space-y-6">
          {events.map((ev, i) => {
            const date = new Date(ev.event_date)
            return (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="card-studio overflow-hidden hover:border-gold/30 transition-all duration-300
                           hover:shadow-[0_10px_40px_rgba(212,175,55,0.06)] group"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Cover */}
                  <div className="sm:w-48 h-36 sm:h-auto flex-shrink-0 bg-studio-muted relative overflow-hidden">
                    {ev.cover_url ? (
                      <img
                        src={ev.cover_url}
                        alt={ev.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <CalendarDays size={32} className="text-gold/30" />
                      </div>
                    )}

                    {/* Date badge overlay */}
                    <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm
                                    rounded-xl px-3 py-2 text-center border border-gold/20">
                      <span className="block text-gold font-bold text-xl leading-none">
                        {format(date, 'd')}
                      </span>
                      <span className="block text-gold/60 text-xs uppercase tracking-wider mt-0.5">
                        {format(date, 'MMM', { locale: es })}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <h2 className="font-display text-2xl text-white mb-2 group-hover:text-gold/90 transition-colors">
                        {ev.title}
                      </h2>
                      {ev.description && (
                        <p className="text-white/50 text-sm leading-relaxed mb-4">{ev.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-white/40">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays size={14} className="text-gold/60" />
                          {format(date, "EEEE d 'de' MMMM, yyyy · HH:mm", { locale: es })}
                        </span>
                        {ev.location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-gold/60" />
                            {ev.location}
                          </span>
                        )}
                      </div>
                    </div>

                    {ev.ticket_url && (
                      <div className="mt-5">
                        <a
                          href={ev.ticket_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-gold text-sm py-2.5 px-6 inline-flex"
                        >
                          <Ticket size={16} />
                          Comprar Entradas
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
