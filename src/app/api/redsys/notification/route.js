/*  app/api/redsys/notification/route.js  */
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';
import { createClient } from '@supabase/supabase-js';

const { REDSYS_SECRET_KEY } = process.env;

/* ---------- Firma Redsys con crypto-js ---------- */
function deriveKey(order) {
  const masterKey = CryptoJS.enc.Base64.parse(REDSYS_SECRET_KEY);
  let block = CryptoJS.enc.Utf8.parse(order);
  const pad = (8 - (block.sigBytes % 8)) % 8;
  if (pad) block = CryptoJS.lib.WordArray.create(block.words, block.sigBytes + pad);

  const iv = CryptoJS.enc.Hex.parse('0000000000000000');
  const cipher = CryptoJS.TripleDES.encrypt(block, masterKey, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.NoPadding
  });
  return cipher.ciphertext;
}

function calcSignature(order, paramsB64) {
  const key = deriveKey(order);
  return CryptoJS.HmacSHA256(paramsB64, key).toString(CryptoJS.enc.Base64);
}
/* ----------------------------------------------- */

export async function POST(request) {
  try {
    /* 1· Leer x-www-form-urlencoded de Redsys */
    const bodyText = await request.text();
    const qs = new URLSearchParams(bodyText);
    const paramsB64 = qs.get('Ds_MerchantParameters');
    const recvSig  = qs.get('Ds_Signature');
    if (!paramsB64 || !recvSig) return new NextResponse('ERROR', { status: 400 });

    /* 2· Parsear y verificar firma */
    const params = JSON.parse(
      CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(paramsB64))
    );
    const { Ds_Order: order, Ds_Response: resp, Ds_MerchantData: extraJSON,
            Ds_Amount: amountCents, Ds_AuthorisationCode: authCode } = params;

    if (calcSignature(order, paramsB64) !== recvSig)
      return new NextResponse('ERROR', { status: 400 });

    if (parseInt(resp, 10) >= 100) return new NextResponse('OK'); // pago rechazado

    /* 3· Crear cliente Supabase AHORA (ya en runtime, con env vars presentes) */
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    const { salaId, selectedSlots = [], ...cust } =
      JSON.parse(extraJSON || '{}');

    /* 4· Insertar reserva */
    const { data: reserva, error: resErr } = await supabase
      .from('reservas')
      .insert({
        nombre: cust.nombre,
        correo: cust.correo,
        telefono: cust.telefono,
        info_adicional: cust.info_adicional || '',
        estado: 'pagado',
        total: parseInt(amountCents, 10) / 100,
        referencia_pago: authCode || order
      })
      .select('id')
      .single();
    if (resErr) throw resErr;

    /* 5· Insertar tramos */
    if (selectedSlots.length) {
      const rows = selectedSlots.map(t => ({
        reserva_id: reserva.id,
        sala_id: salaId,
        inicio: t.start,
        fin: t.end
      }));
      const { error: trErr } = await supabase.from('tramos_reservados').insert(rows);
      if (trErr) throw trErr;
    }

    return new NextResponse('OK');
  } catch (err) {
    console.error('Redsys notif error', err);
    return new NextResponse('ERROR', { status: 500 });
  }
}
