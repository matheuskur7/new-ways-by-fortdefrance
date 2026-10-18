<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Padrões do frontend

- Tabelas simples, sem filtros, paginação ou ordenação, usam diretamente `Table` e seus subcomponentes do Shadcn. Para tabelas que precisam desses recursos, use TanStack Table com `components/data-table.tsx` e defina as colunas no domínio correspondente.
- Requisições autenticadas em Server Components usam `lib/api-server.ts`; no navegador, use `lib/api.ts`. Valide as respostas com os schemas do domínio.
- Cabeçalhos de página usam `components/page-header.tsx`, com ícone, título, subtítulo e separador, inclusive nas telas de autenticação, exceto o login, que mantém seu cabeçalho próprio.

- Formulários usam React Hook Form com schemas Zod. Prefira `register` nos inputs que expõem `ref`, `onChange` e `onBlur`; use `Controller` somente quando a API do componente exigir integração controlada, como `value/onValueChange`.
