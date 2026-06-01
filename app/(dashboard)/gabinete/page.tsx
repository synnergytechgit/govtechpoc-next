'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Landmark, Calendar, AlertCircle, Clock, CheckCircle } from 'lucide-react'

type Demanda = {
  id: string
  protocolo: string
  tipo: string
  assunto: string
  solicitante: string | null
  origem: string | null
  secretaria_destino: string | null
  status: string
  prioridade: string
  prazo: string | null
  criado_em: string
}

type Evento = {
  id: string
  titulo: string
  tipo: string
  data_inicio: string
  data_fim: string | null
  local: string | null
  participantes: string | null
  status: string
}

const STATUS_DEMANDA: Record<string, { label: string; color: string }> = {
  aberta:        { label: 'Aberta',        color: 'bg-blue-100 text-blue-800' },
  em_andamento:  { label: 'Em Andamento',  color: 'bg-yellow-100 text-yellow-800' },
  respondida:    { label: 'Respondida',    color: 'bg-green-100 text-green-800' },
  encerrada:     { label: 'Encerrada',     color: 'bg-gray-100 text-gray-500' },
}

const PRIORIDADE_CONFIG: Record<string, { label: string; color: string }> = {
  baixa:   { label: 'Baixa',   color: 'bg-gray-100 text-gray-600' },
  normal:  { label: 'Normal',  color: 'bg-blue-100 text-blue-700' },
  alta:    { label: 'Alta',    color: 'bg-orange-100 text-orange-700' },
  urgente: { label: 'Urgente', color: 'bg-red-100 text-red-700' },
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR')
}

function formatDateTime(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export default function GabinetePage() {
  const [demandas, setDemandas] = useState<Demanda[]>([])
  const [agenda, setAgenda] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState<'demandas' | 'agenda'>('demandas')
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const [d, a] = await Promise.all([
        supabase.from('demandas').select('*').order('criado_em', { ascending: false }),
        supabase.from('agenda').select('*').order('data_inicio'),
      ])
      if (d.data) setDemandas(d.data)
      if (a.data) setAgenda(a.data)
      setLoading(false)
    }
    fetchData()
  }, [])

  const abertas      = demandas.filter(d => d.status === 'aberta').length
  const emAndamento  = demandas.filter(d => d.status === 'em_andamento').length
  const urgentes     = demandas.filter(d => d.prioridade === 'urgente').length
  const proximosEventos = agenda.filter(a =>
    new Date(a.data_inicio) >= new Date() && a.status === 'confirmado'
  ).length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Landmark className="w-6 h-6 text-[#1e3a5f]" />
          Gabinete do Prefeito
        </h1>
        <p className="text-sm text-gray-500 mt-1">Demandas, agenda e despachos</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" /> Demandas Abertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{abertas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-yellow-500" /> Em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{emAndamento}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" /> Urgentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{urgentes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <Calendar className="w-4 h-4 text-green-500" /> Próximos Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{proximosEventos}</p>
          </CardContent>
        </Card>
      </div>

      {/* Abas */}
      <div className="flex gap-2 border-b">
        {(['demandas', 'agenda'] as const).map(a => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              aba === a
                ? 'border-[#1e3a5f] text-[#1e3a5f]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {a === 'demandas' ? 'Demandas' : 'Agenda'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400">Carregando...</div>
      ) : (
        <>
          {/* Demandas */}
          {aba === 'demandas' && (
            <div className="space-y-3">
              {demandas.length === 0 ? (
                <div className="p-8 text-center text-gray-400">Nenhuma demanda encontrada.</div>
              ) : demandas.map((d) => {
                const status = STATUS_DEMANDA[d.status]
                const prioridade = PRIORIDADE_CONFIG[d.prioridade]
                const atrasada = d.prazo && new Date(d.prazo) < new Date() && d.status !== 'encerrada'
                return (
                  <Card key={d.id} className={`hover:shadow-md transition-shadow ${atrasada ? 'border-red-200' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-medium text-[#1e3a5f]">{d.protocolo}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status?.color}`}>
                              {status?.label}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${prioridade?.color}`}>
                              {prioridade?.label}
                            </span>
                            {atrasada && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                Atrasada
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-gray-900">{d.assunto}</p>
                          <div className="flex gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                            {d.solicitante && <span>De: {d.solicitante}</span>}
                            {d.secretaria_destino && <span>Para: {d.secretaria_destino}</span>}
                            {d.prazo && <span>Prazo: {formatDate(d.prazo)}</span>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Agenda */}
          {aba === 'agenda' && (
            <div className="space-y-3">
              {agenda.length === 0 ? (
                <div className="p-8 text-center text-gray-400">Nenhum evento na agenda.</div>
              ) : agenda.map((e) => (
                <Card key={e.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="text-center shrink-0 w-14">
                        <div className="bg-[#1e3a5f] text-white rounded-t px-2 py-0.5 text-xs">
                          {new Date(e.data_inicio).toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()}
                        </div>
                        <div className="border border-t-0 rounded-b px-2 py-1">
                          <span className="text-xl font-bold text-gray-900">
                            {new Date(e.data_inicio).getDate()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{e.titulo}</p>
                        <div className="flex gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                          <span>{formatDateTime(e.data_inicio)}</span>
                          {e.local && <span>📍 {e.local}</span>}
                          {e.participantes && <span>👥 {e.participantes}</span>}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                        e.status === 'confirmado' ? 'bg-green-100 text-green-700' :
                        e.status === 'cancelado'  ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {e.status}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
