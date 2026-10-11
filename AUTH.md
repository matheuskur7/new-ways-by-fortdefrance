# Autenticação e organizações

O backend usa Better Auth com email/senha, o adapter Prisma/PostgreSQL e o plugin Organization. A integração usa o handler oficial para Node/Express (o adapter HTTP do NestJS), antes dos body parsers. O frontend usa o cliente React com `organizationClient`.

## Configuração local

No `backend/.env`, configure `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL=http://localhost:5000` e `FRONTEND_URL=http://localhost:3000`, além das variáveis S3 existentes. Gere um segredo com `openssl rand -base64 48`; não use o valor de exemplo. Consulte `backend/.env.example`.

No `frontend/.env.local`, configure `BACKEND_URL=http://localhost:5000`, conforme `frontend/.env.example`. O frontend encaminha `/api/auth/*` para o backend por rewrite: o navegador mantém cookies na origem do frontend. Não configure domínio compartilhado de cookies nesta integração.

Confira o banco apontado por `DATABASE_URL` antes de aplicar as migrações. Dentro de `backend/`, execute:

```bash
pnpm db:migrate
pnpm db:generate
pnpm start:dev
```

Dentro de `frontend/`, execute `pnpm dev`. Em produção, configure as URLs HTTPS reais. `BACKEND_URL` deve ser acessível pelo servidor Next.js e deve estar definido também no build, pois as rewrites são compiladas.

## Fluxo

- `/signup`: cadastro por email/senha (8 a 128 caracteres).
- `/login`: login e criação da sessão com cookie HttpOnly.
- `/organizations`: requer sessão; lista, cria e seleciona organizações.
- `/dashboard`: requer sessão e vínculo atual com a organização ativa.
- Botão Sair: invalida a sessão no backend e retorna ao login.

O Better Auth expõe os endpoints de autenticação e Organization em `/api/auth/*`. `GET /auth/context` retorna apenas o usuário e a organização ativa validada com seu papel; nunca retorna o token da sessão. A resposta usa `Cache-Control: private, no-store`.

As sessões têm validade de 12 horas. Uma consulta a uma sessão válida pode
renová-la por mais 12 horas somente quando passaram pelo menos 3 horas desde
a criação ou a última renovação; não há renovação por temporizador. Os endpoints
do Better Auth enviam o cookie renovado ao navegador. A consulta interna
`GET /auth/context` não repassa esse cookie, portanto a extensão da validade no
banco por essa consulta não estende, por si só, a validade do cookie no navegador.

Todas as rotas NestJS exigem sessão por padrão. `@Public()` libera rotas explicitamente (a mensagem inicial em `/` é pública). O handler Better Auth gerencia suas próprias rotas públicas e privadas. Mutações autenticadas nas rotas Nest exigem `Origin` igual a `FRONTEND_URL` ou `BETTER_AUTH_URL`; a proteção de origem/CSRF do Better Auth permanece ativa.

A autorização do frontend é centralizada em `requireSession` e `requireOrganization`, executadas no servidor, com chamadas sem cache persistente ao backend. Novas páginas protegidas devem chamar esses helpers perto do acesso aos dados, dentro de Suspense, conforme a configuração Cache Components do projeto. Server Actions e Route Handlers futuros devem fazer sua própria verificação; esconder botões ou verificar somente layouts não autoriza uma operação.

## Escopo e evolução

Os papéis padrão `owner`, `admin` e `member` do plugin controlam suas operações de organização. ABAC e permissões específicas dos recursos não estão implementados. O contexto centralizado de usuário, organização e papel permite acrescentar políticas posteriormente.

As imagens agora exigem autenticação, mas ainda são compartilhadas entre usuários autenticados: não receberam `organizationId`, filtros por tenant ou políticas de propriedade. Antes de expor recursos de domínio a organizações independentes, implemente esse isolamento no schema, repositories e chaves S3. O plugin Organization, sozinho, não faz isolamento das tabelas da aplicação.

Verificação de email, recuperação de senha, entrega de convites por email e telas de gestão de membros não fazem parte desta implementação básica. As tabelas de convites são incluídas para o plugin; configure a entrega de email antes de disponibilizar esse fluxo.

## Validação

Backend: `pnpm build`, `pnpm lint`, `pnpm test` e `pnpm exec prisma validate --config prisma7.config.ts`. Os testes de autenticação usam o adapter em memória e mocks; não exigem PostgreSQL ou S3. A integração real com PostgreSQL depende da aplicação das migrações.

Frontend: `pnpm lint`, `pnpm test` e `pnpm build`. Schemas de entrada e dados do contexto usam Zod, conforme `frontend/AGENTS.md`.

Referências: [Better Auth com Express](https://better-auth.com/docs/integrations/express), [adapter Prisma](https://better-auth.com/docs/adapters/prisma), [Organization](https://better-auth.com/docs/plugins/organization), [cliente Next.js](https://better-auth.com/docs/integrations/next).
