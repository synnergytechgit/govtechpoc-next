'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { PageHeader, EmptyState, LoadingState } from '@/components/PageHeader'
import { brl, pct } from '@/lib/format'

export const dynamic = 'force-dynamic'

type Receita = { id: string; natureza_receita: string; categoria: string; valor_previsto: number; valor_arrecadado: number }

export default function ReceitaPage() {
  const supabase = createClient()
  const [data, setData] = useState<Receita[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    supabase.from('receita_prevista').select('*').order('natureza_receita')
      .then(({ data }) => { setData(data ?? []); setIsLoading(false) })
  }, [])

  return (
    <>
      <PageHeader title="Receita" subtitle="Comparativo entre previsão e arrecadação" />
      <Card className="p-6">
        {isLoading ? <LoadingState /> : data.length === 0 ? <EmptyState message="Nenhuma receita cadastrada." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 border-b">
                <tr>
                  <th className="text-left font-medium py-2">Natureza</th>
                  <th className="text-left font-medium py-2">Categoria</th>
                  <th className="text-right font-medium py-2">Previsto</th>
                  <th className="text-right font-medium py-2">Arrecadado</th>
                  <th className="text-right font-medium py-2">Diferença</th>
                  <th className="text-right font-medium py-2 pr-2">% Execução</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => {
                  const prev = Number(r.valor_previsto)
                  const arr = Number(r.valor_arrecadado)
                  const dif = arr - prev
                  const p = prev > 0 ? (arr / prev) * 100 : 0
                  const color = p > 80 ? 'text-green-700 bg-green-100' : p >= 50 ? 'text-amber-800 bg-amber-100' : 'text-red-700 bg-red-100'
                  return (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{r.natureza_receita}</td>
                      <td className="py-3 text-gray-500">{r.categoria}</td>
                      <td className="py-3 text-right">{brl(prev)}</td>
                      <td className="py-3 text-right">{brl(arr)}</td>
                      <td className={`py-3 text-right ${dif < 0 ? 'text-red-600' : 'text-green-700'}`}>{brl(dif)}</td>
                      <td className="py-3 text-right pr-2">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold ${color}`}>{pct(p)}</span>
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
