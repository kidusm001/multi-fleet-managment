import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout'
import AppLayout from './layouts/AppLayout'
import { ProtectedRoute } from './components/Common/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import RoutesPage from './pages/Routes'
import Login from './pages/Login'
import VehiclesPage from './pages/Vehicles'

// route config using nested Routes elements

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}> 
          <Route path="/login" element={<Login />} />
        </Route>

        <Route element={<ProtectedRoute> <AppLayout /> </ProtectedRoute>}> 
          <Route path="/app" element={<Dashboard />} />
          <Route path="/app/routes" element={<RoutesPage />} />
          <Route path="/app/vehicles" element={<VehiclesPage />} />
          {/* TODO: add more routes: routes, vehicles, departments, employees, shifts, notifications, search */}
        </Route>

        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}
