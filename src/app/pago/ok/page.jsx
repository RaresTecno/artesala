'use client';

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function PagoOkPage() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4">
      <CheckCircle className="h-20 w-20 text-green-500" strokeWidth={1.5} />
      <h1 className="text-3xl font-bold text-center">¡Pago realizado con éxito!</h1>
      <p className="max-w-md text-center text-gray-600">
        Gracias por tu reserva. En breve recibirás un correo de confirmación con todos los detalles.
      </p>

      <Link
        href="/"
        className="mt-4 rounded bg-orange-500 px-6 py-2 font-medium text-white hover:bg-orange-400"
      >
        Volver a la página principal
      </Link>
    </main>
  );
}
