import { api } from '@/lib/api'
export const shuttleService = {
  async getShuttles() {
    const res = await api.get('/api/shuttles')
    return res
  }
}
