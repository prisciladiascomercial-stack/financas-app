import { fmt, fmtDateFull, fmtDateShort, MESES, valorPorExtenso } from './utils'

function toCSV(headers: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  return [headers, ...rows].map(r => r.map(esc).join(',')).join('\n')
}
function downloadCSV(content: string, filename: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = filename; a.click()
}

export function csvEmpresa(dados: any[], mes: number, ano: number) {
  downloadCSV(toCSV(
    ['Vencimento','Descrição','Categoria','Valor','Pago','Data Pagamento','Observação'],
    dados.map(d => [fmtDateFull(d.vencimento), d.descricao, d.categoria, d.valor, d.pago?'Sim':'Não', fmtDateFull(d.pago_em), d.observacao||''])
  ), `empresa_${MESES[mes]}_${ano}.csv`)
}
export function csvPessoal(dados: any[], mes: number, ano: number) {
  downloadCSV(toCSV(
    ['Vencimento','Descrição','Categoria','Valor','Cartão','Pago','Data Pagamento','Observação'],
    dados.map(d => [fmtDateFull(d.vencimento), d.descricao, d.categoria, d.valor, d.cartao||'', d.pago?'Sim':'Não', fmtDateFull(d.pago_em), d.observacao||''])
  ), `pessoal_${MESES[mes]}_${ano}.csv`)
}
export function csvReceitas(dados: any[], mes: number, ano: number) {
  downloadCSV(toCSV(
    ['Data','Descrição','Categoria','Valor','Recebido','Observação'],
    dados.map(d => [fmtDateFull(d.data), d.descricao, d.categoria, d.valor, d.recebido?'Sim':'Não', d.observacao||''])
  ), `receitas_${MESES[mes]}_${ano}.csv`)
}
export function csvGeral(rec: any[], emp: any[], pes: any[], pend: any[], mes: number, ano: number) {
  const tRec = rec.reduce((a:number,b:any)=>a+b.valor,0)
  const tEmp = emp.reduce((a:number,b:any)=>a+b.valor,0)
  const tPes = pes.reduce((a:number,b:any)=>a+b.valor,0)
  const tPend = pend.filter((p:any)=>!p.pago).reduce((a:number,b:any)=>a+b.valor,0)
  downloadCSV(toCSV(
    ['Tipo','Data/Venc','Descrição','Categoria','Valor','Status','Observação'],
    [
      ...rec.map((r:any) => ['Receita', fmtDateFull(r.data), r.descricao, r.categoria, r.valor, r.recebido?'Recebido':'Pendente', r.observacao||'']),
      ...emp.map((r:any) => ['Empresa', fmtDateFull(r.vencimento), r.descricao, r.categoria, r.valor, r.pago?'Pago':'Pendente', r.observacao||'']),
      ...pes.map((r:any) => ['Pessoal', fmtDateFull(r.vencimento), r.descricao, r.categoria, r.valor, r.pago?'Pago':'Pendente', r.observacao||'']),
      ...pend.map((r:any) => ['Pendência', fmtDateFull(r.vencimento), r.descricao, r.origem, r.valor, r.pago?'Pago':'Pendente', r.observacao||'']),
      [], ['RESUMO','','','','','',''],
      ['Total Receitas','','','',tRec,'',''], ['Total Empresa','','','',tEmp,'',''],
      ['Total Pessoal','','','',tPes,'',''], ['Pendências','','','',tPend,'',''],
      ['Saldo Líquido','','','',tRec-tEmp-tPes,'',''],
    ]
  ), `geral_${MESES[mes]}_${ano}.csv`)
}

