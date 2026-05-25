import express from 'express'
import { DatabaseSync } from 'node:sqlite'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, 'data')
const dbPath = join(dataDir, 'mentali.sqlite')

if (!existsSync(dataDir)) {
  mkdirSync(dataDir)
}

const db = new DatabaseSync(dbPath)
const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json())
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') {
    res.sendStatus(204)
    return
  }
  next()
})

db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS specialists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    specialization TEXT NOT NULL,
    description TEXT DEFAULT '',
    personal_slug TEXT UNIQUE NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    specialist_id INTEGER NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (specialist_id) REFERENCES specialists(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    specialist_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    duration_minutes INTEGER NOT NULL,
    price INTEGER NOT NULL,
    format TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (specialist_id) REFERENCES specialists(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    specialist_id INTEGER NOT NULL,
    client_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    appointment_date TEXT NOT NULL,
    appointment_time TEXT NOT NULL,
    status TEXT NOT NULL,
    comment TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (specialist_id) REFERENCES specialists(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
  );
`)

function slugify(value) {
  const map = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
    и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh',
    щ: 'sch', ы: 'y', э: 'e', ю: 'yu', я: 'ya',
  }

  return value
    .toLowerCase()
    .split('')
    .map((char) => map[char] || char)
    .join('')
    .replace(/ь|ъ/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function uniqueSlug(fullName) {
  const base = slugify(fullName) || `specialist-${Date.now()}`
  let slug = base
  let index = 2

  while (db.prepare('SELECT id FROM specialists WHERE personal_slug = ?').get(slug)) {
    slug = `${base}-${index}`
    index += 1
  }

  return slug
}

function getSpecialistId(req, res) {
  const id = Number(req.params.id)
  if (!id) {
    res.status(400).json({ error: 'Некорректный id специалиста' })
    return null
  }
  return id
}

function appointmentRows(specialistId) {
  return db.prepare(`
    SELECT
      a.*,
      c.full_name AS client_name,
      c.email AS client_email,
      c.phone AS client_phone,
      s.title AS service_title,
      s.duration_minutes,
      s.format
    FROM appointments a
    JOIN clients c ON c.id = a.client_id
    JOIN services s ON s.id = a.service_id
    WHERE a.specialist_id = ?
    ORDER BY a.appointment_date ASC, a.appointment_time ASC
  `).all(specialistId)
}

app.post('/api/register', (req, res) => {
  const { full_name, email, password, specialization } = req.body

  if (!full_name || !email || !password || !specialization) {
    return res.status(400).json({ error: 'Заполните все поля регистрации' })
  }

  const exists = db.prepare('SELECT id FROM specialists WHERE email = ?').get(email)
  if (exists) {
    return res.status(409).json({ error: 'Специалист с таким email уже существует' })
  }

  const personal_slug = uniqueSlug(full_name)
  const result = db.prepare(`
    INSERT INTO specialists (full_name, email, password, specialization, personal_slug)
    VALUES (?, ?, ?, ?, ?)
  `).run(full_name, email, password, specialization, personal_slug)

  const specialist = db.prepare('SELECT id, full_name, email, specialization, description, personal_slug FROM specialists WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(specialist)
})

app.post('/api/login', (req, res) => {
  const { email, password } = req.body
  const specialist = db.prepare(`
    SELECT id, full_name, email, specialization, description, personal_slug
    FROM specialists
    WHERE email = ? AND password = ?
  `).get(email, password)

  if (!specialist) {
    return res.status(401).json({ error: 'Неверный email или пароль' })
  }

  res.json(specialist)
})

app.get('/api/specialists/:id', (req, res) => {
  const id = getSpecialistId(req, res)
  if (!id) return

  const specialist = db.prepare('SELECT id, full_name, email, specialization, description, personal_slug FROM specialists WHERE id = ?').get(id)
  if (!specialist) return res.status(404).json({ error: 'Специалист не найден' })

  res.json(specialist)
})

app.put('/api/specialists/:id', (req, res) => {
  const id = getSpecialistId(req, res)
  if (!id) return

  const { full_name, email, specialization, description } = req.body
  db.prepare(`
    UPDATE specialists
    SET full_name = ?, email = ?, specialization = ?, description = ?
    WHERE id = ?
  `).run(full_name, email, specialization, description || '', id)

  const specialist = db.prepare('SELECT id, full_name, email, specialization, description, personal_slug FROM specialists WHERE id = ?').get(id)
  res.json(specialist)
})

app.get('/api/specialists/:id/dashboard', (req, res) => {
  const id = getSpecialistId(req, res)
  if (!id) return

  const specialist = db.prepare('SELECT id, full_name, email, specialization, description, personal_slug FROM specialists WHERE id = ?').get(id)
  if (!specialist) return res.status(404).json({ error: 'Специалист не найден' })

  const clientsCount = db.prepare('SELECT COUNT(*) AS count FROM clients WHERE specialist_id = ?').get(id).count
  const appointmentsCount = db.prepare('SELECT COUNT(*) AS count FROM appointments WHERE specialist_id = ?').get(id).count
  const servicesCount = db.prepare('SELECT COUNT(*) AS count FROM services WHERE specialist_id = ?').get(id).count
  const upcoming = appointmentRows(id).slice(0, 4)

  res.json({
    specialist,
    stats: { clientsCount, appointmentsCount, servicesCount },
    upcoming,
  })
})

app.get('/api/specialists/:id/appointments', (req, res) => {
  const id = getSpecialistId(req, res)
  if (!id) return
  res.json(appointmentRows(id))
})

app.post('/api/specialists/:id/appointments', (req, res) => {
  const specialistId = getSpecialistId(req, res)
  if (!specialistId) return

  const {
    client_name,
    client_email,
    client_phone,
    service_id,
    appointment_date,
    appointment_time,
    status,
    comment,
  } = req.body

  if (!client_name || !service_id || !appointment_date || !appointment_time) {
    return res.status(400).json({ error: 'Заполните клиента, услугу, дату и время' })
  }

  let client = db.prepare(`
    SELECT id FROM clients
    WHERE specialist_id = ? AND lower(email) = lower(?)
  `).get(specialistId, client_email || '')

  if (!client) {
    const result = db.prepare(`
      INSERT INTO clients (specialist_id, full_name, email, phone)
      VALUES (?, ?, ?, ?)
    `).run(specialistId, client_name, client_email || '', client_phone || '')
    client = { id: result.lastInsertRowid }
  }

  db.prepare(`
    INSERT INTO appointments (specialist_id, client_id, service_id, appointment_date, appointment_time, status, comment)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(specialistId, client.id, service_id, appointment_date, appointment_time, status || 'Запланирована', comment || '')

  res.status(201).json({ ok: true })
})

