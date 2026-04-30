import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, LogOut, User } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { LoginModal } from '../Auth/LoginModal'
import clsx from 'clsx'

const LINKS = [
  { to: '/',         label: 'Inicio'    },
  { to: '/feed',     label: 'El Muro'   },
  { to: '/catalog',  label: 'Catálogo'  },
  { to: '/events',   label: 'Eventos'   },
  { to: '/services', label: 'Servicios' },
]

export function Navbar() {
  const [scrolled,    setScrolled]    = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [loginOpen,   setLoginOpen]   = useState(false)
  const { user, logout }              = useAuthStore()
  const location                      = useLocation()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  return (
    <>
      <motion.header
        className={clsx(
          'fixed top-0 inset-x-0 z-50 transition-all duration-500',
          scrolled
            ? 'bg-black/95 backdrop-blur-md border-b border-studio-border shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
            : 'bg-transparent',
        )}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <span className="font-script text-2xl text-gold leading-none tracking-tight
                             group-hover:text-gold-300 transition-colors">
              Lao-tse
            </span>
            <span className="font-display text-xs tracking-[0.4em] text-white/50 uppercase
                             group-hover:text-gold/60 transition-colors">
              Records
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={clsx(
                  'nav-link relative pb-1',
                  location.pathname === to && 'text-gold',
                )}
              >
                {label}
                {location.pathname === to && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-0 right-0 h-px bg-gold"
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full
                                bg-studio-card border border-studio-border">
                  <div className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center">
                    {user.avatar_url
                      ? <img src={user.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                      : <User size={14} className="text-gold" />
                    }
                  </div>
                  <span className="text-sm text-white/80 font-medium">{user.username}</span>
                  {user.role !== 'client' && (
                    <span className="text-[10px] uppercase tracking-widest text-gold/70 bg-gold/10
                                     px-1.5 py-0.5 rounded-full">
                      {user.role}
                    </span>
                  )}
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-full text-white/40 hover:text-gold
                             hover:bg-studio-card transition-all"
                  title="Cerrar sesión"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button onClick={() => setLoginOpen(true)} className="btn-gold text-sm py-2 px-5">
                Entrar
              </button>
            )}
          </div>

          {/* Mobile burger */}
          <button
            className="md:hidden p-2 text-white/70 hover:text-gold transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{  opacity: 0, height: 0 }}
              className="md:hidden bg-black/98 border-t border-studio-border overflow-hidden"
            >
              <nav className="flex flex-col px-4 py-6 gap-5">
                {LINKS.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className={clsx(
                      'text-base font-medium tracking-wide',
                      location.pathname === to ? 'text-gold' : 'text-white/70',
                    )}
                  >
                    {label}
                  </Link>
                ))}
                <div className="pt-4 border-t border-studio-border">
                  {user ? (
                    <button onClick={logout} className="btn-outline-gold w-full justify-center">
                      <LogOut size={16} /> Salir
                    </button>
                  ) : (
                    <button onClick={() => setLoginOpen(true)} className="btn-gold w-full justify-center">
                      Entrar
                    </button>
                  )}
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  )
}
