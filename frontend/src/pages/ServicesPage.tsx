import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Music2, Gavel, Radio, Mic2, Star, Send, CheckCircle, Loader2 } from 'lucide-react'
import { api, ContactPayload } from '../lib/api'

const SERVICES = [
  {
    id: 'produccion',
    Icon: Music2,
    title: 'Producción Musical',
    tagline: 'Donde nace el sonido',
    desc: 'Nuestro estudio de grabación de clase mundial cuenta con la tecnología más avanzada. Producción, grabación, mezcla y masterización con ingenieros ganadores de premios internacionales.',
    features: ['Cabinas acústicas de aislamiento total', 'Consola SSL 9000', 'Masterización con Dolby Atmos', 'Producción beat-making exclusiva'],
    price: 'Desde $500/día',
  },
  {
    id: 'legal',
    Icon: Gavel,
    title: 'Abogacía Musical',
    tagline: 'Tu arte, protegido',
    desc: 'Equipo jurídico especializado en derecho de la propiedad intelectual, contratos discográficos, licencias de sincronización y protección de derechos de autor a nivel internacional.',
    features: ['Registro de derechos de autor', 'Negociación de contratos', 'Licencias de sincronización (Sync)', 'Representación legal en disputas'],
    price: 'Consulta inicial gratuita',
  },
  {
    id: 'distribucion',
    Icon: Radio,
    title: 'Distribución Digital',
    desc: 'Llevamos tu música a las 150+ plataformas digitales más importantes del mundo con estrategias de marketing personalizadas para maximizar tu alcance.',
    tagline: 'El mundo escucha',
    features: ['Spotify, Apple Music, Tidal y más', 'Pitcheo editorial a playlists', 'Análisis de datos en tiempo real', 'Royalty collection global'],
    price: 'Desde $29/año',
  },
  {
    id: 'coaching',
    Icon: Mic2,
    title: 'Coaching Artístico',
    tagline: 'Desarrolla tu potencial',
    desc: 'Sesiones personalizadas con artistas y productores de trayectoria para desarrollar tu identidad artística, técnica vocal, presencia escénica y estrategia de carrera.',
    features: ['Técnica vocal avanzada', 'Identidad de marca artística', 'Desarrollo de contenido digital', 'Estrategia de lanzamiento'],
    price: 'Desde $150/sesión',
  },
]

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.1 } } },
  item: { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } },
}

export default function ServicesPage() {
  const [activeService, setActiveService] = useState<string | null>(null)
  const [form, setForm] = useState<ContactPayload>({
    name: '', email: '', service: '', message: '',
  })
  const [sending,  setSending]  = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [error,    setError]    = useState('')

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      await api.contact.submit(form)
      setSuccess(true)
      setForm({ name: '', email: '', service: '', message: '' })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-32 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-display text-xs tracking-[0.4em] text-gold/60 uppercase mb-3"
          >
            Servicios Profesionales
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-5xl text-white mb-5"
          >
            El Estudio a tu servicio
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/40 text-lg max-w-2xl mx-auto text-balance"
          >
            Lao-tse Records ofrece una suite completa de servicios para artistas que buscan elevar su carrera al siguiente nivel.
          </motion.p>
        </div>

        {/* Services grid */}
        <motion.div
          variants={stagger.container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-24"
        >
          {SERVICES.map((svc) => (
            <motion.div
              key={svc.id}
              variants={stagger.item}
              className={`card-studio p-8 cursor-pointer transition-all duration-300
                          hover:border-gold/40 hover:-translate-y-1
                          hover:shadow-[0_20px_60px_rgba(212,175,55,0.08)]
                          ${activeService === svc.id ? 'border-gold/40' : ''}`}
              onClick={() => setActiveService((v) => v === svc.id ? null : svc.id)}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center">
                  <svc.Icon size={28} className="text-gold" />
                </div>
                <span className="text-xs text-gold/60 bg-gold/10 px-3 py-1 rounded-full font-medium">
                  {svc.price}
                </span>
              </div>

              <p className="text-xs tracking-widest text-gold/50 uppercase mb-1">{svc.tagline}</p>
              <h3 className="font-display text-2xl text-white mb-3">{svc.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed mb-5">{svc.desc}</p>

              <AnimatePresence>
                {activeService === svc.id && (
                  <motion.ul
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{   opacity: 0, height: 0 }}
                    className="space-y-2 border-t border-studio-border pt-5 overflow-hidden"
                  >
                    {svc.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-white/60">
                        <Star size={12} className="text-gold flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>

              <button
                className="mt-5 text-xs text-gold/60 hover:text-gold transition-colors"
                onClick={(e) => { e.stopPropagation(); setActiveService((v) => v === svc.id ? null : svc.id) }}
              >
                {activeService === svc.id ? 'Menos info ↑' : 'Ver detalles ↓'}
              </button>
            </motion.div>
          ))}
        </motion.div>

        {/* Contact form */}
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl text-white mb-3">Contáctanos</h2>
            <p className="text-white/40">
              Cuéntanos sobre tu proyecto. Nuestro equipo te responderá en 24 horas.
            </p>
          </div>

          <div className="card-studio p-8 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gold-gradient" />

            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <CheckCircle size={56} className="text-gold mx-auto mb-4" />
                  <h3 className="font-display text-2xl text-white mb-2">¡Mensaje enviado!</h3>
                  <p className="text-white/50">Nos pondremos en contacto contigo pronto.</p>
                  <button
                    onClick={() => setSuccess(false)}
                    className="btn-outline-gold mt-8"
                  >
                    Enviar otro mensaje
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleContact}
                  className="space-y-5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">
                        Nombre
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Tu nombre artístico"
                        className="input-studio"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="tu@email.com"
                        className="input-studio"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">
                      Servicio de interés
                    </label>
                    <select
                      value={form.service ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, service: e.target.value || undefined }))}
                      className="input-studio"
                    >
                      <option value="">Selecciona un servicio…</option>
                      {SERVICES.map((s) => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">
                      Tu mensaje
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                      placeholder="Cuéntanos sobre tu proyecto, tus metas artísticas y cómo podemos ayudarte…"
                      className="input-studio resize-none"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={sending}
                    className="btn-gold w-full justify-center py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {sending
                      ? <Loader2 size={18} className="animate-spin" />
                      : <Send size={18} />
                    }
                    Enviar Mensaje
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