async function getPDF() {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  return { jsPDF, autoTable }
}
function header(doc: any, cfg: any, titulo: string, sub: string, logo?: string) {
  const w = doc.internal.pageSize.getWidth()
  doc.setFillColor(26,86,219); doc.rect(0,0,w,28,'F')
  if (logo) { try { doc.addImage(logo,'PNG',10,4,20,20) } catch {} }
  doc.setTextColor(255,255,255)
  doc.setFontSize(14); doc.setFont(undefined,'bold')
  doc.text(cfg.nome_empresa, logo?34:14, 11)
  doc.setFontSize(9); doc.setFont(undefined,'normal')
  doc.text(cfg.nome_familia, logo?34:14, 18)
  doc.setFontSize(12); doc.setFont(undefined,'bold')
  doc.text(titulo, w-14, 11, {align:'right'})
  doc.setFontSize(9); doc.setFont(undefined,'normal')
  doc.text(sub, w-14, 18, {align:'right'})
  doc.setTextColor(0); return 34
}
function footer(doc: any) {
  const w = doc.internal.pageSize.getWidth(), h = doc.internal.pageSize.getHeight()
  doc.setFontSize(8); doc.setTextColor(150)
  doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, h-8)
  doc.text(`Pág ${doc.internal.getCurrentPageInfo().pageNumber}`, w-14, h-8, {align:'right'})
  doc.setTextColor(0)
}

export async function pdfGeral(rec: any[], emp: any[], pes: any[], pend: any[], mes: number, ano: number, cfg: any, logo?: string) {
  const { jsPDF, autoTable } = await getPDF()
  const doc = new jsPDF()
  let y = header(doc, cfg, 'Relatório Geral', `${MESES[mes]}/${ano}`, logo)
  const tRec=rec.reduce((a:number,b:any)=>a+b.valor,0), tEmp=emp.reduce((a:number,b:any)=>a+b.valor,0)
  const tPes=pes.reduce((a:number,b:any)=>a+b.valor,0), saldo=tRec-tEmp-tPes
  const cards = [{l:'Receitas',v:tRec,c:[5,122,85]},{l:'Empresa',v:tEmp,c:[26,86,219]},{l:'Pessoal',v:tPes,c:[133,79,11]},{l:'Saldo',v:saldo,c:saldo>=0?[5,122,85]:[224,36,36]}]
  cards.forEach((card,i) => {
    const x = 14 + i*47
    doc.setFillColor(245,247,255); doc.roundedRect(x,y,44,18,2,2,'F')
    doc.setFontSize(7); doc.setTextColor(100); doc.text(card.l,x+3,y+6)
    doc.setFontSize(10); doc.setFont(undefined,'bold'); doc.setTextColor(card.c[0],card.c[1],card.c[2])
    doc.text(fmt(card.v),x+3,y+14); doc.setFont(undefined,'normal'); doc.setTextColor(0)
  })
  y += 24
  doc.setFontSize(10); doc.setFont(undefined,'bold'); doc.text('Receitas',14,y); y+=3
  autoTable(doc,{startY:y,head:[['Data','Descrição','Categoria','Valor','Status']],body:rec.map((r:any)=>[fmtDateShort(r.data),r.descricao,r.categoria,fmt(r.valor),r.recebido?'Recebido':'Pendente']),foot:[['','','Total',fmt(tRec),'']],styles:{fontSize:8},headStyles:{fillColor:[26,86,219]},footStyles:{fillColor:[235,245,255],textColor:[26,86,219],fontStyle:'bold'},theme:'striped'})
  y=(doc as any).lastAutoTable.finalY+8
  if(y>220){doc.addPage();y=14}
  doc.setFontSize(10); doc.setFont(undefined,'bold'); doc.text('Despesas Empresa',14,y); y+=3
  autoTable(doc,{startY:y,head:[['Venc.','Descrição','Categoria','Valor','Status','Baixado em']],body:emp.map((r:any)=>[fmtDateShort(r.vencimento),r.descricao,r.categoria,fmt(r.valor),r.pago?'Pago':'Pendente',fmtDateShort(r.pago_em)]),foot:[['','','Total',fmt(tEmp),'','']],styles:{fontSize:8},headStyles:{fillColor:[26,86,219]},footStyles:{fillColor:[235,245,255],textColor:[26,86,219],fontStyle:'bold'},theme:'striped'})
  y=(doc as any).lastAutoTable.finalY+8
  if(y>220){doc.addPage();y=14}
  doc.setFontSize(10); doc.setFont(undefined,'bold'); doc.text('Despesas Pessoal',14,y); y+=3
  autoTable(doc,{startY:y,head:[['Venc.','Descrição','Categoria','Valor','Status','Baixado em']],body:pes.map((r:any)=>[fmtDateShort(r.vencimento),r.descricao,r.categoria,fmt(r.valor),r.pago?'Pago':'Pendente',fmtDateShort(r.pago_em)]),foot:[['','','Total',fmt(tPes),'','']],styles:{fontSize:8},headStyles:{fillColor:[26,86,219]},footStyles:{fillColor:[235,245,255],textColor:[26,86,219],fontStyle:'bold'},theme:'striped'})
  footer(doc); doc.save(`relatorio_geral_${MESES[mes]}_${ano}.pdf`)
}

