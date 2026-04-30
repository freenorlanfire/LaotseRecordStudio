import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, X, AlertCircle, Loader2 } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

interface Props {
  isOpen:  boolean
  onClose: () => void
}

export function LoginModal({ isOpen, onClose }: Props) {
  const [tab,      setTab]      = useState<'login' | 'register'>('login')
  const [showPass, setShowPass] = useState(false)
  const [form,     setForm]     = useState({ username: '', email: '', password: '' })
  const { login, register, isLoading, error, clearError } = useAuthStore()

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError()
    setForm((f) => ({ ...f, [k]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (tab === 'login') {
        await login(form.email, form.password)
      } else {
        await register(form.username, form.email, form.password)
      }
      onClose()
    } catch {
      // error shown via store
    }
  }

  const switchTab = (t: typeof tab) => {
    setTab(t)
    clearError()
    setForm({ username: '', email: '', password: '' })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-[61] flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{   opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="card-studio w-full max-w-md relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Decorative gold line */}
              <div className="absolute top-0 inset-x-0 h-px bg-gold-gradient" />

              {/* Header */}
              <div className="px-8 pt-8 pb-6">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 text-white/30 hover:text-gold
                             transition-colors rounded-full hover:bg-studio-muted"
                >
                  <X size={18} />
                </button>

                <div className="mb-6 text-center">
                  <p className="font-script text-3xl text-gold mb-1">Lao-tse</p>
                  <p className="font-display text-xs tracking-[0.4em] text-white/30 uppercase">
                    Records Studio
                  </p>
                </div>

                {/* Tabs */}
                <div className="flex rounded-xl bg-studio-muted p-1">
                  {(['login', 'register'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => switchTab(t)}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        tab === t
                          ? 'bg-gold text-black shadow-md'
                          : 'text-white/40 hover:text-white/70'
                      }`}
                    >
                      {t === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
                <AnimatePresence mode="wait">
                  {tab === 'register' && (
                    <motion.div
                      key="username"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{   opacity: 0, height: 0 }}
                    >
                      <input
                        type="text"
                        placeholder="Nombre de artista"
                        value={form.username}
                        onChange={set('username')}
                        required
                        className="input-studio"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={form.email}
                  onChange={set('email')}
                  required
                  className="input-studio"
                />

                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Contraseña"
                    value={form.password}
                    onChange={set('password')}
                    required
                    minLength={8}
                    className="input-studio pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2
                               text-white/30 hover:text-gold transition-colors"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{   opacity: 0 }}
                      className="flex items-center gap-2 text-sm text-red-400
                                 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
                    >
                      <AlertCircle size={14} />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-gold w-full justify-center py-3 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading
                    ? <Loader2 size={18} className="animate-spin" />
                    : tab === 'login' ? 'Entrar al Estudio' : 'Crear Cuenta'
                  }
                </button>

                {tab === 'login' && (
                  <p className="text-center text-xs text-white/30 pt-2">
                    ¿No tienes cuenta?{' '}
                    <button
                      type="button"
                      onClick={() => switchTab('register')}
                      className="text-gold hover:text-gold-300 transition-colors"
                    >
                      Regístrate gratis
                    </button>
                  </p>
                )}
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
