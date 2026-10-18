"use client"

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
}

export function DataTable<TData>({
  columns,
  data,
  caption,
  getRowId,
  columnClassNames,
  cellClassNames,
}: DataTableProps<TData>) {
  "use no memo"

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
      <Table>
        <TableCaption className="sr-only">{caption}</TableCaption>
        <TableHeader className="bg-muted">
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
