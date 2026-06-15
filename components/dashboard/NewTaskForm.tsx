'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { mutate } from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Props {
  onSuccess: () => void
  onCancel: () => void
}

export function NewTaskForm({ onSuccess, onCancel }: Props) {
  const { data: projectData } = useSWR('/api/odoo/projects', fetcher)
  const { data: userData } = useSWR('/api/odoo/users', fetcher)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const projects = projectData?.projects ?? []
  const users = userData?.users ?? []

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const fd = new FormData(e.currentTarget)

    const body = {
      name: fd.get('name'),
      project_id: fd.get('project_id') ? Number(fd.get('project_id')) : false,
      user_ids: fd.get('user_id') ? [Number(fd.get('user_id'))] : [],
      date_deadline: fd.get('date_deadline') || false,
      planned_hours: fd.get('planned_hours') ? Number(fd.get('planned_hours')) : 0,
      priority: fd.get('priority') as string,
      description: fd.get('description') || false,
    }

    try {
      const res = await fetch('/api/odoo/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      mutate('/api/odoo/tasks')
      onSuccess()
    } catch (err: unknown) {
      setError(String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-[14px] font-medium text-gray-900">Nueva tarea</h2>
        <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 px-2 py-px rounded-full">se guardará en Odoo 18</span>
      </div>
      <p className="text-[11px] text-gray-400 mb-4">La tarea se crea en <code className="text-[10px]">project.task</code> de Odoo al guardar.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="block text-[11px] text-gray-500 mb-1">Título de la tarea *</label>
          <input name="name" required placeholder="Ej: Implementar módulo de facturación" className="w-full text-[13px]" />
        </div>
        <div>
          <label className="block text-[11px] text-gray-500 mb-1">Descripción</label>
          <textarea name="description" rows={3} placeholder="Contexto, criterios de aceptación…" className="w-full text-[13px] resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Proyecto</label>
            <select name="project_id" className="w-full text-[13px]">
              <option value="">Sin proyecto</option>
              {projects.map((p: { id: number; name: string }) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Asignar a</label>
            <select name="user_id" className="w-full text-[13px]">
              <option value="">Sin asignar</option>
              {users.map((u: { id: number; name: string }) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Fecha límite</label>
            <input name="date_deadline" type="date" className="w-full text-[13px]" />
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Horas estimadas</label>
            <input name="planned_hours" type="number" min="0" step="0.5" placeholder="0" className="w-full text-[13px]" />
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Prioridad</label>
            <select name="priority" className="w-full text-[13px]">
              <option value="0">Normal</option>
              <option value="1">Alta</option>
            </select>
          </div>
        </div>

        {error && <p className="text-[12px] text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button type="button" onClick={onCancel} className="text-[12px] px-4 py-1.5">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="text-[12px] px-4 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Guardando…' : 'Guardar y enviar a Odoo'}
          </button>
        </div>
      </form>
    </div>
  )
}
