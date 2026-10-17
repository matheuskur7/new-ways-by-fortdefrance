# Next.js template

This is a Next.js template with shadcn/ui.

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
