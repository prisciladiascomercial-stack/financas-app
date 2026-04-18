'use client'
import { useState } from 'react'
import { fmt, fmtDateShort, MESES, todayISO, CATS_REC_EMP, CATS_REC_PES } from '@/lib/utils'
import { exportarCSVReceitas } from '@/lib/export'
import StatusBadge from './StatusBadge'
import ImportModal from './ImportModal'

const CATS_REC = [...CATS_REC_EMP, ...CATS_REC_PES]

export default function TabReceitas({ receitas, mes, ano, addReceita, updateReceita, deleteReceita, setShowAI }: any) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState<any>({})
  const [showImport, setShowImport] = useState(false)
  const [form, setForm] = useState({ data: todayISO(), descricao: '', categoria: 'Faturamento', valor: '', observacao: '' })
  const sf = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const total = receitas.reduce((a: number, b: any) => a + b.valor, 0)
  const recebido = receitas.filter((x: any) => x.recebido).reduce((a: number, b: any) => a + b.valor, 0)

  async function add() {
    if (!form.descricao || !form.valor) return
    await addReceita({ ...form, valor: parseFloat(form.valor), recebido: false, tipo: 'pessoal' })
    setForm({ data: todayISO(), descricao: '', categoria: 'Faturamento', valor: '', observacao: '' })
    setShowForm(false)
  }

  async function handleImport(itens: any[]) {
    for (const item of itens) {
      await addReceita({
        descricao: item.descricao,
        categoria: item.categoria,
        valor: Math.abs(item.valor),
        data: item.data,
        observacao: item.observacao,
        recebido: false,
        tipo: 'pessoal',
      })
    }
    setShowImport(false)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 rounded-xl p-4"><p className="text-xs text-gray-500">Total previsto</p><p className="text-lg font-bold text-green-700">{fmt(total)}</p></div>
        <div className="bg-blue-50 rounded-xl p-4"><p className="text-xs text-gray-500">Recebido</p><p className="text-lg font-bold text-blue-700">{fmt(recebido)}</p></div>
        <div className="bg-amber-50 rounded-xl p-4"><p className="text-xs text-gray-500">A receber</p><p className="text-lg font-bold text-amber-700">{fmt(total - recebido)}</p></div>
      </div>
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Entradas - {MESES[mes]}/{ano}</h3>
          <div className="flex gap-2">
            <button onClick={() => setShowAI('receita')} className="btn-outline text-xs">IA</button>
            <button onClick={() => setShowImport(true)} className="btn-outline text-xs">Importar</button>
            <button onClick={() => exportarCSVReceitas(receitas, mes, ano)} className="btn-outline text-xs">CSV</button>
            <button onClick={() => setShowForm(v => !v)} className="btn-primary text-xs">+ Nova</button>
          </div>
        </div>
        {showForm && (
          <div className="bg-blue-50 rounded-xl p-3 mb-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs text-gray-500">Data</label><input type="date" className="input text-sm" value={form.data} onChange={e => sf('data', e.target.value)} /></div>
              <div><label className="text-xs text-gray-500">Categoria</label><select className="input text-sm" value={form.categoria} onChange={e => sf('categoria', e.target.value)}>{CATS_REC.map(c => <option key={c}>{c}</option>)}</select></div>
              <div className="col-span-2"><label className="text-xs text-gray-500">Descricao *</label><input className="input text-sm" placeholder="Ex: Faturamento clientes" value={form.descricao} onChange={e => sf('descricao', e.target.value)} /></div>
              <div><label className="text-xs text-gray-500">Valor (R$) *</label><input type="number" step="0.01" className="input text-sm" value={form.valor} onChange={e => sf('valor', e.target.value)} /></div>
              <div><label className="text-xs text-gray-500">Observacao</label><input className="input text-sm" value={form.observacao} onChange={e => sf('observacao', e.target.value)} /></div>
            </div>
            <div className="flex gap-2"><button onClick={add} className="btn-primary text-sm px-4">Adicionar</button><button onClick={() => setShowForm(false)} className="btn-outline text-sm px-4">Cancelar</button></div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th" style={{ width: 70 }}>Data</th>
                <th className="table-th">Descricao</th>
                <th className="table-th" style={{ width: 100 }}>Categoria</th>
                <th className="table-th" style={{ width: 110 }}>Valor</th>
                <th className="table-th" style={{ width: 180 }}>Status / Acoes</th>
              </tr>
            </thead>
            <tbody>
              {receitas.length === 0 && <tr><td colSpan={5} className="text-center text-gray-400 text-sm py-8">Nenhuma receita lancada</td></tr>}
              {receitas.map((r: any) => {
                if (editing === r.id) {
                  return (
                    <tr key={r.id} className="bg-blue-50">
                      <td className="px-2 py-1"><input type="date" className="input text-xs py-1" value={draft.data || ''} onChange={e => setDraft((d: any) => ({ ...d, data: e.target.value }))} /></td>
                      <td className="px-2 py-1"><input className="input text-xs py-1" value={draft.descricao || ''} onChange={e => setDraft((d: any) => ({ ...d, descricao: e.target.value }))} /></td>
                      <td className="px-2 py-1"><select className="input text-xs py-1" value={draft.categoria || ''} onChange={e => setDraft((d: any) => ({ ...d, categoria: e.target.value }))}>{CATS_REC.map(c => <option key={c}>{c}</option>)}</select></td>
                      <td className="px-2 py-1"><input type="number" className="input text-xs py-1" value={draft.valor || ''} onChange={e => setDraft((d: any) => ({ ...d, valor: e.target.value }))} /></td>
                      <td className="px-2 py-1 whitespace-nowrap">
                        <button onClick={() => { updateReceita(r.id, { ...draft, valor: parseFloat(draft.valor) }); setEditing(null) }} className="text-xs px-2 py-1 bg-green-600 text-white rounded mr-1">Salvar</button>
                        <button onClick={() => setEditing(null)} className="text-xs px-2 py-1 bg-gray-200 rounded">Cancelar</button>
                      </td>
                    </tr>
                  )
                }
                return (
                  <tr key={r.id} className="hover:bg-gray-50 group">
                    <td className="table-td">{fmtDateShort(r.data)}</td>
                    <td className="table-td max-w-0"><span title={r.descricao} className="truncate block">{r.descricao}</span>{r.observacao && <span className="text-xs text-gray-400 italic"> - {r.observacao}</span>}</td>
                    <td className="table-td">{r.categoria}</td>
                    <td className="table-td font-medium text-green-700">{fmt(r.valor)}</td>
                    <td className="table-td whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => updateReceita(r.id, { recebido: !r.recebido })}><StatusBadge pago={r.recebido} venc={r.data} /></button>
                        <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                          <button onClick={() => { setEditing(r.id); setDraft({ ...r }) }} className="text-xs px-2 py-0.5 border border-gray-200 rounded text-gray-500 hover:text-blue-600">editar</button>
                          <button onClick={() => deleteReceita(r.id)} className="text-xs px-2 py-0.5 border border-red-100 rounded text-red-400 hover:bg-red-50">x</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot><tr className="bg-gray-50 font-semibold"><td colSpan={3} className="px-3 py-2 text-sm">Total</td><td className="px-3 py-2 text-sm text-green-700">{fmt(total)}</td><td /></tr></tfoot>
          </table>
        </div>
      </div>
      {showImport && <ImportModal targetTab="receitas" onImport={handleImport} onClose={() => setShowImport(false)} />}
    </div>
  )
}
