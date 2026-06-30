import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Bus, MapPin, Clock, WifiOff } from 'lucide-react'
import api from '../api.js'
import { timeAgo } from '../utils.js'

// Smoothly pans the map to the bus position on every location update
function MapController({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.panTo([position.latitude, position.longitude], {
        animate: true,
        duration: 0.8,
      })
    }
  }, [map, position])
  return null
}

const DEFAULT_CENTER = [23.8103, 90.4125] // Dhaka fallback

export default function BusTracking() {
  const { id: busId } = useParams()
  const navigate       = useNavigate()

  const [location,    setLocation]    = useState(null)
  const [busDetails,  setBusDetails]  = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [busError,    setBusError]    = useState(null)
  const [, setTick]                   = useState(0)

  // Tick every second so "X ago" labels re-compute
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // Load bus details once (name, route, active status)
  useEffect(() => {
    api.get('/buses/')
      .then(({ data }) => {
        const bus = data.find(b => String(b.id) === String(busId))
        if (!bus) setBusError('Bus not found.')
        else setBusDetails(bus)
      })
      .catch(() => setBusError('Could not load bus details.'))
  }, [busId])

  // Poll location every 4 seconds
  useEffect(() => {
    const poll = async () => {
      try {
        const { data } = await api.get(`/buses/${busId}/location/`)
        setLocation(data)
      } catch {
        // Keep last known position; stale indicator via timestamp
      } finally {
        setLoading(false)
      }
    }

    poll()
    const id = setInterval(poll, 4000)
    return () => clearInterval(id)
  }, [busId])

  // Custom bus marker — circle with bus emoji
  const busIcon = useMemo(() => L.divIcon({
    html: `<div style="
      width:48px;height:48px;
      background:#2563eb;
      border-radius:50%;
      border:3px solid white;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 6px 24px rgba(37,99,235,0.55);
      font-size:22px;
      line-height:1;
    ">🚌</div>`,
    className: '',
    iconSize:   [48, 48],
    iconAnchor: [24, 24],
  }), [])

  const isLive   = Boolean(location)
  const mapCenter = location ? [location.latitude, location.longitude] : DEFAULT_CENTER
  const isStale   = location?.updated_at
    ? (Date.now() - new Date(location.updated_at)) > 30_000
    : false

  if (busError) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4 text-center px-6">
        <Bus className="w-14 h-14 text-slate-700" />
        <p className="text-white font-semibold text-lg">{busError}</p>
        <button
          onClick={() => navigate('/')}
          className="text-blue-400 hover:text-blue-300 text-sm underline underline-offset-2"
        >
          Back to home
        </button>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-900">

      {/* ── Map ──────────────────────────────────────────────────────── */}
      <MapContainer
        center={mapCenter}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {location && (
          <Marker
            position={[location.latitude, location.longitude]}
            icon={busIcon}
          />
        )}
        <MapController position={location} />
      </MapContainer>

      {/* ── No-data overlay (shown until first GPS fix) ───────────────── */}
      <AnimatePresence>
        {!isLive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-30"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-8 h-8 text-slate-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <p className="text-slate-400 text-sm">Waiting for GPS data…</p>
              </>
            ) : (
              <>
                <WifiOff className="w-12 h-12 text-slate-600" />
                <p className="text-white font-semibold">No location data yet</p>
                <p className="text-slate-500 text-sm text-center max-w-xs">
                  The driver hasn&apos;t started their trip, or GPS hasn&apos;t acquired a fix.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="text-blue-400 hover:text-blue-300 text-sm underline underline-offset-2 mt-2"
                >
                  Back to home
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="bg-linear-to-b from-black/65 to-transparent px-4 pt-12 pb-8">
          <div className="flex items-center gap-3 pointer-events-auto max-w-lg mx-auto">

            <motion.button
              onClick={() => navigate('/')}
              whileTap={{ scale: 0.88 }}
              className="w-10 h-10 bg-white/15 backdrop-blur-md rounded-full flex items-center justify-center border border-white/15 hover:bg-white/25 transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </motion.button>

            <div className="flex-1 min-w-0">
              <p className="font-bold text-white leading-tight truncate">
                {busDetails?.name ?? `Bus #${busId}`}
              </p>
              <p className="text-white/55 text-xs mt-0.5 truncate">
                {busDetails?.route ?? 'Loading…'}
              </p>
            </div>

            {/* Live / offline badge */}
            <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm border shrink-0 ${
              isLive && !isStale
                ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/30'
                : isStale
                  ? 'bg-amber-500/25 text-amber-300 border-amber-500/30'
                  : 'bg-slate-700/50 text-slate-400 border-slate-600/40'
            }`}>
              {isLive && !isStale ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  LIVE
                </>
              ) : isStale ? (
                <> <Clock className="w-3 h-3" /> STALE </>
              ) : (
                <> <WifiOff className="w-3 h-3" /> OFFLINE </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom info panel ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isLive && (
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 32 }}
            transition={{ duration: 0.35 }}
            className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none"
          >
            <div className="bg-linear-to-t from-black/75 to-transparent px-4 pt-12 pb-8">
              <div className="max-w-sm mx-auto pointer-events-auto">
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/15 shadow-2xl">
                  <div className="flex items-center gap-3">

                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
                      <Bus className="w-5 h-5 text-white" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <p className="text-xs text-slate-300 truncate">{busDetails?.route ?? '—'}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <p className="text-xs text-slate-400">
                          {location?.updated_at ? `Updated ${timeAgo(location.updated_at)}` : 'Location received'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs text-slate-500 mb-0.5">Coordinates</p>
                      <p className="text-xs text-slate-400 font-mono">
                        {location?.latitude.toFixed(4)}, {location?.longitude.toFixed(4)}
                      </p>
                    </div>
                  </div>

                  {isStale && (
                    <p className="mt-3 text-xs text-amber-400/80 text-center border-t border-white/10 pt-3">
                      GPS data is over 30s old — driver may have ended the trip.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
