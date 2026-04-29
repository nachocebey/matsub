'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { X } from 'lucide-react'
import { toast } from '@/components/ui/Toaster'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CheckoutForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    })

    if (stripeError) {
      setError(stripeError.message ?? 'Error en el pago')
      setLoading(false)
    } else {
      toast.success('¡Pago completado! Tu reserva está confirmada.')
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={!stripe || loading} className="btn-primary w-full py-3">
        {loading ? <><LoadingSpinner size="sm" /> Procesando...</> : 'Confirmar pago'}
      </button>
    </form>
  )
}

interface Props {
  bookingId: string
  tripTitle: string
  price: number
  onClose: () => void
  onSuccess: () => void
}

export function PaymentModal({ bookingId, tripTitle, price, onClose, onSuccess }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loadingIntent, setLoadingIntent] = useState(true)

  useEffect(() => {
    fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: bookingId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.clientSecret) setClientSecret(data.clientSecret)
        else toast.error('Error al iniciar el pago')
      })
      .finally(() => setLoadingIntent(false))
  }, [bookingId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-ocean-950">Pagar reserva</h2>
            <p className="text-sm text-ocean-500">{tripTitle}</p>
          </div>
          <button onClick={onClose} className="text-ocean-400 hover:text-ocean-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 flex items-center justify-between px-4 py-3 bg-ocean-50 rounded-xl">
          <span className="text-sm text-ocean-600">Total a pagar</span>
          <span className="text-lg font-bold text-ocean-950">
            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(price)}
          </span>
        </div>

        {loadingIntent ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret, locale: 'es' }}>
            <CheckoutForm onSuccess={onSuccess} />
          </Elements>
        ) : (
          <p className="text-center text-red-500 py-4">No se pudo iniciar el pago.</p>
        )}
      </div>
    </div>
  )
}
