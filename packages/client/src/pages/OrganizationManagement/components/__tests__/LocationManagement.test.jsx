import React from 'react';
import { render, screen } from '@testing-library/react';
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
    mockGetLocations.mockResolvedValue([]);
  });

  it('should render without crashing', () => {
    mockUseActiveOrganization.mockReturnValue({ data: { id: 'org1' } });
    const { container } = render(<LocationManagement />);
    expect(container).toBeInTheDocument();
  });

  it('should show error when no active organization', () => {
    mockUseActiveOrganization.mockReturnValue({ data: null });
    render(<LocationManagement />);
    expect(screen.getByText(/No Organization Selected/i)).toBeInTheDocument();
  });
});