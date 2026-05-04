import { Resend } from "resend";

// ============================================================================
// SETUP
// ============================================================================

// Instancia Resend bajo demanda para evitar error si la key no está configurada
const getResend = (): Resend => {
  const key = process.env.RESEND_API_KEY;
  if (!key || key === "re_your_resend_api_key_here") {
    throw new Error("RESEND_API_KEY no configurado");
  }
  return new Resend(key);
};

const FROM = "MOTOGEST PRO <onboarding@resend.dev>";
const ROJO = "#CC0000";
const NARANJA = "#FF6B00";

// ============================================================================
// LAYOUT HTML
// ============================================================================

// Envuelve el contenido en el layout base de la marca
const wrapHtml = (titulo: string, contenido: string): string => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${titulo}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
        style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:${ROJO};padding:24px 32px;">
            <span style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:1px;">MOTOGEST</span>
            <span style="color:${NARANJA};font-size:22px;font-weight:bold;"> PRO</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h2 style="color:#1a1a1a;margin:0 0 16px;font-size:20px;">${titulo}</h2>
            ${contenido}
          </td>
        </tr>
        <tr>
          <td style="background:#f9f9f9;padding:16px 32px;border-top:1px solid #e0e0e0;">
            <p style="color:#aaa;font-size:12px;margin:0;">
              Correo generado automáticamente por MOTOGEST PRO. No responder a este correo.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ============================================================================
// FUNCIONES DE EMAIL
// ============================================================================

// Email de bienvenida al registrarse un cliente nuevo
export const enviarBienvenidaCliente = async (cliente: {
  nombre: string;
  email: string;
}): Promise<void> => {
  const resend = getResend();
  const contenido = `
    <p style="color:#444;font-size:15px;line-height:1.6;">
      Hola <strong>${cliente.nombre}</strong>,
    </p>
    <p style="color:#444;font-size:15px;line-height:1.6;">
      ¡Bienvenido a MOTOGEST PRO! Tu cuenta ha sido creada exitosamente.
      Ya puedes iniciar sesión y realizar tus pedidos desde nuestra plataforma.
    </p>
    <div style="margin:24px 0;">
      <span style="background:${NARANJA};color:#fff;padding:12px 24px;border-radius:4px;
        font-weight:bold;font-size:14px;display:inline-block;">
        ¡Empieza a comprar!
      </span>
    </div>
    <p style="color:#888;font-size:13px;">Si no creaste esta cuenta, ignora este correo.</p>
  `;
  await resend.emails.send({
    from: FROM,
    to: cliente.email,
    subject: "¡Bienvenido a MOTOGEST PRO!",
    html: wrapHtml("¡Tu cuenta está lista!", contenido),
  });
};

// Confirmación de pedido al crearse con código CT-YYYY-XXXX
export const enviarConfirmacionPedido = async (
  pedido: {
    codigoPedido: string;
    total: number;
    observaciones?: string | null;
  },
  cliente: { nombre: string; email: string }
): Promise<void> => {
  const resend = getResend();
  const contenido = `
    <p style="color:#444;font-size:15px;line-height:1.6;">
      Hola <strong>${cliente.nombre}</strong>,
    </p>
    <p style="color:#444;font-size:15px;line-height:1.6;">
      Hemos recibido tu pedido correctamente. Aquí tienes los detalles:
    </p>
    <table width="100%" cellpadding="10" cellspacing="0"
      style="border:1px solid #e0e0e0;border-radius:4px;margin:16px 0;">
      <tr style="background:#f5f5f5;">
        <td style="color:#888;font-size:13px;width:40%;">Código de pedido</td>
        <td style="color:#1a1a1a;font-weight:bold;font-size:15px;">${pedido.codigoPedido}</td>
      </tr>
      <tr>
        <td style="color:#888;font-size:13px;">Total</td>
        <td style="color:${ROJO};font-weight:bold;font-size:15px;">S/ ${pedido.total.toFixed(2)}</td>
      </tr>
      ${
        pedido.observaciones
          ? `<tr style="background:#f5f5f5;">
               <td style="color:#888;font-size:13px;">Notas</td>
               <td style="color:#444;font-size:13px;">${pedido.observaciones}</td>
             </tr>`
          : ""
      }
    </table>
    <p style="color:#444;font-size:14px;line-height:1.6;">
      Puedes rastrear tu pedido usando el código
      <strong style="color:${ROJO};">${pedido.codigoPedido}</strong> en nuestra plataforma.
    </p>
  `;
  await resend.emails.send({
    from: FROM,
    to: cliente.email,
    subject: `Pedido confirmado: ${pedido.codigoPedido}`,
    html: wrapHtml("Pedido recibido", contenido),
  });
};

