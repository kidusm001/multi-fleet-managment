export const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1Ijoic2t5d2Fsa2VydGV3IiwiYSI6ImNtM2M2Y3c2YzFtbDkya3F4Mm9yeXZ4c2wifQ.yA-eA9XIE8gI451UuC11sQ';

export const shifts = [
    {
        value: '1',
        label: 'Morning (6:00-14:30)',
        icon: '🌅',
        times: ['6:00', '6:30', '7:00', '7:30', '8:00', '8:30']
    },
    {
        value: '2',
        label: 'Afternoon (14:30-22:30)',
        icon: '☀️',
        times: ['14:30', '15:00', '15:30', '16:00', '16:30', '17:00']
    },
    {
        value: '3',
        label: 'Night (22:30-6:00)',
        icon: '🌙',
        times: ['22:30', '23:00', '23:30', '00:00', '00:30', '1:00']
    }
];

export const employees = [
    // Morning Shift Employees (6:00-14:30)
    { id: 'E001', name: 'Abebe Kebede', location: 'Bole', department: 'Engineering', preferredShift: 1, preferredTime: '6:00' },
    { id: 'E002', name: 'Tigist Haile', location: 'Sarbet', department: 'Finance', preferredShift: 1, preferredTime: '6:30' },
    { id: 'E003', name: 'Yohannes Tadesse', location: 'Megenagna', department: 'HR', preferredShift: 1, preferredTime: '7:00' },
    { id: 'E004', name: 'Bethlehem Assefa', location: 'Kazanchis', department: 'Marketing', preferredShift: 1, preferredTime: '7:30' },
    { id: 'E005', name: 'Dawit Mengistu', location: 'CMC', department: 'Engineering', preferredShift: 1, preferredTime: '8:00' },
    { id: 'E006', name: 'Kidus Alemu', location: 'Bole', department: 'IT', preferredShift: 1, preferredTime: '6:00' },
    { id: 'E007', name: 'Selamawit Tekle', location: 'Sarbet', department: 'Operations', preferredShift: 1, preferredTime: '6:30' },
    { id: 'E008', name: 'Natnael Girma', location: 'Megenagna', department: 'Engineering', preferredShift: 1, preferredTime: '7:00' },
    { id: 'E009', name: 'Hirut Solomon', location: 'Kazanchis', department: 'Finance', preferredShift: 1, preferredTime: '7:30' },
    { id: 'E010', name: 'Yared Berhanu', location: 'CMC', department: 'Marketing', preferredShift: 1, preferredTime: '8:00' },

    // Afternoon Shift Employees (14:30-22:30)
    { id: 'E011', name: 'Hanna Tesfaye', location: 'Bole', department: 'Finance', preferredShift: 2, preferredTime: '14:30' },
    { id: 'E012', name: 'Kidus Solomon', location: 'Megenagna', department: 'IT', preferredShift: 2, preferredTime: '15:00' },
    { id: 'E013', name: 'Rahel Girma', location: 'Sarbet', department: 'Operations', preferredShift: 2, preferredTime: '15:30' },
    { id: 'E014', name: 'Bereket Alemu', location: 'Kazanchis', department: 'Engineering', preferredShift: 2, preferredTime: '16:00' },
    { id: 'E015', name: 'Selam Bekele', location: 'CMC', department: 'Marketing', preferredShift: 2, preferredTime: '16:30' },
    { id: 'E016', name: 'Fitsum Negash', location: 'Bole', department: 'HR', preferredShift: 2, preferredTime: '14:30' },
    { id: 'E017', name: 'Eden Mekonen', location: 'Megenagna', department: 'Engineering', preferredShift: 2, preferredTime: '15:00' },
    { id: 'E018', name: 'Bemnet Tadesse', location: 'Sarbet', department: 'IT', preferredShift: 2, preferredTime: '15:30' },
    { id: 'E019', name: 'Rediet Abebe', location: 'Kazanchis', department: 'Finance', preferredShift: 2, preferredTime: '16:00' },
    { id: 'E020', name: 'Dagmawi Teklu', location: 'CMC', department: 'Operations', preferredShift: 2, preferredTime: '16:30' },

    // Night Shift Employees (22:30-6:00)
    { id: 'E021', name: 'Eyob Mulugeta', location: 'Bole', department: 'IT', preferredShift: 3, preferredTime: '22:30' },
    { id: 'E022', name: 'Meron Tadesse', location: 'Megenagna', department: 'HR', preferredShift: 3, preferredTime: '23:00' },
    { id: 'E023', name: 'Henok Getachew', location: 'Sarbet', department: 'Engineering', preferredShift: 3, preferredTime: '23:30' },
    { id: 'E024', name: 'Martha Wolde', location: 'Kazanchis', department: 'Finance', preferredShift: 3, preferredTime: '00:00' },
    { id: 'E025', name: 'Nahom Tesfaye', location: 'CMC', department: 'Operations', preferredShift: 3, preferredTime: '00:30' },
    { id: 'E026', name: 'Tinsae Berhan', location: 'Bole', department: 'Engineering', preferredShift: 3, preferredTime: '22:30' },
    { id: 'E027', name: 'Helina Assefa', location: 'Megenagna', department: 'Marketing', preferredShift: 3, preferredTime: '23:00' },
    { id: 'E028', name: 'Kirubel Hailu', location: 'Sarbet', department: 'IT', preferredShift: 3, preferredTime: '23:30' },
    { id: 'E029', name: 'Tsion Alemayehu', location: 'Kazanchis', department: 'HR', preferredShift: 3, preferredTime: '00:00' },
    { id: 'E030', name: 'Biniam Fekadu', location: 'CMC', department: 'Finance', preferredShift: 3, preferredTime: '00:30' }
];

