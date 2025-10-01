import api from './api';

class VehicleCategoryService {
  /**
   * Get all vehicle categories for the current organization
   */
  async getCategories() {
    try {
      const response = await api.get('/shuttle-categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle categories:', error);
      throw error;
    }
  }

  /**
   * Get a specific vehicle category by ID
   */
  async getCategoryById(id) {
    try {
      const response = await api.get(`/shuttle-categories/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle category:', error);
      throw error;
    }
  }

  /**
   * Create a new vehicle category
   */
  async createCategory(categoryData) {
    try {
      const response = await api.post('/shuttle-categories', {
        name: categoryData.name.trim(),
        capacity: parseInt(categoryData.capacity)
      });
      return response.data;
    } catch (error) {
      console.error('Error creating vehicle category:', error);
      throw error;
    }
  }

  /**
   * Update an existing vehicle category
   */
  async updateCategory(id, categoryData) {
    try {
      const updateData = {};
      if (categoryData.name !== undefined) {
        updateData.name = categoryData.name.trim();
      }
      if (categoryData.capacity !== undefined) {
        updateData.capacity = parseInt(categoryData.capacity);
      }
      
      const response = await api.put(`/shuttle-categories/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating vehicle category:', error);
      throw error;
    }
  }

  /**
   * Delete a vehicle category
   */
  async deleteCategory(id) {
    try {
      const response = await api.delete(`/shuttle-categories/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting vehicle category:', error);
      throw error;
    }
  }
}

export const vehicleCategoryService = new VehicleCategoryService();
export default vehicleCategoryService;
