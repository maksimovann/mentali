import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import './styles.css'

const api = {
  async request(path, options = {}) {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    const response = await fetch(`${baseUrl}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || 'Ошибка запроса')
    return data
  },
  get(path) {
    return this.request(path)
  },
  post(path, body) {
    return this.request(path, { method: 'POST', body: JSON.stringify(body) })
  },
  put(path, body) {
    return this.request(path, { method: 'PUT', body: JSON.stringify(body) })
  },
  delete(path) {
    return this.request(path, { method: 'DELETE' })
  },
}

const demoAppointments = [
  { client_name: 'Екатерина Лебедева', appointment_time: '10:00', service_title: 'Первичная консультация', status: 'Подтверждена' },
  { client_name: 'Михаил Соколов', appointment_time: '13:30', service_title: 'Онлайн-сессия', status: 'Ожидает' },
]

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  )
}

function getSpecialistId() {
  return localStorage.getItem('mentali_specialist_id')
}

function saveSpecialist(specialist) {
  localStorage.setItem('mentali_specialist_id', specialist.id)
}

function useSpecialist() {
  const navigate = useNavigate()
  const [specialist, setSpecialist] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = getSpecialistId()
    if (!id) {
      navigate('/login')
      return
    }

    api.get(`/api/specialists/${id}`)
      .then(setSpecialist)
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false))
  }, [navigate])

  return { specialist, setSpecialist, loading }
}

function Landing() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', specialization: '', password: '' })
  const [error, setError] = useState('')

  async function register(event) {
    event.preventDefault()
    setError('')
    try {
      const specialist = await api.post('/api/register', form)
      saveSpecialist(specialist)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-warm text-ink">
      <Header />

      <section className="mx-auto grid max-w-7xl gap-10 px-6 pb-16 pt-10 lg:grid-cols-[1fr_440px] lg:items-center lg:pt-16">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="mb-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-muted shadow-calm">
            Платформа для психологов и специалистов практик
          </p>
          <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight md:text-7xl">
            Пространство для спокойной и удобной работы с клиентами.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
            Mentali помогает специалистам вести записи, управлять расписанием и работать с клиентами в одном аккуратном пространстве.
          </p>
        </motion.div>

        <motion.form onSubmit={register} className="rounded-[34px] bg-white p-6 shadow-soft" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
          <h2 className="text-2xl font-semibold">Регистрация специалиста</h2>
          <p className="mt-2 text-sm leading-6 text-muted">После регистрации вы попадете в свой dashboard.</p>
          <input className="field" placeholder="Имя специалиста" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <input className="field" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="field" placeholder="Специализация" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
          <input className="field" placeholder="Пароль" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
          <button className="btn-primary mt-6 w-full justify-center">Создать кабинет</button>
          <Link to="/login" className="mt-4 block text-center text-sm font-medium text-muted hover:text-accent">Уже есть аккаунт? Войти</Link>
        </motion.form>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <p className="mb-5 text-sm font-medium text-muted">Демо-интерфейс специалиста Елены</p>
        <div className="rounded-[36px] bg-white p-5 shadow-soft md:p-8">
          <DashboardPreview />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-5 md:grid-cols-4">
          {[
            ['Онлайн-запись', 'Клиенты самостоятельно выбирают удобное время и записываются на консультацию.'],
            ['Расписание', 'Следите за консультациями, свободными слотами и рабочим графиком в одном месте.'],
            ['Клиенты', 'Храните контакты, историю записей и информацию о клиентах в личном кабинете.'],
            ['Календарь', 'Минималистичный календарь помогает быстро ориентироваться в расписании консультаций.'],
          ].map(([title, text]) => (
            <motion.article key={title} className="rounded-calm bg-white p-6 shadow-calm" whileHover={{ y: -4 }}>
              <div className="mb-5 h-10 w-10 rounded-2xl bg-accent/15" />
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{text}</p>
            </motion.article>
          ))}
        </div>
      </section>
    </main>
  )
}

function Header() {
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
      <Link to="/" className="text-2xl font-semibold tracking-tight">Mentali</Link>
      <Link to="/login" className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent">Войти</Link>
    </header>
  )
}

function Auth() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  async function login(event) {
    event.preventDefault()
    setError('')
    try {
      const specialist = await api.post('/api/login', form)
      saveSpecialist(specialist)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-warm px-6 text-ink">
      <motion.form onSubmit={login} className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-soft" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/" className="mb-10 block text-2xl font-semibold">Mentali</Link>
        <h1 className="text-3xl font-semibold">Авторизация</h1>
        <p className="mt-3 text-muted">Введите email и пароль специалиста.</p>
        <label className="mt-8 block text-sm font-medium">Email</label>
        <input className="field" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <label className="mt-5 block text-sm font-medium">Пароль</label>
        <input className="field" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
        <button className="btn-primary mt-7 w-full justify-center">Войти</button>
        <Link to="/" className="mt-4 block text-center text-sm font-medium text-muted hover:text-accent">Зарегистрироваться на главной</Link>
      </motion.form>
    </main>
  )
}

function Dashboard() {
  const { specialist, loading } = useSpecialist()
  const [data, setData] = useState(null)

  useEffect(() => {
    const id = getSpecialistId()
    if (id) api.get(`/api/specialists/${id}/dashboard`).then(setData)
  }, [])

  if (loading || !data) return <Loading />

  return (
    <Shell specialist={specialist}>
      <section className="space-y-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-muted">Главная</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Здравствуйте, {specialist.full_name.split(' ')[0]}!</h1>
          </div>
          <Link to="/calendar" className="btn-secondary w-fit">Добавить запись</Link>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <Stat label="Всего клиентов" value={data.stats.clientsCount} />
          <Stat label="Всего записей" value={data.stats.appointmentsCount} />
          <Stat label="Активных услуг" value={data.stats.servicesCount} />
        </div>

        <section className="rounded-[32px] bg-white p-6 shadow-soft">
          <h2 className="text-2xl font-semibold">Ближайшие записи на 24 часа</h2>
          <div className="mt-6 space-y-3">
            {data.upcoming.length ? data.upcoming.map((item) => <AppointmentCard key={item.id} item={item} />) : <Empty text="Пока нет ближайших записей." />}
          </div>
        </section>

        <section className="rounded-[32px] bg-white p-6 shadow-calm">
          <p className="text-sm font-medium text-muted">Ваша персональная ссылка для записи</p>
          <p className="mt-3 break-all text-2xl font-semibold text-accent">mentali.app/{specialist.personal_slug}</p>
        </section>
      </section>
    </Shell>
  )
}

function CalendarPage() {
  const { specialist, loading } = useSpecialist()
  const [appointments, setAppointments] = useState([])
  const [services, setServices] = useState([])
  const [activeDay, setActiveDay] = useState(new Date().getDate())
  const [open, setOpen] = useState(false)

  async function load() {
    const id = getSpecialistId()
    const [appointmentsData, servicesData] = await Promise.all([
      api.get(`/api/specialists/${id}/appointments`),
      api.get(`/api/specialists/${id}/services`),
    ])
    setAppointments(appointmentsData)
    setServices(servicesData)
  }

  useEffect(() => {
    if (getSpecialistId()) load()
  }, [])

  const selected = appointments.filter((item) => Number(item.appointment_date.split('-')[2]) === activeDay)

  if (loading) return <Loading />

  return (
    <Shell specialist={specialist}>
      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="rounded-[32px] bg-white p-6 shadow-soft">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-muted">Рабочий календарь</p>
              <h1 className="text-3xl font-semibold">Май 2026</h1>
            </div>
            <button className="btn-primary w-fit" onClick={() => setOpen(true)}>Добавить запись</button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-sm text-muted">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="mt-3 grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }, (_, index) => {
              const day = index + 1
              const hasAppointment = appointments.some((item) => Number(item.appointment_date.split('-')[2]) === day)
              return (
                <motion.button key={day} onClick={() => setActiveDay(day)} className={`min-h-16 rounded-2xl border transition ${activeDay === day ? 'border-accent bg-accent text-white shadow-calm' : 'border-transparent bg-warm hover:border-accent/30 hover:bg-white'}`} whileHover={{ y: -2 }}>
                  <span className="block font-semibold">{day}</span>
                  {hasAppointment && <span className={`mx-auto mt-2 block h-1.5 w-1.5 rounded-full ${activeDay === day ? 'bg-white' : 'bg-accent'}`} />}
                </motion.button>
              )
            })}
          </div>
        </div>

        <aside className="rounded-[32px] bg-white p-6 shadow-calm">
          <h2 className="text-2xl font-semibold">Записи дня</h2>
          <div className="mt-5 space-y-3">
            {selected.length ? selected.map((item) => <AppointmentCard key={item.id} item={item} />) : <Empty text="На этот день записей нет. Свободные слоты доступны." />}
          </div>
        </aside>
      </section>

      {open && <AppointmentModal services={services} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); load() }} />}
    </Shell>
  )
}

function AppointmentModal({ services, onClose, onSaved }) {
  const [form, setForm] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    service_id: services[0]?.id || '',
    appointment_date: '2026-05-08',
    appointment_time: '10:00',
    status: 'Запланирована',
    comment: '',
  })
  const [error, setError] = useState('')

  async function save(event) {
    event.preventDefault()
    if (!services.length) {
      setError('Сначала добавьте услугу в настройках.')
      return
    }
    try {
      await api.post(`/api/specialists/${getSpecialistId()}/appointments`, form)
      onSaved()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/20 px-4 backdrop-blur-sm">
      <motion.form onSubmit={save} className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-[32px] bg-white p-6 shadow-soft" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Добавить запись</h2>
          <button type="button" onClick={onClose} className="rounded-full bg-warm px-4 py-2 text-sm font-medium">Закрыть</button>
        </div>
        {!services.length && <p className="mt-5 rounded-2xl bg-accent/10 px-4 py-3 text-sm text-accent">Сначала добавьте услугу в настройках.</p>}
        <div className="grid gap-4 md:grid-cols-2">
          <input className="field" placeholder="Имя клиента" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
          <input className="field" placeholder="Email клиента" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} />
          <input className="field" placeholder="Телефон" value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} />
          <select className="field" value={form.service_id} onChange={(e) => setForm({ ...form, service_id: e.target.value })}>
            {services.map((service) => <option key={service.id} value={service.id}>{service.title}</option>)}
          </select>
          <input className="field" type="date" value={form.appointment_date} onChange={(e) => setForm({ ...form, appointment_date: e.target.value })} />
          <input className="field" type="time" value={form.appointment_time} onChange={(e) => setForm({ ...form, appointment_time: e.target.value })} />
          <select className="field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option>Запланирована</option>
            <option>Подтверждена</option>
            <option>Ожидает</option>
            <option>Завершена</option>
          </select>
          <input className="field" placeholder="Комментарий" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
        </div>
        {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
        <button className="btn-primary mt-6 w-full justify-center">Сохранить запись</button>
      </motion.form>
    </div>
  )
}

function ClientsPage() {
  const { specialist, loading } = useSpecialist()
  const [clients, setClients] = useState([])

  useEffect(() => {
    const id = getSpecialistId()
    if (id) api.get(`/api/specialists/${id}/clients`).then(setClients)
  }, [])

  if (loading) return <Loading />

  return (
    <Shell specialist={specialist}>
      <section className="rounded-[32px] bg-white p-6 shadow-soft">
        <h1 className="text-3xl font-semibold">Клиенты</h1>
        <div className="mt-6 space-y-3">
          {clients.length ? clients.map((client) => (
            <div key={client.id} className="grid gap-3 rounded-3xl bg-warm p-4 md:grid-cols-[1fr_1fr_1fr_auto]">
              <p className="font-semibold">{client.full_name}</p>
              <p className="text-muted">{client.email || 'Email не указан'}</p>
              <p className="text-muted">{client.phone || 'Телефон не указан'}</p>
              <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-accent">{client.appointments_count} записей</span>
            </div>
          )) : <Empty text="Клиентов пока нет." />}
        </div>
      </section>
    </Shell>
  )
}

function SettingsPage() {
  const { specialist, setSpecialist, loading } = useSpecialist()
  const [profile, setProfile] = useState(null)
  const [services, setServices] = useState([])
  const [serviceForm, setServiceForm] = useState({ title: '', duration_minutes: 60, price: 3000, format: 'Онлайн', description: '' })

  async function loadServices() {
    const data = await api.get(`/api/specialists/${getSpecialistId()}/services`)
    setServices(data)
  }

  useEffect(() => {
    if (specialist) setProfile(specialist)
  }, [specialist])

  useEffect(() => {
    if (getSpecialistId()) loadServices()
  }, [])

  async function saveProfile(event) {
    event.preventDefault()
    const updated = await api.put(`/api/specialists/${getSpecialistId()}`, profile)
    setSpecialist(updated)
    setProfile(updated)
  }

  async function addService(event) {
    event.preventDefault()
    await api.post(`/api/specialists/${getSpecialistId()}/services`, serviceForm)
    setServiceForm({ title: '', duration_minutes: 60, price: 3000, format: 'Онлайн', description: '' })
    loadServices()
  }

  async function deleteService(id) {
    await api.delete(`/api/services/${id}`)
    loadServices()
  }

  if (loading || !profile) return <Loading />

  return (
    <Shell specialist={specialist}>
      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <form onSubmit={saveProfile} className="rounded-[32px] bg-white p-6 shadow-soft">
          <h1 className="text-3xl font-semibold">Профиль</h1>
          <input className="field" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
          <input className="field" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
          <input className="field" value={profile.specialization} onChange={(e) => setProfile({ ...profile, specialization: e.target.value })} />
          <textarea className="field min-h-32" placeholder="Описание о себе" value={profile.description || ''} onChange={(e) => setProfile({ ...profile, description: e.target.value })} />
          <button className="btn-primary mt-6">Сохранить изменения</button>
        </form>

        <div className="rounded-[32px] bg-white p-6 shadow-soft">
          <h2 className="text-3xl font-semibold">Услуги</h2>
          <form onSubmit={addService} className="mt-4 grid gap-3">
            <input className="field" placeholder="Название услуги" value={serviceForm.title} onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })} />
            <div className="grid gap-3 md:grid-cols-3">
              <input className="field" type="number" value={serviceForm.duration_minutes} onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: e.target.value })} />
              <input className="field" type="number" value={serviceForm.price} onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })} />
              <select className="field" value={serviceForm.format} onChange={(e) => setServiceForm({ ...serviceForm, format: e.target.value })}>
                <option>Онлайн</option>
                <option>Очно</option>
                <option>Смешанный</option>
              </select>
            </div>
            <input className="field" placeholder="Описание" value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} />
            <button className="btn-primary mt-3">Добавить услугу</button>
          </form>

          <div className="mt-6 space-y-3">
            {services.length ? services.map((service) => (
              <div key={service.id} className="flex flex-col justify-between gap-3 rounded-3xl bg-warm p-4 md:flex-row md:items-center">
                <div>
                  <p className="font-semibold">{service.title}</p>
                  <p className="text-sm text-muted">{service.duration_minutes} мин · {service.price} ₽ · {service.format}</p>
                </div>
                <button onClick={() => deleteService(service.id)} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-red-500">Удалить</button>
              </div>
            )) : <Empty text="Услуги пока не добавлены." />}
          </div>
        </div>
      </section>
    </Shell>
  )
}

function Shell({ specialist, children }) {
  const navigate = useNavigate()
  const links = [
    ['Главная', '/dashboard'],
    ['Календарь', '/calendar'],
    ['Клиенты', '/clients'],
    ['Настройки', '/settings'],
  ]

  function logout() {
    localStorage.removeItem('mentali_specialist_id')
    navigate('/login')
  }

  return (
    <main className="min-h-screen bg-warm text-ink md:grid md:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-black/5 bg-white/75 p-6 backdrop-blur md:block">
        <Link to="/" className="text-2xl font-semibold">Mentali</Link>
        <p className="mt-3 text-sm text-muted">{specialist?.full_name}</p>
        <nav className="mt-10 space-y-2">
          {links.map(([label, path]) => (
            <NavLink key={label} to={path} className={({ isActive }) => `block rounded-2xl px-4 py-3 font-medium transition ${isActive ? 'bg-accent text-white shadow-calm' : 'text-muted hover:bg-warm hover:text-ink'}`}>
              {label}
            </NavLink>
          ))}
        </nav>
        <button onClick={logout} className="mt-10 rounded-full bg-warm px-4 py-2 text-sm font-medium text-muted">Выйти</button>
      </aside>
      <div>
        <nav className="sticky top-0 z-10 flex gap-2 overflow-x-auto border-b border-black/5 bg-white/85 px-4 py-3 backdrop-blur md:hidden">
          {links.map(([label, path]) => <NavLink key={label} to={path} className="rounded-full bg-warm px-4 py-2 text-sm font-medium">{label}</NavLink>)}
        </nav>
        <div className="mx-auto max-w-7xl px-5 py-8 md:px-10 md:py-12">{children}</div>
      </div>
    </main>
  )
}

function Stat({ label, value }) {
  return (
    <motion.div className="rounded-calm bg-white p-6 shadow-calm" whileHover={{ y: -4 }}>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-4 text-4xl font-semibold">{value}</p>
    </motion.div>
  )
}

function AppointmentCard({ item }) {
  return (
    <motion.article className="grid gap-3 rounded-3xl bg-warm p-4 md:grid-cols-[1fr_auto_auto]" whileHover={{ x: 4 }}>
      <div>
        <p className="font-semibold">{item.client_name}</p>
        <p className="text-sm text-muted">{item.service_title}</p>
      </div>
      <p className="font-medium">{item.appointment_date} · {item.appointment_time}</p>
      <span className="w-fit rounded-full bg-white px-4 py-2 text-sm font-medium text-accent">{item.status}</span>
    </motion.article>
  )
}

function Empty({ text }) {
  return <p className="rounded-3xl bg-warm p-5 text-muted">{text}</p>
}

function Loading() {
  return <main className="grid min-h-screen place-items-center bg-warm text-muted">Загрузка...</main>
}

function DashboardPreview() {
  return (
    <div className="rounded-[30px] bg-warm p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">Демо dashboard</p>
          <h3 className="text-2xl font-semibold">Специалист Елена</h3>
        </div>
        <div className="h-11 w-28 rounded-full bg-white" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {['18 клиентов', '42 записи', '4 услуги'].map((item) => <div key={item} className="rounded-3xl bg-white p-5 font-semibold">{item}</div>)}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {demoAppointments.map((item) => (
          <div key={item.client_name} className="rounded-3xl bg-white p-5">
            <p className="font-semibold">{item.appointment_time} · {item.client_name}</p>
            <p className="mt-2 text-sm text-muted">{item.service_title}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
