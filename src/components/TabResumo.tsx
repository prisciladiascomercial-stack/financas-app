'use client'
import { fmt, MESES, diasAteVencer } from '@/lib/utils'
import { csvGeral, pdfGeral } from '@/lib/export'

export default function TabResumo({ totalRec, totalEmp, totalPes, saldo, totalPend, pctComprometido, receitas, empresa, pessoal, pendencias, mes, ano, config, logoDataUrl, setTab }: any) {
  const today = new Date(); today.setHours(0,0,0,0)
  const alertas = [
    ...empresa.filter((x:any)=>!x.pago),
    ...pessoal.filter((x:any)=>!x.pago&&x.valor>0),
    ...pendencias.filter((x:any)=>!x.pago)
  ].map((x:any)=>({...x, dias: x.vencimento ? Math.ceil((new Date(x.vencimento).getTime()-today.getTime())/86400000) : 999}))
   .sort((a:any,b:any)=>a.dias-b.dias).slice(0,7)

  const barColor = pctComprometido>90?'bg-red-500':pctComprometido>70?'bg-yellow-500':'bg-green-500'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {l:'Receitas',v:totalRec,c:'text-green-700',bg:'bg-green-50'},
          {l:'Desp. Empresa',v:totalEmp,c:'text-blue-700',bg:'bg-blue-50'},
          {l:'Desp. Pessoal',v:totalPes,c:'text-amber-700',bg:'bg-amber-50'},
          {l:'Saldo Líquido',v:saldo,c:saldo>=0?'text-green-700':'text-red-700',bg:saldo>=0?'bg-green-50':'bg-red-50'},
        ].map(m=>(
          <div key={m.l} className={`${m.bg} rounded-xl p-4`}>
            <p className="text-xs text-gray-500 mb-1">{m.l}</p>
            <p className={`text-lg font-bold ${m.c}`}>{fmt(m.v)}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Comprometimento da receita</span>
          <span className={`text-sm font-bold ${pctComprometido>90?'text-red-600':pctComprometido>70?'text-yellow-600':'text-green-600'}`}>{pctComprometido}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full ${barColor} rounded-full transition-all`} style={{width:`${pctComprometido}%`}}/>
        </div>
        {totalPend>0&&<p className="text-xs text-amber-700 mt-2">⚠ Pendências acumuladas: {fmt(totalPend)}</p>}
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold">Próximas obrigações</h3>
          <button onClick={()=>setTab('empresa')} className="text-xs text-blue-600">Ver todas →</button>
        </div>
        {alertas.length===0?<p className="text-sm text-gray-400 text-center py-4">Sem pendências!</p>:alertas.map((a:any,i:number)=>{
          const cor=a.dias<0?'text-red-600 bg-red-50':a.dias<=3?'text-amber-700 bg-amber-50':'text-gray-600 bg-gray-50'
          const label=a.dias<0?`${Math.abs(a.dias)}d atrasado`:a.dias===0?'Hoje':`${a.dias}d`
          return (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{a.descricao}</p><p className="text-xs text-gray-400">{a.categoria||a.origem||''}</p></div>
              <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                <span className="text-sm font-semibold">{fmt(a.valor)}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cor}`}>{label}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold mb-3">Exportar — {MESES[mes]}/{ano}</h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={()=>csvGeral(receitas,empresa,pessoal,pendencias,mes,ano)} className="btn-outline text-xs">📊 CSV Geral</button>
          <button onClick={()=>pdfGeral(receitas,empresa,pessoal,pendencias,mes,ano,config,logoDataUrl)} className="btn-outline text-xs">📄 PDF Geral</button>
        </div>
      </div>
    </div>
  )
}
