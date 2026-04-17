'use client'
import { useState } from 'react'
import { fmt, fmtDate, fmtDateShort, todayISO, MESES, CATS_EMP, CATS_REC_EMP, CATS_REC_PES, diasAteVencer } from '../lib/utils'
import { exportarCSVEmpresa, exportarCSVReceitas, exportarPDFGeral, exportarPDFPorCategoria } from '../lib/export'
import StatusBadge from '../components/StatusBadge'
import type { Receita, DespesaEmpresa, DespesaPessoal, Pendencia, Recibo, Configuracoes, TabName } from '../types'
import { Plus, Wand2, Download, FileSpreadsheet, ChevronRight, AlertTriangle } from 'lucide-react'

// ─── Formulário reutilizável ───────────────────────────────────────────────────
function FormRow({ fields, onSave, onCancel }: {
  fields: { key: string; label: string; type?: string; options?: string[]; placeholder?: string }[]
  onSave: (data: Record<string, any>) => void
  onCancel: () => void
}) {
  const [vals, setVals] = useState<Record<string, any>>({})
  const set = (k: string, v: any) => setVals(p => ({ ...p, [k]: v }))
  return (
    <div className="bg-blue-50 rounded-xl p-3 mt-3 space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {fields.map(f => (
          <div key={f.key} className={f.key === 'descricao' || f.key === 'observacao' ? 'col-span-2 sm:col-span-3' : ''}>
            <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
            {f.options ? (
              <select className="input text-sm" value={vals[f.key] || ''} onChange={e => set(f.key, e.target.value)}>
                <option value="">Selecione...</option>
                {f.options.map(o => <option key={o}>{o}</option>)}
              </select>
            ) : (
              <input type={f.type || 'text'} className="input text-sm" placeholder={f.placeholder}
                value={vals[f.key] || ''} onChange={e => set(f.key, e.target.value)}/>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={() => onSave(vals)} className="btn-primary text-sm px-4 py-1.5">Adicionar</button>
        <button onClick={onCancel} className="btn-outline text-sm px-4 py-1.5">Cancelar</button>
      </div>
    </div>
  )
}

// ─── Linha editável inline ─────────────────────────────────────────────────────
function InlineRow({ item, fields, onUpdate, onDelete, onBaixar, showStatus }: {
  item: Record<string, any>
  fields: { key: string; type?: string; options?: string[]; width?: string }[]
  onUpdate: (data: Record<string, any>) => void
  onDelete: () => void
  onBaixar?: () => void
  showStatus?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ ...item })
  const set = (k: string, v: any) => setDraft(p => ({ ...p, [k]: v }))

  if (editing) {
    return (
      <tr className="bg-blue-50">
        {fields.map(f => (
          <td key={f.key} className="px-2 py-1.5" style={{ width: f.width }}>
            {f.options ? (
              <select className="input text-xs py-1" value={draft[f.key] || ''} onChange={e => set(f.key, e.target.value)}>
                {f.options.map(o => <option key={o}>{o}</option>)}
              </select>
            ) : (
              <input type={f.type || 'text'} className="input text-xs py-1"
                value={draft[f.key] || ''} onChange={e => set(f.key, e.target.value)}/>
            )}
          </td>
        ))}
        <td className="px-2 py-1.5 whitespace-nowrap">
          <button onClick={() => { onUpdate(draft); setEditing(false) }} className="text-xs px-2 py-1 bg-green-600 text-white rounded mr-1">✓</button>
          <button onClick={() => { setDraft({...item}); setEditing(false) }} className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded">✕</button>
        </td>
      </tr>
    )
  }

  const dias = item.vencimento ? diasAteVencer(item.vencimento) : null

  return (
    <tr className="hover:bg-gray-50 group">
      {fields.map(f => (
        <td key={f.key} className="table-td" style={{ maxWidth: f.width || '140px' }}>
          {f.key === 'valor' ? <span className="font-medium">{fmt(item[f.key])}</span>
          : f.key === 'data' || f.key === 'vencimento' || f.key === 'pago_em' ? fmtDateShort(item[f.key]) || '—'
          : <span title={item[f.key]}>{item[f.key] || '—'}</span>}
        </td>
      ))}
      <td className="px-2 py-2 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          {showStatus && onBaixar && (
            <button onClick={onBaixar} title={item.pago ? 'Estornar' : 'Baixar pagamento'}>
              <StatusBadge pago={item.pago} venc={item.vencimento} transportado={item.transportado}/>
            </button>
          )}
          {item.pago_em && <span className="text-xs text-gray-400">{fmtDateShort(item.pago_em)}</span>}
          <div className="opacity-0 group-hover:opacity-100 flex gap-1 ml-1">
            <button onClick={() => setEditing(true)} className="text-xs px-2 py-0.5 border border-gray-200 rounded text-gray-500 hover:border-blue-400 hover:text-blue-600">editar</button>
            <button onClick={onDelete} className="text-xs px-2 py-0.5 border border-red-100 rounded text-red-400 hover:bg-red-50">×</button>
          </div>
          {item.observacao && <span className="text-xs text-gray-400 italic truncate max-w-[80px]" title={item.observacao}>"{item.observacao}"</span>}
        </div>
      </td>
    </tr>
  )
}