export const enviarCambioEstadoPedido = async (
  pedido: { codigoPedido: string; estado: string },
  cliente: { nombre: string; email: string },
  estadoAnterior: string
): Promise<void> => {
  const resend = getResend();
  const frontendUrl = process.env.FRONTEND_URL ?? "https://motogest.pro";

  const etiquetas: Record<string, string> = {
    pendiente:   "Pendiente",
    confirmado:  "Confirmado",
    preparando:  "En preparación",
    listo:       "Listo para recoger",
    en_transito: "En tránsito",
    entregado:   "Entregado",
    cancelado:   "Cancelado",
  };

  const colores: Record<string, string> = {
    pendiente:   "#9CA3AF",
    confirmado:  "#3B82F6",
    preparando:  "#FF6B00",
    listo:       "#EAB308",
    en_transito: "#1D4ED8",
    entregado:   "#22C55E",
    cancelado:   ROJO,
  };

  const estadoLabel   = etiquetas[pedido.estado]   ?? pedido.estado;
  const anteriorLabel = etiquetas[estadoAnterior]  ?? estadoAnterior;
  const badgeColor    = colores[pedido.estado]     ?? "#9CA3AF";

  const mensajeExtra = ((): string => {
    if (pedido.estado === "entregado") {
      return `<p style="color:#22C55E;font-weight:bold;font-size:15px;margin:12px 0;">
        ¡Tu pedido ha sido entregado!<br/>
        <span style="color:#444;font-weight:normal;font-size:14px;">Gracias por comprar en CALLE TUNING</span>
      </p>`;
    }
    if (pedido.estado === "preparando") {
      return `<p style="color:#444;font-size:14px;line-height:1.6;margin:12px 0;">
        Estamos preparando tu pedido con cuidado.<br/>
        Te notificaremos cuando esté listo.
      </p>`;
    }
    if (pedido.estado === "listo" || pedido.estado === "en_transito") {
      return `<p style="color:#444;font-size:14px;line-height:1.6;margin:12px 0;">
        Tu pedido está en camino.<br/>
        Puedes rastrearlo en tiempo real usando el botón de abajo.
      </p>`;
    }
    return "";
  })();

  const rastreoUrl = `${frontendUrl}/rastreo?codigo=${pedido.codigoPedido}`;

  const contenido = `
    <p style="color:#444;font-size:15px;line-height:1.6;">
      Hola <strong>${cliente.nombre}</strong>,
    </p>
    <p style="color:#444;font-size:15px;line-height:1.6;">
      Tu pedido <strong style="color:${ROJO};">${pedido.codigoPedido}</strong> ha sido actualizado.
    </p>

    <table cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td style="background:#f0f0f0;color:#888;padding:10px 18px;border-radius:4px;
          font-size:14px;">${anteriorLabel}</td>
        <td style="padding:0 12px;color:#aaa;font-size:18px;">→</td>
        <td style="background:${badgeColor};color:#fff;padding:12px 22px;border-radius:20px;
          font-size:15px;font-weight:bold;">${estadoLabel}</td>
      </tr>
    </table>

    ${mensajeExtra}

    <div style="margin:24px 0;">
      <a href="${rastreoUrl}"
        style="background:${ROJO};color:#fff;padding:13px 28px;border-radius:6px;
          font-weight:bold;font-size:14px;text-decoration:none;display:inline-block;">
        Rastrear mi pedido
      </a>
    </div>

    <hr style="border:none;border-top:1px solid #f0f0f0;margin:20px 0;" />
    <p style="color:#aaa;font-size:12px;margin:0;">
      CALLE TUNING — Jr. Lima 123, Ayacucho, Perú
    </p>
  `;

  await resend.emails.send({
    from: FROM,
    to: cliente.email,
    subject: `Tu pedido ${pedido.codigoPedido} está: ${estadoLabel}`,
    html: wrapHtml("Actualización de pedido", contenido),
  });
};

