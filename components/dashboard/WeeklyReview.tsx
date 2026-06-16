'use client'

import useSWR from 'swr'
import { Avatar } from '@/components/ui/Avatar'
import { Badge, PriorityDot } from '@/components/ui/Badge'
import type { DashWeekly } from '@/lib/odooModule'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function WeeklyReview() {
  const { data, error, isLoading } = useSWR('/api/odoo/weekly', fetcher, { refreshInterval: 60000 })

  if (isLoading) return <div className="p-8 text-sm text-gray-400 text-center">Cargando revisión semanal…</div>
  if (error || data?.error) return <div className="p-8 text-sm text-red-500 text-center">Error: {data?.error ?? 'No se pudo conectar con Odoo'}</div>

  const weekly: DashWeekly | undefined = data
  const byUser = weekly?.by_user ?? []

  if (byUser.length === 0) {
    return <div className="p-8 text-sm text-gray-400 text-center">No hay tareas para esta semana</div>
  }

  return (
    <div>
      {weekly && (
        <p className="text-[11px] text-gray-400 mb-4">
          Semana del {new Date(weekly.date_from).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
          {' '}al {new Date(weekly.date_to).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        {byUser.map(u => {
          const totalHrs = u.tasks.reduce((a, t) => a + (t.planned_hours || 0), 0)
          return (
            <div key={u.user_id} className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Avatar name={u.user_name} size="md" />
                <div>
                  <p className="text-[13px] font-medium text-gray-900">{u.user_name}</p>
                  <p className="text-[11px] text-gray-400">{u.tasks.length} tareas · {Math.round(totalHrs)}h planificadas</p>
                </div>
              </div>

              {u.tasks.length === 0 && (
                <p className="text-[12px] text-gray-400">Sin tareas esta semana</p>
              )}

              {u.tasks.map(t => {
                const isLate = t.date_deadline ? new Date(t.date_deadline) < new Date() && t.kanban_state !== 'done' : false
                return (
                  <div key={t.id} className="flex items-center justify-between py-2 border-t border-gray-50">
                    <div className="flex items-center gap-2 min-w-0">
                      <PriorityDot level={t.priority === '1' ? 'high' : 'low'} />
                      <div className="min-w-0">
                        <p className="text-[12px] text-gray-900 truncate">{t.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{t.project?.name ?? ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {t.stage && <Badge label={t.stage.name} variant="default" />}
                      <span className={`text-[10px] ${isLate ? 'text-red-600' : 'text-gray-400'}`}>
                        {t.date_deadline
                          ? new Date(t.date_deadline).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })
                          : '—'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
