'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react'

type Meta = {
  id: string
  descricao: string
  indicador: string | null
  unidade: string | null
  valor_previsto: number | null
  exercicio: number
  meta_fisica: number | null
  realizado_fisico: number | null
  realizado_financeiro: number | null
  status: string
  programas: { codigo: string; nome: string; secretaria: string | null } | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  em_andamento: { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-800' },
  concluida: { label: 'Concluída', color: 'bg-green-100 text-green-800' },
  atrasada: { label: 'Atrasada', color: 'bg-red-100 text-red-800' },
  cancelada: { label: 'Cancelada', color: 'bg-gray-100 text-gray-500' },
}

function formatCurrency(value: number | null) {
  if (!value) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function PlanejamentoPage() {
  const [metas, setMetas] = useState<Meta[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchMetas() {
      const { data } = await supabase.from('metas').select('*, programas(codigo, nome, secretaria)').order('exercicio', { ascending: false })
      if (data) setMetas(data as any)
      setLoading(false)
    }
    fetchMetas()
  }, [])

  const emAndamento = metas.filter((m) => m.status === 'em_andamento').length
  const concluidas = metas.filter((m) => m.status === 'concluida').length
  const atrasadas = metas.filter((m) => m.status === 'atrasada').length
  const valorPrevisto = metas.reduce((acc, m) => acc + (m.valor_previsto || 0), 0)
  const valorRealizado = metas.reduce((acc, m) => acc + (m.realizado_financeiro || 0), 0)
  const pctGeral = valorPrevisto > 0 ? ((valorRealizado / valorPrevisto) * 100).toFixed(1) : '0'

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Target className="w-6 h-6 text-[#1e3a5f]" />
          Planejamento e Metas
        </h1>
        <p className="text-sm text-gray-500 mt-1">Monitoramento de programas e metas — PPA 2022-2025</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" /> Execução Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#1e3a5f]">{pctGeral}%</p>
            <p className="text-xs text-gray-400 mt-1">
              {formatCurrency(valorRealizado)} de {formatCurrency(valorPrevisto)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <Target className="w-4 h-4 text-yellow-500" /> Em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{emAndamento}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" /> Concluídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{concluidas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" /> Atrasadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{atrasadas}</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400">Carregando...</div>
      ) : metas.length === 0 ? (
        <div className="p-8 text-center text-gray-400">Nenhuma meta encontrada.</div>
      ) : (
        <div className="space-y-4">
          {metas.map((meta) => {
            const status = STATUS_CONFIG[meta.status]
            const pctFisico = meta.meta_fisica && meta.meta_fisica > 0 ? Math.min(((meta.realizado_fisico || 0) / meta.meta_fisica) * 100, 100) : 0
            const pctFinanceiro =
              meta.valor_previsto && meta.valor_previsto > 0 ? Math.min(((meta.realizado_financeiro || 0) / meta.valor_previsto) * 100, 100) : 0

            return (
              <Card key={meta.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-medium text-[#1e3a5f] bg-blue-50 px-2 py-0.5 rounded">
                          {meta.programas?.codigo} — {meta.programas?.nome}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status?.color}`}>{status?.label}</span>
                        <span className="text-xs text-gray-400">{meta.exercicio}</span>
                      </div>
                      <p className="font-semibold text-gray-900">{meta.descricao}</p>
                      {meta.indicador && <p className="text-sm text-gray-500 mt-0.5">Indicador: {meta.indicador}</p>}
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-sm font-bold text-[#1e3a5f]">{formatCurrency(meta.valor_previsto)}</p>
                      <p className="text-xs text-gray-400">previsto</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Meta física</span>
                        <span className="font-medium">
                          {meta.realizado_fisico ?? 0} / {meta.meta_fisica ?? 0} {meta.unidade}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${pctFisico}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 text-right">{pctFisico.toFixed(0)}%</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Execução financeira</span>
                        <span className="font-medium">{formatCurrency(meta.realizado_financeiro)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full bg-green-500 transition-all" style={{ width: `${pctFinanceiro}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 text-right">{pctFinanceiro.toFixed(0)}%</p>
                    </div>
                  </div>

                  {meta.programas?.secretaria && <p className="text-xs text-gray-400 mt-3">{meta.programas.secretaria}</p>}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
