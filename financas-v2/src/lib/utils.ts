export const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export const CATS_EMP = ['Funcionário','Impostos','Contabilidade','Internet/Tel','Aluguel','Equipamentos','Outros']
export const CATS_REC = ['Faturamento','Serviços','Comissão','Pró-labore','Salário','Investimento','Outros']
export const CATS_PES = ['Moradia','Alimentação','Transporte','Escola/Pensão','Cartões','Saúde','Lazer','Vestuário','Outros']

export function fmt(v: number | null | undefined): string {
  return 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function fmtDateShort(d: string | null | undefined): string {
  if (!d) return '—'
  const p = d.split('-')
  if (p.length === 3) return `${p[2]}/${p[1]}`
  return d
}

export function fmtDateFull(d: string | null | undefined): string {
  if (!d) return '—'
  const p = d.split('-')
  if (p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`
  return d
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function diasAteVencer(venc: string | null): number | null {
  if (!venc) return null
  const v = new Date(venc)
  const t = new Date(); t.setHours(0, 0, 0, 0)
  return Math.ceil((v.getTime() - t.getTime()) / 86400000)
}

export function statusInfo(pago: boolean, venc: string | null): { label: string; cls: string } {
  if (pago) return { label: 'Pago', cls: 'badge-green' }
  const d = diasAteVencer(venc)
  if (d === null) return { label: 'Pendente', cls: 'badge-yellow' }
  if (d < 0) return { label: `${Math.abs(d)}d atraso`, cls: 'badge-red' }
  if (d === 0) return { label: 'Hoje!', cls: 'badge-orange' }
  if (d <= 5) return { label: `${d}d`, cls: 'badge-yellow' }
  return { label: 'Pendente', cls: 'badge-gray' }
}

export function gerarNumeroRecibo(): string {
  const d = new Date()
  return `REC-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${String(Math.floor(Math.random()*9000)+1000)}`
}

export function valorPorExtenso(valor: number): string {
  const inteiro = Math.floor(valor)
  const centavos = Math.round((valor - inteiro) * 100)
  const un = ['','um','dois','três','quatro','cinco','seis','sete','oito','nove']
  const esp = ['dez','onze','doze','treze','quatorze','quinze','dezesseis','dezessete','dezoito','dezenove']
  const dez = ['','','vinte','trinta','quarenta','cinquenta','sessenta','setenta','oitenta','noventa']
  const cen = ['','cem','duzentos','trezentos','quatrocentos','quinhentos','seiscentos','setecentos','oitocentos','novecentos']
  function conv(n: number): string {
    if (n === 0) return ''
    if (n === 100) return 'cem'
    if (n < 10) return un[n]
    if (n < 20) return esp[n - 10]
    if (n < 100) return dez[Math.floor(n/10)] + (n%10 ? ' e ' + un[n%10] : '')
    return cen[Math.floor(n/100)] + (n%100 ? ' e ' + conv(n%100) : '')
  }
  function convG(n: number): string {
    if (n >= 1000000) { const m = Math.floor(n/1000000); return conv(m) + (m===1?' milhão':' milhões') + (n%1000000 ? ' e ' + convG(n%1000000) : '') }
    if (n >= 1000) { const m = Math.floor(n/1000); return conv(m) + ' mil' + (n%1000 ? ' e ' + convG(n%1000) : '') }
    return conv(n)
  }
  const pi = inteiro === 0 ? 'zero reais' : convG(inteiro) + (inteiro === 1 ? ' real' : ' reais')
  const pc = centavos > 0 ? ` e ${conv(centavos)} centavo${centavos !== 1 ? 's' : ''}` : ''
  const r = pi + pc
  return r.charAt(0).toUpperCase() + r.slice(1)
}
