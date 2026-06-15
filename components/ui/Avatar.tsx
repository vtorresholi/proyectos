'use client'

const COLORS = [
  'bg-purple-100 text-purple-800',
  'bg-teal-100 text-teal-800',
  'bg-amber-100 text-amber-800',
  'bg-pink-100 text-pink-800',
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
]

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function colorFor(name: string) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xfffffff
  return COLORS[h % COLORS.length]
}

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = { sm: 'w-6 h-6 text-[9px]', md: 'w-8 h-8 text-xs', lg: 'w-10 h-10 text-sm' }

export function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  return (
    <div
      className={`rounded-full flex items-center justify-center font-medium flex-shrink-0 ${sizes[size]} ${colorFor(name)} ${className}`}
      title={name}
    >
      {initials(name)}
    </div>
  )
}

export function AvatarGroup({ names, max = 3 }: { names: string[]; max?: number }) {
  const shown = names.slice(0, max)
  const extra = names.length - max
  return (
    <div className="flex items-center">
      {shown.map((n, i) => (
        <Avatar key={n} name={n} size="sm" className={i > 0 ? '-ml-1.5 ring-2 ring-white' : ''} />
      ))}
      {extra > 0 && (
        <span className="ml-1 text-[10px] text-gray-400">+{extra}</span>
      )}
    </div>
  )
}
