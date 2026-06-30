import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bus, MapPin, Wifi, WifiOff, LogOut, Navigation, AlertTriangle } from 'lucide-react'
import api from '../api.js'

const STATUS_CONFIG = {
  idle:      { label: 'Not on trip',    color: 'text-gray-500',    bg: 'bg-gray-100',     border: 'border-gray-200',    Icon: WifiOff       },
  acquiring: { label: 'Acquiring GPS…', color: 'text-amber-700',   bg: 'bg-amber-50',     border: 'border-amber-200',   Icon: Navigation    },
  streaming: { label: 'Streaming GPS',  color: 'text-emerald-700', bg: 'bg-emerald-50',   border: 'border-emerald-200', Icon: Wifi          },
  error:     { label: 'GPS Error',      color: 'text-rose-600',    bg: 'bg-rose-50',      border: 'border-rose-200',    Icon: AlertTriangle },
}

export default function DriverDashboard() {
  const navigate   = useNavigate()
  const watchIdRef = useRef(null)

  const [isTripping, setIsTripping] = useState(false)
  const [status,     setStatus]     = useState('idle')
  const [geoError,   setGeoError]   = useState('')
  const [lastUpdate, setLastUpdate] = useState(null)
  const [busInfo,    setBusInfo]    = useState(null)
  const [driverName, setDriverName] = useState('')

  useEffect(() => {
    if (!localStorage.getItem('driverToken')) {
      navigate('/driver-login', { replace: true })
      return
    }
    setDriverName(localStorage.getItem('driverName') ?? 'Driver')
    setBusInfo(JSON.parse(localStorage.getItem('driverBus') ?? 'null'))
  }, [navigate])

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
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
        } catch { /* retry next tick */ }
      },
      (err) => { setStatus('error'); setGeoError(err.message) },
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

  const { label, color, bg, border, Icon } = STATUS_CONFIG[status]
  const noBus = !busInfo

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col select-none">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center">
            <Bus className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm leading-tight">
              {busInfo?.name ?? 'No Bus Assigned'}
            </p>
            <p className="text-xs text-gray-400 leading-tight mt-0.5">
              {busInfo?.route ?? '—'}
            </p>
          </div>
        </div>

        <motion.button
          onClick={handleLogout}
          whileTap={{ scale: 0.94 }}
          className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 transition-colors text-sm py-2 px-3 rounded-lg hover:bg-gray-100"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </motion.button>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center gap-9 px-6 py-8">

        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <p className="text-gray-400 text-sm">Welcome back,</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{driverName}</p>
        </motion.div>

        {/* Status pill */}
        <AnimatePresence mode="wait">
          <motion.div
            key={status}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.18 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${bg} ${color} ${border}`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
            {geoError && (
              <span className="text-xs opacity-60 ml-1 max-w-40 truncate">({geoError})</span>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── Big toggle button ─────────────────────────────────────── */}
        <div className="relative flex items-center justify-center">

          {/* Pulsing rings — streaming only */}
          <AnimatePresence>
            {isTripping && status === 'streaming' && (
              <>
                <motion.span
                  key="ring1"
                  className="absolute w-56 h-56 rounded-full bg-emerald-400/20"
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 1.35, opacity: 0 }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                />
                <motion.span
                  key="ring2"
                  className="absolute w-56 h-56 rounded-full bg-emerald-400/10"
                  initial={{ scale: 1, opacity: 0.3 }}
                  animate={{ scale: 1.7, opacity: 0 }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: 0.6 }}
                />
              </>
            )}
          </AnimatePresence>

          <motion.button
            onClick={isTripping ? endTrip : startTrip}
            disabled={noBus}
            whileTap={{ scale: 0.94 }}
            initial={{ backgroundColor: '#10b981' }}
            animate={{
              backgroundColor: isTripping ? '#f43f5e' : '#10b981',
              boxShadow: isTripping
                ? '0 8px 40px rgba(244,63,94,0.30)'
                : '0 8px 40px rgba(16,185,129,0.30)',
            }}
            transition={{ duration: 0.3 }}
            className="relative w-52 h-52 rounded-full text-white font-bold flex flex-col items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed z-10"
          >
            <MapPin className="w-8 h-8" />
            <AnimatePresence mode="wait">
              <motion.span
                key={isTripping ? 'end' : 'start'}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="text-lg font-bold tracking-wide"
              >
                {isTripping ? 'END TRIP' : 'START TRIP'}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Last update */}
        <div className="h-5">
          <AnimatePresence>
            {lastUpdate && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-gray-400 text-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
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
            className="text-amber-600 text-sm text-center max-w-xs leading-relaxed bg-amber-50 border border-amber-100 rounded-xl px-4 py-3"
          >
            No bus is assigned to your account. Contact your administrator.
          </motion.p>
        )}
      </main>
    </div>
  )
}
