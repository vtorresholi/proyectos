'use client'

import { useState, useMemo, useEffect } from 'react'
import useSWR from 'swr'
import { Avatar } from '@/components/ui/Avatar'
import { Badge, PriorityDot } from '@/components/ui/Badge'
import type { DashTask } from '@/lib/odooModule'

const fetcher = (url: string) => fetch(url).then(r => r.json())

function TaskCard({ task }: { task: DashTask }) {
  const assigneeName = task.assignees?.[0]?.name ?? ''
  const stageName = task.stage?.name ?? ''

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-2.5 mb-2 cursor-pointer hover:border-gray-300 transition-colors">
      <div className="flex items-center gap-1.5 mb-1.5">
        <PriorityDot level={task.priority === '1' ? 'high' : 'low'} />
        <span className="text-[10px] text-gray-400">{task.project?.name ?? ''}</span>
      </div>
      <p className="text-[12px] font-medium text-gray-900 mb-2 leading-snug">{task.name}</p>
      <div className="flex items-center justify-between">
        <Badge label={stageName.slice(0, 10)} variant="default" />
        <span className={`text-[10px] flex items-center gap-1 ${task.is_late ? 'text-red-600' : 'text-gray-400'}`}>
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

interface KanbanFilter {
  late?: boolean
  project_id?: number
  user_id?: number
}

export function Kanban({ initialFilter }: { initialFilter?: KanbanFilter }) {
  const { data, error, isLoading } = useSWR('/api/odoo/tasks', fetcher, { refreshInterval: 30000 })

  const [onlyLate, setOnlyLate] = useState(initialFilter?.late ?? false)
  const [projectId, setProjectId] = useState<number | null>(initialFilter?.project_id ?? null)
  const [userId, setUserId] = useState<number | null>(initialFilter?.user_id ?? null)

  useEffect(() => {
    setOnlyLate(initialFilter?.late ?? false)
    setProjectId(initialFilter?.project_id ?? null)
    setUserId(initialFilter?.user_id ?? null)
  }, [initialFilter])

  const tasks: DashTask[] = data?.tasks ?? []

  const projects = useMemo(() => {
    const map = new Map<number, string>()
    for (const t of tasks) if (t.project) map.set(t.project.id, t.project.name)
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [tasks])

  const users = useMemo(() => {
    const map = new Map<number, string>()
    for (const t of tasks) for (const u of t.assignees ?? []) map.set(u.id, u.name)
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [tasks])

  const filtered = useMemo(() => tasks.filter(t => {
    if (onlyLate && !t.is_late) return false
    if (projectId && t.project?.id !== projectId) return false
    if (userId && !t.assignees?.some(u => u.id === userId)) return false
    return true
  }), [tasks, onlyLate, projectId, userId])

  const grouped: Record<string, DashTask[]> = {}
  for (const t of filtered) {
    const col = t.stage?.name ?? 'Sin etapa'
    if (!grouped[col]) grouped[col] = []
    grouped[col].push(t)
  }
  const columns = Object.entries(grouped).slice(0, 6)

  if (isLoading) return <div className="p-8 text-sm text-gray-400 text-center">Cargando tareas de Odoo…</div>
  if (error) return <div className="p-8 text-sm text-red-500 text-center">Error al cargar tareas</div>

  const activeFilters = (onlyLate ? 1 : 0) + (projectId ? 1 : 0) + (userId ? 1 : 0)

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={projectId ?? ''}
          onChange={e => setProjectId(e.target.value ? Number(e.target.value) : null)}
          className="text-[12px] border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
          <option value="">Todos los proyectos</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <select
          value={userId ?? ''}
          onChange={e => setUserId(e.target.value ? Number(e.target.value) : null)}
          className="text-[12px] border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
          <option value="">Todos los colaboradores</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>

        <button
          onClick={() => setOnlyLate(v => !v)}
          className={`text-[12px] px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
            onlyLate
              ? 'bg-red-50 border-red-300 text-red-600 font-medium'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <i className="ti ti-clock-exclamation text-[13px]" aria-hidden="true" />
          Solo vencidas
        </button>

        {activeFilters > 0 && (
          <button
            onClick={() => { setOnlyLate(false); setProjectId(null); setUserId(null) }}
            className="text-[12px] text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            <i className="ti ti-x text-[11px]" aria-hidden="true" />
            Limpiar filtros ({activeFilters})
          </button>
        )}

        <span className="ml-auto text-[11px] text-gray-400">{filtered.length} tareas</span>
      </div>

      {/* Columns */}
      {columns.length === 0 ? (
        <div className="p-8 text-sm text-gray-400 text-center">No hay tareas con estos filtros</div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 flex-1">
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
      )}
    </div>
  )
}