// Email de confirmación de compra online (se envía cuando Stripe confirma el pago)
export const enviarCompraCompletadaCliente = async (
  venta: {
    numeroVenta: string;
    total: number;
    detalles: Array<{
      cantidad: number;
      precioUnitario: number;
      subtotal: number;
      producto: { nombre: string };
    }>;
  },
  cliente: { nombre: string; email: string },
  codigoPedido: string | null,
  direccionEntrega: string | null
): Promise<void> => {
  const resend = getResend();
  const frontendUrl = process.env.FRONTEND_URL ?? "https://motogest.pro";

  const filas = venta.detalles
    .map(
      (d) => `
      <tr>
        <td style="padding:8px 10px;font-size:13px;color:#444;border-bottom:1px solid #f0f0f0;">
          ${d.producto.nombre}
        </td>
        <td style="padding:8px 10px;font-size:13px;color:#444;text-align:center;
          border-bottom:1px solid #f0f0f0;">${d.cantidad}</td>
        <td style="padding:8px 10px;font-size:13px;color:#444;text-align:right;
          border-bottom:1px solid #f0f0f0;">S/ ${d.precioUnitario.toFixed(2)}</td>
        <td style="padding:8px 10px;font-size:13px;font-weight:bold;color:#1a1a1a;
          text-align:right;border-bottom:1px solid #f0f0f0;">
          S/ ${d.subtotal.toFixed(2)}
        </td>
      </tr>`
    )
    .join("");

  const rastreoUrl = codigoPedido
    ? `${frontendUrl}/rastreo?codigo=${codigoPedido}`
    : `${frontendUrl}/rastreo`;

  const contenido = `
    <p style="color:#444;font-size:15px;line-height:1.6;">
      Hola <strong>${cliente.nombre}</strong>,
    </p>
    <p style="color:#444;font-size:15px;line-height:1.6;">
      ¡Tu compra fue confirmada exitosamente! Aquí tienes el resumen:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0"
      style="border:1px solid #e0e0e0;border-radius:4px;margin:16px 0;overflow:hidden;">
      <thead>
        <tr style="background:${ROJO};">
          <th style="padding:10px;color:#fff;text-align:left;font-size:12px;">Producto</th>
          <th style="padding:10px;color:#fff;text-align:center;font-size:12px;">Cant.</th>
          <th style="padding:10px;color:#fff;text-align:right;font-size:12px;">P. Unit.</th>
          <th style="padding:10px;color:#fff;text-align:right;font-size:12px;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
      <tfoot>
        <tr style="border-top:2px solid ${ROJO};">
          <td colspan="3" style="padding:12px 10px;text-align:right;font-weight:bold;font-size:14px;">
            TOTAL
          </td>
          <td style="padding:12px 10px;text-align:right;font-weight:bold;color:${ROJO};font-size:18px;">
            S/ ${venta.total.toFixed(2)}
          </td>
        </tr>
      </tfoot>
    </table>
    ${
      codigoPedido
        ? `<table width="100%" cellpadding="10" cellspacing="0"
             style="border:1px solid #e0e0e0;border-radius:4px;margin:16px 0;">
             <tr style="background:#f5f5f5;">
               <td style="color:#888;font-size:13px;width:40%;">Código de seguimiento</td>
               <td style="color:#1a1a1a;font-weight:bold;font-size:15px;font-family:monospace;">
                 ${codigoPedido}
               </td>
             </tr>
             ${
               direccionEntrega
                 ? `<tr>
                      <td style="color:#888;font-size:13px;">Dirección de entrega</td>
                      <td style="color:#444;font-size:13px;">${direccionEntrega}</td>
                    </tr>`
                 : ""
             }
           </table>`
        : ""
    }
    <div style="margin:24px 0;">
      <a href="${rastreoUrl}"
        style="background:${ROJO};color:#fff;padding:13px 28px;border-radius:6px;
          font-weight:bold;font-size:14px;text-decoration:none;display:inline-block;">
        Rastrear mi pedido
      </a>
    </div>
    <p style="color:#888;font-size:12px;margin:4px 0;">
      N° Venta: <strong>${venta.numeroVenta}</strong>
    </p>
  `;

  await resend.emails.send({
    from: FROM,
    to: cliente.email,
    subject: `Compra confirmada${codigoPedido ? ` — ${codigoPedido}` : ""} — MOTOGEST PRO`,
    html: wrapHtml("¡Tu compra fue exitosa!", contenido),
  });
};

