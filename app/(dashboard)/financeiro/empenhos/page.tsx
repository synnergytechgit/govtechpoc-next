'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  FileText, Plus, X, CheckCircle, DollarSign,
  AlertCircle, Clock, Ban, ChevronRight, Search
} from 'lucide-react'

type Empenho = {
  id: string
  numero_empenho: string
  data_empenho: string | null
  tipo: string
  status: string
  objeto: string | null
  fornecedor_nome: string | null
  fornecedor_cnpj: string | null
  valor_empenho: number | null
  valor_liquidado: number | null
  valor_pago: number | null
  dotacao_id: string | null
  secretaria: string | null
  natureza_despesa: string | null
  saldo_disponivel: number | null
  liquidacao_id: string | null
  nota_fiscal: string | null
  status_liquidacao: string | null
  pagamento_id: string | null
  data_pagamento: string | null
  forma_pagamento: string | null
}

type Dotacao = {
  id: string
  secretaria: string
  natureza_despesa: string
  valor_dotacao_inicial: number
  valor_empenhado: number
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  emitido:   { label: 'Emitido',   color: 'bg-blue-100 text-blue-800',    icon: Clock },
  liquidado: { label: 'Liquidado', color: 'bg-yellow-100 text-yellow-800', icon: CheckCircle },
  pago:      { label: 'Pago',      color: 'bg-green-100 text-green-800',   icon: DollarSign },
  anulado:   { label: 'Anulado',   color: 'bg-red-100 text-red-800',      icon: Ban },
}

const TIPO_LABELS: Record<string, string> = {
  ordinario:  'Ordinário',
  estimativo: 'Estimativo',
  global:     'Global',
}

function fmt(value: number | null) {
  if (!value && value !== 0) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function fmtDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR')
}

type Modal = 'novo' | 'liquidar' | 'pagar' | 'anular' | null

