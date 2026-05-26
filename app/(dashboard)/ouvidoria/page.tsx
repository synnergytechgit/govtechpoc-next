'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader, EmptyState, LoadingState } from '@/components/PageHeader'
import { dateBR, daysUntil } from '@/lib/format'
import { Plus, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Manifestacao = { id: string; protocolo: string | null; tipo: string; descricao: string; solicitante: string | null; status: string; prazo_resposta: string | null; criado_em: string }

const statusStyle: Record<string, string> = {
  aberta: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  em_analise: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  respondida: 'bg-green-100 text-green-800 hover:bg-green-100',
  encerrada: 'bg-gray-100 text-gray-600 hover:bg-gray-100',
}

export default function OuvidoriaPage() {
  const supabase = createClient()
  const [data, setData] = useState<Manifestacao[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ tipo: 'reclamacao', descricao: '', solicitante: '' })

  async function load() {
    const { data } = await supabase.from('manifestacoes').select('*').order('criado_em', { ascending: false })
    setData(data ?? [])
    setIsLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    if (!form.descricao.trim()) { setMsg('Informe a descrição.'); return }
    setSaving(true); setMsg('')
    const { error } = await supabase.from('manifestacoes').insert({ tipo: form.tipo, descricao: form.descricao, solicitante: form.solicitante || null, status: 'aberta' })
    setSaving(false)
    if (error) { setMsg('Erro ao registrar: ' + error.message); return }
    setOpen(false)
    setForm({ tipo: 'reclamacao', descricao: '', solicitante: '' })
    load()
  }

  return (
    <>
      <PageHeader title="Ouvidoria" subtitle="Gerenciamento de manifestações e solicitações" />
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-500">{data.length} registro(s)</div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#1e3a5f] hover:bg-[#152d4a] gap-1.5">
                <Plus className="w-4 h-4" />Nova Manifestação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Manifestação</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reclamacao">Reclamação</SelectItem>
                      <SelectItem value="sugestao">Sugestão</SelectItem>
                      <SelectItem value="elogio">Elogio</SelectItem>
                      <SelectItem value="denuncia">Denúncia</SelectItem>
                      <SelectItem value="solicitacao">Solicitação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Solicitante (opcional)</Label>
                  <Input value={form.solicitante} onChange={(e) => setForm((f) => ({ ...f, solicitante: e.target.value }))} placeholder="Nome do cidadão" />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea rows={4} value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} placeholder="Descreva a manifestação..." />
                </div>
                {msg && <p className="text-sm text-red-600">{msg}</p>}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button disabled={saving} onClick={handleSave} className="bg-[#1e3a5f] hover:bg-[#152d4a]">
                    {saving ? 'Salvando…' : 'Registrar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {isLoading ? <LoadingState /> : data.length === 0 ? <EmptyState message="Nenhuma manifestação registrada." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 border-b">
                <tr>
                  <th className="text-left font-medium py-2">Protocolo</th>
                  <th className="text-left font-medium py-2">Tipo</th>
                  <th className="text-left font-medium py-2">Solicitante</th>
                  <th className="text-left font-medium py-2">Descrição</th>
                  <th className="text-left font-medium py-2">Status</th>
                  <th className="text-left font-medium py-2">Prazo</th>
                  <th className="text-left font-medium py-2">Data</th>
                </tr>
              </thead>
              <tbody>
                {data.map((m) => {
                  const days = m.prazo_resposta ? daysUntil(m.prazo_resposta) : null
                  const overdue = days !== null && days < 0 && !['respondida', 'encerrada'].includes(m.status)
                  return (
                    <tr key={m.id} className={`border-b last:border-0 ${overdue ? 'bg-red-50' : ''}`}>
                      <td className="py-3 font-mono text-xs">{m.protocolo ?? '—'}</td>
                      <td className="py-3 capitalize">{m.tipo}</td>
                      <td className="py-3">{m.solicitante ?? '—'}</td>
                      <td className="py-3 max-w-[240px] truncate text-gray-600">{m.descricao}</td>
                      <td className="py-3"><Badge className={statusStyle[m.status] ?? ''}>{m.status}</Badge></td>
                      <td className="py-3">
                        {m.prazo_resposta ? (
                          <div className="flex items-center gap-1">
                            {dateBR(m.prazo_resposta)}
                            {overdue && <AlertCircle className="w-4 h-4 text-red-500" />}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="py-3">{dateBR(m.criado_em)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
