import { useEffect, useState, useCallback, useRef } from 'react'
import { Plus, Search, Pencil, Trash2, Tag, X, Check, ImageIcon } from 'lucide-react'
import {
  useReactTable, getCoreRowModel, getFilteredRowModel,
  flexRender, createColumnHelper,
} from '@tanstack/react-table'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  getProductos, crearProducto, editarProducto, desactivarProducto,
} from '@/services/productos.service'
import {
  getCategorias, crearCategoria, editarCategoria, eliminarCategoria,
} from '@/services/categorias.service'
import { ajustarStock } from '@/services/inventario.service'
import { uploadProductoImage } from '@/services/upload.service'
import type { Producto, Categoria } from '@/types'
import { formatPrecio } from '@/utils/format'
import { useAuthEmpleadoStore } from '@/stores/auth.store'

// ── Schemas ───────────────────────────────────────────────────────────────────

const schema = z.object({
  codigo:        z.string().min(2, 'Código requerido'),
  nombre:        z.string().min(2, 'Mínimo 2 caracteres'),
  precioVenta:   z.coerce.number().positive('Precio de venta debe ser positivo'),
  precioCompra:  z.coerce.number().positive('Precio de compra debe ser positivo'),
  descripcion:   z.string().optional(),
  categoriaId:   z.coerce.number().int().positive('Selecciona una categoría'),
  stockInicial:  z.coerce.number().int().min(0).default(0),
})

const catSchema = z.object({
  nombre:      z.string().min(2, 'Mínimo 2 caracteres'),
  descripcion: z.string().optional(),
})

type FormData    = z.infer<typeof schema>
type CatFormData = z.infer<typeof catSchema>

const col = createColumnHelper<Producto>()

