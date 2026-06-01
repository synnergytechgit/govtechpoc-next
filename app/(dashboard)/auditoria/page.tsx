'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

type AuditEntry = {
  id: number
  municipio_id: string | null
  usuario_email: string | null
  tabela: string
  operacao: string
  registro_id: string | null
  dados_antes: any
  dados_depois: any
  criado_em: string
}

const OPERACAO_CONFIG: Record<string, { label: string; color: string }> = {
  INSERT: { label: 'Criação',   color: 'bg-green-100 text-green-800' },
  UPDATE: { label: 'Alteração', color: 'bg-yellow-100 text-yellow-800' },
  DELETE: { label: 'Exclusão',  color: 'bg-red-100 text-red-800' },
}

const TABELA_LABELS: Record<string, string> = {
  empenhos:                'Empenhos',
  contratos:               'Contratos',
  licitacoes:              'Licitações',
  manifestacoes:           'Ouvidoria',
  obras:                   'Obras',
  servidores:              'Servidores',
  lancamentos_tributarios: 'Tributação',
  dotacoes:                'Dotações',
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  })
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroTabela, setFiltroTabela] = useState('todos')
  const [filtroOp, setFiltroOp] = useState('todos')
  const [expandido, setExpandido] = useState<number | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchLogs() {
      const { data } = await supabase
        .from('audit_log')
        .select('*')
        .order('criado_em', { ascending: false })
        .limit(200)
      if (data) setLogs(data)
      setLoading(false)
    }
    fetchLogs()
  }, [])

  const filtrados = logs.filter(l => {
    const okTabela = filtroTabela === 'todos' || l.tabela === filtroTabela
    const okOp     = filtroOp === 'todos' || l.operacao === filtroOp
    const okBusca  = !busca ||
      l.tabela.includes(busca.toLowerCase()) ||
      (l.usuario_email?.toLowerCase().includes(busca.toLowerCase()))
    return okTabela && okOp && okBusca
  })

  const totalInserts = logs.filter(l => l.operacao === 'INSERT').length
  const totalUpdates = logs.filter(l => l.operacao === 'UPDATE').length
  const totalDeletes = logs.filter(l => l.operacao === 'DELETE').length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-[#1e3a5f]" />
          Auditoria do Sistema
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Trilha imutável de todas as ações — últimas 200 operações
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal">Criações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{totalInserts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal">Alterações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{totalUpdates}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal">Exclusões</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{totalDeletes}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <Input
            placeholder="Buscar por tabela ou usuário..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="pl-9 w-64"
          />
        </div>
        <select
          value={filtroTabela}
          onChange={e => setFiltroTabela(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
        >
          <option value="todos">Todas as tabelas</option>
          {Object.entries(TABELA_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          value={filtroOp}
          onChange={e => setFiltroOp(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
        >
          <option value="todos">Todas as operações</option>
          <option value="INSERT">Criação</option>
          <option value="UPDATE">Alteração</option>
          <option value="DELETE">Exclusão</option>
        </select>
        <span className="text-sm text-gray-400 ml-auto">
          {filtrados.length} registro(s)
        </span>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="p-8 text-center text-gray-400">Carregando...</div>
      ) : filtrados.length === 0 ? (
        <div className="p-8 text-center text-gray-400">
          Nenhum registro de auditoria encontrado.
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 font-semibold text-gray-600">Data/Hora</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Usuário</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Módulo</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Operação</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Registro</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((log) => {
                    const op = OPERACAO_CONFIG[log.operacao]
                    const isExpanded = expandido === log.id
                    return (
                      <>
                        <tr
                          key={log.id}
                          className="border-t hover:bg-gray-50 cursor-pointer"
                          onClick={() => setExpandido(isExpanded ? null : log.id)}
                        >
                          <td className="px-4 py-3 text-gray-600 text-xs">
                            {formatDateTime(log.criado_em)}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {log.usuario_email ?? (
                              <span className="text-gray-400 italic">Sistema</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                              {TABELA_LABELS[log.tabela] ?? log.tabela}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${op?.color}`}>
                              {op?.label ?? log.operacao}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                            {log.registro_id?.substring(0, 8)}...
                          </td>
                          <td className="px-4 py-3">
                            <button className="text-xs text-[#1e3a5f] hover:underline">
                              {isExpanded ? 'Fechar ▲' : 'Ver diff ▼'}
                            </button>
                          </td>
                        </tr>

                        {/* Linha expandida com diff */}
                        {isExpanded && (
                          <tr key={`${log.id}-expanded`} className="bg-gray-50 border-t">
                            <td colSpan={6} className="px-4 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                {log.dados_antes && (
                                  <div>
                                    <p className="text-xs font-semibold text-red-600 mb-2">ANTES</p>
                                    <pre className="text-xs bg-red-50 border border-red-100 rounded p-3 overflow-auto max-h-48">
                                      {JSON.stringify(log.dados_antes, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {log.dados_depois && (
                                  <div>
                                    <p className="text-xs font-semibold text-green-600 mb-2">DEPOIS</p>
                                    <pre className="text-xs bg-green-50 border border-green-100 rounded p-3 overflow-auto max-h-48">
                                      {JSON.stringify(log.dados_depois, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
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
