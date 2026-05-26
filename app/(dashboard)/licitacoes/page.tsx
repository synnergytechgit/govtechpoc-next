'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader, EmptyState, LoadingState } from '@/components/PageHeader'
import { brl, dateBR } from '@/lib/format'
import { Plus, Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Licitacao = { id: string; numero_processo: string; modalidade: string; objeto: string | null; valor_estimado: number | null; data_abertura: string | null; status: string }

const statusStyle: Record<string, string> = {
  em_andamento: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  homologada: 'bg-green-100 text-green-800 hover:bg-green-100',
  fracassada: 'bg-red-100 text-red-800 hover:bg-red-100',
  cancelada: 'bg-gray-100 text-gray-600 hover:bg-gray-100',
  suspensa: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
}

export default function LicitacoesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [data, setData] = useState<Licitacao[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [modalidade, setModalidade] = useState('todos')
  const [status, setStatus] = useState('todos')

  useEffect(() => {
    supabase.from('licitacoes').select('*').order('data_abertura', { ascending: false })
      .then(({ data }) => { setData(data ?? []); setIsLoading(false) })
  }, [])

  const filtered = data.filter((l) => {
    const q = busca.toLowerCase()
    const matchSearch = !busca || l.numero_processo.toLowerCase().includes(q) || (l.objeto ?? '').toLowerCase().includes(q)
    const matchModal = modalidade === 'todos' || l.modalidade === modalidade
    const matchStatus = status === 'todos' || l.status === status
    return matchSearch && matchModal && matchStatus
  })

  const total = data.length
  const andamento = data.filter((l) => l.status === 'em_andamento').length
  const homologadas = data.filter((l) => l.status === 'homologada').length

  return (
    <>
      <PageHeader title="Licitações" subtitle="Processos licitatórios em andamento e concluídos">
        <Button onClick={() => router.push('/licitacoes/nova')} className="bg-[#1e3a5f] hover:bg-[#152d4a] gap-1.5">
          <Plus className="w-4 h-4" />Nova Licitação
        </Button>
      </PageHeader>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4 text-center"><div className="text-2xl font-bold">{total}</div><div className="text-xs text-gray-500 mt-1">Total</div></Card>
        <Card className="p-4 text-center"><div className="text-2xl font-bold text-blue-700">{andamento}</div><div className="text-xs text-gray-500 mt-1">Em andamento</div></Card>
        <Card className="p-4 text-center"><div className="text-2xl font-bold text-green-700">{homologadas}</div><div className="text-xs text-gray-500 mt-1">Homologadas</div></Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input className="pl-9" placeholder="Buscar por número ou objeto…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <Select value={modalidade} onValueChange={setModalidade}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Modalidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as modalidades</SelectItem>
              <SelectItem value="pregao_eletronico">Pregão Eletrônico</SelectItem>
              <SelectItem value="pregao_presencial">Pregão Presencial</SelectItem>
              <SelectItem value="concorrencia">Concorrência</SelectItem>
              <SelectItem value="tomada_de_precos">Tomada de Preços</SelectItem>
              <SelectItem value="convite">Convite</SelectItem>
              <SelectItem value="dispensa">Dispensa</SelectItem>
              <SelectItem value="inexigibilidade">Inexigibilidade</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="em_andamento">Em andamento</SelectItem>
              <SelectItem value="homologada">Homologada</SelectItem>
              <SelectItem value="fracassada">Fracassada</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
              <SelectItem value="suspensa">Suspensa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? <LoadingState /> : filtered.length === 0 ? <EmptyState message="Nenhuma licitação encontrada." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 border-b">
                <tr>
                  <th className="text-left font-medium py-2">Nº Processo</th>
                  <th className="text-left font-medium py-2">Modalidade</th>
                  <th className="text-left font-medium py-2">Objeto</th>
                  <th className="text-right font-medium py-2">Valor Estimado</th>
                  <th className="text-left font-medium py-2">Data Abertura</th>
                  <th className="text-left font-medium py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3">
                      <Link href={`/licitacoes/${l.id}`} className="text-[#1e3a5f] font-medium hover:underline font-mono text-xs">{l.numero_processo}</Link>
                    </td>
                    <td className="py-3 capitalize">{l.modalidade.replace(/_/g, ' ')}</td>
                    <td className="py-3 text-gray-600 max-w-[300px] truncate">{l.objeto ?? '—'}</td>
                    <td className="py-3 text-right">{l.valor_estimado ? brl(Number(l.valor_estimado)) : '—'}</td>
                    <td className="py-3">{l.data_abertura ? dateBR(l.data_abertura) : '—'}</td>
                    <td className="py-3"><Badge className={statusStyle[l.status] ?? ''}>{l.status.replace(/_/g, ' ')}</Badge></td>
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
