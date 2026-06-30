import { useParams } from 'react-router-dom'

export default function BusTracking() {
  const { id } = useParams()
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <h1 className="text-3xl font-bold text-green-600">Live Map — Bus {id} — Phase 5</h1>
    </div>
  )
}
