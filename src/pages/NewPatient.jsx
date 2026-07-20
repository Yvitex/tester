import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useData } from '../data/DataContext'

export default function NewPatient() {
  const { addPatient } = useData()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    dob: '',
    sex: 'F',
    phone: '',
    allergies: '',
    conditions: '',
  })

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.dob) return
    const id = addPatient({
      name: form.name.trim(),
      dob: form.dob,
      sex: form.sex,
      phone: form.phone.trim(),
      allergies: form.allergies.trim() || 'None known',
      conditions: form.conditions
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
    })
    navigate(`/patients/${id}`)
  }

  return (
    <div>
      <div className="page-header">
        <h1>New patient</h1>
        <Link to="/patients">Cancel</Link>
      </div>

      <form className="panel form" onSubmit={handleSubmit}>
        <label>
          Full name
          <input required value={form.name} onChange={(e) => update('name', e.target.value)} />
        </label>

        <div className="form-row">
          <label>
            Date of birth
            <input required type="date" value={form.dob} onChange={(e) => update('dob', e.target.value)} />
          </label>
          <label>
            Sex
            <select value={form.sex} onChange={(e) => update('sex', e.target.value)}>
              <option value="F">Female</option>
              <option value="M">Male</option>
              <option value="O">Other</option>
            </select>
          </label>
        </div>

        <label>
          Phone
          <input value={form.phone} onChange={(e) => update('phone', e.target.value)} />
        </label>

        <label>
          Allergies
          <input
            placeholder="None known"
            value={form.allergies}
            onChange={(e) => update('allergies', e.target.value)}
          />
        </label>

        <label>
          Conditions (comma separated)
          <input value={form.conditions} onChange={(e) => update('conditions', e.target.value)} />
        </label>

        <button type="submit" className="button">
          Save patient
        </button>
      </form>
    </div>
  )
}
