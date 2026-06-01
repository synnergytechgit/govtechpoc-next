'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Receipt, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react'

type Lancamento = {
  id: string
  tipo_tributo: string
  exercicio: number
  valor_lancado: number
  valor_pago: number
  vencimento: string | null
  status: string
  contribuintes: { inscricao: string; nome: string; cpf_cnpj: string | null; tipo: string } | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  aberto:       { label: 'Aberto',        color: 'bg-yellow-100 text-yellow-800' },
  pago:         { label: 'Pago',          color: 'bg-green-100 text-green-800' },
  parcial:      { label: 'Parcial',       color: 'bg-blue-100 text-blue-800' },
  cancelado:    { label: 'Cancelado',     color: 'bg-gray-100 text-gray-500' },
  divida_ativa: { label: 'Dívida Ativa',  color: 'bg-red-100 text-red-800' },
}

const TRIBUTO_LABELS: Record<string, string> = {
  iptu:   'IPTU',
  iss:    'ISS',
  itbi:   'ITBI',
  taxas:  'Taxas',
  outros: 'Outros',
}

function formatCurrency(value: number | null) {
  if (!value && value !== 0) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR')
}

export default function TributacaoPage() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [filtroTributo, setFiltroTributo] = useState('todos')
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from('lancamentos_tributarios')
        .select('*, contribuintes(inscricao, nome, cpf_cnpj, tipo)')
        .eq('exercicio', 2025)
        .order('criado_em', { ascending: false })
      if (data) setLancamentos(data as any)
      setLoading(false)
    }
    fetchData()
  }, [])

  const filtrados = lancamentos.filter(l => {
    const okStatus  = filtroStatus  === 'todos' || l.status === filtroStatus
    const okTributo = filtroTributo === 'todos' || l.tipo_tributo === filtroTributo
    return okStatus && okTributo
  })

  const totalLancado    = lancamentos.reduce((acc, l) => acc + l.valor_lancado, 0)
  const totalPago       = lancamentos.reduce((acc, l) => acc + l.valor_pago, 0)
  const totalInadimpl   = lancamentos.filter(l => ['aberto','parcial','divida_ativa'].includes(l.status))
    .reduce((acc, l) => acc + (l.valor_lancado - l.valor_pago), 0)
  const divAtiva        = lancamentos.filter(l => l.status === 'divida_ativa').length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Receipt className="w-6 h-6 text-[#1e3a5f]" />
          Tributação Municipal
        </h1>
        <p className="text-sm text-gray-500 mt-1">IPTU, ISS, ITBI e taxas — Exercício 2025</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#1e3a5f]" /> Total Lançado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-[#1e3a5f]">{formatCurrency(totalLancado)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" /> Total Arrecadado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totalPago)}</p>
            <p className="text-xs text-gray-400">
              {totalLancado > 0 ? ((totalPago / totalLancado) * 100).toFixed(1) : 0}% do lançado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500" /> Inadimplência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-orange-600">{formatCurrency(totalInadimpl)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" /> Dívida Ativa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{divAtiva}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={filtroStatus}
          onChange={e => setFiltroStatus(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
        >
          <option value="todos">Todos os status</option>
          <option value="aberto">Aberto</option>
          <option value="pago">Pago</option>
          <option value="parcial">Parcial</option>
          <option value="divida_ativa">Dívida Ativa</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <select
          value={filtroTributo}
          onChange={e => setFiltroTributo(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
        >
          <option value="todos">Todos os tributos</option>
          <option value="iptu">IPTU</option>
          <option value="iss">ISS</option>
          <option value="itbi">ITBI</option>
          <option value="taxas">Taxas</option>
        </select>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="p-8 text-center text-gray-400">Carregando...</div>
      ) : filtrados.length === 0 ? (
        <div className="p-8 text-center text-gray-400">Nenhum lançamento encontrado.</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 font-semibold text-gray-600">Contribuinte</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Tributo</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-right">Lançado</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-right">Pago</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-right">Saldo</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Vencimento</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((l) => {
                    const status = STATUS_CONFIG[l.status]
                    const saldo  = l.valor_lancado - l.valor_pago
                    return (
                      <tr key={l.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{l.contribuintes?.nome ?? '—'}</p>
                          <p className="text-xs text-gray-400">{l.contribuintes?.cpf_cnpj ?? ''}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-[#1e3a5f]/10 text-[#1e3a5f] rounded text-xs font-medium">
                            {TRIBUTO_LABELS[l.tipo_tributo] ?? l.tipo_tributo}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">{formatCurrency(l.valor_lancado)}</td>
                        <td className="px-4 py-3 text-right text-green-700 font-medium">{formatCurrency(l.valor_pago)}</td>
                        <td className={`px-4 py-3 text-right font-medium ${saldo > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                          {formatCurrency(saldo)}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(l.vencimento)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status?.color}`}>
                            {status?.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
