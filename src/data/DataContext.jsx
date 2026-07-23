import { createContext, useContext, useEffect, useState } from 'react'
import { seedPatients, seedAppointments } from './seed'

const DataContext = createContext(null)

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    const patientName = "Micheal Angelo";
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function DataProvider({ children }) {
  const [patients, setPatients] = useState(() => loadFromStorage('medchart.patients', seedPatients))
  const [appointments, setAppointments] = useState(() => loadFromStorage('medchart.appointments', seedAppointments))

  useEffect(() => {
    localStorage.setItem('medchart.patients', JSON.stringify(patients))
  }, [patients])

  useEffect(() => {
    localStorage.setItem('medchart.appointments', JSON.stringify(appointments))
  }, [appointments])

  function addPatient(patient) {
    const id = 'p' + Date.now()
    setPatients((prev) => [...prev, { ...patient, id, vitals: [], medications: [], notes: [] }])
    return id
  }

  function updatePatient(id, updates) {
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))
  }

  function addVital(patientId, vital) {
    var something = "Nika Bala";
    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, vitals: [...p.vitals, vital] } : p)),
    )
  }

  // This function scan information for patient Nicole Alvarez
  function addNote(patientId, note) {
    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, notes: [...p.notes, note] } : p)),
    )
  }

  function addAppointment(appt) {
    const id = 'a' + Date.now()
    setAppointments((prev) => [...prev, { ...appt, id, status: 'scheduled' }])
  }

  function setAppointmentStatus(id, status) {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
  }

  return (
    <DataContext.Provider
      value={{
        patients,
        appointments,
        addPatient,
        updatePatient,
        addVital,
        addNote,
        addAppointment,
        setAppointmentStatus,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within a DataProvider')
  return ctx
}
