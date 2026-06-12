'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Receipt, Plus, X, Search, CheckCircle, AlertCircle } from 'lucide-react'

type NotaFiscal = {
  id: string
  tipo: string
  numero: string
  serie: string | null
  chave_acesso: string | null
  emitente_nome: string
  emitente_cnpj: string | null
  data_emissao: string
  data_entrada: string | null
  valor_total: number
  descricao: string | null
  status: string
  empenho_id: string | null
  pessoas: { nome: string; cpf_cnpj: string } | null
  empenhos: { numero_empenho: string; status: string } | null
}

type Pessoa = { id: string; nome: string; cpf_cnpj: string }
type Empenho = { id: string; numero_empenho: string; valor_empenho: number | null; valor: number | null }

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ativa:       { label: 'Ativa',       color: 'bg-green-100 text-green-800' },
  cancelada:   { label: 'Cancelada',   color: 'bg-red-100 text-red-800' },
  inutilizada: { label: 'Inutilizada', color: 'bg-gray-100 text-gray-600' },
  denegada:    { label: 'Denegada',    color: 'bg-orange-100 text-orange-800' },
}

const TIPO_LABELS: Record<string, string> = {
  nfe:  'NF-e',
  nfse: 'NFS-e',
  nfce: 'NFC-e',
  cte:  'CT-e',
  sat:  'SAT',
}

function fmt(value: number | null) {
  if (!value && value !== 0) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function fmtDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR')
}

