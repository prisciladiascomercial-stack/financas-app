'use client'
import { statusInfo } from '@/lib/utils'

export default function StatusBadge({ pago, venc, transportado, onClick }: { pago: boolean; venc: string | null; transportado?: boolean; onClick?: () => void }) {
  if (transportado && !pago) return <span className="badge badge-blue cursor-pointer" onClick={onClick}>Transportado</span>
  const { label, cls } = statusInfo(pago, venc)
  return <span className={`${cls} ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`} onClick={onClick}>{label}</span>
}
