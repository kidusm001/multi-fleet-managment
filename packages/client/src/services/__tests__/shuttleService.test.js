import { shuttleService } from '../shuttleService';
import api from '../api';

jest.mock('../api');

describe('shuttleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getShuttles', () => {
    it('should fetch all shuttles', async () => {
      const mockShuttles = [
        { id: '1', name: 'Shuttle A', capacity: 20, plateNumber: 'ABC123' },
        { id: '2', name: 'Shuttle B', capacity: 15, plateNumber: 'XYZ789' }
      ];
      api.get.mockResolvedValue({ data: mockShuttles });

      const result = await shuttleService.getShuttles();

      expect(api.get).toHaveBeenCalledWith('/shuttles');
      expect(result).toEqual(mockShuttles);
    });
  });

  describe('createShuttle', () => {
    it('should create a new shuttle', async () => {
      const newShuttle = { name: 'Shuttle C', capacity: 25, plateNumber: 'DEF456' };
      const createdShuttle = { id: '3', ...newShuttle };
      api.post.mockResolvedValue({ data: createdShuttle });

      const result = await shuttleService.createShuttle(newShuttle);

      expect(api.post).toHaveBeenCalledWith('/shuttles', expect.objectContaining({
        name: 'Shuttle C',
        plateNumber: 'DEF456',
        capacity: 25,
        type: 'IN_HOUSE',
        status: 'AVAILABLE'
      }));
      expect(result).toEqual(createdShuttle);
    });
  });

  describe('updateShuttle', () => {
    it('should update an existing shuttle', async () => {
      const updateData = { capacity: 30 };
      const updatedShuttle = { id: '1', name: 'Shuttle A', ...updateData };
      api.put.mockResolvedValue({ data: updatedShuttle });

      const result = await shuttleService.updateShuttle('1', updateData);

      expect(api.put).toHaveBeenCalledWith('/shuttles/1', updateData);
      expect(result).toEqual(updatedShuttle);
    });
  });

  describe('deleteShuttle', () => {
    it('should delete a shuttle', async () => {
      api.delete.mockResolvedValue({ data: {} });

      await shuttleService.deleteShuttle('1');

      expect(api.delete).toHaveBeenCalledWith('/shuttles/1');
    });
  });
});
