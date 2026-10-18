"use client"

import Image from "next/image"
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
  const [failedImage, setFailedImage] = useState<string | null>(null)
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
      <div className="relative size-14">
        <span className="flex size-full items-center justify-center overflow-hidden rounded-lg border bg-background">
          {source && source !== failedImage ? (
            <Image
              src={source}
              alt="Sua foto de perfil"
              width={56}
              height={56}
              unoptimized
              className="size-full object-cover"
              onError={() => {
                setFailedImage(source)
                if (preview)
                  setError("Não foi possível abrir esta imagem. Escolha outra.")
              }}
            />
          ) : (
            <UserRound className="size-7" aria-hidden="true" />
          )}
        </span>
        {source && (
          <IconButton
            label="Remover foto de perfil"
            type="button"
            size="icon-xs"
            tooltipSide="bottom"
            variant="outline"
            className="absolute -bottom-1 -left-1 rounded-full text-muted-foreground shadow-sm hover:text-destructive"
            disabled={disabled}
            aria-describedby="user-image-description"
            onClick={() => {
              setPreview(null)
              setRemoved(true)
              onRemove()
            }}
          >
            <Trash2 aria-hidden="true" />
          </IconButton>
        )}
        <IconButton
          ref={editButtonRef}
          label="Alterar foto de perfil"
          type="button"
          size="icon-xs"
          tooltipSide="bottom"
          variant="outline"
          className="absolute -right-1 -bottom-1 rounded-full shadow-sm"
          disabled={disabled}
          aria-describedby="user-image-description"
          onClick={() => inputRef.current?.click()}
        >
          <Pencil aria-hidden="true" />
        </IconButton>
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
          setFailedImage(null)
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
