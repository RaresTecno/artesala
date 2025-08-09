/* app/api/redsys/notification/route.js */
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';
import { createClient } from '@supabase/supabase-js';

/* ───────── Utilidades firma ───────── */

function deriveKey(order) {
  const masterKey = CryptoJS.enc.Base64.parse(process.env.REDSYS_SECRET_KEY);
  const iv = CryptoJS.enc.Hex.parse('0000000000000000');
  const cipher = CryptoJS.TripleDES.encrypt(
    CryptoJS.enc.Utf8.parse(order),
    masterKey,
    { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.ZeroPadding }
  );
  return cipher.ciphertext;
}

function calcSignature(order, paramsB64) {
  const key = deriveKey(order);
  return CryptoJS.HmacSHA256(paramsB64, key).toString(CryptoJS.enc.Base64);
}

function toStdB64(s) {
  return s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
}

function parseMerchantData(input) {
  if (!input) return {};
  try { return JSON.parse(input); } catch {}
  try {
    const asJson = CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(input));
    return JSON.parse(asJson);
  } catch { return {}; }
}

/* ───────── Handler ───────── */

export async function POST(request) {
  const startedAt = new Date().toISOString();

  try {
    // 0) Comprobación de variables de entorno críticas
    const missing = [];
    if (!process.env.REDSYS_SECRET_KEY) missing.push('REDSYS_SECRET_KEY');
    if (!process.env.SUPABASE_URL) missing.push('SUPABASE_URL');
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
    if (missing.length) {
      console.error('REDSYS NOTIFY: missing env vars', missing);
      return new NextResponse('ERROR', { status: 500 });
    }

    // 1) Redsys envía application/x-www-form-urlencoded
    const bodyText = await request.text();
    const qs = new URLSearchParams(bodyText);
    const paramsB64 = qs.get('Ds_MerchantParameters');
    const sigGiven  = qs.get('Ds_Signature');

    if (!paramsB64 || !sigGiven) {
      console.error('REDSYS NOTIFY: missing params');
      return new NextResponse('ERROR', { status: 400 });
    }

    // 2) Decodificar y verificar firma
    const paramsJson = CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(paramsB64));
    const params = JSON.parse(paramsJson);

    const order    = String(params['Ds_Order'] ?? '');
    const respCode = parseInt(params['Ds_Response'] ?? '999', 10);
    const amountCt = parseInt(params['Ds_Amount'] ?? '0', 10);

    const expected = calcSignature(order, paramsB64);
    const givenStd = toStdB64(sigGiven);

    if (expected !== givenStd) {
      console.error('REDSYS NOTIFY: bad signature', { order });
      return new NextResponse('ERROR', { status: 400 });
    }

    console.log('REDSYS NOTIFY: hit + sig OK', { startedAt, order, respCode, amountCt });

    // 3) Si pago no autorizado, responder OK y salir
    if (!(respCode >= 0 && respCode <= 99)) {
      console.log('REDSYS NOTIFY: payment not authorized', { order, respCode });
      return new NextResponse('OK');
    }

    // 4) MerchantData: { customerData, extra: { salaId, selectedSlots } }
    const mdRaw = params['Ds_MerchantData'] || params['DS_MERCHANT_MERCHANTDATA'];
    const md = parseMerchantData(mdRaw);

    const customer = md?.customerData ?? {};
    const extra    = md?.extra ?? {};
    const salaId   = Number(extra?.salaId);
    const tramos   = Array.isArray(extra?.selectedSlots) ? extra.selectedSlots : [];

    if (!salaId || !tramos.length) {
      console.warn('REDSYS NOTIFY: missing salaId/tramos', { order, salaId, tramosLen: tramos.length });
      return new NextResponse('OK');
    }

    // 5) Supabase (Service Role)
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    // (Opcional) Validar importe recalculando
    const { data: sala, error: salaErr } = await supabase
      .from('salas').select('coste_hora').eq('id', salaId).single();
    if (salaErr || !sala) {
      console.error('REDSYS NOTIFY: sala not found', { order, salaId, salaErr });
      return new NextResponse('ERROR', { status: 500 });
    }

    const horas = tramos.reduce((acc, t) =>
      acc + ((new Date(t.end).getTime() - new Date(t.start).getTime()) / 36e5), 0);
    const totalRecalc = Number((horas * Number(sala.coste_hora)).toFixed(2));
    const totalRedsys = Math.round(amountCt) / 100;

    if (Math.abs(totalRecalc - totalRedsys) > 0.01) {
      console.warn('REDSYS NOTIFY: total mismatch', { order, totalRecalc, totalRedsys });
    }

    // 6) Inserción atómica vía RPC (debe existir en tu BD)
    const { error: rpcErr } = await supabase.rpc('crear_reserva_con_tramos', {
      p_nombre: customer.nombre ?? null,
      p_correo: customer.correo ?? null,
      p_telefono: customer.telefono ?? null,
      p_info_adicional: customer.info_adicional ?? null,
      p_total: totalRedsys,
      p_estado: 'pagada',
      p_referencia_pago: order,   // índice único
      p_sala_id: salaId,
      p_tramos: tramos
    });

    if (rpcErr) {
      // 42883 => función no existe; 23505 => duplicado (reintento Redsys)
      if (rpcErr.code === '23505') {
        console.log('REDSYS NOTIFY: duplicate (idempotent OK)', { order });
        return new NextResponse('OK');
      }
      console.error('REDSYS NOTIFY: rpc error', { order, code: rpcErr.code, msg: rpcErr.message });
      return new NextResponse('ERROR', { status: 500 });
    }

    console.log('REDSYS NOTIFY: inserted OK', { order, reserva: true });
    return new NextResponse('OK');
  } catch (err) {
    console.error('REDSYS NOTIFY: unhandled error', err);
    return new NextResponse('ERROR', { status: 500 });
  }
}
