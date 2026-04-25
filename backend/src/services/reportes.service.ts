import prisma from "../lib/prisma";

// ============================================================================
// TYPES
// ============================================================================

export type ReporteVentas = {
  periodo: { desde: Date | null; hasta: Date | null };
  totalVentas: number;
  ingresosBrutos: number;
  descuentos: number;
  ingresosNetos: number;
  promedioVenta: number;
};

export type ProductoTop = {
  productoId: number;
  codigo: string;
  nombre: string;
  cantidadVendida: number;
  totalMonto: number;
};

export type InventarioBajoItem = {
  productoId: number;
  codigo: string;
  nombre: string;
  sucursalId: number;
  sucursal: string;
  stockActual: number;
  stockMinimo: number;
};

export type ReporteCompras = {
  periodo: { desde: Date | null; hasta: Date | null };
  totalCompras: number;
  totalGastado: number;
  porEstado: Record<string, number>;
};

export type VentaSucursal = {
  sucursalId: number;
  nombre: string;
  totalVentas: number;
  ingresos: number;
};

export type ReporteDevoluciones = {
  periodo: { desde: Date | null; hasta: Date | null };
  totalDevoluciones: number;
  montoDevuelto: number;
  porEstado: Record<string, number>;
};

// ============================================================================
// HELPERS
// ============================================================================

const buildDateFilter = (input: { from?: Date; to?: Date }) => {
  if (!input.from && !input.to) return undefined;
  return { gte: input.from, lte: input.to };
};

// ============================================================================
// 1. RESUMEN DE VENTAS
// ============================================================================

// Totales financieros del período: ingresos brutos, descuentos, neto y promedio
export const reporteVentasService = async (input: {
  from?: Date;
  to?: Date;
}): Promise<ReporteVentas> => {
  const dateFilter = buildDateFilter(input);
  const where = dateFilter ? { fechaVenta: dateFilter } : {};

  const agg = await prisma.venta.aggregate({
    _sum: { subtotal: true, descuento: true, total: true },
    _count: { id: true },
    _avg: { total: true },
    where,
  });

  const totalVentas = agg._count.id;
  const promedioRaw = agg._avg.total ?? 0;

  return {
    periodo: { desde: input.from ?? null, hasta: input.to ?? null },
    totalVentas,
    ingresosBrutos: agg._sum.subtotal ?? 0,
    descuentos: agg._sum.descuento ?? 0,
    ingresosNetos: agg._sum.total ?? 0,
    promedioVenta: Math.round(promedioRaw * 100) / 100,
  };
};

// ============================================================================
// 2. PRODUCTOS MÁS VENDIDOS
// ============================================================================

// Top N productos por cantidad vendida en el período
export const reporteProductosTopService = async (input: {
  from?: Date;
  to?: Date;
  limit: number;
}): Promise<ProductoTop[]> => {
  const dateFilter = buildDateFilter(input);

  const grupos = await prisma.detalleVenta.groupBy({
    by: ["productoId"],
    _sum: { cantidad: true, subtotal: true },
    where: dateFilter ? { venta: { fechaVenta: dateFilter } } : undefined,
    orderBy: { _sum: { cantidad: "desc" } },
    take: input.limit,
  });

  if (grupos.length === 0) return [];

  const productoIds = grupos.map((g) => g.productoId);
  const productos = await prisma.producto.findMany({
    where: { id: { in: productoIds } },
    select: { id: true, nombre: true, codigo: true },
  });

  const productoMap = new Map(productos.map((p) => [p.id, p]));

  return grupos.map((g) => {
    const prod = productoMap.get(g.productoId);
    return {
      productoId: g.productoId,
      codigo: prod?.codigo ?? "",
      nombre: prod?.nombre ?? "",
      cantidadVendida: g._sum.cantidad ?? 0,
      totalMonto: g._sum.subtotal ?? 0,
    };
  });
};

// ============================================================================
// 3. INVENTARIO BAJO MÍNIMO
// ============================================================================

