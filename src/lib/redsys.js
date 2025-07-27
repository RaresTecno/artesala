// lib/redsys.js
import crypto from 'crypto';

/**
 * Genera firma HMAC-SHA256 V1 para Redsys según Guía de Integración
 * @param {Object} params
 * @returns {{ Ds_SignatureVersion: string, Ds_MerchantSignature: string }}
 */
export function signPayload({
  Ds_Merchant_Amount,
  Ds_Merchant_MerchantCode,
  Ds_Merchant_Currency,
  Ds_Merchant_TransactionType,
  Ds_Merchant_Order,
  Ds_Merchant_Terminal,
  Ds_Merchant_MerchantURL,
  Ds_Merchant_UrlOK,
  Ds_Merchant_UrlKO
}) {
  const secretKey = process.env.NEXT_PUBLIC_REDSYS_SECRET_KEY || process.env.REDSYS_SECRET_KEY;
  if (!secretKey) throw new Error('REDSYS_SECRET_KEY no configurada en .env');

  // Concatenamos en el orden requerido por Redsys
  const dataString =
    Ds_Merchant_Amount +
    Ds_Merchant_MerchantCode +
    Ds_Merchant_Currency +
    Ds_Merchant_TransactionType +
    Ds_Merchant_Order +
    Ds_Merchant_Terminal +
    Ds_Merchant_MerchantURL +
    Ds_Merchant_UrlOK +
    Ds_Merchant_UrlKO +
    secretKey;

  // Calculamos HMAC-SHA256
  const signature = crypto
    .createHmac('sha256', Buffer.from(secretKey, 'utf8'))
    .update(dataString, 'utf8')
    .digest('hex');

  return {
    Ds_SignatureVersion: 'HMAC_SHA256_V1',
    Ds_MerchantSignature: signature
  };
}
