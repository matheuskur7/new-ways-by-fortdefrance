"use client"

import { useLayoutEffect, useRef } from "react"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type DataTableProps<TData> = {
  columns: ColumnDef<TData>[]
  data: TData[]
  caption: string
  columnClassNames?: Partial<Record<string, string>>
  cellClassNames?: Partial<Record<string, string>>
  getRowId: (row: TData) => string
  /**
   * Altura máxima em linhas visíveis (aceita frações, como 3.5). Acima disso, a
   * tabela rola na vertical com o cabeçalho fixo. A altura é medida das linhas reais.
   */
  maxVisibleRows?: number
}

export function DataTable<TData>({
  columns,
  data,
  caption,
  getRowId,
  columnClassNames,
  cellClassNames,
  maxVisibleRows,
}: DataTableProps<TData>) {
  "use no memo"

  const containerRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container || maxVisibleRows === undefined) return
    const update = () => {
      const header = container.querySelector("thead")
      const rows = container.querySelectorAll<HTMLElement>("tbody > tr")
      if (!header || rows.length <= maxVisibleRows) {
        container.style.maxHeight = ""
        return
      }
      const whole = Math.floor(maxVisibleRows)
      let height = header.offsetHeight
      for (let i = 0; i < whole; i++) height += rows[i].offsetHeight
      height += rows[whole].offsetHeight * (maxVisibleRows - whole)
      container.style.maxHeight = `${Math.round(height)}px`
    }
    update()
    const observer = new ResizeObserver(update)
    const table = container.querySelector("table")
    if (table) observer.observe(table)
    return () => observer.disconnect()
  }, [maxVisibleRows, data])

  // A tabela usa APIs mutáveis; este componente opta por não usar o React Compiler.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
  })
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table
        containerProps={{
          ref: containerRef,
          className:
            maxVisibleRows !== undefined ? "overflow-y-auto" : undefined,
        }}
      >
        <TableCaption className="sr-only">{caption}</TableCaption>
        <TableHeader
          className={
            maxVisibleRows !== undefined
              ? "sticky top-0 z-10 bg-muted"
              : "bg-muted"
          }
        >
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={columnClassNames?.[header.column.id]}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={[
                      columnClassNames?.[cell.column.id],
                      cellClassNames?.[cell.column.id],
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Nenhum resultado encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
