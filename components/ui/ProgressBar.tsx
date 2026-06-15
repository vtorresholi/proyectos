'use client'

interface ProgressBarProps {
  pct: number
  color?: string
  showLabel?: boolean
}

function colorForPct(pct: number) {
  if (pct >= 75) return 'bg-purple-600'
  if (pct >= 40) return 'bg-teal-500'
  return 'bg-red-400'
}

export function ProgressBar({ pct, color, showLabel = false }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(pct)))
  const barColor = color ?? colorForPct(clamped)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-[11px] text-gray-400 w-8 text-right">{clamped}%</span>
      )}
    </div>
  )
}
