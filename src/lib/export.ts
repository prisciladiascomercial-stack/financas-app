import { fmt, fmtDate, MESES, valorPorExtenso } from './utils'
import type { DespesaEmpresa, DespesaPessoal, Receita, Pendencia, Recibo, Configuracoes } from '@/types'

// ─── CSV ──────────────────────────────────────────────────────────────────────

function toCSV(headers: string[], rows: (string | number)[][]): string {
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  return [headers, ...rows].map(r => r.map(escape).join(',')).join('\n')
}

function downloadCSV(content: string, filename: string) {
  const bom = '\uFEFF'
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export function exportarCSVEmpresa(dados: DespesaEmpresa[], mes: number, ano: number) {
  const headers = ['Vencimento','Descrição','Categoria','Valor','Pago','Data Pagamento','Observação']
  const rows = dados.map(d => [
    fmtDate(d.vencimento), d.descricao, d.categoria,
    d.valor, d.pago ? 'Sim' : 'Não', fmtDate(d.pago_em), d.observacao || ''
  ])
  downloadCSV(toCSV(headers, rows), `despesas_empresa_${MESES[mes]}_${ano}.csv`)
}

export function exportarCSVPessoal(dados: DespesaPessoal[], mes: number, ano: number) {
  const headers = ['Vencimento','Descrição','Categoria','Valor','Cartão','Pago','Data Pagamento','Observação']
  const rows = dados.map(d => [
    fmtDate(d.vencimento), d.descricao, d.categoria,
    d.valor, d.cartao || '', d.pago ? 'Sim' : 'Não', fmtDate(d.pago_em), d.observacao || ''
  ])
  downloadCSV(toCSV(headers, rows), `despesas_pessoal_${MESES[mes]}_${ano}.csv`)
}

export function exportarCSVReceitas(dados: Receita[], mes: number, ano: number) {
  const headers = ['Data','Descrição','Categoria','Valor','Recebido','Observação']
  const rows = dados.map(d => [
    fmtDate(d.data), d.descricao, d.categoria,
    d.valor, d.recebido ? 'Sim' : 'Não', d.observacao || ''
  ])
  downloadCSV(toCSV(headers, rows), `receitas_${MESES[mes]}_${ano}.csv`)
}

export function exportarCSVGeral(
  receitas: Receita[], empresa: DespesaEmpresa[],
  pessoal: DespesaPessoal[], pendencias: Pendencia[],
  mes: number, ano: number
) {
  const totalRec = receitas.reduce((a,b) => a+b.valor, 0)
  const totalEmp = empresa.reduce((a,b) => a+b.valor, 0)
  const totalPes = pessoal.reduce((a,b) => a+b.valor, 0)
  const totalPend = pendencias.filter(p=>!p.pago).reduce((a,b) => a+b.valor, 0)

  const headers = ['Tipo','Data/Venc','Descrição','Categoria','Valor','Status','Observação']
  const rows: (string|number)[][] = [
    ...receitas.map(r => ['Receita', fmtDate(r.data), r.descricao, r.categoria, r.valor, r.recebido?'Recebido':'Pendente', r.observacao||'']),
    ...empresa.map(r => ['Empresa', fmtDate(r.vencimento), r.descricao, r.categoria, r.valor, r.pago?'Pago':'Pendente', r.observacao||'']),
    ...pessoal.map(r => ['Pessoal', fmtDate(r.vencimento), r.descricao, r.categoria, r.valor, r.pago?'Pago':'Pendente', r.observacao||'']),
    ...pendencias.map(r => ['Pendência', fmtDate(r.vencimento), r.descricao, r.origem, r.valor, r.pago?'Pago':'Pendente', r.observacao||'']),
    [],
    ['RESUMO','','','','','',''],
    ['Total Receitas','','','',totalRec,'',''],
    ['Total Empresa','','','',totalEmp,'',''],
    ['Total Pessoal','','','',totalPes,'',''],
    ['Pendências','','','',totalPend,'',''],
    ['Saldo Líquido','','','',totalRec-totalEmp-totalPes,'',''],
  ]
  downloadCSV(toCSV(headers, rows), `relatorio_geral_${MESES[mes]}_${ano}.csv`)
}

// ─── PDF ──────────────────────────────────────────────────────────────────────

async function getPDF() {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  return { jsPDF, autoTable }
}

function addHeader(doc: any, config: Configuracoes, titulo: string, subtitulo: string, logoDataUrl?: string) {
  const pageW = doc.internal.pageSize.getWidth()
  doc.setFillColor(26, 86, 219)
  doc.rect(0, 0, pageW, 28, 'F')

  if (logoDataUrl) {
    try { doc.addImage(logoDataUrl, 'PNG', 10, 4, 20, 20) } catch {}
  }

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14); doc.setFont(undefined as any, 'bold')
  doc.text(config.nome_empresa, logoDataUrl ? 34 : 14, 11)
  doc.setFontSize(9); doc.setFont(undefined as any, 'normal')
  doc.text(config.nome_familia, logoDataUrl ? 34 : 14, 18)

  doc.setFontSize(12); doc.setFont(undefined as any, 'bold')
  doc.text(titulo, pageW - 14, 11, { align: 'right' })
  doc.setFontSize(9); doc.setFont(undefined as any, 'normal')
  doc.text(subtitulo, pageW - 14, 18, { align: 'right' })

  doc.setTextColor(0, 0, 0)
  return 34
}

