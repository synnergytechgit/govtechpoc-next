'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, BookOpen, Users, TrendingUp } from 'lucide-react'

type Escola = {
  id: string
  nome: string
  tipo: string
  endereco: string | null
  bairro: string | null
  diretor: string | null
  telefone: string | null
  capacidade: number | null
  matriculas: { serie: string; turno: string; total_alunos: number }[]
  indicadores_educacao: { nome: string; valor: number | null; meta: number | null; unidade: string | null }[]
}

const TIPO_CONFIG: Record<string, { label: string; color: string }> = {
  emef:   { label: 'EMEF',   color: 'bg-blue-100 text-blue-800' },
  emei:   { label: 'EMEI',   color: 'bg-green-100 text-green-800' },
  cei:    { label: 'CEI',    color: 'bg-yellow-100 text-yellow-800' },
  eja:    { label: 'EJA',    color: 'bg-purple-100 text-purple-800' },
  outros: { label: 'Outros', color: 'bg-gray-100 text-gray-700' },
}

const TURNO_LABELS: Record<string, string> = {
  manha:    'Manhã',
  tarde:    'Tarde',
  noite:    'Noite',
  integral: 'Integral',
}

export default function EducacaoPage() {
  const [escolas, setEscolas] = useState<Escola[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from('escolas')
        .select('*, matriculas(serie, turno, total_alunos), indicadores_educacao(nome, valor, meta, unidade)')
        .eq('ativo', true)
        .order('nome')
      if (data) setEscolas(data as any)
      setLoading(false)
    }
    fetchData()
  }, [])

  const totalEscolas  = escolas.length
  const totalAlunos   = escolas.reduce((acc, e) =>
    acc + e.matriculas.reduce((s, m) => s + m.total_alunos, 0), 0)
  const totalCapacidade = escolas.reduce((acc, e) => acc + (e.capacidade || 0), 0)
  const indAbaixoMeta = escolas.reduce((acc, e) =>
    acc + e.indicadores_educacao.filter(i =>
      i.valor !== null && i.meta !== null && i.valor < i.meta
    ).length, 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-[#1e3a5f]" />
          Educação Municipal
        </h1>
        <p className="text-sm text-gray-500 mt-1">Escolas, matrículas e indicadores educacionais</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#1e3a5f]" /> Escolas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#1e3a5f]">{totalEscolas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <Users className="w-4 h-4 text-green-500" /> Total Alunos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{totalAlunos.toLocaleString('pt-BR')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal">Capacidade Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#1e3a5f]">{totalCapacidade.toLocaleString('pt-BR')}</p>
            <p className="text-xs text-gray-400 mt-1">
              {totalCapacidade > 0 ? ((totalAlunos / totalCapacidade) * 100).toFixed(0) : 0}% ocupado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-500" /> Indicadores Abaixo Meta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{indAbaixoMeta}</p>
          </CardContent>
        </Card>
      </div>

      {/* Escolas */}
      {loading ? (
        <div className="p-8 text-center text-gray-400">Carregando...</div>
      ) : escolas.length === 0 ? (
        <div className="p-8 text-center text-gray-400">Nenhuma escola encontrada.</div>
      ) : (
        <div className="space-y-4">
          {escolas.map((e) => {
            const tipo = TIPO_CONFIG[e.tipo]
            const totalAlunos = e.matriculas.reduce((acc, m) => acc + m.total_alunos, 0)
            const ocupacao = e.capacidade && e.capacidade > 0
              ? Math.min((totalAlunos / e.capacidade) * 100, 100)
              : 0

            return (
              <Card key={e.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tipo?.color}`}>
                          {tipo?.label}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900">{e.nome}</h3>
                      <p className="text-sm text-gray-500">
                        {e.endereco}{e.bairro ? ` — ${e.bairro}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-2xl font-bold text-[#1e3a5f]">{totalAlunos}</p>
                      <p className="text-xs text-gray-400">alunos / {e.capacidade} vagas</p>
                    </div>
                  </div>

                  {/* Ocupação */}
                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Ocupação</span>
                      <span className="font-medium">{ocupacao.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          ocupacao > 90 ? 'bg-red-500' :
                          ocupacao > 75 ? 'bg-yellow-400' : 'bg-green-500'
                        }`}
                        style={{ width: `${ocupacao}%` }}
                      />
                    </div>
                  </div>

                  {/* Turmas */}
                  {e.matriculas.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Turmas</p>
                      <div className="flex gap-2 flex-wrap">
                        {e.matriculas.map((m, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-50 border rounded text-xs">
                            {m.serie} ({TURNO_LABELS[m.turno]}): <strong>{m.total_alunos}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Indicadores */}
                  {e.indicadores_educacao.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Indicadores</p>
                      <div className="space-y-2">
                        {e.indicadores_educacao.map((ind, i) => {
                          const pct = ind.meta && ind.meta > 0 && ind.valor !== null
                            ? Math.min((ind.valor / ind.meta) * 100, 100) : 0
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
                                  className={`h-1.5 rounded-full ${abaixo ? 'bg-red-400' : 'bg-green-500'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 mt-3 text-xs text-gray-400 border-t pt-3 flex-wrap">
                    {e.diretor && <span>Dir: {e.diretor}</span>}
                    {e.telefone && <span>{e.telefone}</span>}
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
