import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../data/DataContext'
import { calcAge } from '../utils'

export default function Patients() {
  const { patients } = useData()
  const [query, setQuery] = useState('')

  const filtered = patients.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <div>
      <div className="page-header">
        <h1>Patients</h1>
        <Link to="/patients/new" className="button">
          + New patient
        </Link>
      </div>

      <input
        className="search-input"
        placeholder="Search patients by name..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <section className="panel">
        {filtered.length === 0 ? (
          <p className="empty">No patients match your search.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Age</th>
                <th>Sex</th>
                <th>Conditions</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{calcAge(p.dob)}</td>
                  <td>{p.sex}</td>
                  <td>{p.conditions?.join(', ') || '—'}</td>
                  <td>
                    <Link to={`/patients/${p.id}`}>View chart</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
