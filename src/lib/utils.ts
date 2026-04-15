export const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export const CATS_EMP = ['Funcionário','Impostos','Contabilidade','Internet/Tel','Aluguel','Equipamentos','Outros']
export const CATS_REC_EMP = ['Faturamento','Serviços','Comissão','Outros']
export const CATS_PES = ['Moradia','Alimentação','Transporte','Escola/Pensão','Cartões','Saúde','Lazer','Vestuário','Outros']
export const CATS_REC_PES = ['Pró-labore','Salário','Investimento','Outros']

export function fmt(v: number | null | undefined): string {
  return 'R$ ' + Number(v || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  })
}

export function fmtDate(d: string | null | undefined): string {
  if (!d) return '—'
  const p = d.split('-')
  if (p.length === 3) return `${p[2]}/${p[1]}/${p[0].slice(2)}`
  return d
}

export function fmtDateShort(d: string | null | undefined): string {
  if (!d) return '—'
  const p = d.split('-')
  if (p.length === 3) return `${p[2]}/${p[1]}`
  return d
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function diasAteVencer(venc: string | null): number | null {
  if (!venc) return null
  const v = new Date(venc)
  const t = new Date(); t.setHours(0,0,0,0)
  return Math.ceil((v.getTime() - t.getTime()) / 86400000)
}

export function statusLabel(pago: boolean, venc: string | null): { label: string; color: string } {
  if (pago) return { label: 'Pago', color: 'green' }
  const d = diasAteVencer(venc)
  if (d === null) return { label: 'Pendente', color: 'yellow' }
  if (d < 0) return { label: `${Math.abs(d)}d atraso`, color: 'red' }
  if (d === 0) return { label: 'Vence hoje', color: 'orange' }
  if (d <= 5) return { label: `${d}d`, color: 'yellow' }
  return { label: 'Pendente', color: 'gray' }
}

export function clsx(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function gerarNumeroRecibo(): string {
  const d = new Date()
  return `REC-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${String(Math.floor(Math.random()*9000)+1000)}`
}

export function valorPorExtenso(valor: number): string {
  const inteiro = Math.floor(valor)
  const centavos = Math.round((valor - inteiro) * 100)
  const unidades = ['','um','dois','três','quatro','cinco','seis','sete','oito','nove']
  const especiais = ['dez','onze','doze','treze','quatorze','quinze','dezesseis','dezessete','dezoito','dezenove']
  const dezenas = ['','','vinte','trinta','quarenta','cinquenta','sessenta','setenta','oitenta','noventa']
  const centenas = ['','cem','duzentos','trezentos','quatrocentos','quinhentos','seiscentos','setecentos','oitocentos','novecentos']

  function converter(n: number): string {
    if (n === 0) return ''
    if (n === 100) return 'cem'
    if (n < 10) return unidades[n]
    if (n < 20) return especiais[n - 10]
    if (n < 100) {
      const d = Math.floor(n / 10), u = n % 10
      return dezenas[d] + (u ? ' e ' + unidades[u] : '')
    }
    const c = Math.floor(n / 100), resto = n % 100
    return centenas[c] + (resto ? ' e ' + converter(resto) : '')
  }

  function converterGrande(n: number): string {
    if (n >= 1000000) {
      const m = Math.floor(n / 1000000)
      const r = n % 1000000
      return converter(m) + (m === 1 ? ' milhão' : ' milhões') + (r ? ' e ' + converterGrande(r) : '')
    }
    if (n >= 1000) {
      const m = Math.floor(n / 1000)
      const r = n % 1000
      return converter(m) + ' mil' + (r ? ' e ' + converterGrande(r) : '')
    }
    return converter(n)
  }

  const parteInteira = inteiro === 0 ? 'zero reais' : converterGrande(inteiro) + (inteiro === 1 ? ' real' : ' reais')
  const parteCentavos = centavos > 0 ? ` e ${converter(centavos)} centavo${centavos !== 1 ? 's' : ''}` : ''
  return (parteInteira + parteCentavos).charAt(0).toUpperCase() + (parteInteira + parteCentavos).slice(1)
}
