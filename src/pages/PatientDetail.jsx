import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useData } from '../data/DataContext'
import { calcAge, formatDate } from '../utils'

export default function PatientDetail() {
  const { id } = useParams()
  const { patients, addVital, addNote } = useData()
  const navigate = useNavigate()
  const patient = patients.find((p) => p.id === id)

  const [vitalForm, setVitalForm] = useState({ hr: '', bp: '', temp: '', spo2: '' })
  const [noteForm, setNoteForm] = useState({ author: '', text: '' })

  if (!patient) {
    return (
      <div>
        <p className="empty">Patient not found.</p>
        <Link to="/patients">Back to patients</Link>
      </div>
    )
  }

  function handleAddVital(e) {
    e.preventDefault()
    if (!vitalForm.hr && !vitalForm.bp && !vitalForm.temp && !vitalForm.spo2) return
    addVital(patient.id, {
      date: new Date().toISOString().slice(0, 10),
      hr: vitalForm.hr ? Number(vitalForm.hr) : undefined,
      bp: vitalForm.bp || undefined,
      temp: vitalForm.temp ? Number(vitalForm.temp) : undefined,
      spo2: vitalForm.spo2 ? Number(vitalForm.spo2) : undefined,
    })
    setVitalForm({ hr: '', bp: '', temp: '', spo2: '' })
  }

  function handleAddNote(e) {
    e.preventDefault()
    if (!noteForm.text.trim()) return
    addNote(patient.id, {
      date: new Date().toISOString().slice(0, 10),
      author: noteForm.author.trim() || 'Unspecified',
      text: noteForm.text.trim(),
    })
    setNoteForm({ author: '', text: '' })
  }

  const vitalsSorted = [...patient.vitals].sort((a, b) => b.date.localeCompare(a.date))
  const notesSorted = [...patient.notes].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div>
      <div className="page-header">
        <h1>{patient.name}</h1>
        <button className="button-secondary" onClick={() => navigate('/patients')}>
          Back to patients
        </button>
      </div>

      <section className="panel">
        <h2>Demographics</h2>
        <dl className="detail-grid">
          <div>
            <dt>Date of birth</dt>
            <dd>{formatDate(patient.dob)} (age {calcAge(patient.dob)})</dd>
          </div>
          <div>
            <dt>Sex</dt>
            <dd>{patient.sex}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{patient.phone || '—'}</dd>
          </div>
          <div>
            <dt>Allergies</dt>
            <dd>{patient.allergies}</dd>
          </div>
          <div>
            <dt>Conditions</dt>
            <dd>{patient.conditions?.join(', ') || '—'}</dd>
          </div>
        </dl>
      </section>

      <section className="panel">
        <h2>Medications</h2>
        {patient.medications?.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Dose</th>
                <th>Frequency</th>
              </tr>
            </thead>
            <tbody>
              {patient.medications.map((m, i) => (
                <tr key={i}>
                  <td>{m.name}</td>
                  <td>{m.dose}</td>
                  <td>{m.frequency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty">No medications on record.</p>
        )}
      </section>

      <section className="panel">
        <h2>Vitals</h2>
        {vitalsSorted.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Heart rate</th>
                <th>Blood pressure</th>
                <th>Temp (°F)</th>
                <th>SpO2</th>
              </tr>
            </thead>
            <tbody>
              {vitalsSorted.map((v, i) => (
                <tr key={i}>
                  <td>{formatDate(v.date)}</td>
                  <td>{v.hr ?? '—'}</td>
                  <td>{v.bp ?? '—'}</td>
                  <td>{v.temp ?? '—'}</td>
                  <td>{v.spo2 ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty">No vitals recorded yet.</p>
        )}

        <form className="inline-form" onSubmit={handleAddVital}>
          <input
            placeholder="Heart rate"
            value={vitalForm.hr}
            onChange={(e) => setVitalForm((f) => ({ ...f, hr: e.target.value }))}
          />
          <input
            placeholder="Blood pressure (e.g. 120/80)"
            value={vitalForm.bp}
            onChange={(e) => setVitalForm((f) => ({ ...f, bp: e.target.value }))}
          />
          <input
            placeholder="Temp (°F)"
            value={vitalForm.temp}
            onChange={(e) => setVitalForm((f) => ({ ...f, temp: e.target.value }))}
          />
          <input
            placeholder="SpO2 (%)"
            value={vitalForm.spo2}
            onChange={(e) => setVitalForm((f) => ({ ...f, spo2: e.target.value }))}
          />
          <button type="submit" className="button">
            Add vitals
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Visit notes</h2>
        {notesSorted.length ? (
          <ul className="notes-list">
            {notesSorted.map((n, i) => (
              <li key={i}>
                <div className="note-meta">
                  {formatDate(n.date)} — {n.author}
                </div>
                <div>{n.text}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">No notes yet.</p>
        )}

        <form className="inline-form-stacked" onSubmit={handleAddNote}>
          <input
            placeholder="Author"
            value={noteForm.author}
            onChange={(e) => setNoteForm((f) => ({ ...f, author: e.target.value }))}
          />
          <textarea
            placeholder="Note"
            value={noteForm.text}
            onChange={(e) => setNoteForm((f) => ({ ...f, text: e.target.value }))}
          />
          <button type="submit" className="button">
            Add note
          </button>
        </form>
      </section>
    </div>
  )
}
