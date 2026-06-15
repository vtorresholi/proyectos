'use client'

import { SyncBadge } from '@/components/ui/Badge'

type View = 'overview' | 'kanban' | 'tickets' | 'team' | 'week' | 'new-task' | 'new-project' | 'sync'

interface SidebarProps {
  active: View
  onNav: (v: View) => void
  projects: Array<{ id: number; name: string; color: number }>
  synced: boolean
}

const COLOR_MAP: Record<number, string> = {
  0: 'bg-gray-400', 1: 'bg-red-400', 2: 'bg-orange-400', 3: 'bg-yellow-400',
  4: 'bg-green-500', 5: 'bg-teal-500', 6: 'bg-blue-400', 7: 'bg-purple-500',
  8: 'bg-pink-400', 9: 'bg-rose-400', 10: 'bg-indigo-400', 11: 'bg-cyan-400',
}

function Item({ label, icon, view, active, onClick, badge }: {
  label: string; icon: string; view: View; active: View
  onClick: (v: View) => void; badge?: number | string
}) {
  const isActive = active === view
  return (
    <button
      onClick={() => onClick(view)}
      className={`w-full flex items-center gap-2 px-4 py-1.5 text-[12px] text-left transition-colors
        ${isActive
          ? 'bg-gray-100 text-gray-900 font-medium border-r-2 border-purple-600'
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
    >
      <i className={`ti ${icon} text-[15px]`} aria-hidden="true" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <span className={`text-[10px] px-1.5 py-px rounded-full font-medium
          ${typeof badge === 'number' && badge > 0 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
          {badge}
        </span>
      )}
    </button>
  )
}

export function Sidebar({ active, onNav, projects, synced }: SidebarProps) {
  return (
    <aside className="flex flex-col bg-white border-r border-gray-100">
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-[13px] font-medium text-gray-900 flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${synced ? 'bg-teal-500' : 'bg-gray-300'}`} />
          ProjectOS
        </p>
        <SyncBadge live={synced} />
      </div>

      <nav className="flex-1 flex flex-col gap-px py-2">
        <Item label="Overview" icon="ti-layout-dashboard" view="overview" active={active} onClick={onNav} />
        <Item label="Kanban" icon="ti-layout-kanban" view="kanban" active={active} onClick={onNav} />
        <Item label="Tickets" icon="ti-ticket" view="tickets" active={active} onClick={onNav} badge={5} />
        <Item label="Equipo" icon="ti-users" view="team" active={active} onClick={onNav} />
        <Item label="Revisión semanal" icon="ti-calendar-week" view="week" active={active} onClick={onNav} />

        <div className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-widest text-gray-400">Crear</div>
        <Item label="Nueva tarea" icon="ti-plus" view="new-task" active={active} onClick={onNav} />
        <Item label="Nuevo proyecto" icon="ti-folder-plus" view="new-project" active={active} onClick={onNav} />

        <div className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-widest text-gray-400">Proyectos</div>
        {projects.map(p => (
          <button
            key={p.id}
            className="w-full flex items-center gap-2 px-4 py-1.5 text-[12px] text-left text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
          >
            <span className={`w-2 h-2 rounded-full ${COLOR_MAP[p.color] ?? 'bg-gray-400'}`} />
            <span className="truncate">{p.name}</span>
          </button>
        ))}

        <div className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-widest text-gray-400">Sistema</div>
        <Item label="Log de sync" icon="ti-refresh" view="sync" active={active} onClick={onNav} badge="12" />
      </nav>
    </aside>
  )
}
