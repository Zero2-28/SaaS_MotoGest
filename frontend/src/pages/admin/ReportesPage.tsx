import { useEffect, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, CalendarCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getReporteVentas } from '@/services/ventas.service'
import type { ReporteVentas } from '@/types'
import { formatPrecio, formatFechaCorta } from '@/utils/format'

// Paleta accesible para gráfico de dona — no solo depende de color
// Paleta de series: azul metalizado en degradado + acento cálido
const COLORES_METODO = ['#0F3341', '#26688C', '#3D87AC', '#FF6B00', '#94A6B8']

// Datos mock de métodos de pago (en prod viene de /pagos/metodos)
const MOCK_METODOS = [
  { name: 'Efectivo',      value: 45 },
  { name: 'Yape',          value: 28 },
  { name: 'Tarjeta',       value: 15 },
  { name: 'Plin',          value: 8  },
  { name: 'Transferencia', value: 4  },
]

function MetricaCard({
  title, value, icon: Icon, positivo,
}: { title: string; value: string; icon: React.ElementType; positivo?: boolean }) {
  return (
    <Card className="bg-white border-chrome-200">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-xs text-chrome-700 uppercase tracking-wide">{title}</CardTitle>
        <div className={`flex h-8 w-8 items-center justify-center rounded-md ${positivo === false ? 'bg-danger-100' : 'bg-danger-50'}`}>
          <Icon className={`h-4 w-4 ${positivo === false ? 'text-danger' : 'text-brand'}`} aria-hidden />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-ink tabular-nums">{value}</p>
      </CardContent>
    </Card>
  )
}

// Tooltip compartido
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-chrome-200 bg-white px-3 py-2 text-sm shadow-card-lg">
      {label && <p className="text-chrome-600 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="font-bold text-ink">{p.name}: {formatPrecio(p.value)}</p>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-chrome-200 bg-white px-3 py-2 text-sm shadow-card-lg">
      <p className="text-ink">{payload[0].name}: <strong>{payload[0].value}%</strong></p>
    </div>
  )
}

export default function ReportesPage() {
  const [reporte, setReporte] = useState<ReporteVentas | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    getReporteVentas()
      .then(setReporte)
      .finally(() => setCargando(false))
  }, [])

  // Días con al menos una venta en el mes
  const diasActivos = reporte?.mes.porDia.filter((d) => d.monto > 0).length ?? 0

  // Ticket promedio por día activo
  const ticketPromedio = diasActivos > 0
    ? (reporte?.mes.montoTotal ?? 0) / diasActivos
    : 0

  // Mejor día del mes
  const mejorDia = reporte?.mes.porDia.reduce<{ fecha: string; monto: number } | null>(
    (best, d) => (d.monto > (best?.monto ?? 0) ? d : best),
    null
  ) ?? null

  // Agrupar días del mes por semana para el bar chart
  const ventasPorSemana = reporte?.mes.porDia.reduce<{ semana: string; monto: number }[]>(
    (acc, item, i) => {
      const idx = Math.floor(i / 7)
      if (!acc[idx]) acc[idx] = { semana: `Sem ${idx + 1}`, monto: 0 }
      acc[idx].monto += item.monto
      return acc
    },
    []
  ) ?? []

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-display-sm text-ink">REPORTES</h1>
        <p className="text-sm text-muted-foreground mt-1">Análisis de ventas y rendimiento</p>
      </div>

      {/* Métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cargando ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-white border border-chrome-100"><CardContent className="pt-6"><div className="bg-chrome-200 animate-pulse h-16 w-full rounded" /></CardContent></Card>
          ))
        ) : (
          <>
            <MetricaCard title="Ventas este mes"    value={formatPrecio(reporte?.mes.montoTotal ?? 0)}  icon={DollarSign} />
            <MetricaCard title="Ticket prom. / día" value={formatPrecio(ticketPromedio)}                icon={TrendingUp} />
            <MetricaCard title="Días activos"       value={`${diasActivos} días`}                       icon={CalendarCheck} />
            <MetricaCard title="Mejor día del mes"
              value={mejorDia ? formatPrecio(mejorDia.monto) : '—'}
              icon={TrendingDown}
            />
          </>
        )}
      </div>

      {/* Gráficos fila 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Línea — ventas diarias */}
        <Card className="bg-white border-chrome-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-chrome-700">Ventas diarias (últimos 30 días)</CardTitle>
          </CardHeader>
          <CardContent>
            {cargando ? (
              <div className="bg-chrome-200 animate-pulse h-56 w-full rounded" />
            ) : (
              <ResponsiveContainer width="100%" height={224}>
                <LineChart data={reporte?.mes.porDia ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E3EAF1" vertical={false} />
                  <XAxis
                    dataKey="fecha"
                    tick={{ fill: '#64798C', fontSize: 10 }}
                    tickFormatter={(v: string) => formatFechaCorta(v)}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64798C', fontSize: 10 }}
                    tickFormatter={(v: number) => `S/.${(v / 1000).toFixed(0)}k`}
                    axisLine={false} tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone" dataKey="monto" name="Total"
                    stroke="#1C5372" strokeWidth={2.5} dot={false}
                    activeDot={{ r: 4, fill: '#0F3341' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Barras — ventas por semana */}
        <Card className="bg-white border-chrome-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-chrome-700">Ventas por semana</CardTitle>
          </CardHeader>
          <CardContent>
            {cargando ? (
              <div className="bg-chrome-200 animate-pulse h-56 w-full rounded" />
            ) : (
              <ResponsiveContainer width="100%" height={224}>
                <BarChart data={ventasPorSemana}>
                  <defs>
                    {/* Degradado metalizado para las barras */}
                    <linearGradient id="gradBarBrand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#26688C" />
                      <stop offset="100%" stopColor="#0F3341" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E3EAF1" vertical={false} />
                  <XAxis dataKey="semana" tick={{ fill: '#64798C', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fill: '#64798C', fontSize: 11 }}
                    tickFormatter={(v: number) => `S/.${(v / 1000).toFixed(0)}k`}
                    axisLine={false} tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="monto" name="Total" fill="url(#gradBarBrand)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráfico dona — métodos de pago */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-ink">Distribución por método de pago</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={MOCK_METODOS}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {MOCK_METODOS.map((_, i) => (
                    <Cell key={i} fill={COLORES_METODO[i % COLORES_METODO.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={10}
                  formatter={(v) => <span style={{ color: '#33485C', fontSize: 12 }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Tabla accesible como alternativa al gráfico */}
            <div className="min-w-[180px]" aria-label="Tabla de métodos de pago">
              <table className="w-full text-sm">
                <caption className="sr-only">Distribución de ventas por método de pago</caption>
                <thead>
                  <tr>
                    <th className="text-left text-xs text-chrome-700 pb-2">Método</th>
                    <th className="text-right text-xs text-chrome-700 pb-2">%</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_METODOS.map((m, i) => (
                    <tr key={m.name}>
                      <td className="py-1 flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ background: COLORES_METODO[i % COLORES_METODO.length] }}
                          aria-hidden
                        />
                        <span className="text-ink">{m.name}</span>
                      </td>
                      <td className="text-right tabular-nums text-ink">{m.value}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
