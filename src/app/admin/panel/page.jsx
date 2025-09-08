'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  CalendarClock, ChevronLeft, ChevronRight, Clock, Mail, Phone, User, LogOut, PlusCircle,
} from 'lucide-react';

const dayNames = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

function startOfWeekMonday(d = new Date()) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // 0 = Monday
  date.setHours(0,0,0,0);
  date.setDate(date.getDate() - day);
  return date;
}
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function fmtTime(iso) { return new Date(iso).toLocaleTimeString('es-ES', {hour:'2-digit',minute:'2-digit',hour12:false}); }
function fmtDate(iso) { return new Date(iso).toLocaleDateString('es-ES'); }

export default function AdminPanelPage() {
  const router = useRouter();
  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  const [sessionEmail, setSessionEmail] = useState(null);
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday());
  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openIds, setOpenIds] = useState({});
  const [err, setErr] = useState(null);

  // Campos reserva manual recurrente
  const [manual, setManual] = useState({
    nombre: '', correo: '', prefijo: '+34', telefono: '', info_adicional: '',
    sala_id: 1,
    desde: new Date().toISOString().slice(0,10),
    hasta: addDays(new Date(), 30).toISOString().slice(0,10),
    horas: { inicio: '17:00', fin: '19:00' },
    dow: { L:false, M:false, X:false, J:false, V:false, S:false, D:false }
  });
  const [saving, setSaving] = useState(false);

  // Gate: comprobar sesión y email de admin
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      const email = data?.user?.email;
      if (!mounted) return;
      if (!email || String(email).toLowerCase() !== String(ADMIN_EMAIL || '').toLowerCase()) {
        router.replace('/admin/login');
      } else {
        setSessionEmail(email);
      }
    });
    return () => { mounted = false; };
  }, [router, ADMIN_EMAIL]);

  const fetchWeek = useCallback(async () => {
    if (!sessionEmail) return;
    setLoading(true);
    setErr(null);
    try {
      // Traer todos los tramos de la semana con la reserva asociada
      const { data, error } = await supabase
        .from('tramos_reservados')
        .select(`
          id, sala_id, inicio, fin,
          reserva:reserva_id (
            id, nombre, correo, telefono, info_adicional, total, estado, created_at
          )
        `)
        .gte('inicio', weekStart.toISOString())
        .lt('inicio', weekEnd.toISOString())
        .order('inicio', { ascending: true });
      if (error) throw error;
      setRows(data || []);
    } catch (e) {
      setErr(e.message || 'Error cargando semana');
    } finally {
      setLoading(false);
    }
  }, [sessionEmail, weekStart, weekEnd]);

  useEffect(() => { fetchWeek(); }, [fetchWeek]);

  const grouped = useMemo(() => {
    const byDay = new Map(); // key yyyy-mm-dd
    for (let i=0;i<7;i++) {
      const d = addDays(weekStart, i);
      const key = d.toISOString().slice(0,10);
      byDay.set(key, []);
    }
    for (const r of rows) {
      const key = new Date(r.inicio).toISOString().slice(0,10);
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key).push(r);
    }
    return byDay;
  }, [rows, weekStart]);

  const toggleOpen = (id) => setOpenIds(prev => ({...prev, [id]: !prev[id]}));

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace('/admin/login');
  };

  // ---- Reserva manual recurrente ----
  function hoursDiff(a, b) {
    const [ah, am] = a.split(':').map(Number);
    const [bh, bm] = b.split(':').map(Number);
    return (bh + bm/60) - (ah + am/60);
  }
  function selectedDows() {
    const m = manual.dow;
    return [
      m.L && 1, m.M && 2, m.X && 3, m.J && 4, m.V && 5, m.S && 6, m.D && 0
    ].filter(Boolean);
  }
  function* occurrences() {
    const start = new Date(`${manual.desde}T00:00:00`);
    const end = new Date(`${manual.hasta}T23:59:59`);
    for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
      if (selectedDows().includes(d.getDay())) {
        const [ih, im] = manual.horas.inicio.split(':').map(Number);
        const [fh, fm] = manual.horas.fin.split(':').map(Number);
        const from = new Date(d); from.setHours(ih, im, 0, 0);
        const to = new Date(d); to.setHours(fh, fm, 0, 0);
        if (to > from) yield { start: from, end: to };
      }
    }
  }

  const createRecurring = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const occs = Array.from(occurrences());
      if (occs.length === 0) throw new Error('No hay ocurrencias con esa configuración.');

      // coste_hora de la sala
      const { data: sala, error: salaErr } = await supabase
        .from('salas').select('coste_hora').eq('id', manual.sala_id).single();
      if (salaErr) throw salaErr;
      const horas = hoursDiff(manual.horas.inicio, manual.horas.fin);
      const total = Math.max(0, horas * sala.coste_hora * occs.length);

      // 1) crear reserva (una para toda la serie)
      const telefono = `${manual.prefijo}${manual.telefono}`.replace(/\s+/g, '');
      const { data: resv, error: insErr } = await supabase
        .from('reservas')
        .insert({
          nombre: manual.nombre,
          correo: manual.correo,
          telefono,
          info_adicional: manual.info_adicional || null,
          estado: 'confirmada',        // creada manualmente por admin
          total,
          referencia_pago: 'ADMIN'
        })
        .select('id')
        .single();
      if (insErr) throw insErr;

      // 2) crear tramos
      const payload = occs.map(({ start, end }) => ({
        reserva_id: resv.id,
        sala_id: manual.sala_id,
        inicio: start.toISOString(),
        fin: end.toISOString(),
      }));
      const { error: tramoErr } = await supabase.from('tramos_reservados').insert(payload);
      if (tramoErr) throw tramoErr;

      // limpiar y refrescar
      setManual((m) => ({ ...m, nombre:'', correo:'', telefono:'', info_adicional:'' }));
      await fetchWeek();
      alert('Serie creada correctamente.');
    } catch (e2) {
      setErr(e2.message || 'Error creando la serie.');
    } finally {
      setSaving(false);
    }
  };

  if (!sessionEmail) {
    // Mientras validamos sesión/admin
    return (
      <main className="min-h-screen grid place-items-center bg-orange-50">
        <div className="text-sm text-zinc-600">Comprobando acceso…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-600 via-orange-500 to-orange-600 p-4">
      <div className="mx-auto max-w-6xl rounded-2xl bg-white/95 p-5 shadow-lg">
        <header className="mb-5 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Panel de control · ArteSala</h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-lg bg-zinc-100 px-2 py-1">{sessionEmail}</span>
            <button onClick={signOut} className="inline-flex items-center gap-2 rounded-lg border px-3 py-1 hover:bg-zinc-50">
              <LogOut className="h-4 w-4" /> Salir
            </button>
          </div>
        </header>

        {err && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {err}
          </div>
        )}

        {/* Controles semana */}
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <button
              className="rounded-lg border px-2 py-1 hover:bg-zinc-50"
              onClick={() => setWeekStart(addDays(weekStart, -7))}
              title="Semana anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="rounded-lg bg-zinc-100 px-3 py-1 text-sm">
              Semana: {fmtDate(weekStart)} — {fmtDate(addDays(weekEnd, -1))}
            </div>
            <button
              className="rounded-lg border px-2 py-1 hover:bg-zinc-50"
              onClick={() => setWeekStart(addDays(weekStart, 7))}
              title="Semana siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <button
            className="rounded-lg border px-3 py-1 text-sm hover:bg-zinc-50"
            onClick={() => setWeekStart(startOfWeekMonday(new Date()))}
          >
            Ir a esta semana
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Columna izquierda: resumen semanal */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-4">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
              <CalendarClock className="h-5 w-5 text-orange-600" />
              Resumen semanal (por día)
            </h2>

            {loading ? (
              <div className="p-4 text-sm text-zinc-600">Cargando…</div>
            ) : (
              <div className="space-y-4">
                {[...Array(7)].map((_, i) => {
                  const d = addDays(weekStart, i);
                  const key = d.toISOString().slice(0,10);
                  const items = grouped.get(key) || [];
                  return (
                    <div key={key} className="rounded-xl border border-zinc-200">
                      <div className="flex items-center justify-between border-b px-3 py-2">
                        <div className="font-medium">
                          {dayNames[d.getDay()]} · {fmtDate(d)}
                        </div>
                        <div className="text-xs text-zinc-500">{items.length} reserva(s)</div>
                      </div>
                      {items.length === 0 ? (
                        <div className="px-3 py-3 text-sm text-zinc-500">Sin reservas.</div>
                      ) : (
                        <ul className="divide-y">
                          {items.map((r) => (
                            <li key={r.id} className="px-3 py-2">
                              <button
                                className="w-full text-left"
                                onClick={() => toggleOpen(r.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="min-w-0">
                                    <div className="truncate text-sm font-medium">
                                      {r.reserva?.nombre || '—'}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-zinc-600">
                                      <Clock className="h-3.5 w-3.5" />
                                      {fmtTime(r.inicio)} – {fmtTime(r.fin)} · Sala {r.sala_id}
                                    </div>
                                  </div>
                                  <div className="text-xs text-zinc-500">
                                    {openIds[r.id] ? 'Ocultar' : 'Ver'} detalles
                                  </div>
                                </div>
                              </button>

                              {openIds[r.id] && (
                                <div className="mt-2 rounded-lg bg-zinc-50 p-3 text-sm">
                                  <div className="mb-1 flex items-center gap-2">
                                    <User className="h-4 w-4 text-zinc-500" />
                                    <span>{r.reserva?.nombre}</span>
                                  </div>
                                  <div className="mb-1 flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-zinc-500" />
                                    <span>{r.reserva?.correo}</span>
                                  </div>
                                  <div className="mb-1 flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-zinc-500" />
                                    <span>{r.reserva?.telefono}</span>
                                  </div>
                                  {r.reserva?.info_adicional && (
                                    <div className="mt-2 text-xs text-zinc-600">
                                      {r.reserva.info_adicional}
                                    </div>
                                  )}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Columna derecha: reservas manuales recurrentes */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-4">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
              <PlusCircle className="h-5 w-5 text-orange-600" />
              Reservas manuales recurrentes
            </h2>

            <form onSubmit={createRecurring} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Sala</label>
                  <input
                    type="number"
                    min={1}
                    value={manual.sala_id}
                    onChange={(e)=>setManual(m=>({...m, sala_id: Number(e.target.value)}))}
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Nombre</label>
                  <input
                    value={manual.nombre}
                    onChange={(e)=>setManual(m=>({...m, nombre: e.target.value}))}
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Correo</label>
                  <input
                    type="email"
                    value={manual.correo}
                    onChange={(e)=>setManual(m=>({...m, correo: e.target.value}))}
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                    required
                  />
                </div>

                <div className="grid grid-cols-[90px,1fr] gap-2">
                  <div>
                    <label className="text-sm font-medium">Prefijo</label>
                    <input
                      value={manual.prefijo}
                      onChange={(e)=>setManual(m=>({...m, prefijo: e.target.value}))}
                      className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                      placeholder="+34"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Teléfono</label>
                    <input
                      value={manual.telefono}
                      onChange={(e)=>setManual(m=>({...m, telefono: e.target.value}))}
                      className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                      placeholder="600000000"
                      required
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Información adicional</label>
                  <textarea
                    rows={3}
                    value={manual.info_adicional}
                    onChange={(e)=>setManual(m=>({...m, info_adicional: e.target.value}))}
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Desde</label>
                  <input
                    type="date"
                    value={manual.desde}
                    onChange={(e)=>setManual(m=>({...m, desde: e.target.value}))}
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Hasta</label>
                  <input
                    type="date"
                    value={manual.hasta}
                    onChange={(e)=>setManual(m=>({...m, hasta: e.target.value}))}
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Hora inicio</label>
                  <input
                    type="time"
                    value={manual.horas.inicio}
                    onChange={(e)=>setManual(m=>({...m, horas: {...m.horas, inicio: e.target.value}}))}
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Hora fin</label>
                  <input
                    type="time"
                    value={manual.horas.fin}
                    onChange={(e)=>setManual(m=>({...m, horas: {...m.horas, fin: e.target.value}}))}
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-1">Días de la semana</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    ['L','Lun'], ['M','Mar'], ['X','Mié'], ['J','Jue'],
                    ['V','Vie'], ['S','Sáb'], ['D','Dom']
                  ].map(([k,label]) => (
                    <label key={k} className="inline-flex items-center gap-2 rounded-lg border px-3 py-1">
                      <input
                        type="checkbox"
                        checked={manual.dow[k]}
                        onChange={(e)=>setManual(m=>({...m, dow: {...m.dow, [k]: e.target.checked}}))}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
              >
                {saving ? 'Creando…' : 'Crear serie'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
