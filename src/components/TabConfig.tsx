'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TabConfig({ config, setConfig, logoDataUrl, logoInputRef, handleLogo }: any) {
  const [form, setForm] = useState({ ...config })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const sf = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  async function save() {
    setSaving(true)
    await supabase.from('configuracoes').update({
      nome_familia: form.nome_familia,
      nome_empresa: form.nome_empresa,
      receita_meta: form.receita_meta,
      updated_at: new Date().toISOString()
    }).eq('id', 1)
    setConfig(form)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="max-w-lg space-y-4">
      <h3 className="text-base font-semibold">Configurações</h3>

      <div className="card space-y-4">
        <h4 className="text-sm font-medium text-gray-700 border-b border-gray-100 pb-2">Identidade</h4>

        <div>
          <label className="text-xs text-gray-500 mb-2 block">Logo da empresa</label>
          <div className="flex items-center gap-4">
            {(logoDataUrl || config.logo_url) ? (
              <img
                src={logoDataUrl || config.logo_url}
                alt="Logo"
                className="w-16 h-16 rounded-xl object-cover border border-gray-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-blue-50 border-2 border-dashed border-blue-200 flex items-center justify-center text-blue-400 text-xs font-bold">
                AG
              </div>
            )}
            <div>
              <button onClick={() => logoInputRef.current?.click()} className="btn-outline text-sm">
                {logoDataUrl || config.logo_url ? 'Trocar logo' : 'Adicionar logo'}
              </button>
              <p className="text-xs text-gray-400 mt-1">PNG ou JPG — aparece no cabeçalho e nos PDFs</p>
            </div>
          </div>
          <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Nome da família</label>
          <input className="input" value={form.nome_familia} onChange={e => sf('nome_familia', e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Nome da empresa</label>
          <input className="input" value={form.nome_empresa} onChange={e => sf('nome_empresa', e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Meta de receita mensal (R$)</label>
          <input type="number" className="input" placeholder="Ex: 20000" value={form.receita_meta || ''} onChange={e => sf('receita_meta', parseFloat(e.target.value) || 0)} />
        </div>
      </div>

      <div className="card bg-blue-50 border-blue-100">
        <h4 className="text-sm font-medium text-gray-800 mb-2">🔗 Compartilhar com seu marido</h4>
        <p className="text-sm text-gray-600 mb-3">
          Basta enviar o link do app pelo WhatsApp. Qualquer pessoa com o link acessa e edita em tempo real — os dados sincronizam automaticamente via Supabase.
        </p>
        <div className="bg-white rounded-lg border border-blue-200 p-3">
          <p className="text-xs text-gray-500 mb-1">URL do app (após deploy no Vercel)</p>
          <p className="text-sm font-mono text-blue-600 break-all">https://financas-familia.vercel.app</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">No celular: abrir link → menu do navegador → "Adicionar à tela inicial" para virar ícone de app.</p>
      </div>

      <div className="card">
        <h4 className="text-sm font-medium text-gray-700 mb-2">📋 Categorias disponíveis</h4>
        <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
          <div>
            <p className="font-medium text-gray-700 mb-1">Empresa (AG Security)</p>
            <ul className="space-y-0.5">
              {['Funcionário','Impostos','Contabilidade','Internet/Tel','Aluguel','Equipamentos','Outros'].map(c=><li key={c}>• {c}</li>)}
            </ul>
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-1">Pessoal</p>
            <ul className="space-y-0.5">
              {['Moradia','Alimentação','Transporte','Escola/Pensão','Cartões','Saúde','Lazer','Vestuário','Outros'].map(c=><li key={c}>• {c}</li>)}
            </ul>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">Para adicionar categorias, edite o arquivo <code className="bg-gray-100 px-1 rounded">src/lib/utils.ts</code> e faça novo deploy.</p>
      </div>

      <button onClick={save} disabled={saving} className="btn-primary px-8 py-2.5">
        {saving ? 'Salvando...' : saved ? '✓ Salvo com sucesso!' : 'Salvar configurações'}
      </button>
    </div>
  )
}
