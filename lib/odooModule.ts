const BASE = (process.env.ODOO_URL ?? '').replace(/\/$/, '')
const API_KEY = process.env.ODOO_MODULE_API_KEY ?? ''

async function req<T>(
  path: string,
  method: 'GET' | 'POST' | 'PUT' = 'GET',
  body?: unknown,
  params?: Record<string, string>
): Promise<T> {
  if (!BASE) throw new Error('ODOO_URL no está configurado en Vercel')
  if (!API_KEY) throw new Error('ODOO_MODULE_API_KEY no está configurado en Vercel')
  let url = `${BASE}${path}`
  if (params) {
    const qs = new URLSearchParams(params).toString()
    if (qs) url += `?${qs}`
  }
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': API_KEY,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })
  const text = await res.text()
  if (!res.ok || text.trimStart().startsWith('<')) {
    throw new Error(`Error de conexión con Odoo (status ${res.status}) en ${path}`)
  }
  return JSON.parse(text) as T
}

// ─── READ ─────────────────────────────────────────────────────────────────────

export const getSummary = () =>
  req<DashSummary>('/holi/dashboard/summary')

export const getProjects = () =>
  req<{ projects: DashProject[] }>('/holi/dashboard/projects')

export const getTasks = (filters?: { project_id?: number; stage_id?: number; user_id?: number; limit?: number }) =>
  req<{ tasks: DashTask[]; total: number }>('/holi/dashboard/tasks', 'GET', undefined, {
    ...(filters?.project_id ? { project_id: String(filters.project_id) } : {}),
    ...(filters?.stage_id ? { stage_id: String(filters.stage_id) } : {}),
    ...(filters?.user_id ? { user_id: String(filters.user_id) } : {}),
    ...(filters?.limit ? { limit: String(filters.limit) } : {}),
  })

export const getTickets = (filters?: { stage?: string; team_id?: number; limit?: number }) =>
  req<{ tickets: DashTicket[]; total: number }>('/holi/dashboard/tickets', 'GET', undefined, {
    ...(filters?.stage ? { stage: filters.stage } : {}),
    ...(filters?.team_id ? { team_id: String(filters.team_id) } : {}),
    ...(filters?.limit ? { limit: String(filters.limit) } : {}),
  })

export const getUsers = () =>
  req<{ users: DashUser[] }>('/holi/dashboard/users')

export const getTimesheets = (filters?: { project_id?: number; user_id?: number; date_from?: string; date_to?: string }) =>
  req<{ timesheets: DashTimesheet[]; total: number }>('/holi/dashboard/timesheets', 'GET', undefined, {
    ...(filters?.project_id ? { project_id: String(filters.project_id) } : {}),
    ...(filters?.user_id ? { user_id: String(filters.user_id) } : {}),
    ...(filters?.date_from ? { date_from: filters.date_from } : {}),
    ...(filters?.date_to ? { date_to: filters.date_to } : {}),
  })

export const getConfig = () =>
  req<DashConfig>('/holi/dashboard/config')

export const getWeekly = (date_from?: string, date_to?: string) =>
  req<DashWeekly>('/holi/dashboard/weekly', 'GET', undefined, {
    ...(date_from ? { date_from } : {}),
    ...(date_to ? { date_to } : {}),
  })

// ─── CREATE ───────────────────────────────────────────────────────────────────

export const createProject = (vals: {
  name: string
  date_start?: string
  date?: string
  user_id?: number
  partner_id?: number
  allocated_hours?: number
  description?: string
}) => req<{ id: number; name: string }>('/holi/dashboard/projects', 'POST', vals)

export const createTask = (vals: {
  name: string
  project_id?: number
  user_ids?: number[]
  stage_id?: number
  date_deadline?: string
  planned_hours?: number
  priority?: '0' | '1'
  description?: string
  tag_ids?: number[]
}) => req<{ id: number; name: string }>('/holi/dashboard/tasks', 'POST', vals)

export const createTicket = (vals: {
  name: string
  description?: string
  user_id?: number
  partner_id?: number
  priority?: '0' | '1' | '2' | '3'
  team_id?: number
}) => req<{ id: number; name: string }>('/holi/dashboard/tickets', 'POST', vals)

