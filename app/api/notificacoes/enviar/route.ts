// app/api/notificacoes/enviar/route.ts
// Envio de notificações WhatsApp via Meta Cloud API

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// ============================================================
// META CLOUD API — Configuração
// Variáveis de ambiente necessárias:
// META_WHATSAPP_TOKEN=seu_token_aqui
// META_WHATSAPP_PHONE_ID=seu_phone_number_id
// ============================================================

async function enviarViaMetaCloudAPI(
  telefone: string,
  mensagem: string
): Promise<{ sucesso: boolean; id?: string; erro?: string }> {
  const token   = process.env.META_WHATSAPP_TOKEN
  const phoneId = process.env.META_WHATSAPP_PHONE_ID

  if (!token || !phoneId) {
    return { sucesso: false, erro: 'Meta WhatsApp não configurado' }
  }

  // Formata número: remove tudo exceto dígitos, adiciona 55 se BR
  const numero = telefone.replace(/\D/g, '')
  const numeroFormatado = numero.startsWith('55') ? numero : `55${numero}`

  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: numeroFormatado,
          type: 'text',
          text: { body: mensagem, preview_url: false },
        }),
      }
    )

    const data = await res.json()

    if (res.ok && data.messages?.[0]?.id) {
      return { sucesso: true, id: data.messages[0].id }
    }

    return {
      sucesso: false,
      erro: data.error?.message ?? 'Erro desconhecido da Meta API'
    }

  } catch (err: any) {
    return { sucesso: false, erro: err.message }
  }
}

// ============================================================
// POST /api/notificacoes/enviar
// ============================================================
export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const { telefone, mensagem, municipio_id, referencia_id, referencia_tipo } =
      await request.json()

    if (!telefone || !mensagem) {
      return NextResponse.json(
        { error: 'telefone e mensagem são obrigatórios' },
        { status: 400 }
      )
    }

    // Tenta enviar via Meta Cloud API
    const resultado = await enviarViaMetaCloudAPI(telefone, mensagem)

    // Registra no banco
    await supabase.from('notificacoes').insert({
      municipio_id,
      tipo: 'whatsapp',
      destinatario: telefone,
      mensagem,
      referencia_tipo,
      referencia_id,
      status: resultado.sucesso ? 'enviado' : 'falhou',
      provedor: 'meta',
      provedor_id: resultado.id ?? null,
      erro: resultado.erro ?? null,
      enviado_em: resultado.sucesso ? new Date().toISOString() : null,
    })

    if (resultado.sucesso) {
      return NextResponse.json({ sucesso: true, id: resultado.id })
    }

    return NextResponse.json(
      { sucesso: false, erro: resultado.erro },
      { status: 500 }
    )

  } catch (err: any) {
    console.error('Erro no envio:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ============================================================
// GET /api/notificacoes/enviar
// Verificação do webhook Meta (necessária no setup inicial)
// ============================================================
export async function GET(request: NextRequest) {
  const mode      = request.nextUrl.searchParams.get('hub.mode')
  const token     = request.nextUrl.searchParams.get('hub.verify_token')
  const challenge = request.nextUrl.searchParams.get('hub.challenge')

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN ?? 'govtech_webhook_2025'

  if (mode === 'subscribe' && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
}
