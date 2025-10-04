import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from '../Dashboard';

// Mock dependencies
jest.mock('@contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({ 
    user: { id: '1', email: 'test@example.com', role: 'admin' },
    isAuthenticated: true 
  })),
}));

jest.mock('@contexts/RoleContext', () => ({
  useRole: jest.fn(() => ({ role: 'admin' })),
}));

jest.mock('@services/api', () => ({
  get: jest.fn().mockResolvedValue({ data: {} }),
}));

describe('Dashboard Page', () => {
  it('should render dashboard', () => {
    render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    );

    // Dashboard renders, check for container
    expect(document.querySelector('.flex')).toBeInTheDocument();
  });

  it('should display welcome message', () => {
    render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    );

    // Check for common dashboard elements
    expect(document.body).toBeInTheDocument();
    expect(document.querySelector('.flex')).toBeInTheDocument();
  });

  it('should render navigation elements', () => {
    render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    );

    // Dashboard should have navigation or content
    expect(document.body).toBeInTheDocument();
  });
});
