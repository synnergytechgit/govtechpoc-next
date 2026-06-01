'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import {
  TrendingUp, TrendingDown, FileText, MessageSquare,
  HardHat, AlertCircle, CheckCircle, Clock, ArrowRight,
  DollarSign, Users, GraduationCap, Activity
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

function formatCurrency(value: number) {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR')
}

const CORES = ['#1e3a5f', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function DashboardPage() {
  const supabase = createClient()

  // Estados
  const [receitaPrevista, setReceitaPrevista]   = useState(0)
  const [receitaArrecadada, setReceitaArrecadada] = useState(0)
  const [despesaFixada, setDespesaFixada]       = useState(0)
  const [despesaEmpenhada, setDespesaEmpenhada] = useState(0)
  const [despesaPaga, setDespesaPaga]           = useState(0)
  const [contratosAtivos, setContratosAtivos]   = useState(0)
  const [contratosVencendo, setContratosVencendo] = useState<any[]>([])
  const [manifestacoesAbertas, setManifestacoesAbertas] = useState(0)
  const [manifestacoesAtrasadas, setManifestacoesAtrasadas] = useState(0)
  const [obrasAndamento, setObrasAndamento]     = useState(0)
  const [obrasParalisadas, setObrasParalisadas] = useState(0)
  const [obrasLista, setObrasLista]             = useState<any[]>([])
  const [totalServidores, setTotalServidores]   = useState(0)
  const [totalAlunos, setTotalAlunos]           = useState(0)
  const [totalAtendimentos, setTotalAtendimentos] = useState(0)
  const [ultimosEmpenhos, setUltimosEmpenhos]   = useState<any[]>([])
  const [demandasUrgentes, setDemandasUrgentes] = useState<any[]>([])
  const [despesaSecretaria, setDespesaSecretaria] = useState<any[]>([])
  const [loading, setLoading]                   = useState(true)

  useEffect(() => {
    async function fetchAll() {
      const [
        receitas, dotacoes, contratos, manifestacoes,
        obras, servidores, matriculas, atendimentos,
        empenhos, demandas, despesas
      ] = await Promise.all([
        supabase.from('receita_prevista').select('valor_previsto, valor_arrecadado'),
        supabase.from('dotacoes').select('valor_dotacao_inicial, valor_empenhado, valor_pago'),
        supabase.from('contratos').select('id, numero, fornecedor, objeto, data_fim, status'),
        supabase.from('manifestacoes').select('id, status, sla_prazo'),
        supabase.from('obras').select('id, nome, status, percentual_executado, bairro'),
        supabase.from('servidores').select('id, situacao'),
        supabase.from('matriculas').select('total_alunos'),
        supabase.from('atendimentos_saude').select('quantidade'),
        supabase.from('empenhos').select('numero_empenho, fornecedor, valor, status, data_empenho').order('criado_em', { ascending: false }).limit(5),
        supabase.from('demandas').select('id, protocolo, assunto, prioridade, prazo, secretaria_destino').eq('prioridade', 'urgente').neq('status', 'encerrada').limit(3),
        supabase.from('transparencia_despesas').select('secretaria, valor_pago'),
      ])

      // Receita
      if (receitas.data) {
        setReceitaPrevista(receitas.data.reduce((a, r) => a + (r.valor_previsto || 0), 0))
        setReceitaArrecadada(receitas.data.reduce((a, r) => a + (r.valor_arrecadado || 0), 0))
      }

      // Despesa
      if (dotacoes.data) {
        setDespesaFixada(dotacoes.data.reduce((a, d) => a + (d.valor_dotacao_inicial || 0), 0))
        setDespesaEmpenhada(dotacoes.data.reduce((a, d) => a + (d.valor_empenhado || 0), 0))
        setDespesaPaga(dotacoes.data.reduce((a, d) => a + (d.valor_pago || 0), 0))
      }

      // Contratos
      if (contratos.data) {
        const hoje = new Date()
        const em30 = new Date(); em30.setDate(em30.getDate() + 30)
        setContratosAtivos(contratos.data.filter(c => c.status === 'vigente').length)
        setContratosVencendo(contratos.data.filter(c => {
          if (!c.data_fim || c.status !== 'vigente') return false
          const fim = new Date(c.data_fim)
          return fim >= hoje && fim <= em30
        }).slice(0, 3))
      }

      // Manifestações
      if (manifestacoes.data) {
        const hoje = new Date()
        setManifestacoesAbertas(manifestacoes.data.filter(m =>
          ['aberta', 'em_analise'].includes(m.status)
        ).length)
        setManifestacoesAtrasadas(manifestacoes.data.filter(m =>
          m.sla_prazo && new Date(m.sla_prazo) < hoje &&
          !['respondida', 'encerrada'].includes(m.status)
        ).length)
      }

      // Obras
      if (obras.data) {
        setObrasAndamento(obras.data.filter(o => o.status === 'em_andamento').length)
        setObrasParalisadas(obras.data.filter(o => o.status === 'paralisada').length)
        setObrasLista(obras.data.filter(o => o.status === 'em_andamento').slice(0, 3))
      }

      // Servidores
      if (servidores.data) {
        setTotalServidores(servidores.data.filter(s => s.situacao === 'ativo').length)
      }

      // Alunos
      if (matriculas.data) {
        setTotalAlunos(matriculas.data.reduce((a, m) => a + (m.total_alunos || 0), 0))
      }

      // Atendimentos saúde
      if (atendimentos.data) {
        setTotalAtendimentos(atendimentos.data.reduce((a, m) => a + (m.quantidade || 0), 0))
      }

      // Empenhos
      if (empenhos.data) setUltimosEmpenhos(empenhos.data)

      // Demandas urgentes
      if (demandas.data) setDemandasUrgentes(demandas.data)

      // Despesa por secretaria
      if (despesas.data) {
        const agrupado = despesas.data.reduce((acc: any, d) => {
          acc[d.secretaria] = (acc[d.secretaria] || 0) + d.valor_pago
          return acc
        }, {})
        setDespesaSecretaria(
          Object.entries(agrupado)
            .map(([name, value]) => ({ name: name.replace('Secretaria de ', ''), value }))
            .sort((a: any, b: any) => b.value - a.value)
        )
      }

      setLoading(false)
    }
    fetchAll()
  }, [])

  const pctReceita  = receitaPrevista > 0 ? (receitaArrecadada / receitaPrevista * 100) : 0
  const pctDespesa  = despesaFixada > 0 ? (despesaEmpenhada / despesaFixada * 100) : 0
  const pctPago     = despesaFixada > 0 ? (despesaPaga / despesaFixada * 100) : 0

  const barData = [
    { name: 'Receita',  Previsto: receitaPrevista,  Realizado: receitaArrecadada },
    { name: 'Despesa',  Previsto: despesaFixada,    Realizado: despesaEmpenhada },
  ]

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center text-gray-400">
          <div className="w-8 h-8 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Carregando painel...
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Painel Executivo</h1>
        <p className="text-sm text-gray-500 mt-1">
          Visão integrada da gestão municipal — {new Date().toLocaleDateString('pt-BR', { dateStyle: 'long' })}
        </p>
      </div>

      {/* ALERTAS */}
      {(contratosVencendo.length > 0 || manifestacoesAtrasadas > 0 || obrasParalisadas > 0 || demandasUrgentes.length > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
          <p className="text-sm font-semibold text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Alertas que precisam de atenção
          </p>
          <div className="flex gap-3 flex-wrap">
            {contratosVencendo.length > 0 && (
              <Link href="/contratos">
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium hover:bg-red-200 cursor-pointer">
                  {contratosVencendo.length} contrato(s) vencendo em 30 dias
                </span>
              </Link>
            )}
            {manifestacoesAtrasadas > 0 && (
              <Link href="/ouvidoria">
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium hover:bg-red-200 cursor-pointer">
                  {manifestacoesAtrasadas} manifestação(ões) com SLA atrasado
                </span>
              </Link>
            )}
            {obrasParalisadas > 0 && (
              <Link href="/obras">
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium hover:bg-red-200 cursor-pointer">
                  {obrasParalisadas} obra(s) paralisada(s)
                </span>
              </Link>
            )}
            {demandasUrgentes.length > 0 && (
              <Link href="/gabinete">
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium hover:bg-red-200 cursor-pointer">
                  {demandasUrgentes.length} demanda(s) urgente(s) no gabinete
                </span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* KPIs FINANCEIROS */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Financeiro</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" /> Receita Arrecadada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(receitaArrecadada)}</p>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Meta: {formatCurrency(receitaPrevista)}</span>
                  <span className="font-medium">{pctReceita.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${Math.min(pctReceita, 100)}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-blue-500" /> Despesa Empenhada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(despesaEmpenhada)}</p>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Dotação: {formatCurrency(despesaFixada)}</span>
                  <span className="font-medium">{pctDespesa.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${pctDespesa > 90 ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(pctDespesa, 100)}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#1e3a5f]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#1e3a5f]" /> Despesa Paga
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-[#1e3a5f]">{formatCurrency(despesaPaga)}</p>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Saldo: {formatCurrency(receitaArrecadada - despesaPaga)}</span>
                  <span className="font-medium">{pctPago.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-[#1e3a5f]" style={{ width: `${Math.min(pctPago, 100)}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
                <FileText className="w-4 h-4 text-yellow-500" /> Contratos Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600">{contratosAtivos}</p>
              {contratosVencendo.length > 0 && (
                <p className="text-xs text-red-500 mt-1 font-medium">
                  ⚠ {contratosVencendo.length} vencendo em 30 dias
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-[#1e3a5f]">Execução Orçamentária</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="Previsto"  fill="#e2e8f0" radius={[4,4,0,0]} />
                <Bar dataKey="Realizado" fill="#1e3a5f" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base text-[#1e3a5f]">Despesa por Secretaria</CardTitle>
          </CardHeader>
          <CardContent>
            {despesaSecretaria.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={despesaSecretaria}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    fontSize={10}
                  >
                    {despesaSecretaria.map((_, i) => (
                      <Cell key={i} fill={CORES[i % CORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* KPIs OPERACIONAIS */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Operacional</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-500" /> Ouvidoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{manifestacoesAbertas}</p>
              <p className="text-xs text-gray-400 mt-1">manifestações abertas</p>
              {manifestacoesAtrasadas > 0 && (
                <p className="text-xs text-red-500 font-medium">{manifestacoesAtrasadas} atrasadas</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
                <HardHat className="w-4 h-4 text-yellow-500" /> Obras
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600">{obrasAndamento}</p>
              <p className="text-xs text-gray-400 mt-1">em andamento</p>
              {obrasParalisadas > 0 && (
                <p className="text-xs text-red-500 font-medium">{obrasParalisadas} paralisadas</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
                <Users className="w-4 h-4 text-[#1e3a5f]" /> Servidores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[#1e3a5f]">{totalServidores}</p>
              <p className="text-xs text-gray-400 mt-1">ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-green-500" /> Educação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{totalAlunos.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-gray-400 mt-1">alunos matriculados</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* LINHA 3 — Obras + Empenhos + Demandas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Obras em andamento */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-[#1e3a5f]">Obras em Andamento</CardTitle>
              <Link href="/obras" className="text-xs text-[#1e3a5f] hover:underline flex items-center gap-1">
                Ver todas <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {obrasLista.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhuma obra em andamento.</p>
            ) : obrasLista.map((o) => (
              <div key={o.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-800 truncate max-w-[160px]">{o.nome}</span>
                  <span className="text-gray-500 shrink-0 ml-2">{o.percentual_executado}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-yellow-400"
                    style={{ width: `${o.percentual_executado}%` }}
                  />
                </div>
                {o.bairro && <p className="text-xs text-gray-400 mt-0.5">{o.bairro}</p>}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Últimos empenhos */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-[#1e3a5f]">Últimos Empenhos</CardTitle>
              <Link href="/financeiro/empenhos" className="text-xs text-[#1e3a5f] hover:underline flex items-center gap-1">
                Ver todos <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {ultimosEmpenhos.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum empenho.</p>
            ) : ultimosEmpenhos.map((e, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{e.fornecedor}</p>
                  <p className="text-xs text-gray-400">{e.numero_empenho}</p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-xs font-bold text-[#1e3a5f]">{formatCurrency(e.valor)}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    e.status === 'pago' ? 'bg-green-100 text-green-700' :
                    e.status === 'liquidado' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{e.status}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Demandas urgentes */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-[#1e3a5f]">Demandas Urgentes</CardTitle>
              <Link href="/gabinete" className="text-xs text-[#1e3a5f] hover:underline flex items-center gap-1">
                Ver todas <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {demandasUrgentes.length === 0 ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <p className="text-sm">Nenhuma demanda urgente.</p>
              </div>
            ) : demandasUrgentes.map((d) => (
              <div key={d.id} className="border-l-2 border-red-400 pl-3">
                <p className="text-sm font-medium text-gray-800 line-clamp-2">{d.assunto}</p>
                <div className="flex gap-2 text-xs text-gray-400 mt-0.5">
                  <span>{d.protocolo}</span>
                  {d.prazo && <span>Prazo: {formatDate(d.prazo)}</span>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Saúde */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-[#1e3a5f] flex items-center gap-2">
              <Activity className="w-5 h-5" /> Saúde Municipal
            </CardTitle>
            <Link href="/saude" className="text-xs text-[#1e3a5f] hover:underline flex items-center gap-1">
              Ver detalhes <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-[#1e3a5f]">{totalAtendimentos.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-gray-400">atendimentos realizados</p>
            </div>
            <div className="flex-1 h-px bg-gray-100" />
            <p className="text-sm text-gray-500">
              Dados consolidados das unidades de saúde municipais no exercício atual.
            </p>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
