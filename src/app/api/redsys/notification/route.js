/* app/api/redsys/notification/route.js */
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';
import { createClient } from '@supabase/supabase-js';

/* ───────────────────────── Utilidades de firma ───────────────────────── */

function deriveKey(order) {
  // Clave maestra en Base64 del TPV
  const masterKey = CryptoJS.enc.Base64.parse(process.env.REDSYS_SECRET_KEY);
  const iv = CryptoJS.enc.Hex.parse('0000000000000000');

  // TripleDES-CBC con ZeroPadding (relevante en Edge)
  const cipher = CryptoJS.TripleDES.encrypt(
    CryptoJS.enc.Utf8.parse(order),
    masterKey,
    { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.ZeroPadding }
  );
  // La clave derivada es el ciphertext
  return cipher.ciphertext;
}

function calcSignature(order, paramsB64) {
  const key = deriveKey(order);
  // Base64 estándar
  return CryptoJS.HmacSHA256(paramsB64, key).toString(CryptoJS.enc.Base64);
}

// Convierte Base64 url-safe (de Redsys) a estándar, añadiendo padding
function toStdB64(s) {
  return s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
}

/* MerchantData: tolera JSON plano o Base64 con JSON */
function parseMerchantData(input) {
  if (!input) return {};
  try {
    return JSON.parse(input);
  } catch {
    try {
      const asJson = CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(input));
      return JSON.parse(asJson);
    } catch {
      return {};
    }
  }
}

/* ───────────────────────── Handler ───────────────────────── */

export async function POST(request) {
  try {
    // Redsys envía application/x-www-form-urlencoded
    const bodyText = await request.text();
    const qs = new URLSearchParams(bodyText);

    const paramsB64 = qs.get('Ds_MerchantParameters');
    const sigGiven  = qs.get('Ds_Signature');

    if (!paramsB64 || !sigGiven) {
      return new NextResponse('ERROR', { status: 400 });
    }

    // Decodificar parámetros sin usar Buffer (Edge-safe)
    const paramsJson = CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(paramsB64));
    const params = JSON.parse(paramsJson);

    const order    = String(params['Ds_Order'] ?? '');
    const respCode = parseInt(params['Ds_Response'] ?? '999', 10);
    const amountCt = parseInt(params['Ds_Amount'] ?? '0', 10);

    // Verificar firma: nosotros calculamos Base64 estándar; Redsys envía url-safe
    const expected = calcSignature(order, paramsB64);
    const givenStd = toStdB64(sigGiven);
    if (expected !== givenStd) {
      return new NextResponse('ERROR', { status: 400 });
    }

    // Solo continuamos si autorizado (0..99)
    if (!(respCode >= 0 && respCode <= 99)) {
      return new NextResponse('OK'); // KO/denegada: responder 200 para no reintentar
    }

    // Recuperar MerchantData tal y como lo enviaste en la creación
    const mdRaw = params['Ds_MerchantData'] || params['DS_MERCHANT_MERCHANTDATA'];
    const md = parseMerchantData(mdRaw);

    const customer = md.customerData || {};
    const extra    = md.extra || {};
    const salaId   = Number(extra.salaId);
    const tramos   = Array.isArray(extra.selectedSlots) ? extra.selectedSlots : [];

    if (!salaId || tramos.length === 0) {
      // No hay datos suficientes para persistir; responder OK para evitar reintentos
      return new NextResponse('OK');
    }

    // Cliente Supabase (service role) — solo en backend/callback
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    // (Recomendado) Validar importe recalculando desde BD
    const { data: sala, error: salaErr } = await supabase
      .from('salas')
      .select('coste_hora')
      .eq('id', salaId)
      .single();

    if (salaErr || !sala) {
      // No bloqueamos el flujo de Redsys; responder OK para que no reintente
      console.warn('Sala no encontrada en callback Redsys', { salaId, salaErr });
      return new NextResponse('OK');
    }

    const horas = tramos.reduce((acc, t) => {
      return acc + ((new Date(t.end).getTime() - new Date(t.start).getTime()) / 36e5);
    }, 0);

    const totalRecalc = Number((horas * Number(sala.coste_hora)).toFixed(2));
    const totalRedsys = Math.round(amountCt) / 100;

    if (Math.abs(totalRecalc - totalRedsys) > 0.01) {
      console.warn('Descuadre importes Redsys vs BD', { totalRecalc, totalRedsys, order });
      // No bloqueamos; seguimos guardando con el importe efectivamente cobrado
    }

    // Inserción atómica e idempotente mediante RPC
    const { error: rpcErr } = await supabase.rpc('crear_reserva_con_tramos', {
      p_nombre: customer.nombre ?? null,
      p_correo: customer.correo ?? null,
      p_telefono: customer.telefono ?? null,
      p_info_adicional: customer.info_adicional ?? null,
      p_total: totalRedsys,               // Importe cobrado (EUR)
      p_estado: 'pagada',
      p_referencia_pago: order,           // Idempotencia por ORDER (index único)
      p_sala_id: salaId,
      p_tramos: tramos                    // [{ start, end, salaId }]
    });

    if (rpcErr && rpcErr.code !== '23505') {
      // 23505 = duplicado por reintento; el resto, log y OK para evitar reintentos
      console.error('RPC crear_reserva_con_tramos error', rpcErr);
    }

    return new NextResponse('OK'); // Siempre 200 para Redsys
  } catch (err) {
    console.error('Redsys notification error', err);
    // Responder 200 evita reintentos infinitos si el problema es nuestro;
    // si prefieres que Redsys reintente, devuelve 500.
    return new NextResponse('OK');
  }
}
