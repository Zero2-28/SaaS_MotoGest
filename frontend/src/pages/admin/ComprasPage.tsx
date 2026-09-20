import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, ShoppingBag, ChevronDown, PackageCheck } from 'lucide-react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
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
import { getCompras, crearCompra, updateEstadoCompra } from '@/services/compras.service'
import { getProveedores } from '@/services/proveedores.service'
import { getProductos } from '@/services/productos.service'
import type { Compra, EstadoCompra, Proveedor, Producto } from '@/types'
import { formatPrecio, formatFecha } from '@/utils/format'
import { useAuthEmpleadoStore } from '@/stores/auth.store'

// ── Colores de badge por estado ───────────────────────────────────────────────
const BADGE_ESTADO: Record<EstadoCompra, 'pendiente' | 'procesando' | 'enviado' | 'entregado' | 'cancelado'> = {
  pendiente:  'pendiente',
  confirmado: 'procesando',
  recibido:   'entregado',
  cancelado:  'cancelado',
}

const LABEL_ESTADO: Record<EstadoCompra, string> = {
  pendiente:  'Pendiente',
  confirmado: 'Confirmado',
  recibido:   'Recibido',
  cancelado:  'Cancelado',
}

// ── Schema del formulario ─────────────────────────────────────────────────────
const lineaSchema = z.object({
  productoId:     z.coerce.number().int().positive('Selecciona un producto'),
  cantidad:       z.coerce.number().int().positive('Mínimo 1 unidad'),
  precioUnitario: z.coerce.number().positive('Precio requerido'),
})

const compraSchema = z.object({
  proveedorId:   z.coerce.number().int().positive('Selecciona un proveedor'),
  detalles:      z.array(lineaSchema).min(1, 'Agrega al menos un producto'),
  observaciones: z.string().optional(),
})

type CompraForm = z.infer<typeof compraSchema>

