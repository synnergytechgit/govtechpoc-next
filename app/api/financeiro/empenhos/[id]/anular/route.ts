// app/api/financeiro/empenhos/[id]/anular/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const body = await request.json()
    const { justificativa } = body
    const empenho_id = params.id

    if (!justificativa || justificativa.trim().length < 20) {
      return NextResponse.json({
        error: 'Justificativa obrigatória para anulação (mínimo 20 caracteres)'
      }, { status: 400 })
    }

    const { data: empenho } = await supabase
      .from('empenhos')
      .select('status, dotacao_id, valor_empenho, valor')
      .eq('id', empenho_id)
      .single()

    if (!empenho) {
      return NextResponse.json({ error: 'Empenho não encontrado' }, { status: 404 })
    }
    if (empenho.status !== 'emitido') {
      return NextResponse.json({
        error: `Apenas empenhos com status "emitido" podem ser anulados. Status atual: ${empenho.status}`
      }, { status: 422 })
    }

    // Anula o empenho
    const { error } = await supabase
      .from('empenhos')
      .update({ status: 'anulado', justificativa_anulacao: justificativa })
      .eq('id', empenho_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Devolve saldo à dotação
    const valor = empenho.valor_empenho || empenho.valor || 0
    if (empenho.dotacao_id) {
      const { data: dot } = await supabase
        .from('dotacoes')
        .select('valor_empenhado')
        .eq('id', empenho.dotacao_id)
        .single()

      await supabase
        .from('dotacoes')
        .update({ valor_empenhado: Math.max(0, (dot?.valor_empenhado || 0) - valor) })
        .eq('id', empenho.dotacao_id)
    }

    // Registra justificativa
    await supabase.from('empenho_justificativas').insert({
      empenho_id,
      operacao: 'anulacao',
      justificativa,
    })

    return NextResponse.json({ sucesso: true, mensagem: 'Empenho anulado. Saldo devolvido à dotação.' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
