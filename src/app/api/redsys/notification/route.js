// app/api/redsys/notification/route.js
// Endpoint que recibe la notificación "online" de Redsys (POST server‑to‑server)
// Verifica la firma y, si el pago fue autorizado, escribe la reserva y tramos
// en Supabase usando la SERVICE_ROLE_KEY.
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const {
  REDSYS_SECRET_KEY,
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
} = process.env;

// ────────────────────────────────────────────────────────────
// Helper: derivar clave + firma igual que en el request
// ────────────────────────────────────────────────────────────
function deriveKey(order) {
  const masterKey = Buffer.from(REDSYS_SECRET_KEY, 'base64');
  const iv = Buffer.alloc(8, 0);
  const cipher = crypto.createCipheriv('des-ede3-cbc', masterKey, iv);
  cipher.setAutoPadding(false);
  let orderBuf = Buffer.from(order, 'utf8');
  const pad = 8 - (orderBuf.length % 8);
  if (pad !== 8) orderBuf = Buffer.concat([orderBuf, Buffer.alloc(pad, 0)]);
  return Buffer.concat([cipher.update(orderBuf), cipher.final()]);
}

function calcSignature(order, merchantParamsB64) {
  const key = deriveKey(order);
  return crypto.createHmac('sha256', key).update(merchantParamsB64).digest('base64');
}

// Supabase admin client (no RLS; server‑side only!)
const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

export async function POST(request) {
  try {
    // Redsys envía x‑www‑form‑urlencoded
    const bodyText = await request.text();
    const params = new URLSearchParams(bodyText);

    const signatureVersion = params.get('Ds_SignatureVersion');
    const merchantParamsB64 = params.get('Ds_MerchantParameters');
    const receivedSignature = params.get('Ds_Signature');

    if (signatureVersion !== 'HMAC_SHA256_V1')
      return new NextResponse('ERROR', { status: 400 });

    // Decode merchant params
    const merchantParams = JSON.parse(Buffer.from(merchantParamsB64, 'base64').toString('utf8'));
    const {
      Ds_Order: order,
      Ds_Response: responseCode,
      Ds_MerchantData: merchantDataJson,
      Ds_Amount: amountCents,
      Ds_AuthorisationCode: authCode
    } = merchantParams;

    // Recalcular firma
    const localSignature = calcSignature(order, merchantParamsB64);
    if (localSignature !== receivedSignature)
      return new NextResponse('ERROR', { status: 400 });

    // Redsys considera autorizado 0‑99 inclusive
    const authorised = parseInt(responseCode, 10) < 100;
    if (!authorised) return new NextResponse('OK'); // pago no autorizado, no insertamos

    // Extra que mandamos con la reserva
    const extra = JSON.parse(merchantDataJson || '{}');
    const { salaId, selectedSlots, ...customerData } = extra;

    // Insertar en la tabla reservas
    const { data: reservaRow, error: reservaErr } = await supabase
      .from('reservas')
      .insert({
        nombre: customerData.nombre,
        correo: customerData.correo,
        telefono: customerData.telefono,
        info_adicional: customerData.info_adicional || '',
        estado: 'pagado',
        total: parseInt(amountCents, 10) / 100,
        referencia_pago: authCode || order
      })
      .select('id')
      .single();

    if (reservaErr) throw reservaErr;

    // Insertar tramos
    if (Array.isArray(selectedSlots) && selectedSlots.length) {
      const slotsToInsert = selectedSlots.map(t => ({
        reserva_id: reservaRow.id,
        sala_id: salaId,
        inicio: t.start,
        fin: t.end
      }));
      const { error: tramosErr } = await supabase.from('tramos_reservados').insert(slotsToInsert);
      if (tramosErr) throw tramosErr;
    }

    return new NextResponse('OK');
  } catch (err) {
    console.error('Notif Redsys error:', err);
    // Redsys reintentará; responde ERROR para que vuelva a notificar más tarde
    return new NextResponse('ERROR', { status: 500 });
  }
}
