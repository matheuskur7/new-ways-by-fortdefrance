"use client"

import { useEffect, useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import Cropper, { type Area } from "react-easy-crop"
import { Button } from "@/components/ui/button"
import { IconButton } from "@/components/ui/icon-button"
import { ZoomIn, ZoomOut } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { useIsMobile } from "@/hooks/use-mobile"
import { prepareUserImage } from "../services/prepare-user-image"

export function ImageCropDialog({
  source,
  onCancel,
  onConfirm,
  returnFocus,
}: {
  source: string
  onCancel: () => void
  onConfirm: (image: Blob) => void
  returnFocus: React.RefObject<HTMLButtonElement | null>
}) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(true)
  const [dialogReady, setDialogReady] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const area = useRef<Area | null>(null)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const active = useRef(true)

  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
    }
  }, [])

  function cancel() {
    active.current = false
    setOpen(false)
  }

  async function confirm() {
    if (!area.current || busy) return
    setBusy(true)
    setError(null)
    try {
      const blob = await prepareUserImage(source, area.current)
      if (active.current) {
        onConfirm(blob)
        setOpen(false)
      }
    } catch {
      if (active.current)
        setError("Não foi possível recortar a imagem. Tente novamente.")
    } finally {
      if (active.current) setBusy(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChangeComplete={(isOpen) => {
        if (isOpen) setDialogReady(true)
        else onCancel()
      }}
      onOpenChange={(open) => {
        if (!open) cancel()
      }}
    >
      <DialogContent
        finalFocus={returnFocus}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto md:max-w-2xl"
      >
        <DialogHeader className="pr-6">
          <DialogTitle>Ajustar foto de perfil</DialogTitle>
          <DialogDescription>
            Arraste a imagem e ajuste o zoom para escolher o enquadramento.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 md:grid-cols-[2rem_minmax(0,1fr)]">
          <div className="relative aspect-square max-h-[50dvh] w-full overflow-hidden rounded-lg bg-muted md:col-start-2 md:row-start-1 md:aspect-auto md:h-[min(55dvh,30rem)] md:max-h-none">
            <div
              className={`absolute inset-0 transition-opacity duration-200 ease-in-out motion-reduce:transition-none ${ready ? "opacity-100" : "opacity-0"}`}
            >
              {dialogReady && (
                <Cropper
                  image={source}
                  crop={crop}
                  zoom={zoom}
                  zoomSpeed={0.1}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropAreaChange={(_, pixels) => {
                    area.current = pixels
                    setReady(true)
                  }}
                  mediaProps={{
                    onError: () => {
                      setReady(false)
                      setError(
                        "Não foi possível abrir esta imagem. Escolha outra."
                      )
                    },
                  }}
                />
              )}
            </div>
          </div>
          <div className="flex min-h-0 items-center gap-3 md:col-start-1 md:row-start-1 md:flex-col-reverse">
            <IconButton
              label="Diminuir zoom"
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={!ready || zoom <= 1}
              onClick={() =>
                setZoom((value) =>
                  Math.max(1, Math.round((value - 0.1) * 100) / 100)
                )
              }
            >
              <ZoomOut aria-hidden="true" />
            </IconButton>
            <Slider
              aria-label="Zoom da foto"
              orientation={isMobile ? "horizontal" : "vertical"}
              disabled={!ready}
              min={1}
              max={3}
              step={0.01}
              value={[zoom]}
              onValueChange={(value) =>
                setZoom(Array.isArray(value) ? value[0] : value)
              }
              className="min-w-0 flex-1 md:min-h-0"
            />
            <IconButton
              label="Aumentar zoom"
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={!ready || zoom >= 3}
              onClick={() =>
                setZoom((value) =>
                  Math.min(3, Math.round((value + 0.1) * 100) / 100)
                )
              }
            >
              <ZoomIn aria-hidden="true" />
            </IconButton>
          </div>
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={cancel}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!ready || busy}
            onClick={confirm}
            aria-busy={busy}
          >
            {busy ? "Recortando…" : "Usar foto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
