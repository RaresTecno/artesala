/* app/api/redsys/notification/route.js */
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';
import { createClient } from '@supabase/supabase-js';

/* Firma */
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
const toStdB64 = (s) => s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);

function calcSignature(order, paramsB64) {
  const key = deriveKey(order);
  return CryptoJS.HmacSHA256(paramsB64, key).toString(CryptoJS.enc.Base64);
}

export async function POST(request) {
  try {
    // 1) Redsys envía x-www-form-urlencoded
    const bodyText = await request.text();
    const qs = new URLSearchParams(bodyText);
    const paramsB64 = qs.get('Ds_MerchantParameters');
    const recvSig = qs.get('Ds_Signature');
    if (!paramsB64 || !recvSig) return new NextResponse('ERROR', { status: 400 });

    // 2) Parseo parámetros
    const params = JSON.parse(
      CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(paramsB64))
    );
    const order = String(params['Ds_Order']);
    const respCode = parseInt(params['Ds_Response'], 10); // 0..99 OK
    const amountCt = parseInt(params['Ds_Amount'] || '0', 10); // céntimos
    const dsSig = String(recvSig);

    // 3) Verificación de firma (url-safe)
    const expected = calcSignature(order, paramsB64);
    const given = toStdB64(dsSig); // normaliza la de Redsys (url-safe -> estándar)
    if (expected !== given) return new NextResponse('ERROR', { status: 400 });

    // 4) Solo seguimos si autorizado
    if (!(respCode >= 0 && respCode <= 99)) {
      return new NextResponse('OK'); // KO/denegado: no insertamos
    }

    // 5) Recuperar MerchantData (customerData + extra)
    let md = {};
    const raw = params['Ds_MerchantData'];
    if (raw) {
      try { md = JSON.parse(raw); } catch { md = {}; }
    }
    const customer = md.customerData || {};
    const extra = md.extra || {};
    const salaId = Number(extra.salaId);
    const tramos = Array.isArray(extra.selectedSlots) ? extra.selectedSlots : [];

    if (!salaId || tramos.length === 0) {
      return new NextResponse('ERROR', { status: 400 });
    }

    // 6) (Recomendado) Recalcular total desde BD
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    const { data: sala, error: salaErr } = await supabase
      .from('salas').select('coste_hora').eq('id', salaId).single();
    if (salaErr || !sala) return new NextResponse('ERROR', { status: 400 });

    const horas = tramos.reduce((acc, t) => {
      const h = (new Date(t.end).getTime() - new Date(t.start).getTime()) / (1000 * 60 * 60);
      return acc + h;
    }, 0);
    const totalRecalc = Number((horas * Number(sala.coste_hora)).toFixed(2));
    const totalRedsys = Math.round(amountCt) / 100;

    if (Math.abs(totalRecalc - totalRedsys) > 0.01) {
      // Log de discrepancias por si hay redondeos distintos
      console.warn('Descuadre importes', { totalRecalc, totalRedsys, order });
    }

    // 7) Persistir de forma atómica + idempotente
    const { data: reservaId, error: rpcErr } = await supabase.rpc('crear_reserva_con_tramos', {
      p_nombre: customer.nombre ?? null,
      p_correo: customer.correo ?? null,
      p_telefono: customer.telefono ?? null,
      p_info_adicional: customer.info_adicional ?? null,
      p_total: totalRedsys,
      p_estado: 'pagada',
      p_referencia_pago: order,   // idempotencia con índice único
      p_sala_id: salaId,
      p_tramos: tramos
    });
    if (rpcErr) {
      // Si ya se insertó (reenvíos Redsys), tratamos como OK
      if ((rpcErr).code === '23505') return new NextResponse('OK');
      console.error('RPC error', rpcErr);
      return new NextResponse('ERROR', { status: 500 });
    }

    return new NextResponse('OK');
  } catch (err) {
    console.error('Redsys notif error', err);
    return new NextResponse('ERROR', { status: 500 });
  }
}
