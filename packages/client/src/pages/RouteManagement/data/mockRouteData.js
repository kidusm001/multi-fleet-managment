export const mockShifts = [
  { value: '22:00', label: 'End at 10:00 PM' },
  { value: '23:00', label: 'End at 11:00 PM' },
  { value: '00:00', label: 'End at 12:00 AM' },
  { value: '01:00', label: 'End at 1:00 AM' },
  { value: '02:00', label: 'End at 2:00 AM' },
  { value: '03:00', label: 'End at 3:00 AM' },
  { value: '04:00', label: 'End at 4:00 AM' },
  { value: '05:00', label: 'End at 5:00 AM' },
];

export const mockShuttles = [
  { id: 'SH001', name: 'Shuttle 1', capacity: 12, status: 'available' },
  { id: 'SH002', name: 'Shuttle 2', capacity: 14, status: 'available' },
  { id: 'SH003', name: 'Shuttle 3', capacity: 12, status: 'maintenance' },
];

// Realistic Addis Ababa coordinates for different areas
const areaCoordinates = {
  'Bole': [38.7895, 9.0105],
  'Gerji': [38.8012, 9.0348],
  'CMC': [38.7654, 9.0512],
  'Megenagna': [38.8012, 9.0348],
  'Summit': [38.8064, 9.0442],
  'Sarbet': [38.7645, 9.0023],
  'Kazanchis': [38.7521, 9.0219],
  'Ayat': [38.8573, 9.0478],
  'Jemo': [38.7273, 8.9804],
  'Lebu': [38.7152, 8.9816],
};

export const generateEmployeeName = () => {
  const firstNames = ['Abebe', 'Kebede', 'Alemayehu', 'Tigist', 'Hanna', 'Dawit', 'Yohannes', 'Bethlehem', 'Solomon', 'Kidist'];
  const lastNames = ['Tesfaye', 'Bekele', 'Desta', 'Tadesse', 'Haile', 'Mengiste', 'Girma', 'Assefa', 'Alemu', 'Negash'];
  
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
};

// Generate employees for each shift
export const mockEmployees = Object.fromEntries(
  mockShifts.map(shift => [
    shift.value,
    Array(Math.floor(Math.random() * 10 + 20)).fill(null).map((_, idx) => {
      const areas = Object.keys(areaCoordinates);
      const randomArea = areas[Math.floor(Math.random() * areas.length)];
      return {
        id: `EMP${shift.value.replace(':', '')}${idx + 1}`.padStart(6, '0'),
        name: generateEmployeeName(),
        location: randomArea,
        coordinates: areaCoordinates[randomArea],
        shuttle: Math.random() > 0.7 ? `SH00${Math.floor(Math.random() * 3) + 1}` : null,
        cluster: Math.floor(Math.random() * 3) + 1
      };
    })
  ])
);

export const mockExistingRoutes = {
  '22:00': [
    { 
      id: 'RT001', 
      name: 'Bole Night Route', 
      shuttle: 'SH001', 
      employeeCount: 11,
      areas: ['Bole', 'Gerji', 'CMC'],
      status: 'active'
    },
    { 
      id: 'RT002', 
      name: 'Summit Express', 
      shuttle: 'SH002', 
      employeeCount: 8,
      areas: ['Summit', 'Ayat', 'CMC'],
      status: 'active'
    }
  ],
  '23:00': [
    { 
      id: 'RT003', 
      name: 'Megenagna Route', 
      shuttle: 'SH001', 
      employeeCount: 12,
      areas: ['Megenagna', 'Gerji', 'Bole'],
      status: 'active'
    }
  ],
  '00:00': [
    { 
      id: 'RT004', 
      name: 'Sarbet-Kazanchis Route', 
      shuttle: 'SH002', 
      employeeCount: 9,
      areas: ['Sarbet', 'Kazanchis', 'Bole'],
      status: 'active'
    }
  ]
};
