# ServiceHub — Guia Front-end

## Produto

Central de serviços corporativa onde usuários logam e fazem solicitações entre setores da mesma empresa.

- **Idioma:** pt-BR
- **Tom:** formal, profissional e intuitivo
- **Primeiro módulo:** Usuários (CRUD admin)
- **Fluxos adicionais:** definidos incrementalmente

---

## Design System

### Cores (70-20-10)

| Token | Hex | Papel |
|-------|-----|-------|
| `surface` | `#ffffff` | 70% — fundos, áreas de conteúdo |
| `secondary` | `#e8f0fe` | 20% — cards, seções, destaques |
| `primary` | `#1e3a5f` | 10% — sidebar, títulos, identidade |
| `accent` | `#2563eb` | Botões de aceitação/confirmação |
| `danger` | `#dc2626` | Exclusão e ações destrutivas |
| `text` | `#1a1a2e` | Texto principal |
| `text-muted` | `#64748b` | Labels, placeholders, hints |
| `border` | `#e2e8f0` | Bordas |

### Tipografia

- **Fonte:** Inter (Google Fonts)
- **Tamanhos:** 12 / 14 / 16 / 18 / 20 / 24px
- **Pesos:** 400 (corpo), 500 (labels), 600 (títulos)

### Espaçamento

- **Grid:** 8px
- **Botões/inputs:** `rounded-lg` (8px)
- **Cards/modais:** `rounded-xl` (12px)
- **Seções:** `p-4` mobile · `p-6` desktop

### Semântica de ações

- Azul (`accent`) → salvar, confirmar, prosseguir
- Vermelho (`danger`) → excluir, remover

---

## Layout

- Mobile-first, totalmente responsivo
- Pós-login: sidebar esquerda + dados do usuário no canto superior direito
- Mobile: sidebar vira drawer com overlay

```
┌──────────┬─────────────────────────────────┐
│          │  Header          [👤 Usuário]  │
│ Sidebar  ├─────────────────────────────────┤
│          │                                 │
│  Nav     │         Conteúdo                │
│          │                                 │
└──────────┴─────────────────────────────────┘
```

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | React 19 + TypeScript |
| Build | Vite |
| CSS | Tailwind CSS |
| Rotas | React Router |
| Ícones | Lucide React |
| HTTP | Fetch nativo |
| Auth | Context + localStorage |
| Forms | Validação manual (sem lib obrigatória) |

---

## API

| Item | Valor |
|------|-------|
| Base URL | `http://localhost:3000/api` |
| Swagger | `http://localhost:3000/docs` |
| Auth | JWT Bearer |
| Token storage | `localStorage` → `access_token` |

### Endpoints iniciais

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/auth/login` | Público | Login (`username`, `password`) |
| GET | `/auth/profile` | Bearer | Perfil do usuário logado |
| GET | `/users` | Admin | Listar (paginado) |
| POST | `/users` | Admin | Criar |
| GET | `/users/:id` | Admin | Buscar |
| PATCH | `/users/:id` | Admin | Atualizar |
| DELETE | `/users/:id` | Admin | Desativar |

### Paginação (backend)

```json
{
  "data": [],
  "meta": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 }
}
```

### Erros (backend)

```json
{
  "statusCode": 400,
  "error": "Validation Error",
  "message": "Dados inválidos",
  "fields": {
    "password": ["password should not be empty"]
  }
}
```

---

## Estratégia de erros (front)

| Situação | Ação |
|----------|------|
| `fields.campo` existe no form | Mensagem vermelha abaixo do input |
| `fields.campo` não existe no form | Toast com a mensagem |
| 409 com `fields` (email/username) | Erro inline no campo |
| 401 | Toast + redirect para `/login` |
| 403 | Toast "Sem permissão" |
| 404 | Toast com `message` |
| 500 / rede | Toast genérico |
| Validação client-side | Antes do submit — required, email, min 6 chars |

### Fluxo

```
Submit → validação client → API
  ├─ 200/201 → sucesso (toast + redirect/atualiza)
  └─ erro
       ├─ fields? → mapear para inputs conhecidos
       └─ resto → toast com message
```

---

## Regras de UI

- Botões sempre arredondados
- Inputs sempre estilizados
- Campos obrigatórios identificados com `*` vermelho no label
- Exclusão sempre com modal de confirmação
- Formulários com proteção contra double-submit
- Interface intuitiva: labels claros, feedback imediato, navegação óbvia
- Componentização e reutilização são prioridade

---

## Estrutura de pastas

```
src/
  components/
    ui/          Button, Input, Modal, Toast...
    layout/      Sidebar, Header, AppLayout
  features/
    auth/        Login
    users/       CRUD admin
  contexts/      AuthContext
  hooks/         useAuth, useApiError
  services/      api.ts, authService, userService
  types/         api.types.ts
  lib/           parseApiError, validators
```

---

## Credenciais de teste

- **Username:** `admin`
- **Password:** `admin123`

---

## Pendências automáticas (resolvidas na implementação)

- [ ] Proxy Vite para CORS em dev
- [ ] `.env` com `VITE_API_URL`
- [ ] Rotas protegidas (`PrivateRoute`)
- [ ] Redirect 401 → login
- [x] Logo: retângulo placeholder (sem marca por enquanto)
