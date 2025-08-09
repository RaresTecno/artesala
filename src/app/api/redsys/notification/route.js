/* app/api/redsys/notification/route.js */
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';
import { createClient } from '@supabase/supabase-js';

/* ───────── Utilidades firma ───────── */
const toStdB64 = (s) =>
  s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);

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

/* ───────── Parser profundo de MerchantData ───────── */
function parseMerchantData(input) {
  if (!input) return {};

  const tryJSON = (v) => { try { return JSON.parse(v); } catch { return null; } };
  const tryB64JSON = (v) => {
    try {
      const txt = CryptoJS.enc.Utf8.stringify(
        CryptoJS.enc.Base64.parse(toStdB64(v))
      );
      return tryJSON(txt) ?? txt; // objeto o string
    } catch {
      return null;
    }
  };

  // 1) primer intento
  let parsed = tryJSON(input);
  if (parsed == null) parsed = tryB64JSON(input);

  // 2) normalización recursiva: desanida strings con JSON o Base64(JSON)
  const normalizeDeep = (val) => {
    if (val == null) return val;

    if (typeof val === 'string') {
      const j = tryJSON(val) ?? tryB64JSON(val);
      return j != null ? normalizeDeep(j) : val;
    }
    if (Array.isArray(val)) return val.map(normalizeDeep);
    if (typeof val === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(val)) out[k] = normalizeDeep(v);
      return out;
    }
    return val;
  };

  parsed = normalizeDeep(parsed);
  return (parsed && typeof parsed === 'object') ? parsed : {};
}

/* ───────── Lógica común ───────── */
async function processNotification(paramsB64, sigGiven) {
  const SUPABASE_URL =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!process.env.REDSYS_SECRET_KEY || !SUPABASE_URL || !SERVICE_ROLE) {
    console.error('REDSYS NOTIFY: missing env vars');
    return new NextResponse('ERROR', { status: 500 });
  }
  if (!paramsB64 || !sigGiven) {
    console.warn('REDSYS NOTIFY: missing params');
    return new NextResponse('ERROR', { status: 400 });
  }

  // Decodificar (para lectura) sin alterar la cadena original para la firma
  const paramsJson = CryptoJS.enc.Utf8.stringify(
    CryptoJS.enc.Base64.parse(toStdB64(paramsB64))
  );
  const params = JSON.parse(paramsJson);

  const order    = String(params['Ds_Order'] ?? '');
  const respCode = parseInt(params['Ds_Response'] ?? '999', 10);
  const amountCt = parseInt(params['Ds_Amount'] ?? '0', 10);

  // Verificación de firma (la que llega es URL-safe)
  const expected = calcSignature(order, paramsB64);
  const givenStd = toStdB64(sigGiven);
  if (expected !== givenStd) {
    console.error('REDSYS NOTIFY: bad signature', { order });
    return new NextResponse('ERROR', { status: 400 });
  }

  console.log('REDSYS NOTIFY: hit + sig OK', { order, respCode, amountCt });

  // Solo seguimos si está autorizado (0..99)
  if (!(respCode >= 0 && respCode <= 99)) return new NextResponse('OK');

  // Posibles nombres del campo con datos del comercio
  const mdRaw =
    params['Ds_Merchant_MerchantData'] ||
    params['Ds_MerchantData'] ||
    params['DS_MERCHANT_MERCHANTDATA'];

  const md = parseMerchantData(mdRaw);

  // Aceptar:
  // 1) { customerData, extra: { salaId, selectedSlots } }
  // 2) { salaId, selectedSlots } (plano)
  const customer = md?.customerData ?? {};
  const extra    = md?.extra ?? {};

  const salaIdRaw =
    extra?.salaId ?? extra?.sala_id ??
    md?.salaId   ?? md?.sala_id;

  const salaId = Number(String(salaIdRaw ?? '').trim()) || null;

  let slots =
    extra?.selectedSlots ??
    md?.selectedSlots ??
    extra?.slots ??
    md?.slots;

  if (typeof slots === 'string') {
    try { slots = JSON.parse(slots); } catch {}
  }
  if (!Array.isArray(slots)) slots = [];

  console.log('REDSYS NOTIFY: md shape', {
    keys: md && Object.keys(md),
    extraKeys: extra && Object.keys(extra),
    salaId,
    tramosPreview: slots.length ? slots[0] : null
  });

  if (!salaId || slots.length === 0) {
    console.warn('REDSYS NOTIFY: merchantData vacío/incompleto', {
      order, salaId, tramosLen: slots.length
    });
    return new NextResponse('OK');
  }

  // Supabase (service role)
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false }
  });

  // (Opcional) Validar importe recalculando
  const { data: sala, error: salaErr } = await supabase
    .from('salas').select('coste_hora').eq('id', salaId).single();
  if (salaErr || !sala) {
    console.error('REDSYS NOTIFY: sala not found', { salaId, salaErr });
    return new NextResponse('ERROR', { status: 500 });
  }

  const horas = slots.reduce((acc, t) =>
    acc + ((new Date(t.end).getTime() - new Date(t.start).getTime()) / 36e5), 0);
  const totalRecalc = Number((horas * Number(sala.coste_hora)).toFixed(2));
  const totalRedsys = Math.round(amountCt) / 100;
  if (Math.abs(totalRecalc - totalRedsys) > 0.01) {
    console.warn('REDSYS NOTIFY: total mismatch', { order, totalRecalc, totalRedsys });
  }

  // 1) Reserva (idempotente por referencia_pago = order)
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
    if (resErr.code === '23505') { // duplicado
      console.log('REDSYS NOTIFY: duplicate (idempotent OK)', { order });
      return new NextResponse('OK');
    }
    console.error('REDSYS NOTIFY: error insert reserva', resErr);
    return new NextResponse('ERROR', { status: 500 });
  }

  // 2) Tramos
  const rows = slots.map((t) => ({
    reserva_id: reserva.id,
    sala_id: salaId,
    inicio: t.start,
    fin: t.end
  }));
  const { error: trErr } = await supabase.from('tramos_reservados').insert(rows);
  if (trErr) {
    console.error('REDSYS NOTIFY: error insert tramos', trErr);
    await supabase.from('reservas').delete().eq('id', reserva.id);
    return new NextResponse('ERROR', { status: 500 });
  }

  console.log('REDSYS NOTIFY: inserted OK', { order, reservaId: reserva.id });
  return new NextResponse('OK');
}

/* ───────── Handlers HTTP ───────── */
export async function POST(request) {
  const bodyText = await request.text();
  const qs = new URLSearchParams(bodyText);
  const paramsB64 =
    qs.get('Ds_MerchantParameters') || qs.get('ds_merchantparameters') || qs.get('DS_MERCHANT_PARAMETERS');
  const sigGiven =
    qs.get('Ds_Signature') || qs.get('ds_signature') || qs.get('DS_SIGNATURE');
  return processNotification(paramsB64, sigGiven);
}

export async function GET(request) {
  const url = new URL(request.url);
  const sp = url.searchParams;
  const paramsB64 =
    sp.get('Ds_MerchantParameters') || sp.get('ds_merchantparameters') || sp.get('DS_MERCHANT_PARAMETERS');
  const sigGiven =
    sp.get('Ds_Signature') || sp.get('ds_signature') || sp.get('DS_SIGNATURE');

  if (!paramsB64 || !sigGiven) return new NextResponse('OK'); // health/noop
  return processNotification(paramsB64, sigGiven);
}
