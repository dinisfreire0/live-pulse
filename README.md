# Live Pulse — votações em tempo real

Aplicação full-stack para votações em direto num evento. Tem duas interfaces:

- **Público** (`/polls`): vê as votações abertas e fechadas, vota e vê os resultados quando a votação fecha.
- **Anfitrião** (`/host`): cria votações, muda o estado (Rascunho → Aberta → Fechada) e acompanha os resultados em direto.

**Stack:** Django 5 + Django REST Framework + SQLite no backend, React 19 + TypeScript + Vite + SCSS no frontend, Server-Sent Events para o tempo real.

---

## Como correr

### Opção A: Docker (um único comando)

```bash
docker compose up --build
```

Depois abre **http://localhost:5173**. A base de dados SQLite fica num volume do Docker.

### Opção B: localmente

Requisitos: Python 3.11+ e Node 20+.

```bash
# Terminal 1: backend (http://127.0.0.1:8000)
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

```bash
# Terminal 2: frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
```

Abre **http://localhost:5173**. O Vite reencaminha `/api` para o Django, por isso não é preciso configurar CORS.

### Testes

```bash
cd backend && python manage.py test polls     # 15 testes da API
cd frontend && npm run lint && npm run build  # lint + verificação de tipos
```

### Votar a partir do telemóvel

O servidor do Vite também fica disponível na rede local (o endereço "Network" que aparece no terminal). Se o anfitrião abrir o painel em `localhost`, o código QR aponta para `localhost`, que não funciona no telemóvel. Para evitar isso, abre o painel pelo IP da rede, ou define `VITE_PUBLIC_BASE_URL=http://<ip>:5173` em `frontend/.env.local`.

---

## Níveis completos

| Nível | Estado | Notas |
|---|---|---|
| **1 — Essencial** | ✅ | Lista pública (sem rascunhos), votar com feedback, resultados só depois de fechar, criar votações (2 a 5 opções), mudar o estado, resultados com contagens e total, botões de atualizar |
| **2 — Votação justa** | ✅ | Um voto por pessoa, o backend recusa votos em votações não abertas, validação com mensagens claras, percentagens e gráfico de barras |
| **3 — Resultados em direto** | ✅ | O painel do anfitrião atualiza-se sozinho a cada voto (SSE). **Extra:** a página do público passa automaticamente para os resultados quando a votação fecha, e o anfitrião pode ligar "mostrar resultados em direto ao público" em cada votação |
| **Extras** | ✅ | Layout responsivo / mobile, Docker Compose, testes automáticos no backend, código QR + copiar link, temporizador que fecha a votação automaticamente |

Ficou de fora, de propósito: votações de escolha múltipla e nuvem de palavras. Mudavam o modelo de dados e o enunciado pede para manter o âmbito pequeno.

---

## Decisões técnicas

### Porquê esta stack

- **Django + DRF:** é a stack recomendada. O ORM, as migrações e o admin vêm incluídos. Os serializers do DRF tratam da validação e das mensagens de erro de forma declarativa, e as views ficam curtas.
- **SQLite:** zero configuração e suficiente para um evento. Mudar para PostgreSQL é só mudar `DATABASES`.
- **React + TypeScript + Vite:** os tipos em [`frontend/src/api/types.ts`](frontend/src/api/types.ts) descrevem exatamente o contrato da API, por isso uma mudança no backend aparece como erro de compilação. O Vite dá um servidor de desenvolvimento rápido e o proxy para a API.
- **Poucas dependências:** só `react-router-dom` (rotas) e `qrcode.react` (QR). Os dados são carregados com `fetch` e hooks próprios. Para dois ecrãs com pouco estado partilhado, TanStack Query ou Redux seriam engenharia a mais.
- **SCSS simples:** cada componente tem a sua folha de estilos (BEM) e partilha tokens de [`styles/_tokens.scss`](frontend/src/styles/_tokens.scss). Não usei biblioteca de UI: a interface é pequena e assim o CSS fica todo explícito.

### Modelo de dados

```
Poll (question, status, show_live_results, closes_at, created_at, updated_at)
 ├── Option (poll → Poll, text, position)           UNIQUE(poll, position)
 └── Vote   (poll → Poll, option → Option,
             voter_token, created_at)               UNIQUE(poll, voter_token)
```

- `status` é um `TextChoices` (`draft` / `open` / `closed`). As transições permitidas estão definidas no modelo (`Poll.ALLOWED_TRANSITIONS`) e só andam para a frente.
- Os resultados **não são guardados**: são calculados com `COUNT` sobre `Vote`, por isso nunca ficam dessincronizados.
- **Onde fica o "um voto por pessoa":** na tabela `Vote`, com a restrição `UNIQUE(poll, voter_token)`. Por isso `Vote` guarda também `poll`, embora isso se possa deduzir a partir de `option`. É uma desnormalização deliberada: permite à **base de dados** garantir a regra, mesmo com dois pedidos em simultâneo (o `IntegrityError` passa a `409`). O serviço confirma sempre que a opção pertence à votação.

### API REST

