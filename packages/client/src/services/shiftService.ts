import { api } from '@/lib/api'
export const shiftService = {
  async getAllShifts() {
    return api.get('/api/shifts')
  }
}