// Productos cuyo stock actual es menor al stockMinimo, filtrable por sucursal
export const reporteInventarioBajoService = async (input: {
  sucursalId?: number;
}): Promise<InventarioBajoItem[]> => {
  const items = await prisma.inventarioSucursal.findMany({
    where: input.sucursalId ? { sucursalId: input.sucursalId } : undefined,
    include: {
      producto: { select: { id: true, nombre: true, codigo: true } },
      sucursal: { select: { id: true, nombre: true } },
    },
  });

  // Prisma no soporta comparación entre columnas en where; filtramos en JS
  return items
    .filter((item) => item.cantidad < item.stockMinimo)
    .map((item) => ({
      productoId: item.productoId,
      codigo: item.producto.codigo,
      nombre: item.producto.nombre,
      sucursalId: item.sucursalId,
      sucursal: item.sucursal.nombre,
      stockActual: item.cantidad,
      stockMinimo: item.stockMinimo,
    }));
};

// ============================================================================
// 4. RESUMEN DE COMPRAS
// ============================================================================

// Gasto total en abastecimiento del período, desglosado por estado
export const reporteComprasService = async (input: {
  from?: Date;
  to?: Date;
}): Promise<ReporteCompras> => {
  const dateFilter = buildDateFilter(input);
  const where = dateFilter ? { fechaCompra: dateFilter } : {};

  const [agg, porEstadoRaw] = await Promise.all([
    prisma.compra.aggregate({
      _sum: { total: true },
      _count: { id: true },
      where,
    }),
    prisma.compra.groupBy({
      by: ["estado"],
      _count: { id: true },
      where,
    }),
  ]);

  const porEstado: Record<string, number> = {};
  for (const g of porEstadoRaw) {
    porEstado[g.estado] = g._count.id;
  }

  return {
    periodo: { desde: input.from ?? null, hasta: input.to ?? null },
    totalCompras: agg._count.id,
    totalGastado: agg._sum.total ?? 0,
    porEstado,
  };
};

// ============================================================================
// 5. VENTAS POR SUCURSAL
// ============================================================================

// Ingresos y cantidad de ventas agrupados por sucursal en el período
export const reporteVentasSucursalService = async (input: {
  from?: Date;
  to?: Date;
}): Promise<VentaSucursal[]> => {
  const dateFilter = buildDateFilter(input);
  const where = dateFilter ? { fechaVenta: dateFilter } : {};

  const grupos = await prisma.venta.groupBy({
    by: ["sucursalId"],
    _count: { id: true },
    _sum: { total: true },
    where,
    orderBy: { _sum: { total: "desc" } },
  });

  if (grupos.length === 0) return [];

  const sucursalIds = grupos.map((g) => g.sucursalId);
  const sucursales = await prisma.sucursal.findMany({
    where: { id: { in: sucursalIds } },
    select: { id: true, nombre: true },
  });

  const sucursalMap = new Map(sucursales.map((s) => [s.id, s]));

  return grupos.map((g) => ({
    sucursalId: g.sucursalId,
    nombre: sucursalMap.get(g.sucursalId)?.nombre ?? "",
    totalVentas: g._count.id,
    ingresos: g._sum.total ?? 0,
  }));
};

// ============================================================================
// 6. RESUMEN DE DEVOLUCIONES
// ============================================================================

// Monto devuelto y cantidad de devoluciones del período, desglosado por estado
export const reporteDevolucionesService = async (input: {
  from?: Date;
  to?: Date;
}): Promise<ReporteDevoluciones> => {
  const dateFilter = buildDateFilter(input);
  const where = dateFilter ? { fechaDevolucion: dateFilter } : {};

  const [agg, porEstadoRaw] = await Promise.all([
    prisma.devolucion.aggregate({
      _sum: { total: true },
      _count: { id: true },
      where,
    }),
    prisma.devolucion.groupBy({
      by: ["estado"],
      _count: { id: true },
      where,
    }),
  ]);

  const porEstado: Record<string, number> = {};
  for (const g of porEstadoRaw) {
    porEstado[g.estado] = g._count.id;
  }

  return {
    periodo: { desde: input.from ?? null, hasta: input.to ?? null },
    totalDevoluciones: agg._count.id,
    montoDevuelto: agg._sum.total ?? 0,
    porEstado,
  };
};
