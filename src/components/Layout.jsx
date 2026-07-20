import { NavLink, Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">+</span>
          <span>MedChart</span>
        </div>
        <nav>
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Dashboard
          </NavLink>
          <NavLink to="/patients" className={({ isActive }) => (isActive ? 'active' : '')}>
            Patients
          </NavLink>
          <NavLink to="/appointments" className={({ isActive }) => (isActive ? 'active' : '')}>
            Appointments
          </NavLink>
        </nav>
        <div className="sidebar-footer">Demo data only. No real patient information.</div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
