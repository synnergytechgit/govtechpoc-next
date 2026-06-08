'use client'

import { useState } from 'react'
import { Building2, Search, MessageSquare, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Aba = 'nova' | 'consultar'

type Manifestacao = {
  protocolo: string
  tipo: string
  descricao: string
  status: string
  criado_em: string
  sla_prazo: string | null
}

const TIPO_OPTIONS = [
  { value: 'reclamacao', label: 'Reclamação' },
  { value: 'sugestao',   label: 'Sugestão' },
  { value: 'elogio',     label: 'Elogio' },
  { value: 'denuncia',   label: 'Denúncia' },
  { value: 'lai',        label: 'Pedido de Informação (LAI)' },
  { value: 'solicitacao',label: 'Solicitação de Serviço' },
]

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  aberta:       { label: 'Aberta',       color: 'text-blue-600',  icon: Clock },
  em_analise:   { label: 'Em Análise',   color: 'text-yellow-600',icon: Clock },
  respondida:   { label: 'Respondida',   color: 'text-green-600', icon: CheckCircle },
  encerrada:    { label: 'Encerrada',    color: 'text-gray-500',  icon: CheckCircle },
}

function gerarProtocolo(): string {
  const ano  = new Date().getFullYear()
  const num  = Math.floor(Math.random() * 900000) + 100000
  return `OUV-${ano}-${num}`
}

function calcularSLA(tipo: string): Date {
  const dias = tipo === 'lai' ? 20 : 15
  const data = new Date()
  let diasUteis = 0
  while (diasUteis < dias) {
    data.setDate(data.getDate() + 1)
    const diaSemana = data.getDay()
    if (diaSemana !== 0 && diaSemana !== 6) diasUteis++
  }
  return data
}

