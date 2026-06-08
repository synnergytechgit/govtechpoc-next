// app/api/webhook/whatsapp/route.ts
// Recebe mensagens inbound do cidadão via WhatsApp (Meta Cloud API)

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// GET — verificação do webhook pela Meta
export async function GET(request: NextRequest) {
  const mode      = request.nextUrl.searchParams.get('hub.mode')
  const token     = request.nextUrl.searchParams.get('hub.verify_token')
  const challenge = request.nextUrl.searchParams.get('hub.challenge')

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN ?? 'govtech_webhook_2025'

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('Webhook Meta verificado com sucesso')
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// POST — recebe mensagens do cidadão
export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const body = await request.json()

    // Valida assinatura Meta (produção)
    // TODO: implementar X-Hub-Signature-256 validation

    const entry = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value

    if (!value?.messages?.length) {
      return NextResponse.json({ status: 'ok' })
    }

    const message  = value.messages[0]
    const contact  = value.contacts?.[0]
    const telefone = message.from
    const texto    = message.text?.body ?? ''
    const nome     = contact?.profile?.name ?? 'Cidadão'

    console.log(`WhatsApp recebido de ${telefone}: ${texto}`)

    // Busca município demo (em produção: por número de WhatsApp configurado)
    const { data: municipio } = await supabase
      .from('municipios')
      .select('id')
      .eq('slug', 'demo-sp')
      .single()

    if (!municipio) {
      return NextResponse.json({ status: 'ok' })
    }

    // Verifica se é uma consulta de protocolo
    const protocoloMatch = texto.match(/OUV-\d{4}-\d{6}/i)

    if (protocoloMatch) {
      // Cidadão enviou um protocolo — consulta e responde
      const protocolo = protocoloMatch[0].toUpperCase()
      const { data: manifestacao } = await supabase
        .from('manifestacoes')
        .select('protocolo, status, tipo, sla_prazo')
        .eq('protocolo', protocolo)
        .single()

      const statusLabels: Record<string, string> = {
        aberta: '🔵 Aberta', em_analise: '🟡 Em Análise',
        respondida: '🟢 Respondida', encerrada: '⚫ Encerrada'
      }

      if (manifestacao) {
        const resposta = `📋 *Consulta de Protocolo*\n\n` +
          `Protocolo: *${manifestacao.protocolo}*\n` +
          `Status: ${statusLabels[manifestacao.status] ?? manifestacao.status}\n` +
          `${manifestacao.sla_prazo
            ? `Prazo: ${new Date(manifestacao.sla_prazo).toLocaleDateString('pt-BR')}`
            : ''}`

        await enviarResposta(telefone, resposta, municipio.id)
      } else {
        await enviarResposta(
          telefone,
          `❌ Protocolo *${protocolo}* não encontrado. Verifique o número e tente novamente.`,
          municipio.id
        )
      }

    } else if (texto.toLowerCase().includes('protocolo') || texto === '2') {
      // Cidadão quer consultar — pede o protocolo
      await enviarResposta(
        telefone,
        `🔍 Para consultar sua manifestação, envie o número do protocolo.\n\nFormato: *OUV-2025-XXXXXX*`,
        municipio.id
      )

    } else {
      // Mensagem genérica — cria manifestação automaticamente
      const protocolo = `OUV-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000) + 100000}`

      await supabase.from('manifestacoes').insert({
        municipio_id: municipio.id,
        protocolo,
        tipo: 'solicitacao',
        descricao: texto,
        anonimo: false,
        nome,
        status: 'aberta',
        sla_prazo: calcularSLA(15),
      })

      await enviarResposta(
        telefone,
        `✅ *Manifestação registrada!*\n\n` +
        `Olá, *${nome}*!\n\n` +
        `Recebemos sua mensagem e criamos uma solicitação.\n\n` +
        `🔖 Protocolo: *${protocolo}*\n\n` +
        `Responderemos em até 15 dias úteis.\n` +
        `Para consultar o status, envie o número do protocolo.`,
        municipio.id
      )
    }

    return NextResponse.json({ status: 'ok' })

  } catch (err) {
    console.error('Erro no webhook WhatsApp:', err)
    return NextResponse.json({ status: 'ok' }) // Sempre retorna 200 para a Meta
  }
}

async function enviarResposta(
  telefone: string,
  mensagem: string,
  municipio_id: string
) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notificacoes/enviar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefone, mensagem, municipio_id }),
    })
  } catch (err) {
    console.error('Erro ao enviar resposta WhatsApp:', err)
  }
}

function calcularSLA(diasUteis: number): string {
  const data = new Date()
  let dias = 0
  while (dias < diasUteis) {
    data.setDate(data.getDate() + 1)
    if (data.getDay() !== 0 && data.getDay() !== 6) dias++
  }
  return data.toISOString()
}
