// app/api/financeiro/empenhos/[id]/liquidar/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// POST — liquidar empenho (2º estágio)
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
    const { valor_liquidado, nota_fiscal, data_nota_fiscal, descricao } = body
    const empenho_id = params.id

    if (!valor_liquidado || valor_liquidado <= 0) {
      return NextResponse.json({ error: 'Valor de liquidação inválido' }, { status: 400 })
    }
    if (!nota_fiscal) {
      return NextResponse.json({ error: 'Nota fiscal obrigatória para liquidação' }, { status: 400 })
    }

    // Busca empenho
    const { data: empenho } = await supabase
      .from('empenhos')
      .select('status, valor_empenho, valor, municipio_id')
      .eq('id', empenho_id)
      .single()

    if (!empenho) {
      return NextResponse.json({ error: 'Empenho não encontrado' }, { status: 404 })
    }
    if (empenho.status !== 'emitido') {
      return NextResponse.json({
        error: `Empenho não pode ser liquidado. Status atual: ${empenho.status}`
      }, { status: 422 })
    }

    const valor_empenho = empenho.valor_empenho || empenho.valor || 0
    if (valor_liquidado > valor_empenho) {
      return NextResponse.json({
        error: `Liquidação excede valor do empenho. Máximo: R$ ${valor_empenho.toFixed(2)}`
      }, { status: 422 })
    }

    // Gera número da liquidação
    const ano = new Date().getFullYear()
    const { count } = await supabase
      .from('liquidacoes')
      .select('*', { count: 'exact', head: true })

    const sequencial = String((count || 0) + 1).padStart(6, '0')
    const numero_liquidacao = `${ano}LQ${sequencial}`

    // Insere liquidação
    const { data: liquidacao, error: errLiq } = await supabase
      .from('liquidacoes')
      .insert({
        municipio_id: empenho.municipio_id,
        empenho_id,
        numero_liquidacao,
        data_liquidacao: new Date().toISOString().split('T')[0],
        valor_liquidado,
        nota_fiscal,
        data_nota_fiscal: data_nota_fiscal || null,
        descricao: descricao || null,
        status: 'aprovada',
      })
      .select()
      .single()

    if (errLiq) return NextResponse.json({ error: errLiq.message }, { status: 500 })

    // Atualiza status do empenho para liquidado
    await supabase
      .from('empenhos')
      .update({ status: 'liquidado', valor_liquidado })
      .eq('id', empenho_id)

    return NextResponse.json(liquidacao, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
