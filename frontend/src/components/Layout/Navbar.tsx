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
  const [scrolled,   setScrolled]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loginOpen,  setLoginOpen]  = useState(false)
  const { user, logout }            = useAuthStore()
  const location                    = useLocation()

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
            ? 'bg-black/95 backdrop-blur-md border-b border-studio-border shadow-[0_4px_30px_rgba(0,0,0,0.7)]'
            : 'bg-transparent',
        )}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

          {/* Logo — imagen oval */}
          <Link to="/" className="flex items-center group">
            <div className="relative h-12 w-20 overflow-hidden transition-all duration-300
                            group-hover:scale-105"
                 style={{
                   borderRadius: '50%',
                   boxShadow: '0 0 18px rgba(200,150,12,0.35), 0 0 1px rgba(200,150,12,0.6)',
                   border: '1px solid rgba(200,150,12,0.3)',
                 }}>
              <img
                src="/img/Lao-tse Records.jpg"
                alt="Lao-tse Records"
                className="w-full h-full object-cover object-center scale-110"
              />
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={clsx(
                  'nav-link relative pb-1',
                  location.pathname === to && 'text-white',
                )}
              >
                {label}
                {location.pathname === to && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-0 right-0 h-px"
                    style={{ background: '#C8960C' }}
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
                  <div className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center overflow-hidden">
                    {user.avatar_url
                      ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
                      : <User size={13} style={{ color: '#C8960C' }} />
                    }
                  </div>
                  <span className="text-sm text-white/80 font-medium">{user.username}</span>
                  {user.role !== 'client' && (
                    <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                          style={{ color:'#C8960C', background:'rgba(200,150,12,0.12)' }}>
                      {user.role}
                    </span>
                  )}
                </div>
                <button onClick={logout}
                  className="p-2 rounded-full text-white/30 hover:text-white
                             hover:bg-studio-card transition-all" title="Cerrar sesión">
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
            className="md:hidden p-2 text-white/60 hover:text-white transition-colors"
            onClick={() => setMobileOpen(v => !v)}
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
              exit={{   opacity: 0, height: 0 }}
              className="md:hidden bg-black/98 border-t border-studio-border overflow-hidden"
            >
              <nav className="flex flex-col px-4 py-6 gap-5">
                {LINKS.map(({ to, label }) => (
                  <Link key={to} to={to}
                    className={clsx('text-base font-medium tracking-wide',
                      location.pathname === to ? 'text-white' : 'text-white/50')}>
                    {label}
                  </Link>
                ))}
                <div className="pt-4 border-t border-studio-border">
                  {user
                    ? <button onClick={logout} className="btn-outline-gold w-full justify-center"><LogOut size={16}/>Salir</button>
                    : <button onClick={() => setLoginOpen(true)} className="btn-gold w-full justify-center">Entrar</button>
                  }
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
