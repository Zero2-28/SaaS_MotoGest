# Pendientes del rebrand — rama `diseñoV2`

Cambios **no aplicados** a propósito. La rama es solo para ver el aspecto nuevo;
esto se toca cuando se confirme el cambio de marca y de local.

## 1. Backend — textos que ve el cliente

Siguen con la marca y la dirección antiguas. Otro deploy (Render), por eso no se
tocó junto con el frontend.

| Archivo | Línea | Dice ahora |
|---|---|---|
| `backend/src/services/email.service.ts` | 7 | remitente `MOTOGEST PRO <onboarding@resend.dev>` |
| `backend/src/services/email.service.ts` | 66 | remitente SendGrid por defecto `calletuning.ayacucho@gmail.com` |
| `backend/src/services/email.service.ts` | 98 | cabecera del correo: `MOTOGEST` |
| `backend/src/services/email.service.ts` | 111, 135, 148 | "MOTOGEST PRO" en pie y bienvenida |
| `backend/src/services/email.service.ts` | 235 | "Gracias por comprar en CALLE TUNING" |
| `backend/src/services/email.service.ts` | 285 | "CALLE TUNING — Jr. Lima 123, Ayacucho, Perú" |
| `backend/src/services/email.service.ts` | 401, 490 | asuntos con "MOTOGEST PRO" |
| `backend/src/services/comprobante.service.ts` | 35 | título del PDF "MOTOGEST PRO", **en rojo** (`ROJO`) |
| `backend/src/services/comprobante.service.ts` | 36 | "Ayacucho, Perú" |
| `backend/src/services/comprobante.service.ts` | 181 | pie "MOTOGEST PRO — Documento generado automáticamente" |
| `backend/src/services/email.service.ts` | 205, 312 | `FRONTEND_URL` por defecto `https://motogest.pro` |

Al actualizar el PDF, aprovechar para pasar el rojo al azul metalizado
(`#0F3341`) y que cuadre con el frontend.

## 2. Datos de la tienda — supuestos a confirmar

Están en `frontend/src/config/tienda.ts` (fuente única).

- **Email:** puesto `contacto@remotos.pe`, **ficticio**, solo para maquetar.
  Se muestra en el footer, visible en todas las páginas públicas, y es un
  `mailto:` real: sustituirlo por el correo de la tienda antes de publicar.
- **Zona de reparto:** se puso "Envíos en 24h dentro del Callao" (banner de la
  landing y lista de "por qué elegirnos"). Confirmar si también llega a Lima.
- **Distritos del checkout:** se cargaron los 7 de la Provincia Constitucional
  del Callao (`frontend/src/pages/public/PagoPage.tsx`). Son la provincia
  entera, no necesariamente la zona de reparto real.

## 3. Logo

El SVG de Supabase (`motogest-logo/remotos_v2.svg`) trae una placa `#111111`
dentro del propio archivo. Sobre fondo blanco se ve como un recuadro oscuro.
Pendiente: subir una variante con fondo transparente al bucket.

## 4. Nombre del sistema

"MotoGest Pro" sigue siendo el nombre interno del sistema (repo, comentarios de
código, `backend/src/index.ts`). "RE MOTOS" es la marca de cara al cliente.
Confirmar si el nombre interno también cambia.

Los buckets de Supabase (`motogest-logo`, `motogest-carousel`, …) **no se
renombran**: romperían todas las URLs de imágenes.
