export const routeManagementData = [
  {
    id: 'R1',
    name: 'Bole Route',
    status: 'active',
    stops: 5,
    passengers: 42,
    nextDeparture: '10:30 AM',
    areas: ['Bole', 'Sarbet', 'Kazanchis', 'Summit'],
    coordinates: [
      [38.7895, 9.0105],
      [38.7645, 9.0023],
      [38.7521, 9.0219],
      [38.8064254370419, 9.04421746656468]
    ]
  },
  {
    id: 'R2',
    name: 'Megenagna Route',
    status: 'active',
    stops: 4,
    passengers: 35,
    nextDeparture: '11:00 AM',
    areas: ['Megenagna', 'CMC', 'Bole'],
    coordinates: [[38.8012, 9.0348], [38.7654, 9.0512], [38.7895, 9.0105]]
  },
  {
    id: 'R3',
    name: 'CMC Route',
    status: 'inactive',
    stops: 3,
    passengers: 0,
    nextDeparture: 'N/A',
    areas: ['CMC', 'Megenagna', 'Bole'],
    coordinates: [[38.7654, 9.0512], [38.8012, 9.0348], [38.7895, 9.0105]]
  },
  {
    id: 'R4',
    name: 'CMC-Kazanchis Route',
    status: 'active',
    stops: 6,
    passengers: 38,
    nextDeparture: '10:45 AM',
    areas: ['CMC', 'Kazanchis', 'Megenagna'],
    coordinates: [[38.7654, 9.0512], [38.7521, 9.0219], [38.8012, 9.0348]]
  }
]; 