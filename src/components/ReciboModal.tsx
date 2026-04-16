'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { gerarPDFRecibo, } from '@/lib/export'
import { gerarNumeroRecibo, todayISO } from '@/lib/utils'
import type { Recibo, Configuracoes } from '@/types'

interface Props {
  config: Configuracoes
  logoDataUrl?: string
  onClose: () => void
}

export default function ReciboModal({ config, logoDataUrl, onClose }: Props) {
  const [form, setForm] = useState({
    beneficiario: '',
    descricao: '',
    valor: '',
    tipo: 'adiantamento' as Recibo['tipo'],
    data: todayISO(),
    observacao: ''
  })
  const [loading, setLoading] = useState(false)
  const [gerado, setGerado] = useState<Recibo | null>(null)

  const set = (k: string, v: string) => setForm(f => ({...f, [k]: v}))

  async function gerar() {
    if (!form.beneficiario || !form.descricao || !form.valor) return
    setLoading(true)
    const recibo: Omit<Recibo, 'id'> = {
      numero: gerarNumeroRecibo(),
      data: form.data,
      beneficiario: form.beneficiario,
      descricao: form.descricao,
      valor: parseFloat(form.valor),
      tipo: form.tipo,
      observacao: form.observacao || undefined
    }
    const { data } = await supabase.from('recibos').insert(recibo).select().single()
    if (data) {
      setGerado(data)
      await gerarPDFRecibo(data, config, logoDataUrl)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Gerar Recibo</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400"/></button>
        </div>

        {!gerado ? (
          <div className="p-4 space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Beneficiário *</label>
              <input className="input" placeholder="Nome completo" value={form.beneficiario} onChange={e => set('beneficiario', e.target.value)}/>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Tipo</label>
              <select className="input" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                <option value="adiantamento">Adiantamento</option>
                <option value="vale">Vale</option>
                <option value="pagamento">Pagamento</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Referente a *</label>
              <input className="input" placeholder="Ex: Adiantamento de salário — Março/2026" value={form.descricao} onChange={e => set('descricao', e.target.value)}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Valor (R$) *</label>
                <input className="input" type="number" step="0.01" placeholder="0,00" value={form.valor} onChange={e => set('valor', e.target.value)}/>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Data</label>
                <input className="input" type="date" value={form.data} onChange={e => set('data', e.target.value)}/>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Observação</label>
              <textarea className="input h-16 resize-none" placeholder="Detalhes adicionais..." value={form.observacao} onChange={e => set('observacao', e.target.value)}/>
            </div>
            <button onClick={gerar} disabled={loading} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
              {loading ? 'Gerando...' : 'Gerar recibo PDF'}
            </button>
          </div>
        ) : (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl">✓</span>
            </div>
            <div>
              <p className="font-semibold text-gray-800">Recibo gerado com sucesso!</p>
              <p className="text-sm text-gray-500 mt-1">Nº {gerado.numero}</p>
              <p className="text-lg font-bold text-blue-600 mt-2">
                R$ {gerado.valor.toLocaleString('pt-BR', {minimumFractionDigits:2})}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => gerarPDFRecibo(gerado, config, logoDataUrl)} className="btn-outline flex-1">Baixar PDF novamente</button>
              <button onClick={() => { setGerado(null); setForm({beneficiario:'',descricao:'',valor:'',tipo:'adiantamento',data:todayISO(),observacao:''}) }} className="btn-primary flex-1">Novo recibo</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
