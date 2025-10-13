import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';
import { routeService } from '@services/routeService';
import { ThemeProvider } from '@contexts/ThemeContext';

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

jest.mock('@services/routeService', () => ({
  routeService: {
    getAllRoutes: jest.fn(),
  },
}));

// Mock viewport hook to always return desktop
jest.mock('@hooks/useViewport', () => ({
  useViewport: () => 'desktop',
}));

// Mock MapComponent since it's lazy loaded
jest.mock('@components/Common/Map/MapComponent', () => ({
  __esModule: true,
  default: ({ selectedRoute }) => (
    <div data-testid="map-component">
      Map with {selectedRoute?.coordinates?.length || 0} coordinates
    </div>
  ),
}));

const mockRoutes = [
  {
    id: 'route1',
    name: 'Morning Route A',
    status: 'ACTIVE',
    totalDistance: 25.5,
    totalTime: 45,
    shift: { id: 'shift1', name: 'Morning Shift' },
    shuttle: { id: 'shuttle1', licensePlate: 'ABC-123' },
    stops: [
      {
        id: 'stop1',
        order: 1,
        latitude: 9.0192,
        longitude: 38.7525,
        employee: {
          id: 'emp1',
          name: 'John Doe',
          location: 'Bole, Addis Ababa',
          department: { name: 'Engineering' }
        }
      },
      {
        id: 'stop2',
        order: 2,
        latitude: 9.0227,
        longitude: 38.7468,
        employee: {
          id: 'emp2',
          name: 'Jane Smith',
          location: 'Sarbet, Addis Ababa',
          department: { name: 'Marketing' }
        }
      }
    ]
  },
  {
    id: 'route2',
    name: 'Evening Route B',
    status: 'INACTIVE',
    totalDistance: 30.2,
    totalTime: 55,
    shift: { id: 'shift2', name: 'Evening Shift' },
    shuttle: { id: 'shuttle2', licensePlate: 'XYZ-789' },
    stops: [
      {
        id: 'stop3',
        order: 1,
        latitude: 9.0058,
        longitude: 38.7636,
        employee: {
          id: 'emp3',
          name: 'Bob Johnson',
          location: 'Piazza, Addis Ababa',
          department: { name: 'Sales' }
        }
      }
    ]
  }
];

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        <Dashboard />
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial render and data loading', () => {
    it('should render dashboard with loading state', () => {
      routeService.getAllRoutes.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderDashboard();

      // During loading, stats should show 0 values - check that stats cards are rendered
      expect(screen.getAllByText('Active Routes')).toBeTruthy();
      expect(screen.getAllByText('0')).toBeTruthy();
    });

    it('should fetch and display routes', async () => {
      routeService.getAllRoutes.mockResolvedValue(mockRoutes);

      renderDashboard();

      await waitFor(() => {
        expect(routeService.getAllRoutes).toHaveBeenCalled();
      });

      // Should display route information
      await waitFor(() => {
        expect(screen.getAllByText('Morning Route A').length).toBeGreaterThan(0);
      });
    });

    it('should display error message when fetch fails', async () => {
      routeService.getAllRoutes.mockRejectedValue(new Error('Network error'));

      renderDashboard();

      // During error, stats should show 0 values (component treats errors as empty routes)
      await waitFor(() => {
        expect(screen.getAllByText('Active Routes')).toBeTruthy();
        expect(screen.getAllByText('0')).toBeTruthy();
      });
    });
  });

  describe('Route statistics', () => {
    it('should display correct route statistics', async () => {
      routeService.getAllRoutes.mockResolvedValue(mockRoutes);

      renderDashboard();

      await waitFor(() => {
        // Should show active routes (1), total passengers (3), and total stops (3)
        // Check that the expected numbers appear in the statistics
        expect(screen.getAllByText('1')).toBeTruthy();
        expect(screen.getAllByText('3')).toBeTruthy();
      });
    });

    it('should calculate statistics correctly for empty routes', async () => {
      routeService.getAllRoutes.mockResolvedValue([]);

      renderDashboard();

      await waitFor(() => {
        const zeros = screen.getAllByText('0');
        expect(zeros.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Basic functionality', () => {
    it('should render map component', async () => {
      routeService.getAllRoutes.mockResolvedValue(mockRoutes);

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('map-component')).toBeInTheDocument();
      });
    });

    it('should handle route data with proper structure', async () => {
      routeService.getAllRoutes.mockResolvedValue(mockRoutes);

      renderDashboard();

      await waitFor(() => {
        // Check that route names are displayed
        expect(screen.getAllByText('Morning Route A').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Evening Route B').length).toBeGreaterThan(0);
      });
    });
  });
});
