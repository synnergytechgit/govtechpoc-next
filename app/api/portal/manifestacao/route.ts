// app/api/portal/manifestacao/route.ts
// API pública — sem autenticação requerida

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Usa service role para inserção sem RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const body = await request.json()

    const {
      protocolo, tipo, descricao, anonimo,
      nome, email, telefone, sla_prazo, status
    } = body

    // Validações básicas
    if (!protocolo || !tipo || !descricao) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: protocolo, tipo, descricao' },
        { status: 400 }
      )
    }

    // Pega municipio_id do município demo (em produção viria da URL/subdomínio)
    const { data: municipio } = await supabase
      .from('municipios')
      .select('id')
      .eq('slug', 'demo-sp')
      .single()

    if (!municipio) {
      return NextResponse.json({ error: 'Município não encontrado' }, { status: 404 })
    }

    // Insere a manifestação
    const { data, error } = await supabase
      .from('manifestacoes')
      .insert({
        municipio_id: municipio.id,
        protocolo,
        tipo,
        descricao,
        anonimo: anonimo ?? false,
        nome: anonimo ? null : nome,
        email: anonimo ? null : email,
        status: status ?? 'aberta',
        sla_prazo,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao inserir manifestação:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Dispara notificação WhatsApp se telefone informado
    if (telefone && !anonimo) {
      await enviarNotificacaoWhatsApp({
        municipio_id: municipio.id,
        telefone,
        protocolo,
        tipo,
      })
    }

    return NextResponse.json({ protocolo, id: data.id }, { status: 201 })

  } catch (err) {
    console.error('Erro na API:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// Função auxiliar para disparar notificação
async function enviarNotificacaoWhatsApp({
  municipio_id, telefone, protocolo, tipo
}: {
  municipio_id: string
  telefone: string
  protocolo: string
  tipo: string
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const tipoLabel: Record<string, string> = {
      reclamacao: 'Reclamação', sugestao: 'Sugestão',
      elogio: 'Elogio', denuncia: 'Denúncia',
      lai: 'Pedido de Informação (LAI)', solicitacao: 'Solicitação',
    }

    const mensagem = `✅ *Manifestação registrada!*\n\n` +
      `Tipo: ${tipoLabel[tipo] ?? tipo}\n` +
      `Protocolo: *${protocolo}*\n\n` +
      `Acompanhe pelo portal da prefeitura informando seu protocolo.\n` +
      `Responderemos em breve.`

    // Registra notificação no banco
    await supabase.from('notificacoes').insert({
      municipio_id,
      tipo: 'whatsapp',
      destinatario: telefone,
      mensagem,
      referencia_tipo: 'manifestacao',
      status: 'pendente',
      provedor: 'meta',
    })

    // Chama a API de envio (async — não bloqueia a resposta)
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notificacoes/enviar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefone, mensagem, municipio_id }),
    }).catch(console.error)

  } catch (err) {
    console.error('Erro ao enviar notificação:', err)
  }
}