export const logTimesheet = (vals: {
  name?: string
  project_id: number
  task_id?: number
  user_id?: number
  date?: string
  hours: number
}) => req<{ id: number }>('/holi/dashboard/timesheets', 'POST', vals)

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export const updateProject = (id: number, vals: Partial<{
  name: string
  date_start: string | null
  date: string | null
  user_id: number | null
  partner_id: number | null
  allocated_hours: number
  description: string
  last_update_status: string
  color: number
  active: boolean
  tag_ids: number[]
}>) => req<{ ok: boolean; id: number }>(`/holi/dashboard/projects/${id}`, 'PUT', vals)

export const updateTask = (id: number, vals: Partial<{
  name: string
  stage_id: number
  date_deadline: string | null
  planned_hours: number
  priority: '0' | '1'
  kanban_state: 'normal' | 'done' | 'blocked'
  user_ids: number[]
  description: string
}>) => req<{ ok: boolean; id: number }>(`/holi/dashboard/tasks/${id}`, 'PUT', vals)

export const updateTicket = (id: number, vals: Partial<{
  name: string
  stage_id: number
  user_id: number | null
  priority: '0' | '1' | '2' | '3'
  description: string
}>) => req<{ ok: boolean; id: number }>(`/holi/dashboard/tickets/${id}`, 'PUT', vals)

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface IdName { id: number; name: string }

export interface DashSummary {
  projects: number
  tasks: number
  done_tasks: number
  late_tasks: number
  pct_done: number
  planned_hours: number
  effective_hours: number
  tickets: number
  open_tickets: number
  has_helpdesk: boolean
}

export interface DashProject {
  id: number
  name: string
  date_start: string | null
  date: string | null
  responsible: IdName | null
  client: IdName | null
  task_count: number
  done_count: number
  late_count: number
  pct_complete: number
  allocated_hours: number
  effective_hours: number
  status: string
  color: number
  description: string
  members: { id: number; name: string; email: string }[]
}

export interface DashTask {
  id: number
  name: string
  project: IdName | null
  stage: IdName | null
  assignees: { id: number; name: string; email: string }[]
  date_deadline: string | null
  planned_hours: number
  effective_hours: number
  priority: '0' | '1'
  kanban_state: 'normal' | 'done' | 'blocked'
  tags: { id: number; name: string; color: number }[]
  description: string
  is_late: boolean
  write_date: string
  create_date: string
  client: IdName | null
  milestone: IdName | null
}

export interface DashTicket {
  id: number
  name: string
  description: string
  assignee: IdName | null
  client: IdName | null
  stage: IdName | null
  priority: string
  team: IdName | null
  type: IdName | null
  tags: IdName[]
  create_date: string
  write_date: string
  close_date: string | null
  sla_deadline: string | null
}

export interface DashUser {
  id: number
  name: string
  login: string
  email: string
  tz: string
  task_count: number
  open_tasks: number
  planned_hours: number
  logged_hours: number
}

export interface DashTimesheet {
  id: number
  description: string
  project: IdName | null
  task: IdName | null
  user: IdName | null
  date: string
  hours: number
}

export interface DashConfig {
  task_stages: { id: number; name: string; sequence: number; fold: boolean }[]
  task_tags: { id: number; name: string; color: number }[]
  ticket_stages: { id: number; name: string; sequence: number; is_close: boolean }[]
  ticket_teams: { id: number; name: string }[]
  ticket_types: { id: number; name: string }[]
  milestones: { id: number; name: string; project_id: IdName; deadline: string | null; is_reached: boolean }[]
  company: { id: number; name: string }
  has_helpdesk: boolean
  has_timesheets: boolean
  has_milestones: boolean
}

export interface DashWeekly {
  date_from: string
  date_to: string
  by_user: {
    user_id: number
    user_name: string
    tasks: {
      id: number
      name: string
      project: IdName | null
      stage: IdName | null
      date_deadline: string
      planned_hours: number
      kanban_state: string
      priority: string
    }[]
  }[]
}
