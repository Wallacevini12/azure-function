# Azure Function — unimed-stats | Unimed

> HTTP Trigger que calcula e enriquece estatísticas do sistema Unimed  
> **Stack:** Azure Functions v4 · TypeScript · Node.js 20

**Equipe:** Gabriel Girotto | Giovani Tortatto | Lucas Cunha | Matheus Garozi | Wallace Vinicius

---

## O que faz

Recebe dados opcionais via `POST body` (agendamentos + notificações) e retorna estatísticas calculadas:

- Taxa de confirmação de agendamentos
- Taxa de entrega de notificações
- Distribuição por tipo, canal e especialidade
- Indicadores de SLA

Quando chamada sem body (`GET`), retorna estatísticas com dados simulados.

---

## Endpoint

```
GET/POST https://<sua-function>.azurewebsites.net/api/unimed-stats
```

### Response

```json
{
  "source": "azure-function:unimed-stats",
  "computedAt": "2026-05-10T09:00:00.000Z",
  "totalAgendamentos": 42,
  "totalNotificacoes": 128,
  "agendamentos": {
    "confirmados": 33,
    "cancelados": 5,
    "pendentes": 3,
    "concluidos": 1,
    "taxaConfirmacao": "78.6%"
  },
  "notificacoes": {
    "enviadas": 120,
    "pendentes": 5,
    "falhas": 3,
    "taxaEntrega": "93.8%"
  },
  "agendamentosPorTipo": { "CONSULTA": 28, "EXAME": 10, "PROCEDIMENTO": 4 },
  "notificacoesPorCanal": { "EMAIL": 60, "SMS": 48, "PUSH": 20 },
  "sla": {
    "disponibilidade": "99.7%",
    "tempoMedioResposta": "1.2s"
  }
}
```

---

## Como rodar localmente

### Pré-requisito

```bash
npm install -g azure-functions-core-tools@4 --unsafe-perm true
```

### Rodar

```bash
npm install
npm start
# ou: func start
```

Acesse: `http://localhost:7071/api/unimed-stats`

---

## Deploy no Azure

1. Crie uma Function App no Azure Portal (Node.js 20, Linux)
2. Configure a variável `FUNCTIONS_WORKER_RUNTIME=node`
3. Faça deploy via VS Code (extensão Azure Functions) ou Azure CLI:

```bash
func azure functionapp publish <nome-da-sua-function-app>
```
