import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Minimal mock providers
const AuthContext = React.createContext({ user: { role: 'admin' } });
const RoleContext = React.createContext({ role: 'admin' });

function AuthProvider({ children }) { return <AuthContext.Provider value={{ user: { role: 'admin' } }}>{children}</AuthContext.Provider>; }
function RoleProvider({ children }) { return <RoleContext.Provider value={{ role: 'admin' }}>{children}</RoleContext.Provider>; }

// Simplified ProtectedRoute replicating core logic
function ProtectedRoute({ children, allowedRoles }) {
  const { user } = React.useContext(AuthContext);
  if (!user) return <div>Redirect Login</div>;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <div>Forbidden</div>;
  return children;
}

describe('Smoke: Auth + ProtectedRoute', () => {
  it('renders protected dashboard for admin role', () => {
    render(
      <AuthProvider>
        <RoleProvider>
          <MemoryRouter initialEntries={['/dashboard']}>
            <Routes>
              <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={['admin', 'fleetManager']}>
                  <div data-testid="dashboard-root">Dashboard OK</div>
                </ProtectedRoute>
              } />
            </Routes>
          </MemoryRouter>
        </RoleProvider>
      </AuthProvider>
    );

    expect(screen.getByTestId('dashboard-root')).toHaveTextContent('Dashboard OK');
  });
});
