/* app/api/redsys/route.js */
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';

const {
  REDSYS_MERCHANT_CODE,
  REDSYS_TERMINAL,
  REDSYS_CURRENCY,
  REDSYS_URL,
  REDSYS_SECRET_KEY,
  BASE_URL
} = process.env;

/* Nº de pedido válido (4-12 dígitos) */
const generateOrder = () => `${Date.now()}`.slice(-12).padStart(4, '0');

/* -------- Firma Redsys (Edge-safe) -------- */
function deriveKey(order) {
  const masterKey = CryptoJS.enc.Base64.parse(REDSYS_SECRET_KEY);
  const iv = CryptoJS.enc.Hex.parse('0000000000000000');
  const cipher = CryptoJS.TripleDES.encrypt(
    CryptoJS.enc.Utf8.parse(order),
    masterKey,
    { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.ZeroPadding }
  );
  return cipher.ciphertext; // WordArray (clave derivada)
}
function createSignature(order, merchantParamsB64) {
  const key = deriveKey(order);
  return CryptoJS.HmacSHA256(merchantParamsB64, key).toString(CryptoJS.enc.Base64);
}
/* ------------------------------------------ */

export async function POST(req) {
  try {
    const { amount, description, customerData = {}, extra = {} } = await req.json();
    if (!(amount > 0) || !description) {
      return NextResponse.json({ error: 'amount y description obligatorios > 0' }, { status: 400 });
    }

    const order = generateOrder();

    // Parámetros exigidos por Redsys
    const merchantParams = {
      Ds_Merchant_Amount: Math.round(amount * 100).toString(),
      Ds_Merchant_Currency: REDSYS_CURRENCY,
      Ds_Merchant_Order: order,
      Ds_Merchant_MerchantCode: REDSYS_MERCHANT_CODE,
      Ds_Merchant_Terminal: REDSYS_TERMINAL,
      Ds_Merchant_TransactionType: '0',
      Ds_Merchant_ProductDescription: description,
      Ds_Merchant_Titular: customerData.nombre || 'Cliente',
      Ds_Merchant_MerchantURL: `${BASE_URL}/api/redsys/notification`,
      Ds_Merchant_UrlOK: `${BASE_URL}/pago/ok`,
      Ds_Merchant_UrlKO: `${BASE_URL}/pago/ko`,
      // MerchantData: JSON plano con todo lo necesario
      Ds_Merchant_MerchantData: JSON.stringify({ customerData, extra })
    };

    const paramsB64 = CryptoJS.enc.Base64.stringify(
      CryptoJS.enc.Utf8.parse(JSON.stringify(merchantParams))
    );
    const signature = createSignature(order, paramsB64);

    return NextResponse.json({
      url: REDSYS_URL,
      Ds_SignatureVersion: 'HMAC_SHA256_V1',
      Ds_MerchantParameters: paramsB64,
      Ds_Signature: signature
    });
  } catch (err) {
    console.error('Redsys route error', err);
    return NextResponse.json({ error: 'Error interno Redsys' }, { status: 500 });
  }
}
