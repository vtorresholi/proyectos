'use client'

import useSWR from 'swr'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui/Badge'
import { AvatarGroup } from '@/components/ui/Avatar'
import type { OdooProject } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

function pct(p: OdooProject) {
  if (!p.allocated_hours || p.allocated_hours === 0) return 0
  return Math.min(100, Math.round((p.effective_hours / p.allocated_hours) * 100))
}

function statusFor(p: OdooProject): 'active' | 'review' | 'risk' | 'done' {
  const s = p.last_update_status
  if (s === 'on_track') return 'active'
  if (s === 'at_risk') return 'risk'
  if (s === 'off_track') return 'risk'
  if (s === 'done') return 'done'
  return 'review'
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Activo', review: 'En revisión', risk: 'En riesgo', done: 'Completado',
}

function MetricCard({ label, value, sub, subColor }: {
  label: string; value: string | number; sub?: string; subColor?: string
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="text-[11px] text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-medium text-gray-900">{value}</div>
      {sub && <div className={`text-[11px] mt-1 ${subColor ?? 'text-gray-400'}`}>{sub}</div>}
    </div>
  )
}

export function Overview() {
  const { data, error, isLoading } = useSWR('/api/odoo/projects', fetcher, { refreshInterval: 60000 })
  const { data: taskData } = useSWR('/api/odoo/tasks', fetcher, { refreshInterval: 60000 })

  if (isLoading) return <div className="p-8 text-sm text-gray-400 text-center">Cargando proyectos de Odoo…</div>
  if (error || data?.error) return <div className="p-8 text-sm text-red-500 text-center">Error: {data?.error ?? 'No se pudo conectar con Odoo'}</div>

  const projects: OdooProject[] = data?.projects ?? []
  const tasks = taskData?.tasks ?? []
  const totalHrs = projects.reduce((a: number, p: OdooProject) => a + (p.allocated_hours || 0), 0)
  const usedHrs = projects.reduce((a: number, p: OdooProject) => a + (p.effective_hours || 0), 0)
  const completedTasks = tasks.filter((t: { kanban_state: string }) => t.kanban_state === 'done').length

  return (
    <div>
      <div className="grid grid-cols-4 gap-3 mb-5">
        <MetricCard label="Proyectos activos" value={projects.length} sub={`${projects.filter((p: OdooProject) => statusFor(p) === 'active').length} en track`} subColor="text-teal-600" />
        <MetricCard label="Tareas totales" value={tasks.length} sub={`${tasks.filter((t: { date_deadline: string | false }) => t.date_deadline && new Date(t.date_deadline) < new Date()).length} vencidas`} subColor="text-amber-600" />
        <MetricCard label="Completadas" value={tasks.length ? `${Math.round((completedTasks / tasks.length) * 100)}%` : '—'} sub={`${completedTasks} de ${tasks.length}`} />
        <MetricCard label="Horas registradas" value={`${Math.round(usedHrs)}h`} sub={`de ${Math.round(totalHrs)}h asignadas`} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {projects.map((p: OdooProject) => {
          const progress = pct(p)
          const status = statusFor(p)
          const memberNames = p.user_id ? [p.user_id[1]] : []

          return (
            <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2.5">
                <div>
                  <p className="text-[13px] font-medium text-gray-900">{p.name}</p>
                  {p.partner_id && (
                    <p className="text-[11px] text-gray-400 mt-0.5">Cliente: {p.partner_id[1]}</p>
                  )}
                </div>
                <Badge label={STATUS_LABEL[status]} variant={status} />
              </div>

              <ProgressBar pct={progress} showLabel />

              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-gray-400">
                  Entrega: {p.date ? new Date(p.date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' }) : '—'}
                </span>
                <AvatarGroup names={memberNames} />
              </div>

              <div className="flex gap-4 mt-3 pt-3 border-t border-gray-50">
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <i className="ti ti-check text-[13px]" aria-hidden="true" />
                  {p.task_count} tareas
                </span>
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <i className="ti ti-clock text-[13px]" aria-hidden="true" />
                  {Math.round(p.effective_hours || 0)}h / {Math.round(p.allocated_hours || 0)}h
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