export async function pdfCategoria(dados: any[], tipo: string, mes: number, ano: number, cfg: any, logo?: string) {
  const { jsPDF, autoTable } = await getPDF()
  const doc = new jsPDF()
  const cats: Record<string,any[]> = {}
  dados.forEach((d:any) => { if(!cats[d.categoria]) cats[d.categoria]=[]; cats[d.categoria].push(d) })
  let first = true
  for (const [cat, items] of Object.entries(cats)) {
    if(!first) doc.addPage(); first=false
    let y = header(doc, cfg, cat, `${MESES[mes]}/${ano} — ${tipo}`, logo)
    autoTable(doc,{startY:y,head:[['Venc.','Descrição','Valor','Status','Baixado em','Obs.']],body:items.map((r:any)=>[fmtDateShort(r.vencimento),r.descricao,fmt(r.valor),r.pago?'Pago':'Pendente',fmtDateShort(r.pago_em),r.observacao||'']),foot:[['','Total',fmt(items.reduce((a:number,b:any)=>a+b.valor,0)),'','','']],styles:{fontSize:8},headStyles:{fillColor:[26,86,219]},footStyles:{fillColor:[235,245,255],textColor:[26,86,219],fontStyle:'bold'},theme:'striped'})
    footer(doc)
  }
  doc.save(`por_categoria_${tipo}_${MESES[mes]}_${ano}.pdf`)
}

export async function pdfRecibo(recibo: any, cfg: any, logo?: string) {
  const { jsPDF } = await getPDF()
  const doc = new jsPDF()
  const w = doc.internal.pageSize.getWidth()
  let y = header(doc, cfg, 'RECIBO', recibo.numero, logo)
  y += 10
  doc.setDrawColor(200); doc.roundedRect(14,y,w-28,145,3,3)
  y += 10
  doc.setFontSize(13); doc.setFont(undefined,'bold')
  doc.text('RECIBO DE PAGAMENTO', w/2, y, {align:'center'}); y+=10
  doc.setFillColor(235,245,255); doc.roundedRect(w/2-40,y,80,16,2,2,'F')
  doc.setFontSize(16); doc.setTextColor(26,86,219)
  doc.text(fmt(recibo.valor), w/2, y+11, {align:'center'})
  doc.setTextColor(0); y+=24
  doc.setFontSize(10); doc.setFont(undefined,'normal')
  const linhas = [
    ['Beneficiário:', recibo.beneficiario],
    ['Tipo:', recibo.tipo?.charAt(0).toUpperCase()+recibo.tipo?.slice(1)],
    ['Data:', fmtDateFull(recibo.data)],
    ['Referente a:', recibo.descricao],
    ['Valor por extenso:', valorPorExtenso(recibo.valor)],
  ]
  linhas.forEach(([k,v]) => {
    doc.setFont(undefined,'bold'); doc.text(k,24,y)
    doc.setFont(undefined,'normal'); doc.text(String(v),70,y); y+=9
  })
  if(recibo.observacao){ y+=2; doc.setFont(undefined,'bold'); doc.text('Observação:',24,y); doc.setFont(undefined,'normal'); const obs=doc.splitTextToSize(recibo.observacao,w-84); doc.text(obs,70,y); y+=obs.length*6 }
  y+=16
  doc.setDrawColor(100); doc.line(24,y,w/2-10,y); doc.line(w/2+10,y,w-24,y)
  doc.setFontSize(8); doc.setTextColor(100)
  doc.text('Assinatura do emitente',24,y+5)
  doc.text('Assinatura do beneficiário',w/2+10,y+5)
  doc.text(`${cfg.nome_empresa} — ${cfg.nome_familia}`, w/2, y+20, {align:'center'})
  footer(doc); doc.save(`recibo_${recibo.numero}.pdf`)
}
