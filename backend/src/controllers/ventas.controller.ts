import { Request, Response } from "express";
import { z } from "zod";
import { createVentaSchema } from "../schemas/schemas";
import { AuthRequest } from "../middlewares/auth.middleware";
import { ClienteAuthRequest } from "../middlewares/clienteAuth.middleware";
import { toAppError } from "../lib/appError";
import {
  createVentaService,
  getVentaByIdService,
  listVentasService,
  reportesVentasService,
} from "../services/ventas.service";
import { crearIntentoPagoService } from "../services/pagos.service";
import { createPedidoDesdeVentaService } from "../services/pedidos.service";
import { generarComprobantePdfService } from "../services/comprobante.service";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

const sendSuccess = <T>(res: Response, data: T, statusCode = 200): void => {
  res.status(statusCode).json({ success: true, data } as ApiResponse<T>);
};

const sendError = (res: Response, message: string, statusCode = 400): void => {
  res.status(statusCode).json({ success: false, message } as ApiResponse);
};

const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID inválido"),
});

const listVentasQuerySchema = z.object({
  desde: z.coerce.date().optional(),
  hasta: z.coerce.date().optional(),
});

// GET /ventas
export const listVentas = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.rolId !== 1 && !req.sucursalId) {
      sendError(res, "Sucursal no asignada", 403);
      return;
    }

    const queryValidation = listVentasQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      sendError(res, `Validación fallida: ${queryValidation.error.errors[0].message}`);
      return;
    }

    const { desde, hasta } = queryValidation.data;
    const items = await listVentasService({
      sucursalId: req.rolId === 1 ? undefined : (req.sucursalId ?? undefined),
      desde,
      hasta,
    });

    sendSuccess(res, items);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

// GET /ventas/reportes — admin (todas) | vendedor (filtrado por su sucursal)
export const reportesVentas = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const sucursalId = req.rolId !== 1 ? (req.sucursalId ?? undefined) : undefined;
    const data = await reportesVentasService(sucursalId);
    sendSuccess(res, data);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

// GET /ventas/:id
export const getVentaById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const validation = idParamSchema.safeParse(req.params);
    if (!validation.success) {
      sendError(res, `Validación fallida: ${validation.error.errors[0].message}`);
      return;
    }
    const item = await getVentaByIdService(Number(validation.data.id));
    sendSuccess(res, item);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

// POST /ventas
export const createVenta = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.rolId) {
      sendError(res, "Usuario no autenticado", 401);
      return;
    }

    const validation = createVentaSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, `Validación fallida: ${validation.error.errors[0].message}`);
      return;
    }

    if (req.rolId !== 1 && req.sucursalId !== validation.data.sucursalId) {
      sendError(res, "Permiso denegado para esta sucursal", 403);
      return;
    }

    const item = await createVentaService(validation.data);
    sendSuccess(res, item, 201);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

// POST /ventas/checkout — para clientes autenticados (usa clienteAuthMiddleware)
// Crea la venta y el intento de pago Stripe en una sola respuesta para evitar
// que el cliente acceda directamente a /pagos/crear-intento (ruta de empleados)
export const createVentaCliente = async (
  req: ClienteAuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.clienteId) {
      sendError(res, "Cliente no autenticado", 401);
      return;
    }

    const validation = createVentaSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, `Validación fallida: ${validation.error.errors[0].message}`);
      return;
    }

    const venta = await createVentaService({
      ...validation.data,
      clienteId: req.clienteId,
    });

    const { clientSecret } = await crearIntentoPagoService({
      ventaId: venta.id,
      monto: venta.total,
    });

    // Crear pedido CT como registro de tracking — si falla no bloquea el checkout
    let codigoPedido: string | null = null;
    try {
      const pedido = await createPedidoDesdeVentaService({
        clienteId: req.clienteId,
        detalles: venta.detalles.map((d) => ({
          productoId: d.productoId,
          cantidad: d.cantidad,
        })),
        direccionEntrega: validation.data.direccionEntrega,
        ventaId: venta.id,
      });
      codigoPedido = pedido.codigoPedido;
    } catch (err: unknown) {
      console.error("Error creando pedido desde venta online:", err);
    }

    sendSuccess(res, { venta, clientSecret, codigoPedido }, 201);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

// ============================================================================
// GET /ventas/:id/comprobante — Descarga PDF del comprobante (admin/vendedor)
// ============================================================================

const idSchema = z.object({ id: z.string().regex(/^\d+$/, "ID inválido") });

export const descargarComprobante = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validation = idSchema.safeParse(req.params);
    if (!validation.success) {
      sendError(res, "ID de venta inválido");
      return;
    }
    // ?download=false → inline (abrir en navegador); cualquier otro valor → attachment
    const isDownload = req.query.download !== "false";
    const pdf = await generarComprobantePdfService(Number(validation.data.id));
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `${isDownload ? "attachment" : "inline"}; filename="comprobante-${validation.data.id}.pdf"`
    );
    res.send(pdf);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};
