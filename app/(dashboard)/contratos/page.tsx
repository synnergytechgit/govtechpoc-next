'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader, EmptyState, LoadingState } from '@/components/PageHeader'
import { brl, dateBR, daysUntil } from '@/lib/format'
import { AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Contrato = { id: string; numero: string; fornecedor: string; objeto: string | null; valor_total: number; data_inicio: string; data_fim: string; status: string }

const statusStyle: Record<string, string> = {
  vigente: 'bg-green-100 text-green-800 hover:bg-green-100',
  vencido: 'bg-red-100 text-red-800 hover:bg-red-100',
  encerrado: 'bg-gray-100 text-gray-600 hover:bg-gray-100',
}

export default function ContratosPage() {
  const supabase = createClient()
  const [data, setData] = useState<Contrato[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    supabase.from('contratos').select('*').order('data_fim', { ascending: true })
      .then(({ data }) => { setData(data ?? []); setIsLoading(false) })
  }, [])

  return (
    <>
      <PageHeader title="Contratos" subtitle="Contratos administrativos firmados" />
      <Card className="p-6">
        {isLoading ? <LoadingState /> : data.length === 0 ? <EmptyState message="Nenhum contrato cadastrado." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 border-b">
                <tr>
                  <th className="text-left font-medium py-2">Número</th>
                  <th className="text-left font-medium py-2">Fornecedor</th>
                  <th className="text-left font-medium py-2">Objeto</th>
                  <th className="text-right font-medium py-2">Valor Total</th>
                  <th className="text-left font-medium py-2">Início</th>
                  <th className="text-left font-medium py-2">Fim</th>
                  <th className="text-left font-medium py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((c) => {
                  const days = daysUntil(c.data_fim)
                  const expiringSoon = c.status === 'vigente' && days >= 0 && days <= 30
                  return (
                    <tr key={c.id} className={`border-b last:border-0 ${expiringSoon ? 'bg-amber-50' : ''}`}>
                      <td className="py-3 font-mono text-xs">{c.numero}</td>
                      <td className="py-3 font-medium">{c.fornecedor}</td>
                      <td className="py-3 text-gray-500 max-w-[260px] truncate">{c.objeto ?? '—'}</td>
                      <td className="py-3 text-right font-medium">{brl(Number(c.valor_total))}</td>
                      <td className="py-3">{dateBR(c.data_inicio)}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          {dateBR(c.data_fim)}
                          {expiringSoon && <span title={`Vence em ${days} dia(s)`}><AlertTriangle className="w-4 h-4 text-amber-600" /></span>}
                        </div>
                      </td>
                      <td className="py-3"><Badge className={statusStyle[c.status] ?? ''}>{c.status}</Badge></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