export default function ProductosPage() {
  const { empleado } = useAuthEmpleadoStore()
  const [productos, setProductos]     = useState<Producto[]>([])
  const [busqueda, setBusqueda]       = useState('')
  const [filtroCat, setFiltroCat]     = useState<number | undefined>(undefined)
  const [filtroActivo, setFiltroActivo] = useState<boolean | undefined>(undefined)
  const [cargando, setCargando]       = useState(true)
  const [modalOpen, setModalOpen]     = useState(false)
  const [editando, setEditando]       = useState<Producto | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Producto | null>(null)
  const [guardando, setGuardando]     = useState(false)

  // Estado de imagen en el modal de producto
  const [imagenFile, setImagenFile]     = useState<File | null>(null)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Categorías — usadas tanto en el Select del formulario como en el modal de gestión
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [creandoCat, setCreandoCat] = useState(false)
  const [editandoCat, setEditandoCat] = useState<Categoria | null>(null)
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<Categoria | null>(null)
  const [guardandoCat, setGuardandoCat] = useState(false)

  // ── Carga de datos ──────────────────────────────────────────────────────────

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const result = await getProductos(1, 100, busqueda, filtroCat, filtroActivo)
      setProductos(result.items)
    } finally {
      setCargando(false)
    }
  }, [busqueda, filtroCat, filtroActivo])

  useEffect(() => {
    const t = setTimeout(cargar, 300)
    return () => clearTimeout(t)
  }, [cargar])

  useEffect(() => {
    getCategorias().then(setCategorias).catch(() => {})
  }, [])

  // ── Form: crear/editar producto ─────────────────────────────────────────────

  const {
    register, handleSubmit, reset, control,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  function limpiarImagen() {
    if (imagenPreview && imagenPreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagenPreview)
    }
    setImagenFile(null)
    setImagenPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function cerrarModal() {
    limpiarImagen()
    setModalOpen(false)
  }

  function abrirCrear() {
    setEditando(null)
    limpiarImagen()
    reset({})
    setModalOpen(true)
  }

  function abrirEditar(p: Producto) {
    setEditando(p)
    limpiarImagen()
    // Mostrar imagen actual como preview
    if (p.imagen_url) setImagenPreview(p.imagen_url)
    reset({
      codigo:       p.codigo,
      nombre:       p.nombre,
      precioVenta:  p.precioVenta,
      precioCompra: 0,
      descripcion:  p.descripcion ?? '',
      categoriaId:  p.categoriaId,
    })
    setModalOpen(true)
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Revocar URL anterior si era un blob
    if (imagenPreview?.startsWith('blob:')) URL.revokeObjectURL(imagenPreview)
    setImagenFile(file)
    setImagenPreview(URL.createObjectURL(file))
  }

  async function onSubmit(data: FormData) {
    setGuardando(true)
    try {
      // Subir imagen si hay archivo nuevo
      let imagenUrl: string | null | undefined = editando?.imagen_url ?? null
      if (imagenFile) {
        imagenUrl = await uploadProductoImage(imagenFile)
      }

      if (editando) {
        await editarProducto(editando.id, {
          codigo:       data.codigo,
          nombre:       data.nombre,
          precioVenta:  data.precioVenta,
          precioCompra: data.precioCompra,
          descripcion:  data.descripcion || null,
          categoriaId:  data.categoriaId,
          imagen_url:   imagenUrl,
        })
      } else {
        const nuevoProd = await crearProducto({
          codigo:       data.codigo,
          nombre:       data.nombre,
          precioVenta:  data.precioVenta,
          precioCompra: data.precioCompra,
          descripcion:  data.descripcion ?? null,
          categoriaId:  data.categoriaId,
          imagen_url:   imagenUrl,
        })
        if ((data.stockInicial ?? 0) > 0) {
          await ajustarStock({
            productoId: nuevoProd.id,
            sucursalId: empleado?.sucursalId ?? 1,
            cantidad:   data.stockInicial,
            motivo:     'Stock inicial',
          })
        }
      }
      cerrarModal()
      await cargar()
    } catch {
      // Error de API — no cierra el modal para que el usuario pueda reintentar
    } finally {
      setGuardando(false)
    }
  }

  async function handleEliminar(p: Producto) {
    try {
      await desactivarProducto(p.id)
      setConfirmDelete(null)
      await cargar()
    } catch {
      setConfirmDelete(null)
    }
  }

  // ── Form: crear categoría ───────────────────────────────────────────────────

  const {
    register: regCat,
    handleSubmit: handleCat,
    reset: resetCat,
    formState: { errors: catErrors },
  } = useForm<CatFormData>({ resolver: zodResolver(catSchema) })

  async function onCrearCategoria(data: CatFormData) {
    setCreandoCat(true)
    try {
      const nueva = await crearCategoria({
        nombre:      data.nombre,
        descripcion: data.descripcion || undefined,
      })
      setCategorias((prev) => [...prev, nueva])
      resetCat()
    } catch {
      // Error de API silenciado
    } finally {
      setCreandoCat(false)
    }
  }

  async function onEditarCategoria(data: CatFormData) {
    if (!editandoCat) return
    setGuardandoCat(true)
    try {
      const actualizada = await editarCategoria(editandoCat.id, {
        nombre:      data.nombre,
        descripcion: data.descripcion || undefined,
      })
      setCategorias((prev) => prev.map((c) => (c.id === actualizada.id ? actualizada : c)))
      setEditandoCat(null)
      resetCat()
    } catch {
      // Error de API silenciado
    } finally {
      setGuardandoCat(false)
    }
  }

  async function handleEliminarCategoria(cat: Categoria) {
    setGuardandoCat(true)
    try {
      await eliminarCategoria(cat.id)
      setCategorias((prev) => prev.filter((c) => c.id !== cat.id))
      setConfirmDeleteCat(null)
    } catch {
      setConfirmDeleteCat(null)
    } finally {
      setGuardandoCat(false)
    }
  }

  function iniciarEditarCat(cat: Categoria) {
    setEditandoCat(cat)
    resetCat({ nombre: cat.nombre, descripcion: cat.descripcion ?? '' })
  }

  function cancelarEditarCat() {
    setEditandoCat(null)
    resetCat()
  }

  // ── Columnas de la tabla ────────────────────────────────────────────────────

  const columns = [
    col.accessor('nombre', {
      header: 'Producto',
      cell: (info) => (
        <div className="flex items-center gap-3">
          {/* Miniatura 40×40 */}
          {info.row.original.imagen_url ? (
            <img
              src={info.row.original.imagen_url}
              alt=""
              aria-hidden
              className="h-10 w-10 rounded object-cover shrink-0"
            />
          ) : (
            <div className="h-10 w-10 rounded bg-chrome-100 flex items-center justify-center shrink-0">
              <ImageIcon className="h-4 w-4 text-chrome-400" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-ink">{info.getValue()}</p>
            <p className="text-xs text-muted-foreground">{info.row.original.codigo}</p>
          </div>
        </div>
      ),
    }),
    col.accessor('categoria', {
      header: 'Categoría',
      cell: (info) => <Badge variant="secondary">{info.getValue().nombre}</Badge>,
    }),
    col.accessor('precioVenta', {
      header: 'Precio',
      cell: (info) => <span className="tabular-nums font-medium text-ink">{formatPrecio(info.getValue())}</span>,
    }),
    col.accessor('activo', {
      header: 'Estado',
      cell: (info) => (
        <Badge variant={info.getValue() ? 'stock-ok' : 'stock-critico'}>
          {info.getValue() ? 'Activo' : 'Inactivo'}
        </Badge>
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
  ]

  const table = useReactTable({
    data: productos,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-display-sm text-ink">PRODUCTOS</h1>
          <p className="text-sm text-muted-foreground mt-1">{productos.length} productos en el catálogo</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCatModalOpen(true)}>
            <Tag className="mr-2 h-4 w-4" />Categorías
          </Button>
          <Button onClick={abrirCrear}>
            <Plus className="mr-2 h-4 w-4" />Nuevo producto
          </Button>
        </div>
      </div>

      {/* Búsqueda y filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
          <Input
            placeholder="Buscar por nombre o código…"
            className="pl-9 w-56 bg-mist border-chrome-200 text-ink placeholder:text-chrome-400 focus-visible:border-brand focus-visible:ring-brand/20"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar productos"
          />
        </div>

        <Select
          value={filtroCat !== undefined ? String(filtroCat) : 'todas'}
          onValueChange={(v) => setFiltroCat(v === 'todas' ? undefined : Number(v))}
        >
          <SelectTrigger className="w-44 bg-mist border-chrome-200 text-ink" aria-label="Filtrar por categoría">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las categorías</SelectItem>
            {categorias.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filtroActivo !== undefined ? String(filtroActivo) : 'todos'}
          onValueChange={(v) => setFiltroActivo(v === 'todos' ? undefined : v === 'true')}
        >
          <SelectTrigger className="w-36 bg-mist border-chrome-200 text-ink" aria-label="Filtrar por estado">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="true">Activos</SelectItem>
            <SelectItem value="false">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <Card className="bg-white border-chrome-200">
        <CardContent className="p-0">
          {cargando ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
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
                        <th
                          key={h.id}
                          className="px-4 py-3 text-left text-xs font-semibold text-chrome-700 uppercase tracking-wider"
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
                      <td colSpan={columns.length} className="py-16 text-center text-muted-foreground text-sm">
                        No hay productos. Crea el primero.
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

      {/* ── Modal crear/editar producto ──────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) cerrarModal() }}>
        <DialogContent className="bg-white text-ink">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
            <DialogDescription>
              {editando ? `Editando: ${editando.nombre}` : 'Completa los datos del nuevo producto.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="p-nombre">Nombre <span className="text-brand" aria-hidden>*</span></Label>
                <Input id="p-nombre" className="bg-mist border-chrome-200 text-ink placeholder:text-chrome-400 focus-visible:border-brand focus-visible:ring-brand/20" {...register('nombre')} aria-invalid={!!errors.nombre} />
                {errors.nombre && <p role="alert" className="text-xs text-danger">{errors.nombre.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="p-codigo">Código <span className="text-brand" aria-hidden>*</span></Label>
                <Input id="p-codigo" className="bg-mist border-chrome-200 text-ink placeholder:text-chrome-400 focus-visible:border-brand focus-visible:ring-brand/20" {...register('codigo')} aria-invalid={!!errors.codigo} />
                {errors.codigo && <p role="alert" className="text-xs text-danger">{errors.codigo.message}</p>}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="p-pventa">Precio venta (S/.) <span className="text-brand" aria-hidden>*</span></Label>
                <Input id="p-pventa" type="number" step="0.01" className="bg-mist border-chrome-200 text-ink focus-visible:border-brand focus-visible:ring-brand/20" {...register('precioVenta')} aria-invalid={!!errors.precioVenta} />
                {errors.precioVenta && <p role="alert" className="text-xs text-danger">{errors.precioVenta.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="p-pcompra">Precio compra (S/.) <span className="text-brand" aria-hidden>*</span></Label>
                <Input id="p-pcompra" type="number" step="0.01" className="bg-mist border-chrome-200 text-ink focus-visible:border-brand focus-visible:ring-brand/20" {...register('precioCompra')} aria-invalid={!!errors.precioCompra} />
                {errors.precioCompra && <p role="alert" className="text-xs text-danger">{errors.precioCompra.message}</p>}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-cat">
                Categoría <span className="text-brand" aria-hidden>*</span>
              </Label>
              <Controller
                name="categoriaId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger id="p-cat" className="bg-mist border-chrome-200 text-ink" aria-invalid={!!errors.categoriaId}>
                      <SelectValue placeholder="Selecciona una categoría…" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.length === 0 ? (
                        <div className="py-3 text-center text-xs text-muted-foreground">
                          Sin categorías — créalas con el botón "Categorías"
                        </div>
                      ) : (
                        categorias.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.nombre}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.categoriaId && (
                <p role="alert" className="text-xs text-danger">{errors.categoriaId.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-desc">Descripción</Label>
              <textarea
                id="p-desc"
                {...register('descripcion')}
                rows={3}
                className="flex w-full rounded-lg border border-chrome-200 bg-mist px-3 py-2 text-sm text-ink placeholder:text-chrome-400 focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20/20 resize-y"
                placeholder="Descripción opcional del producto…"
              />
            </div>

            {/* Upload de imagen */}
            <div className="flex flex-col gap-1.5">
              <Label>Imagen del producto</Label>
              <div className="flex items-center gap-3">
                {imagenPreview ? (
                  <div className="relative shrink-0">
                    <img
                      src={imagenPreview}
                      alt="Vista previa"
                      className="h-16 w-16 rounded object-cover border border-chrome-200"
                    />
                    <button
                      type="button"
                      onClick={limpiarImagen}
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-chrome-400 flex items-center justify-center hover:bg-danger transition-colors"
                      aria-label="Quitar imagen"
                    >
                      <X className="h-2.5 w-2.5 text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded border border-dashed border-chrome-300 flex items-center justify-center shrink-0">
                    <ImageIcon className="h-6 w-6 text-chrome-400" />
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="p-imagen"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {imagenPreview ? 'Cambiar imagen' : 'Seleccionar imagen'}
                  </Button>
                  <p className="text-xs text-muted-foreground">JPG, PNG, WebP · Máx. 5 MB</p>
                </div>
              </div>
            </div>

            {!editando && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="p-stock">Stock inicial</Label>
                <Input
                  id="p-stock"
                  type="number"
                  min={0}
                  placeholder="0"
                  className="bg-mist border-chrome-200 text-ink focus-visible:border-brand focus-visible:ring-brand/20"
                  {...register('stockInicial')}
                  aria-describedby="p-stock-hint"
                />
                <p id="p-stock-hint" className="text-xs text-muted-foreground">
                  Unidades disponibles al crear el producto. Deja en 0 si aún no hay stock.
                </p>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={cerrarModal}>
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  editando ? 'Guardar cambios' : 'Crear producto'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modal gestión de categorías ──────────────────────────────────────── */}
      <Dialog open={catModalOpen} onOpenChange={setCatModalOpen}>
        <DialogContent className="bg-white text-ink">
          <DialogHeader>
            <DialogTitle>Gestionar categorías</DialogTitle>
            <DialogDescription>
              Crea nuevas categorías para organizar el catálogo.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-48 overflow-y-auto space-y-1 rounded-md border border-chrome-200 p-2">
            {categorias.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                Aún no hay categorías.
              </p>
            ) : (
              categorias.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded px-3 py-2 text-sm hover:bg-mist"
                >
                  <div>
                    <span className="text-ink font-medium">{c.nombre}</span>
                    {c.descripcion && (
                      <span className="ml-2 text-xs text-muted-foreground">{c.descripcion}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button" variant="ghost" size="icon" className="h-7 w-7 text-chrome-700 hover:text-brand hover:bg-mist"
                      onClick={() => iniciarEditarCat(c)}
                      aria-label={`Editar ${c.nombre}`}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button" variant="ghost" size="icon" className="h-7 w-7 text-chrome-700 hover:text-brand hover:bg-danger-100"
                      onClick={() => setConfirmDeleteCat(c)}
                      aria-label={`Eliminar ${c.nombre}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={handleCat(editandoCat ? onEditarCategoria : onCrearCategoria)}
            noValidate
            className="grid gap-3 border-t border-chrome-200 pt-4"
          >
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {editandoCat ? `Editando: ${editandoCat.nombre}` : 'Nueva categoría'}
            </p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cat-nombre">
                Nombre <span className="text-brand" aria-hidden>*</span>
              </Label>
              <Input
                id="cat-nombre"
                placeholder="Ej: Cascos, Frenos, Luces…"
                className="bg-mist border-chrome-200 text-ink placeholder:text-chrome-400 focus-visible:border-brand focus-visible:ring-brand/20"
                {...regCat('nombre')}
                aria-invalid={!!catErrors.nombre}
              />
              {catErrors.nombre && (
                <p role="alert" className="text-xs text-danger">{catErrors.nombre.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cat-desc">Descripción</Label>
              <Input id="cat-desc" placeholder="Opcional" className="bg-mist border-chrome-200 text-ink placeholder:text-chrome-400 focus-visible:border-brand focus-visible:ring-brand/20" {...regCat('descripcion')} />
            </div>
            <DialogFooter>
              {editandoCat ? (
                <>
                  <Button type="button" variant="ghost" onClick={cancelarEditarCat}>
                    <X className="mr-1 h-4 w-4" />Cancelar edición
                  </Button>
                  <Button type="submit" disabled={guardandoCat}>
                    {guardandoCat
                      ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      : <><Check className="mr-1 h-4 w-4" />Guardar cambios</>
                    }
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" variant="ghost" onClick={() => setCatModalOpen(false)}>
                    <X className="mr-1 h-4 w-4" />Cerrar
                  </Button>
                  <Button type="submit" disabled={creandoCat}>
                    {creandoCat
                      ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      : <><Plus className="mr-1 h-4 w-4" />Crear categoría</>
                    }
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Confirmar eliminar categoría ─────────────────────────────────────── */}
      <Dialog open={!!confirmDeleteCat} onOpenChange={() => setConfirmDeleteCat(null)}>
        <DialogContent className="bg-white text-ink">
          <DialogHeader>
            <DialogTitle>Eliminar categoría</DialogTitle>
            <DialogDescription>
              ¿Eliminar <strong className="text-ink">{confirmDeleteCat?.nombre}</strong>?
              Los productos asociados perderán su categoría.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDeleteCat(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={guardandoCat}
              onClick={() => confirmDeleteCat && handleEliminarCategoria(confirmDeleteCat)}
            >
              {guardandoCat
                ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                : 'Eliminar'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirmar desactivación ──────────────────────────────────────────── */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="bg-white text-ink">
          <DialogHeader>
            <DialogTitle>Desactivar producto</DialogTitle>
            <DialogDescription>
              ¿Desactivar <strong className="text-ink">{confirmDelete?.nombre}</strong>?
              Ya no aparecerá en el catálogo público.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => confirmDelete && handleEliminar(confirmDelete)}>
              Desactivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
