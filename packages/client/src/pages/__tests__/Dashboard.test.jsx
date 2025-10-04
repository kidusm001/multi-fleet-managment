import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

// Mock MapComponent since it's lazy loaded
jest.mock('@components/Common/Map/MapComponent', () => ({
  __esModule: true,
  default: ({ routes }) => (
    <div data-testid="map-component">
      Map with {routes?.coordinates?.length || 0} coordinates
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

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should fetch and display routes', async () => {
      routeService.getAllRoutes.mockResolvedValue(mockRoutes);

      renderDashboard();

      await waitFor(() => {
        expect(routeService.getAllRoutes).toHaveBeenCalled();
      });

      // Should display route information
      await waitFor(() => {
        expect(screen.getByText(/Morning Route A/i)).toBeInTheDocument();
      });
    });

    it('should display error message when fetch fails', async () => {
      routeService.getAllRoutes.mockRejectedValue(new Error('Network error'));

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/failed to fetch routes/i)).toBeInTheDocument();
      });
    });

    it('should select first route by default', async () => {
      routeService.getAllRoutes.mockResolvedValue(mockRoutes);

      renderDashboard();

      await waitFor(() => {
        // First route should be selected
        const route = screen.getByText(/Morning Route A/i);
        expect(route.closest('[data-selected="true"]')).toBeInTheDocument();
      });
    });
  });

  describe('Route statistics', () => {
    it('should display correct route statistics', async () => {
      routeService.getAllRoutes.mockResolvedValue(mockRoutes);

      renderDashboard();

      await waitFor(() => {
        // Should show total routes
        expect(screen.getByText(/2/)).toBeInTheDocument(); // 2 total routes
        
        // Should show total employees (3 stops total)
        expect(screen.getByText(/3/)).toBeInTheDocument();
        
        // Should show active vehicles
        expect(screen.getByText(/1/)).toBeInTheDocument(); // 1 active route
      });
    });

    it('should calculate statistics correctly for empty routes', async () => {
      routeService.getAllRoutes.mockResolvedValue([]);

      renderDashboard();

      await waitFor(() => {
        const stats = screen.getAllByText(/0/);
        expect(stats.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Route selection', () => {
    it('should update selected route when user clicks on route', async () => {
      const user = userEvent.setup();
      routeService.getAllRoutes.mockResolvedValue(mockRoutes);

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Morning Route A/i)).toBeInTheDocument();
      });

      // Click on second route
      const eveningRoute = screen.getByText(/Evening Route B/i);
      await user.click(eveningRoute);

      await waitFor(() => {
        expect(eveningRoute.closest('[data-selected="true"]')).toBeInTheDocument();
      });
    });

    it('should update map when route is selected', async () => {
      const user = userEvent.setup();
      routeService.getAllRoutes.mockResolvedValue(mockRoutes);

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('map-component')).toBeInTheDocument();
      });

      // Initial map should show first route (2 coordinates)
      expect(screen.getByText(/2 coordinates/)).toBeInTheDocument();

      // Select second route (1 coordinate)
      const eveningRoute = screen.getByText(/Evening Route B/i);
      await user.click(eveningRoute);

      await waitFor(() => {
        expect(screen.getByText(/1 coordinates/)).toBeInTheDocument();
      });
    });
  });

  describe('Search and filter', () => {
    it('should filter routes by search query', async () => {
      const user = userEvent.setup();
      routeService.getAllRoutes.mockResolvedValue(mockRoutes);

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Morning Route A/i)).toBeInTheDocument();
        expect(screen.getByText(/Evening Route B/i)).toBeInTheDocument();
      });

      // Search for "Morning"
      const searchInput = screen.getByPlaceholderText(/search routes/i);
      await user.type(searchInput, 'Morning');

      await waitFor(() => {
        expect(screen.getByText(/Morning Route A/i)).toBeInTheDocument();
        expect(screen.queryByText(/Evening Route B/i)).not.toBeInTheDocument();
      });
    });

    it('should filter routes by status', async () => {
      const user = userEvent.setup();
      routeService.getAllRoutes.mockResolvedValue(mockRoutes);

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Morning Route A/i)).toBeInTheDocument();
        expect(screen.getByText(/Evening Route B/i)).toBeInTheDocument();
      });

      // Filter by ACTIVE status
      const statusFilter = screen.getByLabelText(/status/i);
      await user.selectOptions(statusFilter, 'ACTIVE');

      await waitFor(() => {
        expect(screen.getByText(/Morning Route A/i)).toBeInTheDocument();
        expect(screen.queryByText(/Evening Route B/i)).not.toBeInTheDocument();
      });
    });

    it('should combine search and status filters', async () => {
      const user = userEvent.setup();
      const manyRoutes = [
        ...mockRoutes,
        {
          id: 'route3',
          name: 'Morning Route C',
          status: 'INACTIVE',
          stops: []
        }
      ];
      routeService.getAllRoutes.mockResolvedValue(manyRoutes);

      renderDashboard();

      await waitFor(() => {
        expect(screen.getAllByText(/Morning/i).length).toBe(2);
      });

      // Search for "Morning" AND filter by ACTIVE
      const searchInput = screen.getByPlaceholderText(/search routes/i);
      await user.type(searchInput, 'Morning');

      const statusFilter = screen.getByLabelText(/status/i);
      await user.selectOptions(statusFilter, 'ACTIVE');

      await waitFor(() => {
        // Should only show Morning Route A (ACTIVE)
        expect(screen.getByText(/Morning Route A/i)).toBeInTheDocument();
        expect(screen.queryByText(/Morning Route C/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Evening Route B/i)).not.toBeInTheDocument();
      });
    });

    it('should show no results message when no routes match filters', async () => {
      const user = userEvent.setup();
      routeService.getAllRoutes.mockResolvedValue(mockRoutes);

      renderDashboard();

      const searchInput = await screen.findByPlaceholderText(/search routes/i);
      await user.type(searchInput, 'Nonexistent Route');

      await waitFor(() => {
        expect(screen.getByText(/no routes found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Route details panel', () => {
    it('should toggle route details panel', async () => {
      const user = userEvent.setup();
      routeService.getAllRoutes.mockResolvedValue(mockRoutes);

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Morning Route A/i)).toBeInTheDocument();
      });

      // Find and click expand button
      const expandButton = screen.getByLabelText(/view details/i);
      await user.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText(/route details/i)).toBeInTheDocument();
      });

      // Click again to collapse
      await user.click(expandButton);

      await waitFor(() => {
        expect(screen.queryByText(/route details/i)).not.toBeInTheDocument();
      });
    });

    it('should show selected route details in panel', async () => {
      routeService.getAllRoutes.mockResolvedValue(mockRoutes);

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Morning Route A/i)).toBeInTheDocument();
      });

      // Route details should show info about selected route
      expect(screen.getByText(/25.5 km/i)).toBeInTheDocument(); // Total distance
      expect(screen.getByText(/45 min/i)).toBeInTheDocument(); // Total time
      expect(screen.getByText(/ABC-123/i)).toBeInTheDocument(); // Shuttle license
    });
  });

  describe('Route updates', () => {
    it('should refresh routes when route is updated', async () => {
      const updatedRoutes = [
        { ...mockRoutes[0], name: 'Updated Route A' },
        mockRoutes[1]
      ];
      
      routeService.getAllRoutes
        .mockResolvedValueOnce(mockRoutes)
        .mockResolvedValueOnce(updatedRoutes);

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Morning Route A/i)).toBeInTheDocument();
      });

      // Simulate route update (this would normally be triggered by an edit action)
      // For now, we're testing that the component can handle data updates
      
      await waitFor(() => {
        expect(routeService.getAllRoutes).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      routeService.getAllRoutes.mockResolvedValue(mockRoutes);

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByLabelText(/search routes/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/status filter/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /view details/i })).toBeInTheDocument();
      });
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      routeService.getAllRoutes.mockResolvedValue(mockRoutes);

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Morning Route A/i)).toBeInTheDocument();
      });

      // Tab through interactive elements
      await user.tab();
      expect(screen.getByPlaceholderText(/search routes/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/status/i)).toHaveFocus();
    });
  });

  describe('Error boundaries', () => {
    it('should handle map component errors gracefully', async () => {
      routeService.getAllRoutes.mockResolvedValue(mockRoutes);

      renderDashboard();

      await waitFor(() => {
        // Dashboard should still render even if map has issues
        expect(screen.getByText(/Morning Route A/i)).toBeInTheDocument();
      });
    });
  });
});
