/* app/api/redsys/notification/route.js */
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';
import { createClient } from '@supabase/supabase-js';

/* ───────── Utilidades firma (Edge-safe) ───────── */
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

/* ───────── Lógica común ───────── */
async function processNotification(paramsB64, sigGiven) {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!process.env.REDSYS_SECRET_KEY || !SUPABASE_URL || !SERVICE_ROLE) {
    console.error('REDSYS NOTIFY: missing env vars');
    return new NextResponse('ERROR', { status: 500 });
  }

  if (!paramsB64 || !sigGiven) {
    console.warn('REDSYS NOTIFY: missing params');
    return new NextResponse('ERROR', { status: 400 });
  }

  // Decodificar parámetros
  const paramsJson = CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(paramsB64));
  const params = JSON.parse(paramsJson);

  const order    = String(params['Ds_Order'] ?? '');
  const respCode = parseInt(params['Ds_Response'] ?? '999', 10);
  const amountCt = parseInt(params['Ds_Amount'] ?? '0', 10);

  // Verificar firma (recibida url-safe)
  const expected = calcSignature(order, paramsB64);
  const givenStd = toStdB64(sigGiven);
  if (expected !== givenStd) {
    console.error('REDSYS NOTIFY: bad signature', { order });
    return new NextResponse('ERROR', { status: 400 });
  }

  console.log('REDSYS NOTIFY: hit + sig OK', { order, respCode, amountCt });

  // Si no autorizado, OK y salir
  if (!(respCode >= 0 && respCode <= 99)) {
    console.log('REDSYS NOTIFY: payment not authorized', { order, respCode });
    return new NextResponse('OK');
  }

  // MerchantData: cubrir variantes
  const mdRaw =
    params['Ds_Merchant_MerchantData'] ||
    params['Ds_MerchantData'] ||
    params['DS_MERCHANT_MERCHANTDATA'];

  const md = parseMerchantData(mdRaw);
  const customer = md?.customerData ?? {};
  const extra    = md?.extra ?? {};
  const salaId   = Number(extra?.salaId);
  const tramos   = Array.isArray(extra?.selectedSlots) ? extra.selectedSlots : [];

  if (!salaId || !tramos.length) {
    console.warn('REDSYS NOTIFY: merchantData vacío/incompleto', {
      order, hasMd: !!mdRaw, salaId, tramosLen: tramos.length
    });
    return new NextResponse('OK');
  }

  // Supabase (service role)
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  // (Opcional) validar importe
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

  // 1) Reserva (idempotente por referencia_pago)
  const { data: reserva, error: resErr } = await supabase
    .from('reservas')
    .insert({
      nombre: customer.nombre ?? null,
      correo: customer.correo ?? null,
      telefono: customer.telefono ?? null,
      info_adicional: customer.info_adicional ?? null,
      estado: 'pagada',
      total: totalRedsys,
      referencia_pago: order
    })
    .select('id')
    .single();
  if (resErr) {
    if (resErr.code === '23505') {
      console.log('REDSYS NOTIFY: duplicate (idempotent OK)', { order });
      return new NextResponse('OK');
    }
    console.error('REDSYS NOTIFY: error insert reserva', resErr);
    return new NextResponse('ERROR', { status: 500 });
  }

  // 2) Tramos
  const rows = tramos.map(t => ({
    reserva_id: reserva.id,
    sala_id: salaId,
    inicio: t.start,
    fin: t.end
  }));
  const { error: trErr } = await supabase.from('tramos_reservados').insert(rows);
  if (trErr) {
    console.error('REDSYS NOTIFY: error insert tramos', trErr);
    // Limpieza best-effort
    await supabase.from('reservas').delete().eq('id', reserva.id);
    return new NextResponse('ERROR', { status: 500 });
  }

  console.log('REDSYS NOTIFY: inserted OK', { order, reservaId: reserva.id });
  return new NextResponse('OK');
}

/* ───────── Handlers HTTP ───────── */

// Redsys suele usar POST (x-www-form-urlencoded)
export async function POST(request) {
  const bodyText = await request.text();
  const qs = new URLSearchParams(bodyText);
  const paramsB64 =
    qs.get('Ds_MerchantParameters') || qs.get('ds_merchantparameters') || qs.get('DS_MERCHANT_PARAMETERS');
  const sigGiven =
    qs.get('Ds_Signature') || qs.get('ds_signature') || qs.get('DS_SIGNATURE');
  return processNotification(paramsB64, sigGiven);
}

// Algunos adquirentes llegan por GET (o por redirect http→https)
export async function GET(request) {
  const url = new URL(request.url);
  const sp = url.searchParams;
  const paramsB64 =
    sp.get('Ds_MerchantParameters') || sp.get('ds_merchantparameters') || sp.get('DS_MERCHANT_PARAMETERS');
  const sigGiven =
    sp.get('Ds_Signature') || sp.get('ds_signature') || sp.get('DS_SIGNATURE');

  // Si no vienen parámetros, responde OK (healthcheck / pruebas)
  if (!paramsB64 || !sigGiven) return new NextResponse('OK');

  return processNotification(paramsB64, sigGiven);
}