// Comprobante de venta con detalle de productos
export const enviarComprobanteVenta = async (
  venta: {
    numeroVenta: string;
    total: number;
    subtotal: number;
    descuento: number;
    metodoPago?: string | null;
    detalles: Array<{
      cantidad: number;
      precioUnitario: number;
      subtotal: number;
      producto: { nombre: string; codigo: string };
    }>;
  },
  cliente: { nombre: string; email: string }
): Promise<void> => {
  const resend = getResend();

  const filas = venta.detalles
    .map(
      (d) => `
      <tr>
        <td style="padding:8px 10px;font-size:13px;color:#444;border-bottom:1px solid #f0f0f0;">
          ${d.producto.nombre}
          <span style="color:#bbb;font-size:11px;display:block;">${d.producto.codigo}</span>
        </td>
        <td style="padding:8px 10px;font-size:13px;color:#444;text-align:center;
          border-bottom:1px solid #f0f0f0;">${d.cantidad}</td>
        <td style="padding:8px 10px;font-size:13px;color:#444;text-align:right;
          border-bottom:1px solid #f0f0f0;">S/ ${d.precioUnitario.toFixed(2)}</td>
        <td style="padding:8px 10px;font-size:13px;font-weight:bold;color:#1a1a1a;
          text-align:right;border-bottom:1px solid #f0f0f0;">
          S/ ${d.subtotal.toFixed(2)}
        </td>
      </tr>`
    )
    .join("");

  const contenido = `
    <p style="color:#444;font-size:15px;line-height:1.6;">
      Hola <strong>${cliente.nombre}</strong>, gracias por tu compra.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0"
      style="border:1px solid #e0e0e0;border-radius:4px;margin:16px 0;overflow:hidden;">
      <thead>
        <tr style="background:${ROJO};">
          <th style="padding:10px;color:#fff;text-align:left;font-size:12px;">Producto</th>
          <th style="padding:10px;color:#fff;text-align:center;font-size:12px;">Cant.</th>
          <th style="padding:10px;color:#fff;text-align:right;font-size:12px;">P. Unit.</th>
          <th style="padding:10px;color:#fff;text-align:right;font-size:12px;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
      <tfoot>
        ${
          venta.descuento > 0
            ? `<tr>
                 <td colspan="3" style="padding:8px 10px;text-align:right;color:#888;font-size:13px;">
                   Descuento
                 </td>
                 <td style="padding:8px 10px;text-align:right;color:${NARANJA};font-weight:bold;font-size:13px;">
                   -S/ ${venta.descuento.toFixed(2)}
                 </td>
               </tr>`
            : ""
        }
        <tr style="border-top:2px solid ${ROJO};">
          <td colspan="3" style="padding:12px 10px;text-align:right;font-weight:bold;font-size:14px;">
            TOTAL
          </td>
          <td style="padding:12px 10px;text-align:right;font-weight:bold;color:${ROJO};font-size:18px;">
            S/ ${venta.total.toFixed(2)}
          </td>
        </tr>
      </tfoot>
    </table>
    <p style="color:#888;font-size:12px;margin:4px 0;">
      N° Venta: <strong>${venta.numeroVenta}</strong>
      &nbsp;·&nbsp;
      Método de pago: <strong>${venta.metodoPago ?? "efectivo"}</strong>
    </p>
  `;
  await resend.emails.send({
    from: FROM,
    to: cliente.email,
    subject: `Comprobante de venta ${venta.numeroVenta} - MOTOGEST PRO`,
    html: wrapHtml("Comprobante de venta", contenido),
  });
};
