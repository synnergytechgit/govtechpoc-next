'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function handleLogin() {
    setErro('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setErro(error.message); return }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex">
      <div className="w-1/2 bg-[#1e3a5f] flex flex-col items-start justify-end p-16 text-white">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-md bg-white/20 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-bold text-xl">GovTech</div>
            <div className="text-xs uppercase tracking-wide opacity-70">Gestão Municipal</div>
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-4 leading-tight">Sistema de Gestão<br />Pública Municipal</h1>
        <p className="text-white/70 text-lg max-w-md">Transparência, eficiência e controle integrado para a administração pública.</p>
        <div className="mt-16 text-white/40 text-sm">© 2025 GovTech — Todos os direitos reservados</div>
      </div>

      <div className="w-1/2 flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm space-y-6 px-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Acessar plataforma</h2>
            <p className="text-sm text-gray-500 mt-1">Entre com suas credenciais institucionais</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" placeholder="seu@email.gov.br" value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
            </div>
            <div className="space-y-1">
              <Label>Senha</Label>
              <Input type="password" placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
            </div>
          </div>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <Button className="w-full bg-[#1e3a5f] hover:bg-[#2d5282]" onClick={handleLogin} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
