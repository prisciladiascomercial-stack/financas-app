import { NextRequest, NextResponse } from 'next/server'

function decodeBase64(base64: string) {
  return Buffer.from(base64, 'base64').toString('utf-8')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { fileBase64, fileType, fileName, fileText, targetCategories, targetTab } = body

    const cats = targetCategories?.join(', ') || 'Alimentacao, Moradia, Transporte, Saude, Lazer, Outros'
    const content: any[] = []

    const isPDF = fileType === 'application/pdf'
    const isImage = fileType?.startsWith('image/')
    const textPayload = fileText || (!isPDF && !isImage ? decodeBase64(fileBase64) : '')

    if (isPDF) {
      content.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 },
      })
    } else if (isImage) {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: fileType, data: fileBase64 },
      })
    }

    const prompt = `Voce recebeu um arquivo financeiro chamado "${fileName}" do tipo "${fileType}".
${!isPDF && !isImage ? `Conteudo do arquivo (CSV/Excel convertido para texto):\n\n${textPayload}\n\n` : ''}

Analise este arquivo e extraia TODOS os lancamentos financeiros encontrados.
Destino: ${targetTab === 'empresa' ? 'Despesas Empresa (AG Security)' : targetTab === 'pessoal' ? 'Despesas Pessoal' : 'Receitas'}
Categorias disponiveis: ${cats}

Regras:
- Extraia TODAS as linhas/transacoes do arquivo
- Para cada item, identifique: descricao, valor, data, categoria adequada
- Valores negativos = despesas, positivos = receitas
- Se a data nao estiver clara, use null
- Ignore cabecalhos, totais e linhas em branco
- Maximo de 50 itens por importacao

Responda SOMENTE com JSON valido neste formato, sem texto adicional:
{
  "itens": [
    {
      "descricao": "descricao do item",
      "valor": 0.00,
      "categoria": "categoria da lista",
      "data": "YYYY-MM-DD ou null",
      "observacao": "info extra se houver"
    }
  ],
  "resumo": "breve resumo do que foi encontrado no arquivo"
}`

    content.push({ type: 'text', text: prompt })

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content }],
      }),
    })

    const data = await response.json()
    const raw = data.content?.[0]?.text || '{}'

    let parsed
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
    } catch {
      parsed = { itens: [], resumo: 'Nao foi possivel interpretar o arquivo.' }
    }

    return NextResponse.json({ success: true, data: parsed })
  } catch (err) {
    console.error('Import error:', err)
    return NextResponse.json({ success: false, error: 'Erro ao processar arquivo' }, { status: 500 })
  }
}
