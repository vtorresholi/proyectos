'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui/Badge'
import { AvatarGroup } from '@/components/ui/Avatar'
import type { DashProject, DashTask, DashUser, DashTimesheet } from '@/lib/odooModule'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const COLORS = ['#6366F1','#EC4899','#14B8A6','#F59E0B','#3B82F6','#10B981','#8B5CF6','#F97316','#06B6D4']

// ─── helpers ──────────────────────────────────────────────────────────────────

function pct(p: DashProject) {
  if (!p.allocated_hours) return p.pct_complete ?? 0
  return Math.min(100, Math.round((p.effective_hours / p.allocated_hours) * 100))
}

function statusFor(p: DashProject): 'active' | 'review' | 'risk' | 'done' {
  const s = p.status
  if (s === 'on_track') return 'active'
  if (s === 'at_risk' || s === 'off_track') return 'risk'
  if (s === 'done') return 'done'
  return 'review'
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Activo', review: 'En revisión', risk: 'En riesgo', done: 'Completado',
}

function deviationColor(d: number) {
  if (d <= 0) return 'text-teal-600'
  if (d <= 20) return 'text-amber-500'
  return 'text-red-500'
}

function deviationBadge(d: number) {
  if (d <= 0) return 'bg-teal-100 text-teal-700'
  if (d <= 20) return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}

// ─── Donut SVG ────────────────────────────────────────────────────────────────

interface SliceData { value: number; color: string; label: string }

function arcPath(cx: number, cy: number, r: number, ir: number, a1: number, a2: number) {
  const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1)
  const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2)
  const ix1 = cx + ir * Math.cos(a2), iy1 = cy + ir * Math.sin(a2)
  const ix2 = cx + ir * Math.cos(a1), iy2 = cy + ir * Math.sin(a1)
  const lg = a2 - a1 > Math.PI ? 1 : 0
  return `M${x1} ${y1} A${r} ${r} 0 ${lg} 1 ${x2} ${y2} L${ix1} ${iy1} A${ir} ${ir} 0 ${lg} 0 ${ix2} ${iy2}Z`
}

