'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Building2, Users, Plus, X, Search,
  CheckCircle, AlertCircle, Briefcase
} from 'lucide-react'

type Pessoa = {
  id: string
  tipo: string
  nome: string
  cpf_cnpj: string
  nome_fantasia: string | null
  email: string | null
  telefone: string | null
  cidade: string | null
  uf: string | null
  eh_fornecedor: boolean
  eh_cliente: boolean
  eh_credor: boolean
  situacao_receita: string
  total_empenhos: number
  total_pago: number
  total_em_aberto: number
  total_contratos: number
  total_notas_fiscais: number
  ultimo_empenho_em: string | null
  ativo: boolean
}

const SITUACAO_CONFIG: Record<string, { label: string; color: string }> = {
  ativo:          { label: 'Ativo',          color: 'bg-green-100 text-green-800' },
  suspenso:       { label: 'Suspenso',        color: 'bg-yellow-100 text-yellow-800' },
  inapto:         { label: 'Inapto',          color: 'bg-red-100 text-red-800' },
  baixado:        { label: 'Baixado',         color: 'bg-gray-100 text-gray-600' },
  nao_verificado: { label: 'Não verificado',  color: 'bg-gray-100 text-gray-500' },
}

function fmt(value: number | null) {
  if (!value && value !== 0) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function fmtCpfCnpj(value: string) {
  const d = value.replace(/\D/g, '')
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  return value
}

export default function FornecedoresPage() {
  const [pessoas, setPessoas] = useState<Pessoa[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [detalhe, setDetalhe] = useState<Pessoa | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  const [form, setForm] = useState({
    tipo: 'pj',
    nome: '', cpf_cnpj: '', nome_fantasia: '',
    email: '', telefone: '', whatsapp: '',
    cep: '', logradouro: '', numero: '',
    bairro: '', cidade: '', uf: '',
    inscricao_estadual: '', inscricao_municipal: '',
    eh_fornecedor: true, eh_cliente: false, eh_credor: false,
    observacoes: '',
  })

  const supabase = createClient()

  useEffect(() => { fetchPessoas() }, [])

  async function fetchPessoas() {
    setLoading(true)
    const { data } = await supabase
      .from('vw_fornecedores')
      .select('*')
      .order('nome')
    if (data) setPessoas(data as any)
    setLoading(false)
  }

  function fecharModal() {
    setModalAberto(false)
    setErro(''); setSucesso('')
    setForm({
      tipo: 'pj', nome: '', cpf_cnpj: '', nome_fantasia: '',
      email: '', telefone: '', whatsapp: '',
      cep: '', logradouro: '', numero: '',
      bairro: '', cidade: '', uf: '',
      inscricao_estadual: '', inscricao_municipal: '',
      eh_fornecedor: true, eh_cliente: false, eh_credor: false,
      observacoes: '',
    })
  }

  async function salvar() {
    setErro(''); setSalvando(true)
    try {
      const res = await fetch('/api/pessoas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) setErro(data.error || 'Erro ao salvar')
      else {
        setSucesso(`${form.nome} cadastrado com sucesso!`)
        await fetchPessoas()
        setTimeout(fecharModal, 1500)
      }
    } catch { setErro('Erro de conexão') }
    setSalvando(false)
  }

  async function toggleAtivo(pessoa: Pessoa) {
    await supabase
      .from('pessoas')
      .update({ ativo: !pessoa.ativo })
      .eq('id', pessoa.id)
    await fetchPessoas()
  }

  const filtradas = pessoas.filter(p => {
    const okFiltro =
      filtro === 'todos' ||
      (filtro === 'fornecedor' && p.eh_fornecedor) ||
      (filtro === 'cliente' && p.eh_cliente) ||
      (filtro === 'credor' && p.eh_credor)
    const okBusca = !busca ||
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.cpf_cnpj.includes(busca)
    return okFiltro && okBusca
  })

  const totalFornecedores = pessoas.filter(p => p.eh_fornecedor).length
  const totalClientes     = pessoas.filter(p => p.eh_cliente).length
  const totalPago         = pessoas.reduce((a, p) => a + (p.total_pago || 0), 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#1e3a5f]" />
            Fornecedores e Clientes
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Cadastro de pessoas físicas e jurídicas
          </p>
        </div>
        <Button
          onClick={() => setModalAberto(true)}
          className="bg-[#1e3a5f] hover:bg-[#2d5282] text-white gap-2"
        >
          <Plus className="w-4 h-4" /> Novo Cadastro
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#1e3a5f]" /> Fornecedores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#1e3a5f]">{totalFornecedores}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" /> Clientes/Credores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{totalClientes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal">Total Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-green-600">{fmt(totalPago)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <Input
            placeholder="Buscar por nome ou CNPJ/CPF..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="pl-9 w-72"
          />
        </div>
        <div className="flex gap-1">
          {['todos','fornecedor','cliente','credor'].map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filtro === f
                  ? 'bg-[#1e3a5f] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'todos' ? 'Todos' :
               f === 'fornecedor' ? 'Fornecedores' :
               f === 'cliente' ? 'Clientes' : 'Credores'}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-400 ml-auto">{filtradas.length} cadastro(s)</span>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="p-8 text-center text-gray-400">Carregando...</div>
      ) : filtradas.length === 0 ? (
        <div className="p-8 text-center text-gray-400">Nenhum cadastro encontrado.</div>
      ) : (
        <div className="space-y-3">
          {filtradas.map(p => {
            const sit = SITUACAO_CONFIG[p.situacao_receita]
            return (
              <Card
                key={p.id}
                className={`hover:shadow-md transition-shadow cursor-pointer ${!p.ativo ? 'opacity-50' : ''}`}
                onClick={() => setDetalhe(detalhe?.id === p.id ? null : p)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-lg bg-[#1e3a5f] text-white flex items-center justify-center shrink-0">
                      {p.tipo === 'pj'
                        ? <Building2 className="w-5 h-5" />
                        : <Users className="w-5 h-5" />
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{p.nome}</span>
                        {p.nome_fantasia && (
                          <span className="text-xs text-gray-400">({p.nome_fantasia})</span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sit?.color}`}>
                          {sit?.label}
                        </span>
                        {p.eh_fornecedor && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700">Fornecedor</span>
                        )}
                        {p.eh_cliente && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-purple-50 text-purple-700">Cliente</span>
                        )}
                        {p.eh_credor && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-orange-50 text-orange-700">Credor</span>
                        )}
                      </div>
                      <div className="flex gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                        <span className="font-mono">{fmtCpfCnpj(p.cpf_cnpj)}</span>
                        {p.cidade && <span>· {p.cidade}/{p.uf}</span>}
                        {p.email && <span>· {p.email}</span>}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="text-right shrink-0 space-y-0.5">
                      <p className="text-sm font-bold text-green-600">{fmt(p.total_pago)}</p>
                      <p className="text-xs text-gray-400">pago</p>
                      {p.total_em_aberto > 0 && (
                        <p className="text-xs text-yellow-600">{fmt(p.total_em_aberto)} em aberto</p>
                      )}
                    </div>
                  </div>

                  {/* Detalhe expandido */}
                  {detalhe?.id === p.id && (
                    <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#1e3a5f]">{p.total_empenhos}</p>
                        <p className="text-xs text-gray-400">Empenhos</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#1e3a5f]">{p.total_contratos}</p>
                        <p className="text-xs text-gray-400">Contratos</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#1e3a5f]">{p.total_notas_fiscais}</p>
                        <p className="text-xs text-gray-400">Notas Fiscais</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-green-600">{fmt(p.total_pago)}</p>
                        <p className="text-xs text-gray-400">Total Recebido</p>
                      </div>
                      <div className="col-span-2 md:col-span-4 flex gap-2 justify-end mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={e => { e.stopPropagation(); toggleAtivo(p) }}
                          className={p.ativo ? 'text-red-600' : 'text-green-600'}
                        >
                          {p.ativo ? 'Inativar' : 'Reativar'}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal novo cadastro */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-gray-900">Novo Cadastro</h2>
              <button onClick={fecharModal}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Tipo */}
              <div className="flex gap-3">
                {[
                  { value: 'pj', label: '🏢 Pessoa Jurídica' },
                  { value: 'pf', label: '👤 Pessoa Física' },
                ].map(t => (
                  <button
                    key={t.value}
                    onClick={() => setForm(f => ({ ...f, tipo: t.value }))}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                      form.tipo === t.value
                        ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-[#1e3a5f]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Papéis */}
              <div className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                {[
                  { field: 'eh_fornecedor', label: 'Fornecedor' },
                  { field: 'eh_cliente',    label: 'Cliente' },
                  { field: 'eh_credor',     label: 'Credor' },
                ].map(r => (
                  <label key={r.field} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(form as any)[r.field]}
                      onChange={e => setForm(f => ({ ...f, [r.field]: e.target.checked }))}
                      className="w-4 h-4 accent-[#1e3a5f]"
                    />
                    <span className="text-sm font-medium text-gray-700">{r.label}</span>
                  </label>
                ))}
              </div>

              {/* Dados principais */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <Label>
                    {form.tipo === 'pj' ? 'Razão Social *' : 'Nome Completo *'}
                  </Label>
                  <Input
                    value={form.nome}
                    onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                    placeholder={form.tipo === 'pj' ? 'Razão Social Ltda' : 'Nome completo'}
                  />
                </div>
                <div className="space-y-1">
                  <Label>{form.tipo === 'pj' ? 'CNPJ *' : 'CPF *'}</Label>
                  <Input
                    value={form.cpf_cnpj}
                    onChange={e => setForm(f => ({ ...f, cpf_cnpj: e.target.value }))}
                    placeholder={form.tipo === 'pj' ? 'XX.XXX.XXX/0001-XX' : 'XXX.XXX.XXX-XX'}
                  />
                </div>
                {form.tipo === 'pj' && (
                  <div className="space-y-1">
                    <Label>Nome Fantasia</Label>
                    <Input
                      value={form.nome_fantasia}
                      onChange={e => setForm(f => ({ ...f, nome_fantasia: e.target.value }))}
                      placeholder="Nome comercial"
                    />
                  </div>
                )}
              </div>

              {/* Contato */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="contato@empresa.com"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Telefone</Label>
                  <Input
                    value={form.telefone}
                    onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                    placeholder="(XX) XXXXX-XXXX"
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>CEP</Label>
                  <Input
                    value={form.cep}
                    onChange={e => setForm(f => ({ ...f, cep: e.target.value }))}
                    placeholder="XXXXX-XXX"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Logradouro</Label>
                  <Input
                    value={form.logradouro}
                    onChange={e => setForm(f => ({ ...f, logradouro: e.target.value }))}
                    placeholder="Rua, Av..."
                  />
                </div>
                <div className="space-y-1">
                  <Label>Número</Label>
                  <Input
                    value={form.numero}
                    onChange={e => setForm(f => ({ ...f, numero: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Bairro</Label>
                  <Input
                    value={form.bairro}
                    onChange={e => setForm(f => ({ ...f, bairro: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Cidade</Label>
                  <Input
                    value={form.cidade}
                    onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))}
                  />
                </div>
              </div>

              {/* Inscrições */}
              {form.tipo === 'pj' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Inscrição Estadual</Label>
                    <Input
                      value={form.inscricao_estadual}
                      onChange={e => setForm(f => ({ ...f, inscricao_estadual: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Inscrição Municipal</Label>
                    <Input
                      value={form.inscricao_municipal}
                      onChange={e => setForm(f => ({ ...f, inscricao_municipal: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Observações */}
              <div className="space-y-1">
                <Label>Observações</Label>
                <textarea
                  className="w-full border rounded-md px-3 py-2 text-sm min-h-[60px] resize-none focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  value={form.observacoes}
                  onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                  placeholder="Informações adicionais..."
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
                {salvando ? 'Salvando...' : 'Cadastrar'}
              </Button>
              <Button variant="outline" onClick={fecharModal}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
