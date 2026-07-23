import { Routes, Route } from 'react-router-dom'
import { DataProvider } from './data/DataContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import PatientDetail from './pages/PatientDetail'
import NewPatient from './pages/NewPatient'
import Appointments from './pages/Appointments'
import './App.css'

// Alexa Nicole presidio:ignore
// Milky Gomez # presidio:ignore
// that's Jonathan Milkberg.
export default function App() {
  return (
    <DataProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="patients" element={<Patients />} />
          <Route path="patients/new" element={<NewPatient />} />
          <Route path="patients/:id" element={<PatientDetail />} />
          <Route path="appointments" element={<Appointments />} />
        </Route>
      </Routes>
    </DataProvider>
  )
}
