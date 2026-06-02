'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Users, Plus, X, Check, Pencil } from 'lucide-react'

type Perfil = {
  id: string
  nome_completo: string | null
  cargo: string | null
  papel: string
  ativo: boolean
  secretaria_id: string | null
  secretarias: { nome: string; sigla: string } | null
  auth_email?: string
}

type Secretaria = {
  id: string
  nome: string
  sigla: string
}

const PAPEL_CONFIG: Record<string, { label: string; color: string }> = {
  superadmin:  { label: 'Super Admin',  color: 'bg-purple-100 text-purple-800' },
  prefeito:    { label: 'Prefeito',     color: 'bg-blue-100 text-blue-800' },
  secretario:  { label: 'Secretário',   color: 'bg-green-100 text-green-800' },
  controlador: { label: 'Controlador',  color: 'bg-yellow-100 text-yellow-800' },
  servidor:    { label: 'Servidor',     color: 'bg-gray-100 text-gray-700' },
  cidadao:     { label: 'Cidadão',      color: 'bg-gray-100 text-gray-500' },
}

function getInitials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export default function UsuariosPage() {
  const [perfis, setPerfis] = useState<Perfil[]>([])
  const [secretarias, setSecretarias] = useState<Secretaria[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Perfil | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  const [form, setForm] = useState({
    id: '',
    nome_completo: '',
    cargo: '',
    papel: 'servidor',
    secretaria_id: '',
    ativo: true,
  })

  const supabase = createClient()

  useEffect(() => {
    fetchDados()
  }, [])

  async function fetchDados() {
    setLoading(true)
    const [{ data: perfisData }, { data: secrData }] = await Promise.all([
      supabase.from('usuarios_perfil').select('*, secretarias(nome, sigla)').order('nome_completo'),
      supabase.from('secretarias').select('id, nome, sigla').order('nome'),
    ])
    if (perfisData) setPerfis(perfisData as any)
    if (secrData) setSecretarias(secrData)
    setLoading(false)
  }

  function abrirEdicao(perfil: Perfil) {
    setEditando(perfil)
    setForm({
      id: perfil.id,
      nome_completo: perfil.nome_completo ?? '',
      cargo: perfil.cargo ?? '',
      papel: perfil.papel,
      secretaria_id: perfil.secretaria_id ?? '',
      ativo: perfil.ativo,
    })
    setErro('')
    setSucesso('')
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setEditando(null)
    setErro('')
    setSucesso('')
    setForm({ id: '', nome_completo: '', cargo: '', papel: 'servidor', secretaria_id: '', ativo: true })
  }

  async function salvar() {
    setErro('')
    setSucesso('')

    if (!form.nome_completo.trim()) {
      setErro('Nome completo é obrigatório.')
      return
    }

    if (!form.id) {
      setErro('Selecione um usuário existente para editar o perfil.')
      return
    }

    setSalvando(true)

    const { error } = await supabase
      .from('usuarios_perfil')
      .update({
        nome_completo: form.nome_completo,
        cargo: form.cargo || null,
        papel: form.papel,
        secretaria_id: form.secretaria_id || null,
        ativo: form.ativo,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', form.id)

    setSalvando(false)

    if (error) {
      setErro('Erro ao salvar: ' + error.message)
      return
    }

    setSucesso('Perfil atualizado com sucesso!')
    await fetchDados()
    setTimeout(() => fecharModal(), 1500)
  }

  async function toggleAtivo(perfil: Perfil) {
    await supabase
      .from('usuarios_perfil')
      .update({ ativo: !perfil.ativo })
      .eq('id', perfil.id)
    await fetchDados()
  }

  const ativos   = perfis.filter(p => p.ativo).length
  const inativos = perfis.filter(p => !p.ativo).length

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#1e3a5f]" />
            Gestão de Usuários
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Papéis e permissões de acesso ao sistema
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#1e3a5f]">{perfis.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal">Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{ativos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal">Inativos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-400">{inativos}</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de usuários */}
      {loading ? (
        <div className="p-8 text-center text-gray-400">Carregando...</div>
      ) : perfis.length === 0 ? (
        <div className="p-8 text-center text-gray-400">Nenhum usuário encontrado.</div>
      ) : (
        <div className="space-y-2">
          {perfis.map((perfil) => {
            const papelConfig = PAPEL_CONFIG[perfil.papel]
            return (
              <Card
                key={perfil.id}
                className={`hover:shadow-md transition-shadow ${!perfil.ativo ? 'opacity-50' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${perfil.ativo ? 'bg-[#1e3a5f] text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {getInitials(perfil.nome_completo)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">
                          {perfil.nome_completo ?? 'Sem nome'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${papelConfig?.color}`}>
                          {papelConfig?.label ?? perfil.papel}
                        </span>
                        {!perfil.ativo && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-600">
                            Inativo
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 flex gap-3 mt-0.5 flex-wrap">
                        {perfil.cargo && <span>{perfil.cargo}</span>}
                        {perfil.secretarias && (
                          <span>· {perfil.secretarias.sigla} — {perfil.secretarias.nome}</span>
                        )}
                        <span className="font-mono text-gray-300">· {perfil.id.substring(0, 8)}...</span>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => abrirEdicao(perfil)}
                        className="text-[#1e3a5f] hover:bg-blue-50"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAtivo(perfil)}
                        className={perfil.ativo ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}
                      >
                        {perfil.ativo ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal de edição */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold text-gray-900">
                Editar Perfil
              </h2>
              <button onClick={fecharModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <Label>Nome Completo *</Label>
                <Input
                  value={form.nome_completo}
                  onChange={e => setForm(f => ({ ...f, nome_completo: e.target.value }))}
                  placeholder="Nome completo do servidor"
                />
              </div>

              <div className="space-y-1">
                <Label>Cargo</Label>
                <Input
                  value={form.cargo}
                  onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}
                  placeholder="Ex: Contador, Engenheiro Civil"
                />
              </div>

              <div className="space-y-1">
                <Label>Papel no Sistema *</Label>
                <select
                  value={form.papel}
                  onChange={e => setForm(f => ({ ...f, papel: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                >
                  <option value="prefeito">Prefeito</option>
                  <option value="secretario">Secretário</option>
                  <option value="controlador">Controlador</option>
                  <option value="servidor">Servidor</option>
                  <option value="cidadao">Cidadão</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {form.papel === 'prefeito'    && '✅ Acesso total ao sistema'}
                  {form.papel === 'secretario'  && '✅ Acesso aos módulos operacionais'}
                  {form.papel === 'controlador' && '✅ Acesso de auditoria e financeiro'}
                  {form.papel === 'servidor'    && '⚠️ Acesso limitado (dashboard, ouvidoria, obras, contratos)'}
                  {form.papel === 'cidadao'     && '⚠️ Acesso somente à ouvidoria'}
                </p>
              </div>

              <div className="space-y-1">
                <Label>Secretaria</Label>
                <select
                  value={form.secretaria_id}
                  onChange={e => setForm(f => ({ ...f, secretaria_id: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                >
                  <option value="">Nenhuma (Gabinete/Geral)</option>
                  {secretarias.map(s => (
                    <option key={s.id} value={s.id}>{s.sigla} — {s.nome}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={form.ativo}
                  onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))}
                  className="w-4 h-4 accent-[#1e3a5f]"
                />
                <Label htmlFor="ativo" className="cursor-pointer">
                  Usuário ativo
                </Label>
              </div>

              {erro && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {erro}
                </div>
              )}

              {sucesso && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                  {sucesso}
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t">
              <Button
                onClick={salvar}
                disabled={salvando}
                className="bg-[#1e3a5f] hover:bg-[#2d5282] text-white flex-1"
              >
                {salvando ? 'Salvando...' : 'Salvar Perfil'}
              </Button>
              <Button variant="outline" onClick={fecharModal}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
