import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bus, MapPin, User, Clock, ChevronRight, Radio } from 'lucide-react'
import api from '../api.js'
import { timeAgo } from '../utils.js'

const containerVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}
const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

export default function Home() {
  const navigate   = useNavigate()
  const [buses,     setBuses]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [, setTick]               = useState(0)

  const fetchBuses = useCallback(async () => {
    try {
      const { data } = await api.get('/buses/')
      setBuses(data)
      setUpdatedAt(new Date())
    } catch { /* keep previous data */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchBuses()
    const pollId = setInterval(fetchBuses, 5000)
    return () => clearInterval(pollId)
  }, [fetchBuses])

  useEffect(() => {
    const tickId = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(tickId)
  }, [])

  const activeBuses   = buses.filter(b =>  b.is_active)
  const inactiveBuses = buses.filter(b => !b.is_active)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <Bus className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">Smart Bus Tracker</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            {updatedAt ? updatedAt.toLocaleTimeString() : 'Live'}
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="max-w-lg mx-auto px-5 py-10"
        >
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-tight">
            Track your bus,<br />in real time.
          </h1>
          <p className="text-gray-400 text-sm mt-3 leading-relaxed">
            No login required. Tap an active bus to open the live map.
          </p>
        </motion.div>
      </section>

      {/* ── Bus list ─────────────────────────────────────────────────── */}
      <main className="max-w-lg mx-auto px-4 py-6">

        {loading ? (
          <div className="flex items-center justify-center gap-2.5 py-20 text-gray-400 text-sm">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading buses…
          </div>
        ) : (
          <>
            {/* ── Active buses ─────────────────────────────────────────── */}
            {activeBuses.length > 0 && (
              <section className="mb-7">
                <p className="flex items-center gap-1.5 text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">
                  <Radio className="w-3 h-3" />
                  Live Now · {activeBuses.length}
                </p>

                <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-2.5">
                  {activeBuses.map(bus => (
                    <motion.div key={bus.id} variants={cardVariants}>
                      <button
                        onClick={() => navigate(`/bus/${bus.id}`)}
                        className="w-full text-left bg-white border border-gray-100 hover:border-violet-200 hover:shadow-md rounded-2xl p-5 transition-all duration-200 group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="relative flex h-2.5 w-2.5 mt-1 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 leading-tight">{bus.name}</p>
                              <span className="inline-block text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full mt-1">
                                LIVE
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-violet-400 transition-colors mt-1 shrink-0" />
                        </div>

                        <div className="mt-4 space-y-1.5 pl-5">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="truncate">{bus.route}</span>
                          </div>
                          {bus.driver_name && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              {bus.driver_name}
                            </div>
                          )}
                          {bus.last_seen && (
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <Clock className="w-3 h-3 shrink-0" />
                              GPS updated {timeAgo(bus.last_seen)}
                            </div>
                          )}
                        </div>
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              </section>
            )}

            {/* ── Inactive buses ───────────────────────────────────────── */}
            {inactiveBuses.length > 0 && (
              <section>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">
                  Not in Service · {inactiveBuses.length}
                </p>

                <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-2.5">
                  {inactiveBuses.map(bus => (
                    <motion.div key={bus.id} variants={cardVariants}>
                      <div className="bg-white border border-gray-100 rounded-2xl p-5 opacity-50 cursor-default select-none">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-gray-300 shrink-0" />
                          <div>
                            <p className="font-semibold text-gray-700 leading-tight">{bus.name}</p>
                            <span className="text-xs text-gray-400">Not in service</span>
                          </div>
                        </div>
                        <div className="mt-3 pl-5 flex items-center gap-2 text-sm text-gray-400">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{bus.route}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </section>
            )}

            {/* ── Empty state ──────────────────────────────────────────── */}
            {buses.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-24"
              >
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Bus className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-gray-700 font-medium">No buses configured</p>
                <p className="text-gray-400 text-sm mt-1">Ask your administrator to add buses.</p>
              </motion.div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
