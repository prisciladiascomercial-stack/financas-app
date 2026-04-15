'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { fmt, fmtDate, MESES, CATS_EMP, CATS_REC_EMP, CATS_PES, CATS_REC_PES, todayISO } from '@/lib/utils'
import {
  exportarCSVGeral, exportarCSVEmpresa, exportarCSVPessoal, exportarCSVReceitas,
  exportarPDFGeral, exportarPDFPorCategoria
} from '@/lib/export'
import StatusBadge from '@/components/StatusBadge'
import AIInput from '@/components/AIInput'
import ReciboModal from '@/components/ReciboModal'
import type {
  Receita, DespesaEmpresa, DespesaPessoal, Pendencia,
  Recibo, Configuracoes, TabName, AIParseResult
} from '@/types'
import {
  LayoutDashboard, TrendingUp, Building2, User, FileText,
  Settings, Plus, Download, FileSpreadsheet, Wand2, Receipt,
  ChevronLeft, ChevronRight, Bell, Upload, AlertCircle
} from 'lucide-react'

const TABS: { id: TabName; label: string; icon: any }[] = [
  { id: 'resumo', label: 'Resumo', icon: LayoutDashboard },
  { id: 'receitas', label: 'Receitas', icon: TrendingUp },
  { id: 'empresa', label: 'Empresa', icon: Building2 },
  { id: 'pessoal', label: 'Pessoal', icon: User },
  { id: 'recibos', label: 'Recibos', icon: Receipt },
  { id: 'config', label: 'Config', icon: Settings },
]

