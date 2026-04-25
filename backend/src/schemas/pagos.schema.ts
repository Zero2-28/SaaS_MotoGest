import { z } from "zod";

// ============================================================================
// PAGO SCHEMAS
// ============================================================================

// Inicia un PaymentIntent de Stripe vinculado a una venta
export const crearIntentoPagoSchema = z.object({
  ventaId: z.number().int().positive("ID venta requerido"),
  monto: z.number().positive("Monto debe ser positivo"),
});

export type CrearIntentoPagoInput = z.infer<typeof crearIntentoPagoSchema>;
