import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Bus, MapPin, Clock, WifiOff } from 'lucide-react'
import api from '../api.js'
import { timeAgo } from '../utils.js'

function MapController({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.panTo([position.latitude, position.longitude], { animate: true, duration: 0.8 })
    }
  }, [map, position])
  return null
}

const DEFAULT_CENTER = [23.8103, 90.4125]

export default function BusTracking() {
  const { id: busId } = useParams()
  const navigate       = useNavigate()

  const [location,   setLocation]   = useState(null)
  const [busDetails, setBusDetails] = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [busError,   setBusError]   = useState(null)
  const [, setTick]                 = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    api.get('/buses/')
      .then(({ data }) => {
        const bus = data.find(b => String(b.id) === String(busId))
        if (!bus) setBusError('Bus not found.')
        else setBusDetails(bus)
      })
      .catch(() => setBusError('Could not load bus details.'))
  }, [busId])

  useEffect(() => {
    const poll = async () => {
      try {
        const { data } = await api.get(`/buses/${busId}/location/`)
        setLocation(data)
      } catch { /* keep last known position */ }
      finally { setLoading(false) }
    }
    poll()
    const id = setInterval(poll, 4000)
    return () => clearInterval(id)
  }, [busId])

  // Violet marker — stands out on the light CartoDB map
  const busIcon = useMemo(() => L.divIcon({
    html: `<div style="
      width:46px;height:46px;
      background:#7c3aed;
      border-radius:50%;
      border:3px solid white;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 4px 20px rgba(124,58,237,0.45);
      font-size:20px;
      line-height:1;
    ">🚌</div>`,
    className: '',
    iconSize:   [46, 46],
    iconAnchor: [23, 23],
  }), [])

  const isLive    = Boolean(location)
  const mapCenter = location ? [location.latitude, location.longitude] : DEFAULT_CENTER
  const isStale   = location?.updated_at
    ? (Date.now() - new Date(location.updated_at)) > 30_000
    : false

  if (busError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 text-center px-6">
        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
          <Bus className="w-7 h-7 text-gray-400" />
        </div>
        <p className="text-gray-900 font-semibold">{busError}</p>
        <button
          onClick={() => navigate('/')}
          className="text-violet-600 hover:text-violet-700 text-sm font-medium underline underline-offset-2"
        >
          Back to home
        </button>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-100">

      {/* ── Map (CartoDB Positron — clean light tiles) ─────────────── */}
      <MapContainer
        center={mapCenter}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
        />
        {location && (
          <Marker position={[location.latitude, location.longitude]} icon={busIcon} />
        )}
        <MapController position={location} />
      </MapContainer>

      {/* ── No-data overlay ──────────────────────────────────────────── */}
      <AnimatePresence>
        {!isLive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-30"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-7 h-7 text-gray-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <p className="text-gray-500 text-sm">Waiting for GPS data…</p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
                  <WifiOff className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-900 font-semibold">No location data yet</p>
                <p className="text-gray-400 text-sm text-center max-w-xs">
                  The driver hasn&apos;t started their trip yet.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="text-violet-600 hover:text-violet-700 text-sm font-medium underline underline-offset-2 mt-1"
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
        <div className="px-4 pt-10 pb-4">
          <div className="bg-white/90 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm px-4 py-3 flex items-center gap-3 pointer-events-auto max-w-lg mx-auto">

            <motion.button
              onClick={() => navigate('/')}
              whileTap={{ scale: 0.9 }}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </motion.button>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm leading-tight truncate">
                {busDetails?.name ?? `Bus #${busId}`}
              </p>
              <p className="text-gray-400 text-xs mt-0.5 truncate">
                {busDetails?.route ?? 'Loading…'}
              </p>
            </div>

            {/* Status badge */}
            <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border shrink-0 ${
              isLive && !isStale
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : isStale
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-gray-100 text-gray-500 border-gray-200'
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
                <><Clock className="w-3 h-3" /> STALE</>
              ) : (
                <><WifiOff className="w-3 h-3" /> OFFLINE</>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom info panel ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isLive && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none"
          >
            <div className="px-4 pb-6">
              <div className="max-w-sm mx-auto pointer-events-auto">
                <div className="bg-white/90 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm p-4">
                  <div className="flex items-center gap-3">

                    <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shrink-0">
                      <Bus className="w-5 h-5 text-white" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                        <p className="text-xs text-gray-600 truncate">{busDetails?.route ?? '—'}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                        <p className="text-xs text-gray-400">
                          {location?.updated_at ? `Updated ${timeAgo(location.updated_at)}` : 'Location received'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400 mb-0.5">Coordinates</p>
                      <p className="text-xs text-gray-600 font-mono">
                        {location?.latitude.toFixed(4)}, {location?.longitude.toFixed(4)}
                      </p>
                    </div>
                  </div>

                  {isStale && (
                    <p className="mt-3 text-xs text-amber-600 text-center border-t border-gray-100 pt-3">
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
