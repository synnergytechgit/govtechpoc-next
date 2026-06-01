'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, TrendingUp, TrendingDown, FileText } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type Receita = {
  mes: number
  natureza_receita: string
  valor_previsto: number
  valor_arrecadado: number
}

type Despesa = {
  mes: number
  secretaria: string
  natureza_despesa: string
  valor_empenhado: number
  valor_pago: number
}

type Contrato = {
  id: string
  numero: string
  fornecedor: string
  cnpj: string | null
  objeto: string | null
  valor: number | null
  data_inicio: string | null
  data_fim: string | null
  modalidade: string | null
  situacao: string
}

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function formatCurrency(value: number | null) {
  if (!value) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR')
}

export default function TransparenciaPage() {
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState<'receitas'|'despesas'|'contratos'>('receitas')
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const [r, d, c] = await Promise.all([
        supabase.from('transparencia_receitas').select('*').eq('exercicio', 2025).order('mes'),
        supabase.from('transparencia_despesas').select('*').eq('exercicio', 2025).order('mes'),
        supabase.from('transparencia_contratos').select('*').order('criado_em', { ascending: false }),
      ])
      if (r.data) setReceitas(r.data)
      if (d.data) setDespesas(d.data)
      if (c.data) setContratos(c.data)
      setLoading(false)
    }
    fetchData()
  }, [])

  // Agrupa receitas por mês para o gráfico
  const receitasPorMes = MESES.map((mes, i) => {
    const mesNum = i + 1
    const itens = receitas.filter(r => r.mes === mesNum)
    return {
      mes,
      Previsto: itens.reduce((acc, r) => acc + r.valor_previsto, 0),
      Arrecadado: itens.reduce((acc, r) => acc + r.valor_arrecadado, 0),
    }
  }).filter(m => m.Previsto > 0 || m.Arrecadado > 0)

  const totalPrevisto    = receitas.reduce((acc, r) => acc + r.valor_previsto, 0)
  const totalArrecadado  = receitas.reduce((acc, r) => acc + r.valor_arrecadado, 0)
  const totalEmpenhado   = despesas.reduce((acc, d) => acc + d.valor_empenhado, 0)
  const totalPago        = despesas.reduce((acc, d) => acc + d.valor_pago, 0)
  const contratosVigentes = contratos.filter(c => c.situacao === 'vigente').length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Eye className="w-6 h-6 text-[#1e3a5f]" />
          Transparência Pública
        </h1>
        <p className="text-sm text-gray-500 mt-1">Dados públicos — Exercício 2025</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" /> Receita Arrecadada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold text-green-600">{formatCurrency(totalArrecadado)}</p>
            <p className="text-xs text-gray-400">de {formatCurrency(totalPrevisto)} previstos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-blue-500" /> Despesa Paga
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold text-blue-600">{formatCurrency(totalPago)}</p>
            <p className="text-xs text-gray-400">de {formatCurrency(totalEmpenhado)} empenhados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#1e3a5f]" /> Contratos Vigentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#1e3a5f]">{contratosVigentes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal">% Execução Receita</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#1e3a5f]">
              {totalPrevisto > 0 ? ((totalArrecadado / totalPrevisto) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Abas */}
      <div className="flex gap-2 border-b">
        {(['receitas', 'despesas', 'contratos'] as const).map(a => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              aba === a
                ? 'border-[#1e3a5f] text-[#1e3a5f]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {a === 'receitas' ? 'Receitas' : a === 'despesas' ? 'Despesas' : 'Contratos'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400">Carregando...</div>
      ) : (
        <>
          {/* Receitas */}
          {aba === 'receitas' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-[#1e3a5f]">Receita Prevista vs Arrecadada por Mês</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={receitasPorMes}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Legend />
                      <Bar dataKey="Previsto"    fill="#94a3b8" radius={[4,4,0,0]} />
                      <Bar dataKey="Arrecadado"  fill="#1e3a5f" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-4 py-2 font-semibold text-gray-600">Mês</th>
                      <th className="px-4 py-2 font-semibold text-gray-600">Natureza</th>
                      <th className="px-4 py-2 font-semibold text-gray-600 text-right">Previsto</th>
                      <th className="px-4 py-2 font-semibold text-gray-600 text-right">Arrecadado</th>
                      <th className="px-4 py-2 font-semibold text-gray-600 text-right">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receitas.map((r, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-2">{MESES[r.mes - 1]}</td>
                        <td className="px-4 py-2">{r.natureza_receita}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(r.valor_previsto)}</td>
                        <td className="px-4 py-2 text-right font-medium text-green-700">{formatCurrency(r.valor_arrecadado)}</td>
                        <td className="px-4 py-2 text-right">
                          {r.valor_previsto > 0 ? ((r.valor_arrecadado / r.valor_previsto) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Despesas */}
          {aba === 'despesas' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-2 font-semibold text-gray-600">Mês</th>
                    <th className="px-4 py-2 font-semibold text-gray-600">Secretaria</th>
                    <th className="px-4 py-2 font-semibold text-gray-600">Natureza</th>
                    <th className="px-4 py-2 font-semibold text-gray-600 text-right">Empenhado</th>
                    <th className="px-4 py-2 font-semibold text-gray-600 text-right">Pago</th>
                  </tr>
                </thead>
                <tbody>
                  {despesas.map((d, i) => (
                    <tr key={i} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2">{MESES[d.mes - 1]}</td>
                      <td className="px-4 py-2">{d.secretaria}</td>
                      <td className="px-4 py-2 text-gray-500">{d.natureza_despesa}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(d.valor_empenhado)}</td>
                      <td className="px-4 py-2 text-right font-medium text-blue-700">{formatCurrency(d.valor_pago)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Contratos */}
          {aba === 'contratos' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-2 font-semibold text-gray-600">Número</th>
                    <th className="px-4 py-2 font-semibold text-gray-600">Fornecedor</th>
                    <th className="px-4 py-2 font-semibold text-gray-600">Objeto</th>
                    <th className="px-4 py-2 font-semibold text-gray-600 text-right">Valor</th>
                    <th className="px-4 py-2 font-semibold text-gray-600">Vigência</th>
                    <th className="px-4 py-2 font-semibold text-gray-600">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {contratos.map((c) => (
                    <tr key={c.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-[#1e3a5f]">{c.numero}</td>
                      <td className="px-4 py-2">{c.fornecedor}</td>
                      <td className="px-4 py-2 text-gray-500 max-w-xs truncate">{c.objeto}</td>
                      <td className="px-4 py-2 text-right font-medium">{formatCurrency(c.valor)}</td>
                      <td className="px-4 py-2 text-xs text-gray-500">
                        {formatDate(c.data_inicio)} — {formatDate(c.data_fim)}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          c.situacao === 'vigente' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {c.situacao}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
