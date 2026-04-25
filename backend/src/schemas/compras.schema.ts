import { z } from "zod";

// ============================================================================
// COMPRA SCHEMAS
// ============================================================================

export const createCompraSchema = z.object({
  proveedorId: z.number().int().positive("Proveedor requerido"),
  detalles: z
    .array(
      z.object({
        productoId: z.number().int().positive(),
        cantidad: z.number().int().positive(),
        precioUnitario: z.number().positive(),
      })
    )
    .min(1, "Al menos un detalle requerido"),
  observaciones: z.string().optional(),
});

export type CreateCompraInput = z.infer<typeof createCompraSchema>;

export const updateCompraEstadoSchema = z.object({
  estado: z.enum(["pendiente", "confirmado", "recibido", "cancelado"]),
  // Admin lo pasa en el body; vendedor usa su sucursalId del token
  sucursalId: z.number().int().positive().optional(),
});

export type UpdateCompraEstadoInput = z.infer<typeof updateCompraEstadoSchema>;
