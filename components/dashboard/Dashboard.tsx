'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Sidebar } from './Sidebar'
import { Overview } from './Overview'
import { Kanban } from './Kanban'
import { Tickets } from './Tickets'
import { Team } from './Team'
import { WeeklyReview } from './WeeklyReview'
import { NewTaskForm } from './NewTaskForm'
import { NewProjectForm } from './NewProjectForm'
import { SyncLog } from './SyncLog'

type View = 'overview' | 'kanban' | 'tickets' | 'team' | 'week' | 'new-task' | 'new-project' | 'sync'

const TITLES: Record<View, string> = {
  overview: 'Overview de proyectos',
  kanban: 'Kanban de tareas',
  tickets: 'Tickets de soporte',
  team: 'Equipo',
  week: 'Revisión semanal',
  'new-task': 'Nueva tarea',
  'new-project': 'Nuevo proyecto',
  sync: 'Log de sincronización',
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function Dashboard() {
  const [view, setView] = useState<View>('overview')
  const [toast, setToast] = useState('')

  const { data: projectData, error: projError } = useSWR('/api/odoo/projects', fetcher, { refreshInterval: 60000 })

  const projects = projectData?.projects ?? []
  const synced = !projError && !!projectData

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 4000)
  }

  return (
    <div className="grid h-screen" style={{ gridTemplateColumns: '200px 1fr' }}>
      <Sidebar
        active={view}
        onNav={setView}
        projects={projects}
        synced={synced}
      />

      <div className="flex flex-col min-w-0 bg-gray-50">
        <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100">
          <h1 className="text-[14px] font-medium text-gray-900">{TITLES[view]}</h1>
          <div className="flex items-center gap-2">
            {synced && (
              <span className="flex items-center gap-1.5 text-[11px] text-teal-700 border border-teal-200 bg-teal-50 px-2.5 py-1 rounded-full">
                <i className="ti ti-bolt text-[13px]" aria-hidden="true" />
                Odoo live
              </span>
            )}
            <button
              onClick={() => setView('new-task')}
              className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors"
            >
              <i className="ti ti-plus text-[14px]" aria-hidden="true" />
              Nueva tarea
            </button>
            <button
              onClick={() => setView('new-project')}
              className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <i className="ti ti-folder-plus text-[14px]" aria-hidden="true" />
              Proyecto
            </button>
          </div>
        </header>

        {toast && (
          <div className="mx-5 mt-3 flex items-center gap-2 px-3 py-2 bg-teal-50 border border-teal-200 text-teal-700 text-[12px] rounded-lg">
            <i className="ti ti-check text-[14px]" aria-hidden="true" />
            {toast}
          </div>
        )}

        <main className="flex-1 overflow-auto p-5">
          {view === 'overview' && <Overview />}
          {view === 'kanban' && <Kanban />}
          {view === 'new-task' && (
            <NewTaskForm
              onSuccess={() => { setView('kanban'); showToast('Tarea creada y enviada a Odoo 18') }}
              onCancel={() => setView('overview')}
            />
          )}
          {view === 'new-project' && (
            <NewProjectForm
              onSuccess={() => { setView('overview'); showToast('Proyecto creado y sincronizado con Odoo 18') }}
              onCancel={() => setView('overview')}
            />
          )}
          {view === 'sync' && <SyncLog />}
          {view === 'tickets' && <Tickets />}
          {view === 'team' && <Team />}
          {view === 'week' && <WeeklyReview />}
        </main>
      </div>
    </div>
  )
}
