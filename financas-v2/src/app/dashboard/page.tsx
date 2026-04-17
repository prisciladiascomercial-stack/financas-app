'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { MESES, CATS_EMP, CATS_REC, CATS_PES, todayISO } from '@/lib/utils'
import type { TabName } from '@/types'

import TabResumo from '@/components/TabResumo'
import TabReceitas from '@/components/TabReceitas'
import TabEmpresa from '@/components/TabEmpresa'
import TabPessoal from '@/components/TabPessoal'
import TabRecibos from '@/components/TabRecibos'
import TabConfig from '@/components/TabConfig'
import AIInput from '@/components/AIInput'
import ReciboModal from '@/components/ReciboModal'

const TABS: { id: TabName; label: string; emoji: string }[] = [
  { id: 'resumo',   label: 'Resumo',   emoji: '📊' },
  { id: 'receitas', label: 'Receitas', emoji: '💰' },
  { id: 'empresa',  label: 'Empresa',  emoji: '🏢' },
  { id: 'pessoal',  label: 'Pessoal',  emoji: '👤' },
  { id: 'recibos',  label: 'Recibos',  emoji: '🧾' },
  { id: 'config',   label: 'Config',   emoji: '⚙️' },
]

export default function Dashboard() {
  const [tab, setTab] = useState<TabName>('resumo')
  const [mes, setMes] = useState(new Date().getMonth())
  const [ano, setAno] = useState(new Date().getFullYear())
  const [receitas, setReceitas] = useState<any[]>([])
  const [empresa, setEmpresa] = useState<any[]>([])
  const [pessoal, setPessoal] = useState<any[]>([])
  const [pendencias, setPendencias] = useState<any[]>([])
  const [recibos, setRecibos] = useState<any[]>([])
  const [config, setConfig] = useState<any>({ id:1, nome_familia:'Daniel & Priscila', nome_empresa:'AG Security', logo_url:null, receita_meta:0 })
  const [logoDataUrl, setLogoDataUrl] = useState<string|undefined>()
  const [showAI, setShowAI] = useState<'empresa'|'pessoal'|'receita'|null>(null)
  const [showRecibo, setShowRecibo] = useState(false)
  const [online, setOnline] = useState(true)
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
    if (cfg.data) {
      setConfig(cfg.data)
      if (cfg.data.logo_url) setLogoDataUrl(cfg.data.logo_url)
    }
  }, [mes, ano])

  useEffect(() => { load() }, [load])

  // Realtime — qualquer mudança de qualquer usuário atualiza a tela
  useEffect(() => {
    const tables = ['receitas','despesas_empresa','despesas_pessoal','pendencias','recibos','configuracoes']
    const channels = tables.map(table =>
      supabase.channel(`rt-${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => load())
        .subscribe()
    )
    return () => { channels.forEach(c => supabase.removeChannel(c)) }
  }, [load])

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

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const addReceita    = async (data: any) => { await supabase.from('receitas').insert({...data,mes,ano}); load() }
  const updateReceita = async (id: string, data: any) => { await supabase.from('receitas').update({...data,updated_at:new Date().toISOString()}).eq('id',id); load() }
  const deleteReceita = async (id: string) => { await supabase.from('receitas').delete().eq('id',id); load() }

  const addEmpresa    = async (data: any) => { await supabase.from('despesas_empresa').insert({...data,mes,ano}); load() }
  const updateEmpresa = async (id: string, data: any) => { await supabase.from('despesas_empresa').update({...data,updated_at:new Date().toISOString()}).eq('id',id); load() }
  const deleteEmpresa = async (id: string) => { await supabase.from('despesas_empresa').delete().eq('id',id); load() }
  const baixarEmpresa = async (id: string, jaEhPago: boolean) => {
    await updateEmpresa(id, { pago: !jaEhPago, pago_em: !jaEhPago ? todayISO() : null })
  }

  const addPessoal    = async (data: any) => { await supabase.from('despesas_pessoal').insert({...data,mes,ano}); load() }
  const updatePessoal = async (id: string, data: any) => { await supabase.from('despesas_pessoal').update({...data,updated_at:new Date().toISOString()}).eq('id',id); load() }
  const deletePessoal = async (id: string) => { await supabase.from('despesas_pessoal').delete().eq('id',id); load() }
  const baixarPessoal = async (id: string, jaEhPago: boolean) => {
    await updatePessoal(id, { pago: !jaEhPago, pago_em: !jaEhPago ? todayISO() : null })
  }

  const addPendencia    = async (data: any) => { await supabase.from('pendencias').insert({...data,mes,ano}); load() }
  const updatePendencia = async (id: string, data: any) => { await supabase.from('pendencias').update({...data,updated_at:new Date().toISOString()}).eq('id',id); load() }
  const deletePendencia = async (id: string) => { await supabase.from('pendencias').delete().eq('id',id); load() }

  async function transportarPendentes() {
    const prox = mes === 11 ? 0 : mes + 1
    const proxAno = mes === 11 ? ano + 1 : ano
    const inserts = [
      ...empresa.filter(x=>!x.pago).map(x=>({ vencimento:x.vencimento, descricao:x.descricao, valor:x.valor, pago:false, origem:'empresa', transportado:true, mes:prox, ano:proxAno })),
      ...pessoal.filter(x=>!x.pago&&x.valor>0).map(x=>({ vencimento:x.vencimento, descricao:x.descricao, valor:x.valor, pago:false, origem:'pessoal', transportado:true, mes:prox, ano:proxAno })),
      ...pendencias.filter(x=>!x.pago).map(x=>({ vencimento:x.vencimento, descricao:x.descricao, valor:x.valor, pago:false, origem:x.origem, transportado:true, mes:prox, ano:proxAno })),
    ]
    if (inserts.length === 0) { alert('Não há itens pendentes para transportar.'); return }
    await supabase.from('pendencias').insert(inserts)
    alert(`✓ ${inserts.length} item(ns) transportado(s) para ${MESES[prox]}/${proxAno}!`)
    load()
  }

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      const url = ev.target?.result as string
      setLogoDataUrl(url)
      await supabase.from('configuracoes').update({ logo_url: url, updated_at: new Date().toISOString() }).eq('id', 1)
    }
    reader.readAsDataURL(file)
  }

  async function handleAIConfirm(result: any) {
    if (showAI === 'empresa') await addEmpresa({ descricao:result.descricao, categoria:result.categoria, valor:result.valor, vencimento:result.data, observacao:result.observacao, pago:false })
    else if (showAI === 'pessoal') await addPessoal({ descricao:result.descricao, categoria:result.categoria, valor:result.valor, vencimento:result.data, observacao:result.observacao, pago:false })
    else if (showAI === 'receita') await addReceita({ descricao:result.descricao, categoria:result.categoria, valor:result.valor, data:result.data, observacao:result.observacao, recebido:false, tipo:'pessoal' })
    setShowAI(null)
  }

  // Totais
  const totalRec = receitas.reduce((a,b)=>a+b.valor,0)
  const totalEmp = empresa.reduce((a,b)=>a+b.valor,0)
  const totalPes = pessoal.filter(x=>x.valor>0).reduce((a,b)=>a+b.valor,0)
  const totalPend = pendencias.filter(x=>!x.pago).reduce((a,b)=>a+b.valor,0)
  const saldo = totalRec - totalEmp - totalPes
  const pctComprometido = totalRec > 0 ? Math.min(100, Math.round((totalEmp+totalPes)/totalRec*100)) : 0

  const aiCats = showAI === 'empresa' ? CATS_EMP : showAI === 'receita' ? CATS_REC : CATS_PES

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-blue-600 text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {(logoDataUrl || config.logo_url) ? (
              <img src={logoDataUrl||config.logo_url} alt="Logo" className="w-9 h-9 rounded-full object-cover bg-white border-2 border-white/30"/>
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold border-2 border-white/30">AG</div>
            )}
            <div>
              <p className="text-sm font-bold leading-tight">{config.nome_empresa}</p>
              <p className="text-xs text-blue-200 leading-tight">{config.nome_familia}</p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${online?'bg-green-500/30 text-green-100':'bg-red-500/30 text-red-100'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${online?'bg-green-300 animate-pulse':'bg-red-300'}`}/>
            {online ? 'Online' : 'Offline'}
          </div>
        </div>

        {/* Navegação de mês */}
        <div className="max-w-5xl mx-auto px-4 pb-2 flex items-center justify-center gap-4">
          <button onClick={()=>navMes(-1)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-blue-500 transition-colors text-lg">‹</button>
          <span className="text-sm font-semibold min-w-[140px] text-center">{MESES[mes]} {ano}</span>
          <button onClick={()=>navMes(1)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-blue-500 transition-colors text-lg">›</button>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto flex overflow-x-auto border-t border-blue-500/50">
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${tab===t.id?'border-white text-white':'border-transparent text-blue-200 hover:text-white hover:bg-blue-500/30'}`}>
              <span style={{fontSize:13}}>{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Conteúdo ── */}
      <main className="max-w-5xl mx-auto px-4 py-5">
        {tab==='resumo'   && <TabResumo totalRec={totalRec} totalEmp={totalEmp} totalPes={totalPes} saldo={saldo} totalPend={totalPend} pctComprometido={pctComprometido} receitas={receitas} empresa={empresa} pessoal={pessoal} pendencias={pendencias} mes={mes} ano={ano} config={config} logoDataUrl={logoDataUrl} setTab={setTab}/>}
        {tab==='receitas' && <TabReceitas receitas={receitas} mes={mes} ano={ano} config={config} logoDataUrl={logoDataUrl} addReceita={addReceita} updateReceita={updateReceita} deleteReceita={deleteReceita} setShowAI={setShowAI}/>}
        {tab==='empresa'  && <TabEmpresa empresa={empresa} pendencias={pendencias} mes={mes} ano={ano} config={config} logoDataUrl={logoDataUrl} addEmpresa={addEmpresa} updateEmpresa={updateEmpresa} deleteEmpresa={deleteEmpresa} baixarEmpresa={baixarEmpresa} addPendencia={addPendencia} updatePendencia={updatePendencia} deletePendencia={deletePendencia} transportarPendentes={transportarPendentes} setShowAI={setShowAI}/>}
        {tab==='pessoal'  && <TabPessoal pessoal={pessoal} pendencias={pendencias} mes={mes} ano={ano} config={config} logoDataUrl={logoDataUrl} addPessoal={addPessoal} updatePessoal={updatePessoal} deletePessoal={deletePessoal} baixarPessoal={baixarPessoal} addPendencia={addPendencia} updatePendencia={updatePendencia} deletePendencia={deletePendencia} transportarPendentes={transportarPendentes} setShowAI={setShowAI}/>}
        {tab==='recibos'  && <TabRecibos recibos={recibos} setShowRecibo={setShowRecibo} config={config} logoDataUrl={logoDataUrl}/>}
        {tab==='config'   && <TabConfig config={config} setConfig={setConfig} logoDataUrl={logoDataUrl} logoInputRef={logoInputRef} handleLogo={handleLogo}/>}
      </main>

      {showAI && <AIInput categorias={aiCats} onConfirm={handleAIConfirm} onClose={()=>setShowAI(null)}/>}
      {showRecibo && <ReciboModal config={config} logoDataUrl={logoDataUrl} onClose={()=>setShowRecibo(false)}/>}
    </div>
  )
}
