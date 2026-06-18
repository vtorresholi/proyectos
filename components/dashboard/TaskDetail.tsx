'use client'

import { useState } from 'react'
import useSWR from 'swr'
import type { DashTask, DashTimesheet } from '@/lib/odooModule'

const fetcher = (url: string) => fetch(url).then(r => r.json())

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDateTime(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const KANBAN_LABEL: Record<string, string> = {
  normal: 'En progreso', done: 'Listo', blocked: 'Bloqueado',
}
const KANBAN_COLOR: Record<string, string> = {
  normal: 'bg-blue-100 text-blue-700',
  done: 'bg-teal-100 text-teal-700',
  blocked: 'bg-red-100 text-red-700',
}

export function TaskDetail({ task, onClose }: { task: DashTask; onClose: () => void }) {
  const [tab, setTab] = useState<'info' | 'horas'>('info')

  const { data: tsData, isLoading: tsLoading } = useSWR(
    `/api/odoo/timesheets?task_id=${task.id}&limit=100`,
    fetcher
  )

  const timesheets: DashTimesheet[] = tsData?.timesheets ?? []
  const totalHours = timesheets.reduce((s, t) => s + t.hours, 0)
  const pctDone = task.planned_hours > 0
    ? Math.min(100, Math.round((task.effective_hours / task.planned_hours) * 100))
    : 0

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="w-[520px] h-full bg-white shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <div className="flex-1 min-w-0 pr-3">
            <div className="text-[11px] text-gray-400 mb-1">{task.project?.name ?? '—'}</div>
            <h2 className="text-[15px] font-semibold text-gray-900 leading-snug">{task.name}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 mt-0.5">
            <i className="ti ti-x text-[18px]" aria-hidden="true" />
          </button>
        </div>

        {/* Stage + kanban state */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-gray-50 bg-gray-50">
          <span className="text-[12px] font-medium text-gray-700 bg-white border border-gray-200 px-2.5 py-1 rounded-full">
            {task.stage?.name ?? 'Sin etapa'}
          </span>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${KANBAN_COLOR[task.kanban_state] ?? 'bg-gray-100 text-gray-500'}`}>
            {KANBAN_LABEL[task.kanban_state] ?? task.kanban_state}
          </span>
          {task.is_late && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-1">
              <i className="ti ti-clock-exclamation text-[12px]" aria-hidden="true" />
              Vencida
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {(['info', 'horas'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-[12px] font-medium border-b-2 transition-colors ${
                tab === t ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {t === 'info' ? 'Información' : `Registro de horas${timesheets.length > 0 ? ` (${timesheets.length})` : ''}`}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'info' && (
            <div className="space-y-4">
              {/* Key fields grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Asignado a</div>
                  <div className="text-[13px] text-gray-800">
                    {task.assignees?.length ? task.assignees.map(u => u.name).join(', ') : '—'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Prioridad</div>
                  <div className="text-[13px] text-gray-800">{task.priority === '1' ? '⚑ Alta' : 'Normal'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Fecha límite</div>
                  <div className={`text-[13px] ${task.is_late ? 'text-red-600 font-medium' : 'text-gray-800'}`}>
                    {fmtDate(task.date_deadline)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Creada</div>
                  <div className="text-[13px] text-gray-800">{fmtDate(task.create_date)}</div>
                </div>
              </div>

              {/* Hours */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide">Tiempo asignado</div>
                  <span className="text-[11px] text-gray-500">{pctDone}%</span>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[13px] font-medium text-gray-900">
                    {task.planned_hours > 0 ? `${task.planned_hours}h` : '—'}
                  </span>
                  <span className="text-[11px] text-gray-400">planificadas</span>
                  <span className="text-[13px] font-medium text-gray-900 ml-auto">
                    {Math.round(task.effective_hours * 10) / 10}h
                  </span>
                  <span className="text-[11px] text-gray-400">registradas</span>
                </div>
                {task.planned_hours > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${pctDone > 100 ? 'bg-red-500' : 'bg-indigo-500'}`}
                      style={{ width: `${Math.min(pctDone, 100)}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Tags */}
              {task.tags?.length > 0 && (
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Etiquetas</div>
                  <div className="flex flex-wrap gap-1.5">
                    {task.tags.map(tag => (
                      <span key={tag.id} className="text-[11px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {task.description && (
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Descripción</div>
                  <div
                    className="text-[13px] text-gray-700 leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: task.description }}
                  />
                </div>
              )}
            </div>
          )}

          {tab === 'horas' && (
            <div>
              {tsLoading ? (
                <div className="text-[12px] text-gray-400 text-center py-8">Cargando registros…</div>
              ) : timesheets.length === 0 ? (
                <div className="text-[12px] text-gray-400 text-center py-8">Sin registros de horas para esta tarea</div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[12px] text-gray-500">{timesheets.length} registros</span>
                    <span className="text-[13px] font-semibold text-gray-900">
                      Total: {Math.round(totalHours * 10) / 10}h
                    </span>
                  </div>
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="text-gray-400 text-[11px] uppercase tracking-wide border-b border-gray-100">
                        <th className="text-left font-medium pb-2">Fecha</th>
                        <th className="text-left font-medium pb-2">Colaborador</th>
                        <th className="text-left font-medium pb-2">Descripción</th>
                        <th className="text-right font-medium pb-2">Horas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {timesheets.map(t => (
                        <tr key={t.id}>
                          <td className="py-2 text-gray-500 whitespace-nowrap">{fmtDate(t.date)}</td>
                          <td className="py-2 text-gray-700">{t.user?.name ?? '—'}</td>
                          <td className="py-2 text-gray-500 max-w-[140px] truncate">{t.description || '—'}</td>
                          <td className="py-2 text-right font-medium text-gray-900">{t.hours}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
