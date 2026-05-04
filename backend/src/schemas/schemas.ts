import { z } from "zod";

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Contraseña mínimo 6 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const createUsuarioSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Contraseña mínimo 8 caracteres"),
  rolId: z.number().int().positive("ID de rol inválido"),
  sucursalId: z.number().int().positive().optional(),
});

export type CreateUsuarioInput = z.infer<typeof createUsuarioSchema>;

// ============================================================================
// PRODUCTO SCHEMAS
// ============================================================================

export const createProductoSchema = z.object({
  codigo: z.string().min(1, "Código requerido"),
  nombre: z.string().min(1, "Nombre requerido"),
  descripcion: z.string().optional(),
  imagen_url: z.string().url().optional().nullable(),
  categoriaId: z.number().int().positive("Categoría requerida"),
  precioCompra: z.number().positive("Precio de compra debe ser positivo"),
  precioVenta: z.number().positive("Precio de venta debe ser positivo"),
});

export type CreateProductoInput = z.infer<typeof createProductoSchema>;

export const updateProductoSchema = createProductoSchema.partial().extend({
  activo: z.boolean().optional(),
});

export type UpdateProductoInput = z.infer<typeof updateProductoSchema>;

// ============================================================================
// CLIENTE SCHEMAS
// ============================================================================

export const createClienteSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  email: z.string().email("Email inválido").optional(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  ciudad: z.string().optional(),
  tipoDocumento: z.string().optional(),
  numeroDocumento: z.string().optional(),
});

export type CreateClienteInput = z.infer<typeof createClienteSchema>;
export const updateClienteSchema = createClienteSchema.partial().extend({
  activo: z.boolean().optional(),
});
export type UpdateClienteInput = z.infer<typeof updateClienteSchema>;

// ============================================================================
// CLIENTE AUTH SCHEMAS
// ============================================================================

export const clienteRegisterSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Contraseña mínimo 6 caracteres"),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  ciudad: z.string().optional(),
  tipoDocumento: z.string().optional(),
  numeroDocumento: z.string().optional(),
});

export const clienteLoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Contraseña mínimo 6 caracteres"),
});

// ============================================================================
// CATEGORIA SCHEMAS
// ============================================================================

export const createCategoriaSchema = z.object({
  nombre:      z.string().min(1, "Nombre requerido"),
  descripcion: z.string().optional(),
  imagen_url:  z.string().url().optional().nullable(),
});
export type CreateCategoriaInput = z.infer<typeof createCategoriaSchema>;
export const updateCategoriaSchema = createCategoriaSchema.partial();
export type UpdateCategoriaInput = z.infer<typeof updateCategoriaSchema>;

// ============================================================================
// PROVEEDOR SCHEMAS
// ============================================================================

export const createProveedorSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  email: z.string().email("Email inválido").optional(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  tipoDocumento: z.string().optional(),
  numeroDocumento: z.string().optional(),
  contacto: z.string().optional(),
});
export type CreateProveedorInput = z.infer<typeof createProveedorSchema>;
export const updateProveedorSchema = createProveedorSchema.partial().extend({
  activo: z.boolean().optional(),
});
export type UpdateProveedorInput = z.infer<typeof updateProveedorSchema>;

// ============================================================================
// SUCURSAL SCHEMAS
// ============================================================================

export const createSucursalSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  ubicacion: z.string().min(1, "Ubicación requerida"),
  telefono: z.string().optional(),
});
export type CreateSucursalInput = z.infer<typeof createSucursalSchema>;
export const updateSucursalSchema = createSucursalSchema.partial();
export type UpdateSucursalInput = z.infer<typeof updateSucursalSchema>;

// ============================================================================
// USUARIO UPDATE SCHEMA
// ============================================================================

export const updateUsuarioSchema = createUsuarioSchema.partial().extend({
  activo: z.boolean().optional(),
});
export type UpdateUsuarioInput = z.infer<typeof updateUsuarioSchema>;

