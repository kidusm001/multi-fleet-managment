import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout'
import AppLayout from './layouts/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'

const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Login /> },
      { path: 'login', element: <Login /> },
    ],
  },
  {
    path: '/app',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'routes', element: <div className="p-6">Routes</div> },
          { path: 'vehicles', element: <div className="p-6">Vehicles</div> },
          { path: 'departments', element: <div className="p-6">Departments</div> },
          { path: 'employees', element: <div className="p-6">Employees</div> },
          { path: 'shifts', element: <div className="p-6">Shifts</div> },
          { path: 'notifications', element: <div className="p-6">Notifications</div> },
          { path: 'search', element: <div className="p-6">Search</div> },
        ],
      },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
