/* app/api/redsys/notification/route.js */
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';
import { createClient } from '@supabase/supabase-js';

/* ───────── Firma Redsys (Edge-safe) ───────── */

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
  try {
    // Vars necesarias
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!process.env.REDSYS_SECRET_KEY || !SUPABASE_URL || !SERVICE_ROLE) {
      console.error('REDSYS NOTIFY: env vars faltantes');
      return new NextResponse('ERROR', { status: 500 });
    }

    // Redsys manda x-www-form-urlencoded
    const bodyText = await request.text();
    const qs = new URLSearchParams(bodyText);
    const paramsB64 = qs.get('Ds_MerchantParameters');
    const sigGiven  = qs.get('Ds_Signature');
    if (!paramsB64 || !sigGiven) return new NextResponse('ERROR', { status: 400 });

    // Decodificar + verificar firma
    const paramsJson = CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(paramsB64));
    const params = JSON.parse(paramsJson);

    const order    = String(params['Ds_Order'] ?? '');
    const respCode = parseInt(params['Ds_Response'] ?? '999', 10);
    const amountCt = parseInt(params['Ds_Amount'] ?? '0', 10);

    const expected = calcSignature(order, paramsB64);
    const givenStd = toStdB64(sigGiven);
    if (expected !== givenStd) return new NextResponse('ERROR', { status: 400 });

    // Solo continuar si autorizado (0..99)
    if (!(respCode >= 0 && respCode <= 99)) return new NextResponse('OK');

    // MerchantData (todas las variantes)
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
      console.warn('REDSYS NOTIFY: MerchantData vacío/incompleto', { order });
      return new NextResponse('OK');
    }

    // Supabase (service role)
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

    // (Opcional) Rescálculo de total desde BD
    const { data: sala, error: salaErr } = await supabase
      .from('salas').select('coste_hora').eq('id', salaId).single();
    if (salaErr || !sala) return new NextResponse('ERROR', { status: 500 });

    const horas = tramos.reduce((acc, t) =>
      acc + ((new Date(t.end).getTime() - new Date(t.start).getTime()) / 36e5), 0);
    const totalRecalc = Number((horas * Number(sala.coste_hora)).toFixed(2));
    const totalRedsys = Math.round(amountCt) / 100;
    if (Math.abs(totalRecalc - totalRedsys) > 0.01) {
      console.warn('REDSYS NOTIFY: descuadre importe', { order, totalRecalc, totalRedsys });
    }

    // 1) Insert reserva (idempotente por referencia_pago)
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
      // 23505 = duplicado (ya insertado en reintento)
      if (resErr.code === '23505') return new NextResponse('OK');
      console.error('REDSYS NOTIFY: error insert reserva', resErr);
      return new NextResponse('ERROR', { status: 500 });
    }

    // 2) Insert tramos
    const rows = tramos.map(t => ({
      reserva_id: reserva.id,
      sala_id: salaId,
      inicio: t.start,
      fin: t.end
    }));
    const { error: trErr } = await supabase.from('tramos_reservados').insert(rows);
    if (trErr) {
      console.error('REDSYS NOTIFY: error insert tramos', trErr);
      // limpieza básica para no dejar reserva huérfana (best-effort)
      await supabase.from('reservas').delete().eq('id', reserva.id);
      return new NextResponse('ERROR', { status: 500 });
    }

    return new NextResponse('OK');
  } catch (err) {
    console.error('REDSYS NOTIFY: unhandled error', err);
    return new NextResponse('ERROR', { status: 500 });
  }
}
