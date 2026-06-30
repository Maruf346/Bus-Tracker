import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bus, MapPin, User, Clock, ChevronRight, Radio } from 'lucide-react'
import api from '../api.js'
import { timeAgo } from '../utils.js'

const containerVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export default function Home() {
  const navigate   = useNavigate()
  const [buses,     setBuses]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [, setTick] = useState(0)

  const fetchBuses = useCallback(async () => {
    try {
      const { data } = await api.get('/buses/')
      setBuses(data)
      setUpdatedAt(new Date())
    } catch { /* keep previous data on error */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchBuses()
    const pollId = setInterval(fetchBuses, 5000)
    return () => clearInterval(pollId)
  }, [fetchBuses])

  // Tick every second so "X ago" labels stay fresh
  useEffect(() => {
    const tickId = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(tickId)
  }, [])

  const activeBuses   = buses.filter(b =>  b.is_active)
  const inactiveBuses = buses.filter(b => !b.is_active)

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-linear-to-br from-blue-700 via-blue-600 to-indigo-700 px-5 pt-14 pb-12">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-56 h-56 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="relative max-w-lg mx-auto"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Bus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Smart Bus Tracker</h1>
              <p className="text-blue-200 text-sm">Campus Transit — Real-time</p>
            </div>
          </div>

          <p className="text-blue-100/70 text-sm leading-relaxed max-w-sm mt-2">
            Track your campus buses live. No login required.
          </p>

          {/* Live pulse */}
          <div className="flex items-center gap-2 mt-5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-xs text-blue-200/70">
              Auto-refreshes every 5s
              {updatedAt && ` · ${updatedAt.toLocaleTimeString()}`}
            </span>
          </div>
        </motion.div>
      </header>

      {/* ── Bus list ─────────────────────────────────────────────────── */}
      <main className="max-w-lg mx-auto px-4 py-8">

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-24 text-slate-500">
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading buses…
          </div>
        ) : (
          <>
            {/* Active */}
            {activeBuses.length > 0 && (
              <section className="mb-8">
                <h2 className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-4">
                  <Radio className="w-3.5 h-3.5" />
                  Live Now · {activeBuses.length} bus{activeBuses.length > 1 ? 'es' : ''}
                </h2>

                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-3"
                >
                  {activeBuses.map(bus => (
                    <motion.div key={bus.id} variants={cardVariants}>
                      <button
                        onClick={() => navigate(`/bus/${bus.id}`)}
                        className="w-full text-left bg-slate-800/70 border border-white/8 hover:border-emerald-500/50 hover:bg-slate-700/60 rounded-2xl p-5 transition-all duration-200 group"
                      >
                        {/* Card top row */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <span className="relative flex h-3 w-3 mt-0.5 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
                            </span>
                            <div>
                              <p className="font-bold text-white text-lg leading-tight">{bus.name}</p>
                              <span className="inline-block text-xs font-semibold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full mt-1 tracking-wide">
                                LIVE
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 transition-colors mt-1 shrink-0" />
                        </div>

                        {/* Card details */}
                        <div className="mt-4 space-y-2 pl-6">
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                            <span className="truncate">{bus.route}</span>
                          </div>
                          {bus.driver_name && (
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <User className="w-4 h-4 text-slate-500 shrink-0" />
                              {bus.driver_name}
                            </div>
                          )}
                          {bus.last_seen && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              GPS updated {timeAgo(bus.last_seen)}
                            </div>
                          )}
                        </div>

                        {/* Track button hint */}
                        <div className="mt-4 pl-6">
                          <span className="text-xs text-emerald-500/70 font-medium group-hover:text-emerald-400 transition-colors">
                            Tap to open live map →
                          </span>
                        </div>
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              </section>
            )}

            {/* Inactive */}
            {inactiveBuses.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-4">
                  Not in Service · {inactiveBuses.length}
                </h2>

                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-3"
                >
                  {inactiveBuses.map(bus => (
                    <motion.div key={bus.id} variants={cardVariants}>
                      <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 opacity-50 cursor-default">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-3 w-3 rounded-full bg-slate-700 shrink-0" />
                          <div>
                            <p className="font-semibold text-slate-400">{bus.name}</p>
                            <span className="text-xs text-slate-600">Not in service</span>
                          </div>
                        </div>
                        <div className="mt-3 pl-6 flex items-center gap-2 text-sm text-slate-600">
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span className="truncate">{bus.route}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </section>
            )}

            {/* Empty state */}
            {buses.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-24"
              >
                <Bus className="w-14 h-14 text-slate-800 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No buses configured</p>
                <p className="text-slate-600 text-sm mt-1">Ask your administrator to add buses.</p>
              </motion.div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
