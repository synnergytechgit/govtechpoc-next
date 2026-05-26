'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader, EmptyState, LoadingState } from '@/components/PageHeader'
import { brl, dateBR } from '@/lib/format'

export const dynamic = 'force-dynamic'

type Empenho = { id: string; numero_empenho: string; data_empenho: string; fornecedor: string; cnpj: string | null; objeto: string | null; valor: number; status: string }

const statusStyle: Record<string, string> = {
  emitido: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  liquidado: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  pago: 'bg-green-100 text-green-800 hover:bg-green-100',
}

export default function EmpenhosPage() {
  const supabase = createClient()
  const [status, setStatus] = useState('todos')
  const [data, setData] = useState<Empenho[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    let q = supabase.from('empenhos').select('*').order('data_empenho', { ascending: false })
    if (status !== 'todos') q = q.eq('status', status)
    q.then(({ data }) => { setData(data ?? []); setIsLoading(false) })
  }, [status])

  return (
    <>
      <PageHeader title="Empenhos" subtitle="Despesas empenhadas no exercício" />
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-500">{data ? `${data.length} registro(s)` : ''}</div>
          <div className="w-48">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="emitido">Emitido</SelectItem>
                <SelectItem value="liquidado">Liquidado</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {isLoading ? <LoadingState /> : data.length === 0 ? <EmptyState message="Nenhum empenho encontrado." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 border-b">
                <tr>
                  <th className="text-left font-medium py-2">Nº Empenho</th>
                  <th className="text-left font-medium py-2">Data</th>
                  <th className="text-left font-medium py-2">Fornecedor</th>
                  <th className="text-left font-medium py-2">CNPJ</th>
                  <th className="text-left font-medium py-2">Objeto</th>
                  <th className="text-right font-medium py-2">Valor</th>
                  <th className="text-left font-medium py-2 pl-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((e) => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="py-3 font-mono text-xs">{e.numero_empenho}</td>
                    <td className="py-3">{dateBR(e.data_empenho)}</td>
                    <td className="py-3 font-medium">{e.fornecedor}</td>
                    <td className="py-3 text-gray-500 text-xs">{e.cnpj ?? '—'}</td>
                    <td className="py-3 text-gray-500 max-w-[280px] truncate">{e.objeto ?? '—'}</td>
                    <td className="py-3 text-right font-medium">{brl(Number(e.valor))}</td>
                    <td className="py-3 pl-4"><Badge className={statusStyle[e.status] ?? ''}>{e.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
