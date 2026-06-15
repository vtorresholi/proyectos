'use client'

type Variant = 'active' | 'review' | 'risk' | 'done' | 'bug' | 'feat' | 'task' | 'imp' | 'default'

const styles: Record<Variant, string> = {
  active:  'bg-teal-50 text-teal-800 border border-teal-200',
  review:  'bg-amber-50 text-amber-800 border border-amber-200',
  risk:    'bg-red-50 text-red-800 border border-red-200',
  done:    'bg-gray-50 text-gray-500 border border-gray-200',
  bug:     'bg-red-50 text-red-800 border border-red-200',
  feat:    'bg-blue-50 text-blue-800 border border-blue-200',
  task:    'bg-purple-50 text-purple-800 border border-purple-200',
  imp:     'bg-green-50 text-green-800 border border-green-200',
  default: 'bg-gray-50 text-gray-600 border border-gray-200',
}

export function Badge({ label, variant = 'default' }: { label: string; variant?: Variant }) {
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${styles[variant]}`}>
      {label}
    </span>
  )
}

export function SyncBadge({ live }: { live: boolean }) {
  return (
    <span className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border ${
      live ? 'text-teal-700 border-teal-200 bg-teal-50' : 'text-gray-400 border-gray-200'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${live ? 'bg-teal-500 animate-pulse' : 'bg-gray-300'}`} />
      {live ? 'Odoo live' : 'Desconectado'}
    </span>
  )
}

export function PriorityDot({ level }: { level: '0' | '1' | 'high' | 'med' | 'low' }) {
  const color = level === '1' || level === 'high'
    ? 'bg-red-500'
    : level === 'med'
    ? 'bg-amber-400'
    : 'bg-green-500'
  return <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />
}