// ============================================================================
// VENTA SCHEMAS
// ============================================================================

export const createVentaSchema = z.object({
  clienteId: z.number().int().positive().optional(),
  sucursalId: z.number().int().positive("Sucursal requerida"),
  detalles: z
    .array(
      z.object({
        productoId: z.number().int().positive(),
        cantidad: z.number().int().positive(),
        precioUnitario: z.number().positive(),
      })
    )
    .min(1, "Al menos un detalle requerido"),
  descuento: z.number().min(0).optional(),
  metodoPago: z.enum(["efectivo", "tarjeta", "transferencia"]).optional(),
  direccionEntrega: z.string().optional(),
});

export type CreateVentaInput = z.infer<typeof createVentaSchema>;

// ============================================================================
// PROMOCION SCHEMAS
// ============================================================================

export const createPromocionSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  descripcion: z.string().optional(),
  tipoDescuento: z.string().min(1, "Tipo requerido"),
  valor: z.number().positive("Valor requerido"),
  fechaInicio: z.coerce.date(),
  fechaFin: z.coerce.date(),
  activa: z.boolean().optional(),
});
export type CreatePromocionInput = z.infer<typeof createPromocionSchema>;
export const updatePromocionSchema = createPromocionSchema.partial();
export type UpdatePromocionInput = z.infer<typeof updatePromocionSchema>;

// ============================================================================
// PEDIDO SCHEMAS
// ============================================================================

export const createPedidoSchema = z.object({
  clienteId: z.number().int().positive("Cliente requerido"),
  detalles: z
    .array(
      z.object({
        productoId: z.number().int().positive(),
        cantidad: z.number().int().positive(),
      })
    )
    .min(1, "Al menos un producto requerido"),
  observaciones: z.string().optional(),
});

export type CreatePedidoInput = z.infer<typeof createPedidoSchema>;
export const updatePedidoEstadoSchema = z.object({
  estado: z.enum([
    "pendiente",
    "confirmado",
    "preparando",
    "listo",
    "en_transito",
    "entregado",
    "cancelado",
  ]),
  comentario: z.string().optional(),
  repartidorId: z.number().int().positive().optional(),
});
export type UpdatePedidoEstadoInput = z.infer<typeof updatePedidoEstadoSchema>;

// ============================================================================
// DEVOLUCIÓN SCHEMAS
// ============================================================================

export const createDevolucionSchema = z.object({
  ventaId: z.number().int().positive("Venta requerida"),
  motivo: z.string().min(1, "Motivo requerido"),
  detalles: z
    .array(
      z.object({
        productoId: z.number().int().positive(),
        cantidad: z.number().int().positive(),
      })
    )
    .min(1, "Al menos un producto requerido"),
  observaciones: z.string().optional(),
});

export type CreateDevolucionInput = z.infer<typeof createDevolucionSchema>;
export const updateDevolucionEstadoSchema = z.object({
  estado: z.enum(["pendiente", "aprobada", "rechazada"]),
});
export type UpdateDevolucionEstadoInput = z.infer<typeof updateDevolucionEstadoSchema>;

// ============================================================================
// INVENTARIO SCHEMAS
// ============================================================================

export const inventarioAjusteSchema = z.object({
  productoId: z.number().int().positive("Producto requerido"),
  sucursalId: z.number().int().positive("Sucursal requerida"),
  cantidad: z.number().int().refine((value) => value !== 0, "Cantidad inválida"),
  motivo: z.string().optional(),
});

export type InventarioAjusteInput = z.infer<typeof inventarioAjusteSchema>;

// ============================================================================
// NOTIFICACION SCHEMAS
// ============================================================================

export const createNotificacionSchema = z.object({
  usuarioId: z.number().int().positive("Usuario requerido"),
  tipo: z.string().min(1).optional().default("general"),
  titulo: z.string().min(1, "Título requerido"),
  mensaje: z.string().min(1, "Mensaje requerido"),
});
export type CreateNotificacionInput = z.infer<typeof createNotificacionSchema>;
