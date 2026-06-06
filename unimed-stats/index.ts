import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'

/**
 * Azure Function — HTTP Trigger
 * Calcula e retorna estatísticas do sistema Unimed
 * Pode receber agendamentos e notificações via body para enriquecer os dados,
 * ou retornar estatísticas simuladas standalone.
 */
export async function unimedStats(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('unimedStats function triggered')

  try {
    // Lê body opcional (BFF pode enviar dados para enriquecimento)
    let bodyData: any = {}
    try {
      const text = await request.text()
      if (text) bodyData = JSON.parse(text)
    } catch { /* body vazio — usa dados simulados */ }

    const agendamentos: any[] = bodyData.agendamentos ?? gerarAgendamentosSimulados()
    const notificacoes: any[] = bodyData.notificacoes ?? gerarNotificacoesSimuladas()

    // ── Cálculos ─────────────────────────────────────────────────────────────
    const totalAgendamentos  = agendamentos.length
    const totalNotificacoes  = notificacoes.length

    const confirmados  = agendamentos.filter(a => a.status === 'CONFIRMADO').length
    const cancelados   = agendamentos.filter(a => a.status === 'CANCELADO').length
    const pendentes    = agendamentos.filter(a => a.status === 'PENDENTE').length
    const concluidos   = agendamentos.filter(a => a.status === 'CONCLUIDO').length

    const taxaConfirmacao = totalAgendamentos > 0
      ? `${((confirmados / totalAgendamentos) * 100).toFixed(1)}%`
      : '0%'

    const notifEnviadas = notificacoes.filter(n => n.status === 'ENVIADA' || n.status === 'LIDA').length
    const taxaEntrega   = totalNotificacoes > 0
      ? `${((notifEnviadas / totalNotificacoes) * 100).toFixed(1)}%`
      : '0%'

    const porTipo: Record<string, number> = {}
    agendamentos.forEach(a => { porTipo[a.tipo] = (porTipo[a.tipo] ?? 0) + 1 })

    const porCanal: Record<string, number> = {}
    notificacoes.forEach(n => { porCanal[n.canal] = (porCanal[n.canal] ?? 0) + 1 })

    const porEspecialidade: Record<string, number> = {}
    agendamentos.forEach(a => {
      if (a.especialidade) porEspecialidade[a.especialidade] = (porEspecialidade[a.especialidade] ?? 0) + 1
    })

    const response = {
      source:           'azure-function:unimed-stats',
      computedAt:       new Date().toISOString(),
      totalAgendamentos,
      totalNotificacoes,
      agendamentos: {
        confirmados,
        cancelados,
        pendentes,
        concluidos,
        taxaConfirmacao,
      },
      notificacoes: {
        enviadas:   notifEnviadas,
        pendentes:  notificacoes.filter(n => n.status === 'PENDENTE').length,
        falhas:     notificacoes.filter(n => n.status === 'FALHOU').length,
        taxaEntrega,
      },
      agendamentosPorTipo:        porTipo,
      agendamentosPorEspecialidade: porEspecialidade,
      notificacoesPorCanal:       porCanal,
      sla: {
        disponibilidade: '99.7%',
        tempoMedioResposta: '1.2s',
        uptime: '30 dias',
      },
    }

    return {
      status:  200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body:    JSON.stringify(response),
    }
  } catch (error: any) {
    context.error('Erro na function:', error)
    return {
      status: 500,
      body:   JSON.stringify({ error: 'Erro interno na Azure Function', detail: error.message }),
    }
  }
}

// ── Dados simulados (usados quando a function roda standalone) ────────────────
function gerarAgendamentosSimulados() {
  const tipos       = ['CONSULTA', 'EXAME', 'PROCEDIMENTO']
  const status      = ['PENDENTE', 'CONFIRMADO', 'CANCELADO', 'CONCLUIDO']
  const especialidades = ['Cardiologia', 'Ortopedia', 'Clínico Geral', 'Dermatologia', 'Pediatria']

  return Array.from({ length: 42 }, (_, i) => ({
    id:           `ag-${i + 1}`,
    tipo:         tipos[i % 3],
    status:       status[i % 4],
    especialidade:especialidades[i % 5],
  }))
}

function gerarNotificacoesSimuladas() {
  const canais  = ['EMAIL', 'SMS', 'PUSH']
  const status  = ['PENDENTE', 'ENVIADA', 'FALHOU', 'LIDA']

  return Array.from({ length: 128 }, (_, i) => ({
    id:    i + 1,
    canal: canais[i % 3],
    status:status[i % 4],
  }))
}

// ── Registrar a function ──────────────────────────────────────────────────────
app.http('unimed-stats', {
  methods:   ['GET', 'POST'],
  authLevel: 'anonymous',
  handler:   unimedStats,
})
