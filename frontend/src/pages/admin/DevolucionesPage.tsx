import { useEffect, useState, useCallback } from 'react'
import { Plus, RotateCcw, CheckCircle2, XCircle } from 'lucide-react'
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
  getDevoluciones, crearDevolucion, updateEstadoDevolucion,
} from '@/services/devoluciones.service'
import { getVentas } from '@/services/ventas.service'
import type { Devolucion, EstadoDevolucion, Venta } from '@/types'
import { formatPrecio, formatFecha } from '@/utils/format'
import { useAuthEmpleadoStore } from '@/stores/auth.store'

// ── Badge por estado ──────────────────────────────────────────────────────────
const BADGE_ESTADO: Record<EstadoDevolucion, 'pendiente' | 'entregado' | 'cancelado'> = {
  pendiente: 'pendiente',
  aprobada:  'entregado',
  rechazada: 'cancelado',
}

const LABEL_ESTADO: Record<EstadoDevolucion, string> = {
  pendiente: 'Pendiente',
  aprobada:  'Aprobada',
  rechazada: 'Rechazada',
}

// ── Línea de ítem a devolver (estado local del modal) ─────────────────────────
interface ItemRetorno {
  productoId: number
  nombre:     string
  maxCantidad: number
  cantidad:   number
}

// ── Schema del formulario ─────────────────────────────────────────────────────
const devSchema = z.object({
  ventaId:       z.coerce.number().int().positive('Selecciona una venta'),
  motivo:        z.string().min(3, 'Motivo requerido'),
  observaciones: z.string().optional(),
})

type DevForm = z.infer<typeof devSchema>

