"use client"

import { useEffect, useId, useState } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable"
import { GripVertical } from "lucide-react"
import type { ManagedGroup } from "../management-schemas"
import { moveGroupIds } from "../reorder-groups"
import { FeeGroupCard } from "./fee-group-card"
import { SortableFeeGroup } from "./sortable-fee-group"

type SortableFeeGroupsProps = {
  groups: ManagedGroup[]
  canEdit: boolean
  disabled: boolean
  onEdit: (group: ManagedGroup) => void
  onReorder: (ids: string[]) => Promise<void>
}

export function SortableFeeGroups({
  groups,
  canEdit,
  disabled,
  onEdit,
  onReorder,
}: SortableFeeGroupsProps) {
  const contextId = useId()
  const [preview, setPreview] = useState<string[] | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [grabbing, setGrabbing] = useState(false)
  const [announcement, setAnnouncement] = useState("")
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )
  const ids = groups.map((group) => group.id)
  const byId = new Map(groups.map((group) => [group.id, group]))
  const ordered = (preview ?? ids).flatMap((id) => {
    const group = byId.get(id)
    return group ? [group] : []
  })
  const activeGroup = activeId ? byId.get(activeId) : undefined

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

  async function finishDrag({ active, over }: DragEndEvent) {
    setActiveId(null)
    setGrabbing(false)
    if (!over || active.id === over.id) return

    const next = moveGroupIds(ids, String(active.id), String(over.id))
    setPreview(next)
    try {
      await onReorder(next)
      setAnnouncement("Ordem dos grupos salva.")
    } catch {
      setAnnouncement(
        "Não foi possível salvar. A ordem anterior foi restaurada."
      )
    } finally {
      setPreview(null)
    }
  }

  return (
    <>
      {canEdit && groups.length > 1 && (
        <p className="px-4 pt-3 text-xs text-muted-foreground">
          Arraste pela alça para alterar a ordem dos grupos.
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
            draggable: "Arraste pela alça para reordenar os grupos.",
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
        onDragEnd={(event) => void finishDrag(event)}
      >
        <SortableContext items={preview ?? ids} strategy={rectSortingStrategy}>
          <div
            className="grid items-start gap-4 p-4 xl:grid-cols-2 2xl:grid-cols-3"
            aria-busy={disabled}
          >
            {ordered.map((group) => (
              <SortableFeeGroup
                key={group.id}
                group={group}
                canEdit={canEdit}
                disabled={disabled}
                sortable={canEdit && groups.length > 1}
                onEdit={() => onEdit(group)}
                onGrab={() => setGrabbing(true)}
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
          {activeGroup && (
            <div
              aria-hidden="true"
              className="pointer-events-none rounded-xl opacity-95 outline-2 outline-offset-2 outline-primary/30"
            >
              <FeeGroupCard
                group={activeGroup}
                canEdit={canEdit}
                onEdit={() => {}}
                dragHandle={
                  <GripVertical className="size-4 shrink-0 text-muted-foreground" />
                }
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </>
  )
}
