'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Avatar } from '@/components/ui/Avatar'
import { PriorityDot } from '@/components/ui/Badge'
import type { DashTicket, DashConfig } from '@/lib/odooModule'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const PRIORITY_LEVEL: Record<string, 'high' | 'med' | 'low'> = {
  '0': 'low', '1': 'med', '2': 'high', '3': 'high',
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })
}

function StageSelect({ ticket, stages, onChanged }: {
  ticket: DashTicket
  stages: { id: number; name: string }[]
  onChanged: (id: number, stageId: number, stageName: string) => void
}) {
  const [saving, setSaving] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const stageId = Number(e.target.value)
    const stage = stages.find(s => s.id === stageId)
    if (!stage) return
    setSaving(true)
    try {
      const res = await fetch(`/api/odoo/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage_id: stageId }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? 'Error al actualizar')
      onChanged(ticket.id, stageId, stage.name)
    } catch {
      alert('No se pudo actualizar el estado en Odoo')
    } finally {
      setSaving(false)
    }
  }

  return (
    <select
      value={ticket.stage?.id ?? ''}
      onChange={handleChange}
      disabled={saving}
      className="text-[11px] border border-gray-200 rounded-md px-1.5 py-1 bg-white text-gray-700 disabled:opacity-50"
    >
      {!ticket.stage && <option value="">Sin etapa</option>}
      {stages.map(s => (
        <option key={s.id} value={s.id}>{s.name}</option>
      ))}
    </select>
  )
}

export function Tickets() {
  const { data, error, isLoading, mutate } = useSWR('/api/odoo/tickets', fetcher, { refreshInterval: 30000 })
  const { data: configData } = useSWR('/api/odoo/config', fetcher)

  if (isLoading) return <div className="p-8 text-sm text-gray-400 text-center">Cargando tickets de Odoo…</div>
  if (error || data?.error) return <div className="p-8 text-sm text-red-500 text-center">Error: {data?.error ?? 'No se pudo conectar con Odoo'}</div>

  const tickets: DashTicket[] = data?.tickets ?? []
  const config: DashConfig | undefined = configData
  const stages = config?.ticket_stages ?? []

  if (tickets.length === 0) {
    return (
      <div className="p-8 text-sm text-gray-400 text-center">
        No hay tickets disponibles (verifica que el módulo Helpdesk esté instalado en Odoo)
      </div>
    )
  }

  function handleStageChanged(id: number, stageId: number, stageName: string) {
    mutate(
      (current: { tickets: DashTicket[] } | undefined) => current && {
        ...current,
        tickets: current.tickets.map(t => t.id === id ? { ...t, stage: { id: stageId, name: stageName } } : t),
      },
      { revalidate: false }
    )
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="bg-gray-50 text-gray-400 text-[11px] uppercase tracking-wide">
            <th className="text-left font-medium px-3 py-2">ID</th>
            <th className="text-left font-medium px-3 py-2">Ticket</th>
            <th className="text-left font-medium px-3 py-2">Colaborador</th>
            <th className="text-left font-medium px-3 py-2">Fecha de creación</th>
            <th className="text-left font-medium px-3 py-2">Horas registradas</th>
            <th className="text-left font-medium px-3 py-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map(t => (
            <tr key={t.id} className="border-t border-gray-50 hover:bg-gray-50/50">
              <td className="px-3 py-2.5 text-gray-400">#{t.id}</td>
              <td className="px-3 py-2.5 max-w-xs">
                <div className="flex items-center gap-1.5">
                  <PriorityDot level={PRIORITY_LEVEL[t.priority] ?? 'low'} />
                  <span className="text-gray-900 font-medium truncate">{t.name}</span>
                </div>
              </td>
              <td className="px-3 py-2.5">
                {t.assignee ? (
                  <div className="flex items-center gap-1.5">
                    <Avatar name={t.assignee.name} size="sm" />
                    <span className="text-gray-600">{t.assignee.name}</span>
                  </div>
                ) : (
                  <span className="text-gray-300">Sin asignar</span>
                )}
              </td>
              <td className="px-3 py-2.5 text-gray-500">{fmtDate(t.create_date)}</td>
              <td className="px-3 py-2.5 text-gray-500">{t.hours_spent}h</td>
              <td className="px-3 py-2.5">
                {stages.length > 0 ? (
                  <StageSelect ticket={t} stages={stages} onChanged={handleStageChanged} />
                ) : (
                  <span className="text-gray-500">{t.stage?.name ?? '—'}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
