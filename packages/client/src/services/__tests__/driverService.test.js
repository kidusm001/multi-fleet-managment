import { driverService } from '../driverService';
import api from '../api';

jest.mock('../api');

describe('driverService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDrivers', () => {
    it('should fetch all drivers', async () => {
      const mockDrivers = [
        { id: '1', firstName: 'Alice', lastName: 'Driver', licenseNumber: 'LIC123' },
        { id: '2', firstName: 'Bob', lastName: 'Chauffeur', licenseNumber: 'LIC456' }
      ];
      api.get.mockResolvedValue({ data: mockDrivers });

      const result = await driverService.getDrivers();

      expect(api.get).toHaveBeenCalledWith('/drivers');
      expect(result).toEqual(mockDrivers);
    });
  });

  describe('getDriver', () => {
    it('should fetch driver by id', async () => {
      const mockDriver = { id: '1', name: 'John Doe', licenseNumber: 'DL123' };
      api.get.mockResolvedValue({ data: mockDriver });

      const result = await driverService.getDriver('1');

      expect(api.get).toHaveBeenCalledWith('/drivers/1');
      expect(result).toEqual(mockDriver);
    });
  });

  describe('updateDriverStatus', () => {
    it('should update driver status', async () => {
      const mockResponse = { id: '1', status: 'active' };
      api.patch.mockResolvedValue({ data: mockResponse });

      const result = await driverService.updateDriverStatus('1', 'active');

      expect(api.patch).toHaveBeenCalledWith('/drivers/1/status', { status: 'active' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getUnassignedDrivers', () => {
    it('should fetch unassigned drivers', async () => {
      const mockDrivers = [{ id: '1', name: 'Available Driver' }];
      api.get.mockResolvedValue({ data: mockDrivers });

      const result = await driverService.getUnassignedDrivers();

      expect(api.get).toHaveBeenCalledWith('/drivers/unassigned');
      expect(result).toEqual(mockDrivers);
    });
  });
});
