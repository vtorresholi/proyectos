'use client'

import useSWR from 'swr'
import { Avatar } from '@/components/ui/Avatar'
import { ProgressBar } from '@/components/ui/ProgressBar'
import type { DashUser } from '@/lib/odooModule'

const fetcher = (url: string) => fetch(url).then(r => r.json())

function MemberCard({ user }: { user: DashUser }) {
  const loadPct = user.planned_hours ? Math.min(100, Math.round((user.logged_hours / user.planned_hours) * 100)) : 0

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <Avatar name={user.name} size="lg" />
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-gray-900 truncate">{user.name}</p>
          <p className="text-[11px] text-gray-400 truncate">{user.email || user.login}</p>
        </div>
      </div>

      <div className="flex gap-4 mb-3">
        <div>
          <div className="text-[11px] text-gray-400">Tareas</div>
          <div className="text-[15px] font-medium text-gray-900">{user.task_count}</div>
        </div>
        <div>
          <div className="text-[11px] text-gray-400">Abiertas</div>
          <div className="text-[15px] font-medium text-gray-900">{user.open_tasks}</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
        <span>Horas registradas</span>
        <span>{Math.round(user.logged_hours)}h / {Math.round(user.planned_hours)}h</span>
      </div>
      <ProgressBar pct={loadPct} />
    </div>
  )
}

export function Team() {
  const { data, error, isLoading } = useSWR('/api/odoo/users', fetcher, { refreshInterval: 60000 })

  if (isLoading) return <div className="p-8 text-sm text-gray-400 text-center">Cargando equipo de Odoo…</div>
  if (error || data?.error) return <div className="p-8 text-sm text-red-500 text-center">Error: {data?.error ?? 'No se pudo conectar con Odoo'}</div>

  const users: DashUser[] = data?.users ?? []

  if (users.length === 0) {
    return <div className="p-8 text-sm text-gray-400 text-center">No hay miembros del equipo disponibles</div>
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {users.map(u => <MemberCard key={u.id} user={u} />)}
    </div>
  )
}
