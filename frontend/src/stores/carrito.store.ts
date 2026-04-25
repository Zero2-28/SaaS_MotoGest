import { create } from 'zustand'
import type { Producto, ItemCarrito, MetodoPago } from '@/types'

interface CarritoState {
  items: ItemCarrito[]
  metodoPago: MetodoPago
  clienteId: number | null
  // Computed
  totalItems: () => number
  totalMonto: () => number
  // Acciones
  agregarItem: (producto: Producto, cantidad?: number) => void
  quitarItem: (productoId: number) => void
  cambiarCantidad: (productoId: number, cantidad: number) => void
  setMetodoPago: (metodo: MetodoPago) => void
  setClienteId: (id: number | null) => void
  vaciarCarrito: () => void
}

export const useCarritoStore = create<CarritoState>()((set, get) => ({
  items: [],
  metodoPago: 'efectivo',
  clienteId: null,

  totalItems: () => get().items.reduce((acc, item) => acc + item.cantidad, 0),

  totalMonto: () =>
    get().items.reduce((acc, item) => acc + item.cantidad * item.precioUnitario, 0),

  agregarItem: (producto, cantidad = 1) => {
    const items = get().items
    const existente = items.find((i) => i.producto.id === producto.id)

    if (existente) {
      set({
        items: items.map((i) =>
          i.producto.id === producto.id
            ? { ...i, cantidad: i.cantidad + cantidad }
            : i
        ),
      })
    } else {
      set({
        items: [...items, { producto, cantidad, precioUnitario: producto.precioVenta }],
      })
    }
  },

  quitarItem: (productoId) => {
    set({ items: get().items.filter((i) => i.producto.id !== productoId) })
  },

  cambiarCantidad: (productoId, cantidad) => {
    if (cantidad <= 0) {
      get().quitarItem(productoId)
      return
    }
    set({
      items: get().items.map((i) =>
        i.producto.id === productoId ? { ...i, cantidad } : i
      ),
    })
  },

  setMetodoPago: (metodo) => set({ metodoPago: metodo }),

  setClienteId: (id) => set({ clienteId: id }),

  vaciarCarrito: () => set({ items: [], clienteId: null, metodoPago: 'efectivo' }),
}))
