# ServiceHub — Front-end

Central de serviços corporativa. Usuários fazem login e solicitam atendimentos entre setores da mesma empresa.

## Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- React Router
- Lucide React

## Pré-requisitos

- Node.js 18+
- API [servicehub](../servicehub) rodando em `http://localhost:3000`

## Configuração

```bash
npm install
cp .env.example .env
npm run dev
```

A aplicação abre em `http://localhost:5173`.

### Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | URL base da API. Em dev use `/api` (proxy Vite). Em produção, URL completa do backend. |

O proxy do Vite redireciona `/api` → `http://localhost:3000` para evitar CORS em desenvolvimento.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run lint` | ESLint |

## Credenciais de teste

| Campo | Valor |
|-------|-------|
| Usuário | `admin` |
| Senha | `admin123` |

## Rotas

| Rota | Acesso | Descrição |
|------|--------|-----------|
| `/login` | Público | Autenticação |
| `/` | Autenticado | Home |
| `/usuarios` | Global admin | CRUD de usuários |
| `/setores` | Global admin | CRUD de setores |
| `/setores/:sectorId/servicos` | Global admin | Serviços do setor (categorias de chamado) |

## Estrutura do projeto

```
src/
  components/
    ui/           # Button, Input, Modal, ToggleCard...
    layout/       # Sidebar, Header, AppLayout
    auth/         # PrivateRoute, AdminRoute
  features/
    auth/         # Login
    home/         # Home
    users/        # Usuários
    sectors/      # Setores
    sector-services/  # Serviços do setor
  contexts/       # Auth, Toast, DarkMode
  services/         # Chamadas à API
  types/
  lib/
docs/
  FRONTEND_GUIDELINES.md   # Guia completo de UI/UX e arquitetura
.cursor/rules/
  servicehub-guidelines.mdc  # Regras para o agente Cursor
```

## Documentação

- Guia front-end: [docs/FRONTEND_GUIDELINES.md](docs/FRONTEND_GUIDELINES.md)
- API Swagger: `http://localhost:3000/docs`

## Autenticação

- Login via JWT (`POST /api/auth/login`)
- Token salvo em `localStorage` (`access_token`)
- Rotas protegidas validam o token com `GET /api/auth/profile`
- Funcionalidades admin exigem `isGlobalAdmin: true` no token
