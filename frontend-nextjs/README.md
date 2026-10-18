# Next.js template

This is a Next.js template with shadcn/ui.

## Sessão e API

Configure `API_URL` com a origem do backend (ex.: `http://localhost:5000`). O Next.js encaminha `/backend/*` para essa origem; login, chamadas Axios e consultas da sessão no navegador passam por esse proxy. Assim, os cookies de autenticação e renovação são recebidos na origem do frontend. `NEXT_PUBLIC_API_URL` permanece como fallback para ambientes existentes. Reinicie o Next.js após alterar a configuração e gere novo build ao alterar o destino de um deploy.

`lib/env.ts` valida as variáveis com Zod e deriva o tipo `Environment` com `z.infer`. URLs devem usar HTTP ou HTTPS; valores vazios são tratados como ausentes. O objeto `env` fornece `API_URL` resolvida, priorizando `API_URL`, depois `NEXT_PUBLIC_API_URL` e por último `http://localhost:5000`. Valores inválidos interrompem a configuração em vez de serem usados pelo proxy. Esse módulo é consumido apenas no servidor.

No backend, mantenha `FRONTEND_URL` apontando para a origem do frontend e `BETTER_AUTH_URL` para a URL configurada do Better Auth. As verificações de origem e CSRF permanecem habilitadas. Não configure um domínio de cookie exclusivo do backend: o navegador precisa enviar o cookie ao frontend.

`lib/auth-server.ts` valida a sessão no backend com `cache: "no-store"`, encaminhando o cookie recebido. A deduplicação React vale apenas para a renderização atual. Essa consulta usa `disableRefresh=true`, pois Server Components não podem encaminhar a renovação do cookie ao navegador. Respostas de conexão/servidor inválidas geram a tela de erro com opção de tentar novamente, sem tratar a falha como logout.

Cada página privada deve chamar `requireSession()` antes de buscar dados privados ou renderizar conteúdo; não dependa somente de um layout compartilhado. `/` e `/organizations` já fazem essa verificação. `/login` redireciona sessões válidas para `/organizations`. A lista de empresas ainda usa dados demonstrativos.

Redirecionamentos usam `reason=session-expired` no login quando há um cookie de sessão inválido. Usuários já autenticados são redirecionados diretamente para `/organizations`, sem parâmetro de motivo ou aviso. O componente cliente `SessionNotice` exibe o toast e remove o motivo da URL sem recarregar ou adicionar uma entrada ao histórico. Visitantes sem cookie entram no login sem aviso de expiração. O monitor usa o mesmo destino com motivo, sem disparar um segundo toast.

`SessionMonitor` verifica a sessão ao mudar o caminho, voltar à aba ou restaurar a página pelo histórico. A consulta no navegador renova as 2 horas e recebe o `Set-Cookie` pelo proxy. Não há polling. `401` em chamadas Axios solicita uma nova verificação; somente sessão ausente/expirada confirmada limpa o React Query e redireciona para `/login`. Falhas de login não disparam esse fluxo, e falhas de rede/servidor exibem um aviso sem encerrar a sessão. Consultas são canceladas ao sair da rota para evitar redirecionamentos tardios.

Execute `pnpm test` para os testes da interpretação da sessão e decisões de redirecionamento (Node.js 22.18+ ou 24+, com suporte nativo a TypeScript), além de `pnpm lint`, `pnpm typecheck` e `pnpm build`. Após gerar o build, `pnpm test:e2e` inicia o Next.js e um backend simulado em portas locais temporárias para conferir os redirects HTTP e as falhas de sessão, sem usar banco ou contas reais.

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button"
```

## Toasts

O toast do [Coss UI](https://coss.com/ui/docs/components/toast) está registrado no layout global, com modo claro e posição padrão no canto inferior direito.

Em componentes cliente:

```tsx
"use client"

import { toastManager } from "@/components/ui/toast"

toastManager.add({
  id: "save-success",
  title: "Salvo com sucesso",
  description: "As alterações foram salvas.",
  type: "success",
})
```

Use `toastManager.add` em handlers de eventos ou efeitos, nunca durante a renderização. Reutilizar o mesmo `id` atualiza a notificação existente. Tipos disponíveis: `success`, `error`, `info`, `warning` e `loading`.

Para notificações ancoradas em elementos, use `anchoredToastManager` com `positionerProps.anchor`. Os dois providers já estão disponíveis globalmente.