function addFooter(doc: any) {
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  doc.setFontSize(8); doc.setTextColor(150)
  doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, pageH - 8)
  doc.text(`Pág ${doc.internal.getCurrentPageInfo().pageNumber}`, pageW - 14, pageH - 8, { align: 'right' })
  doc.setTextColor(0)
}

export async function exportarPDFGeral(
  receitas: Receita[], empresa: DespesaEmpresa[],
  pessoal: DespesaPessoal[], pendencias: Pendencia[],
  mes: number, ano: number, config: Configuracoes, logoDataUrl?: string
) {
  const { jsPDF, autoTable } = await getPDF()
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const titulo = `Relatório ${MESES[mes]}/${ano}`

  let y = addHeader(doc, config, 'Relatório Geral', titulo, logoDataUrl)

  const totalRec = receitas.reduce((a,b)=>a+b.valor,0)
  const totalEmp = empresa.reduce((a,b)=>a+b.valor,0)
  const totalPes = pessoal.reduce((a,b)=>a+b.valor,0)
  const saldo = totalRec - totalEmp - totalPes

  // Cards de resumo
  const cards = [
    { label: 'Receitas', valor: totalRec, cor: [5, 122, 85] },
    { label: 'Desp. Empresa', valor: totalEmp, cor: [26, 86, 219] },
    { label: 'Desp. Pessoal', valor: totalPes, cor: [133, 79, 11] },
    { label: 'Saldo Líquido', valor: saldo, cor: saldo >= 0 ? [5,122,85] : [224,36,36] },
  ]
  const cardW = 44, gap = 2, startX = 14
  cards.forEach((c, i) => {
    const x = startX + i * (cardW + gap)
    doc.setFillColor(245, 247, 255)
    doc.roundedRect(x, y, cardW, 18, 2, 2, 'F')
    doc.setFontSize(7); doc.setTextColor(100)
    doc.text(c.label, x + 3, y + 6)
    doc.setFontSize(10); doc.setFont(undefined as any, 'bold')
    doc.setTextColor(c.cor[0], c.cor[1], c.cor[2])
    doc.text(fmt(c.valor), x + 3, y + 14)
    doc.setFont(undefined as any, 'normal'); doc.setTextColor(0)
  })
  y += 24

  // Receitas
  doc.setFontSize(11); doc.setFont(undefined as any, 'bold')
  doc.text('Receitas', 14, y); y += 3
  autoTable(doc, {
    startY: y,
    head: [['Data','Descrição','Categoria','Valor','Status']],
    body: receitas.map(r => [fmtDate(r.data), r.descricao, r.categoria, fmt(r.valor), r.recebido?'Recebido':'Pendente']),
    foot: [['','','Total', fmt(totalRec), '']],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [26,86,219] },
    footStyles: { fillColor: [235,245,255], textColor: [26,86,219], fontStyle: 'bold' },
    theme: 'striped'
  })
  y = (doc as any).lastAutoTable.finalY + 8

  // Despesas Empresa
  if (y > 230) { doc.addPage(); y = 14 }
  doc.setFontSize(11); doc.setFont(undefined as any, 'bold')
  doc.text('Despesas Empresa', 14, y); y += 3
  autoTable(doc, {
    startY: y,
    head: [['Venc.','Descrição','Categoria','Valor','Status','Baixado em']],
    body: empresa.map(r => [fmtDate(r.vencimento), r.descricao, r.categoria, fmt(r.valor), r.pago?'Pago':'Pendente', fmtDate(r.pago_em)]),
    foot: [['','','Total', fmt(totalEmp), '', '']],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [26,86,219] },
    footStyles: { fillColor: [235,245,255], textColor: [26,86,219], fontStyle: 'bold' },
    theme: 'striped'
  })
  y = (doc as any).lastAutoTable.finalY + 8

  // Despesas Pessoal
  if (y > 230) { doc.addPage(); y = 14 }
  doc.setFontSize(11); doc.setFont(undefined as any, 'bold')
  doc.text('Despesas Pessoal', 14, y); y += 3
  autoTable(doc, {
    startY: y,
    head: [['Venc.','Descrição','Categoria','Valor','Status','Baixado em']],
    body: pessoal.map(r => [fmtDate(r.vencimento), r.descricao, r.categoria, fmt(r.valor), r.pago?'Pago':'Pendente', fmtDate(r.pago_em)]),
    foot: [['','','Total', fmt(totalPes), '', '']],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [26,86,219] },
    footStyles: { fillColor: [235,245,255], textColor: [26,86,219], fontStyle: 'bold' },
    theme: 'striped'
  })

  addFooter(doc)
  doc.save(`relatorio_geral_${MESES[mes]}_${ano}.pdf`)
}

