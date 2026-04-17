'use client'
import { useState, useRef } from 'react'

export default function AIInput({ categorias, onConfirm, onClose }: { categorias: string[]; onConfirm: (d: any) => void; onClose: () => void }) {
  const [mode, setMode] = useState<'text'|'photo'>('text')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [preview, setPreview] = useState<string|null>(null)
  const [imgData, setImgData] = useState<{base64:string;type:string}|null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function parse() {
    setLoading(true)
    try {
      const res = await fetch('/api/ai-parse', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text: text||undefined, imageBase64: imgData?.base64, imageMediaType: imgData?.type, targetCategories: categorias }) })
      const data = await res.json()
      if (data.success) setResult(data.data)
    } finally { setLoading(false) }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if(!file) return
    const reader = new FileReader()
    reader.onload = ev => { const b64 = (ev.target?.result as string).split(',')[1]; setPreview(ev.target?.result as string); setImgData({base64:b64,type:file.type}) }
    reader.readAsDataURL(file)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Lançamento inteligente</h3>
          <button onClick={onClose} className="text-gray-400 text-xl leading-none">×</button>
        </div>
        {!result ? (
          <div className="p-4 space-y-4">
            <div className="flex gap-2">
              {(['text','photo'] as const).map(m => (
                <button key={m} onClick={()=>setMode(m)} className={`flex-1 py-2 rounded-xl text-sm font-medium ${mode===m?'bg-blue-600 text-white':'bg-gray-50 text-gray-600'}`}>
                  {m==='text'?'Texto / Áudio':'Foto / Arquivo'}
                </button>
              ))}
            </div>
            {mode==='text' && (
              <div>
                <textarea className="input h-24 resize-none" placeholder="Ex: paguei 47,50 no almoço em alimentação... gastei 180 em gasolina..." value={text} onChange={e=>setText(e.target.value)}/>
                <p className="text-xs text-gray-400 mt-1">Descreva a compra com valor e categoria — a IA lança automaticamente</p>
              </div>
            )}
            {mode==='photo' && (
              <div>
                {preview ? (
                  <div className="relative"><img src={preview} alt="" className="w-full h-40 object-cover rounded-xl"/><button onClick={()=>{setPreview(null);setImgData(null)}} className="absolute top-2 right-2 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow text-gray-600">×</button></div>
                ) : (
                  <button onClick={()=>fileRef.current?.click()} className="w-full h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-blue-400 hover:text-blue-500">
                    <span className="text-3xl">📷</span>
                    <span className="text-sm">Tirar foto ou selecionar arquivo</span>
                    <span className="text-xs">Nota fiscal, cupom, comprovante...</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile}/>
              </div>
            )}
            <button onClick={parse} disabled={loading||(!text&&!imgData)} className="btn-primary w-full py-2.5 disabled:opacity-50">
              {loading ? 'Analisando com IA...' : 'Analisar com IA'}
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <div className="bg-green-50 rounded-xl p-3 text-sm text-green-700 font-medium">✓ IA identificou o lançamento — confirme os dados:</div>
            {[{l:'Descrição',k:'descricao',t:'text'},{l:'Valor (R$)',k:'valor',t:'number'},{l:'Data',k:'data',t:'date'},{l:'Observação',k:'observacao',t:'text'}].map(f=>(
              <div key={f.k}><label className="text-xs text-gray-500 mb-1 block">{f.l}</label>
                <input type={f.t} className="input" value={result[f.k]||''} onChange={e=>setResult({...result,[f.k]:f.t==='number'?parseFloat(e.target.value):e.target.value})}/>
              </div>
            ))}
            <div><label className="text-xs text-gray-500 mb-1 block">Categoria</label>
              <select className="input" value={result.categoria} onChange={e=>setResult({...result,categoria:e.target.value})}>
                {categorias.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={()=>setResult(null)} className="btn-outline flex-1">Refazer</button>
              <button onClick={()=>onConfirm(result)} className="btn-primary flex-1">Confirmar lançamento</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
