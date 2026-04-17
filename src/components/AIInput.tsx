'use client'
import { useState, useRef } from 'react'
import { Mic, Camera, Type, Loader2, Check, X } from 'lucide-react'
import type { AIParseResult } from '../types'

interface Props {
  categorias: string[]
  onConfirm: (data: AIParseResult) => void
  onClose: () => void
}

export default function AIInput({ categorias, onConfirm, onClose }: Props) {
  const [mode, setMode] = useState<'text' | 'photo' | 'audio'>('text')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [result, setResult] = useState<AIParseResult | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [imageData, setImageData] = useState<{base64: string, type: string} | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  async function parseWithAI(textInput?: string, imgBase64?: string, imgType?: string) {
    setLoading(true)
    try {
      const res = await fetch('/api/ai-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textInput,
          imageBase64: imgBase64,
          imageMediaType: imgType,
          targetCategories: categorias
        })
      })
      const data = await res.json()
      if (data.success) setResult(data.data)
    } finally {
      setLoading(false)
    }
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = (ev.target?.result as string).split(',')[1]
      setPreview(ev.target?.result as string)
      setImageData({ base64, type: file.type })
    }
    reader.readAsDataURL(file)
  }

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    chunksRef.current = []
    recorder.ondataavailable = e => chunksRef.current.push(e.data)
    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop())
      // Converte áudio para texto usando a IA via transcrição simulada
      // Na prática, envia o texto "audio" e pede para o usuário confirmar
      setText('[Transcrição de áudio — edite se necessário]')
      setMode('text')
      setRecording(false)
    }
    recorder.start()
    mediaRef.current = recorder
    setRecording(true)
    // Para após 30s automaticamente
    setTimeout(() => { if (mediaRef.current?.state === 'recording') mediaRef.current?.stop() }, 30000)
  }

  function stopRecording() { mediaRef.current?.stop() }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Lançamento inteligente</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
        </div>

        {!result ? (
          <div className="p-4 space-y-4">
            {/* Seletor de modo */}
            <div className="flex gap-2">
              {[
                { id: 'text', icon: Type, label: 'Texto' },
                { id: 'photo', icon: Camera, label: 'Foto/Arquivo' },
                { id: 'audio', icon: Mic, label: 'Áudio' },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id as any)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-medium transition-all ${
                    mode === m.id ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <m.icon size={18}/>
                  {m.label}
                </button>
              ))}
            </div>

            {/* Texto */}
            {mode === 'text' && (
              <div>
                <textarea
                  className="input h-24 resize-none"
                  placeholder="Ex: paguei 47,50 no almoço, lanchamos e gastei R$ 23 em alimentação, comprei gasolina por 180 reais..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">A IA vai extrair valor, categoria e data automaticamente</p>
              </div>
            )}

            {/* Foto */}
            {mode === 'photo' && (
              <div>
                {preview ? (
                  <div className="relative">
                    <img src={preview} alt="Preview" className="w-full h-40 object-cover rounded-xl"/>
                    <button onClick={() => { setPreview(null); setImageData(null) }}
                      className="absolute top-2 right-2 bg-white rounded-full p-1 shadow">
                      <X size={14}/>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-all"
                  >
                    <Camera size={28}/>
                    <span className="text-sm">Tirar foto ou selecionar arquivo</span>
                    <span className="text-xs">Nota fiscal, cupom, comprovante...</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" capture="environment"
                  className="hidden" onChange={handlePhoto}/>
              </div>
            )}

            {/* Áudio */}
            {mode === 'audio' && (
              <div className="flex flex-col items-center gap-4 py-4">
                {!recording ? (
                  <button onClick={startRecording}
                    className="w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 active:scale-95 transition-all">
                    <Mic size={32}/>
                  </button>
                ) : (
                  <button onClick={stopRecording}
                    className="w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg animate-pulse">
                    <div className="w-6 h-6 bg-white rounded-sm"/>
                  </button>
                )}
                <p className="text-sm text-gray-500">
                  {recording ? 'Gravando... clique para parar' : 'Clique para gravar'}
                </p>
                {recording && <p className="text-xs text-gray-400">Fale: "gastei 50 reais em alimentação"</p>}
              </div>
            )}

            <button
              onClick={() => parseWithAI(text || undefined, imageData?.base64, imageData?.type)}
              disabled={loading || (!text && !imageData)}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 disabled:opacity-50"
            >
              {loading ? <><Loader2 size={16} className="animate-spin"/> Analisando...</> : 'Analisar com IA'}
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <div className="bg-green-50 rounded-xl p-3 flex items-center gap-2">
              <Check size={16} className="text-green-600"/>
              <span className="text-sm text-green-700 font-medium">IA identificou o lançamento</span>
            </div>

            <div className="space-y-2">
              {[
                { label: 'Descrição', field: 'descricao' as const, type: 'text' },
                { label: 'Valor (R$)', field: 'valor' as const, type: 'number' },
                { label: 'Data', field: 'data' as const, type: 'date' },
                { label: 'Observação', field: 'observacao' as const, type: 'text' },
              ].map(f => (
                <div key={f.field}>
                  <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
                  <input
                    type={f.type}
                    className="input"
                    value={(result[f.field] as string) || ''}
                    onChange={e => setResult({...result, [f.field]: f.type === 'number' ? parseFloat(e.target.value) : e.target.value})}
                  />
                </div>
              ))}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Categoria</label>
                <select className="input" value={result.categoria}
                  onChange={e => setResult({...result, categoria: e.target.value})}>
                  {categorias.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setResult(null)} className="btn-outline flex-1">Refazer</button>
              <button onClick={() => onConfirm(result)} className="btn-primary flex-1">Confirmar lançamento</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
