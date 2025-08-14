import { api } from '@/lib/api'
export const departmentService = {
  async getAllDepartments() {
    return api.get('/api/departments')
  }
}
