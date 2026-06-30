import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bus, MapPin, Wifi, WifiOff, LogOut, Navigation, AlertTriangle } from 'lucide-react'
import api from '../api.js'

const STATUS_CONFIG = {
  idle:      { label: 'Not on trip',     color: 'text-slate-400',   bg: 'bg-slate-500/20',   Icon: WifiOff    },
  acquiring: { label: 'Acquiring GPS…',  color: 'text-amber-400',   bg: 'bg-amber-500/20',   Icon: Navigation },
  streaming: { label: 'Streaming GPS',   color: 'text-emerald-400', bg: 'bg-emerald-500/20', Icon: Wifi       },
  error:     { label: 'GPS Error',       color: 'text-red-400',     bg: 'bg-red-500/20',     Icon: AlertTriangle },
}

export default function DriverDashboard() {
  const navigate    = useNavigate()
  const watchIdRef  = useRef(null)

  const [isTripping,  setIsTripping]  = useState(false)
  const [status,      setStatus]      = useState('idle')
  const [geoError,    setGeoError]    = useState('')
  const [lastUpdate,  setLastUpdate]  = useState(null)
  const [busInfo,     setBusInfo]     = useState(null)
  const [driverName,  setDriverName]  = useState('')

  // Auth guard + hydrate from localStorage
  useEffect(() => {
    if (!localStorage.getItem('driverToken')) {
      navigate('/driver-login', { replace: true })
      return
    }
    setDriverName(localStorage.getItem('driverName') ?? 'Driver')
    setBusInfo(JSON.parse(localStorage.getItem('driverBus') ?? 'null'))
  }, [navigate])

  // Cleanup watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  const startTrip = async () => {
    setIsTripping(true)
    setStatus('acquiring')
    setGeoError('')

    try { await api.post('/trip/start/') } catch { /* non-fatal */ }

    if (!navigator.geolocation) {
      setStatus('error')
      setGeoError('Geolocation not supported by this browser.')
      return
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        setStatus('streaming')
        setLastUpdate(new Date())
        try {
          await api.post('/location/update/', {
            latitude:  pos.coords.latitude,
            longitude: pos.coords.longitude,
          })
        } catch { /* will retry on next tick */ }
      },
      (err) => {
        setStatus('error')
        setGeoError(err.message)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  }

  const endTrip = async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    try { await api.post('/trip/end/') } catch { /* non-fatal */ }
    setIsTripping(false)
    setStatus('idle')
    setLastUpdate(null)
  }

  const handleLogout = () => {
    if (isTripping) endTrip()
    localStorage.removeItem('driverToken')
    localStorage.removeItem('driverName')
    localStorage.removeItem('driverBus')
    navigate('/driver-login', { replace: true })
  }

  const { label, color, bg, Icon } = STATUS_CONFIG[status]
  const noBus = !busInfo

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col select-none">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 pt-safe-top py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Bus className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-white leading-tight">
              {busInfo?.name ?? 'No Bus Assigned'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5 leading-tight">
              {busInfo?.route ?? '—'}
            </p>
          </div>
        </div>

        <motion.button
          onClick={handleLogout}
          whileTap={{ scale: 0.92 }}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm py-2 px-3 rounded-lg hover:bg-white/5"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </motion.button>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center gap-10 px-6 py-8">

        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <p className="text-slate-400 text-sm">Welcome back,</p>
          <p className="text-2xl font-bold mt-0.5">{driverName}</p>
        </motion.div>

        {/* Status pill */}
        <AnimatePresence mode="wait">
          <motion.div
            key={status}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium ${bg} ${color}`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
            {geoError && (
              <span className="text-xs opacity-70 ml-1 max-w-40 truncate">
                ({geoError})
              </span>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── Big toggle button ─────────────────────────────────────────── */}
        <div className="relative flex items-center justify-center">

          {/* Pulsing rings — only when streaming */}
          <AnimatePresence>
            {isTripping && status === 'streaming' && (
              <>
                <motion.span
                  key="ring1"
                  className="absolute w-56 h-56 rounded-full bg-emerald-500/20"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 1.35, opacity: 0 }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                />
                <motion.span
                  key="ring2"
                  className="absolute w-56 h-56 rounded-full bg-emerald-500/15"
                  initial={{ scale: 1, opacity: 0.4 }}
                  animate={{ scale: 1.7, opacity: 0 }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: 0.6 }}
                />
              </>
            )}
          </AnimatePresence>

          <motion.button
            onClick={isTripping ? endTrip : startTrip}
            disabled={noBus}
            whileTap={{ scale: 0.93 }}
            initial={{ backgroundColor: '#10b981' }}
            animate={{
              backgroundColor: isTripping ? '#ef4444' : '#10b981',
              boxShadow: isTripping
                ? '0 0 70px 10px rgba(239,68,68,0.35)'
                : '0 0 70px 10px rgba(16,185,129,0.35)',
            }}
            transition={{ duration: 0.35 }}
            className="relative w-52 h-52 rounded-full text-white font-bold flex flex-col items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed z-10"
          >
            <MapPin className="w-9 h-9" />
            <AnimatePresence mode="wait">
              <motion.span
                key={isTripping ? 'end' : 'start'}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="text-xl tracking-wide"
              >
                {isTripping ? 'END TRIP' : 'START TRIP'}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Last GPS update */}
        <div className="h-6">
          <AnimatePresence>
            {lastUpdate && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-slate-500 text-sm"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                Last update: {lastUpdate.toLocaleTimeString()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* No-bus warning */}
        {noBus && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-amber-400/80 text-sm text-center max-w-xs leading-relaxed"
          >
            No bus is assigned to your account. Contact your administrator.
          </motion.p>
        )}
      </main>
    </div>
  )
}