app.get('/api/specialists/:id/clients', (req, res) => {
  const id = getSpecialistId(req, res)
  if (!id) return

  const clients = db.prepare(`
    SELECT c.*, COUNT(a.id) AS appointments_count
    FROM clients c
    LEFT JOIN appointments a ON a.client_id = c.id
    WHERE c.specialist_id = ?
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `).all(id)

  res.json(clients)
})

app.get('/api/specialists/:id/services', (req, res) => {
  const id = getSpecialistId(req, res)
  if (!id) return
  res.json(db.prepare('SELECT * FROM services WHERE specialist_id = ? ORDER BY created_at DESC').all(id))
})

app.post('/api/specialists/:id/services', (req, res) => {
  const id = getSpecialistId(req, res)
  if (!id) return

  const { title, description, duration_minutes, price, format } = req.body
  if (!title || !duration_minutes || !price || !format) {
    return res.status(400).json({ error: 'Заполните название, длительность, стоимость и формат' })
  }

  const result = db.prepare(`
    INSERT INTO services (specialist_id, title, description, duration_minutes, price, format)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, title, description || '', duration_minutes, price, format)

  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(service)
})

app.delete('/api/services/:id', (req, res) => {
  const id = Number(req.params.id)
  db.prepare('DELETE FROM services WHERE id = ?').run(id)
  res.json({ ok: true })
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Mentali API: http://localhost:${PORT}`)
})
