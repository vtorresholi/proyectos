'use client'

import { useEffect, useState } from 'react'

interface LogEntry {
  id: number
  type: 'pull' | 'push' | 'ok' | 'warn'
  text: string
  time: string
}

const COLORS = {
  pull: 'bg-blue-400',
  push: 'bg-purple-500',
  ok: 'bg-teal-500',
  warn: 'bg-amber-400',
}

const INITIAL: LogEntry[] = [
  { id: 1, type: 'ok', text: 'Conexión establecida con Odoo 18 Enterprise', time: 'hace 1 min' },
  { id: 2, type: 'pull', text: 'Proyectos sincronizados desde Odoo', time: 'hace 1 min' },
  { id: 3, type: 'pull', text: 'Tareas sincronizadas desde Odoo', time: 'hace 1 min' },
  { id: 4, type: 'pull', text: 'Usuarios sincronizados desde Odoo', time: 'hace 1 min' },
]

export function SyncLog({ events }: { events?: LogEntry[] }) {
  const [log, setLog] = useState<LogEntry[]>(events ?? INITIAL)
  const [lastSync, setLastSync] = useState(new Date())
  const [countdown, setCountdown] = useState(60)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          setLastSync(new Date())
          setLog(prev => [
            { id: Date.now(), type: 'pull', text: 'Polling Odoo — sin cambios nuevos', time: 'ahora' },
            ...prev.slice(0, 19),
          ])
          return 60
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div>
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Método', value: 'Polling 60s', sub: 'Odoo JSON-RPC', subColor: 'text-teal-600' },
          { label: 'Última sync', value: lastSync.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }), sub: `Próxima en ${countdown}s` },
          { label: 'Eventos hoy', value: log.length, sub: `${log.filter(l => l.type === 'push').length} push · ${log.filter(l => l.type === 'pull').length} pull` },
          { label: 'Conflictos', value: '0', sub: 'Odoo siempre gana', subColor: 'text-teal-600' },
        ].map(m => (
          <div key={m.label} className="bg-gray-50 rounded-lg p-3">
            <div className="text-[11px] text-gray-400 mb-1">{m.label}</div>
            <div className="text-[18px] font-medium text-gray-900">{m.value}</div>
            {m.sub && <div className={`text-[11px] mt-1 ${m.subColor ?? 'text-gray-400'}`}>{m.sub}</div>}
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <div className="text-[12px] font-medium text-gray-700 mb-3 flex items-center gap-2">
          <i className="ti ti-history text-[15px]" aria-hidden="true" />
          Eventos recientes
        </div>
        <div className="flex flex-col">
          {log.slice(0, 15).map(entry => (
            <div key={entry.id} className="flex items-start gap-2.5 py-2 border-b border-gray-50 last:border-0">
              <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${COLORS[entry.type]}`} />
              <div>
                <p className="text-[11px] text-gray-600">{entry.text}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{entry.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
        <p className="text-[11px] text-blue-700">
          Para sync en tiempo real real, activa webhooks en Odoo: <strong>Configuración → Técnico → Webhooks</strong> — apunta a <code className="text-[10px]">/api/odoo/webhook</code>
        </p>
      </div>
    </div>
  )
}
