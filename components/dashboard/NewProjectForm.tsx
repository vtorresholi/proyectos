'use client'

import { useState } from 'react'
import { mutate } from 'swr'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Props {
  onSuccess: () => void
  onCancel: () => void
}

export function NewProjectForm({ onSuccess, onCancel }: Props) {
  const { data: userData } = useSWR('/api/odoo/users', fetcher)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const users = userData?.users ?? []

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const fd = new FormData(e.currentTarget)

    const body = {
      name: fd.get('name'),
      date_start: fd.get('date_start') || false,
      date: fd.get('date') || false,
      user_id: fd.get('user_id') ? Number(fd.get('user_id')) : false,
      allocated_hours: fd.get('allocated_hours') ? Number(fd.get('allocated_hours')) : 0,
    }

    try {
      const res = await fetch('/api/odoo/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      mutate('/api/odoo/projects')
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
        <h2 className="text-[14px] font-medium text-gray-900">Nuevo proyecto</h2>
        <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 px-2 py-px rounded-full">se creará en Odoo 18</span>
      </div>
      <p className="text-[11px] text-gray-400 mb-4">El proyecto se crea en <code className="text-[10px]">project.project</code> y queda disponible para todo el equipo.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="block text-[11px] text-gray-500 mb-1">Nombre del proyecto *</label>
          <input name="name" required placeholder="Ej: Rediseño plataforma logística" className="w-full text-[13px]" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Fecha inicio</label>
            <input name="date_start" type="date" className="w-full text-[13px]" />
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Fecha entrega</label>
            <input name="date" type="date" className="w-full text-[13px]" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Responsable</label>
            <select name="user_id" className="w-full text-[13px]">
              <option value="">Sin asignar</option>
              {users.map((u: { id: number; name: string }) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Presupuesto (horas)</label>
            <input name="allocated_hours" type="number" min="0" step="1" placeholder="0" className="w-full text-[13px]" />
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
            {saving ? 'Creando…' : 'Crear proyecto en Odoo'}
          </button>
        </div>
      </form>
    </div>
  )
}
