'use client'
import { useState } from 'react'
import { fmt, fmtDateShort, MESES, CATS_PES, todayISO } from '@/lib/utils'
import { csvPessoal, pdfCategoria } from '@/lib/export'
import StatusBadge from './StatusBadge'

function TabelaPessoal({ items, onUpdate, onDelete, onBaixar }: any) {
  const [editing, setEditing] = useState<string|null>(null)
  const [draft, setDraft] = useState<any>({})
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead><tr>
          <th className="table-th" style={{width:70}}>Venc.</th>
          <th className="table-th">Descrição</th>
          <th className="table-th" style={{width:90}}>Categoria</th>
          <th className="table-th" style={{width:80}}>Cartão</th>
          <th className="table-th" style={{width:110}}>Valor</th>
          <th className="table-th" style={{width:150}}>Status / Ações</th>
          <th className="table-th" style={{width:130}}>Pago em</th>
        </tr></thead>
        <tbody>
          {items.length===0&&<tr><td colSpan={7} className="text-center text-gray-400 text-sm py-6">Nenhum lançamento</td></tr>}
          {items.map((r:any)=>{
            if(editing===r.id) return (
              <tr key={r.id} className="bg-blue-50">
                <td className="px-2 py-1"><input type="date" className="input text-xs py-1" value={draft.vencimento||''} onChange={e=>setDraft((d:any)=>({...d,vencimento:e.target.value}))}/></td>
                <td className="px-2 py-1"><input className="input text-xs py-1" value={draft.descricao||''} onChange={e=>setDraft((d:any)=>({...d,descricao:e.target.value}))}/></td>
                <td className="px-2 py-1"><select className="input text-xs py-1" value={draft.categoria||''} onChange={e=>setDraft((d:any)=>({...d,categoria:e.target.value}))}>{CATS_PES.map((c:string)=><option key={c}>{c}</option>)}</select></td>
                <td className="px-2 py-1"><input className="input text-xs py-1" placeholder="Cartão" value={draft.cartao||''} onChange={e=>setDraft((d:any)=>({...d,cartao:e.target.value}))}/></td>
                <td className="px-2 py-1"><input type="number" className="input text-xs py-1" value={draft.valor||''} onChange={e=>setDraft((d:any)=>({...d,valor:e.target.value}))}/></td>
                <td className="px-2 py-1 whitespace-nowrap" colSpan={2}>
                  <input className="input text-xs py-1 mb-1 w-full" placeholder="Observação" value={draft.observacao||''} onChange={e=>setDraft((d:any)=>({...d,observacao:e.target.value}))}/>
                  <button onClick={()=>{onUpdate(r.id,{...draft,valor:parseFloat(draft.valor)});setEditing(null)}} className="text-xs px-2 py-1 bg-green-600 text-white rounded mr-1">✓ Salvar</button>
                  <button onClick={()=>setEditing(null)} className="text-xs px-2 py-1 bg-gray-200 rounded">✕</button>
                </td>
              </tr>
            )
            return (
              <tr key={r.id} className="hover:bg-gray-50 group">
                <td className="table-td">{fmtDateShort(r.vencimento)}</td>
                <td className="table-td max-w-0">
                  <span title={r.descricao} className="truncate block">{r.descricao}{r.transportado&&<span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1 rounded">transp.</span>}</span>
                  {r.observacao&&<span className="text-xs text-gray-400 italic"> — {r.observacao}</span>}
                </td>
                <td className="table-td text-xs">{r.categoria}</td>
                <td className="table-td text-xs text-gray-500">{r.cartao||'—'}</td>
                <td className="table-td font-medium">{fmt(r.valor)}</td>
                <td className="table-td whitespace-nowrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button onClick={()=>onBaixar(r.id,r.pago)}><StatusBadge pago={r.pago} venc={r.vencimento} transportado={r.transportado}/></button>
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                      <button onClick={()=>{setEditing(r.id);setDraft({...r})}} className="text-xs px-2 py-0.5 border border-gray-200 rounded text-gray-500 hover:text-blue-600">editar</button>
                      <button onClick={()=>onDelete(r.id)} className="text-xs px-2 py-0.5 border border-red-100 rounded text-red-400">×</button>
                    </div>
                  </div>
                </td>
                <td className="table-td">
                  <input
                    type="date"
                    className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white text-gray-700"
                    value={r.pago_em||''}
                    onChange={e=>onUpdate(r.id,{pago_em:e.target.value||null, pago: !!e.target.value})}
                    title="Data do pagamento"
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function TabelaPendencias({ items, onUpdate, onDelete }: any) {
  const [editing, setEditing] = useState<string|null>(null)
  const [draft, setDraft] = useState<any>({})
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead><tr>
          <th className="table-th" style={{width:70}}>Data</th>
          <th className="table-th">Descrição</th>
          <th className="table-th" style={{width:110}}>Valor</th>
          <th className="table-th" style={{width:150}}>Status / Ações</th>
          <th className="table-th" style={{width:130}}>Pago em</th>
        </tr></thead>
        <tbody>
          {items.length===0&&<tr><td colSpan={5} className="text-center text-gray-400 text-sm py-6">Nenhuma pendência</td></tr>}
          {items.map((r:any)=>{
            if(editing===r.id) return (
              <tr key={r.id} className="bg-blue-50">
                <td className="px-2 py-1"><input type="date" className="input text-xs py-1" value={draft.vencimento||''} onChange={e=>setDraft((d:any)=>({...d,vencimento:e.target.value}))}/></td>
                <td className="px-2 py-1"><input className="input text-xs py-1" value={draft.descricao||''} onChange={e=>setDraft((d:any)=>({...d,descricao:e.target.value}))}/></td>
                <td className="px-2 py-1"><input type="number" className="input text-xs py-1" value={draft.valor||''} onChange={e=>setDraft((d:any)=>({...d,valor:e.target.value}))}/></td>
                <td className="px-2 py-1 whitespace-nowrap" colSpan={2}>
                  <button onClick={()=>{onUpdate(r.id,{...draft,valor:parseFloat(draft.valor)});setEditing(null)}} className="text-xs px-2 py-1 bg-green-600 text-white rounded mr-1">✓</button>
                  <button onClick={()=>setEditing(null)} className="text-xs px-2 py-1 bg-gray-200 rounded">✕</button>
                </td>
              </tr>
            )
            return (
              <tr key={r.id} className="hover:bg-gray-50 group">
                <td className="table-td">{fmtDateShort(r.vencimento)}</td>
                <td className="table-td max-w-0">
                  <span title={r.descricao} className="truncate block">{r.descricao}{r.transportado&&<span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1 rounded">transp.</span>}</span>
                  {r.observacao&&<span className="text-xs text-gray-400 italic"> — {r.observacao}</span>}
                </td>
                <td className="table-td font-medium">{fmt(r.valor)}</td>
                <td className="table-td whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <button onClick={()=>onUpdate(r.id,{pago:!r.pago,pago_em:!r.pago?todayISO():null})}><StatusBadge pago={r.pago} venc={r.vencimento} transportado={r.transportado}/></button>
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                      <button onClick={()=>{setEditing(r.id);setDraft({...r})}} className="text-xs px-2 py-0.5 border border-gray-200 rounded text-gray-500 hover:text-blue-600">editar</button>
                      <button onClick={()=>onDelete(r.id)} className="text-xs px-2 py-0.5 border border-red-100 rounded text-red-400">×</button>
                    </div>
                  </div>
                </td>
                <td className="table-td">
                  <input
                    type="date"
                    className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white text-gray-700"
                    value={r.pago_em||''}
                    onChange={e=>onUpdate(r.id,{pago_em:e.target.value||null, pago: !!e.target.value})}
                    title="Data do pagamento"
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function TabPessoal({ pessoal, pendencias, mes, ano, config, logoDataUrl, addPessoal, updatePessoal, deletePessoal, baixarPessoal, addPendencia, updatePendencia, deletePendencia, transportarPendentes, setShowAI }: any) {
  const [showForm, setShowForm] = useState(false)
  const [showPF, setShowPF] = useState(false)
  const [form, setForm] = useState({vencimento:'',descricao:'',categoria:'Moradia',valor:'',cartao:'',observacao:''})
  const [pform, setPform] = useState({vencimento:'',descricao:'',valor:'',observacao:''})
  const sf=(k:string,v:string)=>setForm(f=>({...f,[k]:v}))
  const spf=(k:string,v:string)=>setPform(f=>({...f,[k]:v}))

  const total = pessoal.filter((x:any)=>x.valor>0).reduce((a:number,b:any)=>a+b.valor,0)
  const pago = pessoal.filter((x:any)=>x.pago&&x.valor>0).reduce((a:number,b:any)=>a+b.valor,0)
  const pendPes = pendencias.filter((p:any)=>p.origem==='pessoal')
  const totalPend = pendPes.filter((p:any)=>!p.pago).reduce((a:number,b:any)=>a+b.valor,0)

  async function add(){if(!form.descricao||!form.valor)return;await addPessoal({...form,valor:parseFloat(form.valor),pago:false});setForm({vencimento:'',descricao:'',categoria:'Moradia',valor:'',cartao:'',observacao:''});setShowForm(false)}
  async function addP(){if(!pform.descricao||!pform.valor)return;await addPendencia({...pform,valor:parseFloat(pform.valor),pago:false,origem:'pessoal'});setPform({vencimento:'',descricao:'',valor:'',observacao:''});setShowPF(false)}

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-amber-50 rounded-xl p-4"><p className="text-xs text-gray-500">Total contas</p><p className="text-lg font-bold text-amber-700">{fmt(total)}</p></div>
        <div className="bg-green-50 rounded-xl p-4"><p className="text-xs text-gray-500">Pago</p><p className="text-lg font-bold text-green-700">{fmt(pago)}</p></div>
        <div className="bg-red-50 rounded-xl p-4"><p className="text-xs text-gray-500">A pagar</p><p className="text-lg font-bold text-red-700">{fmt(total-pago)}</p></div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Despesas pessoal — {MESES[mes]}/{ano}</h3>
          <div className="flex flex-wrap gap-2">
            <button onClick={()=>setShowAI('pessoal')} className="btn-outline text-xs">🤖 IA</button>
            <button onClick={()=>csvPessoal(pessoal,mes,ano)} className="btn-outline text-xs">📊 CSV</button>
            <button onClick={()=>pdfCategoria(pessoal,'Pessoal',mes,ano,config,logoDataUrl)} className="btn-outline text-xs">📄 PDF</button>
            <button onClick={()=>setShowForm(v=>!v)} className="btn-primary text-xs">+ Nova</button>
          </div>
        </div>

        {showForm&&(
          <div className="bg-blue-50 rounded-xl p-3 mb-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs text-gray-500">Vencimento</label><input type="date" className="input text-sm" value={form.vencimento} onChange={e=>sf('vencimento',e.target.value)}/></div>
              <div><label className="text-xs text-gray-500">Categoria</label><select className="input text-sm" value={form.categoria} onChange={e=>sf('categoria',e.target.value)}>{CATS_PES.map(c=><option key={c}>{c}</option>)}</select></div>
              <div className="col-span-2"><label className="text-xs text-gray-500">Descrição *</label><input className="input text-sm" placeholder="Ex: Condomínio" value={form.descricao} onChange={e=>sf('descricao',e.target.value)}/></div>
              <div><label className="text-xs text-gray-500">Valor (R$) *</label><input type="number" step="0.01" className="input text-sm" value={form.valor} onChange={e=>sf('valor',e.target.value)}/></div>
              <div><label className="text-xs text-gray-500">Cartão</label><input className="input text-sm" placeholder="Ex: Nubank" value={form.cartao} onChange={e=>sf('cartao',e.target.value)}/></div>
              <div className="col-span-2"><label className="text-xs text-gray-500">Observação</label><input className="input text-sm" value={form.observacao} onChange={e=>sf('observacao',e.target.value)}/></div>
            </div>
            <div className="flex gap-2"><button onClick={add} className="btn-primary text-sm px-4">Adicionar</button><button onClick={()=>setShowForm(false)} className="btn-outline text-sm px-4">Cancelar</button></div>
          </div>
        )}

        <TabelaPessoal items={pessoal} onUpdate={updatePessoal} onDelete={deletePessoal} onBaixar={baixarPessoal}/>
        <div className="flex justify-between bg-gray-50 px-3 py-2 mt-1 rounded-b-lg text-sm font-semibold">
          <span>Total</span><div className="flex gap-4"><span className="text-amber-700">{fmt(total)}</span><span className="text-green-600 text-xs font-normal">Pago: {fmt(pago)}</span></div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold">Pendências de meses anteriores</h3>
            {totalPend>0&&<p className="text-xs text-red-500">Em aberto: {fmt(totalPend)}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={transportarPendentes} className="btn-outline text-xs text-blue-600 border-blue-200">→ Transportar</button>
            <button onClick={()=>setShowPF(v=>!v)} className="btn-outline text-xs">+ Nova</button>
          </div>
        </div>

        {showPF&&(
          <div className="bg-blue-50 rounded-xl p-3 mb-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs text-gray-500">Data origem</label><input type="date" className="input text-sm" value={pform.vencimento} onChange={e=>spf('vencimento',e.target.value)}/></div>
              <div><label className="text-xs text-gray-500">Valor (R$) *</label><input type="number" step="0.01" className="input text-sm" value={pform.valor} onChange={e=>spf('valor',e.target.value)}/></div>
              <div className="col-span-2"><label className="text-xs text-gray-500">Descrição *</label><input className="input text-sm" value={pform.descricao} onChange={e=>spf('descricao',e.target.value)}/></div>
              <div className="col-span-2"><label className="text-xs text-gray-500">Observação</label><input className="input text-sm" value={pform.observacao} onChange={e=>spf('observacao',e.target.value)}/></div>
            </div>
            <div className="flex gap-2"><button onClick={addP} className="btn-primary text-sm px-4">Adicionar</button><button onClick={()=>setShowPF(false)} className="btn-outline text-sm px-4">Cancelar</button></div>
          </div>
        )}

        <TabelaPendencias items={pendPes} onUpdate={updatePendencia} onDelete={deletePendencia}/>
      </div>
    </div>
  )
}
