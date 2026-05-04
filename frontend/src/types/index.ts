// ── Tipos globales MotoGest Pro ─────────────────────────────────────────────
// IDs numéricos — el backend usa Int en Prisma.
// Los servicios exponen number; las páginas los coercionan a string en URLs.

// ── Auth ─────────────────────────────────────────────────────────────────────

export type RolEmpleado = 'admin' | 'vendedor' | 'repartidor'

export interface Empleado {
  id: number
  nombre: string
  email: string
  rol: RolEmpleado
  sucursalId: number | null
  activo: boolean
  avatarUrl?: string | null
  createdAt: string
}

export interface Cliente {
  id: number
  nombre: string
  email: string | null
  telefono: string | null
  direccion: string | null
  ciudad: string | null
  tipoDocumento: string | null
  numeroDocumento: string | null
  avatarUrl?: string | null
  createdAt: string
}

export interface AuthEmpleadoResponse {
  token: string
  refreshToken: string
  empleado: Empleado
}

export interface AuthClienteResponse {
  token: string
  refreshToken: string
  cliente: Cliente
}

// ── Productos ─────────────────────────────────────────────────────────────────

export interface Categoria {
  id: number
  nombre: string
  descripcion: string | null
  imagen_url?: string | null
  activo?: boolean
}

export interface Proveedor {
  id: number
  nombre: string
  contacto: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  tipoDocumento: string | null
  numeroDocumento: string | null
  activo?: boolean
}

export interface Producto {
  id: number
  codigo: string
  nombre: string
  descripcion: string | null
  precioVenta: number
  categoriaId: number
  categoria: Categoria
  activo: boolean
  imagen_url?: string | null
  stock?: number          // cantidad disponible (opcional, según endpoint)
  createdAt: string
  updatedAt: string
}

