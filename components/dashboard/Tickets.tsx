'use client'

import useSWR from 'swr'
import { Avatar } from '@/components/ui/Avatar'
import { Badge, PriorityDot } from '@/components/ui/Badge'
import type { DashTicket } from '@/lib/odooModule'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const PRIORITY_LEVEL: Record<string, 'high' | 'med' | 'low'> = {
  '0': 'low', '1': 'med', '2': 'high', '3': 'high',
}

function TicketRow({ ticket }: { ticket: DashTicket }) {
  const isClosed = !!ticket.close_date
  const overdue = ticket.sla_deadline && !isClosed && new Date(ticket.sla_deadline) < new Date()

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-3 mb-2 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <PriorityDot level={PRIORITY_LEVEL[ticket.priority] ?? 'low'} />
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-gray-900 truncate">{ticket.name}</p>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
              {ticket.client && <span>{ticket.client.name}</span>}
              {ticket.team && <span>· {ticket.team.name}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {ticket.stage && (
            <Badge label={ticket.stage.name} variant={isClosed ? 'done' : 'active'} />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-gray-50">
        <span className={`text-[10px] flex items-center gap-1 ${overdue ? 'text-red-600' : 'text-gray-400'}`}>
          <i className="ti ti-clock text-[11px]" aria-hidden="true" />
          {ticket.sla_deadline
            ? `SLA: ${new Date(ticket.sla_deadline).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}`
            : new Date(ticket.create_date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
        </span>
        {ticket.assignee && <Avatar name={ticket.assignee.name} size="sm" />}
      </div>
    </div>
  )
}

export function Tickets() {
  const { data, error, isLoading } = useSWR('/api/odoo/tickets', fetcher, { refreshInterval: 30000 })

  if (isLoading) return <div className="p-8 text-sm text-gray-400 text-center">Cargando tickets de Odoo…</div>
  if (error || data?.error) return <div className="p-8 text-sm text-red-500 text-center">Error: {data?.error ?? 'No se pudo conectar con Odoo'}</div>

  const tickets: DashTicket[] = data?.tickets ?? []

  if (tickets.length === 0) {
    return (
      <div className="p-8 text-sm text-gray-400 text-center">
        No hay tickets disponibles (verifica que el módulo Helpdesk esté instalado en Odoo)
      </div>
    )
  }

  const open = tickets.filter(t => !t.close_date)
  const closed = tickets.filter(t => !!t.close_date)

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-[11px] text-gray-400 mb-1">Total</div>
          <div className="text-2xl font-medium text-gray-900">{tickets.length}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-[11px] text-gray-400 mb-1">Abiertos</div>
          <div className="text-2xl font-medium text-gray-900">{open.length}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-[11px] text-gray-400 mb-1">Cerrados</div>
          <div className="text-2xl font-medium text-gray-900">{closed.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] font-medium text-gray-500 mb-2 uppercase tracking-wide">Abiertos</p>
          {open.length === 0 && <p className="text-[12px] text-gray-400">Sin tickets abiertos</p>}
          {open.map(t => <TicketRow key={t.id} ticket={t} />)}
        </div>
        <div>
          <p className="text-[11px] font-medium text-gray-500 mb-2 uppercase tracking-wide">Cerrados</p>
          {closed.length === 0 && <p className="text-[12px] text-gray-400">Sin tickets cerrados</p>}
          {closed.map(t => <TicketRow key={t.id} ticket={t} />)}
        </div>
      </div>
    </div>
  )
}
