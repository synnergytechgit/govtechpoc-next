'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHeader, EmptyState, LoadingState } from '@/components/PageHeader'
import { brl, dateBR } from '@/lib/format'
import { ArrowLeft } from 'lucide-react'

type Licitacao = { id: string; numero_processo: string; modalidade: string; objeto: string | null; valor_estimado: number | null; data_abertura: string | null; status: string; edital: string | null; uasg: string | null; criado_em: string }
type Participante = { id: string; nome: string; cnpj: string | null; proposta: number | null; situacao: string | null }

const statusStyle: Record<string, string> = {
  em_andamento: 'bg-blue-100 text-blue-800',
  homologada: 'bg-green-100 text-green-800',
  fracassada: 'bg-red-100 text-red-800',
  cancelada: 'bg-gray-100 text-gray-600',
  suspensa: 'bg-amber-100 text-amber-800',
}

export default function LicitacaoDetalhe({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [licitacao, setLicitacao] = useState<Licitacao | null>(null)
  const [participantes, setParticipantes] = useState<Participante[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: lic }, { data: part }] = await Promise.all([
        supabase.from('licitacoes').select('*').eq('id', params.id).single(),
        supabase.from('licitacao_participantes').select('*').eq('licitacao_id', params.id).order('proposta'),
      ])
      if (!lic) { setNotFound(true); setIsLoading(false); return }
      setLicitacao(lic)
      setParticipantes(part ?? [])
      setIsLoading(false)
    }
    load()
  }, [params.id])

  if (isLoading) return (<><PageHeader title="Licitação" /><LoadingState /></>)
  if (notFound || !licitacao) return (<><PageHeader title="Licitação não encontrada" /><EmptyState message="O processo licitatório não foi encontrado." /></>)

  return (
    <>
      <PageHeader title={licitacao.numero_processo} subtitle={licitacao.objeto ?? 'Detalhe do processo'}>
        <Button variant="outline" onClick={() => router.push('/licitacoes')} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" />Voltar
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2 p-6">
          <h3 className="font-semibold mb-4">Informações do Processo</h3>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-500 text-xs">Número do Processo</dt>
              <dd className="font-mono font-medium mt-0.5">{licitacao.numero_processo}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-xs">Modalidade</dt>
              <dd className="capitalize mt-0.5">{licitacao.modalidade.replace(/_/g, ' ')}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-xs">Valor Estimado</dt>
              <dd className="font-medium mt-0.5">{licitacao.valor_estimado ? brl(Number(licitacao.valor_estimado)) : '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-xs">Data de Abertura</dt>
              <dd className="mt-0.5">{licitacao.data_abertura ? dateBR(licitacao.data_abertura) : '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-xs">Edital</dt>
              <dd className="mt-0.5">{licitacao.edital ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-xs">UASG</dt>
              <dd className="mt-0.5">{licitacao.uasg ?? '—'}</dd>
            </div>
            {licitacao.objeto && (
              <div className="col-span-2">
                <dt className="text-gray-500 text-xs">Objeto</dt>
                <dd className="mt-0.5">{licitacao.objeto}</dd>
              </div>
            )}
          </dl>
        </Card>
        <Card className="p-6 flex flex-col gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Status</div>
            <Badge className={`${statusStyle[licitacao.status] ?? ''} text-sm px-3 py-1`}>{licitacao.status.replace(/_/g, ' ')}</Badge>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Participantes</div>
            <div className="text-2xl font-bold">{participantes.length}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Cadastrado em</div>
            <div className="text-sm">{dateBR(licitacao.criado_em)}</div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Participantes / Proponentes</h3>
        {participantes.length === 0 ? <EmptyState message="Nenhum participante cadastrado." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 border-b">
                <tr>
                  <th className="text-left font-medium py-2">Empresa</th>
                  <th className="text-left font-medium py-2">CNPJ</th>
                  <th className="text-right font-medium py-2">Proposta</th>
                  <th className="text-left font-medium py-2 pl-4">Situação</th>
                </tr>
              </thead>
              <tbody>
                {participantes.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">{p.nome}</td>
                    <td className="py-3 text-gray-500 text-xs">{p.cnpj ?? '—'}</td>
                    <td className="py-3 text-right">{p.proposta ? brl(Number(p.proposta)) : '—'}</td>
                    <td className="py-3 pl-4 capitalize">{p.situacao ?? '—'}</td>
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
