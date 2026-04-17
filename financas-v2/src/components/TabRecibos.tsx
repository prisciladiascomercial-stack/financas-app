'use client'
import { fmt, fmtDateShort } from '@/lib/utils'
import { pdfRecibo } from '@/lib/export'

export default function TabRecibos({ recibos, setShowRecibo, config, logoDataUrl }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base font-semibold">Recibos emitidos</h3>
          <p className="text-xs text-gray-500 mt-0.5">Adiantamentos, vales e pagamentos</p>
        </div>
        <button onClick={()=>setShowRecibo(true)} className="btn-primary flex items-center gap-1.5">
          + Novo recibo
        </button>
      </div>

      {recibos.length===0 ? (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">🧾</p>
          <p className="text-sm">Nenhum recibo emitido ainda</p>
          <p className="text-xs mt-1">Clique em "Novo recibo" para gerar adiantamentos e vales</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">Número</th>
                <th className="table-th">Data</th>
                <th className="table-th">Beneficiário</th>
                <th className="table-th">Tipo</th>
                <th className="table-th">Referente a</th>
                <th className="table-th">Valor</th>
                <th className="table-th">PDF</th>
              </tr>
            </thead>
            <tbody>
              {recibos.map((r:any)=>(
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="table-td text-xs font-mono text-blue-600">{r.numero}</td>
                  <td className="table-td">{fmtDateShort(r.data)}</td>
                  <td className="table-td font-medium">{r.beneficiario}</td>
                  <td className="table-td">
                    <span className="badge badge-blue capitalize">{r.tipo}</span>
                  </td>
                  <td className="table-td max-w-0"><span className="truncate block" title={r.descricao}>{r.descricao}</span></td>
                  <td className="table-td font-semibold text-blue-700">{fmt(r.valor)}</td>
                  <td className="table-td">
                    <button onClick={()=>pdfRecibo(r,config,logoDataUrl)} className="text-xs px-2 py-1 border border-gray-200 rounded text-gray-600 hover:border-blue-400 hover:text-blue-600">
                      📄 Baixar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
