# Sistema de diseño — MotoGest Pro v2 (azul metalizado)

Referencia rápida de los tokens y componentes de la rama `diseñoV2`.
Regla general: **no escribir hex sueltos en el JSX**. Todo color sale de un token.

## Paleta

### `brand` — azul oscuro metalizado (color principal)

Es un duotono intencional: el `900` es navy y el `800` petróleo. Esa diferencia
de matiz (217° vs 197°) a la misma luminosidad es lo que produce el brillo
metalizado cuando se combinan en un degradado; un solo tono se ve plano.

| Token | Hex | Uso |
|---|---|---|
| `brand-950` | `#060F1C` | fondo más profundo, franja inferior del footer |
| `brand-900` | `#0B2041` | navy — fondo oscuro, texto principal sobre claro |
| `brand-800` / `brand` | `#0F3341` | petróleo — color de marca, botones, foco |
| `brand-700` | `#15425A` | bordes y superficies elevadas en oscuro |
| `brand-600` | `#1C5372` | hover del primario, series de gráficos |
| `brand-500` | `#26688C` | acero medio |
| `brand-400` | `#3D87AC` | anillo de foco, enlaces sobre oscuro |
| `brand-300` | `#6BA8C8` | texto secundario sobre oscuro |
| `brand-200` | `#A3C9DD` | texto de cuerpo sobre oscuro |
| `brand-100` / `brand-50` | `#D3E5EF` / `#EEF5F9` | fondos tenues sobre claro |

### `chrome` — grises azulados (50 → 800)

Sustituyen a los `gray-*` de Tailwind. Bordes, textos secundarios y superficies
neutras. Tienen matiz frío para que no choquen con el azul.

### Otros

- `ink` `#0E1B2A` — texto principal (negro con matiz azul).
- `mist` `#F4F7FA` — fondo de página claro.
- `turbo` — naranja, acento cálido (ofertas, badge del carrito, ratings).
- `ember` — rojo del logo, reservado al acento de marca.
- `success` / `info` / `warning` / `danger` — estados. **El rojo ya solo
  significa error o destrucción**, nunca marca.

## Efecto metalizado

No es un color, son tres cosas juntas:

| Clase | Qué hace |
|---|---|
| `bg-metal` | chapa: degradado 160° `#15425A → #0F3341 → #0B2041` |
| `bg-metal-btn` / `bg-metal-btn-hv` | degradado vertical del botón primario y su hover |
| `shadow-metal` / `shadow-metal-lg` | filo interior claro arriba + sombra abajo |
| `edge-chrome` | hilo cromado de 1px que remata una superficie oscura |
| `sheen` | barrido de brillo diagonal al pasar el cursor |
| `text-gradient-brand` / `text-gradient-chrome` | títulos en degradado (claro y oscuro) |

`shadow-card` / `card-md` / `card-lg` son la escala de elevación sobre fondo
claro, con sombra azulada en vez de gris.

## Componentes

- **Button** — `default` (chapa metálica), `outline`, `secondary` (neutro claro),
  `steel` (neutro sobre oscuro), `ghost`, `ghost-dark`, `accent` (naranja),
  `destructive`, `link`.
- **Badge** — `default`, `metal`, `secondary`, `accent`, `outline`, estados de
  pedido (`pendiente`…`cancelado`) y de stock, todos con la tríada
  borde/fondo/texto del mismo token semántico.
- **Card**, **Dialog**, **Select**, **Toast** — superficie clara por defecto
  (antes eran oscuros y cada página los sobrescribía a mano).
- **Input** / `.field` — borde `chrome-200`, fondo `mist`, foco
  `border-brand` + `ring-2 ring-brand/20`. Mismo foco en todos los campos.

## Logo

`assets.logo` apunta a `motogest-logo/remotos_v2.svg` en Supabase Storage.
Es un lockup horizontal de 850×300 (≈2.83:1) con placa oscura propia, así que:

- `LOGO_RATIO` (exportado desde `src/config/assets.ts`) calcula el ancho a
  partir del alto y evita saltos de layout.
- No se le aplican filtros `brightness(0) invert(1)`: el v2 ya viene en claro.
- En el sidebar colapsado se recorta a 40×40 mostrando solo el engranaje
  (el cálculo del desplazamiento está comentado en `AdminLayout.tsx`).
