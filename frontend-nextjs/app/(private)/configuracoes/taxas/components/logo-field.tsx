"use client"

import { useState } from "react"
import { ImageIcon } from "lucide-react"
import { ImagePicker } from "@/components/image-picker"
import { Field, FieldLabel } from "@/components/ui/field"
import { svgDataUrl } from "@/features/card-fees/logo"
import { svgLogoSchema } from "../schemas"

export function LogoField({
  id,
  label,
  value,
  onChange,
  error,
  disabled,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}) {
  const [fileError, setFileError] = useState<string>()

  return (
    <Field>
      <FieldLabel id={`${id}-label`}>{label}</FieldLabel>
      <div
        className="flex items-center gap-4"
        role="group"
        aria-labelledby={`${id}-label`}
      >
        <ImagePicker
          preview={
            value ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={svgDataUrl(value)}
                alt={`${label} atual`}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <ImageIcon
                className="size-8 text-muted-foreground"
                aria-hidden="true"
              />
            )
          }
          previewClassName="p-2"
          accept=".svg,image/svg+xml"
          editLabel={
            value
              ? `Alterar ${label.toLowerCase()}`
              : `Enviar ${label.toLowerCase()}`
          }
          removeLabel={`Remover ${label.toLowerCase()}`}
          inputLabel={`Selecionar arquivo SVG para ${label.toLowerCase()}`}
          canRemove={!!value}
          disabled={disabled}
          error={fileError ?? error}
          onSelect={async (file) => {
            // O SVG é lido no navegador e salvo como texto; nenhum arquivo é enviado ao backend.
            const result = svgLogoSchema.safeParse(await file.text())
            if (!result.success) {
              setFileError(result.error.issues[0]?.message)
              return
            }
            setFileError(undefined)
            onChange(result.data)
          }}
          onRemove={() => {
            setFileError(undefined)
            onChange("")
          }}
        />
        <p className="text-sm text-muted-foreground">
          Opcional. Arquivo SVG de até 50 KB.
        </p>
      </div>
    </Field>
  )
}
