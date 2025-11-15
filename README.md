# Challenge Backend

API Node.js/TypeScript seguindo o padrão MVC, usando Express + Prisma para persistir dados em um PostgreSQL do Supabase.

## Pré-requisitos

- Node.js 18+
- Conta Supabase com banco PostgreSQL provisionado

## Configuração

1. Copie o arquivo de exemplo:
   ```bash
   cp example.env .env
   ```
2. Cole no `.env` a string `DATABASE_URL` gerada no Supabase (`Project Settings` → `Database` → `Connection string` → `URI`).
3. Ajuste a porta (`PORT`) se necessário.

## Scripts

- `npm run dev`: inicia o servidor em modo desenvolvimento com `ts-node`.
- `npm run build`: gera a saída transpilada em `dist`.
- `npm start`: executa a build.
- `npm run prisma:generate`: regenera o cliente Prisma.
- `npm run prisma:migrate`: aplica novas migrações (exige banco acessível).
- `npm run lint`: checagem de tipos.

## Banco de dados

1. Configure o Supabase (ou outro PostgreSQL) e atualize o `.env`.
2. Gere/atualize as migrações:
   ```bash
   npm run prisma:migrate --name init
   ```

## Endpoints principais (`/api`)

- `GET /tasks`
- `GET /tasks/:id`
- `POST /tasks`
- `PUT /tasks/:id`
- `DELETE /tasks/:id`

Todos retornam JSON; veja o controlador em `src/controllers/taskController.ts` para detalhes.