export default function Dashboard() {
  const [tab, setTab] = useState<TabName>('resumo')
  const [mes, setMes] = useState(new Date().getMonth())
  const [ano, setAno] = useState(new Date().getFullYear())
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [empresa, setEmpresa] = useState<DespesaEmpresa[]>([])
  const [pessoal, setPessoal] = useState<DespesaPessoal[]>([])
  const [pendencias, setPendencias] = useState<Pendencia[]>([])
  const [recibos, setRecibos] = useState<Recibo[]>([])
  const [config, setConfig] = useState<Configuracoes>({ id: 1, nome_familia: 'Daniel & Priscila', nome_empresa: 'AG Security', logo_url: null, receita_meta: 0 })
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>()
  const [showAI, setShowAI] = useState<'empresa' | 'pessoal' | 'receita' | null>(null)
  const [showRecibo, setShowRecibo] = useState(false)
  const [online, setOnline] = useState(true)
  const [lastSync, setLastSync] = useState<Date>(new Date())
  const logoInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    const [r, e, p, pend, rec, cfg] = await Promise.all([
      supabase.from('receitas').select('*').eq('mes', mes).eq('ano', ano).order('data'),
      supabase.from('despesas_empresa').select('*').eq('mes', mes).eq('ano', ano).order('vencimento'),
      supabase.from('despesas_pessoal').select('*').eq('mes', mes).eq('ano', ano).order('vencimento'),
      supabase.from('pendencias').select('*').eq('mes', mes).eq('ano', ano).order('vencimento'),
      supabase.from('recibos').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('configuracoes').select('*').eq('id', 1).single(),
    ])
    if (r.data) setReceitas(r.data)
    if (e.data) setEmpresa(e.data)
    if (p.data) setPessoal(p.data)
    if (pend.data) setPendencias(pend.data)
    if (rec.data) setRecibos(rec.data)
    if (cfg.data) setConfig(cfg.data)
    setLastSync(new Date())
  }, [mes, ano])

  useEffect(() => { load() }, [load])

  // Realtime subscriptions
  useEffect(() => {
    const tables = ['receitas', 'despesas_empresa', 'despesas_pessoal', 'pendencias', 'recibos', 'configuracoes']
    const channels = tables.map(table =>
      supabase.channel(`rt-${table}`).on('postgres_changes', { event: '*', schema: 'public', table }, () => load()).subscribe()
    )
    return () => { channels.forEach(c => supabase.removeChannel(c)) }
  }, [load])

  // Monitorar conexão
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  function navMes(d: number) {
    let m = mes + d, a = ano
    if (m < 0) { m = 11; a-- }
    if (m > 11) { m = 0; a++ }
    setMes(m); setAno(a)
  }

  // ── CRUD Receitas ──────────────────────────────────────────────────────────
  async function addReceita(data: Partial<Receita>) {
    await supabase.from('receitas').insert({ ...data, mes, ano })
    load()
  }
  async function updateReceita(id: string, data: Partial<Receita>) {
    await supabase.from('receitas').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id)
    load()
  }
  async function deleteReceita(id: string) {
    await supabase.from('receitas').delete().eq('id', id); load()
  }

  // ── CRUD Empresa ───────────────────────────────────────────────────────────
  async function addEmpresa(data: Partial<DespesaEmpresa>) {
    await supabase.from('despesas_empresa').insert({ ...data, mes, ano }); load()
  }
  async function updateEmpresa(id: string, data: Partial<DespesaEmpresa>) {
    await supabase.from('despesas_empresa').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id); load()
  }
  async function deleteEmpresa(id: string) {
    await supabase.from('despesas_empresa').delete().eq('id', id); load()
  }
  async function baixarEmpresa(id: string, jaEhPago: boolean) {
    if (jaEhPago) {
      await updateEmpresa(id, { pago: false, pago_em: null })
    } else {
      await updateEmpresa(id, { pago: true, pago_em: todayISO() })
    }
  }

  // ── CRUD Pessoal ───────────────────────────────────────────────────────────
  async function addPessoal(data: Partial<DespesaPessoal>) {
    await supabase.from('despesas_pessoal').insert({ ...data, mes, ano }); load()
  }
  async function updatePessoal(id: string, data: Partial<DespesaPessoal>) {
    await supabase.from('despesas_pessoal').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id); load()
  }
  async function deletePessoal(id: string) {
    await supabase.from('despesas_pessoal').delete().eq('id', id); load()
  }
  async function baixarPessoal(id: string, jaEhPago: boolean) {
    if (jaEhPago) {
      await updatePessoal(id, { pago: false, pago_em: null })
    } else {
      await updatePessoal(id, { pago: true, pago_em: todayISO() })
    }
  }

  // ── CRUD Pendências ────────────────────────────────────────────────────────
  async function addPendencia(data: Partial<Pendencia>) {
    await supabase.from('pendencias').insert({ ...data, mes, ano }); load()
  }
  async function updatePendencia(id: string, data: Partial<Pendencia>) {
    await supabase.from('pendencias').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id); load()
  }
  async function deletePendencia(id: string) {
    await supabase.from('pendencias').delete().eq('id', id); load()
  }

  // ── Transportar pendentes ──────────────────────────────────────────────────
  async function transportarPendentes() {
    const proximo = mes === 11 ? 0 : mes + 1
    const proxAno = mes === 11 ? ano + 1 : ano
    const pendEmp = empresa.filter(x => !x.pago)
    const pendPes = pessoal.filter(x => !x.pago && x.valor > 0)
    const pendPend = pendencias.filter(x => !x.pago)

    const inserts = [
      ...pendEmp.map(x => ({ vencimento: x.vencimento, descricao: x.descricao, valor: x.valor, pago: false, origem: 'empresa' as const, transportado: true, mes: proximo, ano: proxAno })),
      ...pendPes.map(x => ({ vencimento: x.vencimento, descricao: x.descricao, valor: x.valor, pago: false, origem: 'pessoal' as const, transportado: true, mes: proximo, ano: proxAno })),
      ...pendPend.map(x => ({ vencimento: x.vencimento, descricao: x.descricao, valor: x.valor, pago: false, origem: x.origem, transportado: true, mes: proximo, ano: proxAno })),
    ]
    if (inserts.length === 0) { alert('Não há itens pendentes para transportar.'); return }
    await supabase.from('pendencias').upsert(inserts)
    alert(`${inserts.length} item(ns) transportado(s) para ${MESES[proximo]}/${proxAno}!`)
    load()
  }

  // ── Upload logo ────────────────────────────────────────────────────────────
  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      const url = ev.target?.result as string
      setLogoDataUrl(url)
      await supabase.from('configuracoes').update({ logo_url: url, updated_at: new Date().toISOString() }).eq('id', 1)
    }
    reader.readAsDataURL(file)
  }

  // ── AI Input handler ───────────────────────────────────────────────────────
  async function handleAIConfirm(result: AIParseResult) {
    if (showAI === 'empresa') {
      await addEmpresa({ descricao: result.descricao, categoria: result.categoria, valor: result.valor, vencimento: result.data, observacao: result.observacao, pago: false })
    } else if (showAI === 'pessoal') {
      await addPessoal({ descricao: result.descricao, categoria: result.categoria, valor: result.valor, vencimento: result.data, observacao: result.observacao, pago: false })
    } else if (showAI === 'receita') {
      await addReceita({ descricao: result.descricao, categoria: result.categoria, valor: result.valor, data: result.data, observacao: result.observacao, recebido: false, tipo: 'pessoal' })
    }
    setShowAI(null)
  }

  // ── Totais ─────────────────────────────────────────────────────────────────
  const totalRec = receitas.reduce((a, b) => a + b.valor, 0)
  const totalEmp = empresa.reduce((a, b) => a + b.valor, 0)
  const totalPes = pessoal.filter(x => x.valor > 0).reduce((a, b) => a + b.valor, 0)
  const totalPend = pendencias.filter(x => !x.pago).reduce((a, b) => a + b.valor, 0)
  const saldo = totalRec - totalEmp - totalPes
  const pctComprometido = totalRec > 0 ? Math.min(100, Math.round((totalEmp + totalPes) / totalRec * 100)) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoDataUrl || config.logo_url ? (
              <img src={logoDataUrl || config.logo_url!} alt="Logo" className="w-8 h-8 rounded-full object-cover bg-white"/>
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">AG</div>
            )}
            <div>
              <p className="text-sm font-bold leading-tight">{config.nome_empresa}</p>
              <p className="text-xs text-blue-200 leading-tight">{config.nome_familia}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${online ? 'bg-green-500/30 text-green-100' : 'bg-red-500/30 text-red-100'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-green-300' : 'bg-red-300'}`}/>
              {online ? 'Sincronizado' : 'Offline'}
            </div>
          </div>
        </div>

        {/* Navegação de mês */}
        <div className="max-w-5xl mx-auto px-4 pb-3 flex items-center justify-center gap-3">
          <button onClick={() => navMes(-1)} className="p-1 hover:bg-blue-500 rounded-lg transition-colors">
            <ChevronLeft size={18}/>
          </button>
          <span className="text-sm font-semibold min-w-[130px] text-center">{MESES[mes]} {ano}</span>
          <button onClick={() => navMes(1)} className="p-1 hover:bg-blue-500 rounded-lg transition-colors">
            <ChevronRight size={18}/>
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto flex overflow-x-auto scrollbar-hide border-t border-blue-500">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-all ${tab === t.id ? 'border-white text-white' : 'border-transparent text-blue-200 hover:text-white'}`}>
              <t.icon size={14}/>
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-5">
        {tab === 'resumo' && <TabResumo {...{ totalRec, totalEmp, totalPes, saldo, totalPend, pctComprometido, receitas, empresa, pessoal, pendencias, mes, ano, config, logoDataUrl, exportarCSVGeral, exportarPDFGeral }} setTab={setTab}/>}
        {tab === 'receitas' && <TabReceitas {...{ receitas, mes, ano, config, logoDataUrl }} addReceita={addReceita} updateReceita={updateReceita} deleteReceita={deleteReceita} setShowAI={setShowAI}/>}
        {tab === 'empresa' && <TabEmpresa {...{ empresa, pendencias, mes, ano, config, logoDataUrl }} addEmpresa={addEmpresa} updateEmpresa={updateEmpresa} deleteEmpresa={deleteEmpresa} baixarEmpresa={baixarEmpresa} addPendencia={addPendencia} updatePendencia={updatePendencia} deletePendencia={deletePendencia} transportarPendentes={transportarPendentes} setShowAI={setShowAI}/>}
        {tab === 'pessoal' && <TabPessoal {...{ pessoal, pendencias, mes, ano, config, logoDataUrl }} addPessoal={addPessoal} updatePessoal={updatePessoal} deletePessoal={deletePessoal} baixarPessoal={baixarPessoal} addPendencia={addPendencia} updatePendencia={updatePendencia} deletePendencia={deletePendencia} transportarPendentes={transportarPendentes} setShowAI={setShowAI}/>}
        {tab === 'recibos' && <TabRecibos recibos={recibos} setShowRecibo={setShowRecibo} config={config} logoDataUrl={logoDataUrl}/>}
        {tab === 'config' && <TabConfig config={config} setConfig={setConfig} logoDataUrl={logoDataUrl} logoInputRef={logoInputRef} handleLogo={handleLogo}/>}
      </main>

      {showAI && (
        <AIInput
          categorias={showAI === 'empresa' ? CATS_EMP : showAI === 'receita' ? [...CATS_REC_EMP, ...CATS_REC_PES] : CATS_PES}
          onConfirm={handleAIConfirm}
          onClose={() => setShowAI(null)}
        />
      )}
      {showRecibo && <ReciboModal config={config} logoDataUrl={logoDataUrl} onClose={() => setShowRecibo(false)}/>}
    </div>
  )
}
