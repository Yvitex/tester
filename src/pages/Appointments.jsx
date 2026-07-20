import { useState } from 'react'
import { useData } from '../data/DataContext'
import { formatDate } from '../utils'

export default function Appointments() {
  const { appointments, patients, addAppointment, setAppointmentStatus } = useData()
  const [form, setForm] = useState({ patientId: '', date: '', time: '', reason: '' })

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.patientId || !form.date || !form.time) return
    const patient = patients.find((p) => p.id === form.patientId)
    addAppointment({
      patientId: form.patientId,
      patientName: patient?.name || 'Unknown',
      date: form.date,
      time: form.time,
      reason: form.reason.trim() || 'Visit',
    })
    setForm({ patientId: '', date: '', time: '', reason: '' })
  }

  const sorted = [...appointments].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

  return (
    <div>
      <h1>Appointments</h1>

      <section className="panel">
        <h2>Schedule new appointment</h2>
        <form className="form" onSubmit={handleSubmit}>
          <label>
            Patient
            <select
              required
              value={form.patientId}
              onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}
            >
              <option value="">Select a patient...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <div className="form-row">
            <label>
              Date
              <input
                required
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </label>
            <label>
              Time
              <input
                required
                type="time"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              />
            </label>
          </div>
          <label>
            Reason
            <input value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
          </label>
          <button type="submit" className="button">
            Schedule
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>All appointments</h2>
        {sorted.length === 0 ? (
          <p className="empty">No appointments scheduled.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Patient</th>
                <th>Reason</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((a) => (
                <tr key={a.id}>
                  <td>{formatDate(a.date)}</td>
                  <td>{a.time}</td>
                  <td>{a.patientName}</td>
                  <td>{a.reason}</td>
                  <td>
                    <span className={`badge badge-${a.status}`}>{a.status}</span>
                  </td>
                  <td>
                    {a.status === 'scheduled' && (
                      <>
                        <button className="link-button" onClick={() => setAppointmentStatus(a.id, 'completed')}>
                          Mark completed
                        </button>
                        {' · '}
                        <button className="link-button" onClick={() => setAppointmentStatus(a.id, 'cancelled')}>
                          Cancel
                        </button>
                      </>
                    )}
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
