"use client"

import * as React from "react"
import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog"
import type { LucideIcon } from "lucide-react"
import { cn } from "cn"

function AlertDialog(props: AlertDialogPrimitive.Root.Props) {
  return <AlertDialogPrimitive.Root {...props} />
}

function AlertDialogContent({
  className,
  ...props
}: AlertDialogPrimitive.Popup.Props) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Backdrop
        forceRender
        className="fixed inset-0 isolate z-50 bg-black/10 duration-200 ease-in-out supports-backdrop-filter:backdrop-blur-xs motion-reduce:animate-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
      />
      <AlertDialogPrimitive.Popup
        data-slot="alert-dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid max-h-[90dvh] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-x-hidden overflow-y-auto rounded-xl border bg-popover text-sm text-popover-foreground duration-200 ease-in-out outline-none motion-reduce:animate-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      />
    </AlertDialogPrimitive.Portal>
  )
}

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn(
        "flex flex-col items-center gap-2 px-6 pt-8 pb-6 text-center",
        className
      )}
      {...props}
    />
  )
}

/** Informação em azul, atenção em amarelo e exclusão ou ações sérias em vermelho. */
type AlertDialogTone = "info" | "warning" | "destructive"

const toneClasses: Record<AlertDialogTone, string> = {
  info: "border-info/20 bg-info/10 text-info",
  warning: "border-warning/25 bg-warning/10 text-warning",
  destructive: "border-destructive/20 bg-destructive/10 text-destructive",
}

function AlertDialogIcon({
  icon: Icon,
  tone = "destructive",
  className,
}: {
  icon: LucideIcon
  tone?: AlertDialogTone
  className?: string
}) {
  return (
    <span
      data-tone={tone}
      className={cn(
        "mb-2 flex size-16 shrink-0 items-center justify-center rounded-2xl border",
        toneClasses[tone],
        className
      )}
    >
      <Icon className="size-8" aria-hidden="true" />
    </span>
  )
}

function AlertDialogTitle({
  className,
  ...props
}: AlertDialogPrimitive.Title.Props) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn(
        "font-heading text-lg leading-tight font-semibold text-foreground",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogDescription({
  className,
  ...props
}: AlertDialogPrimitive.Description.Props) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn(
        "max-w-sm text-sm leading-relaxed text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-wrap items-center justify-end gap-2 border-t bg-muted/60 px-6 py-4",
        className
      )}
      {...props}
    />
  )
}

export type { AlertDialogTone }
export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogIcon,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
}