export default function PortalCidadaoPage() {
  const [aba, setAba] = useState<Aba>('nova')
  const [enviado, setEnviado] = useState(false)
  const [protocolo, setProtocolo] = useState('')
  const [consultaProtocolo, setConsultaProtocolo] = useState('')
  const [manifestacaoConsultada, setManifestacaoConsultada] = useState<Manifestacao | null>(null)
  const [erroConsulta, setErroConsulta] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [consultando, setConsultando] = useState(false)

  const [form, setForm] = useState({
    tipo: 'reclamacao',
    descricao: '',
    nome: '',
    email: '',
    telefone: '',
    anonimo: false,
  })

  function handleChange(field: string, value: any) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function enviarManifestacao() {
    if (!form.descricao.trim()) return
    setEnviando(true)

    const novoProtocolo = gerarProtocolo()
    const sla = calcularSLA(form.tipo)

    try {
      const res = await fetch('/api/portal/manifestacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocolo: novoProtocolo,
          tipo: form.tipo,
          descricao: form.descricao,
          anonimo: form.anonimo,
          nome: form.anonimo ? null : form.nome,
          email: form.anonimo ? null : form.email,
          telefone: form.anonimo ? null : form.telefone,
          sla_prazo: sla.toISOString(),
          status: 'aberta',
        }),
      })

      if (res.ok) {
        setProtocolo(novoProtocolo)
        setEnviado(true)
      }
    } catch (err) {
      console.error(err)
    }

    setEnviando(false)
  }

  async function consultarProtocolo() {
    if (!consultaProtocolo.trim()) return
    setConsultando(true)
    setErroConsulta('')
    setManifestacaoConsultada(null)

    try {
      const res = await fetch(`/api/portal/consulta?protocolo=${consultaProtocolo.trim()}`)
      if (res.ok) {
        const data = await res.json()
        if (data) setManifestacaoConsultada(data)
        else setErroConsulta('Protocolo não encontrado.')
      } else {
        setErroConsulta('Protocolo não encontrado.')
      }
    } catch {
      setErroConsulta('Erro ao consultar. Tente novamente.')
    }

    setConsultando(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-[#1e3a5f] text-white">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Portal do Cidadão</h1>
              <p className="text-white/70 text-sm">
                Prefeitura Municipal de Demonstração
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">

        {/* Cards informativos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-gray-700">Reclamações</p>
              <p className="text-xs text-gray-500 mt-1">Resposta em até 15 dias úteis</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-gray-700">Pedido de Informação (LAI)</p>
              <p className="text-xs text-gray-500 mt-1">Resposta em até 20 dias úteis</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-gray-700">Acompanhe sua solicitação</p>
              <p className="text-xs text-gray-500 mt-1">Use o protocolo recebido</p>
            </CardContent>
          </Card>
        </div>

        {/* Abas */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => { setAba('nova'); setEnviado(false) }}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
              aba === 'nova'
                ? 'bg-white text-[#1e3a5f] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Nova Manifestação
          </button>
          <button
            onClick={() => setAba('consultar')}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
              aba === 'consultar'
                ? 'bg-white text-[#1e3a5f] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Consultar Protocolo
          </button>
        </div>

        {/* NOVA MANIFESTAÇÃO */}
        {aba === 'nova' && !enviado && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-[#1e3a5f] flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Nova Manifestação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* Tipo */}
              <div className="space-y-2">
                <Label>Tipo de manifestação *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {TIPO_OPTIONS.map(op => (
                    <button
                      key={op.value}
                      onClick={() => handleChange('tipo', op.value)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors text-left ${
                        form.tipo === op.value
                          ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-[#1e3a5f]'
                      }`}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label>Descreva sua manifestação *</Label>
                <textarea
                  className="w-full border rounded-lg px-4 py-3 text-sm min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  placeholder={
                    form.tipo === 'lai'
                      ? 'Descreva a informação que deseja acessar...'
                      : form.tipo === 'denuncia'
                      ? 'Descreva a irregularidade observada (você pode permanecer anônimo)...'
                      : 'Descreva detalhadamente sua manifestação...'
                  }
                  value={form.descricao}
                  onChange={e => handleChange('descricao', e.target.value)}
                />
                <p className="text-xs text-gray-400">
                  {form.descricao.length}/2000 caracteres
                </p>
              </div>

              {/* Anônimo */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="anonimo"
                  checked={form.anonimo}
                  onChange={e => handleChange('anonimo', e.target.checked)}
                  className="w-4 h-4 accent-[#1e3a5f]"
                />
                <div>
                  <Label htmlFor="anonimo" className="cursor-pointer font-medium">
                    Manifestação anônima
                  </Label>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Seus dados não serão registrados. O protocolo ainda será gerado.
                  </p>
                </div>
              </div>

              {/* Dados pessoais */}
              {!form.anonimo && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Nome completo</Label>
                    <Input
                      placeholder="Seu nome"
                      value={form.nome}
                      onChange={e => handleChange('nome', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      value={form.email}
                      onChange={e => handleChange('email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label>WhatsApp (opcional)</Label>
                    <Input
                      placeholder="(XX) 99999-9999"
                      value={form.telefone}
                      onChange={e => handleChange('telefone', e.target.value)}
                    />
                    <p className="text-xs text-gray-400">
                      Se informado, você receberá o protocolo e atualizações pelo WhatsApp.
                    </p>
                  </div>
                </div>
              )}

              {!form.descricao.trim() && (
                <p className="text-xs text-red-500">
                  * A descrição é obrigatória.
                </p>
              )}

              <Button
                onClick={enviarManifestacao}
                disabled={enviando || !form.descricao.trim()}
                className="w-full bg-[#1e3a5f] hover:bg-[#2d5282] text-white py-3"
              >
                {enviando ? 'Enviando...' : 'Enviar Manifestação'}
              </Button>

              <p className="text-xs text-gray-400 text-center">
                Ao enviar, você concorda com a política de privacidade do município.
                Seus dados são protegidos pela LGPD.
              </p>
            </CardContent>
          </Card>
        )}

        {/* SUCESSO */}
        {aba === 'nova' && enviado && (
          <Card className="border-green-200">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Manifestação registrada com sucesso!
              </h2>
              <div className="bg-gray-50 rounded-xl p-4 inline-block">
                <p className="text-sm text-gray-500">Seu protocolo</p>
                <p className="text-2xl font-bold text-[#1e3a5f] font-mono">{protocolo}</p>
              </div>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                Guarde este protocolo. Você pode acompanhar o andamento
                da sua manifestação a qualquer momento.
              </p>
              {form.telefone && (
                <p className="text-sm text-green-600">
                  📱 Você receberá atualizações pelo WhatsApp no número informado.
                </p>
              )}
              <div className="flex gap-3 justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setConsultaProtocolo(protocolo)
                    setAba('consultar')
                  }}
                >
                  Acompanhar manifestação
                </Button>
                <Button
                  onClick={() => {
                    setEnviado(false)
                    setForm({ tipo: 'reclamacao', descricao: '', nome: '', email: '', telefone: '', anonimo: false })
                  }}
                  className="bg-[#1e3a5f] text-white"
                >
                  Nova manifestação
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CONSULTAR PROTOCOLO */}
        {aba === 'consultar' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-[#1e3a5f] flex items-center gap-2">
                <Search className="w-5 h-5" />
                Consultar Protocolo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder="Ex: OUV-2025-123456"
                  value={consultaProtocolo}
                  onChange={e => setConsultaProtocolo(e.target.value.toUpperCase())}
                  className="font-mono"
                  onKeyDown={e => e.key === 'Enter' && consultarProtocolo()}
                />
                <Button
                  onClick={consultarProtocolo}
                  disabled={consultando || !consultaProtocolo.trim()}
                  className="bg-[#1e3a5f] text-white shrink-0"
                >
                  {consultando ? 'Buscando...' : 'Consultar'}
                </Button>
              </div>

              {erroConsulta && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p className="text-sm">{erroConsulta}</p>
                </div>
              )}

              {manifestacaoConsultada && (
                <Card className="border-[#1e3a5f]/20">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-gray-400">Protocolo</p>
                        <p className="font-mono font-bold text-[#1e3a5f] text-lg">
                          {manifestacaoConsultada.protocolo}
                        </p>
                      </div>
                      {(() => {
                        const s = STATUS_CONFIG[manifestacaoConsultada.status]
                        const Icon = s?.icon ?? Clock
                        return (
                          <div className={`flex items-center gap-1.5 ${s?.color}`}>
                            <Icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{s?.label}</span>
                          </div>
                        )
                      })()}
                    </div>

                    <div>
                      <p className="text-xs text-gray-400 mb-1">Tipo</p>
                      <p className="text-sm font-medium text-gray-800">
                        {TIPO_OPTIONS.find(t => t.value === manifestacaoConsultada.tipo)?.label}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400 mb-1">Descrição</p>
                      <p className="text-sm text-gray-700">{manifestacaoConsultada.descricao}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div>
                        <p className="text-xs text-gray-400">Registrado em</p>
                        <p className="text-sm font-medium">
                          {new Date(manifestacaoConsultada.criado_em).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      {manifestacaoConsultada.sla_prazo && (
                        <div>
                          <p className="text-xs text-gray-400">Prazo de resposta</p>
                          <p className="text-sm font-medium">
                            {new Date(manifestacaoConsultada.sla_prazo).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-[#1e3a5f] text-white/60 text-xs text-center py-6 mt-16">
        <p>Prefeitura Municipal de Demonstração · Portal do Cidadão</p>
        <p className="mt-1">Dados protegidos pela LGPD · Lei de Acesso à Informação (Lei 12.527/2011)</p>
      </footer>
    </div>
  )
}
