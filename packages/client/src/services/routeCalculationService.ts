// Simple route metrics calculator using Haversine distance and a fixed speed
// Coordinates are [longitude, latitude]
export type Metrics = { totalDistance: number; totalTime: number }

function toRad(deg: number) { return (deg * Math.PI) / 180 }

function haversine(a: [number, number], b: [number, number]): number {
  const R = 6371 // km
  const dLat = toRad(b[1] - a[1])
  const dLon = toRad(b[0] - a[0])
  const lat1 = toRad(a[1])
  const lat2 = toRad(b[1])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export async function calculateRouteMetrics(coordinates: Array<[number, number]>): Promise<Metrics> {
  if (!coordinates || coordinates.length < 2) return { totalDistance: 0, totalTime: 0 }
  let distance = 0
  for (let i = 1; i < coordinates.length; i++) {
    distance += haversine(coordinates[i - 1], coordinates[i])
  }
  // Assume average speed 25 km/h in city traffic
  const hours = distance / 25
  const minutes = Math.max(5, Math.round(hours * 60))
  return { totalDistance: Number(distance.toFixed(2)), totalTime: minutes }
}
