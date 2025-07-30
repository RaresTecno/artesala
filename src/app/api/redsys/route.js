/*  app/api/redsys/route.js  */
export const runtime = 'edge';          // 👈 Cloudflare Pages Functions (Edge)

import { NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';

const {
  REDSYS_MERCHANT_CODE,
  REDSYS_TERMINAL,
  REDSYS_CURRENCY,
  REDSYS_URL,
  REDSYS_SECRET_KEY,     // clave Base64 enviada por Redsys
  BASE_URL               // dominio público de tu despliegue
} = process.env;

/* Nº de pedido válido (4-12 dígitos) */
const generateOrder = () => `${Date.now()}`.slice(-12).padStart(4, '0');

/* ---------- Firma Redsys con crypto-js ---------- */
function deriveKey(order) {
  const masterKey = CryptoJS.enc.Base64.parse(REDSYS_SECRET_KEY);       // 24 bytes
  let block = CryptoJS.enc.Utf8.parse(order);
  const pad = (8 - (block.sigBytes % 8)) % 8;                          // rellenar 0x00
  if (pad) block = CryptoJS.lib.WordArray.create(block.words, block.sigBytes + pad);

  const iv = CryptoJS.enc.Hex.parse('0000000000000000');
  const cipher = CryptoJS.TripleDES.encrypt(block, masterKey, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.NoPadding
  });
  return cipher.ciphertext;                                            // WordArray
}

function createSignature(order, merchantParamsB64) {
  const key = deriveKey(order);
  return CryptoJS
    .HmacSHA256(merchantParamsB64, key)
    .toString(CryptoJS.enc.Base64);
}
/* ----------------------------------------------- */

export async function POST(req) {
  try {
    const { amount, description, customerData = {}, extra = {} } = await req.json();
    if (!(amount > 0) || !description)
      return NextResponse.json({ error: 'amount y description obligatorios > 0' }, { status: 400 });

    const order = generateOrder();

    /* Parámetros que exige Redsys */
    const merchantParams = {
      Ds_Merchant_Amount: Math.round(amount * 100).toString(),
      Ds_Merchant_Currency: REDSYS_CURRENCY,
      Ds_Merchant_Order: order,
      Ds_Merchant_MerchantCode: REDSYS_MERCHANT_CODE,
      Ds_Merchant_Terminal: REDSYS_TERMINAL,
      Ds_Merchant_TransactionType: '0',
      Ds_Merchant_ProductDescription: description,
      Ds_Merchant_Titular: customerData.nombre || 'Cliente ArteSala',
      Ds_Merchant_MerchantURL: `${BASE_URL}/api/redsys/notification`,
      Ds_Merchant_UrlOK: `${BASE_URL}/pago/ok`,
      Ds_Merchant_UrlKO: `${BASE_URL}/pago/ko`,
      Ds_Merchant_MerchantData: JSON.stringify(extra)
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