export default function EmpenhosPage() {
  const [empenhos, setEmpenhos] = useState<Empenho[]>([])
  const [dotacoes, setDotacoes] = useState<Dotacao[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [busca, setBusca] = useState('')
  const [modal, setModal] = useState<Modal>(null)
  const [empenhoSelecionado, setEmpenhoSelecionado] = useState<Empenho | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const supabase = createClient()

  // Forms
  const [formNovo, setFormNovo] = useState({
    dotacao_id: '', fornecedor_nome: '', fornecedor_cnpj: '',
    valor_empenho: '', objeto: '', tipo: 'ordinario',
  })
  const [formLiquidar, setFormLiquidar] = useState({
    valor_liquidado: '', nota_fiscal: '', data_nota_fiscal: '', descricao: '',
  })
  const [formPagar, setFormPagar] = useState({
    valor_pago: '', forma_pagamento: 'transferencia', banco_origem: '',
  })
  const [formAnular, setFormAnular] = useState({ justificativa: '' })

  useEffect(() => { fetchDados() }, [])

  async function fetchDados() {
    setLoading(true)
    const [{ data: emp }, { data: dot }] = await Promise.all([
      supabase.from('vw_empenhos').select('*').order('criado_em', { ascending: false }),
      supabase.from('dotacoes').select('id, secretaria, natureza_despesa, valor_dotacao_inicial, valor_empenhado').order('secretaria'),
    ])
    if (emp) setEmpenhos(emp as any)
    if (dot) setDotacoes(dot)
    setLoading(false)
  }

  function abrirModal(tipo: Modal, empenho?: Empenho) {
    setErro(''); setSucesso('')
    setEmpenhoSelecionado(empenho || null)
    if (tipo === 'liquidar' && empenho) {
      setFormLiquidar({ valor_liquidado: String(empenho.valor_empenho || ''), nota_fiscal: '', data_nota_fiscal: '', descricao: '' })
    }
    if (tipo === 'pagar' && empenho) {
      setFormPagar({ valor_pago: String(empenho.valor_liquidado || ''), forma_pagamento: 'transferencia', banco_origem: '' })
    }
    setModal(tipo)
  }

  function fecharModal() {
    setModal(null); setEmpenhoSelecionado(null)
    setFormNovo({ dotacao_id: '', fornecedor_nome: '', fornecedor_cnpj: '', valor_empenho: '', objeto: '', tipo: 'ordinario' })
    setFormAnular({ justificativa: '' })
    setErro(''); setSucesso('')
  }

  async function salvarNovoEmpenho() {
    setErro(''); setSalvando(true)
    try {
      const res = await fetch('/api/financeiro/empenhos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formNovo,
          valor_empenho: parseFloat(formNovo.valor_empenho.replace(',', '.')),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error || 'Erro ao criar empenho')
        if (data.detalhe) setErro(`${data.error} Disponível: ${fmt(data.detalhe.saldo_disponivel)}`)
      } else {
        setSucesso(`Empenho ${data.numero_empenho} emitido com sucesso!`)
        await fetchDados()
        setTimeout(fecharModal, 1500)
      }
    } catch { setErro('Erro de conexão') }
    setSalvando(false)
  }

  async function salvarLiquidacao() {
    if (!empenhoSelecionado) return
    setErro(''); setSalvando(true)
    try {
      const res = await fetch(`/api/financeiro/empenhos/${empenhoSelecionado.id}/liquidar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formLiquidar,
          valor_liquidado: parseFloat(formLiquidar.valor_liquidado.replace(',', '.')),
        }),
      })
      const data = await res.json()
      if (!res.ok) setErro(data.error || 'Erro ao liquidar')
      else {
        setSucesso(`Liquidação ${data.numero_liquidacao} registrada!`)
        await fetchDados()
        setTimeout(fecharModal, 1500)
      }
    } catch { setErro('Erro de conexão') }
    setSalvando(false)
  }

  async function salvarPagamento() {
    if (!empenhoSelecionado) return
    setErro(''); setSalvando(true)
    try {
      const res = await fetch(`/api/financeiro/empenhos/${empenhoSelecionado.id}/pagar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formPagar,
          valor_pago: parseFloat(formPagar.valor_pago.replace(',', '.')),
        }),
      })
      const data = await res.json()
      if (!res.ok) setErro(data.error || 'Erro ao registrar pagamento')
      else {
        setSucesso(`Pagamento ${data.numero_op} registrado!`)
        await fetchDados()
        setTimeout(fecharModal, 1500)
      }
    } catch { setErro('Erro de conexão') }
    setSalvando(false)
  }

  async function salvarAnulacao() {
    if (!empenhoSelecionado) return
    setErro(''); setSalvando(true)
    try {
      const res = await fetch(`/api/financeiro/empenhos/${empenhoSelecionado.id}/anular`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formAnular),
      })
      const data = await res.json()
      if (!res.ok) setErro(data.error || 'Erro ao anular')
      else {
        setSucesso('Empenho anulado. Saldo devolvido à dotação.')
        await fetchDados()
        setTimeout(fecharModal, 1500)
      }
    } catch { setErro('Erro de conexão') }
    setSalvando(false)
  }

  // Filtros
  const filtrados = empenhos.filter(e => {
    const okStatus = filtroStatus === 'todos' || e.status === filtroStatus
    const okBusca = !busca ||
      e.numero_empenho?.toLowerCase().includes(busca.toLowerCase()) ||
      e.fornecedor_nome?.toLowerCase().includes(busca.toLowerCase()) ||
      e.objeto?.toLowerCase().includes(busca.toLowerCase())
    return okStatus && okBusca
  })

  const totalEmitido   = empenhos.filter(e => e.status === 'emitido').reduce((a, e) => a + (e.valor_empenho || 0), 0)
  const totalLiquidado = empenhos.filter(e => e.status === 'liquidado').reduce((a, e) => a + (e.valor_liquidado || 0), 0)
  const totalPago      = empenhos.filter(e => e.status === 'pago').reduce((a, e) => a + (e.valor_pago || 0), 0)
  const totalAnulado   = empenhos.filter(e => e.status === 'anulado').length

  const dotacaoSelecionada = dotacoes.find(d => d.id === formNovo.dotacao_id)
  const saldoDotacao = dotacaoSelecionada
    ? (dotacaoSelecionada.valor_dotacao_inicial || 0) - (dotacaoSelecionada.valor_empenhado || 0)
    : null

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#1e3a5f]" />
            Empenhos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Execução da despesa — Empenho → Liquidação → Pagamento
          </p>
        </div>
        <Button
          onClick={() => abrirModal('novo')}
          className="bg-[#1e3a5f] hover:bg-[#2d5282] text-white gap-2"
        >
          <Plus className="w-4 h-4" /> Novo Empenho
        </Button>
      </div>

      {/* Fluxo visual */}
      <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-4">
        {[
          { label: 'Emitido',   valor: fmt(totalEmitido),   cor: 'bg-blue-500',   count: empenhos.filter(e=>e.status==='emitido').length },
          { label: 'Liquidado', valor: fmt(totalLiquidado), cor: 'bg-yellow-500', count: empenhos.filter(e=>e.status==='liquidado').length },
          { label: 'Pago',      valor: fmt(totalPago),      cor: 'bg-green-500',  count: empenhos.filter(e=>e.status==='pago').length },
        ].map((s, i) => (
          <div key={s.label} className="flex items-center gap-2 flex-1">
            <div className="flex-1 bg-white rounded-lg p-3 text-center shadow-sm border">
              <div className={`w-2 h-2 rounded-full ${s.cor} mx-auto mb-1`} />
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-sm font-bold text-gray-900">{s.valor}</p>
              <p className="text-xs text-gray-400">{s.count} empenho(s)</p>
            </div>
            {i < 2 && <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />}
          </div>
        ))}
        {totalAnulado > 0 && (
          <div className="flex items-center gap-2">
            <div className="bg-red-50 rounded-lg p-3 text-center border border-red-100">
              <p className="text-xs text-red-500">Anulados</p>
              <p className="text-sm font-bold text-red-600">{totalAnulado}</p>
            </div>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <Input
            placeholder="Buscar por número, fornecedor ou objeto..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="pl-9 w-72"
          />
        </div>
        <div className="flex gap-1">
          {['todos', 'emitido', 'liquidado', 'pago', 'anulado'].map(s => (
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
        <span className="text-sm text-gray-400 ml-auto">{filtrados.length} registro(s)</span>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="p-8 text-center text-gray-400">Carregando...</div>
      ) : filtrados.length === 0 ? (
        <div className="p-8 text-center text-gray-400">Nenhum empenho encontrado.</div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(e => {
            const cfg = STATUS_CONFIG[e.status]
            const Icon = cfg?.icon || Clock
            return (
              <Card key={e.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-sm font-bold text-[#1e3a5f]">
                          {e.numero_empenho}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${cfg?.color}`}>
                          <Icon className="w-3 h-3" />
                          {cfg?.label}
                        </span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                          {TIPO_LABELS[e.tipo] || e.tipo}
                        </span>
                        {e.data_empenho && (
                          <span className="text-xs text-gray-400">{fmtDate(e.data_empenho)}</span>
                        )}
                      </div>
                      <p className="font-semibold text-gray-900 truncate">{e.fornecedor_nome}</p>
                      {e.objeto && (
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{e.objeto}</p>
                      )}
                      {e.secretaria && (
                        <p className="text-xs text-gray-400 mt-1">{e.secretaria} — {e.natureza_despesa}</p>
                      )}
                    </div>

                    {/* Valores */}
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-[#1e3a5f]">{fmt(e.valor_empenho)}</p>
                      {e.status === 'liquidado' && (
                        <p className="text-xs text-yellow-600">Liquidado: {fmt(e.valor_liquidado)}</p>
                      )}
                      {e.status === 'pago' && (
                        <p className="text-xs text-green-600">Pago: {fmt(e.valor_pago)}</p>
                      )}
                      {e.nota_fiscal && (
                        <p className="text-xs text-gray-400 mt-0.5">NF: {e.nota_fiscal}</p>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2 shrink-0">
                      {e.status === 'emitido' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => abrirModal('liquidar', e)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs"
                          >
                            Liquidar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => abrirModal('anular', e)}
                            className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                          >
                            Anular
                          </Button>
                        </>
                      )}
                      {e.status === 'liquidado' && (
                        <Button
                          size="sm"
                          onClick={() => abrirModal('pagar', e)}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs"
                        >
                          Pagar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── MODAIS ── */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            {/* Header do modal */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold text-gray-900">
                {modal === 'novo'     && '➕ Novo Empenho'}
                {modal === 'liquidar' && '🧾 Registrar Liquidação'}
                {modal === 'pagar'    && '💰 Registrar Pagamento'}
                {modal === 'anular'   && '❌ Anular Empenho'}
              </h2>
              <button onClick={fecharModal}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-4">

              {/* MODAL NOVO EMPENHO */}
              {modal === 'novo' && (
                <>
                  <div className="space-y-1">
                    <Label>Dotação Orçamentária</Label>
                    <select
                      value={formNovo.dotacao_id}
                      onChange={e => setFormNovo(f => ({ ...f, dotacao_id: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                    >
                      <option value="">Sem vínculo com dotação</option>
                      {dotacoes.map(d => {
                        const saldo = (d.valor_dotacao_inicial || 0) - (d.valor_empenhado || 0)
                        return (
                          <option key={d.id} value={d.id} disabled={saldo <= 0}>
                            {d.secretaria} — {d.natureza_despesa} (Saldo: {fmt(saldo)})
                          </option>
                        )
                      })}
                    </select>
                    {saldoDotacao !== null && (
                      <p className={`text-xs font-medium ${saldoDotacao > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Saldo disponível: {fmt(saldoDotacao)}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Fornecedor *</Label>
                      <Input
                        placeholder="Nome do fornecedor"
                        value={formNovo.fornecedor_nome}
                        onChange={e => setFormNovo(f => ({ ...f, fornecedor_nome: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>CNPJ/CPF</Label>
                      <Input
                        placeholder="XX.XXX.XXX/0001-XX"
                        value={formNovo.fornecedor_cnpj}
                        onChange={e => setFormNovo(f => ({ ...f, fornecedor_cnpj: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Valor do Empenho (R$) *</Label>
                      <Input
                        placeholder="0,00"
                        value={formNovo.valor_empenho}
                        onChange={e => setFormNovo(f => ({ ...f, valor_empenho: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Tipo</Label>
                      <select
                        value={formNovo.tipo}
                        onChange={e => setFormNovo(f => ({ ...f, tipo: e.target.value }))}
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                      >
                        <option value="ordinario">Ordinário</option>
                        <option value="estimativo">Estimativo</option>
                        <option value="global">Global</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label>Objeto do Empenho *</Label>
                    <textarea
                      className="w-full border rounded-md px-3 py-2 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                      placeholder="Descreva o objeto do empenho..."
                      value={formNovo.objeto}
                      onChange={e => setFormNovo(f => ({ ...f, objeto: e.target.value }))}
                    />
                  </div>
                </>
              )}

              {/* MODAL LIQUIDAR */}
              {modal === 'liquidar' && empenhoSelecionado && (
                <>
                  <div className="bg-blue-50 rounded-lg p-3 text-sm">
                    <p className="font-medium text-blue-800">{empenhoSelecionado.numero_empenho}</p>
                    <p className="text-blue-600">{empenhoSelecionado.fornecedor_nome}</p>
                    <p className="text-blue-600 font-bold">Valor: {fmt(empenhoSelecionado.valor_empenho)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Valor Liquidado (R$) *</Label>
                      <Input
                        value={formLiquidar.valor_liquidado}
                        onChange={e => setFormLiquidar(f => ({ ...f, valor_liquidado: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Nota Fiscal *</Label>
                      <Input
                        placeholder="NF-e / NFS-e"
                        value={formLiquidar.nota_fiscal}
                        onChange={e => setFormLiquidar(f => ({ ...f, nota_fiscal: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Data da Nota Fiscal</Label>
                    <Input
                      type="date"
                      value={formLiquidar.data_nota_fiscal}
                      onChange={e => setFormLiquidar(f => ({ ...f, data_nota_fiscal: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Descrição / Observação</Label>
                    <Input
                      placeholder="Opcional"
                      value={formLiquidar.descricao}
                      onChange={e => setFormLiquidar(f => ({ ...f, descricao: e.target.value }))}
                    />
                  </div>
                </>
              )}

              {/* MODAL PAGAR */}
              {modal === 'pagar' && empenhoSelecionado && (
                <>
                  <div className="bg-yellow-50 rounded-lg p-3 text-sm">
                    <p className="font-medium text-yellow-800">{empenhoSelecionado.numero_empenho}</p>
                    <p className="text-yellow-700">{empenhoSelecionado.fornecedor_nome}</p>
                    <p className="text-yellow-700">NF: {empenhoSelecionado.nota_fiscal}</p>
                    <p className="font-bold text-yellow-800">Liquidado: {fmt(empenhoSelecionado.valor_liquidado)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Valor Pago (R$) *</Label>
                      <Input
                        value={formPagar.valor_pago}
                        onChange={e => setFormPagar(f => ({ ...f, valor_pago: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Forma de Pagamento *</Label>
                      <select
                        value={formPagar.forma_pagamento}
                        onChange={e => setFormPagar(f => ({ ...f, forma_pagamento: e.target.value }))}
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                      >
                        <option value="transferencia">Transferência</option>
                        <option value="pix">PIX</option>
                        <option value="boleto">Boleto</option>
                        <option value="cheque">Cheque</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Banco / Conta de Origem</Label>
                    <Input
                      placeholder="Ex: Banco do Brasil — Ag 0001 / CC 12345-6"
                      value={formPagar.banco_origem}
                      onChange={e => setFormPagar(f => ({ ...f, banco_origem: e.target.value }))}
                    />
                  </div>
                </>
              )}

              {/* MODAL ANULAR */}
              {modal === 'anular' && empenhoSelecionado && (
                <>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                    <p className="font-medium text-red-800 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> Atenção: esta ação é irreversível
                    </p>
                    <p className="text-red-700 mt-1">
                      O empenho <strong>{empenhoSelecionado.numero_empenho}</strong> será anulado
                      e o saldo de <strong>{fmt(empenhoSelecionado.valor_empenho)}</strong> será
                      devolvido à dotação.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label>Justificativa da Anulação * (mínimo 20 caracteres)</Label>
                    <textarea
                      className="w-full border rounded-md px-3 py-2 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
                      placeholder="Descreva o motivo da anulação..."
                      value={formAnular.justificativa}
                      onChange={e => setFormAnular({ justificativa: e.target.value })}
                    />
                    <p className="text-xs text-gray-400 text-right">
                      {formAnular.justificativa.length}/20 caracteres mínimos
                    </p>
                  </div>
                </>
              )}

              {/* Feedback */}
              {erro && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {erro}
                </div>
              )}
              {sucesso && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> {sucesso}
                </div>
              )}
            </div>

            {/* Footer do modal */}
            <div className="flex gap-3 p-6 border-t">
              <Button
                onClick={
                  modal === 'novo'     ? salvarNovoEmpenho :
                  modal === 'liquidar' ? salvarLiquidacao  :
                  modal === 'pagar'    ? salvarPagamento   :
                  salvarAnulacao
                }
                disabled={salvando}
                className={`flex-1 text-white ${
                  modal === 'anular'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-[#1e3a5f] hover:bg-[#2d5282]'
                }`}
              >
                {salvando ? 'Salvando...' :
                  modal === 'novo'     ? 'Emitir Empenho'       :
                  modal === 'liquidar' ? 'Registrar Liquidação'  :
                  modal === 'pagar'    ? 'Confirmar Pagamento'   :
                  'Confirmar Anulação'
                }
              </Button>
              <Button variant="outline" onClick={fecharModal}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
