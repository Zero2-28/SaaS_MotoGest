import { useEffect, useState } from 'react'
import { AlertTriangle, Plus, CheckCircle, Search, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { getAlertasStock, getStockSucursal, ajustarStock } from '@/services/inventario.service'
import { getCategorias } from '@/services/categorias.service'
import api from '@/services/api'
import type { AlertaStock, StockItem, Sucursal, Categoria } from '@/types'
import { useAuthEmpleadoStore } from '@/stores/auth.store'

const IMG_PLACEHOLDER = 'https://placehold.co/40x40/F9FAFB/9CA3AF?text=M'

const ajusteSchema = z.object({
  cantidad: z.coerce.number().int('Debe ser entero'),
  motivo:   z.string().min(3, 'Indica el motivo del ajuste'),
})

type AjusteForm = z.infer<typeof ajusteSchema>

function StockRow({ item, onAjustar, esAdmin, onEliminar }: {
  item: StockItem
  onAjustar: (item: StockItem) => void
  esAdmin?: boolean
  onEliminar?: (item: StockItem) => void
}) {
  const [imgSrc, setImgSrc] = useState(item.producto.imagen_url ?? IMG_PLACEHOLDER)
  const porcentaje = Math.min(100, (item.cantidad / (item.stockMinimo * 3)) * 100)
  const nivel = item.cantidad === 0
    ? 'stock-critico'
    : item.cantidad <= item.stockMinimo
    ? 'stock-bajo'
    : 'stock-ok'

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-chrome-200 bg-white p-4">
      <img
        src={imgSrc}
        alt=""
        aria-hidden
        onError={() => setImgSrc(IMG_PLACEHOLDER)}
        className="h-10 w-10 rounded object-cover shrink-0 self-start sm:self-auto"
        width={40}
        height={40}
        loading="lazy"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium text-ink truncate">{item.producto.nombre}</p>
          <Badge variant={nivel}>
            {item.cantidad} un.
          </Badge>
        </div>
        <p className="text-xs text-chrome-600 mb-2">
          Stock mínimo: {item.stockMinimo} un. · Código: {item.producto.codigo}
        </p>
        <Progress value={porcentaje} aria-label={`Stock al ${porcentaje.toFixed(0)}%`} />
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAjustar(item)}
          aria-label={`Ajustar stock de ${item.producto.nombre}`}
        >
          <Plus className="h-3 w-3 mr-1" />
          Ajustar
        </Button>
        {esAdmin && onEliminar && (
          <Button
            size="sm"
            variant="ghost"
            className="text-danger hover:bg-danger-50 hover:text-danger-600"
            onClick={() => onEliminar(item)}
            aria-label={`Eliminar producto ${item.producto.nombre}`}
            title="Eliminar producto"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

export default function InventarioPage() {
  const { empleado } = useAuthEmpleadoStore()
  const esAdmin = empleado?.rol === 'admin'
  const [stock, setStock]               = useState<StockItem[]>([])
  const [alertas, setAlertas]           = useState<AlertaStock[]>([])
  const [sucursales, setSucursales]     = useState<Sucursal[]>([])
  const [sucursalSel, setSucursalSel]   = useState<number>(empleado?.sucursalId ?? 1)
  const [categorias, setCategorias]     = useState<Categoria[]>([])
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas')
  const [busqueda, setBusqueda]         = useState('')
  const [cargando, setCargando]         = useState(true)
  const [ajustandoItem, setAjustandoItem]   = useState<StockItem | null>(null)
  const [guardando, setGuardando]           = useState(false)
  const [eliminandoItem, setEliminandoItem] = useState<StockItem | null>(null)
  const [eliminando, setEliminando]         = useState(false)
  const [errorEliminar, setErrorEliminar]   = useState<string | null>(null)
  const [motivoEliminar, setMotivoEliminar] = useState('')

  useEffect(() => {
    if (!esAdmin) return
    api.get<Sucursal[]>('/sucursales')
      .then(({ data }) => setSucursales(data))
      .catch(() => {})
  }, [esAdmin])

  useEffect(() => {
    getCategorias()
      .then((data) => setCategorias(data.filter((c) => c.activo !== false)))
      .catch(() => {})
  }, [])

  async function cargar(mostrarSkeleton = false) {
    if (mostrarSkeleton) setCargando(true)
    try {
      const [s, a] = await Promise.all([
        getStockSucursal(sucursalSel),
        getAlertasStock(),
      ])
      setStock(s)
      setAlertas(a)
    } catch {
      // Error de red o auth silenciado
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    void cargar(true)
    const intervalo = setInterval(() => void cargar(), 30000)
    return () => clearInterval(intervalo)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sucursalSel])

  const stockFiltrado = stock.filter((s) => {
    const matchBusqueda = !busqueda.trim() ||
      s.producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.producto.codigo.toLowerCase().includes(busqueda.toLowerCase())
    const matchCategoria = categoriaFiltro === 'todas' || s.producto.categoriaId === Number(categoriaFiltro)
    return matchBusqueda && matchCategoria
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AjusteForm>({
    resolver: zodResolver(ajusteSchema),
  })

  async function onAjuste({ cantidad, motivo }: AjusteForm) {
    if (!ajustandoItem) return
    setGuardando(true)
    try {
      await ajustarStock({
        productoId: ajustandoItem.productoId,
        sucursalId: ajustandoItem.sucursalId,
        cantidad,
        motivo,
      })
      setAjustandoItem(null)
      reset()
      await cargar(false)
    } catch {
      // Error de API — no cierra el modal para que el usuario pueda reintentar
    } finally {
      setGuardando(false)
    }
  }

  function cerrarDialogEliminar() {
    setEliminandoItem(null)
    setErrorEliminar(null)
    setMotivoEliminar('')
  }

  async function confirmarEliminar() {
    if (!eliminandoItem) return
    setEliminando(true)
    setErrorEliminar(null)
    try {
      const params = motivoEliminar.trim()
        ? `?motivo=${encodeURIComponent(motivoEliminar.trim())}`
        : ''
      await api.delete(`/productos/${eliminandoItem.productoId}${params}`)
      cerrarDialogEliminar()
      await cargar(false)
    } catch {
      setErrorEliminar('No se pudo eliminar el producto. Intenta nuevamente.')
    } finally {
      setEliminando(false)
    }
  }

  const stockCritico = stock.filter((s) => s.cantidad <= s.stockMinimo)
  const stockOk      = stock.filter((s) => s.cantidad > s.stockMinimo)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-display-sm text-ink">INVENTARIO</h1>
        <p className="text-sm text-chrome-600 mt-1">
          Control de stock por sucursal. {alertas.length} alertas activas.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-chrome-400" aria-hidden />
          <Input
            placeholder="Buscar producto…"
            className="pl-9 w-56 bg-mist border-chrome-200 text-ink placeholder:text-chrome-400 focus-visible:border-brand focus-visible:ring-brand/20"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Filtrar por nombre de producto"
          />
        </div>
        {esAdmin && sucursales.length > 0 && (
          <Select
            value={String(sucursalSel)}
            onValueChange={(v) => setSucursalSel(Number(v))}
          >
            <SelectTrigger className="w-48 bg-mist border-chrome-200 text-ink" aria-label="Seleccionar sucursal">
              <SelectValue placeholder="Sucursal…" />
            </SelectTrigger>
            <SelectContent>
              {sucursales.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>{s.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {categorias.length > 0 && (
          <Select
            value={categoriaFiltro}
            onValueChange={(v) => setCategoriaFiltro(v)}
          >
            <SelectTrigger className="w-52 bg-mist border-chrome-200 text-ink" aria-label="Filtrar por categoría">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las categorías</SelectItem>
              {categorias.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Resumen */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-white border-chrome-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-chrome-700 uppercase tracking-wide">Total productos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-ink">{stock.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-chrome-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-chrome-700 uppercase tracking-wide">Stock crítico</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-brand">{stockCritico.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-chrome-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-chrome-700 uppercase tracking-wide">Stock OK</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">{stockOk.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <Card className="border-danger-100 bg-danger-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-danger" aria-hidden />
              <CardTitle className="text-sm text-danger-600">Productos que requieren atención</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2" aria-label="Alertas de stock">
              {alertas.map((a) => (
                <li
                  key={`${a.productoId}-${a.sucursalId}`}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-ink">{a.producto.nombre}</span>
                  <Badge variant={a.cantidad === 0 ? 'stock-critico' : 'stock-bajo'}>
                    {a.cantidad} / {a.stockMinimo} mín.
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Lista de stock */}
      <Card className="bg-white border-chrome-200">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-chrome-700">Inventario completo</CardTitle>
        </CardHeader>
        <CardContent>
          {cargando ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-20 w-full rounded" />
              ))}
            </div>
          ) : stockFiltrado.length === 0 ? (
            <div className="py-16 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-chrome-300 mb-3" />
              <p className="text-chrome-600 text-sm">
                {busqueda || categoriaFiltro !== 'todas' ? 'Sin resultados para los filtros aplicados.' : 'No hay productos registrados.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {stockFiltrado.map((item) => (
                <StockRow
                  key={item.id}
                  item={item}
                  onAjustar={(i) => { setAjustandoItem(i); reset() }}
                  esAdmin={esAdmin}
                  onEliminar={(i) => setEliminandoItem(i)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal ajuste */}
      <Dialog open={!!ajustandoItem} onOpenChange={() => setAjustandoItem(null)}>
        <DialogContent className="bg-white text-ink">
          <DialogHeader>
            <DialogTitle>Ajuste de stock</DialogTitle>
            <DialogDescription>
              <strong className="text-ink">{ajustandoItem?.producto.nombre}</strong>
              {' '}— Stock actual: <strong className="text-ink">{ajustandoItem?.cantidad} un.</strong>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onAjuste)} noValidate className="grid gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="adj-cantidad">Cantidad a ajustar <span className="text-brand" aria-hidden>*</span></Label>
              <Input
                id="adj-cantidad"
                type="number"
                className="bg-mist border-chrome-200 text-ink focus-visible:border-brand focus-visible:ring-brand/20"
                {...register('cantidad')}
                aria-describedby="adj-hint"
                aria-invalid={!!errors.cantidad}
              />
              <p id="adj-hint" className="text-xs text-chrome-400 italic">
                Positivo para ingresar stock, negativo para restar.
              </p>
              {errors.cantidad && <p role="alert" className="text-xs text-danger">{errors.cantidad.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="adj-motivo">Motivo del ajuste <span className="text-brand" aria-hidden>*</span></Label>
              <Input
                id="adj-motivo"
                placeholder="Ej: Recepción de mercadería, pérdida, etc."
                className="bg-mist border-chrome-200 text-ink placeholder:text-chrome-400 focus-visible:border-brand focus-visible:ring-brand/20"
                {...register('motivo')}
                aria-invalid={!!errors.motivo}
              />
              {errors.motivo && <p role="alert" className="text-xs text-danger">{errors.motivo.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setAjustandoItem(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  'Aplicar ajuste'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog eliminar producto */}
      <Dialog
        open={!!eliminandoItem}
        onOpenChange={(open) => { if (!open) cerrarDialogEliminar() }}
      >
        <DialogContent className="bg-white text-ink">
          <DialogHeader>
            <DialogTitle>¿Eliminar producto?</DialogTitle>
            <DialogDescription>
              Esta acción desactivará{' '}
              <strong className="text-ink">{eliminandoItem?.producto.nombre}</strong>{' '}
              del sistema. El historial se mantendrá.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="motivo-eliminar">Motivo (opcional)</Label>
            <textarea
              id="motivo-eliminar"
              rows={3}
              placeholder="Ej: producto descontinuado, dañado, fuera de stock permanente..."
              value={motivoEliminar}
              onChange={(e) => setMotivoEliminar(e.target.value)}
              className="w-full rounded-md border border-chrome-200 bg-mist px-3 py-2 text-sm text-ink placeholder:text-chrome-400 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20/20 resize-none"
            />
          </div>
          {errorEliminar && (
            <p role="alert" className="text-sm text-danger">{errorEliminar}</p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={cerrarDialogEliminar}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-danger-600 hover:bg-danger-700 text-white"
              disabled={eliminando}
              onClick={() => void confirmarEliminar()}
            >
              {eliminando
                ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                : 'Sí, eliminar'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