// Respuesta paginada de listProductos del backend
export interface ProductoListResponse {
  items: Producto[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// ── Inventario ────────────────────────────────────────────────────────────────

export interface Sucursal {
  id: number
  nombre: string
  ubicacion: string
}

export interface StockItem {
  id: number
  productoId: number
  producto: Producto
  sucursalId: number
  sucursal: Sucursal
  cantidad: number
  stockMinimo: number
}

// El backend no devuelve criticidad — se computa en el frontend
export interface AlertaStock {
  id: number
  productoId: number
  producto: Producto
  sucursalId: number
  sucursal: Sucursal
  cantidad: number
  stockMinimo: number
}

// ── Ventas / TPV ──────────────────────────────────────────────────────────────

// Backend acepta solo estos tres métodos
export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia'

export interface ItemCarrito {
  producto: Producto
  cantidad: number
  precioUnitario: number
}

export interface DetalleVenta {
  productoId: number
  producto: { id: number; codigo: string; nombre: string }
  cantidad: number
  precioUnitario: number
  subtotal: number
}

export interface Venta {
  id: number
  numeroVenta: string
  clienteId: number | null
  cliente: { id: number; nombre: string; email: string } | null
  sucursalId: number
  sucursal: { id: number; nombre: string; ubicacion: string } | null
  detalles: DetalleVenta[]
  subtotal: number
  impuesto: number
  descuento: number
  total: number
  metodoPago: string | null
  estado: string
  fechaVenta?: string
}

// Snapshot de un ítem del carrito guardado en location.state tras un pago exitoso
export interface ProductoResumen {
  id: number
  nombre: string
  imagen_url: string | null
  cantidad: number
  precioUnitario: number
}

// Venta devuelta por GET /clientes/mis-compras (incluye imagen_url en producto)
export interface DetalleVentaCliente {
  productoId: number
  cantidad: number
  precioUnitario: number
  subtotal: number
  producto: { id: number; codigo: string; nombre: string; imagen_url: string | null }
}

// Pedido asociado que viene embebido en cada VentaCliente
export interface PedidoResumen {
  codigoPedido: string
  estado: string
  direccionEntrega: string | null
}

export interface VentaCliente extends Omit<Venta, 'detalles'> {
  detalles: DetalleVentaCliente[]
  pedido: PedidoResumen | null
}

// Respuesta de GET /ventas/reportes
export interface ReporteVentas {
  hoy: {
    totalVentas: number
    montoTotal: number
  }
  semana: {
    totalVentas: number
    montoTotal: number
    porDia: { fecha: string; ventas: number; monto: number }[]
  }
  mes: {
    totalVentas: number
    montoTotal: number
    porDia: { fecha: string; ventas: number; monto: number }[]
  }
}

// ── Pedidos ───────────────────────────────────────────────────────────────────

export type EstadoPedido =
  | 'pendiente'
  | 'confirmado'
  | 'preparando'
  | 'listo'
  | 'en_transito'
  | 'entregado'
  | 'cancelado'

export interface PedidoHistorial {
  estado: string
  fecha: string
  comentario: string | null
}

export interface Pedido {
  id: number
  codigoPedido: string
  clienteId: number
  cliente: { id: number; nombre: string; email: string }
  usuarioId?: number | null
  ventaId?: number | null
  repartidor?: { id: number; nombre: string } | null
  estado: EstadoPedido
  subtotal: number
  impuesto: number
  total: number
  observaciones: string | null
  direccionEntrega?: string | null
  historial: PedidoHistorial[]
  fechaPedido: string | null
  fechaEntrega: string | null
  createdAt?: string
  updatedAt?: string
}

export interface PedidoPublico {
  codigoPedido: string
  estado: string
  fechaPedido: string | null
  fechaEntrega: string | null
  total: number
  observaciones: string | null
  historial: PedidoHistorial[]
  direccionEntrega?: string | null
  repartidorNombre?: string | null
}

// ── Pagos ─────────────────────────────────────────────────────────────────────

export interface IntentoPago {
  clientSecret: string
  ventaId: string
  monto: number
}

// ── Compras ───────────────────────────────────────────────────────────────────

export type EstadoCompra = 'pendiente' | 'confirmado' | 'recibido' | 'cancelado'

export interface DetalleCompra {
  productoId: number
  producto: Producto
  cantidad: number
  precioUnitario: number
  subtotal: number
}

export interface Compra {
  id: number
  numeroCompra: string
  proveedorId: number
  proveedor: Proveedor
  detalles: DetalleCompra[]
  subtotal: number
  impuesto: number
  total: number
  estado: EstadoCompra
  observaciones: string | null
  createdAt: string
}

// ── Devoluciones ──────────────────────────────────────────────────────────────

export type EstadoDevolucion = 'pendiente' | 'aprobada' | 'rechazada'

export interface DetalleDevolucion {
  productoId: number
  producto: { id: number; nombre: string; codigo: string }
  cantidad: number
  precioUnitario: number
  subtotal: number
}

export interface Devolucion {
  id: number
  numeroDevolucion: string
  ventaId: number
  venta: { id: number; numeroVenta: string; sucursalId: number }
  motivo: string
  estado: EstadoDevolucion
  subtotal: number
  impuesto: number
  total: number
  observaciones: string | null
  detalles: DetalleDevolucion[]
  createdAt?: string
}

// ── Notificaciones ────────────────────────────────────────────────────────────

export type TipoNotificacion =
  | 'general'
  | 'stock_bajo'
  | 'pedido_nuevo'
  | 'pago_confirmado'

export interface Notificacion {
  id: string
  tipo: TipoNotificacion
  titulo: string
  mensaje: string
  leida: boolean
  createdAt: string
}

// ── Empleados (gestión admin) ────────────────────────────────────────────────
// Diferente de Empleado (auth): incluye rel. rol/sucursal expandidas desde el API.

export interface EmpleadoDetalle {
  id: number
  nombre: string
  email: string
  rolId: number
  rol: { id: number; name: string }        // backend devuelve 'name', no 'nombre'
  sucursalId: number | null
  sucursal: { id: number; nombre: string; ubicacion: string } | null
  activo: boolean
  avatar_url: string | null
  createdAt: string
}

// ── Helpers de UI ─────────────────────────────────────────────────────────────

/** Respuesta genérica paginada del backend (donde aplique) */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  pagina: number
  limite: number
}

/** Respuesta de error del backend */
export interface ApiError {
  message: string
  statusCode: number
}
