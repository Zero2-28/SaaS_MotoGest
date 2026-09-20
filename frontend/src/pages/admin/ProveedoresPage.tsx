import { useEffect, useState, useCallback, useMemo } from 'react'
import { Plus, Search, Pencil, Trash2, Truck } from 'lucide-react'
import {
  useReactTable, getCoreRowModel, getFilteredRowModel,
  flexRender, createColumnHelper,
} from '@tanstack/react-table'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  getProveedores, crearProveedor, editarProveedor, eliminarProveedor,
} from '@/services/proveedores.service'
import type { Proveedor } from '@/types'

const schema = z.object({
  nombre:          z.string().min(2, 'Nombre requerido'),
  email:           z.string().email('Email inválido').optional().or(z.literal('')),
  telefono:        z.string().optional(),
  direccion:       z.string().optional(),
  tipoDocumento:   z.string().optional(),
  numeroDocumento: z.string().optional(),
  contacto:        z.string().optional(),
})

type FormData = z.infer<typeof schema>

const col = createColumnHelper<Proveedor>()

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [busqueda, setBusqueda]       = useState('')
  const [cargando, setCargando]       = useState(true)
  const [modalOpen, setModalOpen]     = useState(false)
  const [editando, setEditando]       = useState<Proveedor | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Proveedor | null>(null)
  const [guardando, setGuardando]     = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const lista = await getProveedores()
      setProveedores(lista)
    } catch {
      // Error de red o autenticación — no crashea el componente
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  function abrirCrear() {
    setEditando(null)
    reset({})
    setModalOpen(true)
  }

  const abrirEditar = useCallback((p: Proveedor) => {
    setEditando(p)
    reset({
      nombre:          p.nombre,
      email:           p.email ?? '',
      telefono:        p.telefono ?? '',
      direccion:       p.direccion ?? '',
      tipoDocumento:   p.tipoDocumento ?? '',
      numeroDocumento: p.numeroDocumento ?? '',
      contacto:        p.contacto ?? '',
    })
    setModalOpen(true)
  }, [reset])

  async function onSubmit(data: FormData) {
    setGuardando(true)
    try {
      // Convertir strings vacíos a undefined para que el backend los ignore
      const payload = {
        nombre:          data.nombre,
        email:           data.email     || undefined,
        telefono:        data.telefono  || undefined,
        direccion:       data.direccion || undefined,
        tipoDocumento:   data.tipoDocumento   || undefined,
        numeroDocumento: data.numeroDocumento || undefined,
        contacto:        data.contacto  || undefined,
      }
      if (editando) {
        const actualizado = await editarProveedor(editando.id, payload)
        setProveedores((prev) => prev.map((p) => (p.id === actualizado.id ? actualizado : p)))
      } else {
        const nuevo = await crearProveedor(payload)
        setProveedores((prev) => [...prev, nuevo])
      }
      setModalOpen(false)
    } catch {
      // Error de API — no cierra el modal para que el usuario pueda reintentar
    } finally {
      setGuardando(false)
    }
  }

  async function handleEliminar(p: Proveedor) {
    setGuardando(true)
    try {
      await eliminarProveedor(p.id)
      setProveedores((prev) => prev.filter((x) => x.id !== p.id))
      setConfirmDelete(null)
    } catch {
      setConfirmDelete(null)
    } finally {
      setGuardando(false)
    }
  }

  // useMemo es obligatorio: sin él, columns crea una nueva referencia en cada render
  // y useReactTable detecta el cambio → llama rerender() → loop infinito
  const columns = useMemo(() => [
    col.accessor('nombre', {
      header: 'Proveedor',
      cell: (info) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded bg-chrome-100 flex items-center justify-center shrink-0">
            <Truck className="h-4 w-4 text-chrome-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-ink">{info.getValue()}</p>
            {info.row.original.contacto && (
              <p className="text-xs text-muted-foreground">{info.row.original.contacto}</p>
            )}
          </div>
        </div>
      ),
    }),
    col.accessor('numeroDocumento', {
      header: 'RUC / Doc.',
      cell: (info) => {
        const doc = info.getValue()
        const tipo = info.row.original.tipoDocumento
        return (
          <span className="text-sm tabular-nums">
            {doc ? `${tipo ? tipo + ' ' : ''}${doc}` : <span className="text-muted-foreground italic">—</span>}
          </span>
        )
      },
    }),
    col.accessor('telefono', {
      header: 'Teléfono',
      cell: (info) => (
        <span className="text-sm text-ink">{info.getValue() ?? <span className="text-muted-foreground italic">—</span>}</span>
      ),
    }),
    col.accessor('email', {
      header: 'Email',
      cell: (info) => (
        <span className="text-sm text-ink">{info.getValue() ?? <span className="text-muted-foreground italic">—</span>}</span>
      ),
    }),
    col.display({
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            variant="ghost" size="icon"
            className="text-chrome-700 hover:text-brand hover:bg-mist"
            onClick={() => abrirEditar(row.original)}
            aria-label={`Editar ${row.original.nombre}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost" size="icon"
            className="text-chrome-700 hover:text-brand hover:bg-danger-100"
            onClick={() => setConfirmDelete(row.original)}
            aria-label={`Eliminar ${row.original.nombre}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    }),
  ], [abrirEditar])

  // useMemo obligatorio: .filter() crea nueva referencia cada render →
  // useReactTable detecta cambio en data → fuerza re-render → loop infinito
  const proveedoresFiltrados = useMemo(
    () => proveedores.filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase())),
    [proveedores, busqueda]
  )

  const table = useReactTable({
    data: proveedoresFiltrados,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-display-sm text-ink">PROVEEDORES</h1>
          <p className="text-sm text-muted-foreground mt-1">{proveedores.length} proveedores registrados</p>
        </div>
        <Button onClick={abrirCrear}>
          <Plus className="mr-2 h-4 w-4" />Nuevo proveedor
        </Button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
        <Input
          placeholder="Buscar proveedor…"
          className="pl-9 bg-mist border-chrome-200 text-ink placeholder:text-chrome-400 focus-visible:border-brand focus-visible:ring-brand/20"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          aria-label="Buscar proveedores"
        />
      </div>

      <Card className="bg-white border-chrome-200">
        <CardContent className="p-0">
          {cargando ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-12 w-full rounded" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id} className="border-b border-chrome-100 bg-mist">
                      {hg.headers.map((h) => (
                        <th key={h.id} className="px-4 py-3 text-left text-xs font-semibold text-chrome-700 uppercase tracking-wider">
                          {flexRender(h.column.columnDef.header, h.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="py-16 text-center text-muted-foreground text-sm">
                        {busqueda ? 'Sin resultados para la búsqueda.' : 'No hay proveedores. Crea el primero.'}
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="border-b border-chrome-200 hover:bg-mist transition-colors">
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

      {/* ── Modal crear/editar ────────────────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-white text-ink">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar proveedor' : 'Nuevo proveedor'}</DialogTitle>
            <DialogDescription>
              {editando ? `Editando: ${editando.nombre}` : 'Completa los datos del nuevo proveedor.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pv-nombre">Nombre <span className="text-brand" aria-hidden>*</span></Label>
              <Input id="pv-nombre" className="bg-mist border-chrome-200 text-ink placeholder:text-chrome-400 focus-visible:border-brand focus-visible:ring-brand/20" {...register('nombre')} aria-invalid={!!errors.nombre} />
              {errors.nombre && <p role="alert" className="text-xs text-danger">{errors.nombre.message}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pv-tipo">Tipo documento</Label>
                <Input id="pv-tipo" placeholder="RUC, DNI…" className="bg-mist border-chrome-200 text-ink placeholder:text-chrome-400 focus-visible:border-brand focus-visible:ring-brand/20" {...register('tipoDocumento')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pv-doc">Número documento</Label>
                <Input id="pv-doc" placeholder="20123456789" className="bg-mist border-chrome-200 text-ink placeholder:text-chrome-400 focus-visible:border-brand focus-visible:ring-brand/20" {...register('numeroDocumento')} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pv-tel">Teléfono</Label>
                <Input id="pv-tel" type="tel" className="bg-mist border-chrome-200 text-ink focus-visible:border-brand focus-visible:ring-brand/20" {...register('telefono')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pv-email">Email</Label>
                <Input id="pv-email" type="email" className="bg-mist border-chrome-200 text-ink placeholder:text-chrome-400 focus-visible:border-brand focus-visible:ring-brand/20" {...register('email')} aria-invalid={!!errors.email} />
                {errors.email && <p role="alert" className="text-xs text-danger">{errors.email.message}</p>}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pv-contacto">Contacto</Label>
              <Input id="pv-contacto" placeholder="Nombre de la persona de contacto" className="bg-mist border-chrome-200 text-ink placeholder:text-chrome-400 focus-visible:border-brand focus-visible:ring-brand/20" {...register('contacto')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pv-dir">Dirección</Label>
              <Input id="pv-dir" className="bg-mist border-chrome-200 text-ink focus-visible:border-brand focus-visible:ring-brand/20" {...register('direccion')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={guardando}>
                {guardando
                  ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  : editando ? 'Guardar cambios' : 'Crear proveedor'
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Confirmar eliminar ────────────────────────────────────────────────── */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="bg-white text-ink">
          <DialogHeader>
            <DialogTitle>Eliminar proveedor</DialogTitle>
            <DialogDescription>
              ¿Eliminar a <strong className="text-ink">{confirmDelete?.nombre}</strong>?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={guardando}
              onClick={() => confirmDelete && handleEliminar(confirmDelete)}
            >
              {guardando
                ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                : 'Eliminar'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
