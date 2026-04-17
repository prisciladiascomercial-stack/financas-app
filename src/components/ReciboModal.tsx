'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { pdfRecibo } from '@/lib/export'
import { gerarNumeroRecibo, todayISO, fmt } from '@/lib/utils'

export default function ReciboModal({ config, logoDataUrl, onClose }: { config: any; logoDataUrl?: string; onClose: () => void }) {
  const [form, setForm] = useState({ beneficiario:'', descricao:'', valor:'', tipo:'adiantamento', data:todayISO(), observacao:'' })
  const [loading, setLoading] = useState(false)
  const [gerado, setGerado] = useState<any>(null)
  const s = (k: string, v: string) => setForm(f=>({...f,[k]:v}))

  async function gerar() {
    if (!form.beneficiario || !form.descricao || !form.valor) return alert('Preencha os campos obrigatórios')
    setLoading(true)
    const recibo = { numero: gerarNumeroRecibo(), data: form.data, beneficiario: form.beneficiario, descricao: form.descricao, valor: parseFloat(form.valor), tipo: form.tipo, observacao: form.observacao||undefined }
    const { data } = await supabase.from('recibos').insert(recibo).select().single()
    if (data) { setGerado(data); await pdfRecibo(data, config, logoDataUrl) }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold">Gerar Recibo</h3>
          <button onClick={onClose} className="text-gray-400 text-xl">×</button>
        </div>
        {!gerado ? (
          <div className="p-4 space-y-3">
            <div><label className="text-xs text-gray-500 mb-1 block">Beneficiário *</label><input className="input" placeholder="Nome completo" value={form.beneficiario} onChange={e=>s('beneficiario',e.target.value)}/></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Tipo</label>
              <select className="input" value={form.tipo} onChange={e=>s('tipo',e.target.value)}>
                <option value="adiantamento">Adiantamento</option>
                <option value="vale">Vale</option>
                <option value="pagamento">Pagamento</option>
              </select>
            </div>
            <div><label className="text-xs text-gray-500 mb-1 block">Referente a *</label><input className="input" placeholder="Ex: Adiantamento salário Março/2026" value={form.descricao} onChange={e=>s('descricao',e.target.value)}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-500 mb-1 block">Valor (R$) *</label><input className="input" type="number" step="0.01" placeholder="0,00" value={form.valor} onChange={e=>s('valor',e.target.value)}/></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Data</label><input className="input" type="date" value={form.data} onChange={e=>s('data',e.target.value)}/></div>
            </div>
            <div><label className="text-xs text-gray-500 mb-1 block">Observação</label><textarea className="input h-16 resize-none" value={form.observacao} onChange={e=>s('observacao',e.target.value)}/></div>
            <button onClick={gerar} disabled={loading} className="btn-primary w-full py-2.5">{loading?'Gerando...':'Gerar recibo PDF'}</button>
          </div>
        ) : (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-3xl">✓</div>
            <div><p className="font-semibold">Recibo gerado!</p><p className="text-sm text-gray-500 mt-1">Nº {gerado.numero}</p><p className="text-lg font-bold text-blue-600 mt-2">{fmt(gerado.valor)}</p></div>
            <div className="flex gap-2">
              <button onClick={()=>pdfRecibo(gerado,config,logoDataUrl)} className="btn-outline flex-1">Baixar PDF novamente</button>
              <button onClick={()=>{setGerado(null);setForm({beneficiario:'',descricao:'',valor:'',tipo:'adiantamento',data:todayISO(),observacao:''})}} className="btn-primary flex-1">Novo recibo</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
