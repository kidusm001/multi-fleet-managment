import { api } from '../lib/api'

export type Route = {
  id: number
  name: string
}

const cache: {
  routes: Route[] | null
  lastFetched: number | null
} = { routes: null, lastFetched: null }

export const routeService = {
  async list(useCache = true): Promise<Route[]> {
    if (useCache && cache.routes && cache.lastFetched && Date.now() - cache.lastFetched < 2 * 60 * 1000) {
      return cache.routes
    }
    const data = await api.get<Route[]>('/api/routes')
    cache.routes = data
    cache.lastFetched = Date.now()
    return data
  },
  async get(id: number): Promise<Route> {
    return api.get<Route>(`/api/routes/${id}`)
  },
}