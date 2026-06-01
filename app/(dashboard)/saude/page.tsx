'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Building2, Users, TrendingUp } from 'lucide-react'

type Unidade = {
  id: string
  nome: string
  tipo: string
  endereco: string | null
  bairro: string | null
  responsavel: string | null
  telefone: string | null
  ativo: boolean
  atendimentos_saude: { tipo_atendimento: string; quantidade: number; mes: number }[]
  indicadores_saude: { nome: string; valor: number | null; meta: number | null; unidade: string | null }[]
}

const TIPO_CONFIG: Record<string, { label: string; color: string }> = {
  ubs:      { label: 'UBS',      color: 'bg-blue-100 text-blue-800' },
  upa:      { label: 'UPA',      color: 'bg-red-100 text-red-800' },
  hospital: { label: 'Hospital', color: 'bg-purple-100 text-purple-800' },
  caps:     { label: 'CAPS',     color: 'bg-green-100 text-green-800' },
  ceo:      { label: 'CEO',      color: 'bg-yellow-100 text-yellow-800' },
  outros:   { label: 'Outros',   color: 'bg-gray-100 text-gray-700' },
}

export default function SaudePage() {
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from('unidades_saude')
        .select('*, atendimentos_saude(tipo_atendimento, quantidade, mes), indicadores_saude(nome, valor, meta, unidade)')
        .eq('ativo', true)
        .order('nome')
      if (data) setUnidades(data as any)
      setLoading(false)
    }
    fetchData()
  }, [])

  const totalUnidades = unidades.length
  const totalAtendimentos = unidades.reduce((acc, u) =>
    acc + u.atendimentos_saude.reduce((s, a) => s + a.quantidade, 0), 0)

  const indicadoresAbaixoMeta = unidades.reduce((acc, u) =>
    acc + u.indicadores_saude.filter(i =>
      i.valor !== null && i.meta !== null && i.valor < i.meta
    ).length, 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="w-6 h-6 text-[#1e3a5f]" />
          Saúde Municipal
        </h1>
        <p className="text-sm text-gray-500 mt-1">Unidades de saúde, atendimentos e indicadores</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#1e3a5f]" /> Unidades Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#1e3a5f]">{totalUnidades}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <Users className="w-4 h-4 text-green-500" /> Total Atendimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {totalAtendimentos.toLocaleString('pt-BR')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-500" /> Indicadores Abaixo da Meta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{indicadoresAbaixoMeta}</p>
          </CardContent>
        </Card>
      </div>

      {/* Unidades */}
      {loading ? (
        <div className="p-8 text-center text-gray-400">Carregando...</div>
      ) : unidades.length === 0 ? (
        <div className="p-8 text-center text-gray-400">Nenhuma unidade encontrada.</div>
      ) : (
        <div className="space-y-4">
          {unidades.map((u) => {
            const tipo = TIPO_CONFIG[u.tipo]
            const totalAtend = u.atendimentos_saude.reduce((acc, a) => acc + a.quantidade, 0)

            return (
              <Card key={u.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tipo?.color}`}>
                          {tipo?.label}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900">{u.nome}</h3>
                      <p className="text-sm text-gray-500">
                        {u.endereco}{u.bairro ? ` — ${u.bairro}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-2xl font-bold text-[#1e3a5f]">
                        {totalAtend.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-gray-400">atendimentos</p>
                    </div>
                  </div>

                  {/* Atendimentos por tipo */}
                  {u.atendimentos_saude.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                        Atendimentos por Tipo
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {Object.entries(
                          u.atendimentos_saude.reduce((acc, a) => {
                            acc[a.tipo_atendimento] = (acc[a.tipo_atendimento] || 0) + a.quantidade
                            return acc
                          }, {} as Record<string, number>)
                        ).map(([tipo, qtd]) => (
                          <span key={tipo} className="px-2 py-1 bg-gray-50 border rounded text-xs">
                            {tipo}: <strong>{qtd.toLocaleString('pt-BR')}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Indicadores */}
                  {u.indicadores_saude.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                        Indicadores de Qualidade
                      </p>
                      <div className="space-y-2">
                        {u.indicadores_saude.map((ind, i) => {
                          const pct = ind.meta && ind.meta > 0 && ind.valor !== null
                            ? Math.min((ind.valor / ind.meta) * 100, 100)
                            : 0
                          const abaixo = ind.valor !== null && ind.meta !== null && ind.valor < ind.meta
                          return (
                            <div key={i} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-600">{ind.nome}</span>
                                <span className={`font-medium ${abaixo ? 'text-red-600' : 'text-green-600'}`}>
                                  {ind.valor ?? '—'} / {ind.meta ?? '—'} {ind.unidade}
                                </span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${abaixo ? 'bg-red-400' : 'bg-green-500'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Contato */}
                  <div className="flex gap-4 mt-4 text-xs text-gray-400 flex-wrap border-t pt-3">
                    {u.responsavel && <span>Resp: {u.responsavel}</span>}
                    {u.telefone && <span>{u.telefone}</span>}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
