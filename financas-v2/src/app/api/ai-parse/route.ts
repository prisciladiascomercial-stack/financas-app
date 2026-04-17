import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text, imageBase64, imageMediaType, targetCategories } = body
    const cats = targetCategories?.join(', ') || 'Alimentação, Moradia, Transporte, Saúde, Lazer, Outros'
    const content: any[] = []
    if (imageBase64) {
      content.push({ type: 'image', source: { type: 'base64', media_type: imageMediaType || 'image/jpeg', data: imageBase64 } })
    }
    content.push({
      type: 'text',
      text: `${text ? `O usuário disse: "${text}"\n\nExtraia as informações financeiras desta mensagem.` : 'Analise esta imagem (nota fiscal, cupom ou foto de compra) e extraia as informações financeiras.'}

Categorias disponíveis: ${cats}

Responda SOMENTE com JSON válido, sem texto adicional:
{"descricao":"descrição curta","valor":0.00,"categoria":"categoria da lista","data":"YYYY-MM-DD ou null","observacao":"detalhes extras ou vazio"}`
    })
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 400, messages: [{ role: 'user', content }] })
    })
    const data = await response.json()
    const raw = data.content?.[0]?.text || '{}'
    let parsed
    try { parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()) }
    catch { parsed = { descricao: text || 'Lançamento', valor: 0, categoria: 'Outros', data: null, observacao: '' } }
    return NextResponse.json({ success: true, data: parsed })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Erro ao processar' }, { status: 500 })
  }
}
