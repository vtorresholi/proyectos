export interface OdooProject {
  id: number
  name: string
  date_start: string | false
  date: string | false
  user_id: [number, string] | false
  partner_id: [number, string] | false
  task_count: number
  task_ids: number[]
  description: string | false
  color: number
  last_update_status: string
  allocated_hours: number
  effective_hours: number
}

export interface OdooTask {
  id: number
  name: string
  project_id: [number, string] | false
  user_ids: Array<[number, string]>
  stage_id: [number, string] | false
  date_deadline: string | false
  planned_hours: number
  effective_hours: number
  priority: '0' | '1'
  tag_ids: number[]
  description: string | false
  kanban_state: 'normal' | 'done' | 'blocked'
  write_date: string
}

export interface OdooUser {
  id: number
  name: string
  login: string
  email: string
  image_128: string | false
}

export interface OdooStage {
  id: number
  name: string
  sequence: number
  fold: boolean
}

export interface DashboardProject extends OdooProject {
  pct: number
  statusLabel: 'Activo' | 'En revisión' | 'En riesgo' | 'Completado'
}

export interface DashboardTask extends OdooTask {
  stageName: string
  projectName: string
  assignees: string[]
  isLate: boolean
}
