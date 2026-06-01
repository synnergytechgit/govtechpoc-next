// hooks/use-rbac.ts

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type Papel = 'superadmin' | 'prefeito' | 'secretario' | 'controlador' | 'servidor' | 'cidadao'

type UserProfile = {
  id: string
  municipio_id: string | null
  nome_completo: string | null
  cargo: string | null
  papel: Papel
  secretaria_id: string | null
  ativo: boolean
}

// Mapa de permissões por papel
const PERMISSOES: Record<Papel, string[]> = {
  superadmin:   ['*'], // acesso total
  prefeito:     ['dashboard','financeiro','contratos','licitacoes','obras','servidores',
                 'planejamento','transparencia','assistencia','saude','educacao',
                 'gabinete','tributacao','ouvidoria','auditoria'],
  secretario:   ['dashboard','financeiro','contratos','licitacoes','obras','servidores',
                 'planejamento','transparencia','ouvidoria'],
  controlador:  ['dashboard','financeiro','contratos','licitacoes','obras','servidores',
                 'planejamento','transparencia','tributacao','auditoria'],
  servidor:     ['dashboard','ouvidoria','contratos','obras'],
  cidadao:      ['ouvidoria'],
}

export function useRBAC() {
  const [perfil, setPerfil] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchPerfil() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('usuarios_perfil')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) setPerfil(data as UserProfile)
      setLoading(false)
    }
    fetchPerfil()
  }, [])

  function temAcesso(modulo: string): boolean {
    if (!perfil) return false
    const perms = PERMISSOES[perfil.papel]
    return perms.includes('*') || perms.includes(modulo)
  }

  function isPrefeito()    { return perfil?.papel === 'prefeito' }
  function isSecretario()  { return perfil?.papel === 'secretario' }
  function isControlador() { return perfil?.papel === 'controlador' }
  function isSuperAdmin()  { return perfil?.papel === 'superadmin' }

  return { perfil, loading, temAcesso, isPrefeito, isSecretario, isControlador, isSuperAdmin }
}
