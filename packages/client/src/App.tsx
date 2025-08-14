import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout'
import AppLayout from './layouts/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'

// route config using nested Routes elements

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}> 
          <Route path="/login" element={<Login />} />
        </Route>

        <Route element={<ProtectedRoute />}> 
          <Route element={<AppLayout />}> 
            <Route path="/app" element={<Dashboard />} />
            {/* TODO: add more routes: routes, vehicles, departments, employees, shifts, notifications, search */}
          </Route>
        </Route>

        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}
