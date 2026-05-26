'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/PageHeader'
import { ArrowLeft } from 'lucide-react'

export default function NovaLicitacaoPage() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    numero_processo: '', modalidade: '', objeto: '', valor_estimado: '',
    data_abertura: '', status: 'em_andamento', edital: '', uasg: ''
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.numero_processo.trim() || !form.modalidade) {
      setError('Preencha o número do processo e a modalidade.')
      return
    }
    setSaving(true); setError('')
    const { error } = await supabase.from('licitacoes').insert({
      numero_processo: form.numero_processo,
      modalidade: form.modalidade,
      objeto: form.objeto || null,
      valor_estimado: form.valor_estimado ? Number(form.valor_estimado.replace(/\D/g, '')) / 100 : null,
      data_abertura: form.data_abertura || null,
      status: form.status,
      edital: form.edital || null,
      uasg: form.uasg || null,
    })
    setSaving(false)
    if (error) { setError('Erro ao salvar: ' + error.message); return }
    router.push('/licitacoes')
  }

  return (
    <>
      <PageHeader title="Nova Licitação" subtitle="Cadastro de novo processo licitatório">
        <Button variant="outline" onClick={() => router.push('/licitacoes')} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" />Voltar
        </Button>
      </PageHeader>
      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <Label>Número do Processo *</Label>
              <Input value={form.numero_processo} onChange={(e) => set('numero_processo', e.target.value)} placeholder="Ex: 001/2024" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label>Modalidade *</Label>
              <Select value={form.modalidade} onValueChange={(v) => set('modalidade', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pregao_eletronico">Pregão Eletrônico</SelectItem>
                  <SelectItem value="pregao_presencial">Pregão Presencial</SelectItem>
                  <SelectItem value="concorrencia">Concorrência</SelectItem>
                  <SelectItem value="tomada_de_precos">Tomada de Preços</SelectItem>
                  <SelectItem value="convite">Convite</SelectItem>
                  <SelectItem value="dispensa">Dispensa</SelectItem>
                  <SelectItem value="inexigibilidade">Inexigibilidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Objeto</Label>
            <Textarea rows={3} value={form.objeto} onChange={(e) => set('objeto', e.target.value)} placeholder="Descrição do objeto da licitação…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Valor Estimado (R$)</Label>
              <Input type="number" step="0.01" min="0" value={form.valor_estimado} onChange={(e) => set('valor_estimado', e.target.value)} placeholder="0,00" />
            </div>
            <div>
              <Label>Data de Abertura</Label>
              <Input type="date" value={form.data_abertura} onChange={(e) => set('data_abertura', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>UASG</Label>
              <Input value={form.uasg} onChange={(e) => set('uasg', e.target.value)} placeholder="Código UASG" />
            </div>
            <div>
              <Label>Nº do Edital</Label>
              <Input value={form.edital} onChange={(e) => set('edital', e.target.value)} placeholder="Ex: Edital 001/2024" />
            </div>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="em_andamento">Em andamento</SelectItem>
                <SelectItem value="homologada">Homologada</SelectItem>
                <SelectItem value="fracassada">Fracassada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
                <SelectItem value="suspensa">Suspensa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.push('/licitacoes')}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="bg-[#1e3a5f] hover:bg-[#152d4a]">
              {saving ? 'Salvando…' : 'Cadastrar Licitação'}
            </Button>
          </div>
        </form>
      </Card>
    </>
  )
}
