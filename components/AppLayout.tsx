'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Wallet,
  FileText,
  MessageSquare,
  LogOut,
  Building2,
  ChevronDown,
  ChevronRight,
  Gavel,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Item = { href: string; label: string; icon: React.ComponentType<{ className?: string }> }

const mainItems: Item[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
]

const finItems: Item[] = [
  { href: '/financeiro/orcamento', label: 'Orçamento', icon: Wallet },
  { href: '/financeiro/receita', label: 'Receita', icon: Wallet },
  { href: '/financeiro/empenhos', label: 'Empenhos', icon: Wallet },
]

const tailItems: Item[] = [
  { href: '/contratos', label: 'Contratos', icon: FileText },
  { href: '/licitacoes', label: 'Licitações', icon: Gavel },
  { href: '/ouvidoria', label: 'Ouvidoria', icon: MessageSquare },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [finOpen, setFinOpen] = useState(path?.startsWith('/financeiro') ?? false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ''))
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const NavLink = ({ item }: { item: Item }) => {
    const active = path === item.href
    const Icon = item.icon
    return (
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
          active
            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
        )}
      >
        <Icon className="w-4 h-4" />
        <span>{item.label}</span>
      </Link>
    )
  }

  return (
    <div className="min-h-screen flex w-full bg-secondary/30">
      <aside className="w-[240px] shrink-0 bg-sidebar text-sidebar-foreground flex flex-col fixed inset-y-0 left-0 z-20">
        <div className="px-5 py-5 border-b border-sidebar-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-sidebar-accent flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-base leading-tight">GovTech</div>
            <div className="text-[11px] uppercase tracking-wide opacity-70">Gestão Municipal</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {mainItems.map((i) => <NavLink key={i.href} item={i} />)}

          <button
            type="button"
            onClick={() => setFinOpen((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
          >
            <span className="flex items-center gap-3">
              <Wallet className="w-4 h-4" />
              Financeiro
            </span>
            {finOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {finOpen && (
            <div className="pl-3 space-y-1">
              {finItems.map((i) => {
                const active = path === i.href
                return (
                  <Link
                    key={i.href}
                    href={i.href}
                    className={cn(
                      'block px-3 py-1.5 rounded-md text-sm transition-colors',
                      active
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50'
                    )}
                  >
                    {i.label}
                  </Link>
                )
              })}
            </div>
          )}

          {tailItems.map((i) => <NavLink key={i.href} item={i} />)}
        </nav>

        <div className="px-5 py-4 text-[11px] opacity-60 border-t border-sidebar-border">
          v1.0 · Município
        </div>
      </aside>

      <div className="flex-1 ml-[240px] flex flex-col">
        <header className="h-16 bg-card border-b flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="text-sm text-muted-foreground">Sistema de Gestão Pública</div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Olá,</span>{' '}
              <span className="font-medium">{email || '—'}</span>
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
