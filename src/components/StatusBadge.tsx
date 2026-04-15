import { statusLabel } from '@/lib/utils'

interface Props {
  pago: boolean
  venc: string | null
  transportado?: boolean
  onClick?: () => void
}

export default function StatusBadge({ pago, venc, transportado, onClick }: Props) {
  if (transportado && !pago) {
    return <span className="badge bg-blue-50 text-blue-700 cursor-pointer" onClick={onClick}>Transportado</span>
  }
  const { label, color } = statusLabel(pago, venc)
  const cls: Record<string, string> = {
    green: 'badge-green', red: 'badge-red', yellow: 'badge-yellow',
    gray: 'badge-gray', orange: 'badge-orange', blue: 'badge-blue'
  }
  return (
    <span className={`${cls[color] || 'badge-gray'} ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`} onClick={onClick}>
      {label}
    </span>
  )
}
