import { useEffect, useState } from 'react'
import { AlertTriangle, Plus, CheckCircle, Search } from 'lucide-react'
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

function StockRow({ item, onAjustar }: { item: StockItem; onAjustar: (item: StockItem) => void }) {
  const [imgSrc, setImgSrc] = useState(item.producto.imagen_url ?? IMG_PLACEHOLDER)
  const porcentaje = Math.min(100, (item.cantidad / (item.stockMinimo * 3)) * 100)
  const nivel = item.cantidad === 0
    ? 'stock-critico'
    : item.cantidad <= item.stockMinimo
    ? 'stock-bajo'
    : 'stock-ok'

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
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
          <p className="text-sm font-medium text-[#111111] truncate">{item.producto.nombre}</p>
          <Badge variant={nivel}>
            {item.cantidad} un.
          </Badge>
        </div>
        <p className="text-xs text-[#666666] mb-2">
          Stock mínimo: {item.stockMinimo} un. · Código: {item.producto.codigo}
        </p>
        <Progress value={porcentaje} aria-label={`Stock al ${porcentaje.toFixed(0)}%`} />
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onAjustar(item)}
        aria-label={`Ajustar stock de ${item.producto.nombre}`}
      >
        <Plus className="h-3 w-3 mr-1" />
        Ajustar
      </Button>
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
  const [ajustandoItem, setAjustandoItem] = useState<StockItem | null>(null)
  const [guardando, setGuardando]       = useState(false)

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

  const stockCritico = stock.filter((s) => s.cantidad <= s.stockMinimo)
  const stockOk      = stock.filter((s) => s.cantidad > s.stockMinimo)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-display-sm text-[#111111]">INVENTARIO</h1>
        <p className="text-sm text-[#666666] mt-1">
          Control de stock por sucursal. {alertas.length} alertas activas.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" aria-hidden />
          <Input
            placeholder="Buscar producto…"
            className="pl-9 w-56 bg-[#F9FAFB] border-[#D1D5DB] text-[#111111] placeholder:text-[#9CA3AF] focus-visible:border-[#CC0000] focus-visible:ring-[#CC0000]/20"
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
            <SelectTrigger className="w-48 bg-[#F9FAFB] border-[#D1D5DB] text-[#111111]" aria-label="Seleccionar sucursal">
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
            <SelectTrigger className="w-52 bg-[#F9FAFB] border-[#D1D5DB] text-[#111111]" aria-label="Filtrar por categoría">
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
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-[#374151] uppercase tracking-wide">Total productos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#111111]">{stock.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-[#374151] uppercase tracking-wide">Stock crítico</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#CC0000]">{stockCritico.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-[#374151] uppercase tracking-wide">Stock OK</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#22C55E]">{stockOk.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" aria-hidden />
              <CardTitle className="text-sm text-red-600">Productos que requieren atención</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2" aria-label="Alertas de stock">
              {alertas.map((a) => (
                <li
                  key={`${a.productoId}-${a.sucursalId}`}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-[#111111]">{a.producto.nombre}</span>
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
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-[#374151]">Inventario completo</CardTitle>
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
              <CheckCircle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-[#666666] text-sm">
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
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal ajuste */}
      <Dialog open={!!ajustandoItem} onOpenChange={() => setAjustandoItem(null)}>
        <DialogContent className="bg-white text-[#111111]">
          <DialogHeader>
            <DialogTitle>Ajuste de stock</DialogTitle>
            <DialogDescription>
              <strong className="text-[#111111]">{ajustandoItem?.producto.nombre}</strong>
              {' '}— Stock actual: <strong className="text-[#111111]">{ajustandoItem?.cantidad} un.</strong>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onAjuste)} noValidate className="grid gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="adj-cantidad">Cantidad a ajustar <span className="text-racing" aria-hidden>*</span></Label>
              <Input
                id="adj-cantidad"
                type="number"
                className="bg-[#F9FAFB] border-[#D1D5DB] text-[#111111] focus-visible:border-[#CC0000] focus-visible:ring-[#CC0000]/20"
                {...register('cantidad')}
                aria-describedby="adj-hint"
                aria-invalid={!!errors.cantidad}
              />
              <p id="adj-hint" className="text-xs text-[#9CA3AF] italic">
                Positivo para ingresar stock, negativo para restar.
              </p>
              {errors.cantidad && <p role="alert" className="text-xs text-red-400">{errors.cantidad.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="adj-motivo">Motivo del ajuste <span className="text-racing" aria-hidden>*</span></Label>
              <Input
                id="adj-motivo"
                placeholder="Ej: Recepción de mercadería, pérdida, etc."
                className="bg-[#F9FAFB] border-[#D1D5DB] text-[#111111] placeholder:text-[#9CA3AF] focus-visible:border-[#CC0000] focus-visible:ring-[#CC0000]/20"
                {...register('motivo')}
                aria-invalid={!!errors.motivo}
              />
              {errors.motivo && <p role="alert" className="text-xs text-red-400">{errors.motivo.message}</p>}
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
    </div>
  )
}
