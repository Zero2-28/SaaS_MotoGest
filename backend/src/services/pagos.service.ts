import Stripe from "stripe";
import { Pago } from "@prisma/client";
import prisma from "../lib/prisma";
import { AppError } from "../lib/appError";
import { notificarAdminsService } from "./notificaciones.service";
import { enviarCompraCompletadaCliente } from "./email.service";

// ============================================================================
// HELPERS
// ============================================================================

// Instancia Stripe bajo demanda para evitar error si la key no está configurada
const getStripe = (): Stripe => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new AppError("STRIPE_SECRET_KEY no configurado", 500);
  return new Stripe(key, { apiVersion: "2023-10-16" });
};

// ============================================================================
// TYPES
// ============================================================================

export type ResumenMetodoPago = {
  metodoPago: string | null;
  cantidad: number;
  totalMonto: number;
};

// ============================================================================
// CREAR INTENTO DE PAGO
// ============================================================================

// Crea un PaymentIntent en Stripe y registra el pago en estado 'pendiente'
export const crearIntentoPagoService = async (input: {
  ventaId: number;
  monto: number;
}): Promise<{ clientSecret: string }> => {
  const venta = await prisma.venta.findUnique({ where: { id: input.ventaId } });
  if (!venta) throw new AppError("Venta no encontrada", 404);

  const stripe = getStripe();
  const intent = await stripe.paymentIntents.create({
    amount: Math.round(input.monto * 100), // Stripe trabaja en centavos
    currency: "pen",
    metadata: { ventaId: String(input.ventaId) },
    // Permite confirmar con pm_card_visa en tests sin necesitar return_url
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
  });

  if (!intent.client_secret) {
    throw new AppError("No se pudo crear el intento de pago", 500);
  }

  await prisma.pago.create({
    data: {
      ventaId: input.ventaId,
      stripePaymentId: intent.id,
      monto: input.monto,
      estado: "pendiente",
      metodoPago: "stripe",
      fechaPago: null,
    },
  });

  return { clientSecret: intent.client_secret };
};

// ============================================================================
// WEBHOOK STRIPE
// ============================================================================

// Verifica la firma del webhook y actualiza el estado del pago según el evento
export const procesarWebhookStripeService = async (input: {
  signature: string;
  payload: Buffer;
}): Promise<void> => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new AppError("STRIPE_WEBHOOK_SECRET no configurado", 500);

  const stripe = getStripe();

  // constructEvent lanza StripeSignatureVerificationError si la firma no coincide
  // → debe ser 400, no 500 (Stripe interpreta 500 como error del servidor y reintenta)
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(input.payload, input.signature, secret);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Firma Stripe inválida";
    throw new AppError(`Webhook inválido: ${msg}`, 400);
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    await prisma.pago.updateMany({
      where: { stripePaymentId: intent.id },
      data: { estado: "completado", fechaPago: new Date() },
    });

    const ventaIdStr = intent.metadata["ventaId"];

    // Fire-and-forget: notificar a admins del pago confirmado
    void notificarAdminsService({
      tipo: "pago_confirmado",
      titulo: "Pago confirmado por Stripe",
      mensaje: `Pago ${intent.id} confirmado.${ventaIdStr ? ` Venta ID: ${ventaIdStr}.` : ""} Monto: S/ ${(intent.amount / 100).toFixed(2)}.`,
    }).catch((err: unknown) => console.error("Error notificación pago confirmado:", err));

    // Fire-and-forget: email de compra completada al cliente
    if (ventaIdStr) {
      void (async () => {
        try {
          const venta = await prisma.venta.findUnique({
            where: { id: Number(ventaIdStr) },
            include: {
              cliente: { select: { nombre: true, email: true } },
              detalles: {
                include: { producto: { select: { nombre: true } } },
              },
            },
          });
          if (!venta?.cliente?.email) return;

          // Buscar el pedido CT asociado a este cliente creado cerca del momento de la venta
          const pedido = await prisma.pedido.findFirst({
            where: { clienteId: venta.clienteId ?? undefined },
            orderBy: { createdAt: "desc" },
            select: { codigoPedido: true, direccionEntrega: true },
          });

          await enviarCompraCompletadaCliente(
            {
              numeroVenta: venta.numeroVenta,
              total: Number(venta.total),
              detalles: venta.detalles.map((d) => ({
                cantidad: d.cantidad,
                precioUnitario: Number(d.precioUnitario),
                subtotal: Number(d.subtotal),
                producto: { nombre: d.producto.nombre },
              })),
            },
            { nombre: venta.cliente.nombre, email: venta.cliente.email },
            pedido?.codigoPedido ?? null,
            pedido?.direccionEntrega ?? null
          );
        } catch (err: unknown) {
          console.error("Error email compra completada:", err);
        }
      })();
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as Stripe.PaymentIntent;
    await prisma.pago.updateMany({
      where: { stripePaymentId: intent.id },
      data: { estado: "fallido" },
    });
  }
};

// ============================================================================
// DETALLE POR ID
// ============================================================================

export const getPagoByIdService = async (id: number): Promise<Pago> => {
  const pago = await prisma.pago.findUnique({ where: { id } });
  if (!pago) throw new AppError("Pago no encontrado", 404);
  return pago;
};

// ============================================================================
// RESUMEN POR MÉTODO DE PAGO (solo admin)
// ============================================================================

// Agrupa los pagos completados por metodoPago y devuelve conteo + monto total
export const getMetodosPagoService = async (): Promise<ResumenMetodoPago[]> => {
  const grupos = await prisma.pago.groupBy({
    by: ["metodoPago"],
    _count: { id: true },
    _sum: { monto: true },
    where: { estado: "completado" },
    orderBy: { _sum: { monto: "desc" } },
  });

  return grupos.map((g) => ({
    metodoPago: g.metodoPago,
    cantidad: g._count.id,
    totalMonto: g._sum.monto ?? 0,
  }));
};
