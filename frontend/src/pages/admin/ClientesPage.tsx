import { useEffect, useState } from 'react'
import { Search, Users, Mail, Phone } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import {
  useReactTable, getCoreRowModel, getFilteredRowModel,
  flexRender, createColumnHelper,
} from '@tanstack/react-table'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import api from '@/services/api'
import type { Cliente } from '@/types'
import { formatFechaCorta } from '@/utils/format'

const col = createColumnHelper<Cliente>()

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargar() {
      setCargando(true)
      try {
        // El backend aún no tiene un endpoint GET /clientes listado completo
        // Se usa la API genérica mientras el backend lo expone
        const { data } = await api.get<Cliente[]>('/clientes')
        setClientes(Array.isArray(data) ? data : [])
      } catch {
        // Error de red o auth silenciado
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  const columns = [
    col.accessor('nombre', {
      header: 'Cliente',
      cell: (info) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={info.row.original.avatarUrl}
            nombre={info.getValue()}
            size="sm"
          />
          <span className="text-sm font-medium text-[#111111]">{info.getValue()}</span>
        </div>
      ),
    }),
    col.accessor('email', {
      header: 'Email',
      cell: (info) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-3 w-3 shrink-0" aria-hidden />
          <a href={`mailto:${info.getValue()}`} className="hover:text-[#CC0000] transition-colors">
            {info.getValue()}
          </a>
        </div>
      ),
    }),
    col.accessor('telefono', {
      header: 'Teléfono',
      cell: (info) => info.getValue() ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-3 w-3 shrink-0" aria-hidden />
          <span>{info.getValue()}</span>
        </div>
      ) : <span className="text-muted-foreground text-sm">—</span>,
    }),
    col.accessor('createdAt', {
      header: 'Registro',
      cell: (info) => (
        <span className="text-sm text-muted-foreground">{formatFechaCorta(info.getValue())}</span>
      ),
    }),
  ]

  const table = useReactTable({
    data: clientes,
    columns,
    state: { globalFilter: busqueda },
    onGlobalFilterChange: setBusqueda,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-display-sm text-[#111111]">CLIENTES</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {clientes.length} clientes registrados
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-racing/15">
          <Users className="h-5 w-5 text-racing" aria-hidden />
        </div>
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
        <Input
          placeholder="Buscar por nombre, email…"
          className="pl-9 bg-[#F9FAFB] border-[#D1D5DB] text-[#111111] placeholder:text-[#9CA3AF] focus-visible:border-[#CC0000] focus-visible:ring-[#CC0000]/20"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          aria-label="Buscar clientes"
        />
      </div>

      {/* Tabla */}
      <Card className="bg-white border-gray-200">
        <CardContent className="p-0">
          {cargando ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-12 w-full rounded" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id} className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                      {hg.headers.map((h) => (
                        <th
                          key={h.id}
                          className="px-4 py-3 text-left text-xs font-semibold text-[#374151] uppercase tracking-wider"
                        >
                          {flexRender(h.column.columnDef.header, h.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="py-16 text-center text-muted-foreground">
                        No se encontraron clientes.
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="border-b border-gray-200 hover:bg-[#F9FAFB] transition-colors">
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-3">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
