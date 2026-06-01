'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, Users, DollarSign, AlertCircle } from 'lucide-react'

type Familia = {
  id: string
  codigo_familiar: string
  responsavel_nome: string
  responsavel_cpf: string | null
  endereco: string | null
  bairro: string | null
  renda_familiar: number | null
  num_membros: number | null
  situacao: string
  perfil: string | null
  beneficios: { tipo: string; valor_mensal: number | null; status: string }[]
}

const PERFIL_CONFIG: Record<string, { label: string; color: string }> = {
  extrema_pobreza: { label: 'Extrema Pobreza', color: 'bg-red-100 text-red-800' },
  pobreza:         { label: 'Pobreza',          color: 'bg-orange-100 text-orange-800' },
  baixa_renda:     { label: 'Baixa Renda',      color: 'bg-yellow-100 text-yellow-800' },
  vulneravel:      { label: 'Vulnerável',       color: 'bg-blue-100 text-blue-800' },
}

function formatCurrency(value: number | null) {
  if (!value) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function AssistenciaSocialPage() {
  const [familias, setFamilias] = useState<Familia[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from('familias')
        .select('*, beneficios(tipo, valor_mensal, status)')
        .order('responsavel_nome')
      if (data) setFamilias(data as any)
      setLoading(false)
    }
    fetchData()
  }, [])

  const totalFamilias     = familias.length
  const totalMembros      = familias.reduce((acc, f) => acc + (f.num_membros || 0), 0)
  const extremaPobreza    = familias.filter(f => f.perfil === 'extrema_pobreza').length
  const totalBeneficios   = familias.reduce((acc, f) =>
    acc + f.beneficios.filter(b => b.status === 'ativo').reduce((s, b) => s + (b.valor_mensal || 0), 0), 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Heart className="w-6 h-6 text-[#1e3a5f]" />
          Assistência Social
        </h1>
        <p className="text-sm text-gray-500 mt-1">Famílias cadastradas e benefícios ativos</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <Users className="w-4 h-4 text-[#1e3a5f]" /> Famílias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#1e3a5f]">{totalFamilias}</p>
            <p className="text-xs text-gray-400">{totalMembros} membros</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" /> Extrema Pobreza
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{extremaPobreza}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" /> Benefícios/mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totalBeneficios)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal">Renda Média</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-[#1e3a5f]">
              {formatCurrency(totalFamilias > 0
                ? familias.reduce((acc, f) => acc + (f.renda_familiar || 0), 0) / totalFamilias
                : 0
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de famílias */}
      {loading ? (
        <div className="p-8 text-center text-gray-400">Carregando...</div>
      ) : familias.length === 0 ? (
        <div className="p-8 text-center text-gray-400">Nenhuma família cadastrada.</div>
      ) : (
        <div className="space-y-3">
          {familias.map((f) => {
            const perfil = PERFIL_CONFIG[f.perfil ?? '']
            const beneficiosAtivos = f.beneficios.filter(b => b.status === 'ativo')
            const totalFamilia = beneficiosAtivos.reduce((acc, b) => acc + (b.valor_mensal || 0), 0)
            return (
              <Card key={f.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-medium text-[#1e3a5f]">{f.codigo_familiar}</span>
                        {perfil && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${perfil.color}`}>
                            {perfil.label}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900">{f.responsavel_nome}</h3>
                      <p className="text-sm text-gray-500">
                        {f.endereco}{f.bairro ? ` — ${f.bairro}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-sm font-bold text-green-600">{formatCurrency(totalFamilia)}/mês</p>
                      <p className="text-xs text-gray-400">em benefícios</p>
                    </div>
                  </div>

                  <div className="flex gap-4 text-xs text-gray-500 mb-3 flex-wrap">
                    <span>{f.num_membros} membros</span>
                    <span>·</span>
                    <span>Renda: {formatCurrency(f.renda_familiar)}</span>
                    {f.responsavel_cpf && <span>· CPF: {f.responsavel_cpf}</span>}
                  </div>

                  {beneficiosAtivos.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {beneficiosAtivos.map((b, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                          {b.tipo}{b.valor_mensal ? ` — ${formatCurrency(b.valor_mensal)}` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
