// app/api/notas-fiscais/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { searchParams } = request.nextUrl
  const pessoa_id = searchParams.get('pessoa_id')
  const empenho_id = searchParams.get('empenho_id')
  const status = searchParams.get('status')

  let query = supabase
    .from('notas_fiscais')
    .select(`
      *,
      pessoas(id, nome, cpf_cnpj, tipo),
      empenhos(id, numero_empenho, status)
    `)
    .eq('ativo', true)
    .order('data_emissao', { ascending: false })

  if (pessoa_id) query = query.eq('pessoa_id', pessoa_id)
  if (empenho_id) query = query.eq('empenho_id', empenho_id)
  if (status && status !== 'todos') query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const body = await request.json()
    const {
      pessoa_id, emitente_nome, emitente_cnpj,
      tipo, numero, serie, chave_acesso,
      data_emissao, valor_total,
      descricao, empenho_id, contrato_id
    } = body

    if (!tipo || !numero || !data_emissao || !valor_total || !emitente_nome) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: tipo, número, data, valor e emitente' },
        { status: 400 }
      )
    }

    if (valor_total <= 0) {
      return NextResponse.json(
        { error: 'Valor da NF deve ser maior que zero' },
        { status: 400 }
      )
    }

    // Verifica duplicidade por chave de acesso
    if (chave_acesso && chave_acesso.length === 44) {
      const { data: existente } = await supabase
        .from('notas_fiscais')
        .select('id, numero')
        .eq('chave_acesso', chave_acesso)
        .single()

      if (existente) {
        return NextResponse.json(
          { error: `NF com esta chave já cadastrada: Nº ${existente.numero}` },
          { status: 409 }
        )
      }
    }

    const { data: municipio } = await supabase
      .from('municipios')
      .select('id')
      .eq('slug', 'demo-sp')
      .single()

    const { data, error } = await supabase
      .from('notas_fiscais')
      .insert({
        municipio_id: municipio?.id,
        pessoa_id: pessoa_id || null,
        emitente_nome,
        emitente_cnpj: emitente_cnpj || null,
        tipo,
        numero,
        serie: serie || '1',
        chave_acesso: chave_acesso || null,
        data_emissao,
        data_entrada: body.data_entrada || new Date().toISOString().split('T')[0],
        valor_produtos: body.valor_produtos || 0,
        valor_servicos: body.valor_servicos || 0,
        valor_impostos: body.valor_impostos || 0,
        valor_total,
        descricao: descricao || null,
        natureza_operacao: body.natureza_operacao || null,
        empenho_id: empenho_id || null,
        contrato_id: contrato_id || null,
        status: 'ativa',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Registra no histórico do fornecedor
    if (pessoa_id) {
      await supabase.from('pessoa_historico').insert({
        pessoa_id,
        tipo_operacao: 'nota_fiscal',
        referencia_id: data.id,
        descricao: `NF-${tipo.toUpperCase()} Nº ${numero}`,
        valor: valor_total,
      })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
