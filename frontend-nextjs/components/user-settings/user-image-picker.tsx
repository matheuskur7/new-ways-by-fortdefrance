"use client"

import { UserImage } from "@/components/user-image"
import { useEffect, useRef, useState } from "react"
import { UserRound } from "lucide-react"
import { ImagePicker } from "@/components/image-picker"
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
    <>
      <ImagePicker
        preview={
          <UserImage
            src={source}
            size={80}
            alt="Sua foto de perfil"
            fallback={<UserRound className="size-9" aria-hidden="true" />}
            onError={() => {
              if (preview)
                setError("Não foi possível abrir esta imagem. Escolha outra.")
            }}
          />
        }
        accept="image/*"
        editLabel="Alterar foto de perfil"
        removeLabel="Remover foto de perfil"
        inputLabel="Selecionar foto de perfil"
        canRemove={!!source}
        disabled={disabled}
        error={error}
        editButtonRef={editButtonRef}
        onSelect={(file) => {
          if (!file.type.startsWith("image/")) {
            setError("Selecione um arquivo de imagem.")
            return
          }
          setError(null)
          setCropSource(URL.createObjectURL(file))
        }}
        onRemove={() => {
          setPreview(null)
          setRemoved(true)
          onRemove()
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
    </>
  )
}
