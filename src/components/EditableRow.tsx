'use client'
import { useState } from 'react'
import { Check, X, Pencil, Trash2 } from 'lucide-react'
import StatusBadge from './StatusBadge'
import { fmt, fmtDateShort } from '@/lib/utils'

interface Col {
  key: string
  label: string
  type?: 'text' | 'number' | 'date' | 'select'
  options?: string[]
  width?: string
  render?: (v: any, row: any) => React.ReactNode
}

interface Props {
  row: Record<string, any>
  cols: Col[]
  onSave: (updated: Record<string, any>) => void
  onDelete: () => void
  onTogglePago?: () => void
  showObs?: boolean
}

export default function EditableRow({ row, cols, onSave, onDelete, onTogglePago, showObs }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Record<string, any>>(row)
  const [showObsRow, setShowObsRow] = useState(false)

  function save() {
    onSave(draft)
    setEditing(false)
  }
  function cancel() {
    setDraft(row)
    setEditing(false)
  }

  if (editing) {
    return (
      <>
        <tr className="bg-blue-50">
          {cols.map(col => (
            <td key={col.key} className="px-3 py-2">
              {col.type === 'select' && col.options ? (
                <select className="input text-xs py-1"
                  value={draft[col.key] || ''}
                  onChange={e => setDraft(d => ({...d, [col.key]: e.target.value}))}>
                  {col.options.map(o => <option key={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  type={col.type || 'text'}
                  className="input text-xs py-1"
                  value={draft[col.key] || ''}
                  onChange={e => setDraft(d => ({...d, [col.key]: e.target.value}))}
                />
              )}
            </td>
          ))}
          <td className="px-3 py-2">
            <div className="flex gap-1">
              <button onClick={save} className="p-1 text-green-600 hover:bg-green-100 rounded"><Check size={14}/></button>
              <button onClick={cancel} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={14}/></button>
            </div>
          </td>
        </tr>
        {showObs && (
          <tr className="bg-blue-50">
            <td colSpan={cols.length + 1} className="px-3 pb-2">
              <input
                type="text"
                className="input text-xs py-1"
                placeholder="Observação..."
                value={draft.observacao || ''}
                onChange={e => setDraft(d => ({...d, observacao: e.target.value}))}
              />
            </td>
          </tr>
        )}
      </>
    )
  }

  return (
    <>
      <tr className="hover:bg-gray-50 group">
        {cols.map(col => (
          <td key={col.key} className="table-td" style={{maxWidth: col.width || '140px'}}>
            {col.render ? col.render(row[col.key], row) : (
              <span title={String(row[col.key] || '')}>
                {col.type === 'number' ? fmt(row[col.key]) :
                 col.type === 'date' ? fmtDateShort(row[col.key]) :
                 row[col.key] || '—'}
              </span>
            )}
          </td>
        ))}
        <td className="px-3 py-2">
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setEditing(true)} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Editar">
              <Pencil size={13}/>
            </button>
            {showObs && (
              <button onClick={() => setShowObsRow(v => !v)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded text-xs" title="Observação">
                obs
              </button>
            )}
            <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Excluir">
              <Trash2 size={13}/>
            </button>
          </div>
        </td>
      </tr>
      {showObs && showObsRow && row.observacao && (
        <tr className="bg-gray-50">
          <td colSpan={cols.length + 1} className="px-4 py-1.5 text-xs text-gray-500 italic">
            Obs: {row.observacao}
          </td>
        </tr>
      )}
    </>
  )
}
