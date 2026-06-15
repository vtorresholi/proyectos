'use client'

import useSWR from 'swr'
import { Avatar } from '@/components/ui/Avatar'
import { Badge, PriorityDot } from '@/components/ui/Badge'
import type { OdooTask } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const TAG_VARIANTS: Record<string, 'task' | 'feat' | 'imp' | 'bug'> = {
  dev: 'feat', design: 'task', qa: 'imp', bug: 'bug',
}

function TaskCard({ task }: { task: OdooTask }) {
  const isLate = task.date_deadline ? new Date(task.date_deadline) < new Date() : false
  const assigneeName = task.user_ids?.[0]?.[1] ?? ''
  const stageName = task.stage_id ? task.stage_id[1] : ''

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-2.5 mb-2 cursor-pointer hover:border-gray-300 transition-colors">
      <div className="flex items-center gap-1.5 mb-1.5">
        <PriorityDot level={task.priority === '1' ? 'high' : 'low'} />
        <span className="text-[10px] text-gray-400">{task.project_id ? task.project_id[1] : ''}</span>
      </div>
      <p className="text-[12px] font-medium text-gray-900 mb-2 leading-snug">{task.name}</p>
      <div className="flex items-center justify-between">
        <Badge label={stageName.slice(0, 10)} variant="default" />
        <span className={`text-[10px] flex items-center gap-1 ${isLate ? 'text-red-600' : 'text-gray-400'}`}>
          <i className="ti ti-calendar text-[11px]" aria-hidden="true" />
          {task.date_deadline
            ? new Date(task.date_deadline).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })
            : '—'}
        </span>
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-gray-400 flex items-center gap-1">
          <i className="ti ti-clock text-[11px]" aria-hidden="true" />
          {task.planned_hours}h
        </span>
        {assigneeName && <Avatar name={assigneeName} size="sm" />}
      </div>
    </div>
  )
}

export function Kanban() {
  const { data, error, isLoading } = useSWR('/api/odoo/tasks', fetcher, { refreshInterval: 30000 })

  if (isLoading) return <div className="p-8 text-sm text-gray-400 text-center">Cargando tareas de Odoo…</div>
  if (error) return <div className="p-8 text-sm text-red-500 text-center">Error al cargar tareas</div>

  const tasks: OdooTask[] = data?.tasks ?? []

  const grouped: Record<string, OdooTask[]> = {}
  for (const t of tasks) {
    const col = t.stage_id ? t.stage_id[1] : 'Sin etapa'
    if (!grouped[col]) grouped[col] = []
    grouped[col].push(t)
  }

  const columns = Object.entries(grouped).slice(0, 5)

  if (columns.length === 0) {
    return <div className="p-8 text-sm text-gray-400 text-center">No hay tareas disponibles</div>
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {columns.map(([stage, stageTasks]) => (
        <div key={stage} className="flex-shrink-0 w-52">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-medium text-gray-600">{stage}</span>
            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-px rounded-full">{stageTasks.length}</span>
          </div>
          {stageTasks.map(t => <TaskCard key={t.id} task={t} />)}
        </div>
      ))}
    </div>
  )
}
