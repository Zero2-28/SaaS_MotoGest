import PDFDocument from "pdfkit";
import prisma from "../lib/prisma";
import { AppError } from "../lib/appError";

// Genera un Buffer con el PDF del comprobante de venta
export const generarComprobantePdfService = async (
  ventaId: number
): Promise<Buffer> => {
  const venta = await prisma.venta.findUnique({
    where: { id: ventaId },
    include: {
      cliente: { select: { nombre: true, email: true } },
      sucursal: { select: { nombre: true } },
      detalles: {
        include: { producto: { select: { nombre: true, codigo: true } } },
      },
    },
  });

  if (!venta) throw new AppError("Venta no encontrada", 404);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const ROJO = "#CC0000";
    const GRIS = "#666666";
    const NEGRO = "#111111";

    // ── Encabezado ─────────────────────────────────────────────────────────
    doc.fontSize(20).fillColor(ROJO).font("Helvetica-Bold").text("MOTOGEST PRO", 50, 50);
    doc.fontSize(10).fillColor(GRIS).font("Helvetica").text("Ayacucho, Perú", 50, 75);

    // Número de venta + fecha (derecha)
    doc
      .fontSize(10)
      .fillColor(NEGRO)
      .font("Helvetica-Bold")
      .text(`N° ${venta.numeroVenta}`, 350, 50, { width: 200, align: "right" });
    doc
      .fontSize(9)
      .fillColor(GRIS)
      .font("Helvetica")
      .text(
        new Date(venta.createdAt).toLocaleDateString("es-PE", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
        350,
        65,
        { width: 200, align: "right" }
      );

    // Línea separadora
    doc.moveTo(50, 100).lineTo(545, 100).strokeColor("#DDDDDD").lineWidth(1).stroke();

    // ── Cliente y sucursal ─────────────────────────────────────────────────
    let y = 115;
    if (venta.cliente) {
      doc.fontSize(9).fillColor(GRIS).font("Helvetica").text("Cliente:", 50, y);
      doc
        .fontSize(10)
        .fillColor(NEGRO)
        .font("Helvetica-Bold")
        .text(venta.cliente.nombre, 50, y + 12);
      if (venta.cliente.email) {
        doc
          .fontSize(9)
          .fillColor(GRIS)
          .font("Helvetica")
          .text(venta.cliente.email, 50, y + 25);
      }
    }

    doc
      .fontSize(9)
      .fillColor(GRIS)
      .font("Helvetica")
      .text("Sucursal:", 350, y, { width: 200, align: "right" });
    doc
      .fontSize(10)
      .fillColor(NEGRO)
      .font("Helvetica-Bold")
      .text(venta.sucursal?.nombre ?? "Principal", 350, y + 12, {
        width: 200,
        align: "right",
      });

    // ── Tabla de productos ─────────────────────────────────────────────────
    y = 175;
    doc.moveTo(50, y).lineTo(545, y).strokeColor("#DDDDDD").stroke();
    y += 8;

    // Cabeceras
    doc.fontSize(9).fillColor(GRIS).font("Helvetica-Bold");
    doc.text("Producto", 50, y);
    doc.text("Cód.", 280, y);
    doc.text("Cant.", 330, y, { width: 40, align: "center" });
    doc.text("P.Unit.", 380, y, { width: 70, align: "right" });
    doc.text("Subtotal", 460, y, { width: 80, align: "right" });

    y += 14;
    doc.moveTo(50, y).lineTo(545, y).strokeColor("#EEEEEE").stroke();

    // Filas
    doc.font("Helvetica").fontSize(9).fillColor(NEGRO);
    for (const det of venta.detalles) {
      y += 6;
      doc.text(det.producto.nombre, 50, y, { width: 225, lineBreak: false });
      doc.text(det.producto.codigo, 280, y, { width: 45, lineBreak: false });
      doc.text(String(det.cantidad), 330, y, {
        width: 40,
        align: "center",
        lineBreak: false,
      });
      doc.text(`S/ ${Number(det.precioUnitario).toFixed(2)}`, 380, y, {
        width: 70,
        align: "right",
        lineBreak: false,
      });
      doc.text(`S/ ${Number(det.subtotal).toFixed(2)}`, 460, y, {
        width: 80,
        align: "right",
      });
      y += 14;
      doc
        .moveTo(50, y)
        .lineTo(545, y)
        .strokeColor("#F5F5F5")
        .stroke();
    }

    // ── Totales ────────────────────────────────────────────────────────────
    y += 10;
    doc.moveTo(350, y).lineTo(545, y).strokeColor("#DDDDDD").stroke();
    y += 8;

    if (Number(venta.descuento) > 0) {
      doc.fontSize(9).fillColor(GRIS).font("Helvetica");
      doc.text("Descuento:", 350, y, { width: 100 });
      doc.text(`-S/ ${Number(venta.descuento).toFixed(2)}`, 460, y, {
        width: 80,
        align: "right",
      });
      y += 16;
    }

    doc
      .fontSize(12)
      .fillColor(ROJO)
      .font("Helvetica-Bold")
      .text("TOTAL:", 350, y, { width: 100 });
    doc.text(`S/ ${Number(venta.total).toFixed(2)}`, 460, y, {
      width: 80,
      align: "right",
    });

    y += 20;
    doc
      .fontSize(9)
      .fillColor(GRIS)
      .font("Helvetica")
      .text(
        `Método de pago: ${venta.metodoPago ?? "efectivo"}`,
        350,
        y,
        { width: 190, align: "right" }
      );

    // ── Pie de página ──────────────────────────────────────────────────────
    doc
      .fontSize(8)
      .fillColor(GRIS)
      .font("Helvetica")
      .text(
        "MOTOGEST PRO — Documento generado automáticamente",
        50,
        doc.page.height - 60,
        { align: "center", width: 495 }
      );

    doc.end();
  });
};