function DonutChart({ data, total }: { data: SliceData[]; total: number }) {
  const slices = useMemo(() => {
    const sum = data.reduce((s, d) => s + d.value, 0)
    if (!sum) return []
    let angle = -Math.PI / 2
    return data.map(d => {
      const sweep = (d.value / sum) * 2 * Math.PI
      const start = angle
      angle += sweep
      return { ...d, path: arcPath(100, 100, 78, 50, start, angle), pct: Math.round((d.value / sum) * 100) }
    })
  }, [data])

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 200 200" className="w-40 h-40 shrink-0">
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} className="hover:opacity-80 transition-opacity" />
        ))}
        <text x="100" y="96" textAnchor="middle" fill="#9CA3AF" fontSize="11">Total</text>
        <text x="100" y="116" textAnchor="middle" fill="#111827" fontSize="22" fontWeight="600">{total}</text>
      </svg>
      <div className="space-y-1.5 min-w-0 flex-1">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-[12px]">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-gray-700 truncate">{s.label}</span>
            <span className="text-gray-400 ml-auto pl-1 shrink-0">{s.value} · {s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── date presets ─────────────────────────────────────────────────────────────

type Preset = 'week' | 'month' | 'year' | 'all'

function getRange(preset: Preset): { date_from: string; date_to: string } | null {
  if (preset === 'all') return null
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  if (preset === 'week') {
    const day = now.getDay()
    const mon = new Date(now); mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
    return { date_from: fmt(mon), date_to: fmt(now) }
  }
  if (preset === 'month') {
    return { date_from: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`, date_to: fmt(now) }
  }
  return { date_from: `${now.getFullYear()}-01-01`, date_to: fmt(now) }
}

// ─── CollaboratorHours ────────────────────────────────────────────────────────

function CollaboratorHours() {
  const [preset, setPreset] = useState<Preset>('month')
  const range = useMemo(() => getRange(preset), [preset])

  const tsUrl = range
    ? `/api/odoo/timesheets?date_from=${range.date_from}&date_to=${range.date_to}&limit=500`
    : null
  const { data: tsData, isLoading: tsLoading } = useSWR(tsUrl, fetcher, { refreshInterval: 60000 })
  const { data: usersData, isLoading: usersLoading } = useSWR('/api/odoo/users', fetcher, { refreshInterval: 60000 })

  const hoursByUser = useMemo(() => {
    if (preset === 'all') {
      const users: DashUser[] = usersData?.users ?? []
      return users
        .filter(u => u.logged_hours > 0)
        .map(u => ({ name: u.name, hours: Math.round(u.logged_hours * 10) / 10 }))
        .sort((a, b) => b.hours - a.hours)
    }
    const tss: DashTimesheet[] = tsData?.timesheets ?? []
    const map = new Map<string, number>()
    for (const t of tss) {
      if (t.user) map.set(t.user.name, (map.get(t.user.name) ?? 0) + t.hours)
    }
    return Array.from(map.entries())
      .map(([name, hours]) => ({ name, hours: Math.round(hours * 10) / 10 }))
      .filter(u => u.hours > 0)
      .sort((a, b) => b.hours - a.hours)
  }, [preset, tsData, usersData])

  const maxH = Math.max(...hoursByUser.map(u => u.hours), 1)
  const loading = preset === 'all' ? usersLoading : tsLoading

  const PRESET_LABELS: Record<Preset, string> = {
    week: 'Esta semana', month: 'Este mes', year: 'Este año', all: 'Todo',
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold text-gray-700">Horas por colaborador</h3>
        <div className="flex gap-1">
          {(['week', 'month', 'year', 'all'] as Preset[]).map(p => (
            <button key={p} onClick={() => setPreset(p)}
              className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${
                preset === p ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}>
              {PRESET_LABELS[p]}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="text-[12px] text-gray-400 text-center py-6">Cargando…</div>
      ) : hoursByUser.length === 0 ? (
        <div className="text-[12px] text-gray-400 text-center py-6">Sin registros en este período</div>
      ) : (
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          {hoursByUser.map((u, i) => (
            <div key={u.name} className="flex items-center gap-3">
              <div className="w-28 text-[12px] text-gray-700 truncate shrink-0">{u.name}</div>
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div className="h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(u.hours / maxH) * 100}%`, background: COLORS[i % COLORS.length] }} />
              </div>
              <div className="text-[12px] text-gray-500 w-12 text-right shrink-0">{u.hours}h</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── MetricCard ────────────────────────────────────────────────────────────────

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

// ─── Overview ─────────────────────────────────────────────────────────────────

export function Overview() {
  const { data, error, isLoading } = useSWR('/api/odoo/projects', fetcher, { refreshInterval: 60000 })
  const { data: taskData } = useSWR('/api/odoo/tasks', fetcher, { refreshInterval: 60000 })

  if (isLoading) return <div className="p-8 text-sm text-gray-400 text-center">Cargando proyectos de Odoo…</div>
  if (error || data?.error) return <div className="p-8 text-sm text-red-500 text-center">Error: {data?.error ?? 'No se pudo conectar con Odoo'}</div>

  const projects: DashProject[] = data?.projects ?? []
  const tasks: DashTask[] = taskData?.tasks ?? []

  const totalAllocated = projects.reduce((a, p) => a + (p.allocated_hours || 0), 0)
  const totalEffective = projects.reduce((a, p) => a + (p.effective_hours || 0), 0)
  const completedTasks = tasks.filter(t => t.kanban_state === 'done').length
  const globalDev = totalAllocated > 0
    ? Math.round(((totalEffective - totalAllocated) / totalAllocated) * 100)
    : 0
  const totalTasks = projects.reduce((a, p) => a + p.task_count, 0)

  const taskDist: SliceData[] = projects
    .filter(p => p.task_count > 0)
    .map((p, i) => ({ value: p.task_count, color: COLORS[i % COLORS.length], label: p.name }))

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3">
        <MetricCard
          label="Proyectos activos"
          value={projects.length}
          sub={`${projects.filter(p => statusFor(p) === 'active').length} en track`}
          subColor="text-teal-600"
        />
        <MetricCard
          label="Tareas totales"
          value={tasks.length}
          sub={`${tasks.filter(t => t.is_late).length} vencidas`}
          subColor="text-amber-600"
        />
        <MetricCard
          label="Completadas"
          value={tasks.length ? `${Math.round((completedTasks / tasks.length) * 100)}%` : '—'}
          sub={`${completedTasks} de ${tasks.length}`}
        />
        <MetricCard
          label="Horas registradas"
          value={`${Math.round(totalEffective)}h`}
          sub={`de ${Math.round(totalAllocated)}h asignadas`}
        />
      </div>

      {/* Eficiencia + Distribución */}
      <div className="grid grid-cols-2 gap-4">
        {/* Eficiencia de horas */}
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <h3 className="text-[13px] font-semibold text-gray-700 mb-3">Eficiencia de horas</h3>

          {/* Global KPI */}
          <div className="flex items-center justify-between gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wide">Asignadas</div>
              <div className="text-xl font-semibold text-gray-900">{Math.round(totalAllocated)}h</div>
            </div>
            <div className="flex-1 border-t border-dashed border-gray-300" />
            <div className="text-center">
              <div className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wide">Reales</div>
              <div className="text-xl font-semibold text-gray-900">{Math.round(totalEffective)}h</div>
            </div>
            <div className="flex-1 border-t border-dashed border-gray-300" />
            <div className="text-center">
              <div className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wide">Desviación</div>
              <div className={`text-xl font-semibold ${deviationColor(globalDev)}`}>
                {globalDev > 0 ? '+' : ''}{globalDev}%
              </div>
            </div>
          </div>

          {/* Per-project table */}
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-gray-400 text-[11px] uppercase tracking-wide">
                <th className="text-left font-medium pb-2">Proyecto</th>
                <th className="text-right font-medium pb-2">Asig.</th>
                <th className="text-right font-medium pb-2">Real</th>
                <th className="text-right font-medium pb-2">Desv.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {projects.map((p, i) => {
                const dev = p.allocated_hours > 0
                  ? Math.round(((p.effective_hours - p.allocated_hours) / p.allocated_hours) * 100)
                  : 0
                return (
                  <tr key={p.id}>
                    <td className="py-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-gray-700 truncate max-w-[110px]">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-1.5 text-right text-gray-500">{Math.round(p.allocated_hours || 0)}h</td>
                    <td className="py-1.5 text-right text-gray-500">{Math.round(p.effective_hours || 0)}h</td>
                    <td className="py-1.5 text-right">
                      {p.allocated_hours > 0 ? (
                        <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${deviationBadge(dev)}`}>
                          {dev > 0 ? '+' : ''}{dev}%
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Distribución de tareas */}
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <h3 className="text-[13px] font-semibold text-gray-700 mb-3">Distribución de tareas por proyecto</h3>
          {taskDist.length > 0 ? (
            <div className="space-y-4">
              <DonutChart data={taskDist} total={totalTasks} />
              <div className="space-y-2">
                {taskDist.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-500 w-28 truncate shrink-0">{d.label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full"
                        style={{ width: `${(d.value / totalTasks) * 100}%`, background: d.color }} />
                    </div>
                    <span className="text-[11px] text-gray-400 w-8 text-right shrink-0">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-[12px] text-gray-400 text-center py-8">Sin tareas registradas</div>
          )}
        </div>
      </div>

      {/* Horas por colaborador */}
      <CollaboratorHours />

      {/* Project cards */}
      <div className="grid grid-cols-2 gap-3">
        {projects.map(p => {
          const progress = pct(p)
          const status = statusFor(p)
          const memberNames = p.members?.length
            ? p.members.map(m => m.name)
            : p.responsible ? [p.responsible.name] : []
          return (
            <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2.5">
                <div>
                  <p className="text-[13px] font-medium text-gray-900">{p.name}</p>
                  {p.client && <p className="text-[11px] text-gray-400 mt-0.5">Cliente: {p.client.name}</p>}
                </div>
                <Badge label={STATUS_LABEL[status]} variant={status} />
              </div>
              <ProgressBar pct={progress} showLabel />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-gray-400">
                  Entrega: {p.date
                    ? new Date(p.date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })
                    : '—'}
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
