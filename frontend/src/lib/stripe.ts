import { loadStripe } from '@stripe/stripe-js'

// La instancia se crea una sola vez y se reutiliza en toda la app
export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY as string)