// ─── TAB RESUMO ───────────────────────────────────────────────────────────────
export function TabResumo({ totalRec, totalEmp, totalPes, saldo, totalPend, pctComprometido, receitas, empresa, pessoal, pendencias, mes, ano, config, logoDataUrl, setTab }: any) {
  const today = new Date(); today.setHours(0,0,0,0)
  const alertas = [
    ...empresa.filter((x: any) => !x.pago),
    ...pessoal.filter((x: any) => !x.pago && x.valor > 0),
    ...pendencias.filter((x: any) => !x.pago)
  ].map((x: any) => ({
    ...x,
    dias: x.vencimento ? Math.ceil((new Date(x.vencimento).getTime() - today.getTime()) / 86400000) : 999
  })).sort((a: any, b: any) => a.dias - b.dias).slice(0, 8)

  const barColor = pctComprometido > 90 ? 'bg-red-500' : pctComprometido > 70 ? 'bg-yellow-500' : 'bg-green-500'

  return (
    <div className="space-y-4">
      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Receitas', val: totalRec, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Desp. Empresa', val: totalEmp, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Desp. Pessoal', val: totalPes, color: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'Saldo Líquido', val: saldo, color: saldo >= 0 ? 'text-green-700' : 'text-red-700', bg: saldo >= 0 ? 'bg-green-50' : 'bg-red-50' },
        ].map(m => (
          <div key={m.label} className={`${m.bg} rounded-xl p-4`}>
            <p className="text-xs text-gray-500 mb-1">{m.label}</p>
            <p className={`text-lg font-bold ${m.color}`}>{fmt(m.val)}</p>
          </div>
        ))}
      </div>

      {/* Barra comprometimento */}
      <div className="card">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Comprometimento da receita</span>
          <span className={`text-sm font-bold ${pctComprometido > 90 ? 'text-red-600' : pctComprometido > 70 ? 'text-yellow-600' : 'text-green-600'}`}>{pctComprometido}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pctComprometido}%` }}/>
        </div>
        {totalPend > 0 && (
          <p className="text-xs text-amber-700 mt-2 flex items-center gap-1">
            <AlertTriangle size={12}/> Pendências acumuladas: {fmt(totalPend)}
          </p>
        )}
      </div>

      {/* Alertas */}
      <div className="card">
        <div className="flex justify-between items-center mb-3">
          <h3 className="section-title mb-0">Próximas obrigações</h3>
          <button onClick={() => setTab('empresa')} className="text-xs text-blue-600 flex items-center gap-1">Ver todas <ChevronRight size={12}/></button>
        </div>
        {alertas.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Nenhuma pendência!</p>
        ) : alertas.map((a: any, i: number) => {
          const cor = a.dias < 0 ? 'text-red-600 bg-red-50' : a.dias <= 3 ? 'text-amber-700 bg-amber-50' : 'text-gray-600 bg-gray-50'
          const label = a.dias < 0 ? `${Math.abs(a.dias)}d atrasado` : a.dias === 0 ? 'Hoje' : `${a.dias}d`
          return (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate font-medium">{a.descricao}</p>
                <p className="text-xs text-gray-400">{a.categoria || a.origem || ''}</p>
              </div>
              <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                <span className="text-sm font-semibold">{fmt(a.valor)}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cor}`}>{label}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Export */}
      <div className="card">
        <h3 className="section-title">Exportar relatório — {MESES[mes]}/{ano}</h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => exportarCSVGeral(receitas, empresa, pessoal, pendencias, mes, ano)} className="btn-outline flex items-center gap-1.5 text-xs">
            <FileSpreadsheet size={13}/> CSV Geral
          </button>
          <button onClick={() => exportarPDFGeral(receitas, empresa, pessoal, pendencias, mes, ano, config, logoDataUrl)} className="btn-outline flex items-center gap-1.5 text-xs">
            <Download size={13}/> PDF Geral
          </button>
          <button onClick={() => exportarPDFPorCategoria(empresa, 'empresa', mes, ano, config, logoDataUrl)} className="btn-outline flex items-center gap-1.5 text-xs">
            <Download size={13}/> PDF Empresa/Categ.
          </button>
          <button onClick={() => exportarPDFPorCategoria(pessoal, 'pessoal', mes, ano, config, logoDataUrl)} className="btn-outline flex items-center gap-1.5 text-xs">
            <Download size={13}/> PDF Pessoal/Categ.
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── TAB RECEITAS ─────────────────────────────────────────────────────────────
export function TabReceitas({ receitas, mes, ano, config, logoDataUrl, addReceita, updateReceita, deleteReceita, setShowAI }: any) {
  const [showForm, setShowForm] = useState(false)
  const total = receitas.reduce((a: number, b: Receita) => a + b.valor, 0)
  const recebido = receitas.filter((x: Receita) => x.recebido).reduce((a: number, b: Receita) => a + b.valor, 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 rounded-xl p-4"><p className="text-xs text-gray-500">Total previsto</p><p className="text-lg font-bold text-green-700">{fmt(total)}</p></div>
        <div className="bg-blue-50 rounded-xl p-4"><p className="text-xs text-gray-500">Recebido</p><p className="text-lg font-bold text-blue-700">{fmt(recebido)}</p></div>
        <div className="bg-amber-50 rounded-xl p-4"><p className="text-xs text-gray-500">A receber</p><p className="text-lg font-bold text-amber-700">{fmt(total - recebido)}</p></div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title mb-0">Entradas — {MESES[mes]}/{ano}</h3>
          <div className="flex gap-2">
            <button onClick={() => setShowAI('receita')} className="btn-outline flex items-center gap-1 text-xs"><Wand2 size={13}/> IA</button>
            <button onClick={() => exportarCSVReceitas(receitas, mes, ano)} className="btn-outline flex items-center gap-1 text-xs"><FileSpreadsheet size={13}/> CSV</button>
            <button onClick={() => setShowForm(v => !v)} className="btn-primary flex items-center gap-1 text-xs"><Plus size={13}/> Nova</button>
          </div>
        </div>

        {showForm && (
          <FormRow
            fields={[
              { key: 'data', label: 'Data', type: 'date' },
              { key: 'descricao', label: 'Descrição *', placeholder: 'Ex: Faturamento clientes' },
              { key: 'categoria', label: 'Categoria', options: [...CATS_REC_EMP, ...CATS_REC_PES] },
              { key: 'valor', label: 'Valor (R$)', type: 'number', placeholder: '0,00' },
              { key: 'observacao', label: 'Observação', placeholder: 'Opcional' },
            ]}
            onSave={async (d) => { await addReceita({ ...d, valor: parseFloat(d.valor || 0), recebido: false, tipo: 'pessoal' }); setShowForm(false) }}
            onCancel={() => setShowForm(false)}
          />
        )}

        <div className="overflow-x-auto mt-2">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th" style={{width:'80px'}}>Data</th>
                <th className="table-th">Descrição</th>
                <th className="table-th" style={{width:'100px'}}>Categoria</th>
                <th className="table-th" style={{width:'110px'}}>Valor</th>
                <th className="table-th" style={{width:'200px'}}>Status / Ações</th>
              </tr>
            </thead>
            <tbody>
              {receitas.length === 0 && (
                <tr><td colSpan={5} className="text-center text-gray-400 text-sm py-8">Nenhuma receita lançada</td></tr>
              )}
              {receitas.map((r: Receita) => (
                <InlineRow
                  key={r.id}
                  item={r}
                  fields={[
                    { key: 'data', type: 'date', width: '80px' },
                    { key: 'descricao', width: '200px' },
                    { key: 'categoria', options: [...CATS_REC_EMP, ...CATS_REC_PES], width: '110px' },
                    { key: 'valor', type: 'number', width: '110px' },
                  ]}
                  onUpdate={(d) => updateReceita(r.id, { ...d, valor: parseFloat(d.valor) })}
                  onDelete={() => deleteReceita(r.id)}
                  onBaixar={() => updateReceita(r.id, { recebido: !r.recebido })}
                  showStatus
                />
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td colSpan={3} className="px-3 py-2 text-sm">Total</td>
                <td className="px-3 py-2 text-sm text-green-700">{fmt(total)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── TAB EMPRESA ──────────────────────────────────────────────────────────────
export function TabEmpresa({ empresa, pendencias, mes, ano, config, logoDataUrl, addEmpresa, updateEmpresa, deleteEmpresa, baixarEmpresa, addPendencia, updatePendencia, deletePendencia, transportarPendentes, setShowAI }: any) {
  const [showForm, setShowForm] = useState(false)
  const [showPendForm, setShowPendForm] = useState(false)
  const total = empresa.reduce((a: number, b: DespesaEmpresa) => a + b.valor, 0)
  const pago = empresa.filter((x: DespesaEmpresa) => x.pago).reduce((a: number, b: DespesaEmpresa) => a + b.valor, 0)
  const pendEmp = pendencias.filter((p: Pendencia) => p.origem === 'empresa')
  const totalPend = pendEmp.filter((p: Pendencia) => !p.pago).reduce((a: number, b: Pendencia) => a + b.valor, 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 rounded-xl p-4"><p className="text-xs text-gray-500">Total despesas</p><p className="text-lg font-bold text-blue-700">{fmt(total)}</p></div>
        <div className="bg-green-50 rounded-xl p-4"><p className="text-xs text-gray-500">Pago</p><p className="text-lg font-bold text-green-700">{fmt(pago)}</p></div>
        <div className="bg-red-50 rounded-xl p-4"><p className="text-xs text-gray-500">A pagar</p><p className="text-lg font-bold text-red-700">{fmt(total - pago)}</p></div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title mb-0">Despesas empresa — {MESES[mes]}/{ano}</h3>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowAI('empresa')} className="btn-outline flex items-center gap-1 text-xs"><Wand2 size={13}/> IA</button>
            <button onClick={() => exportarCSVEmpresa(empresa, mes, ano)} className="btn-outline flex items-center gap-1 text-xs"><FileSpreadsheet size={13}/> CSV</button>
            <button onClick={() => exportarPDFPorCategoria(empresa, 'empresa', mes, ano, config, logoDataUrl)} className="btn-outline flex items-center gap-1 text-xs"><Download size={13}/> PDF</button>
            <button onClick={() => setShowForm(v => !v)} className="btn-primary flex items-center gap-1 text-xs"><Plus size={13}/> Nova</button>
          </div>
        </div>

        {showForm && (
          <FormRow
            fields={[
              { key: 'vencimento', label: 'Vencimento', type: 'date' },
              { key: 'descricao', label: 'Descrição *', placeholder: 'Ex: Sr Valter' },
              { key: 'categoria', label: 'Categoria', options: CATS_EMP },
              { key: 'valor', label: 'Valor (R$)', type: 'number', placeholder: '0,00' },
              { key: 'observacao', label: 'Observação', placeholder: 'Opcional' },
            ]}
            onSave={async (d) => { await addEmpresa({ ...d, valor: parseFloat(d.valor || 0), pago: false }); setShowForm(false) }}
            onCancel={() => setShowForm(false)}
          />
        )}

        <div className="overflow-x-auto mt-2">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th" style={{width:'75px'}}>Venc.</th>
                <th className="table-th">Descrição</th>
                <th className="table-th" style={{width:'105px'}}>Categoria</th>
                <th className="table-th" style={{width:'105px'}}>Valor</th>
                <th className="table-th" style={{width:'220px'}}>Status / Ações</th>
              </tr>
            </thead>
            <tbody>
              {empresa.length === 0 && <tr><td colSpan={5} className="text-center text-gray-400 text-sm py-8">Nenhuma despesa lançada</td></tr>}
              {empresa.map((r: DespesaEmpresa) => (
                <InlineRow
                  key={r.id} item={r}
                  fields={[
                    { key: 'vencimento', type: 'date', width: '75px' },
                    { key: 'descricao', width: '180px' },
                    { key: 'categoria', options: CATS_EMP, width: '105px' },
                    { key: 'valor', type: 'number', width: '105px' },
                  ]}
                  onUpdate={(d) => updateEmpresa(r.id, { ...d, valor: parseFloat(d.valor) })}
                  onDelete={() => deleteEmpresa(r.id)}
                  onBaixar={() => baixarEmpresa(r.id, r.pago)}
                  showStatus
                />
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td colSpan={3} className="px-3 py-2 text-sm">Total</td>
                <td className="px-3 py-2 text-sm text-blue-700">{fmt(total)}</td>
                <td className="px-3 py-2 text-xs text-green-600">Pago: {fmt(pago)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Pendências */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="section-title mb-0">Pendências de meses anteriores</h3>
            {totalPend > 0 && <p className="text-xs text-red-500 mt-0.5">Total em aberto: {fmt(totalPend)}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={transportarPendentes} className="btn-outline flex items-center gap-1 text-xs text-blue-600 border-blue-200">→ Transportar</button>
            <button onClick={() => setShowPendForm(v => !v)} className="btn-outline flex items-center gap-1 text-xs"><Plus size={13}/> Nova</button>
          </div>
        </div>
        {showPendForm && (
          <FormRow
            fields={[
              { key: 'vencimento', label: 'Data origem', type: 'date' },
              { key: 'descricao', label: 'Descrição *' },
              { key: 'valor', label: 'Valor (R$)', type: 'number' },
              { key: 'observacao', label: 'Observação' },
            ]}
            onSave={async (d) => { await addPendencia({ ...d, valor: parseFloat(d.valor || 0), pago: false, origem: 'empresa' }); setShowPendForm(false) }}
            onCancel={() => setShowPendForm(false)}
          />
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              <th className="table-th" style={{width:'75px'}}>Data</th>
              <th className="table-th">Descrição</th>
              <th className="table-th" style={{width:'105px'}}>Valor</th>
              <th className="table-th" style={{width:'200px'}}>Status / Ações</th>
            </tr></thead>
            <tbody>
              {pendEmp.length === 0 && <tr><td colSpan={4} className="text-center text-gray-400 text-sm py-6">Nenhuma pendência</td></tr>}
              {pendEmp.map((r: Pendencia) => (
                <InlineRow
                  key={r.id} item={r}
                  fields={[
                    { key: 'vencimento', type: 'date', width: '75px' },
                    { key: 'descricao', width: '200px' },
                    { key: 'valor', type: 'number', width: '105px' },
                  ]}
                  onUpdate={(d) => updatePendencia(r.id, { ...d, valor: parseFloat(d.valor) })}
                  onDelete={() => deletePendencia(r.id)}
                  onBaixar={() => updatePendencia(r.id, { pago: !r.pago, pago_em: !r.pago ? todayISO() : null })}
                  showStatus
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
