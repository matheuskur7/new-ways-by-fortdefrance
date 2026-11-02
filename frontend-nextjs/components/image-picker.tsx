"use client"

import { useRef, type ReactNode, type Ref } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { cn } from "cn"
import { IconButton } from "@/components/ui/icon-button"

/**
 * Prévia quadrada com ações de alterar e remover a imagem ao lado.
 * O componente só seleciona o arquivo; quem o usa decide como lê-lo e validá-lo.
 */
export function ImagePicker({
  preview,
  accept,
  editLabel,
  removeLabel,
  inputLabel,
  canRemove,
  disabled,
  error,
  editButtonRef,
  previewClassName,
  onSelect,
  onRemove,
}: {
  preview: ReactNode
  accept: string
  editLabel: string
  removeLabel: string
  inputLabel: string
  canRemove: boolean
  disabled?: boolean
  error?: string | null
  /** Permite devolver o foco ao botão de alterar, por exemplo após um diálogo de recorte. */
  editButtonRef?: Ref<HTMLButtonElement>
  previewClassName?: string
  onSelect: (file: File) => void
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="shrink-0">
      <div className="flex w-fit overflow-hidden rounded-lg border bg-background">
        <span
          className={cn(
            "flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg",
            previewClassName
          )}
        >
          {preview}
        </span>
        <div className="grid h-20 w-8 grid-rows-2 divide-y">
          <IconButton
            ref={editButtonRef}
            label={editLabel}
            type="button"
            size="icon-sm"
            tooltipSide="right"
            variant="ghost"
            className="h-full w-full rounded-md"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            <Pencil aria-hidden="true" />
          </IconButton>
          <IconButton
            label={removeLabel}
            type="button"
            size="icon-sm"
            tooltipSide="right"
            variant="ghost"
            className="h-full w-full rounded-md text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={disabled || !canRemove}
            onClick={onRemove}
          >
            <Trash2 aria-hidden="true" />
          </IconButton>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        aria-label={inputLabel}
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ""
          if (file) onSelect(file)
        }}
      />
      {error && (
        <p role="alert" className="mt-2 max-w-40 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
