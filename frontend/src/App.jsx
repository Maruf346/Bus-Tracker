import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import BusTracking from './pages/BusTracking.jsx'
import DriverLogin from './pages/DriverLogin.jsx'
import DriverDashboard from './pages/DriverDashboard.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/bus/:id" element={<BusTracking />} />
        <Route path="/driver-login" element={<DriverLogin />} />
        <Route path="/driver-dashboard" element={<DriverDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
