// app/api/financeiro/empenhos/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// GET — lista empenhos com dados consolidados
export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { searchParams } = request.nextUrl
  const status = searchParams.get('status')
  const dotacao_id = searchParams.get('dotacao_id')

  let query = supabase
    .from('vw_empenhos')
    .select('*')
    .order('criado_em', { ascending: false })

  if (status && status !== 'todos') query = query.eq('status', status)
  if (dotacao_id) query = query.eq('dotacao_id', dotacao_id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST — criar empenho com validação de saldo
export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const body = await request.json()
    const {
      dotacao_id, fornecedor_nome, fornecedor_cnpj,
      valor_empenho, objeto, tipo, data_empenho
    } = body

    // Validações básicas
    if (!fornecedor_nome || !valor_empenho || !objeto) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: fornecedor, valor e objeto' },
        { status: 400 }
      )
    }
    if (valor_empenho <= 0) {
      return NextResponse.json(
        { error: 'Valor do empenho deve ser maior que zero' },
        { status: 400 }
      )
    }

    // Valida saldo da dotação se vinculada
    if (dotacao_id) {
      const { data: dotacao } = await supabase
        .from('dotacoes')
        .select('valor_dotacao_inicial, valor_empenhado, secretaria, natureza_despesa')
        .eq('id', dotacao_id)
        .single()

      if (!dotacao) {
        return NextResponse.json({ error: 'Dotação não encontrada' }, { status: 404 })
      }

      const saldo = (dotacao.valor_dotacao_inicial || 0) - (dotacao.valor_empenhado || 0)
      if (valor_empenho > saldo) {
        return NextResponse.json({
          error: `Saldo insuficiente na dotação.`,
          detalhe: {
            dotacao: dotacao.secretaria + ' — ' + dotacao.natureza_despesa,
            saldo_disponivel: saldo,
            valor_solicitado: valor_empenho
          }
        }, { status: 422 })
      }
    }

    // Gera número do empenho
    const ano = new Date().getFullYear()
    const { count } = await supabase
      .from('empenhos')
      .select('*', { count: 'exact', head: true })

    const sequencial = String((count || 0) + 1).padStart(6, '0')
    const numero_empenho = `${ano}NE${sequencial}`

    // Busca municipio_id
    const { data: municipio } = await supabase
      .from('municipios')
      .select('id')
      .eq('slug', 'demo-sp')
      .single()

    // Insere empenho
    const { data, error } = await supabase
      .from('empenhos')
      .insert({
        municipio_id: municipio?.id,
        numero_empenho,
        dotacao_id: dotacao_id || null,
        fornecedor_nome,
        fornecedor: fornecedor_nome,
        fornecedor_cnpj: fornecedor_cnpj || null,
        cnpj: fornecedor_cnpj || null,
        valor_empenho,
        valor: valor_empenho,
        objeto,
        tipo: tipo || 'ordinario',
        data_empenho: data_empenho || new Date().toISOString().split('T')[0],
        status: 'emitido',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Atualiza valor_empenhado na dotação
    if (dotacao_id) {
      try {
        await supabase.rpc('atualizar_empenhado', {
          p_dotacao_id: dotacao_id,
          p_valor: valor_empenho
        })
      } catch {
        // Fallback manual se RPC não existir
        const { data: d } = await supabase.from('dotacoes')
          .select('valor_empenhado')
          .eq('id', dotacao_id)
          .single()
        await supabase.from('dotacoes')
          .update({ valor_empenhado: (d?.valor_empenhado || 0) + valor_empenho })
          .eq('id', dotacao_id)
      }
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
