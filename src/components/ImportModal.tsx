'use client'
import { useState, useRef } from 'react'
import { CATS_EMP, CATS_PES, CATS_REC_EMP, CATS_REC_PES } from '@/lib/utils'

interface ImportItem {
  descricao: string
  valor: number
  categoria: string
  data: string | null
  observacao?: string
  selecionado: boolean
}

interface Props {
  targetTab: 'empresa' | 'pessoal' | 'receitas'
  onImport: (itens: Omit<ImportItem, 'selecionado'>[]) => Promise<void>
  onClose: () => void
}

const ACCEPT = '.csv,.xlsx,.xls,.pdf,.png,.jpg,.jpeg'
const CATS_REC = [...CATS_REC_EMP, ...CATS_REC_PES]

export default function ImportModal({ targetTab, onImport, onClose }: Props) {
  const [step, setStep] = useState<'upload' | 'review' | 'done'>('upload')
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState('')
  const [resumo, setResumo] = useState('')
  const [itens, setItens] = useState<ImportItem[]>([])
  const [erro, setErro] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const cats = targetTab === 'empresa' ? CATS_EMP : targetTab === 'receitas' ? CATS_REC : CATS_PES
  const tabLabel = targetTab === 'empresa' ? 'Empresa' : targetTab === 'receitas' ? 'Receitas' : 'Pessoal'

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setErro('')
    setLoading(true)

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = ev => {
          const result = ev.target?.result as string
          resolve(result.split(',')[1])
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      let textContent = ''
      if (file.name.endsWith('.csv')) {
        try {
          textContent = await file.text()
        } catch {}
      }

      const payload: any = {
        fileBase64: base64,
        fileType: file.type || detectType(file.name),
        fileName: file.name,
        targetCategories: cats,
        targetTab,
      }

      if (textContent) {
        payload.fileText = textContent
      }

      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!data.success || !data.data?.itens?.length) {
        setErro('Nenhum lancamento encontrado no arquivo. Verifique se o formato esta correto.')
        setLoading(false)
        return
      }

      setResumo(data.data.resumo || '')
      setItens(data.data.itens.map((item: any) => ({ ...item, selecionado: true })))
      setStep('review')
    } catch {
      setErro('Erro ao processar o arquivo. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function detectType(name: string): string {
    if (name.endsWith('.pdf')) return 'application/pdf'
    if (name.endsWith('.csv')) return 'text/csv'
    if (name.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    if (name.endsWith('.xls')) return 'application/vnd.ms-excel'
    if (name.endsWith('.png')) return 'image/png'
    if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg'
    return 'text/plain'
  }

  function toggleItem(i: number) {
    setItens(prev => prev.map((item, idx) => idx === i ? { ...item, selecionado: !item.selecionado } : item))
  }

  function toggleAll() {
    const allSelected = itens.every(i => i.selecionado)
    setItens(prev => prev.map(item => ({ ...item, selecionado: !allSelected })))
  }

  function updateItem(i: number, field: string, value: any) {
    setItens(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  async function confirmarImportacao() {
    const selecionados = itens.filter(i => i.selecionado).map(({ selecionado, ...rest }) => rest)
    if (!selecionados.length) {
      setErro('Selecione pelo menos um item para importar.')
      return
    }
    setLoading(true)
    await onImport(selecionados)
    setStep('done')
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="font-semibold text-gray-800">Importar arquivo - {tabLabel}</h3>
            <p className="text-xs text-gray-500 mt-0.5">Excel, CSV ou PDF com lancamentos financeiros</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">x</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {step === 'upload' && (
            <div className="space-y-4">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={loading}
                className="w-full h-48 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                    <span className="text-sm font-medium text-blue-600">Analisando com IA...</span>
                    <span className="text-xs">Isso pode levar alguns segundos</span>
                  </>
                ) : (
                  <>
                    <span className="text-5xl">+</span>
                    <span className="text-base font-medium">Clique para selecionar arquivo</span>
                    <span className="text-xs text-center px-8">Suporta .xlsx, .xls, .csv, .pdf, .png, .jpg</span>
                  </>
                )}
              </button>
              <input ref={fileRef} type="file" accept={ACCEPT} className="hidden" onChange={handleFile} />

              {erro && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{erro}</div>}

              <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 space-y-1">
                <p className="font-medium">Exemplos de arquivos compativeis:</p>
                <p>- Extrato bancario em CSV ou PDF</p>
                <p>- Planilha Excel com colunas de data, descricao e valor</p>
                <p>- Nota fiscal ou comprovante em imagem/PDF</p>
                <p>- Relatorio do sistema de gestao exportado</p>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-3">
              {resumo && <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700"><strong>{fileName}</strong> - {resumo}</div>}

              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">{itens.filter(i => i.selecionado).length} de {itens.length} itens selecionados</p>
                <button onClick={toggleAll} className="text-xs text-blue-600 hover:underline">
                  {itens.every(i => i.selecionado) ? 'Desmarcar todos' : 'Selecionar todos'}
                </button>
              </div>

              {erro && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{erro}</div>}

              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left w-8"></th>
                      <th className="px-3 py-2 text-left">Descricao</th>
                      <th className="px-3 py-2 text-left w-24">Categoria</th>
                      <th className="px-3 py-2 text-left w-24">Valor</th>
                      <th className="px-3 py-2 text-left w-28">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itens.map((item, i) => (
                      <tr key={i} className={`border-t border-gray-50 ${item.selecionado ? '' : 'opacity-40'}`}>
                        <td className="px-3 py-2"><input type="checkbox" checked={item.selecionado} onChange={() => toggleItem(i)} className="w-3.5 h-3.5 accent-blue-600" /></td>
                        <td className="px-2 py-1.5">
                          <input className="w-full text-xs border border-transparent hover:border-gray-200 focus:border-blue-300 rounded px-1 py-0.5 focus:outline-none bg-transparent focus:bg-white" value={item.descricao} onChange={e => updateItem(i, 'descricao', e.target.value)} />
                          {item.observacao && <p className="text-gray-400 italic truncate">{item.observacao}</p>}
                        </td>
                        <td className="px-2 py-1.5">
                          <select className="w-full text-xs border border-transparent hover:border-gray-200 focus:border-blue-300 rounded px-1 py-0.5 focus:outline-none bg-transparent focus:bg-white" value={item.categoria} onChange={e => updateItem(i, 'categoria', e.target.value)}>
                            {cats.map(c => <option key={c}>{c}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" step="0.01" className="w-full text-xs border border-transparent hover:border-gray-200 focus:border-blue-300 rounded px-1 py-0.5 focus:outline-none bg-transparent focus:bg-white font-medium" value={item.valor} onChange={e => updateItem(i, 'valor', parseFloat(e.target.value) || 0)} />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="date" className="w-full text-xs border border-transparent hover:border-gray-200 focus:border-blue-300 rounded px-1 py-0.5 focus:outline-none bg-transparent focus:bg-white" value={item.data || ''} onChange={e => updateItem(i, 'data', e.target.value || null)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400">Todos os campos sao editaveis antes de importar.</p>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center py-10 space-y-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-4xl">OK</div>
              <div>
                <p className="text-lg font-semibold text-gray-800">Importacao concluida!</p>
                <p className="text-sm text-gray-500 mt-1">{itens.filter(i => i.selecionado).length} lancamento(s) importado(s) para {tabLabel}</p>
              </div>
              <button onClick={onClose} className="btn-primary px-8 py-2.5 mx-auto block">Fechar</button>
            </div>
          )}
        </div>

        {step === 'review' && (
          <div className="p-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
            <button onClick={() => { setStep('upload'); setItens([]); setErro('') }} className="btn-outline flex-1">Importar outro arquivo</button>
            <button onClick={confirmarImportacao} disabled={loading || !itens.some(i => i.selecionado)} className="btn-primary flex-1 disabled:opacity-50">
              {loading ? 'Importando...' : `Importar ${itens.filter(i => i.selecionado).length} item(ns)`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
