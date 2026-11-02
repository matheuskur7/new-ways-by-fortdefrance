"use client"

import { useEffect, useId, useState } from "react"
import { createPortal } from "react-dom"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DropAnimation,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { IconButton } from "@/components/ui/icon-button"
import type { FeeBrand } from "../schemas"
import { moveIds } from "../reorder"
import { BrandRow } from "./brand-row"

// Mesmo ritmo na reordenação dos vizinhos e na soltura do item arrastado.
const sortTransition = {
  duration: 200,
  easing: "cubic-bezier(0.25, 1, 0.5, 1)",
}

// O overlay leva o item até a posição final sem mudar de escala; o item original
// fica oculto até o fim e a sombra do overlay some durante a soltura.
const dropAnimation: DropAnimation = {
  ...sortTransition,
  sideEffects: defaultDropAnimationSideEffects({
    className: { dragOverlay: "is-dropping" },
    styles: { active: { opacity: "0" } },
  }),
}

function noop() {}

type BrandActions = {
  onEdit: (brand: FeeBrand) => void
  onRemove: (brand: FeeBrand) => void
}

// Arraste por alça dedicada, com distância mínima e anúncios para leitores de
// tela. A nova ordem só é enviada quando o modal for salvo.
export function SortableBrandList({
  brands,
  canEdit,
  disabled,
  onReorder,
  ...actions
}: {
  brands: FeeBrand[]
  canEdit: boolean
  disabled: boolean
  /** Recebe a nova ordem dos ids; quem usa decide quando salvá-la. */
  onReorder: (ids: string[]) => void
} & BrandActions) {
  const contextId = useId()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [grabbing, setGrabbing] = useState(false)
  const [announcement, setAnnouncement] = useState("")
  // Item recém-solto; `key` reinicia o destaque em solturas seguidas do mesmo item.
  const [landed, setLanded] = useState<{ id: string; key: number } | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )
  const ids = brands.map((brand) => brand.id)
  const byId = new Map(brands.map((brand) => [brand.id, brand]))
  const activeBrand = activeId ? byId.get(activeId) : undefined
  const sortable = canEdit && brands.length > 1

  useEffect(() => {
    if (!grabbing) return

    document.documentElement.setAttribute("data-dragging-group", "")
    const release = () => setGrabbing(false)
    window.addEventListener("pointerup", release)
    window.addEventListener("pointercancel", release)
    window.addEventListener("blur", release)

    return () => {
      document.documentElement.removeAttribute("data-dragging-group")
      window.removeEventListener("pointerup", release)
      window.removeEventListener("pointercancel", release)
      window.removeEventListener("blur", release)
    }
  }, [grabbing])

  function finishDrag({ active, over }: DragEndEvent) {
    setActiveId(null)
    setGrabbing(false)
    setLanded((previous) => ({
      id: String(active.id),
      key: (previous?.key ?? 0) + 1,
    }))
    if (!over || active.id === over.id) return

    onReorder(moveIds(ids, String(active.id), String(over.id)))
    setAnnouncement("Ordem alterada. Salve para confirmar.")
  }

  return (
    <>
      {sortable && (
        <p className="text-xs text-muted-foreground">
          Arraste pela alça para definir a ordem de exibição na calculadora. A
          nova ordem é aplicada ao salvar.
        </p>
      )}
      <p role="status" className="sr-only">
        {announcement}
      </p>
      <DndContext
        id={contextId}
        sensors={sensors}
        collisionDetection={closestCenter}
        accessibility={{
          screenReaderInstructions: {
            draggable: "Arraste pela alça para reordenar os grupos de taxas.",
          },
          announcements: {
            onDragStart: () => "Grupo selecionado para arrastar.",
            onDragOver: ({ over }) =>
              over
                ? `Mover para a posição ${ids.indexOf(String(over.id)) + 1}.`
                : undefined,
            onDragEnd: () => "Arraste concluído.",
            onDragCancel: () => "Arraste cancelado.",
          },
        }}
        onDragStart={({ active }) => {
          setActiveId(String(active.id))
          setGrabbing(true)
        }}
        onDragCancel={() => {
          setActiveId(null)
          setGrabbing(false)
        }}
        onDragEnd={finishDrag}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ol
            className="grid gap-2"
            aria-busy={disabled}
            aria-label="Grupos de taxas"
          >
            {brands.map((brand) => (
              <SortableBrand
                key={brand.id}
                brand={brand}
                canEdit={canEdit}
                sortable={sortable}
                disabled={disabled}
                landedKey={landed?.id === brand.id ? landed.key : undefined}
                onLanded={() => setLanded(null)}
                onGrab={() => setGrabbing(true)}
                {...actions}
              />
            ))}
          </ol>
        </SortableContext>
        {/* Fora do modal: o transform de centralização dele desloca elementos fixed. */}
        {createPortal(
          <DragOverlay dropAnimation={dropAnimation}>
            {activeBrand && (
              // Cópia visual da linha: fora do modal, repete a tipografia dele e
              // mantém alça e ações, sem foco nem interação (inert).
              <div
                aria-hidden="true"
                inert
                className="pointer-events-none rounded-lg text-sm text-popover-foreground shadow-lg transition-shadow duration-200 in-[.is-dropping]:shadow-none"
              >
                <BrandRow
                  brand={activeBrand}
                  dragHandle={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 text-muted-foreground"
                    >
                      <GripVertical aria-hidden="true" />
                    </Button>
                  }
                  actions={{ disabled: false, onEdit: noop, onRemove: noop }}
                />
              </div>
            )}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    </>
  )
}

function SortableBrand({
  brand,
  canEdit,
  sortable,
  disabled,
  landedKey,
  onLanded,
  onGrab,
  onEdit,
  onRemove,
}: {
  brand: FeeBrand
  canEdit: boolean
  sortable: boolean
  disabled: boolean
  /** Presente quando o item acabou de ser solto; muda a cada soltura. */
  landedKey?: number
  onLanded: () => void
  onGrab: () => void
} & BrandActions) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: brand.id,
    disabled: disabled || !sortable,
    transition: sortTransition,
    // O overlay já anima a soltura; animar a mudança de posição no DOM depois
    // dela faria o item saltar ao reaparecer.
    animateLayoutChanges: () => false,
  })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`relative min-w-0 rounded-lg motion-reduce:transition-none! ${isDragging ? "bg-primary/5 outline-2 outline-offset-2 outline-primary/30 outline-dashed [&>div]:opacity-15" : ""}`}
    >
      {landedKey !== undefined && (
        // Anel rápido indicando onde o item parou; começa quando a soltura termina.
        <span
          key={landedKey}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 animate-drop-ring rounded-lg outline-2 outline-offset-2 outline-transparent motion-reduce:hidden"
          style={{ animationDelay: `${sortTransition.duration}ms` }}
          onAnimationEnd={onLanded}
        />
      )}
      <BrandRow
        brand={brand}
        actions={
          canEdit
            ? {
                disabled,
                onEdit: () => onEdit(brand),
                onRemove: () => onRemove(brand),
              }
            : undefined
        }
        dragHandle={
          sortable ? (
            <IconButton
              ref={setActivatorNodeRef}
              label={`Arrastar ${brand.name}`}
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing aria-disabled:cursor-wait"
              {...attributes}
              {...listeners}
              onPointerDownCapture={() => {
                if (!disabled) onGrab()
              }}
            >
              <GripVertical aria-hidden="true" />
            </IconButton>
          ) : undefined
        }
      />
    </li>
  )
}