export async function exportarPDFPorCategoria(
  dados: (DespesaEmpresa | DespesaPessoal)[], tipo: 'empresa' | 'pessoal',
  mes: number, ano: number, config: Configuracoes, logoDataUrl?: string
) {
  const { jsPDF, autoTable } = await getPDF()
  const doc = new jsPDF()

  const cats: Record<string, typeof dados> = {}
  dados.forEach(d => { if (!cats[d.categoria]) cats[d.categoria] = []; cats[d.categoria].push(d) })

  let first = true
  for (const [cat, items] of Object.entries(cats)) {
    if (!first) doc.addPage()
    first = false
    let y = addHeader(doc, config, cat, `${MESES[mes]}/${ano} — ${tipo === 'empresa' ? 'Empresa' : 'Pessoal'}`, logoDataUrl)
    const total = items.reduce((a,b)=>a+b.valor,0)
    autoTable(doc, {
      startY: y,
      head: [['Venc.','Descrição','Valor','Status','Baixado em','Obs.']],
      body: items.map(r => [
        fmtDate((r as any).vencimento), r.descricao, fmt(r.valor),
        r.pago?'Pago':'Pendente', fmtDate(r.pago_em), r.observacao||''
      ]),
      foot: [['','Total', fmt(total), '', '', '']],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [26,86,219] },
      footStyles: { fillColor: [235,245,255], textColor: [26,86,219], fontStyle: 'bold' },
      theme: 'striped'
    })
    addFooter(doc)
  }
  doc.save(`por_categoria_${tipo}_${MESES[mes]}_${ano}.pdf`)
}

export async function gerarPDFRecibo(recibo: Recibo, config: Configuracoes, logoDataUrl?: string) {
  const { jsPDF } = await getPDF()
  const doc = new jsPDF()
  const pageW = doc.internal.pageSize.getWidth()

  let y = addHeader(doc, config, 'RECIBO', recibo.numero, logoDataUrl)
  y += 10

  // Borda do recibo
  doc.setDrawColor(200); doc.roundedRect(14, y, pageW - 28, 140, 3, 3)
  y += 10

  doc.setFontSize(12); doc.setFont(undefined as any, 'bold')
  doc.text('RECIBO DE PAGAMENTO', pageW / 2, y, { align: 'center' })
  y += 10

  // Valor em destaque
  doc.setFillColor(235, 245, 255)
  doc.roundedRect(pageW/2 - 40, y, 80, 16, 2, 2, 'F')
  doc.setFontSize(16); doc.setTextColor(26, 86, 219)
  doc.text(fmt(recibo.valor), pageW / 2, y + 11, { align: 'center' })
  doc.setTextColor(0); y += 24

  doc.setFontSize(10); doc.setFont(undefined as any, 'normal')
  const linhas = [
    ['Beneficiário:', recibo.beneficiario],
    ['Tipo:', recibo.tipo.charAt(0).toUpperCase() + recibo.tipo.slice(1)],
    ['Data:', fmtDate(recibo.data)],
    ['Referente a:', recibo.descricao],
    ['Valor por extenso:', valorPorExtenso(recibo.valor)],
  ]
  linhas.forEach(([k, v]) => {
    doc.setFont(undefined as any, 'bold'); doc.text(k, 24, y)
    doc.setFont(undefined as any, 'normal'); doc.text(v, 70, y)
    y += 9
  })

  if (recibo.observacao) {
    y += 2
    doc.setFont(undefined as any, 'bold'); doc.text('Observação:', 24, y)
    doc.setFont(undefined as any, 'normal')
    const obs = doc.splitTextToSize(recibo.observacao, pageW - 80)
    doc.text(obs, 70, y); y += obs.length * 6
  }

  y += 16
  // Linha de assinatura
  doc.setDrawColor(100)
  doc.line(24, y, pageW/2 - 10, y)
  doc.line(pageW/2 + 10, y, pageW - 24, y)
  doc.setFontSize(8); doc.setTextColor(100)
  doc.text('Assinatura do emitente', 24, y + 5)
  doc.text('Assinatura do beneficiário', pageW/2 + 10, y + 5)

  doc.text(`${config.nome_empresa} — ${config.nome_familia}`, pageW/2, y + 20, { align: 'center' })

  addFooter(doc)
  doc.save(`recibo_${recibo.numero}.pdf`)
}
