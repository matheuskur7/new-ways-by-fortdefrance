<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Validação de entradas

- Use Zod como padrão para definir schemas e validar entradas no frontend, incluindo formulários, parâmetros e dados externos.
- Centralize schemas reutilizáveis e derive os tipos com `z.infer`, evitando duplicar contratos de validação.
- Valide entradas também no servidor quando forem usadas em Server Actions ou Route Handlers. A validação no cliente complementa, mas não substitui, a validação e autorização no backend.

## Organização de páginas

- Organize as páginas de `src/app/` em grupos de rotas: `(auth)` para login, cadastro e seleção de empresa, `(private)` para as páginas do sistema com sidebar e `(pdf)` para futuras páginas destinadas à geração ou visualização de PDFs.
- Os nomes dos grupos não fazem parte das URLs. Preserve os caminhos públicos ao mover páginas e evite rotas de grupos diferentes que resolvam para a mesma URL.
- Mantenha o layout raiz compartilhado em `src/app/layout.tsx` e os estilos globais em `src/app/globals.css`. Crie layouts por grupo somente quando houver necessidade de apresentação específica.
- O dashboard é a página inicial do sistema (`/`), definida em `src/app/(private)/page.tsx`. Use `src/app/(private)/layout.tsx` como layout exclusivo compartilhado das páginas privadas.
- A seleção de empresa (`/organizations`) usa `AuthShell` no grupo `(auth)`, sem sidebar, e exige sessão no servidor.
- Os grupos de rotas organizam as páginas, mas não validam acesso automaticamente. Preserve a validação de sessão e de vínculo com a empresa no servidor, conforme a necessidade de cada página. Defina também a autorização das futuras páginas de `(pdf)` conforme os dados acessados.
- Reserve `(pdf)` sem implementar páginas ou fluxos enquanto não houver uma funcionalidade solicitada.

## Requisições à API

- Centralize consultas e alterações da API em `src/api/`, organizadas por domínio. Componentes e páginas devem consumir essas funções ou hooks, sem implementar chamadas HTTP diretamente.
- Use TanStack Query para dados remotos no cliente que precisem de cache, deduplicação, atualização ou estados de carregamento, e `useMutation` para alterações disparadas pelo usuário. Mantenha query keys e hooks junto ao domínio em `src/api/`.
- Mantenha consultas e validações de acesso do servidor em módulos `*.server.ts` com `server-only`, sem cache compartilhado de sessão entre usuários. Os helpers de autorização ficam em `src/lib/auth-server.ts`.
- Valide respostas externas com Zod. Ao alterar dados, invalide as consultas relacionadas; ao autenticar, sair ou trocar de empresa, cancele consultas em andamento e limpe dados da sessão ou empresa anterior.
- Não repita mutations automaticamente. Preserve o cliente do Better Auth como transporte de autenticação, evitando duplicar o gerenciamento de sessão.

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Ignore routine debugging and unverified changes. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Keep a qualifying candidate through the reporting pass even if you resolve or work around it. A successful fix changes the report outcome; it does not erase the friction that qualified it.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `node node_modules/next/dist/bin/next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->

## Aparência

- Nos modais de confirmação, use `AlertDialogHeader` com `variant="info"` (azul), `variant="alert"` (âmbar) ou `variant="destructive"` (tokens dos botões destructive). Personalize o símbolo com a prop `icon`. O ícone deve ficar centralizado em um círculo com borda, acima do título.

- Em modais, mantenha os botões de confirmação à direita, depois das ações de cancelar ou voltar. Use os rodapés compartilhados para preservar essa ordem em todas as larguras de tela.

- Exiba o nome New Ways e a assinatura “by Fort de France” sempre em Arial, com Helvetica e sans-serif como alternativas.

- Use somente o tema claro (light). Não implemente tema escuro, seleção de tema ou adaptação ao tema do sistema.
- Botões somente com ícone devem exibir um tooltip descritivo ao passar o mouse e ao receber foco pelo teclado. Forneça também um nome acessível com `aria-label`; prefira o componente compartilhado `IconButton` para manter esse comportamento.
- Use o componente `Skeleton` do shadcn/ui nos estados de carregamento de páginas e seções, incluindo fallbacks de `Suspense` durante validações de acesso e carregamento de dados. Modele os skeletons conforme o layout do conteúdo esperado, preservando espaço e evitando textos transitórios que piscam na interface. A validação de acesso deve continuar sendo realizada no servidor.