export default function DevolucionesPage() {
  const { empleado } = useAuthEmpleadoStore()
  const esAdmin = empleado?.rol === 'admin'

  const [devoluciones, setDevoluciones] = useState<Devolucion[]>([])
  const [ventas, setVentas]             = useState<Venta[]>([])
  const [cargando, setCargando]         = useState(true)
  const [modalOpen, setModalOpen]       = useState(false)
  const [guardando, setGuardando]       = useState(false)
  const [cambiandoId, setCambiandoId]   = useState<number | null>(null)
  const [itemsRetorno, setItemsRetorno] = useState<ItemRetorno[]>([])
  const [errorForm, setErrorForm]       = useState<string | null>(null)
  const [desde, setDesde]               = useState('')
  const [hasta, setHasta]               = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const [d, v] = await Promise.all([getDevoluciones(), getVentas()])
      setDevoluciones(d)
      setVentas(v)
    } catch {
      // Error de red o auth silenciado
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const {
    register, handleSubmit, reset, control, watch,
    formState: { errors },
  } = useForm<DevForm>({ resolver: zodResolver(devSchema) })

  const ventaIdWatched = watch('ventaId')

  // Cuando cambia la venta seleccionada, popular los items con los productos de esa venta
  useEffect(() => {
    const id = Number(ventaIdWatched)
    if (!id) { setItemsRetorno([]); return }
    const venta = ventas.find((v) => v.id === id)
    if (!venta) { setItemsRetorno([]); return }
    setItemsRetorno(
      venta.detalles.map((d) => ({
        productoId:  d.productoId,
        nombre:      d.producto.nombre,
        maxCantidad: d.cantidad,
        cantidad:    0,
      }))
    )
  }, [ventaIdWatched, ventas])

  function abrirCrear() {
    reset({})
    setItemsRetorno([])
    setErrorForm(null)
    setModalOpen(true)
  }

  async function onSubmit(data: DevForm) {
    // Filtrar solo los productos con cantidad > 0
    const detalles = itemsRetorno
      .filter((i) => i.cantidad > 0)
      .map((i) => ({ productoId: i.productoId, cantidad: i.cantidad }))

    if (detalles.length === 0) {
      setErrorForm('Selecciona al menos un producto con cantidad mayor a 0.')
      return
    }
    setErrorForm(null)
    setGuardando(true)
    try {
      const nueva = await crearDevolucion({
        ventaId:       data.ventaId,
        motivo:        data.motivo,
        detalles,
        observaciones: data.observaciones || undefined,
      })
      setDevoluciones((prev) => [nueva, ...prev])
      setModalOpen(false)
    } catch {
      // Error de API — no cierra el modal para que el usuario pueda reintentar
    } finally {
      setGuardando(false)
    }
  }

  async function handleCambiarEstado(dev: Devolucion, estado: EstadoDevolucion) {
    setCambiandoId(dev.id)
    try {
      const actualizada = await updateEstadoDevolucion(dev.id, estado)
      setDevoluciones((prev) => prev.map((d) => (d.id === actualizada.id ? actualizada : d)))
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

  const devolucionesFiltradas = devoluciones.filter((d) => enRango(d.createdAt))

  function setCantidad(productoId: number, valor: number) {
    setItemsRetorno((prev) =>
      prev.map((i) =>
        i.productoId === productoId
          ? { ...i, cantidad: Math.max(0, Math.min(valor, i.maxCantidad)) }
          : i
      )
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-display-sm text-[#111111]">DEVOLUCIONES</h1>
          <p className="text-sm text-muted-foreground mt-1">{devoluciones.length} devoluciones registradas</p>
        </div>
        <Button onClick={abrirCrear}>
          <Plus className="mr-2 h-4 w-4" />Nueva devolución
        </Button>
      </div>

      {/* ── Filtro de fechas ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="date"
          value={desde}
          onChange={(e) => setDesde(e.target.value)}
          className="bg-[#F9FAFB] border border-[#D1D5DB] text-[#111111] rounded-lg px-3 py-2 text-sm"
          aria-label="Desde"
        />
        <input
          type="date"
          value={hasta}
          onChange={(e) => setHasta(e.target.value)}
          className="bg-[#F9FAFB] border border-[#D1D5DB] text-[#111111] rounded-lg px-3 py-2 text-sm"
          aria-label="Hasta"
        />
        {(desde || hasta) && (
          <button
            onClick={() => { setDesde(''); setHasta('') }}
            className="text-sm text-[#666666] hover:text-[#111111] px-3 py-2 rounded-lg border border-[#D1D5DB] bg-[#F9FAFB]"
          >
            Limpiar fechas
          </button>
        )}
      </div>

      {/* ── Lista de devoluciones ────────────────────────────────────────────── */}
      {cargando ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-44 rounded-lg" />
          ))}
        </div>
      ) : devolucionesFiltradas.length === 0 ? (
        <Card className="bg-white">
          <CardContent className="py-16 text-center text-[#111111] text-sm">
            <RotateCcw className="h-10 w-10 mx-auto mb-3 text-gray-400" />
            {devoluciones.length === 0 ? 'No hay devoluciones registradas.' : 'Sin resultados para el rango de fechas.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {devolucionesFiltradas.map((dev) => (
            <article key={dev.id} className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-sm font-bold text-[#111111]">{dev.numeroDevolucion}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {dev.createdAt ? formatFecha(dev.createdAt) : '—'}
                  </p>
                </div>
                <Badge variant={BADGE_ESTADO[dev.estado]}>{LABEL_ESTADO[dev.estado]}</Badge>
              </div>

              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Venta: </span>
                  <span className="text-[#111111] font-mono">{dev.venta.numeroVenta}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Motivo: </span>
                  <span className="text-[#111111]">{dev.motivo}</span>
                </p>
                <p className="font-bold text-[#111111]">{formatPrecio(dev.total)}</p>
              </div>

              {/* Aprobar / Rechazar — solo para admin, solo en pendiente */}
              {esAdmin && dev.estado === 'pendiente' && (
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs text-green-600 border-green-500 hover:bg-green-50 hover:text-green-700"
                    disabled={cambiandoId === dev.id}
                    onClick={() => handleCambiarEstado(dev, 'aprobada')}
                  >
                    {cambiandoId === dev.id
                      ? <span className="h-3 w-3 animate-spin rounded-full border border-green-500 border-t-transparent" />
                      : <><CheckCircle2 className="h-3 w-3 mr-1" />Aprobar</>
                    }
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                    disabled={cambiandoId === dev.id}
                    onClick={() => handleCambiarEstado(dev, 'rechazada')}
                  >
                    <XCircle className="h-3 w-3 mr-1" />Rechazar
                  </Button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* ── Modal nueva devolución ────────────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg bg-white text-[#111111]">
          <DialogHeader>
            <DialogTitle>Nueva devolución</DialogTitle>
            <DialogDescription>
              Selecciona la venta y los productos a devolver. El stock se reincorpora al aprobar.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
            {/* Venta */}
            <div className="flex flex-col gap-1.5">
              <Label>Venta de origen <span className="text-racing" aria-hidden>*</span></Label>
              <Controller
                name="ventaId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger className="bg-[#F9FAFB] border-[#D1D5DB] text-[#111111]" aria-invalid={!!errors.ventaId}>
                      <SelectValue placeholder="Selecciona una venta…" />
                    </SelectTrigger>
                    <SelectContent>
                      {ventas.map((v) => (
                        <SelectItem key={v.id} value={String(v.id)} className="text-xs">
                          {v.numeroVenta} — {v.cliente?.nombre ?? 'Sin cliente'} — {formatPrecio(v.total)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.ventaId && (
                <p role="alert" className="text-xs text-red-400">{errors.ventaId.message}</p>
              )}
            </div>

            {/* Motivo */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dev-motivo">Motivo <span className="text-racing" aria-hidden>*</span></Label>
              <Input
                id="dev-motivo"
                placeholder="Producto defectuoso, error de pedido…"
                className="bg-[#F9FAFB] border-[#D1D5DB] text-[#111111] placeholder:text-[#9CA3AF] focus-visible:border-[#CC0000] focus-visible:ring-[#CC0000]/20"
                {...register('motivo')}
                aria-invalid={!!errors.motivo}
              />
              {errors.motivo && (
                <p role="alert" className="text-xs text-red-400">{errors.motivo.message}</p>
              )}
            </div>

            {/* Productos de la venta — cantidad a devolver */}
            {itemsRetorno.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label>Productos a devolver <span className="text-racing" aria-hidden>*</span></Label>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 rounded-md border border-gray-200 p-2">
                  {itemsRetorno.map((item) => (
                    <div key={item.productoId} className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#111111] truncate">{item.nombre}</p>
                        <p className="text-xs text-muted-foreground">Máx. {item.maxCantidad} un.</p>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        max={item.maxCantidad}
                        className="w-20 h-8 text-xs text-right tabular-nums bg-[#F9FAFB] border-[#D1D5DB] text-[#111111]"
                        value={item.cantidad}
                        onChange={(e) => setCantidad(item.productoId, Number(e.target.value))}
                        aria-label={`Cantidad a devolver de ${item.nombre}`}
                      />
                    </div>
                  ))}
                </div>
                {errorForm && (
                  <p role="alert" className="text-xs text-red-400">{errorForm}</p>
                )}
              </div>
            )}

            {/* Observaciones */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dev-obs">Observaciones</Label>
              <Input id="dev-obs" placeholder="Opcional" className="bg-[#F9FAFB] border-[#D1D5DB] text-[#111111] placeholder:text-[#9CA3AF] focus-visible:border-[#CC0000] focus-visible:ring-[#CC0000]/20" {...register('observaciones')} />
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={guardando}>
                {guardando
                  ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  : 'Registrar devolución'
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
