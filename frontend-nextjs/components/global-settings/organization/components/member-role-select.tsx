"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { MemberRole } from "../schemas"
export type { MemberRole } from "../schemas"
const roles = [
  { value: "member", label: "Membro" },
  { value: "admin", label: "Administrador" },
]

export function MemberRoleSelect({
  value,
  onChange,
  label,
  id,
  disabled,
}: {
  value: MemberRole
  onChange: (role: MemberRole) => void
  label: string
  disabled?: boolean
  id?: string
}) {
  return (
    <Select
      disabled={disabled}
      items={roles}
      value={value}
      onValueChange={(role) => {
        if (role === "member" || role === "admin") onChange(role)
      }}
    >
      <SelectTrigger id={id} aria-label={label} className="w-40 shadow-none">
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectGroup>
          <SelectLabel>Cargo na empresa</SelectLabel>
          {roles.map((role) => (
            <SelectItem key={role.value} value={role.value}>
              {role.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
