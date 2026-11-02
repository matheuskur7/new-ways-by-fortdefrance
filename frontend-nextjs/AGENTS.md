<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Padrões do frontend

- Tabelas simples, sem filtros, paginação ou ordenação, usam diretamente `Table` e seus subcomponentes do Shadcn. Para tabelas que precisam desses recursos, use TanStack Table com `components/data-table.tsx` e defina as colunas no domínio correspondente.
- Requisições autenticadas em Server Components usam `lib/api-server.ts`; no navegador, use `lib/api.ts`. Valide as respostas com os schemas do domínio.
- Cabeçalhos de página usam `components/page-header.tsx`, com ícone, título, subtítulo e separador, inclusive nas telas de autenticação, exceto o login, que mantém seu cabeçalho próprio.
- Todo o conteúdo de uma página, ou seja, tudo abaixo do separador do cabeçalho, fica dentro de um card grande ou de mais de um card que, juntos, ocupem a área restante da tela. Use `SectionCard` de `components/ui/section-card.tsx`, com ícone, título, descrição e ações no canto superior direito (prop `action`), e aplique `flex-1` nele. Mantenha `flex-1 flex-col` na cadeia de contêineres da página para que os cards preencham a altura disponível. As seções de modais usam o mesmo visual por meio de `DialogSection`, que reutiliza o `SectionCard`.
- Todo botão que tenha somente ícone deve ter tooltip com a descrição da ação. Use `IconButton` de `components/ui/icon-button.tsx`, que aplica o `label` ao `aria-label` e, por padrão, ao tooltip. Em itens de lista, use `tooltip` com o verbo curto ("Editar") e mantenha o nome completo no `label` ("Editar Visa"), para que o texto visível esteja contido no nome acessível; em gatilhos de menus ou diálogos, passe o `IconButton` na prop `render`.
- Modais que representam uma entidade existente (edição ou detalhes) exibem as datas de criação e da última edição com `EntityTimestamps` de `components/entity-timestamps.tsx`, logo antes do rodapé, dentro do grid do modal (o componente já reduz o espaçamento em relação aos vizinhos): "Criado em" no extremo esquerdo e "Editado em" no extremo direito, em texto pequeno e discreto, com o título em negrito e o valor em peso normal. Em modais de criação, omita as datas. A API deve expor `createdAt` e `updatedAt` em ISO 8601 nas respostas dessas entidades.
- Modais de confirmação ou aviso (remoção, descarte de alterações, ação bloqueada) usam `ConfirmDialog` de `components/confirm-dialog.tsx`, baseado no `AlertDialog`: badge grande com o ícone destacado ao centro e, abaixo dele, título e descrição centralizados. A cor indica a gravidade: azul para informação (`tone="info"`, aplicado automaticamente aos avisos com `blockedReason`), amarelo para atenção (`tone="warning"`, como descartar alterações) e vermelho para exclusão ou ações sérias (`tone="destructive"`, o padrão). Ajustes visuais desse padrão ficam em `components/ui/alert-dialog.tsx`.
- Formulários usam React Hook Form com schemas Zod. Prefira `register` nos inputs que expõem `ref`, `onChange` e `onBlur`; use `Controller` somente quando a API do componente exigir integração controlada, como `value/onValueChange`.
