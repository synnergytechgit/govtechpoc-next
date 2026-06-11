// app/api/financeiro/empenhos/[id]/pagar/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// POST — pagar empenho (3º estágio)
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
    const { valor_pago, forma_pagamento, banco_origem, historico } = body
    const empenho_id = params.id

    if (!valor_pago || valor_pago <= 0) {
      return NextResponse.json({ error: 'Valor de pagamento inválido' }, { status: 400 })
    }
    if (!forma_pagamento) {
      return NextResponse.json({ error: 'Forma de pagamento obrigatória' }, { status: 400 })
    }

    // Busca empenho e liquidação
    const { data: empenho } = await supabase
      .from('empenhos')
      .select('status, municipio_id')
      .eq('id', empenho_id)
      .single()

    if (!empenho) {
      return NextResponse.json({ error: 'Empenho não encontrado' }, { status: 404 })
    }
    if (empenho.status !== 'liquidado') {
      return NextResponse.json({
        error: `Empenho precisa estar liquidado para pagamento. Status atual: ${empenho.status}`
      }, { status: 422 })
    }

    // Busca liquidação aprovada
    const { data: liquidacao } = await supabase
      .from('liquidacoes')
      .select('id, valor_liquidado')
      .eq('empenho_id', empenho_id)
      .eq('status', 'aprovada')
      .single()

    if (!liquidacao) {
      return NextResponse.json({ error: 'Liquidação aprovada não encontrada' }, { status: 404 })
    }

    if (valor_pago > liquidacao.valor_liquidado) {
      return NextResponse.json({
        error: `Pagamento excede valor liquidado. Máximo: R$ ${liquidacao.valor_liquidado.toFixed(2)}`
      }, { status: 422 })
    }

    // Gera número da ordem de pagamento
    const ano = new Date().getFullYear()
    const { count } = await supabase
      .from('pagamentos')
      .select('*', { count: 'exact', head: true })

    const sequencial = String((count || 0) + 1).padStart(6, '0')
    const numero_op = `${ano}OP${sequencial}`

    // Insere pagamento
    const { data: pagamento, error: errPag } = await supabase
      .from('pagamentos')
      .insert({
        municipio_id: empenho.municipio_id,
        liquidacao_id: liquidacao.id,
        numero_op,
        data_pagamento: new Date().toISOString().split('T')[0],
        valor_pago,
        forma_pagamento,
        banco_origem: banco_origem || null,
        historico: historico || null,
        status: 'pago',
      })
      .select()
      .single()

    if (errPag) return NextResponse.json({ error: errPag.message }, { status: 500 })

    // Atualiza status do empenho para pago
    await supabase
      .from('empenhos')
      .update({ status: 'pago', valor_pago })
      .eq('id', empenho_id)

    // Atualiza dotação
    const { data: emp } = await supabase
      .from('empenhos')
      .select('dotacao_id')
      .eq('id', empenho_id)
      .single()

    if (emp?.dotacao_id) {
      const { data: dot } = await supabase
        .from('dotacoes')
        .select('valor_pago')
        .eq('id', emp.dotacao_id)
        .single()

      await supabase
        .from('dotacoes')
        .update({ valor_pago: (dot?.valor_pago || 0) + valor_pago })
        .eq('id', emp.dotacao_id)
    }

    return NextResponse.json(pagamento, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
