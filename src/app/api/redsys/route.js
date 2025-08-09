/* app/api/redsys/route.js */
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';
import { createClient } from '@supabase/supabase-js';

const {
  REDSYS_MERCHANT_CODE,
  REDSYS_TERMINAL,
  REDSYS_CURRENCY,
  REDSYS_URL,
  REDSYS_SECRET_KEY,
  BASE_URL,
  SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} = process.env;

/* Nº de pedido válido (4-12 dígitos) */
const generateOrder = () => `${Date.now()}`.slice(-12).padStart(4, '0');

/* Firma Redsys (Edge-safe) */
function deriveKey(order) {
  const masterKey = CryptoJS.enc.Base64.parse(REDSYS_SECRET_KEY);
  const iv = CryptoJS.enc.Hex.parse('0000000000000000');
  const cipher = CryptoJS.TripleDES.encrypt(
    CryptoJS.enc.Utf8.parse(order),
    masterKey,
    { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.ZeroPadding }
  );
  return cipher.ciphertext;
}
function createSignature(order, merchantParamsB64) {
  const key = deriveKey(order);
  return CryptoJS.HmacSHA256(merchantParamsB64, key).toString(CryptoJS.enc.Base64);
}

export async function POST(req) {
  try {
    const { amount, description, customerData = {}, extra = {} } = await req.json();
    const { salaId, selectedSlots = [] } = extra;

    const sbUrl = SUPABASE_URL || NEXT_PUBLIC_SUPABASE_URL;
    if (!sbUrl || !SUPABASE_SERVICE_ROLE_KEY || !REDSYS_SECRET_KEY) {
      console.error('REDSYS CREATE: Faltan variables de entorno');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }
    if (!salaId || !Array.isArray(selectedSlots) || selectedSlots.length === 0) {
      return NextResponse.json({ error: 'Slots o sala inválidos' }, { status: 400 });
    }

    // Recalcular total en servidor (seguridad)
    const supabase = createClient(sbUrl, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { data: sala, error: salaErr } = await supabase
      .from('salas')
      .select('coste_hora')
      .eq('id', salaId)
      .single();
    if (salaErr || !sala) {
      console.error('REDSYS CREATE: sala no encontrada', salaErr);
      return NextResponse.json({ error: 'Sala no encontrada' }, { status: 400 });
    }

    const diffHours = (a, b) => (new Date(b).getTime() - new Date(a).getTime()) / 36e5;
    const horas = selectedSlots.reduce((acc, t) => acc + diffHours(t.start, t.end), 0);
    const totalSrv = Number((horas * Number(sala.coste_hora)).toFixed(2));
    if (!(totalSrv > 0)) {
      return NextResponse.json({ error: 'Total inválido' }, { status: 400 });
    }

    // 1) Crear reserva PENDIENTE (idempotencia por referencia_pago = order)
    const order = generateOrder();

    const { data: reserva, error: resErr } = await supabase
      .from('reservas')
      .insert({
        nombre: customerData.nombre ?? null,
        correo: customerData.correo ?? null,
        telefono: customerData.telefono ?? null,
        info_adicional: customerData.info_adicional ?? null,
        estado: 'pendiente',
        total: totalSrv,
        referencia_pago: order,
      })
      .select('id')
      .single();

    if (resErr) {
      console.error('REDSYS CREATE: error insert reserva', resErr);
      return NextResponse.json({ error: 'No se pudo crear la reserva' }, { status: 500 });
    }

    // 2) Insertar tramos para bloquear calendario mientras se paga
    const rows = selectedSlots.map((t) => ({
      reserva_id: reserva.id,
      sala_id: salaId,
      inicio: t.start,
      fin: t.end,
      // Si deseas utilizar tu columna "rango" (tstzrange) descomenta:
      // rango: `[${new Date(t.start).toISOString()},${new Date(t.end).toISOString()})`,
    }));
    const { error: trErr } = await supabase.from('tramos_reservados').insert(rows);
    if (trErr) {
      console.error('REDSYS CREATE: error insert tramos (rollback reserva)', trErr);
      // rollback la reserva pendiente para no dejar residuos
      await supabase.from('reservas').delete().eq('id', reserva.id);
      return NextResponse.json({ error: 'No se pudieron registrar los tramos' }, { status: 500 });
    }

    // 3) Parámetros Redsys
    const merchantParams = {
      Ds_Merchant_Amount: Math.round(totalSrv * 100).toString(),
      Ds_Merchant_Currency: REDSYS_CURRENCY,
      Ds_Merchant_Order: order,
      Ds_Merchant_MerchantCode: REDSYS_MERCHANT_CODE,
      Ds_Merchant_Terminal: REDSYS_TERMINAL,
      Ds_Merchant_TransactionType: '0',
      Ds_Merchant_ProductDescription: description || `Reserva Sala ${salaId}`,
      Ds_Merchant_Titular: customerData.nombre || 'Cliente',
      Ds_Merchant_MerchantURL: `${BASE_URL}/api/redsys/notification`,
      Ds_Merchant_UrlOK: `${BASE_URL}/pago/ok`,
      Ds_Merchant_UrlKO: `${BASE_URL}/pago/ko`,
      // Opcional: se envía igualmente, pero ya no dependemos de que vuelva
      Ds_Merchant_MerchantData: JSON.stringify({ customerData, extra: { salaId, selectedSlots } }),
    };

    const paramsB64 = CryptoJS.enc.Base64.stringify(
      CryptoJS.enc.Utf8.parse(JSON.stringify(merchantParams))
    );
    const signature = createSignature(order, paramsB64);

    return NextResponse.json({
      url: REDSYS_URL,
      Ds_SignatureVersion: 'HMAC_SHA256_V1',
      Ds_MerchantParameters: paramsB64,
      Ds_Signature: signature,
    });
  } catch (err) {
    console.error('Redsys route error', err);
    return NextResponse.json({ error: 'Error interno Redsys' }, { status: 500 });
  }
}
