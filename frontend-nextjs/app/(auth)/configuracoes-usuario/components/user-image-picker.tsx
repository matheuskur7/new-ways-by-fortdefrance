"use client"

import { UserImage } from "@/components/user-image"
import { useEffect, useRef, useState } from "react"
import { Pencil, Trash2, UserRound } from "lucide-react"
import { IconButton } from "@/components/ui/icon-button"
import { ImageCropDialog } from "./image-crop-dialog"

export function UserImagePicker({
  image,
  disabled,
  onChange,
  onRemove,
}: {
  image?: string | null
  disabled?: boolean
  onChange: (image: Blob) => void
  onRemove: () => void
}) {
  const editButtonRef = useRef<HTMLButtonElement>(null)
  const [cropSource, setCropSource] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [removed, setRemoved] = useState(false)
  const source = removed ? null : (preview ?? image)

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  useEffect(() => {
    return () => {
      if (cropSource) URL.revokeObjectURL(cropSource)
    }
  }, [cropSource])

  return (
    <div className="shrink-0">
      <div className="flex w-fit overflow-hidden rounded-lg border bg-background">
        <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg">
          <UserImage
            src={source}
            size={56}
            alt="Sua foto de perfil"
            fallback={<UserRound className="size-7" aria-hidden="true" />}
            onError={() => {
              if (preview)
                setError("Não foi possível abrir esta imagem. Escolha outra.")
            }}
          />
        </span>
        <div className="grid h-14 w-6 grid-rows-2 divide-y">
          <IconButton
            ref={editButtonRef}
            label="Alterar foto de perfil"
            type="button"
            size="icon-xs"
            tooltipSide="right"
            variant="ghost"
            className="h-full w-full rounded-md"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            <Pencil aria-hidden="true" />
          </IconButton>
          <IconButton
            label="Remover foto de perfil"
            type="button"
            size="icon-xs"
            tooltipSide="right"
            variant="ghost"
            className="h-full w-full rounded-md text-muted-foreground hover:text-destructive"
            disabled={disabled || !source}
            onClick={() => {
              setPreview(null)
              setRemoved(true)
              onRemove()
            }}
          >
            <Trash2 aria-hidden="true" />
          </IconButton>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-label="Selecionar foto de perfil"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ""
          if (!file) return
          if (!file.type.startsWith("image/")) {
            setError("Selecione um arquivo de imagem.")
            return
          }
          setError(null)
          setCropSource(URL.createObjectURL(file))
        }}
      />
      {cropSource && (
        <ImageCropDialog
          key={cropSource}
          source={cropSource}
          returnFocus={editButtonRef}
          onCancel={() => setCropSource(null)}
          onConfirm={(blob) => {
            setPreview(URL.createObjectURL(blob))
            setRemoved(false)
            onChange(blob)
          }}
        />
      )}
      {error && (
        <p role="alert" className="mt-2 max-w-40 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
