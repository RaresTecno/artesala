'use client';

import Link from 'next/link';
import { XCircle } from 'lucide-react';


export default function PagoKoPage() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4">
      <XCircle className="h-20 w-20 text-red-500" strokeWidth={1.5} />
      <h1 className="text-3xl font-bold text-center">Pago no completado</h1>
      <p className="max-w-md text-center text-gray-600">
        La operación ha sido cancelada o rechazada. No se ha efectuado ningún cargo.
        Puedes intentarlo de nuevo o ponerte en contacto con nosotros si el problema persiste.
      </p>

      <div className="mt-4 flex gap-4">
        <Link
          href="/reservas"
          className="rounded bg-orange-500 px-5 py-2 font-medium text-white hover:bg-orange-400"
        >
          Volver a reservar
        </Link>
        <Link
          href="/"
          className="rounded border border-gray-300 px-5 py-2 font-medium text-gray-700 hover:bg-gray-50"
        >
          Página principal
        </Link>
      </div>
    </main>
  );
}
