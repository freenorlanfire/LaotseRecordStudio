import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navbar }       from './components/Layout/Navbar'
import { GlobalPlayer } from './components/Layout/GlobalPlayer'
import Home         from './pages/Home'
import FeedPage     from './pages/FeedPage'
import CatalogPage  from './pages/CatalogPage'
import EventsPage   from './pages/EventsPage'
import ServicesPage from './pages/ServicesPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-studio-black text-white">
        <Navbar />

        <main>
          <Routes>
            <Route path="/"         element={<Home />}         />
            <Route path="/feed"     element={<FeedPage />}     />
            <Route path="/catalog"  element={<CatalogPage />}  />
            <Route path="/events"   element={<EventsPage />}   />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="*"         element={<NotFound />}     />
          </Routes>
        </main>

        <GlobalPlayer />
      </div>
    </BrowserRouter>
  )
}

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <p className="font-script text-8xl text-gold mb-4">404</p>
      <h1 className="font-display text-3xl text-white mb-4">Página no encontrada</h1>
      <p className="text-white/40 mb-8">Esta pista no existe en nuestro catálogo.</p>
      <a href="/" className="btn-gold">Volver al Inicio</a>
    </div>
  )
}
