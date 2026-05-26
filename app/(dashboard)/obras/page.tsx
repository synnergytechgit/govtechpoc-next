'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HardHat, CheckCircle, Clock, AlertCircle, PauseCircle } from 'lucide-react'

type Obra = {
  id: string
  numero_obra: string
  nome: string
  tipo: string
  status: string
  secretaria: string | null
  responsavel_nome: string | null
  valor_contratado: number | null
  valor_medido: number | null
  percentual_executado: number | null
  data_inicio: string | null
  data_prevista_fim: string | null
  logradouro: string | null
  bairro: string | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  planejada: { label: 'Planejada', color: 'bg-gray-100 text-gray-700' },
  licitando: { label: 'Licitando', color: 'bg-blue-100 text-blue-800' },
  em_andamento: { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-800' },
  paralisada: { label: 'Paralisada', color: 'bg-red-100 text-red-800' },
  concluida: { label: 'Concluída', color: 'bg-green-100 text-green-800' },
  cancelada: { label: 'Cancelada', color: 'bg-gray-100 text-gray-500' },
}

const TIPO_LABELS: Record<string, string> = {
  pavimentacao: 'Pavimentação',
  edificacao: 'Edificação',
  saneamento: 'Saneamento',
  iluminacao: 'Iluminação',
  manutencao: 'Manutenção',
  outros: 'Outros',
}

function formatCurrency(value: number | null) {
  if (!value) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR')
}

export default function ObrasPage() {
  const [obras, setObras] = useState<Obra[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchObras() {
      const { data } = await supabase
        .from('obras')
        .select('*')
        .order('criado_em', { ascending: false })
      if (data) setObras(data)
      setLoading(false)
    }
    fetchObras()
  }, [])

  const emAndamento = obras.filter((o) => o.status === 'em_andamento').length
  const concluidas = obras.filter((o) => o.status === 'concluida').length
  const paralisadas = obras.filter((o) => o.status === 'paralisada').length
  const planejadas = obras.filter((o) => o.status === 'planejada').length

  const valorTotal = obras.reduce((acc, o) => acc + (o.valor_contratado || 0), 0)
  const valorMedido = obras.reduce((acc, o) => acc + (o.valor_medido || 0), 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <HardHat className="w-6 h-6 text-[#1e3a5f]" />
          Obras e Infraestrutura
        </h1>
        <p className="text-sm text-gray-500 mt-1">Acompanhamento de obras municipais</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" /> Em Andamento
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
              <PauseCircle className="w-4 h-4 text-red-500" /> Paralisadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{paralisadas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-gray-400" /> Planejadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-600">{planejadas}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal">Valor Total Contratado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#1e3a5f]">{formatCurrency(valorTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal">Valor Total Medido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(valorMedido)}</p>
            <p className="text-xs text-gray-400 mt-1">
              {valorTotal > 0 ? ((valorMedido / valorTotal) * 100).toFixed(1) : 0}% do contratado
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : obras.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Nenhuma obra encontrada.</div>
        ) : (
          obras.map((obra) => {
            const status = STATUS_CONFIG[obra.status]
            const pct = obra.percentual_executado || 0
            return (
              <Card key={obra.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-[#1e3a5f]">{obra.numero_obra}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status?.color}`}>
                          {status?.label}
                        </span>
                        <span className="text-xs text-gray-400">{TIPO_LABELS[obra.tipo] ?? obra.tipo}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900">{obra.nome}</h3>
                      <p className="text-sm text-gray-500">
                        {obra.logradouro}
                        {obra.bairro ? ` — ${obra.bairro}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#1e3a5f]">{formatCurrency(obra.valor_contratado)}</p>
                      <p className="text-xs text-gray-400">Medido: {formatCurrency(obra.valor_medido)}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Execução física</span>
                      <span className="font-medium">{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          pct === 100
                            ? 'bg-green-500'
                            : pct > 50
                              ? 'bg-blue-500'
                              : obra.status === 'paralisada'
                                ? 'bg-red-400'
                                : 'bg-yellow-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 mt-3 text-xs text-gray-400">
                    {obra.responsavel_nome && <span>Resp: {obra.responsavel_nome}</span>}
                    {obra.data_inicio && <span>Início: {formatDate(obra.data_inicio)}</span>}
                    {obra.data_prevista_fim && <span>Prev. fim: {formatDate(obra.data_prevista_fim)}</span>}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
