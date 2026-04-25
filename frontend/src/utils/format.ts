/** Formatea un número como precio en Soles peruanos */
export function formatPrecio(monto: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(monto)
}

/** Formatea una fecha ISO a formato legible en español */
export function formatFecha(iso: string): string {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

/** Formatea una fecha ISO solo como fecha (sin hora) */
export function formatFechaCorta(iso: string): string {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}

/** Trunca un texto a maxChars caracteres añadiendo ellipsis */
export function truncar(texto: string, maxChars: number): string {
  if (texto.length <= maxChars) return texto
  return texto.slice(0, maxChars).trimEnd() + '…'
}
