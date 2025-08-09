'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function PagoOkPage() {
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    // En modo SÍNCRONO Redsys añade los parámetros en la URL de OK
    const sp = new URLSearchParams(window.location.search);
    const p =
      sp.get('Ds_MerchantParameters') ||
      sp.get('ds_merchantparameters') ||
      sp.get('DS_MERCHANT_PARAMETERS');
    const s =
      sp.get('Ds_Signature') ||
      sp.get('ds_signature') ||
      sp.get('DS_SIGNATURE');
    const v =
      sp.get('Ds_SignatureVersion') ||
      sp.get('ds_signatureversion') ||
      sp.get('DS_SIGNATUREVERSION') || 'HMAC_SHA256_V1';

    if (p && s && !enviado) {
      setEnviado(true);
      // Reenvía al backend para verificar e insertar en BD
      fetch('/api/redsys/notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          Ds_MerchantParameters: p,
          Ds_Signature: s,
          Ds_SignatureVersion: v
        }).toString(),
        keepalive: true
      }).catch(() => {});
    }
  }, [enviado]);

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
