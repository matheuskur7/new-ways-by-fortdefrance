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

## Backend — `backend/`

- Stack: NestJS, TypeScript com ESM, Prisma e PostgreSQL.
- Use extensão `.js` em imports relativos de arquivos TypeScript, conforme a resolução `NodeNext` do projeto; use `import type` para imports exclusivos de tipos.
- Organize funcionalidades em `src/modules/`, seguindo a divisão existente de controller, service, repository e DTOs. Coloque infraestrutura reutilizável em `src/shared/`.
- Valide entradas por DTOs e preserve os contratos das rotas existentes.
- Centralize regras compartilhadas em serviços do domínio responsável e exporte-os pelo módulo correspondente; infraestrutura transversal fica em `src/shared/`. Reutilize essas regras em vez de duplicar validações ou consultas em outros módulos.
- Para operações vinculadas a uma empresa, importe `OrganizationModule` e use `OrganizationAccessService.requireActiveOrganization(session)` no service antes de acessar os dados. A empresa vem da sessão validada no servidor; o serviço verifica o vínculo atual no banco a cada operação. Não confie apenas em `activeOrganizationId`, não aceite a empresa do corpo da requisição e não implemente verificações locais de membership em repositories de outros domínios.
- Repositories devem tratar a persistência de seu domínio. Em entidades separadas por empresa, receba o `organizationId` validado pelo service e inclua-o nos filtros de leitura, alteração e exclusão e nos dados de criação. A validação de vínculo não substitui esses filtros; permissões específicas da operação devem ser verificadas adicionalmente quando aplicáveis.
- Mantenha `createdBy` e `updatedBy` opcionais nas entidades auditadas. O preenchimento deve ocorrer pela extensão do Prisma e pelo contexto de auditoria da sessão, sem receber autoria de DTOs nem propagá-la manualmente pelos repositories. Ao adicionar entidades ou relações graváveis, atualize o mapeamento e os testes da extensão de auditoria.
- Usuários usam soft delete por `UserService.softDelete`: marque `deletedAt` e revogue todas as sessões na mesma transação, preservando referências e e-mail único. Use sempre `PrismaService`, que filtra usuários e sessões inativos; não exclua usuários fisicamente nem use nested writes para excluí-los ou reativá-los. Consultas relacionais de outros domínios devem filtrar usuários ativos explicitamente quando necessário; a extensão não filtra relações aninhadas automaticamente.
- O schema Prisma fica em `prisma/schema.prisma`; a configuração fica em `prisma7.config.ts`.
- Use `pnpm db:generate` para gerar o cliente. Não edite nem versione `src/generated/prisma/`.
- Para alterações de estrutura do banco, inclua migrações em `prisma/migrations/`. Confira o banco de destino antes de aplicar migrações; não execute operações destrutivas sem autorização explícita.
- Documente variáveis de banco e armazenamento em `.env.example`, sem credenciais reais.
- Para validar alterações, use `pnpm build`, `pnpm test` e `pnpm lint` conforme o escopo. Valide o schema com `pnpm exec prisma validate --config prisma7.config.ts` quando ele for alterado.
- Mantenha todos os testes em `test/`, fora de `src/`: unitários em `test/unit/`, organizados por módulo, e e2e em `test/e2e/`. Não crie pastas `specs` dentro dos módulos.
- Testes unitários devem usar mocks para banco e armazenamento; testes de integração devem declarar as dependências externas necessárias.

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