export const shuttleRoutes = [
    {
        id: 'R1',
        name: 'Bole Route',
        areas: ['Bole', 'Sarbet', 'Kazanchis'],
        coordinates: [[38.7895, 9.0105], [38.7645, 9.0023], [38.7521, 9.0219]],
        shuttles: [
            {
                id: 'S1',
                capacity: 14,
                currentLoad: {
                    '1': { '6:00': 8, '6:30': 5, '7:00': 3, '7:30': 4, '8:00': 6, '8:30': 2 },
                    '2': { '14:30': 6, '15:00': 4, '15:30': 2, '16:00': 5, '16:30': 3, '17:00': 4 },
                    '3': { '22:30': 7, '23:00': 5, '23:30': 3, '00:00': 4, '00:30': 2, '1:00': 3 }
                },
                routeVariation: 'Express',
                passengers: {
                    '6:00': [
                        { id: 'E001', name: 'Abebe Kebede', location: 'Bole' },
                        { id: 'E006', name: 'Kidus Alemu', location: 'Bole' }
                    ],
                    '6:30': [
                        { id: 'E002', name: 'Tigist Haile', location: 'Sarbet' },
                        { id: 'E007', name: 'Selamawit Tekle', location: 'Sarbet' }
                    ],
                    '14:30': [
                        { id: 'E011', name: 'Hanna Tesfaye', location: 'Bole' },
                        { id: 'E016', name: 'Fitsum Negash', location: 'Bole' }
                    ],
                    '22:30': [
                        { id: 'E021', name: 'Eyob Mulugeta', location: 'Bole' },
                        { id: 'E026', name: 'Tinsae Berhan', location: 'Bole' }
                    ]
                }
            },
            {
                id: 'S2',
                capacity: 14,
                currentLoad: {
                    '1': { '6:00': 6, '6:30': 4, '7:00': 5, '7:30': 3, '8:00': 4, '8:30': 3 },
                    '2': { '14:30': 5, '15:00': 3, '15:30': 4, '16:00': 6, '16:30': 2, '17:00': 3 },
                    '3': { '22:30': 4, '23:00': 6, '23:30': 2, '00:00': 3, '00:30': 4, '1:00': 2 }
                },
                routeVariation: 'Regular',
                passengers: {
                    '7:00': [
                        { id: 'E003', name: 'Yohannes Tadesse', location: 'Megenagna' },
                        { id: 'E008', name: 'Natnael Girma', location: 'Megenagna' }
                    ],
                    '15:00': [
                        { id: 'E012', name: 'Kidus Solomon', location: 'Megenagna' },
                        { id: 'E017', name: 'Eden Mekonen', location: 'Megenagna' }
                    ],
                    '23:00': [
                        { id: 'E022', name: 'Meron Tadesse', location: 'Megenagna' },
                        { id: 'E027', name: 'Helina Assefa', location: 'Megenagna' }
                    ]
                }
            }
        ]
    },
    {
        id: 'R2',
        name: 'Megenagna Route',
        areas: ['Megenagna', 'CMC', 'Bole'],
        coordinates: [[38.8012, 9.0348], [38.7654, 9.0512], [38.7895, 9.0105]],
        shuttles: [
            {
                id: 'S3',
                capacity: 14,
                currentLoad: {
                    '1': { '6:00': 7, '6:30': 6, '7:00': 4, '7:30': 5, '8:00': 3, '8:30': 4 },
                    '2': { '14:30': 5, '15:00': 7, '15:30': 3, '16:00': 4, '16:30': 6, '17:00': 2 },
                    '3': { '22:30': 6, '23:00': 4, '23:30': 5, '00:00': 3, '00:30': 4, '1:00': 2 }
                },
                routeVariation: 'Express',
                passengers: {
                    '7:00': [
                        { id: 'E003', name: 'Yohannes Tadesse', location: 'Megenagna' },
                        { id: 'E008', name: 'Natnael Girma', location: 'Megenagna' }
                    ],
                    '15:00': [
                        { id: 'E012', name: 'Kidus Solomon', location: 'Megenagna' },
                        { id: 'E017', name: 'Eden Mekonen', location: 'Megenagna' }
                    ],
                    '23:00': [
                        { id: 'E022', name: 'Meron Tadesse', location: 'Megenagna' },
                        { id: 'E027', name: 'Helina Assefa', location: 'Megenagna' }
                    ]
                }
            },
            {
                id: 'S4',
                capacity: 14,
                currentLoad: {
                    '1': { '6:00': 5, '6:30': 7, '7:00': 3, '7:30': 6, '8:00': 4, '8:30': 5 },
                    '2': { '14:30': 6, '15:00': 4, '15:30': 5, '16:00': 3, '16:30': 7, '17:00': 4 },
                    '3': { '22:30': 5, '23:00': 3, '23:30': 6, '00:00': 4, '00:30': 5, '1:00': 3 }
                },
                routeVariation: 'Regular',
                passengers: {
                    '8:00': [
                        { id: 'E005', name: 'Dawit Mengistu', location: 'CMC' },
                        { id: 'E010', name: 'Yared Berhanu', location: 'CMC' }
                    ],
                    '16:30': [
                        { id: 'E015', name: 'Selam Bekele', location: 'CMC' },
                        { id: 'E020', name: 'Dagmawi Teklu', location: 'CMC' }
                    ],
                    '00:30': [
                        { id: 'E025', name: 'Nahom Tesfaye', location: 'CMC' },
                        { id: 'E030', name: 'Biniam Fekadu', location: 'CMC' }
                    ]
                }
            }
        ]
    },
    {
        id: 'R3',
        name: 'Sarbet-CMC Route',
        areas: ['Sarbet', 'CMC', 'Kazanchis'],
        coordinates: [[38.7645, 9.0023], [38.7654, 9.0512], [38.7521, 9.0219]],
        shuttles: [
            {
                id: 'S5',
                capacity: 14,
                currentLoad: {
                    '1': { '6:00': 6, '6:30': 8, '7:00': 4, '7:30': 5, '8:00': 3, '8:30': 6 },
                    '2': { '14:30': 7, '15:00': 5, '15:30': 6, '16:00': 4, '16:30': 5, '17:00': 3 },
                    '3': { '22:30': 5, '23:00': 6, '23:30': 4, '00:00': 5, '00:30': 3, '1:00': 4 }
                },
                routeVariation: 'Express',
                passengers: {
                    '6:30': [
                        { id: 'E002', name: 'Tigist Haile', location: 'Sarbet' },
                        { id: 'E007', name: 'Selamawit Tekle', location: 'Sarbet' }
                    ],
                    '15:30': [
                        { id: 'E013', name: 'Rahel Girma', location: 'Sarbet' },
                        { id: 'E018', name: 'Bemnet Tadesse', location: 'Sarbet' }
                    ],
                    '23:30': [
                        { id: 'E023', name: 'Henok Getachew', location: 'Sarbet' },
                        { id: 'E028', name: 'Kirubel Hailu', location: 'Sarbet' }
                    ]
                }
            },
            {
                id: 'S6',
                capacity: 14,
                currentLoad: {
                    '1': { '6:00': 5, '6:30': 6, '7:00': 7, '7:30': 4, '8:00': 5, '8:30': 3 },
                    '2': { '14:30': 6, '15:00': 4, '15:30': 5, '16:00': 7, '16:30': 3, '17:00': 5 },
                    '3': { '22:30': 4, '23:00': 5, '23:30': 3, '00:00': 6, '00:30': 4, '1:00': 5 }
                },
                routeVariation: 'Regular',
                passengers: {
                    '7:30': [
                        { id: 'E004', name: 'Bethlehem Assefa', location: 'Kazanchis' },
                        { id: 'E009', name: 'Hirut Solomon', location: 'Kazanchis' }
                    ],
                    '16:00': [
                        { id: 'E014', name: 'Bereket Alemu', location: 'Kazanchis' },
                        { id: 'E019', name: 'Rediet Abebe', location: 'Kazanchis' }
                    ],
                    '00:00': [
                        { id: 'E024', name: 'Martha Wolde', location: 'Kazanchis' },
                        { id: 'E029', name: 'Tsion Alemayehu', location: 'Kazanchis' }
                    ]
                }
            }
        ]
    },
    {
        id: 'R4',
        name: 'CMC-Kazanchis Route',
        areas: ['CMC', 'Kazanchis', 'Megenagna'],
        coordinates: [[38.7654, 9.0512], [38.7521, 9.0219], [38.8012, 9.0348]],
        shuttles: [
            {
                id: 'S7',
                capacity: 14,
                currentLoad: {
                    '1': { '6:00': 7, '6:30': 5, '7:00': 6, '7:30': 4, '8:00': 7, '8:30': 3 },
                    '2': { '14:30': 5, '15:00': 6, '15:30': 4, '16:00': 7, '16:30': 5, '17:00': 4 },
                    '3': { '22:30': 6, '23:00': 4, '23:30': 5, '00:00': 3, '00:30': 6, '1:00': 4 }
                },
                routeVariation: 'Express',
                passengers: {
                    '8:00': [
                        { id: 'E005', name: 'Dawit Mengistu', location: 'CMC' },
                        { id: 'E010', name: 'Yared Berhanu', location: 'CMC' }
                    ],
                    '16:30': [
                        { id: 'E015', name: 'Selam Bekele', location: 'CMC' },
                        { id: 'E020', name: 'Dagmawi Teklu', location: 'CMC' }
                    ],
                    '00:30': [
                        { id: 'E025', name: 'Nahom Tesfaye', location: 'CMC' },
                        { id: 'E030', name: 'Biniam Fekadu', location: 'CMC' }
                    ]
                }
            },
            {
                id: 'S8',
                capacity: 14,
                currentLoad: {
                    '1': { '6:00': 5, '6:30': 6, '7:00': 4, '7:30': 7, '8:00': 3, '8:30': 5 },
                    '2': { '14:30': 6, '15:00': 4, '15:30': 7, '16:00': 3, '16:30': 5, '17:00': 6 },
                    '3': { '22:30': 4, '23:00': 7, '23:30': 3, '00:00': 5, '00:30': 4, '1:00': 6 }
                },
                routeVariation: 'Regular',
                passengers: {
                    '7:00': [
                        { id: 'E003', name: 'Yohannes Tadesse', location: 'Megenagna' },
                        { id: 'E008', name: 'Natnael Girma', location: 'Megenagna' }
                    ],
                    '15:00': [
                        { id: 'E012', name: 'Kidus Solomon', location: 'Megenagna' },
                        { id: 'E017', name: 'Eden Mekonen', location: 'Megenagna' }
                    ],
                    '23:00': [
                        { id: 'E022', name: 'Meron Tadesse', location: 'Megenagna' },
                        { id: 'E027', name: 'Helina Assefa', location: 'Megenagna' }
                    ]
                }
            }
        ]
    }
]; 