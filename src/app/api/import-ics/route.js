import { NextResponse } from 'next/server';
import ical from 'node-ical'; // añade en tu server: npm i node-ical
import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
  try {
    const { url, sala_id } = await req.json();
    if (!url || !sala_id) return NextResponse.json({error:'Faltan campos'}, {status:400});

    const data = await ical.async.fromURL(url);
    const events = Object.values(data).filter((e) => e.type === 'VEVENT');

    // TODO: deduplicar por UID/DTSTART si lo deseas
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Por simplicidad: una reserva por import, múltiples tramos asociados
    const { data: resv, error: rErr } = await supabase
      .from('reservas')
      .insert({ nombre: 'Import ICS', correo: 'import@ics', telefono:'', estado:'confirmada', total:0, referencia_pago:'ICS' })
      .select('id')
      .single();
    if (rErr) throw rErr;

    const payload = [];
    for (const ev of events) {
      if (!ev.start || !ev.end) continue;
      payload.push({
        reserva_id: resv.id,
        sala_id,
        inicio: new Date(ev.start).toISOString(),
        fin: new Date(ev.end).toISOString(),
      });
    }
    if (payload.length) {
      const { error: tErr } = await supabase.from('tramos_reservados').insert(payload);
      if (tErr) throw tErr;
    }
    return NextResponse.json({ ok: true, count: payload.length });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Error importando ICS' }, { status: 500 });
  }
}