export default function NotasFiscaisPage() {
  const [notas, setNotas] = useState<NotaFiscal[]>([])
  const [pessoas, setPessoas] = useState<Pessoa[]>([])
  const [empenhos, setEmpenhos] = useState<Empenho[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  const [form, setForm] = useState({
    pessoa_id: '',
    emitente_nome: '', emitente_cnpj: '',
    tipo: 'nfe', numero: '', serie: '1',
    chave_acesso: '', data_emissao: '',
    data_entrada: '', valor_total: '',
    valor_produtos: '', valor_servicos: '',
    valor_impostos: '', descricao: '',
    empenho_id: '',
  })

  const supabase = createClient()

  useEffect(() => { fetchDados() }, [])

  async function fetchDados() {
    setLoading(true)
    const [{ data: nf }, { data: ps }, { data: emp }] = await Promise.all([
      supabase.from('notas_fiscais')
        .select('*, pessoas(nome, cpf_cnpj), empenhos(numero_empenho, status)')
        .eq('ativo', true)
        .order('data_emissao', { ascending: false }),
      supabase.from('pessoas').select('id, nome, cpf_cnpj').eq('ativo', true).order('nome'),
      supabase.from('empenhos').select('id, numero_empenho, valor_empenho, valor').eq('ativo', true).order('numero_empenho'),
    ])
    if (nf) setNotas(nf as any)
    if (ps) setPessoas(ps)
    if (emp) setEmpenhos(emp)
    setLoading(false)
  }

  function fecharModal() {
    setModalAberto(false)
    setErro(''); setSucesso('')
    setForm({
      pessoa_id: '', emitente_nome: '', emitente_cnpj: '',
      tipo: 'nfe', numero: '', serie: '1', chave_acesso: '',
      data_emissao: '', data_entrada: '', valor_total: '',
      valor_produtos: '', valor_servicos: '', valor_impostos: '',
      descricao: '', empenho_id: '',
    })
  }

  function handlePessoaChange(pessoa_id: string) {
    const p = pessoas.find(p => p.id === pessoa_id)
    setForm(f => ({
      ...f,
      pessoa_id,
      emitente_nome: p?.nome || f.emitente_nome,
      emitente_cnpj: p?.cpf_cnpj || f.emitente_cnpj,
    }))
  }

  async function salvar() {
    setErro(''); setSalvando(true)
    try {
      const res = await fetch('/api/notas-fiscais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          valor_total: parseFloat(form.valor_total.replace(',', '.')),
          valor_produtos: form.valor_produtos ? parseFloat(form.valor_produtos.replace(',', '.')) : 0,
          valor_servicos: form.valor_servicos ? parseFloat(form.valor_servicos.replace(',', '.')) : 0,
          valor_impostos: form.valor_impostos ? parseFloat(form.valor_impostos.replace(',', '.')) : 0,
          empenho_id: form.empenho_id || null,
          pessoa_id: form.pessoa_id || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) setErro(data.error || 'Erro ao salvar')
      else {
        setSucesso(`NF Nº ${form.numero} cadastrada com sucesso!`)
        await fetchDados()
        setTimeout(fecharModal, 1500)
      }
    } catch { setErro('Erro de conexão') }
    setSalvando(false)
  }

  async function cancelarNF(id: string) {
    const motivo = window.prompt('Motivo do cancelamento:')
    if (!motivo) return
    await supabase.from('notas_fiscais').update({
      status: 'cancelada',
      motivo_cancelamento: motivo,
      data_cancelamento: new Date().toISOString().split('T')[0],
    }).eq('id', id)
    await fetchDados()
  }

  const filtradas = notas.filter(n => {
    const okStatus = filtroStatus === 'todos' || n.status === filtroStatus
    const okTipo   = filtroTipo === 'todos' || n.tipo === filtroTipo
    const okBusca  = !busca ||
      n.numero.includes(busca) ||
      n.emitente_nome.toLowerCase().includes(busca.toLowerCase())
    return okStatus && okTipo && okBusca
  })

  const totalAtivas     = notas.filter(n => n.status === 'ativa').length
  const valorTotal      = notas.filter(n => n.status === 'ativa').reduce((a, n) => a + n.valor_total, 0)
  const totalCanceladas = notas.filter(n => n.status === 'cancelada').length

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[#1e3a5f]" />
            Notas Fiscais
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            NF-e, NFS-e e demais documentos fiscais
          </p>
        </div>
        <Button
          onClick={() => setModalAberto(true)}
          className="bg-[#1e3a5f] hover:bg-[#2d5282] text-white gap-2"
        >
          <Plus className="w-4 h-4" /> Registrar NF
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal">NFs Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#1e3a5f]">{totalAtivas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-green-600">{fmt(valorTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal">Canceladas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-500">{totalCanceladas}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <Input
            placeholder="Buscar por número ou emitente..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="pl-9 w-64"
          />
        </div>
        <select
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
        >
          <option value="todos">Todos os tipos</option>
          {Object.entries(TIPO_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <div className="flex gap-1">
          {['todos','ativa','cancelada'].map(s => (
            <button
              key={s}
              onClick={() => setFiltroStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filtroStatus === s
                  ? 'bg-[#1e3a5f] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === 'todos' ? 'Todos' : STATUS_CONFIG[s]?.label}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-400 ml-auto">{filtradas.length} NF(s)</span>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="p-8 text-center text-gray-400">Carregando...</div>
      ) : filtradas.length === 0 ? (
        <div className="p-8 text-center text-gray-400">Nenhuma nota fiscal encontrada.</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 font-semibold text-gray-600">Tipo / Nº</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Emitente</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Emissão</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-right">Valor</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Empenho</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map(n => {
                    const cfg = STATUS_CONFIG[n.status]
                    return (
                      <tr key={n.id} className={`border-t hover:bg-gray-50 ${n.status === 'cancelada' ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-[#1e3a5f]/10 text-[#1e3a5f] rounded text-xs font-bold">
                            {TIPO_LABELS[n.tipo]}
                          </span>
                          <span className="ml-2 font-mono text-gray-700">
                            {n.numero}{n.serie ? `-${n.serie}` : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{n.emitente_nome}</p>
                          {n.emitente_cnpj && (
                            <p className="text-xs text-gray-400">{n.emitente_cnpj}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{fmtDate(n.data_emissao)}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          {fmt(n.valor_total)}
                        </td>
                        <td className="px-4 py-3">
                          {n.empenhos ? (
                            <span className="font-mono text-xs text-[#1e3a5f]">
                              {n.empenhos.numero_empenho}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg?.color}`}>
                            {cfg?.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {n.status === 'ativa' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => cancelarNF(n.id)}
                              className="text-red-500 hover:bg-red-50 text-xs"
                            >
                              Cancelar
                            </Button>
                          )}
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

      {/* Modal nova NF */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-gray-900">Registrar Nota Fiscal</h2>
              <button onClick={fecharModal}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Tipo */}
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(TIPO_LABELS).map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => setForm(f => ({ ...f, tipo: v }))}
                    className={`py-2 rounded-lg border text-xs font-bold transition-colors ${
                      form.tipo === v
                        ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#1e3a5f]'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {/* Emitente */}
              <div className="space-y-1">
                <Label>Emitente (Fornecedor Cadastrado)</Label>
                <select
                  value={form.pessoa_id}
                  onChange={e => handlePessoaChange(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                >
                  <option value="">Selecionar do cadastro...</option>
                  {pessoas.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nome} — {p.cpf_cnpj}
                    </option>
                  ))}
                </select>
              </div>

              {/* Se não selecionar, preenche manualmente */}
              {!form.pessoa_id && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Nome do Emitente *</Label>
                    <Input
                      value={form.emitente_nome}
                      onChange={e => setForm(f => ({ ...f, emitente_nome: e.target.value }))}
                      placeholder="Razão Social"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>CNPJ do Emitente</Label>
                    <Input
                      value={form.emitente_cnpj}
                      onChange={e => setForm(f => ({ ...f, emitente_cnpj: e.target.value }))}
                      placeholder="XX.XXX.XXX/0001-XX"
                    />
                  </div>
                </div>
              )}

              {/* Identificação */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Número *</Label>
                  <Input
                    value={form.numero}
                    onChange={e => setForm(f => ({ ...f, numero: e.target.value }))}
                    placeholder="000001"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Série</Label>
                  <Input
                    value={form.serie}
                    onChange={e => setForm(f => ({ ...f, serie: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Data Emissão *</Label>
                  <Input
                    type="date"
                    value={form.data_emissao}
                    onChange={e => setForm(f => ({ ...f, data_emissao: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Chave de Acesso (44 dígitos)</Label>
                <Input
                  value={form.chave_acesso}
                  onChange={e => setForm(f => ({ ...f, chave_acesso: e.target.value }))}
                  placeholder="00000000000000000000000000000000000000000000"
                  className="font-mono text-xs"
                />
              </div>

              {/* Valores */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Valor Total (R$) *</Label>
                  <Input
                    value={form.valor_total}
                    onChange={e => setForm(f => ({ ...f, valor_total: e.target.value }))}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Valor Impostos (R$)</Label>
                  <Input
                    value={form.valor_impostos}
                    onChange={e => setForm(f => ({ ...f, valor_impostos: e.target.value }))}
                    placeholder="0,00"
                  />
                </div>
              </div>

              {/* Vinculação */}
              <div className="space-y-1">
                <Label>Vincular a Empenho</Label>
                <select
                  value={form.empenho_id}
                  onChange={e => setForm(f => ({ ...f, empenho_id: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                >
                  <option value="">Sem vínculo</option>
                  {empenhos.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.numero_empenho} — {fmt(e.valor_empenho || e.valor)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label>Descrição / Objeto</Label>
                <textarea
                  className="w-full border rounded-md px-3 py-2 text-sm min-h-[60px] resize-none focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  value={form.descricao}
                  onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  placeholder="Descrição do serviço ou produto..."
                />
              </div>

              {erro && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {erro}
                </div>
              )}
              {sucesso && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" /> {sucesso}
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t sticky bottom-0 bg-white">
              <Button
                onClick={salvar}
                disabled={salvando}
                className="flex-1 bg-[#1e3a5f] hover:bg-[#2d5282] text-white"
              >
                {salvando ? 'Salvando...' : 'Registrar Nota Fiscal'}
              </Button>
              <Button variant="outline" onClick={fecharModal}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
