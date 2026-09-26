import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCarritoStore } from '@/stores/carrito.store'
import { formatPrecio } from '@/utils/format'
import { cn } from '@/utils/cn'

const PLACEHOLDER = 'https://placehold.co/60x60/F9FAFB/9CA3AF?text=M'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const navigate = useNavigate()
  const { items, totalItems, totalMonto, cambiarCantidad, quitarItem } = useCarritoStore()

  // Cerrar con Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // Bloquear scroll del body mientras está abierto
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const count = totalItems()
  const monto = totalMonto()

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden
      />

      {/* Panel drawer */}
      <div
        role="dialog"
        aria-label="Carrito de compras"
        aria-modal="true"
        className={cn(
          'fixed right-0 top-0 bottom-0 z-50 flex w-full flex-col md:w-[400px]',
          'bg-white shadow-2xl transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-carbon-900" aria-hidden />
            <h2 className="text-base font-semibold text-carbon-900">Tu carrito</h2>
            {count > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-turbo px-1 text-[10px] font-bold text-white tabular-nums">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar carrito"
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-carbon-900 transition-colors"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-8 py-12 text-center">
              <ShoppingCart className="h-16 w-16 text-gray-200" aria-hidden />
              <p className="text-base font-semibold text-carbon-900">Tu carrito está vacío</p>
              <p className="text-sm text-gray-500 leading-relaxed">
                Agrega productos desde el catálogo
              </p>
              <Button
                className="mt-2"
                onClick={() => { onClose(); navigate('/catalogo') }}
              >
                Ver catálogo
              </Button>
            </div>
          ) : (
            <ul
              className="divide-y divide-gray-100 px-5 py-2"
              aria-label="Productos en el carrito"
            >
              {items.map((item) => (
                <li key={item.producto.id} className="flex items-start gap-3 py-4">
                  {/* Imagen del producto */}
                  <img
                    src={item.producto.imagen_url ?? PLACEHOLDER}
                    alt={item.producto.nombre}
                    onError={(e) => { e.currentTarget.src = PLACEHOLDER }}
                    className="h-[60px] w-[60px] flex-shrink-0 rounded-lg border border-gray-100 object-cover bg-gray-50"
                    width={60}
                    height={60}
                    loading="lazy"
                  />

                  {/* Detalle */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight text-carbon-900 line-clamp-2">
                      {item.producto.nombre}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 tabular-nums">
                      {formatPrecio(item.precioUnitario)} c/u
                    </p>

                    {/* Controles cantidad + eliminar */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center rounded-md border border-gray-200">
                        <button
                          onClick={() => cambiarCantidad(item.producto.id, item.cantidad - 1)}
                          aria-label={`Reducir cantidad de ${item.producto.nombre}`}
                          disabled={item.cantidad <= 1}
                          className="flex h-7 w-7 items-center justify-center text-gray-500 hover:text-racing transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Minus className="h-3 w-3" aria-hidden />
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-carbon-900 tabular-nums">
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => cambiarCantidad(item.producto.id, item.cantidad + 1)}
                          aria-label={`Aumentar cantidad de ${item.producto.nombre}`}
                          className="flex h-7 w-7 items-center justify-center text-gray-500 hover:text-racing transition-colors"
                        >
                          <Plus className="h-3 w-3" aria-hidden />
                        </button>
                      </div>

                      <button
                        onClick={() => quitarItem(item.producto.id)}
                        aria-label={`Eliminar ${item.producto.nombre} del carrito`}
                        className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-racing transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                  </div>

                  {/* Subtotal del item */}
                  <p className="flex-shrink-0 text-sm font-semibold text-carbon-900 tabular-nums">
                    {formatPrecio(item.cantidad * item.precioUnitario)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer sticky */}
        {items.length > 0 && (
          <div className="space-y-3 border-t border-gray-100 px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span className="text-lg font-bold text-carbon-900 tabular-nums">
                {formatPrecio(monto)}
              </span>
            </div>
            <Button
              className="w-full"
              onClick={() => { onClose(); navigate('/pago') }}
            >
              Ir al pago
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={onClose}
            >
              Seguir comprando
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
