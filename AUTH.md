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

- `/cadastro`: cadastro por email/senha (8 a 128 caracteres). Não cria sessão: envia o e-mail de confirmação.
- `/entrar`: login e criação da sessão com cookie HttpOnly. Contas sem e-mail confirmado recebem 403 `EMAIL_NOT_VERIFIED`, sem reenvio automático; o aviso oferece o botão "Reenviar e-mail".
- `/verificar-email?token=&next=`: confirma o e-mail pelo proxy do backend, inicia a sessão e segue para `next` (somente caminhos internos).
- `/esqueci-senha` e `/redefinir-senha?token=`: recuperação de senha. O link expira em 1 hora, vale uma vez e encerra as sessões abertas.
- `/convite/[id]`: o destinatário entra ou cria conta com o e-mail convidado e aceita ou recusa. O formulário do modal de gerenciamento da empresa envia os convites.
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

## E-mails de autenticação

Os e-mails de confirmação de conta, redefinição de senha, convite e alteração de cargo usam o `EmailModule` (SMTP configurado no `.env` do backend) por meio do `AuthEmailsService`, em `backend-nestjs/src/modules/auth/`. Os templates seguem o visual dos modais do sistema (layout reutilizável em `src/shared/email/templates/`), com HTML compatível com clientes de e-mail e versão em texto puro. Todos os links apontam para `FRONTEND_URL`; não há variáveis novas.

- O e-mail verificado é obrigatório para entrar e para aceitar convites, inclusive para o usuário criado pelo seed: no primeiro acesso, ele usa o botão "Reenviar e-mail" do login.
- O reenvio da confirmação usa o endpoint nativo `/api/auth/send-verification-email`, que responde igual para qualquer e-mail. O `AuthEmailsService` ignora novos envios para o mesmo endereço por 60 segundos, e o botão mostra a contagem regressiva.
- Confirmação e redefinição são enviadas em segundo plano, para não revelar pelo tempo de resposta se o e-mail existe. Falhas são registradas sem destinatário, token ou link.
- A alteração de cargo avisa o membro afetado pelo hook `afterUpdateMemberRole`, com o cargo anterior e o novo. O envio é em segundo plano: a alteração já foi salva, então uma falha de SMTP só é registrada no log e não bloqueia a operação.
- O convite é enviado no hook `afterCreateInvitation`, porque o Better Auth descarta erros de `sendInvitationEmail`. Assim, quem convida recebe 502 `INVITATION_EMAIL_FAILED` se o SMTP falhar. Para reenviar, convide o mesmo e-mail de novo: o convite pendente é cancelado e um novo é enviado (`resend: true` é recusado).

## Validação

Backend: `pnpm build`, `pnpm lint`, `pnpm test` e `pnpm exec prisma validate --config prisma7.config.ts`. Os testes de autenticação usam o adapter em memória e mocks; não exigem PostgreSQL ou S3. A integração real com PostgreSQL depende da aplicação das migrações.

Frontend: `pnpm lint`, `pnpm test` e `pnpm build`. Schemas de entrada e dados do contexto usam Zod, conforme `frontend/AGENTS.md`.

Referências: [Better Auth com Express](https://better-auth.com/docs/integrations/express), [adapter Prisma](https://better-auth.com/docs/adapters/prisma), [Organization](https://better-auth.com/docs/plugins/organization), [cliente Next.js](https://better-auth.com/docs/integrations/next).
