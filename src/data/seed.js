export const seedPatients = [
  {
    id: 'p1',
    name: 'Maria Alvarez',
    dob: '1978-04-12',
    sex: 'F',
    phone: '(555) 012-3344',
    allergies: 'Penicillin',
    conditions: ['Hypertension'],
    vitals: [
      { date: '2026-07-01', hr: 78, bp: '128/82', temp: 98.2, spo2: 97 },
      { date: '2026-07-15', hr: 74, bp: '124/80', temp: 98.1, spo2: 98 },
    ],
    medications: [{ name: 'Lisinopril', dose: '10mg', frequency: 'Once daily' }],
    notes: [
      { date: '2026-07-15', author: 'Dr. Osei', text: 'Blood pressure trending down with medication. Continue current dose.' },
    ],
  },
  {
    id: 'p2',
    name: 'Ravi Chen',
    dob: '1991-09-30',
    sex: 'M',
    phone: '(555) 044-7789',
    allergies: 'None known',
    conditions: ['Type 2 Diabetes'],
    vitals: [
      { date: '2026-07-10', hr: 82, bp: '132/85', temp: 98.6, spo2: 99 },
    ],
    medications: [{ name: 'Metformin', dose: '500mg', frequency: 'Twice daily' }],
    notes: [
      { date: '2026-07-10', author: 'Dr. Osei', text: 'A1C improved since last visit. Reinforced dietary guidance.' },
    ],
  },
  {
    id: 'p3',
    name: 'Estelle Dubois',
    dob: '1955-01-22',
    sex: 'F',
    phone: '(555) 099-2210',
    allergies: 'Sulfa drugs',
    conditions: ['Osteoarthritis', 'Hypothyroidism'],
    vitals: [
      { date: '2026-07-18', hr: 88, bp: '140/90', temp: 98.4, spo2: 96 },
    ],
    medications: [
      { name: 'Levothyroxine', dose: '75mcg', frequency: 'Once daily' },
      { name: 'Ibuprofen', dose: '200mg', frequency: 'As needed' },
    ],
    notes: [
      { date: '2026-07-18', author: 'Dr. Osei', text: 'Blood pressure elevated at this visit. Recommended follow-up in two weeks.' },
    ],
  },
]

export const seedAppointments = [
  { id: 'a1', patientId: 'p1', patientName: 'Maria Alvarez', date: '2026-07-21', time: '09:00', reason: 'Follow-up', status: 'scheduled' },
  { id: 'a2', patientId: 'p2', patientName: 'Ravi Chen', date: '2026-07-21', time: '10:30', reason: 'Diabetes check', status: 'scheduled' },
  { id: 'a3', patientId: 'p3', patientName: 'Estelle Dubois', date: '2026-07-22', time: '14:00', reason: 'Blood pressure recheck', status: 'scheduled' },
]
