import { toastManager } from "@/components/ui/toast"
import { getHttpStatus } from "@/lib/api"

type MutationErrorToast = {
  title: string
  /** Descrição usada quando o status não tiver mensagem própria. */
  fallback: string
  messages?: Partial<Record<number, string>>
  id?: string
}

/** Cria um `onError` que exibe a mensagem correspondente ao status HTTP. */
export function mutationErrorToast({
  title,
  fallback,
  messages = {},
  id,
}: MutationErrorToast) {
  return (error: unknown) => {
    const status = getHttpStatus(error)
    toastManager.add({
      id,
      title,
      description: (status !== undefined && messages[status]) || fallback,
      type: "error",
    })
  }
}
