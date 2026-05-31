import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type TableOptions,
} from "@tanstack/react-table";
import { useState } from "react";
import { cn } from "./cn";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  type: "text" | "select" | "date";
  column: string;
  label: string;
  options?: FilterOption[];
  placeholder?: string;
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  options?: Partial<TableOptions<TData>>;
  searchable?: boolean;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  pagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
}

export function DataTable<TData>({
  columns,
  data,
  options,
  searchable = true,
  searchPlaceholder = "Buscar...",
  filters = [],
  pagination = true,
  pageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
    ...options,
  });

  return (
    <div className="space-y-4">
      {/* Toolbar: Búsqueda y Filtros */}
      {(searchable || filters.length > 0) && (
        <div className="flex flex-wrap gap-3 items-center">
          {searchable && (
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="flex h-9 w-full max-w-sm rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          )}
          {filters.map((filter) => {
            if (filter.type === "select" && filter.options) {
              return (
                <select
                  key={filter.column}
                  value={(table.getColumn(filter.column)?.getFilterValue() as string) ?? ""}
                  onChange={(e) => table.getColumn(filter.column)?.setFilterValue(e.target.value || undefined)}
                  className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">{filter.label}</option>
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              );
            }
            if (filter.type === "text") {
              return (
                <input
                  key={filter.column}
                  type="text"
                  placeholder={filter.placeholder || filter.label}
                  value={(table.getColumn(filter.column)?.getFilterValue() as string) ?? ""}
                  onChange={(e) => table.getColumn(filter.column)?.setFilterValue(e.target.value || undefined)}
                  className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              );
            }
            if (filter.type === "date") {
              return (
                <input
                  key={filter.column}
                  type="date"
                  placeholder={filter.placeholder || filter.label}
                  value={(table.getColumn(filter.column)?.getFilterValue() as string) ?? ""}
                  onChange={(e) => table.getColumn(filter.column)?.setFilterValue(e.target.value || undefined)}
                  className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Tabla */}
      <div className="rounded-md border">
        <table className="w-full caption-bottom text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="bg-[var(--app-sidebar-bg)]">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-center align-middle font-medium cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder ? null : (
                      <span className="inline-flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === "asc" ? " ▴" : header.column.getIsSorted() === "desc" ? " ▾" : ""}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-4 text-center align-middle truncate max-w-[250px]">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No hay resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {pagination && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Mostrar</span>
            <select
              className="rounded-md border bg-background px-2 py-1 text-sm"
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
            >
              {pageSizeOptions.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>de {table.getFilteredRowModel().rows.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
            >
              Anterior
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
