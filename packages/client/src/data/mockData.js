export const mockShifts = [
  {
    id: 1,
    name: "Night Shift A",
    endTime: "10:00 PM",
    type: "NIGHT"
  },
  {
    id: 2,
    name: "Night Shift B",
    endTime: "11:30 PM",
    type: "NIGHT"
  },
  {
    id: 3,
    name: "Night Shift C",
    endTime: "12:30 AM",
    type: "NIGHT"
  }
];

export const mockEmployees = [
  // Bole Area Employees
  {
    id: 1,
    name: "Abebe Kebede",
    employeeId: "EMP001",
    area: "Bole",
    coordinates: { lat: 8.9806, lng: 38.7878 },
    shiftId: 1,
    department: "Engineering"
  },
  {
    id: 2,
    name: "Tigist Haile",
    employeeId: "EMP002",
    area: "Bole Rwanda",
    coordinates: { lat: 8.9785, lng: 38.7959 },
    shiftId: 1,
    department: "Finance"
  },
  {
    id: 3,
    name: "Yohannes Tadesse",
    employeeId: "EMP003",
    area: "Bole Bulbula",
    coordinates: { lat: 8.9747, lng: 38.7674 },
    shiftId: 1,
    department: "Operations"
  },
  // CMC Area Employees
  {
    id: 4,
    name: "Kidist Alemu",
    employeeId: "EMP004",
    area: "CMC",
    coordinates: { lat: 9.0250, lng: 38.7651 },
    shiftId: 1,
    department: "HR"
  },
  {
    id: 5,
    name: "Dawit Mengistu",
    employeeId: "EMP005",
    area: "CMC Mekanisa",
    coordinates: { lat: 9.0217, lng: 38.7588 },
    shiftId: 2,
    department: "Marketing"
  },
  // Gerji Area Employees
  {
    id: 6,
    name: "Bethlehem Solomon",
    employeeId: "EMP006",
    area: "Gerji",
    coordinates: { lat: 8.9892, lng: 38.7989 },
    shiftId: 2,
    department: "Engineering"
  },
  {
    id: 7,
    name: "Henok Girma",
    employeeId: "EMP007",
    area: "Gerji Mebrat Hail",
    coordinates: { lat: 8.9923, lng: 38.8012 },
    shiftId: 2,
    department: "Design"
  },
  // Megenagna Area Employees
  {
    id: 8,
    name: "Sara Tekle",
    employeeId: "EMP008",
    area: "Megenagna",
    coordinates: { lat: 9.0204, lng: 38.8013 },
    shiftId: 2,
    department: "Finance"
  },
  {
    id: 9,
    name: "Bereket Wendemu",
    employeeId: "EMP009",
    area: "Megenagna",
    coordinates: { lat: 9.0198, lng: 38.8052 },
    shiftId: 3,
    department: "Operations"
  },
  // Summit Area Employees
  {
    id: 10,
    name: "Hanna Desta",
    employeeId: "EMP010",
    area: "Summit",
    coordinates: { lat: 9.0123, lng: 38.7823 },
    shiftId: 3,
    department: "Marketing"
  },
  {
    id: 11,
    name: "Samuel Negash",
    employeeId: "EMP011",
    area: "Summit Condominium",
    coordinates: { lat: 9.0156, lng: 38.7856 },
    shiftId: 3,
    department: "Engineering"
  },
  // Ayat Area Employees
  {
    id: 12,
    name: "Rahel Tesfaye",
    employeeId: "EMP012",
    area: "Ayat",
    coordinates: { lat: 9.0276, lng: 38.8515 },
    shiftId: 1,
    department: "HR"
  },
  {
    id: 13,
    name: "Natnael Assefa",
    employeeId: "EMP013",
    area: "Ayat Condominium",
    coordinates: { lat: 9.0298, lng: 38.8489 },
    shiftId: 1,
    department: "Finance"
  },
  // Kality Area Employees
  {
    id: 14,
    name: "Meron Berhanu",
    employeeId: "EMP014",
    area: "Kality",
    coordinates: { lat: 8.9040, lng: 38.7911 },
    shiftId: 2,
    department: "Operations"
  },
  {
    id: 15,
    name: "Ermias Teshome",
    employeeId: "EMP015",
    area: "Kality Gebriel",
    coordinates: { lat: 8.9079, lng: 38.7889 },
    shiftId: 2,
    department: "Engineering"
  }
];

export const mockShuttles = [
  {
    id: 1,
    name: "Shuttle A",
    licensePlate: "AA-12345",
    capacity: 15,
    category: "Mini Bus",
    status: "AVAILABLE"
  },
  {
    id: 2,
    name: "Shuttle B",
    licensePlate: "AA-67890",
    capacity: 25,
    category: "Coaster Bus",
    status: "AVAILABLE"
  },
  {
    id: 3,
    name: "Shuttle C",
    licensePlate: "AA-11223",
    capacity: 15,
    category: "Mini Bus",
    status: "AVAILABLE"
  }
];

export const mockRoutes = [
  {
    id: 1,
    name: "Bole Route",
    shiftId: 1,
    shuttle: {
      id: 1,
      name: "Shuttle A"
    },
    employees: [
      {
        id: 1,
        name: "Abebe Kebede",
        area: "Bole"
      },
      {
        id: 2,
        name: "Tigist Haile",
        area: "Bole Rwanda"
      }
    ]
  },
  {
    id: 2,
    name: "CMC-Gerji Route",
    shiftId: 2,
    shuttle: {
      id: 2,
      name: "Shuttle B"
    },
    employees: [
      {
        id: 4,
        name: "Kidist Alemu",
        area: "CMC"
      },
      {
        id: 6,
        name: "Bethlehem Solomon",
        area: "Gerji"
      }
    ]
  }
]; 