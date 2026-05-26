'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserCheck, UserX, Briefcase } from 'lucide-react'

type Servidor = {
  id: string
  matricula: string
  nome: string
  cpf: string | null
  email: string | null
  telefone: string | null
  tipo_vinculo: string | null
  situacao: string
  data_admissao: string | null
  salario: number | null
  cargos: { nome: string } | null
  secretarias: { nome: string; sigla: string } | null
}

const SITUACAO_CONFIG: Record<string, { label: string; color: string }> = {
  ativo: { label: 'Ativo', color: 'bg-green-100 text-green-800' },
  ferias: { label: 'Férias', color: 'bg-blue-100 text-blue-800' },
  licenca: { label: 'Licença', color: 'bg-yellow-100 text-yellow-800' },
  afastado: { label: 'Afastado', color: 'bg-orange-100 text-orange-800' },
  inativo: { label: 'Inativo', color: 'bg-gray-100 text-gray-500' },
}

const VINCULO_LABELS: Record<string, string> = {
  efetivo: 'Efetivo',
  comissionado: 'Comissionado',
  celetista: 'Celetista',
  temporario: 'Temporário',
  estagiario: 'Estagiário',
}

function formatCurrency(value: number | null) {
  if (!value) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR')
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export default function ServidoresPage() {
  const [servidores, setServidores] = useState<Servidor[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroSituacao, setFiltroSituacao] = useState('todos')
  const supabase = createClient()

  useEffect(() => {
    async function fetchServidores() {
      const { data } = await supabase.from('servidores').select('*, cargos(nome), secretarias(nome, sigla)').order('nome')
      if (data) setServidores(data as any)
      setLoading(false)
    }
    fetchServidores()
  }, [])

  const filtrados = servidores.filter((s) => filtroSituacao === 'todos' || s.situacao === filtroSituacao)

  const ativos = servidores.filter((s) => s.situacao === 'ativo').length
  const ferias = servidores.filter((s) => s.situacao === 'ferias').length
  const licenca = servidores.filter((s) => s.situacao === 'licenca').length
  const folhaTotal = servidores.reduce((acc, s) => acc + (s.salario || 0), 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-[#1e3a5f]" />
          Servidores Municipais
        </h1>
        <p className="text-sm text-gray-500 mt-1">Gestão de pessoas e quadro funcional</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-green-500" /> Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{ativos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <UserX className="w-4 h-4 text-blue-500" /> Em Férias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{ferias}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <UserX className="w-4 h-4 text-yellow-500" /> Em Licença
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{licenca}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#1e3a5f]" /> Folha Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-[#1e3a5f]">{formatCurrency(folhaTotal)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['todos', 'ativo', 'ferias', 'licenca', 'afastado', 'inativo'].map((s) => (
          <button
            key={s}
            onClick={() => setFiltroSituacao(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filtroSituacao === s ? 'bg-[#1e3a5f] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'todos' ? 'Todos' : SITUACAO_CONFIG[s]?.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400">Carregando...</div>
      ) : filtrados.length === 0 ? (
        <div className="p-8 text-center text-gray-400">Nenhum servidor encontrado.</div>
      ) : (
        <div className="grid gap-3">
          {filtrados.map((s) => {
            const situacao = SITUACAO_CONFIG[s.situacao]
            return (
              <Card key={s.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {getInitials(s.nome)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{s.nome}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${situacao?.color}`}>
                          {situacao?.label}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 flex gap-3 flex-wrap mt-0.5">
                        <span>{s.cargos?.nome ?? '—'}</span>
                        <span>·</span>
                        <span>{s.secretarias?.sigla ?? '—'}</span>
                        {s.tipo_vinculo && (
                          <>
                            <span>·</span>
                            <span>{VINCULO_LABELS[s.tipo_vinculo]}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-semibold text-[#1e3a5f]">{formatCurrency(s.salario)}</p>
                      <p className="text-xs text-gray-400">Mat. {s.matricula}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-3 text-xs text-gray-400 flex-wrap">
                    {s.cpf && <span>CPF: {s.cpf}</span>}
                    {s.email && <span>{s.email}</span>}
                    {s.telefone && <span>{s.telefone}</span>}
                    {s.data_admissao && <span>Admissão: {formatDate(s.data_admissao)}</span>}
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
