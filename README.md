# Live Pulse

Aplicação web para fazer votações em direto num evento, como uma aula ou uma palestra. Tem duas partes:

- **Público** (`/polls`): vê as votações, vota e, quando a votação fecha, vê os resultados.
- **Anfitrião** (`/host`): cria votações, abre-as e fecha-as, e acompanha os resultados em direto.

Feito com **Django** (backend), **React + TypeScript** (frontend) e **SQLite** (base de dados).

---

## Como correr

### Com Docker (um comando)

```bash
cd backend
docker compose up --build
```

Depois abre **http://localhost:5173**.

### Sem Docker

Precisa de Python 3.11+ e Node 20+. São precisos dois terminais.

**Terminal 1: backend**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # no Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

**Terminal 2: frontend**
```bash
cd frontend
npm install
npm run dev
```

Depois abre **http://localhost:5173**.

### Testes

```bash
cd backend
python manage.py test
```

---

## Níveis completos

| Nível | | O que fiz |
|---|---|---|
| **1 – Essencial** | ✅ | Lista de votações para o público (sem rascunhos), votar, resultados só depois de fechar, criar votações com 2 a 5 opções, mudar o estado, ver votos por opção e o total |
| **2 – Votação justa** | ✅ | Um voto por pessoa, o backend recusa votos em votações que não estão abertas, mensagens de erro claras, percentagens e gráfico de barras |
| **3 – Resultados em direto** | ✅ | O painel do anfitrião atualiza-se sozinho quando chegam votos. A página do público também muda sozinha para os resultados quando a votação fecha, e o anfitrião pode deixar o público ver os resultados em direto |
| **Extras** | ✅ | Versão para telemóvel, Docker, testes automáticos, código QR para entrar na votação e temporizador que fecha a votação sozinha |

---

## Decisões técnicas

### Tecnologias

- **Django + Django REST Framework:** é a stack recomendada e já traz quase tudo pronto (base de dados, validação de dados, página de administração).
- **SQLite:** não precisa de instalação e chega para uma aplicação deste tamanho.
- **React + TypeScript + Vite:** o TypeScript avisa-me de erros antes de correr o código, por exemplo se usar um campo que a API não devolve.
- **Poucas bibliotecas extra:** só React Router (páginas), qrcode.react (código QR) e Sass (estilos). Para falar com o backend uso `fetch`, porque a aplicação é pequena e não precisava de Redux nem de TanStack Query.

### Organização do código

**Backend:** dividi o Django em duas apps:
- `polls`: votações, opções, resultados e atualizações em direto;
- `votes`: os votos.

Em cada app, cada ficheiro tem uma função: `models.py` (tabelas), `urls.py` (endereços), `views.py` (recebe os pedidos), `serializers.py` (valida os dados), `services.py` (as ações, como criar votação ou votar) e `tests/`.

**Frontend:** cada página e cada componente tem 3 ficheiros:

```
PollCard/
├── PollCard.tsx    # o que aparece no ecrã
├── PollCard.ts     # a lógica
└── PollCard.scss   # os estilos
```

As cores e os tamanhos estão em variáveis partilhadas (`src/styles/`), e os pedidos ao backend estão todos em `src/api/`.

### Base de dados

Três tabelas:

```
Poll (votação)    pergunta, estado, data de criação
 ├── Option       texto, a que votação pertence
 └── Vote         opção escolhida, código do votante, data
```

- O estado só pode avançar: **Rascunho → Aberta → Fechada**.
- Os resultados não são guardados. São calculados contando os votos, por isso estão sempre certos.

### API

| Pedido | O que faz |
|---|---|
| `GET /api/polls/` | Lista as votações abertas e fechadas (público) |
| `GET /api/polls/{id}/` | Mostra uma votação. Os resultados só aparecem depois de fechar |
| `POST /api/polls/{id}/votes/` | Regista um voto |
| `GET /api/host/polls/` | Lista todas as votações, incluindo rascunhos (anfitrião) |
| `POST /api/host/polls/` | Cria uma votação |
| `PATCH /api/host/polls/{id}/` | Muda o estado de uma votação |

Separei os endereços do público (`/api/polls/`) dos do anfitrião (`/api/host/polls/`). Assim é o backend que garante que o público nunca recebe rascunhos nem resultados de votações abertas.

### Tempo real: porque escolhi Server-Sent Events (SSE)

Os votos chegam ao servidor por pedidos normais. A única coisa que precisa de ser "em direto" é o servidor avisar o browser quando há votos novos, ou seja, uma comunicação **num só sentido**. O SSE serve exatamente para isso, funciona com o próprio browser e não precisa de bibliotecas extra.

Os WebSockets comunicam nos dois sentidos, o que aqui não era preciso, e em Django exigem mais configuração. O polling (o browser perguntar de x em x segundos) também funcionava, mas fazia muitos pedidos sem necessidade.

**Limitação:** a minha versão verifica a base de dados a cada segundo para cada pessoa ligada. Chega para uma sala de aula, mas para milhares de pessoas teria de ser feito de outra forma.

### Um voto por pessoa

Quando alguém abre o site, o browser gera um código aleatório e guarda-o. Esse código é enviado com o voto, e a base de dados não aceita dois votos com o mesmo código na mesma votação.

**Como pode ser contornado:** abrindo uma janela anónima, usando outro browser ou outro dispositivo, ou apagando os dados do site. Para evitar isto seria preciso pedir login a quem vota, o que não fazia sentido para um evento rápido.

### Outras notas

- Não há login, como o enunciado permite: o painel do anfitrião é só uma página separada (`/host`).
- Enquanto a votação está aberta, o público não vê os resultados, a não ser que o anfitrião ative essa opção.
- O temporizador guarda a hora a que a votação deve fechar. Quando alguém consulta as votações depois dessa hora, o backend fecha-a.

---

## O que melhoraria com mais tempo

- **Login para o anfitrião:** neste momento qualquer pessoa que saiba o endereço `/host` consegue gerir as votações.
- **Testes no frontend:** só o backend tem testes automáticos.
- **Editar e apagar votações** em rascunho.
- **Tempo real para muitas pessoas:** avisar os browsers no momento em que chega um voto, em vez de verificar a base de dados a cada segundo.
