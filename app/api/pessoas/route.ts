// app/api/pessoas/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { searchParams } = request.nextUrl
  const tipo = searchParams.get('tipo') // fornecedor, cliente, todos
  const busca = searchParams.get('busca')

  let query = supabase
    .from('vw_fornecedores')
    .select('*')
    .order('nome')

  if (tipo === 'fornecedor') query = query.eq('eh_fornecedor', true)
  if (tipo === 'cliente') query = query.eq('eh_cliente', true)
  if (busca) query = query.or(`nome.ilike.%${busca}%,cpf_cnpj.ilike.%${busca}%`)

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
    const { tipo, nome, cpf_cnpj, eh_fornecedor, eh_cliente } = body

    if (!tipo || !nome || !cpf_cnpj) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: tipo, nome, cpf_cnpj' },
        { status: 400 }
      )
    }

    // Verifica duplicidade
    const { data: existente } = await supabase
      .from('pessoas')
      .select('id, nome')
      .eq('cpf_cnpj', cpf_cnpj.replace(/\D/g, '').replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5'))
      .single()

    if (existente) {
      return NextResponse.json(
        { error: `CPF/CNPJ já cadastrado: ${existente.nome}` },
        { status: 409 }
      )
    }

    const { data: municipio } = await supabase
      .from('municipios')
      .select('id')
      .eq('slug', 'demo-sp')
      .single()

    const { data, error } = await supabase
      .from('pessoas')
      .insert({
        municipio_id: municipio?.id,
        tipo,
        nome,
        cpf_cnpj,
        nome_fantasia: body.nome_fantasia || null,
        email: body.email || null,
        telefone: body.telefone || null,
        whatsapp: body.whatsapp || null,
        cep: body.cep || null,
        logradouro: body.logradouro || null,
        numero: body.numero || null,
        bairro: body.bairro || null,
        cidade: body.cidade || null,
        uf: body.uf || null,
        inscricao_estadual: body.inscricao_estadual || null,
        inscricao_municipal: body.inscricao_municipal || null,
        eh_fornecedor: eh_fornecedor ?? true,
        eh_cliente: eh_cliente ?? false,
        eh_credor: body.eh_credor ?? false,
        situacao_receita: 'nao_verificado',
        observacoes: body.observacoes || null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
