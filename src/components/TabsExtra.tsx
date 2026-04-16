'use client'
import { useState } from 'react'
import { fmt, fmtDateShort, todayISO, MESES, CATS_PES, diasAteVencer } from '@/lib/utils'
import { exportarCSVPessoal, exportarPDFPorCategoria, gerarPDFRecibo } from '@/lib/export'
import StatusBadge from '@/components/StatusBadge'
import type { DespesaPessoal, Pendencia, Recibo, Configuracoes } from '@/types'
import { supabase } from '@/lib/supabase'
import { Plus, Wand2, Download, FileSpreadsheet, Receipt } from 'lucide-react'

function FormRow({ fields, onSave, onCancel }: any) {
  const [vals, setVals] = useState<Record<string, any>>({})
  const set = (k: string, v: any) => setVals(p => ({ ...p, [k]: v }))
  return (
    <div className="bg-blue-50 rounded-xl p-3 mt-3 space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {fields.map((f: any) => (
          <div key={f.key} className={f.key === 'descricao' || f.key === 'observacao' ? 'col-span-2 sm:col-span-3' : ''}>
            <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
            {f.options ? (
              <select className="input text-sm" value={vals[f.key] || ''} onChange={e => set(f.key, e.target.value)}>
                <option value="">Selecione...</option>
                {f.options.map((o: string) => <option key={o}>{o}</option>)}
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

function InlineRow({ item, fields, onUpdate, onDelete, onBaixar, showStatus }: any) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ ...item })
  const set = (k: string, v: any) => setDraft((p: any) => ({ ...p, [k]: v }))

  if (editing) {
    return (
      <tr className="bg-blue-50">
        {fields.map((f: any) => (
          <td key={f.key} className="px-2 py-1.5">
            {f.options ? (
              <select className="input text-xs py-1" value={draft[f.key] || ''} onChange={e => set(f.key, e.target.value)}>
                {f.options.map((o: string) => <option key={o}>{o}</option>)}
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

  return (
    <tr className="hover:bg-gray-50 group">
      {fields.map((f: any) => (
        <td key={f.key} className="table-td" style={{ maxWidth: f.width || '140px' }}>
          {f.key === 'valor' ? <span className="font-medium">{fmt(item[f.key])}</span>
          : f.key === 'vencimento' || f.key === 'pago_em' ? fmtDateShort(item[f.key]) || '—'
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

// ─── TAB PESSOAL ──────────────────────────────────────────────────────────────
export function TabPessoal({ pessoal, pendencias, mes, ano, config, logoDataUrl, addPessoal, updatePessoal, deletePessoal, baixarPessoal, addPendencia, updatePendencia, deletePendencia, transportarPendentes, setShowAI }: any) {
  const [showForm, setShowForm] = useState(false)
  const [showPendForm, setShowPendForm] = useState(false)
  const total = pessoal.filter((x: DespesaPessoal) => x.valor > 0).reduce((a: number, b: DespesaPessoal) => a + b.valor, 0)
  const pago = pessoal.filter((x: DespesaPessoal) => x.pago && x.valor > 0).reduce((a: number, b: DespesaPessoal) => a + b.valor, 0)
  const pendPes = pendencias.filter((p: Pendencia) => p.origem === 'pessoal')
  const totalPend = pendPes.filter((p: Pendencia) => !p.pago).reduce((a: number, b: Pendencia) => a + b.valor, 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-amber-50 rounded-xl p-4"><p className="text-xs text-gray-500">Total contas</p><p className="text-lg font-bold text-amber-700">{fmt(total)}</p></div>
        <div className="bg-green-50 rounded-xl p-4"><p className="text-xs text-gray-500">Pago</p><p className="text-lg font-bold text-green-700">{fmt(pago)}</p></div>
        <div className="bg-red-50 rounded-xl p-4"><p className="text-xs text-gray-500">A pagar</p><p className="text-lg font-bold text-red-700">{fmt(total - pago)}</p></div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title mb-0">Despesas pessoal — {MESES[mes]}/{ano}</h3>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowAI('pessoal')} className="btn-outline flex items-center gap-1 text-xs"><Wand2 size={13}/> IA</button>
            <button onClick={() => exportarCSVPessoal(pessoal, mes, ano)} className="btn-outline flex items-center gap-1 text-xs"><FileSpreadsheet size={13}/> CSV</button>
            <button onClick={() => exportarPDFPorCategoria(pessoal, 'pessoal', mes, ano, config, logoDataUrl)} className="btn-outline flex items-center gap-1 text-xs"><Download size={13}/> PDF</button>
            <button onClick={() => setShowForm(v => !v)} className="btn-primary flex items-center gap-1 text-xs"><Plus size={13}/> Nova</button>
          </div>
        </div>

        {showForm && (
          <FormRow
            fields={[
              { key: 'vencimento', label: 'Vencimento', type: 'date' },
              { key: 'descricao', label: 'Descrição *', placeholder: 'Ex: Condomínio' },
              { key: 'categoria', label: 'Categoria', options: CATS_PES },
              { key: 'valor', label: 'Valor (R$)', type: 'number', placeholder: '0,00' },
              { key: 'cartao', label: 'Cartão', placeholder: 'Ex: Nubank' },
              { key: 'observacao', label: 'Observação', placeholder: 'Opcional' },
            ]}
            onSave={async (d: any) => { await addPessoal({ ...d, valor: parseFloat(d.valor || 0), pago: false }); setShowForm(false) }}
            onCancel={() => setShowForm(false)}
          />
        )}

        <div className="overflow-x-auto mt-2">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th" style={{width:'75px'}}>Venc.</th>
                <th className="table-th">Descrição</th>
                <th className="table-th" style={{width:'95px'}}>Categoria</th>
                <th className="table-th" style={{width:'80px'}}>Cartão</th>
                <th className="table-th" style={{width:'105px'}}>Valor</th>
                <th className="table-th" style={{width:'220px'}}>Status / Ações</th>
              </tr>
            </thead>
            <tbody>
              {pessoal.length === 0 && <tr><td colSpan={6} className="text-center text-gray-400 text-sm py-8">Nenhuma despesa lançada</td></tr>}
              {pessoal.map((r: DespesaPessoal) => (
                <InlineRow
                  key={r.id} item={r}
                  fields={[
                    { key: 'vencimento', type: 'date', width: '75px' },
                    { key: 'descricao', width: '160px' },
                    { key: 'categoria', options: CATS_PES, width: '95px' },
                    { key: 'cartao', width: '80px' },
                    { key: 'valor', type: 'number', width: '105px' },
                  ]}
                  onUpdate={(d: any) => updatePessoal(r.id, { ...d, valor: parseFloat(d.valor) })}
                  onDelete={() => deletePessoal(r.id)}
                  onBaixar={() => baixarPessoal(r.id, r.pago)}
                  showStatus
                />
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td colSpan={4} className="px-3 py-2 text-sm">Total</td>
                <td className="px-3 py-2 text-sm text-amber-700">{fmt(total)}</td>
                <td className="px-3 py-2 text-xs text-green-600">Pago: {fmt(pago)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="section-title mb-0">Pendências de meses anteriores</h3>
            {totalPend > 0 && <p className="text-xs text-red-500 mt-0.5">Em aberto: {fmt(totalPend)}</p>}
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
            onSave={async (d: any) => { await addPendencia({ ...d, valor: parseFloat(d.valor || 0), pago: false, origem: 'pessoal' }); setShowPendForm(false) }}
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
              {pendPes.length === 0 && <tr><td colSpan={4} className="text-center text-gray-400 text-sm py-6">Nenhuma pendência</td></tr>}
              {pendPes.map((r: Pendencia) => (
                <InlineRow
                  key={r.id} item={r}
                  fields={[
                    { key: 'vencimento', type: 'date', width: '75px' },
                    { key: 'descricao', width: '200px' },
                    { key: 'valor', type: 'number', width: '105px' },
                  ]}
                  onUpdate={(d: any) => updatePendencia(r.id, { ...d, valor: parseFloat(d.valor) })}
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

// ─── TAB RECIBOS ──────────────────────────────────────────────────────────────
export function TabRecibos({ recibos, setShowRecibo, config, logoDataUrl }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base font-semibold">Recibos gerados</h3>
          <p className="text-xs text-gray-500 mt-0.5">Adiantamentos, vales e pagamentos</p>
        </div>
        <button onClick={() => setShowRecibo(true)} className="btn-primary flex items-center gap-1.5">
          <Receipt size={14}/> Novo recibo
        </button>
      </div>

      {recibos.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <Receipt size={32} className="mx-auto mb-3 opacity-30"/>
          <p className="text-sm">Nenhum recibo emitido ainda</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">Número</th>
                <th className="table-th">Data</th>
                <th className="table-th">Beneficiário</th>
                <th className="table-th">Tipo</th>
                <th className="table-th">Referente a</th>
                <th className="table-th">Valor</th>
                <th className="table-th">Ações</th>
              </tr>
            </thead>
            <tbody>
              {recibos.map((r: Recibo) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="table-td text-xs font-mono text-blue-600">{r.numero}</td>
                  <td className="table-td">{fmtDateShort(r.data)}</td>
                  <td className="table-td font-medium">{r.beneficiario}</td>
                  <td className="table-td"><span className="badge badge-blue capitalize">{r.tipo}</span></td>
                  <td className="table-td max-w-[180px]"><span title={r.descricao}>{r.descricao}</span></td>
                  <td className="table-td font-semibold text-blue-700">{fmt(r.valor)}</td>
                  <td className="table-td">
                    <button onClick={() => gerarPDFRecibo(r, config, logoDataUrl)} className="text-xs px-2 py-1 border border-gray-200 rounded text-gray-600 hover:border-blue-400 hover:text-blue-600 flex items-center gap-1">
                      <Download size={11}/> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── TAB CONFIG ───────────────────────────────────────────────────────────────
export function TabConfig({ config, setConfig, logoDataUrl, logoInputRef, handleLogo }: any) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState(config)

  async function save() {
    setSaving(true)
    await supabase.from('configuracoes').update({ ...form, updated_at: new Date().toISOString() }).eq('id', 1)
    setConfig(form)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-lg space-y-4">
      <h3 className="text-base font-semibold">Configurações do app</h3>

      <div className="card space-y-4">
        <h4 className="text-sm font-medium text-gray-700">Identidade</h4>

        <div>
          <label className="text-xs text-gray-500 mb-2 block">Logo da empresa</label>
          <div className="flex items-center gap-4">
            {(logoDataUrl || config.logo_url) ? (
              <img src={logoDataUrl || config.logo_url} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-gray-200"/>
            ) : (
              <div className="w-16 h-16 rounded-xl bg-blue-50 border-2 border-dashed border-blue-200 flex items-center justify-center text-blue-400 text-xs">Logo</div>
            )}
            <div>
              <button onClick={() => logoInputRef.current?.click()} className="btn-outline text-sm">Trocar logo</button>
              <p className="text-xs text-gray-400 mt-1">PNG ou JPG, aparece no cabeçalho e nos PDFs</p>
            </div>
          </div>
          <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogo}/>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Nome da família</label>
          <input className="input" value={form.nome_familia} onChange={e => setForm((f: any) => ({...f, nome_familia: e.target.value}))}/>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Nome da empresa</label>
          <input className="input" value={form.nome_empresa} onChange={e => setForm((f: any) => ({...f, nome_empresa: e.target.value}))}/>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Meta de receita mensal (R$)</label>
          <input type="number" className="input" value={form.receita_meta || ''} onChange={e => setForm((f: any) => ({...f, receita_meta: parseFloat(e.target.value)}))}/>
        </div>
      </div>

      <div className="card bg-blue-50 border-blue-100">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Compartilhar com seu marido</h4>
        <p className="text-sm text-gray-600">Basta enviar o link do app (URL do Vercel). Qualquer pessoa com o link consegue acessar e editar. Os dados são sincronizados em tempo real via Supabase.</p>
        <div className="mt-3 p-2 bg-white rounded-lg border border-blue-200">
          <p className="text-xs text-gray-500 mb-1">URL do seu app</p>
          <p className="text-sm font-mono text-blue-600">https://financas-daniel-priscila.vercel.app</p>
        </div>
      </div>

      <button onClick={save} disabled={saving} className="btn-primary px-6 py-2.5 flex items-center gap-2">
        {saving ? 'Salvando...' : saved ? '✓ Salvo!' : 'Salvar configurações'}
      </button>
    </div>
  )
}
