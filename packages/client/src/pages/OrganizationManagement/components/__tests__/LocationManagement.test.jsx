import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import LocationManagement from '../LocationManagement';

// Mock the authClient
const mockUseActiveOrganization = jest.fn();
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    useActiveOrganization: () => mockUseActiveOrganization()
  }
}));

// Mock the location service
const mockGetLocations = jest.fn();
const mockClearCache = jest.fn();
jest.mock('@/services/locationService', () => ({
  locationService: {
    getLocations: mockGetLocations,
    clearCache: mockClearCache,
    createLocation: jest.fn(),
    updateLocation: jest.fn(),
    deleteLocation: jest.fn()
  }
}));

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('LocationManagement Organization Switching', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should clear cache and reload data when organization changes', async () => {
    const mockLocations = [
      { id: '1', address: 'Location 1', type: 'BRANCH', latitude: 9.0, longitude: 38.0, _count: { employees: 0, routes: 0 } }
    ];

    // Initial organization
    mockUseActiveOrganization.mockReturnValue({ data: { id: 'org1' } });
    mockGetLocations.mockResolvedValue(mockLocations);

    const { rerender } = render(<LocationManagement />);

    // Wait for initial load
    await waitFor(() => {
      expect(mockGetLocations).toHaveBeenCalledTimes(1);
    });

    // Change organization
    mockUseActiveOrganization.mockReturnValue({ data: { id: 'org2' } });
    
    rerender(<LocationManagement />);

    // Should clear cache and reload
    await waitFor(() => {
      expect(mockClearCache).toHaveBeenCalled();
      expect(mockGetLocations).toHaveBeenCalledTimes(2);
    });
  });

  it('should show error when no active organization', async () => {
    mockUseActiveOrganization.mockReturnValue({ data: null });

    render(<LocationManagement />);

    await waitFor(() => {
      expect(screen.getByText('No Organization Selected')).toBeInTheDocument();
      expect(screen.getByText('No active organization selected')).toBeInTheDocument();
    });

    // Should not call getLocations when no org
    expect(mockGetLocations).not.toHaveBeenCalled();
  });

  it('should show loading state during organization switching', async () => {
    mockUseActiveOrganization.mockReturnValue({ data: { id: 'org1' } });
    mockGetLocations.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve([]), 100)));

    render(<LocationManagement />);

    // Should show loading state
    expect(screen.getByText('Loading locations...')).toBeInTheDocument();
    expect(screen.getByTestId(/loader/i) || screen.querySelector('.animate-spin')).toBeInTheDocument();
  });
});