O público e o anfitrião têm namespaces separados. Assim a regra "o público nunca vê rascunhos nem resultados de votações abertas" fica isolada num só sítio, em vez de espalhada por condições.

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/polls/` | Votações abertas e fechadas |
| GET | `/api/polls/{id}/` | Detalhe. `results` vem a `null` enquanto está aberta (salvo "em direto"). `has_voted` vem do header `X-Voter-Token` |
| POST | `/api/polls/{id}/votes/` | `{option_id, voter_token}` → `201`. Pode dar `400` (opção inválida), `404` (rascunho) ou `409` (já votou / não está aberta) |
| GET | `/api/polls/{id}/results/` | `403` enquanto os resultados não forem públicos |
| GET | `/api/polls/{id}/stream/` | SSE para o público |
| GET / POST | `/api/host/polls/` | Listar todas (com `total_votes`) / criar `{question, options[]}` |
| GET / PATCH | `/api/host/polls/{id}/` | Detalhe com resultados / `{status?, show_live_results?, duration_seconds?}` |
| GET | `/api/host/polls/{id}/results/` | Resultados a qualquer momento |
| GET | `/api/host/polls/{id}/stream/` | SSE para o anfitrião |

Os erros seguem o formato do DRF: `{"detail": "..."}` ou `{"campo": ["mensagem"]}`, com mensagens em português.

### Tempo real: porquê Server-Sent Events

- **Direção dos dados:** os votos chegam por um `POST` normal. O que precisa de tempo real vai só **do servidor para o browser**, e é exatamente para isso que serve o SSE. WebSockets são bidirecionais, o que aqui não é necessário. Além disso, em Django obrigam a usar Channels, ASGI e normalmente Redis.
- **Complexidade:** do lado do cliente basta o `EventSource` nativo, que volta a ligar-se sozinho ([`useEventSource.ts`](frontend/src/lib/useEventSource.ts)). Do lado do servidor é um `StreamingHttpResponse` ([`polls/sse.py`](backend/polls/sse.py)).
- **Como funciona:** cada stream verifica a votação uma vez por segundo, com uma assinatura barata `(status, show_live_results, closes_at, nº de votos)`, e só envia um snapshot completo quando algo muda. Envia um heartbeat a cada 15 s. As ligações fecham ao fim de 5 min e o browser volta a ligar-se de forma transparente.
- **Escalabilidade (o compromisso):** cada ligação aberta ocupa uma thread do servidor e faz uma query leve por segundo. Para uma sala com dezenas ou centenas de pessoas isto chega perfeitamente. Para milhares, o passo seguinte seria um servidor ASGI com views assíncronas e pub/sub (Redis / `LISTEN/NOTIFY` do PostgreSQL), que notifica no momento do voto em vez de verificar periodicamente.
- Só há streams enquanto a votação está **aberta**: em rascunho ou fechada, nada muda.

### Um voto por pessoa: como pode ser contornado

Cada browser gera um token aleatório guardado em `localStorage` ([`voterToken.ts`](frontend/src/lib/voterToken.ts)). A base de dados aceita um voto por token em cada votação. Pode ser contornado com:

- uma janela anónima, outro browser ou outro dispositivo;
- apagar o `localStorage`;
- chamar a API diretamente com tokens inventados.

Isto é aceitável num evento informal, porque não exige login. Para uma regra mais forte seria preciso identidade real (login / magic link por email), códigos de uso único entregues a cada participante, ou limitação por IP (que falha em redes partilhadas como a de uma sala de aula).

### Temporizador

Ao abrir a votação (ou mais tarde), o anfitrião pode escolher uma duração. O backend guarda `closes_at`. O fecho é **preguiçoso**: sempre que uma votação é lida (listas, detalhe, votos, streams), `Poll.objects.close_expired()` fecha as que já expiraram. Assim não é preciso um scheduler nem um worker à parte. Como os streams leem a votação a cada segundo, quem está a ver passa para os resultados no momento certo.

### Estrutura do frontend

Cada componente e cada página tem **3 ficheiros** com responsabilidades separadas:

```
ComponentName/
├── ComponentName.tsx   # só a apresentação (JSX)
├── ComponentName.ts    # lógica: hooks, estado, helpers, constantes
└── ComponentName.scss  # estilos do componente
```

```
frontend/src/
├── App/            # rotas, caminhos (paths) e estilos globais
├── api/            # cliente HTTP, endpoints e tipos da API
├── lib/            # hooks partilhados (useResource, useEventSource), token, formatação
├── styles/         # tokens SCSS partilhados
├── components/     # Layout, PollCard, PollForm, ResultsChart, StatusBadge, Feedback,
│                   # Countdown, LiveIndicator, QrShare, TimerSelect
└── pages/          # PublicPollList, PublicPollDetail, HostDashboard,
                    # HostPollCreate, HostPollDetail, NotFound
```

Os imports usam a extensão explícita (`./X.ts` / `./X.tsx`) porque os dois ficheiros têm o mesmo nome base.

A validação do formulário repete as regras do backend, para dar feedback imediato. Mesmo assim, o backend continua a ser a fonte de verdade e os erros que devolve são mostrados no campo certo.

### Outras notas

- **Sem autenticação**, como diz o enunciado: o painel do anfitrião é só uma rota separada (`/host`).
- O público só vê os resultados de uma votação aberta se o anfitrião ligar "mostrar em direto". Por omissão ficam escondidos, para não influenciar os votos.
- Fechar uma votação pede confirmação, porque não se pode desfazer.
- Acessibilidade básica: labels, `role="alert"`/`status` no feedback, `progressbar` nas barras e `prefers-reduced-motion`.

---

## O que melhoraria com mais tempo

- **Autenticação do anfitrião.** Hoje qualquer pessoa que conheça `/host` pode gerir as votações.
- **Tempo real escalável:** views assíncronas + pub/sub em vez de cada stream consultar a base de dados.
- **Testes de frontend** (Vitest + Testing Library para os hooks, Playwright para o fluxo completo). O fluxo completo foi validado manualmente num browser headless.
- Editar e apagar votações em rascunho, e duplicar votações.
- Escolha múltipla e nuvem de palavras.
- Configuração de produção: `gunicorn` com workers de threads, servir o build estático do Vite e `DEBUG=0` com uma `SECRET_KEY` verdadeira (já se podem definir por variáveis de ambiente).
