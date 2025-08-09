/* app/api/redsys/route.js */
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

const generateOrder = () => `${Date.now()}`.slice(-12).padStart(4, '0');

const toB64Url = (b64) =>
  b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/* Firma (igual que tenías) */
function deriveKey(order) {
  const masterKey = CryptoJS.enc.Base64.parse(REDSYS_SECRET_KEY);
  const iv = CryptoJS.enc.Hex.parse('0000000000000000');
  // ZeroPadding garantiza bytes 0x00 hasta múltiplo de 8
  const cipher = CryptoJS.TripleDES.encrypt(
    CryptoJS.enc.Utf8.parse(order),
    masterKey,
    { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.ZeroPadding }
  );
  return cipher.ciphertext; // WordArray
}
function createSignature(order, merchantParamsB64) {
  const key = deriveKey(order);
  // EN EL ENVÍO a Redsys usamos Base64 estándar
  return CryptoJS.HmacSHA256(merchantParamsB64, key).toString(CryptoJS.enc.Base64);
}

export async function POST(req) {
  try {
    const { amount, description, customerData = {}, extra = {} } = await req.json();
    if (!(amount > 0) || !description)
      return NextResponse.json({ error: 'amount y description obligatorios > 0' }, { status: 400 });

    const order = generateOrder();

    const merchantData = JSON.stringify({
      customerData,                 // ← ahora viaja también
      extra                         // { salaId, selectedSlots }
    });

    const merchantParams = {
      Ds_Merchant_Amount: Math.round(Number(amount) * 100).toString(),
      Ds_Merchant_Currency: REDSYS_CURRENCY ?? '978',
      Ds_Merchant_Order: order, // 4-12 dígitos
      Ds_Merchant_MerchantCode: REDSYS_MERCHANT_CODE,
      Ds_Merchant_Terminal: REDSYS_TERMINAL ?? '1',
      Ds_Merchant_TransactionType: '0',
      Ds_Merchant_ProductDescription: description,
      Ds_Merchant_Titular: customerData.nombre || 'Cliente ArteSala',
      Ds_Merchant_MerchantURL: `${BASE_URL}/api/redsys/notification`,
      Ds_Merchant_UrlOK: `${BASE_URL}/pago/ok`,
      Ds_Merchant_UrlKO: `${BASE_URL}/pago/ko`,
      Ds_Merchant_MerchantData: JSON.stringify({ customerData, extra })
    };

    const paramsB64 = CryptoJS.enc.Base64.stringify(
      CryptoJS.enc.Utf8.parse(JSON.stringify(merchantParams))
    );

    const json = JSON.stringify(merchantParams);
    const paramsB645 = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(json));
    console.log('PARAMS_JSON', json);
    console.log('PARAMS_DECODE_CHECK', Buffer.from(paramsB645, 'base64').toString('utf8'));
    console.log('ORDER', order);
    console.log('AMOUNT_CENTS', merchantParams.Ds_Merchant_Amount);


    const signature = createSignature(order, paramsB64); // ← ya url-safe

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
