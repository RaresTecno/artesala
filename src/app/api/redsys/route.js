// app/api/redsys/route.js – firma 100 % compatible con guía Redsys
// -------------------------------------------------------------------------
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import crypto from 'crypto';

const {
  REDSYS_MERCHANT_CODE,
  REDSYS_TERMINAL,
  REDSYS_CURRENCY,
  REDSYS_URL,
  REDSYS_SECRET_KEY, // clave secreta en Base64 suministrada por Redsys
  BASE_URL
} = process.env;

/**
 * Genera un nº de pedido (4‑12 dígitos, primeros 4 numéricos) único.
 */
function generateOrder() {
  return `${Date.now()}`.slice(-12).padStart(4, '0');
}

/**
 * Deriva la clave con 3‑DES‑CBC (IV = 0) sobre el nº de pedido, tal como indica Redsys.
 * @param {string} order – Ds_Merchant_Order
 * @returns {Buffer} clave derivada (24 bytes)
 */
function deriveKey(order) {
  // Clave secreta que proporciona Redsys (Base64 → 24 bytes)
  const masterKey = Buffer.from(REDSYS_SECRET_KEY, 'base64');

  // IV todo a ceros
  const iv = Buffer.alloc(8, 0);
  const cipher = crypto.createCipheriv('des-ede3-cbc', masterKey, iv);
  cipher.setAutoPadding(false);

  // Redsys cifra el nº de pedido, rellenado con 0x00 hasta múltiplo de 8
  let orderBuf = Buffer.from(order, 'utf8');
  const pad = 8 - (orderBuf.length % 8);
  if (pad !== 8) orderBuf = Buffer.concat([orderBuf, Buffer.alloc(pad, 0)]);

  return Buffer.concat([cipher.update(orderBuf), cipher.final()]);
}

/**
 * Calcula la firma Base64 (clave derivada + HMAC‑SHA256).
 */
function createSignature(order, merchantParamsB64) {
  const key = deriveKey(order);
  return crypto.createHmac('sha256', key).update(merchantParamsB64).digest('base64');
}

export async function POST(request) {
  try {
    const { amount, description, customerData = {}, extra = {} } = await request.json();
    if (!(amount > 0) || !description) {
      return NextResponse.json({ error: 'amount y description son obligatorios > 0' }, { status: 400 });
    }

    // 1. Campos obligatorios Ds_* ------------------------------------------------
    const order = generateOrder();
    const merchantParams = {
      Ds_Merchant_Amount: Math.round(amount * 100).toString(), // céntimos, sin decimales
      Ds_Merchant_Currency: REDSYS_CURRENCY,                  // 978 = EUR
      Ds_Merchant_Order: order,
      Ds_Merchant_MerchantCode: REDSYS_MERCHANT_CODE,
      Ds_Merchant_Terminal: REDSYS_TERMINAL,
      Ds_Merchant_TransactionType: '0',                       // pago normal
      Ds_Merchant_ProductDescription: description,
      Ds_Merchant_Titular: customerData.nombre || 'Cliente ArteSala',
      Ds_Merchant_MerchantURL: `${BASE_URL}/api/redsys/notification`,
      Ds_Merchant_UrlOK: `${BASE_URL}/pago/ok`,
      Ds_Merchant_UrlKO: `${BASE_URL}/pago/ko`,
      Ds_Merchant_MerchantData: JSON.stringify(extra)
    };

    // 2. JSON → Base64 ----------------------------------------------------------
    const merchantParamsB64 = Buffer.from(JSON.stringify(merchantParams)).toString('base64');

    // 3. Firma ------------------------------------------------------------------
    const signature = createSignature(order, merchantParamsB64);

    // 4. Respuesta al front -----------------------------------------------------
    return NextResponse.json({
      url: REDSYS_URL,
      Ds_SignatureVersion: 'HMAC_SHA256_V1',
      Ds_MerchantParameters: merchantParamsB64,
      Ds_Signature: signature
    });
  } catch (err) {
    console.error('Error Redsys:', err);
    return NextResponse.json({ error: 'Error interno Redsys' }, { status: 500 });
  }
}
