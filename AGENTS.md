# Orientações para agentes

Este arquivo se aplica a todo o monorepo. Orientações em `AGENTS.md` dentro de um subprojeto complementam estas regras e prevalecem em questões específicas daquele diretório. Instruções explícitas do usuário têm prioridade.

## Regras gerais

- Use pnpm e execute os comandos no diretório do subprojeto correspondente.
- Confira os scripts do `package.json` antes de executar comandos.
- Preserve alterações existentes do usuário e mantenha cada mudança dentro do escopo solicitado.
- Não versione segredos, arquivos `.env`, dependências instaladas ou artefatos gerados. Documente variáveis necessárias em `.env.example`, usando valores de exemplo.
- Ao alterar dependências, atualize o `pnpm-lock.yaml` do subprojeto.
- Execute as verificações adequadas à mudança e informe o resultado e quaisquer limitações.

## Frontend — `frontend/`

- Stack: Next.js, React, TypeScript e Tailwind CSS.
- Leia e siga [frontend/AGENTS.md](frontend/AGENTS.md) antes de modificar o frontend.
- Antes de escrever código Next.js, leia os guias relevantes em `frontend/node_modules/next/dist/docs/`. Esta versão possui diferenças em relação a versões anteriores; siga a documentação instalada e os avisos de depreciação.
- Preserve o bloco de orientações gerado pelo Next.js no `frontend/AGENTS.md`.
- Respeite os padrões existentes de componentes, estilos e organização de rotas.
- Para validar alterações, use `pnpm lint` e `pnpm build` conforme o escopo.

## Backend — `backend-nestjs/`

- Stack: NestJS, TypeScript com ESM, Drizzle ORM, PostgreSQL e Zod.
- Inicialize projetos e gere módulos, controllers e services com a CLI oficial do NestJS quando aplicável; use a CLI do Drizzle para gerar migrações.
- Mantenha `type: module` e resolução `NodeNext`. Use extensão `.js` em imports relativos TypeScript e `import type` para tipos.
- Organize funcionalidades em `src/modules/`, separando controller, service, repository e DTOs. Infraestrutura reutilizável fica em `src/shared/`.
- Defina schemas Zod e derive os tipos com `z.infer`. Use o suporte nativo Standard Schema do NestJS nos parâmetros de rota, corpo e query, com `StandardSchemaValidationPipe` global.
- Valide o ambiente no `ConfigModule.forRoot` usando o schema de `src/shared/config/env.ts`. Consuma valores por `ConfigService<Environment, true>` com `infer: true`; não espalhe leituras de `process.env` pela aplicação. Preserve os nomes do ambiente existente: `S3_REGION`, `S3_KEY_ID`, `S3_KEY_SECRET` e `FRONTEND_URL`. Normalize variáveis opcionais vazias para `undefined` e informe as duas chaves S3 juntas; sem elas, use a cadeia padrão AWS.
- Gere o OpenAPI com Swagger a partir dos schemas de validação. Mantenha Scalar em `/docs`, Swagger UI em `/swagger` e o documento em `/openapi.json`.
- Mantenha a validação e a tipagem do ambiente em um único arquivo: `src/shared/config/env.ts`.
- Organize os schemas de banco Drizzle por domínio em `src/shared/database/schemas/` (por exemplo, `storage.schema.ts` para imagens e arquivos e `auth.schema.ts` quando autenticação for implementada). Exporte os grupos em `schemas/index.ts`. Novas tabelas, enums e relações devem ficar no grupo correspondente. A configuração fica em `drizzle.config.ts` e as migrações em `drizzle/`; versione SQL e metadados das migrações.
- Use `pnpm db:generate` após alterações no schema. Confira o banco de destino antes de executar `pnpm db:migrate`; não aplique migrações destrutivas sem autorização explícita.
- Repositories tratam persistência via `DatabaseService`; regras de domínio ficam nos services.
- Images usa URLs pré-assinadas para upload e leitura diretamente no S3. Nunca receba arquivos, multipart, buffers ou streams de arquivos nas rotas do backend.
- Gere as chaves S3 no servidor; valide tipo declarado, tamanho e checksum SHA-256. Confirme uploads com `HeadObject` antes de marcar metadados como prontos e liberar URLs de leitura.
- Mantenha o bucket privado, a validade das URLs limitada e as credenciais na configuração validada (chaves S3 ou cadeia padrão AWS). Não persista nem registre URLs assinadas em logs.
- O scaffold não inclui autenticação. Ao adicionar acesso por usuário ou empresa, valide autorização antes de emitir URLs ou consultar/alterar metadados.
- Mantenha todos os testes inteiramente em `test/`, inclusive `.spec.ts`: unitários em `test/unit/` por módulo e testes HTTP/e2e em `test/e2e/`. Não crie testes em `src/`.
- Testes unitários e HTTP isolados devem simular banco e S3; testes de integração reais devem declarar suas dependências externas.
- Valide com `pnpm build`, `pnpm lint`, `pnpm test` e `pnpm test:e2e`, conforme o escopo. Documente variáveis necessárias em `.env.example`, sem credenciais reais.

## Commits — Conventional Commits

Todos os commits devem seguir Conventional Commits:

```text
<tipo>(<escopo opcional>): <descrição>
```

- Use `feat` para funcionalidades, `fix` para correções, `docs` para documentação, `refactor` para refatorações, `test` para testes, `build` para dependências ou configuração de build, `ci` para integração contínua e `chore` para manutenção.
- Prefira os escopos `frontend`, `backend` ou um domínio específico quando isso esclarecer a mudança.
- Escreva as mensagens dos commits em português, incluindo a descrição, o corpo e as explicações dos rodapés. Preserve os tipos, os escopos técnicos e os marcadores do Conventional Commits, como `BREAKING CHANGE:`.
- Escreva uma descrição curta e objetiva sobre o resultado do commit.
- Separe alterações independentes em commits coerentes e inclua apenas arquivos pertinentes ao assunto.
- Para mudanças incompatíveis, use `!` após o tipo ou escopo e explique a quebra no rodapé `BREAKING CHANGE:`.
- Não faça push sem solicitação do usuário.

Exemplos:

```text
feat(backend): adicionar envio e listagem de imagens de carros
fix(frontend): corrigir carregamento da prévia de imagens
build(backend): adicionar dependências do Prisma e S3
docs: documentar orientações para agentes do monorepo
```
