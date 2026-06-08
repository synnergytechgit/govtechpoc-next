// app/api/portal/consulta/route.ts
// API pública — sem autenticação requerida

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const protocolo = request.nextUrl.searchParams.get('protocolo')

    if (!protocolo) {
      return NextResponse.json({ error: 'Protocolo obrigatório' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('manifestacoes')
      .select('protocolo, tipo, descricao, status, criado_em, sla_prazo')
      .eq('protocolo', protocolo.toUpperCase())
      .single()

    if (error || !data) {
      return NextResponse.json(null, { status: 404 })
    }

    // Retorna dados limitados (sem dados pessoais)
    return NextResponse.json({
      protocolo: data.protocolo,
      tipo: data.tipo,
      descricao: data.descricao,
      status: data.status,
      criado_em: data.criado_em,
      sla_prazo: data.sla_prazo,
    })

  } catch (err) {
    console.error('Erro na consulta:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
