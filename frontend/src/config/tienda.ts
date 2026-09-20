/**
 * Datos de contacto de la tienda — fuente única.
 * Si cambia la dirección o el WhatsApp, se edita aquí y se actualiza en
 * el footer, la landing y el botón flotante a la vez.
 */
export const tienda = {
  nombre: 'RE MOTOS',
  direccion: 'Av. Óscar Benavides 4192 – Bellavista',
  ciudad: 'Bellavista, Callao',

  whatsapp: {
    /** Como se muestra al cliente */
    display: '902 257 764',
    /** Formato internacional sin símbolos, para el enlace wa.me */
    url: 'https://wa.me/51902257764',
  },

  /** TODO: ficticio, solo para maquetar. Reemplazar por el correo real. */
  email: 'contacto@remotos.pe',

  mapsUrl:
    'https://www.google.com/maps/place/Av.+%C3%93scar+R.+Benavides+4192,+Callao+07011/data=!4m2!3m1!1s0x9105c9579090f89b:0x28158629f5a5b4df?sa=X&ved=1t:242&ictx=111',
} as const
