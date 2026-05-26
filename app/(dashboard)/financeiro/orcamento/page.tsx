'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { PageHeader, EmptyState, LoadingState } from '@/components/PageHeader'
import { brl, pct } from '@/lib/format'

type Dotacao = { id: string; secretaria: string; natureza_despesa: string; valor_dotacao_inicial: number; valor_empenhado: number }

export default function OrcamentoPage() {
  const supabase = createClient()
  const [data, setData] = useState<Dotacao[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    supabase.from('dotacoes').select('*').order('secretaria', { ascending: true })
      .then(({ data }) => { setData(data ?? []); setIsLoading(false) })
  }, [])

  return (
    <>
      <PageHeader title="Orçamento" subtitle="Dotações por secretaria e natureza de despesa" />
      <Card className="p-6">
        {isLoading ? <LoadingState /> : data.length === 0 ? <EmptyState message="Nenhuma dotação cadastrada." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 border-b">
                <tr>
                  <th className="text-left font-medium py-2">Secretaria</th>
                  <th className="text-left font-medium py-2">Natureza da Despesa</th>
                  <th className="text-right font-medium py-2">Dotação Inicial</th>
                  <th className="text-right font-medium py-2">Empenhado</th>
                  <th className="text-right font-medium py-2">Saldo Disponível</th>
                  <th className="text-left font-medium py-2 pl-4 w-[180px]">% Empenhado</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d) => {
                  const dot = Number(d.valor_dotacao_inicial)
                  const emp = Number(d.valor_empenhado)
                  const saldo = dot - emp
                  const p = dot > 0 ? (emp / dot) * 100 : 0
                  const critical = p > 90
                  return (
                    <tr key={d.id} className={`border-b last:border-0 ${critical ? 'bg-red-50' : ''}`}>
                      <td className="py-3 font-medium">{d.secretaria}</td>
                      <td className="py-3">{d.natureza_despesa}</td>
                      <td className="py-3 text-right">{brl(dot)}</td>
                      <td className="py-3 text-right">{brl(emp)}</td>
                      <td className={`py-3 text-right font-medium ${saldo < 0 ? 'text-red-600' : ''}`}>{brl(saldo)}</td>
                      <td className="py-3 pl-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full ${critical ? 'bg-red-500' : 'bg-[#1e3a5f]'}`} style={{ width: `${Math.min(100, p)}%` }} />
                          </div>
                          <span className={`text-xs font-medium w-12 text-right ${critical ? 'text-red-600' : 'text-gray-500'}`}>{pct(p)}</span>
                        </div>
                      </td>
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
