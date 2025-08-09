export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_ROLE) return NextResponse.json({ ok:false, err:'env' },{ status:500 });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .from('reservas')
    .insert({ nombre: 'test', correo: 't@t.com', telefono: '000', estado:'pagada', total: 1, referencia_pago: `dbg_${Date.now()}` })
    .select('id')
    .single();

  if (error) return NextResponse.json({ ok:false, error }, { status:500 });
  return NextResponse.json({ ok:true, id:data.id });
}
