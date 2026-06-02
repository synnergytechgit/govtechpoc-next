'use client'

// app/(dashboard)/layout.tsx — VERSÃO COM RBAC

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Wallet, FileText, MessageSquare,
  LogOut, Building2, ChevronDown, ChevronRight,
  Gavel, HardHat, Users, Target, Eye, Heart,
  Activity, GraduationCap, Landmark, Receipt, Shield, UserCog
} from 'lucide-react'

type Papel = 'superadmin'|'prefeito'|'secretario'|'controlador'|'servidor'|'cidadao'

type Item = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  papeis: Papel[]
}

const mainItems: Item[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard,
    papeis: ['superadmin','prefeito','secretario','controlador','servidor'] },
]

const finItems: Item[] = [
  { href: '/financeiro/orcamento', label: 'Orçamento', icon: Wallet,
    papeis: ['superadmin','prefeito','secretario','controlador'] },
  { href: '/financeiro/receita',   label: 'Receita',   icon: Wallet,
    papeis: ['superadmin','prefeito','secretario','controlador'] },
  { href: '/financeiro/empenhos',  label: 'Empenhos',  icon: Wallet,
    papeis: ['superadmin','prefeito','secretario','controlador','servidor'] },
]

const tailItems: Item[] = [
  { href: '/contratos',    label: 'Contratos',         icon: FileText,      papeis: ['superadmin','prefeito','secretario','controlador','servidor'] },
  { href: '/licitacoes',   label: 'Licitações',        icon: Gavel,         papeis: ['superadmin','prefeito','secretario','controlador','servidor'] },
  { href: '/obras',        label: 'Obras',             icon: HardHat,       papeis: ['superadmin','prefeito','secretario','controlador','servidor'] },
  { href: '/servidores',   label: 'Servidores',        icon: Users,         papeis: ['superadmin','prefeito','secretario','controlador'] },
  { href: '/planejamento', label: 'Planejamento',      icon: Target,        papeis: ['superadmin','prefeito','secretario','controlador'] },
  { href: '/transparencia',label: 'Transparência',     icon: Eye,           papeis: ['superadmin','prefeito','secretario','controlador','servidor'] },
  { href: '/assistencia',  label: 'Assistência Social',icon: Heart,         papeis: ['superadmin','prefeito','secretario','servidor'] },
  { href: '/saude',        label: 'Saúde',             icon: Activity,      papeis: ['superadmin','prefeito','secretario','servidor'] },
  { href: '/educacao',     label: 'Educação',          icon: GraduationCap, papeis: ['superadmin','prefeito','secretario','servidor'] },
  { href: '/gabinete',     label: 'Gabinete',          icon: Landmark,      papeis: ['superadmin','prefeito','secretario'] },
  { href: '/tributacao',   label: 'Tributação',        icon: Receipt,       papeis: ['superadmin','prefeito','secretario','controlador'] },
  { href: '/ouvidoria',    label: 'Ouvidoria',         icon: MessageSquare, papeis: ['superadmin','prefeito','secretario','controlador','servidor'] },
  { href: '/auditoria',    label: 'Auditoria',         icon: Shield,        papeis: ['superadmin','prefeito','controlador'] },
  { href: '/usuarios',     label: 'Usuários',          icon: UserCog,       papeis: ['superadmin','prefeito'] },
]

const PAPEL_LABELS: Record<Papel, { label: string; color: string }> = {
  superadmin:  { label: 'Super Admin', color: 'bg-purple-500' },
  prefeito:    { label: 'Prefeito',    color: 'bg-blue-500' },
  secretario:  { label: 'Secretário',  color: 'bg-green-500' },
  controlador: { label: 'Controlador', color: 'bg-yellow-500' },
  servidor:    { label: 'Servidor',    color: 'bg-gray-400' },
  cidadao:     { label: 'Cidadão',     color: 'bg-gray-300' },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [papel, setPapel] = useState<Papel>('servidor')
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [finOpen, setFinOpen] = useState(pathname?.startsWith('/financeiro') ?? false)

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email ?? '')

      const { data } = await supabase
        .from('usuarios_perfil')
        .select('papel, nome_completo')
        .eq('id', user.id)
        .single()

      if (data) {
        setPapel(data.papel as Papel)
        setNomeCompleto(data.nome_completo ?? '')
      }
    }
    fetchUser()
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function podeVer(item: Item): boolean {
    return item.papeis.includes(papel)
  }

  const finItemsFiltrados = finItems.filter(podeVer)
  const mostrarFinanceiro = finItemsFiltrados.length > 0

  function NavLink({ item }: { item: Item }) {
    const active = pathname === item.href || pathname?.startsWith(item.href + '/')
    const Icon = item.icon
    return (
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
          active
            ? 'bg-white/20 text-white font-medium'
            : 'text-white/70 hover:bg-white/10 hover:text-white'
        )}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="truncate">{item.label}</span>
      </Link>
    )
  }

  const papelConfig = PAPEL_LABELS[papel]

  return (
    <div className="min-h-screen flex w-full bg-gray-50">
      {/* Sidebar */}
      <aside className="w-[240px] shrink-0 bg-[#1e3a5f] text-white flex flex-col fixed inset-y-0 left-0 z-20">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-white/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-base leading-tight">GovTech</div>
            <div className="text-[11px] uppercase tracking-wide opacity-70">Gestão Municipal</div>
          </div>
        </div>

        {/* Badge do papel */}
        <div className="px-4 py-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${papelConfig?.color}`} />
            <span className="text-xs text-white/70">{papelConfig?.label}</span>
          </div>
          {nomeCompleto && (
            <p className="text-xs text-white/50 truncate mt-0.5">{nomeCompleto}</p>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {mainItems.filter(podeVer).map(i => <NavLink key={i.href} item={i} />)}

          {mostrarFinanceiro && (
            <>
              <button
                type="button"
                onClick={() => setFinOpen(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              >
                <span className="flex items-center gap-3">
                  <Wallet className="w-4 h-4" />
                  Financeiro
                </span>
                {finOpen
                  ? <ChevronDown className="w-4 h-4" />
                  : <ChevronRight className="w-4 h-4" />
                }
              </button>
              {finOpen && (
                <div className="pl-3 space-y-1">
                  {finItemsFiltrados.map(i => (
                    <Link key={i.href} href={i.href}
                      className={cn(
                        'block px-3 py-1.5 rounded-md text-sm transition-colors',
                        pathname === i.href
                          ? 'bg-white/20 text-white font-medium'
                          : 'text-white/60 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      {i.label}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          {tailItems.filter(podeVer).map(i => <NavLink key={i.href} item={i} />)}
        </nav>

        <div className="px-5 py-4 text-[11px] opacity-50 border-t border-white/10">v1.0 · Município Demo</div>
      </aside>

      {/* Main */}
      <div className="flex-1 ml-[240px] flex flex-col">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="text-sm text-gray-500">Sistema de Gestão Pública</div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-gray-500">Olá,</span>{' '}
              <span className="font-medium">{nomeCompleto || email || '—'}</span>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </header>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}
