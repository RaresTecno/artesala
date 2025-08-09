/* app/api/redsys/notification/route.js */
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';
import { createClient } from '@supabase/supabase-js';

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

/* Parser de MerchantData (por si hay que “recrear” la reserva como fallback) */
function parseMerchantData(input) {
  if (!input) return {};
  const tryJSON = (v) => { try { return JSON.parse(v); } catch { return null; } };
  const tryB64JSON = (v) => {
    try {
      const txt = CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(toStdB64(v)));
      return tryJSON(txt) ?? txt;
    } catch { return null; }
  };
  let parsed = tryJSON(input);
  if (parsed == null) parsed = tryB64JSON(input);

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

  const paramsJson = CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(toStdB64(paramsB64)));
  const params = JSON.parse(paramsJson);

  const order    = String(params['Ds_Order'] ?? '');
  const respCode = parseInt(params['Ds_Response'] ?? '999', 10);
  const amountCt = parseInt(params['Ds_Amount'] ?? '0', 10);

  // Firma
  const expected = calcSignature(order, paramsB64);
  const givenStd = toStdB64(sigGiven);
  if (expected !== givenStd) {
    console.error('REDSYS NOTIFY: bad signature', { order });
    return new NextResponse('ERROR', { status: 400 });
  }

  console.log('REDSYS NOTIFY: hit + sig OK', { order, respCode, amountCt });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  // Buscar la reserva creada como PENDIENTE
  const { data: reservaPend, error: findErr } = await supabase
    .from('reservas')
    .select('id, estado, total')
    .eq('referencia_pago', order)
    .single();

  // RECHAZADA (>=100): marcar cancelada y liberar slots
  if (respCode >= 100) {
    if (reservaPend) {
      await supabase.from('reservas').update({ estado: 'cancelada' }).eq('id', reservaPend.id);
      await supabase.from('tramos_reservados').delete().eq('reserva_id', reservaPend.id);
      console.log('REDSYS NOTIFY: cancelada + tramos liberados', { order });
    } else {
      console.warn('REDSYS NOTIFY: rechazo sin reserva previa', { order });
    }
    return new NextResponse('OK');
  }

  // AUTORIZADA (0..99): si existe, actualizar a PAGADA
  if (reservaPend) {
    await supabase
      .from('reservas')
      .update({ estado: 'pagada', total: Math.round(amountCt) / 100 })
      .eq('id', reservaPend.id);

    console.log('REDSYS NOTIFY: pendiente → pagada', { order, reservaId: reservaPend.id });
    return new NextResponse('OK');
  }

  // Fallback: si por alguna razón no existiese la reserva pendiente, intentar recrearla con MerchantData
  const mdRaw =
    params['Ds_Merchant_MerchantData'] ||
    params['Ds_MerchantData'] ||
    params['DS_MERCHANT_MERCHANTDATA'];
  const md = parseMerchantData(mdRaw);
  const customer = md?.customerData ?? {};
  const extra    = md?.extra ?? {};
  const salaId   = Number(extra?.salaId ?? md?.salaId) || null;
  let slots = extra?.selectedSlots ?? md?.selectedSlots ?? [];
  if (typeof slots === 'string') { try { slots = JSON.parse(slots); } catch {} }
  if (!Array.isArray(slots)) slots = [];

  if (!salaId || slots.length === 0) {
    console.warn('REDSYS NOTIFY: no pendiente y MerchantData insuficiente', { order });
    return new NextResponse('OK');
  }

  // Crear reserva pagada + tramos (solo si no existía pendiente)
  const { data: sala, error: salaErr } = await supabase
    .from('salas').select('coste_hora').eq('id', salaId).single();
  if (salaErr || !sala) return new NextResponse('OK');

  const horas = slots.reduce(
    (acc, t) => acc + ((new Date(t.end).getTime() - new Date(t.start).getTime()) / 36e5),
    0
  );
  const totalCalc = Number((horas * Number(sala.coste_hora)).toFixed(2));
  const totalRedsys = Math.round(amountCt) / 100;

  const { data: resNew, error: resErr } = await supabase
    .from('reservas')
    .insert({
      nombre: customer.nombre ?? null,
      correo: customer.correo ?? null,
      telefono: customer.telefono ?? null,
      info_adicional: customer.info_adicional ?? null,
      estado: 'pagada',
      total: totalRedsys || totalCalc,
      referencia_pago: order,
    })
    .select('id')
    .single();

  if (resErr) return new NextResponse('OK');

  const rows = slots.map((t) => ({
    reserva_id: resNew.id,
    sala_id: salaId,
    inicio: t.start,
    fin: t.end,
  }));
  await supabase.from('tramos_reservados').insert(rows);

  console.log('REDSYS NOTIFY: creada por fallback (pagada)', { order, reservaId: resNew.id });
  return new NextResponse('OK');
}

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
  if (!paramsB64 || !sigGiven) return new NextResponse('OK');
  return processNotification(paramsB64, sigGiven);
}
