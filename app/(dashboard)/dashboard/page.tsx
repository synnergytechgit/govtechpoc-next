'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader, EmptyState, LoadingState } from '@/components/PageHeader'
import { brl, pct, dateBR } from '@/lib/format'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, FileCheck, MessageSquareWarning } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

export const dynamic = 'force-dynamic'

const statusEmpenho: Record<string, string> = {
  emitido: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  liquidado: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  pago: 'bg-green-100 text-green-800 hover:bg-green-100',
}

type Empenho = { id: string; numero_empenho: string; fornecedor: string; valor: number; status: string; data_empenho: string }

export default function DashboardPage() {
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<{
    receita: { natureza_receita: string; valor_previsto: number; valor_arrecadado: number }[]
    dotacoes: { valor_dotacao_inicial: number; valor_empenhado: number }[]
    contratosAtivos: number
    manifestacoesAbertas: number
    empenhos: Empenho[]
  } | null>(null)

  useEffect(() => {
    async function load() {
      const [rec, dot, contr, manif, emp] = await Promise.all([
        supabase.from('receita_prevista').select('natureza_receita,valor_previsto,valor_arrecadado'),
        supabase.from('dotacoes').select('valor_dotacao_inicial,valor_empenhado'),
        supabase.from('contratos').select('status').eq('status', 'vigente'),
        supabase.from('manifestacoes').select('status').in('status', ['aberta', 'em_analise']),
        supabase.from('empenhos').select('*').order('criado_em', { ascending: false }).limit(5),
      ])
      setData({
        receita: rec.data ?? [],
        dotacoes: dot.data ?? [],
        contratosAtivos: contr.data?.length ?? 0,
        manifestacoesAbertas: manif.data?.length ?? 0,
        empenhos: emp.data ?? [],
      })
      setIsLoading(false)
    }
    load()
  }, [])

  if (isLoading || !data) return (<><PageHeader title="Dashboard" subtitle="Visão geral da gestão municipal" /><LoadingState /></>)

  const totalPrev = data.receita.reduce((s, r) => s + Number(r.valor_previsto), 0)
  const totalArr = data.receita.reduce((s, r) => s + Number(r.valor_arrecadado), 0)
  const pctArr = totalPrev > 0 ? (totalArr / totalPrev) * 100 : 0
  const totalDot = data.dotacoes.reduce((s, r) => s + Number(r.valor_dotacao_inicial), 0)
  const totalEmp = data.dotacoes.reduce((s, r) => s + Number(r.valor_empenhado), 0)
  const pctEmp = totalDot > 0 ? (totalEmp / totalDot) * 100 : 0
  const chartData = data.receita.map((r) => ({
    natureza: r.natureza_receita,
    Previsto: Number(r.valor_previsto),
    Arrecadado: Number(r.valor_arrecadado),
  }))

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Visão geral da gestão municipal" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={<TrendingUp className="w-5 h-5 text-green-600" />} title="Receita Arrecadada"
          value={brl(totalArr)} sub={`${pct(pctArr)} do previsto`} progress={pctArr} color="bg-green-500" />
        <KpiCard icon={<TrendingDown className="w-5 h-5 text-[#1e3a5f]" />} title="Despesa Empenhada"
          value={brl(totalEmp)} sub={`${pct(pctEmp)} da dotação`} progress={pctEmp} color="bg-[#1e3a5f]" />
        <KpiCard icon={<FileCheck className="w-5 h-5 text-green-600" />} title="Contratos Ativos"
          value={String(data.contratosAtivos)} badge={<Badge className="bg-green-100 text-green-800 hover:bg-green-100">vigentes</Badge>} />
        <KpiCard icon={<MessageSquareWarning className={`w-5 h-5 ${data.manifestacoesAbertas > 0 ? 'text-red-500' : 'text-gray-400'}`} />}
          title="Manifestações Abertas" value={String(data.manifestacoesAbertas)}
          badge={<Badge className={data.manifestacoesAbertas > 0 ? 'bg-red-100 text-red-800 hover:bg-red-100' : 'bg-gray-100 text-gray-600'}>
            {data.manifestacoesAbertas > 0 ? 'atenção' : 'ok'}
          </Badge>} />
      </div>

      <Card className="p-6 mb-6">
        <h3 className="text-base font-semibold mb-1">Receita Prevista vs Arrecadada</h3>
        <p className="text-xs text-gray-500 mb-4">Comparativo por natureza de receita</p>
        {chartData.length === 0 ? <EmptyState message="Sem dados de receita." /> : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                <XAxis dataKey="natureza" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `R$ ${(v / 1_000_000).toFixed(1)}M`} />
                <Tooltip formatter={(v: number) => brl(v)} />
                <Legend />
                <Bar dataKey="Previsto" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Arrecadado" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-base font-semibold mb-4">Últimos empenhos</h3>
        {data.empenhos.length === 0 ? <EmptyState message="Nenhum empenho cadastrado." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 border-b">
                <tr>
                  <th className="text-left font-medium py-2">Nº Empenho</th>
                  <th className="text-left font-medium py-2">Fornecedor</th>
                  <th className="text-right font-medium py-2">Valor</th>
                  <th className="text-left font-medium py-2 pl-4">Status</th>
                  <th className="text-left font-medium py-2">Data</th>
                </tr>
              </thead>
              <tbody>
                {data.empenhos.map((e) => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="py-3 font-mono text-xs">{e.numero_empenho}</td>
                    <td className="py-3">{e.fornecedor}</td>
                    <td className="py-3 text-right font-medium">{brl(Number(e.valor))}</td>
                    <td className="py-3 pl-4"><Badge className={statusEmpenho[e.status] ?? ''}>{e.status}</Badge></td>
                    <td className="py-3">{dateBR(e.data_empenho)}</td>
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

function KpiCard({ icon, title, value, sub, progress, color, badge }: {
  icon: React.ReactNode; title: string; value: string;
  sub?: string; progress?: number; color?: string; badge?: React.ReactNode
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs uppercase tracking-wide text-gray-500 font-medium">{title}</div>
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
      {typeof progress === 'number' && (
        <div className="mt-3 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
      )}
      {badge && <div className="mt-3">{badge}</div>}
    </Card>
  )
}
