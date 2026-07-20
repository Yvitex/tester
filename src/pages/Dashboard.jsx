import { Link } from 'react-router-dom'
import { useData } from '../data/DataContext'
import { formatDate } from '../utils'

export default function Dashboard() {
  const { patients, appointments } = useData()

  const today = new Date().toISOString().slice(0, 10)
  const todays = appointments
    .filter((a) => a.date === today)
    .sort((a, b) => a.time.localeCompare(b.time))
  const upcoming = appointments
    .filter((a) => a.date > today && a.status === 'scheduled')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)

  return (
    <div>
      <h1>Dashboard</h1>

      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-value">{patients.length}</div>
          <div className="stat-label">Patients</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{todays.length}</div>
          <div className="stat-label">Appointments today</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{appointments.filter((a) => a.status === 'scheduled').length}</div>
          <div className="stat-label">Upcoming, all dates</div>
        </div>
      </div>

      <section className="panel">
        <h2>Today's schedule</h2>
        {todays.length === 0 ? (
          <p className="empty">No appointments scheduled for today.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Patient</th>
                <th>Reason</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {todays.map((a) => (
                <tr key={a.id}>
                  <td>{a.time}</td>
                  <td>{a.patientName}</td>
                  <td>{a.reason}</td>
                  <td>
                    <Link to={`/patients/${a.patientId}`}>View chart</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel">
        <h2>Upcoming appointments</h2>
        {upcoming.length === 0 ? (
          <p className="empty">Nothing else on the calendar.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Patient</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((a) => (
                <tr key={a.id}>
                  <td>{formatDate(a.date)}</td>
                  <td>{a.time}</td>
                  <td>{a.patientName}</td>
                  <td>{a.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
