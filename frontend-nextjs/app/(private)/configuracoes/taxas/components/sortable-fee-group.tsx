"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ManagedGroup } from "../management-schemas"
import { FeeGroupCard } from "./fee-group-card"

type SortableFeeGroupProps = {
  group: ManagedGroup
  canEdit: boolean
  disabled: boolean
  sortable: boolean
  onEdit: () => void
  onGrab: () => void
}

export function SortableFeeGroup({
  group,
  canEdit,
  disabled,
  sortable,
  onEdit,
  onGrab,
}: SortableFeeGroupProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: group.id,
    disabled: disabled || !sortable,
    transition: { duration: 200, easing: "cubic-bezier(0.25, 1, 0.5, 1)" },
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`min-w-0 rounded-xl motion-reduce:transition-none! ${isDragging ? "bg-primary/5 outline-2 outline-offset-2 outline-primary/30 outline-dashed [&>div]:opacity-15" : ""}`}
    >
      <FeeGroupCard
        group={group}
        canEdit={canEdit}
        onEdit={() => {
          if (!disabled) onEdit()
        }}
        dragHandle={
          sortable ? (
            <Button
              ref={setActivatorNodeRef}
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing aria-disabled:cursor-wait"
              {...attributes}
              {...listeners}
              aria-label={`Arrastar grupo ${group.name}`}
              onPointerDownCapture={() => {
                if (!disabled) onGrab()
              }}
            >
              <GripVertical aria-hidden="true" />
            </Button>
          ) : undefined
        }
      />
    </div>
  )
}