export default function ComprasPage() {
  const { empleado } = useAuthEmpleadoStore()
  const [compras, setCompras]         = useState<Compra[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [productos, setProductos]     = useState<Producto[]>([])
  const [cargando, setCargando]       = useState(true)
  const [modalOpen, setModalOpen]     = useState(false)
  const [guardando, setGuardando]     = useState(false)
  const [cambiandoId, setCambiandoId] = useState<number | null>(null)
  const [desde, setDesde]             = useState('')
  const [hasta, setHasta]             = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const [c, p, pr] = await Promise.all([
        getCompras(),
        getProveedores(),
        getProductos(1, 200),
      ])
      setCompras(c)
      setProveedores(p)
      setProductos(pr.items)
    } catch {
      // Error de red o auth silenciado
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const {
    register, handleSubmit, reset, control,
    formState: { errors },
  } = useForm<CompraForm>({
    resolver: zodResolver(compraSchema),
    defaultValues: { detalles: [] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'detalles' })

  function abrirCrear() {
    reset({ detalles: [] })
    setModalOpen(true)
  }

  async function onSubmit(data: CompraForm) {
    setGuardando(true)
    try {
      const nueva = await crearCompra({
        proveedorId:   data.proveedorId,
        detalles:      data.detalles,
        observaciones: data.observaciones || undefined,
      })
      setCompras((prev) => [nueva, ...prev])
      setModalOpen(false)
    } catch {
      // Error de API — no cierra el modal para que el usuario pueda reintentar
    } finally {
      setGuardando(false)
    }
  }

  async function handleCambiarEstado(compra: Compra, estado: EstadoCompra) {
    setCambiandoId(compra.id)
    try {
      // El admin pasa sucursalId en el body; vendedor usa el del token
      const sucursalId = empleado?.sucursalId ?? 1
      const actualizada = await updateEstadoCompra(compra.id, estado, sucursalId)
      setCompras((prev) => prev.map((c) => (c.id === actualizada.id ? actualizada : c)))
    } catch {
      // Error de API silenciado
    } finally {
      setCambiandoId(null)
    }
  }

  function enRango(fecha: string | null | undefined): boolean {
    if (!fecha) return true
    const fechaSolo = new Date(fecha).toLocaleDateString('en-CA')
    if (desde && fechaSolo < desde) return false
    if (hasta && fechaSolo > hasta) return false
    return true
  }

  const comprasFiltradas = compras.filter((c) => enRango(c.createdAt))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-display-sm text-ink">TRACKING PEDIDOS</h1>
          <p className="text-sm text-muted-foreground mt-1">{compras.length} órdenes de compra</p>
        </div>
        <Button onClick={abrirCrear}>
          <Plus className="mr-2 h-4 w-4" />Nueva compra
        </Button>
      </div>

      {/* ── Filtro de fechas ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="date"
          value={desde}
          onChange={(e) => setDesde(e.target.value)}
          className="bg-mist border border-chrome-200 text-ink rounded-lg px-3 py-2 text-sm"
          aria-label="Desde"
        />
        <input
          type="date"
          value={hasta}
          onChange={(e) => setHasta(e.target.value)}
          className="bg-mist border border-chrome-200 text-ink rounded-lg px-3 py-2 text-sm"
          aria-label="Hasta"
        />
        {(desde || hasta) && (
          <button
            onClick={() => { setDesde(''); setHasta('') }}
            className="text-sm text-chrome-600 hover:text-ink px-3 py-2 rounded-lg border border-chrome-200 bg-mist"
          >
            Limpiar fechas
          </button>
        )}
      </div>

      {/* ── Lista de compras ─────────────────────────────────────────────────── */}
      {cargando ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-44 rounded-lg" />
          ))}
        </div>
      ) : comprasFiltradas.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground text-sm">
            <ShoppingBag className="h-10 w-10 mx-auto mb-3 text-brand-600" />
            {compras.length === 0 ? 'No hay órdenes de compra. Crea la primera.' : 'Sin resultados para el rango de fechas.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {comprasFiltradas.map((compra) => (
            <article key={compra.id} className="rounded-lg border border-chrome-200 bg-white p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-sm font-bold text-ink">{compra.numeroCompra}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {compra.createdAt ? formatFecha(compra.createdAt) : '—'}
                  </p>
                </div>
                <Badge variant={BADGE_ESTADO[compra.estado]}>{LABEL_ESTADO[compra.estado]}</Badge>
              </div>

              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Proveedor: </span>
                  <span className="text-ink">{compra.proveedor?.nombre ?? 'Sin proveedor'}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Productos: </span>
                  <span className="text-ink">{compra.detalles?.length ?? 0} ítem(s)</span>
                </p>
                <p className="font-bold text-ink">{formatPrecio(compra.total)}</p>
              </div>

              {/* Cambiar estado — solo si no está cerrada */}
              {compra.estado !== 'recibido' && compra.estado !== 'cancelado' && (
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    disabled={cambiandoId === compra.id}
                    onClick={() => handleCambiarEstado(compra, 'recibido')}
                  >
                    {cambiandoId === compra.id
                      ? <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                      : <><PackageCheck className="h-3 w-3 mr-1" />Marcar recibido</>
                    }
                  </Button>
                  <Select
                    onValueChange={(v) => handleCambiarEstado(compra, v as EstadoCompra)}
                    disabled={cambiandoId === compra.id}
                  >
                    <SelectTrigger className="h-8 w-auto text-xs px-2">
                      <ChevronDown className="h-3 w-3" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmado" className="text-xs">Confirmado</SelectItem>
                      <SelectItem value="cancelado"  className="text-xs">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* ── Modal nueva compra ────────────────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl bg-white text-ink">
          <DialogHeader>
            <DialogTitle>Nueva orden de compra</DialogTitle>
            <DialogDescription>
              Se creará en estado <strong className="text-ink">pendiente</strong>.
              El stock se incrementa al marcarla como recibida.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
            {/* Proveedor */}
            <div className="flex flex-col gap-1.5">
              <Label>Proveedor <span className="text-brand" aria-hidden>*</span></Label>
              <Controller
                name="proveedorId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger className="bg-mist border-chrome-200 text-ink" aria-invalid={!!errors.proveedorId}>
                      <SelectValue placeholder="Selecciona un proveedor…" />
                    </SelectTrigger>
                    <SelectContent>
                      {proveedores.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.proveedorId && (
                <p role="alert" className="text-xs text-danger">{errors.proveedorId.message}</p>
              )}
            </div>

            {/* Productos */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label>Productos <span className="text-brand" aria-hidden>*</span></Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ productoId: 0, cantidad: 1, precioUnitario: 0 })}
                >
                  <Plus className="h-3 w-3 mr-1" />Agregar
                </Button>
              </div>
              {errors.detalles && !Array.isArray(errors.detalles) && (
                <p role="alert" className="text-xs text-danger">{errors.detalles.message}</p>
              )}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {fields.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Usa "Agregar" para añadir productos.
                  </p>
                )}
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    {/* Producto */}
                    <Controller
                      name={`detalles.${index}.productoId`}
                      control={control}
                      render={({ field: f }) => (
                        <Select
                          value={f.value ? String(f.value) : ''}
                          onValueChange={(v) => f.onChange(Number(v))}
                        >
                          <SelectTrigger className="flex-1 text-xs h-8 bg-mist border-chrome-200 text-ink">
                            <SelectValue placeholder="Producto…" />
                          </SelectTrigger>
                          <SelectContent>
                            {productos.map((p) => (
                              <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                                {p.nombre} ({p.codigo})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {/* Cantidad */}
                    <Input
                      type="number"
                      min={1}
                      className="w-20 h-8 text-xs bg-mist border-chrome-200 text-ink placeholder:text-chrome-400"
                      placeholder="Cant."
                      {...register(`detalles.${index}.cantidad`)}
                    />
                    {/* Precio unitario */}
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      className="w-24 h-8 text-xs bg-mist border-chrome-200 text-ink placeholder:text-chrome-400"
                      placeholder="S/. c/u"
                      {...register(`detalles.${index}.precioUnitario`)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 hover:text-danger"
                      onClick={() => remove(index)}
                      aria-label="Eliminar línea"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Observaciones */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="c-obs">Observaciones</Label>
              <Input id="c-obs" placeholder="Opcional" className="bg-mist border-chrome-200 text-ink placeholder:text-chrome-400 focus-visible:border-brand focus-visible:ring-brand/20" {...register('observaciones')} />
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={guardando}>
                {guardando
                  ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  : 'Crear orden'
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
