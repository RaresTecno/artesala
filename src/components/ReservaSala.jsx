'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock, X, User, Mail, Phone, Info, Receipt } from 'lucide-react';
import Calendar from '@/components/Calendar';
import { supabase } from '@/lib/supabaseClient';

export default function ReservaSalaPage({ salaId }) {
  const router = useRouter();

  const [selectedSlots, setSelectedSlots] = useState([]);
  const [form, setForm] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    info_adicional: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Nuevo: coste/hora para mostrar subtotal
  const [costeHora, setCosteHora] = useState(null);

  // ───────────────────────── Helpers UI ─────────────────────────
  const fmtDay = (iso) =>
    new Date(iso).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    });

  const fmtTime = (iso) =>
    new Date(iso).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

  const diffHours = (start, end) =>
    (new Date(end) - new Date(start)) / (1000 * 60 * 60);

  const totalHoras = selectedSlots.reduce(
    (sum, s) => sum + diffHours(s.start, s.end),
    0
  );

  const fmtEUR = (n) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);

  const subtotal = costeHora != null ? Math.max(0, totalHoras * costeHora) : 0;

  // ───────────────────── Carga coste/hora (para subtotal) ────────────────────
  useEffect(() => {
    let alive = true;
    supabase
      .from('salas')
      .select('coste_hora')
      .eq('id', salaId)
      .single()
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) {
          console.error('Error obteniendo coste_hora:', error);
        } else {
          setCosteHora(data?.coste_hora ?? null);
        }
      });
    return () => {
      alive = false;
    };
  }, [salaId]);

  // ───────────────────────── Selección de franjas ─────────────────────────
  const handleDateSelect = ({ start, end }) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const isSameDay =
      startDate.getFullYear() === endDate.getFullYear() &&
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getDate() === endDate.getDate();

    if (!isSameDay) {
      setError('No se puede seleccionar una franja que cruce entre días diferentes.');
      return;
    }

    const newKey = `${startDate.getHours()}-${endDate.getHours()}`;
    const exists = selectedSlots.some((slot) => {
      const s = new Date(slot.start);
      const e = new Date(slot.end);
      return `${s.getHours()}-${e.getHours()}` === newKey;
    });
    if (exists) {
      setError('Ya has seleccionado una franja con ese horario en otro día.');
      return;
    }

    setError(null);
    setSelectedSlots((prev) => [...prev, { salaId, start, end }]);
  };

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleUnselect = (index) =>
    setSelectedSlots((prev) => prev.filter((_, i) => i !== index));

  const handleClearAll = () => setSelectedSlots([]);

  // ───────────────────────── Submit (misma lógica) ─────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSlots.length) {
      setError('Debes seleccionar al menos un tramo.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: salaData, error: salaErr } = await supabase
        .from('salas')
        .select('coste_hora')
        .eq('id', salaId)
        .single();
      if (salaErr) throw salaErr;

      const calcTotal = selectedSlots.reduce(
        (sum, t) =>
          sum +
          ((new Date(t.end) - new Date(t.start)) / (1000 * 60 * 60)) *
            salaData.coste_hora,
        0
      );

      const total = calcTotal;
      if (total <= 0) {
        setError('Importe incorrecto. Selecciona al menos 1 h de reserva.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/redsys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          description: `Reserva Sala ${salaId}`,
          customerData: form,
          extra: { salaId, selectedSlots }
        })
      });
      if (!res.ok) throw new Error('Error generando pago');
      const redsys = await res.json();

      const formPay = document.createElement('form');
      formPay.action = redsys.url;
      formPay.method = 'POST';
      Object.entries(redsys).forEach(([k, v]) => {
        if (k === 'url') return;
        const inp = document.createElement('input');
        inp.type = 'hidden';
        inp.name = k;
        inp.value = v;
        formPay.appendChild(inp);
      });
      document.body.appendChild(formPay);
      formPay.submit();
    } catch (err) {
      setError(err.message || 'Error al procesar la reserva');
    } finally {
      setLoading(false);
    }
  };

  // ───────────────────────── Render ─────────────────────────
  const payLabel =
    !loading && costeHora != null && totalHoras > 0
      ? `Pagar ${fmtEUR(subtotal)}`
      : loading
      ? 'Procesando…'
      : 'Crear reserva';

  return (
    <main className="mx-auto w-[100vw] lg:w-[80vw] px-4 py-12">
      <h1 className="text-3xl font-bold text-center mb-6">
        Reservar Sala {salaId}
      </h1>

      <div className="mb-8">
        <Calendar
          salaId={salaId}
          selectedSlots={selectedSlots}
          onDateSelect={handleDateSelect}
        />
      </div>

      {/* ── Franjas seleccionadas ───────────────────────── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Franjas seleccionadas</h2>
          <div className="text-sm text-gray-600">
            {selectedSlots.length > 0 ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1">
                <CalendarClock className="h-4 w-4 text-orange-500" />
                {selectedSlots.length} tramo(s) · {totalHoras.toFixed(1)} h totales
              </span>
            ) : (
              <span className="text-gray-500">Arrastre para añadir tramos</span>
            )}
          </div>
        </div>

        {selectedSlots.length > 0 && (
          <>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedSlots.map((s, i) => {
                const horas = diffHours(s.start, s.end);
                return (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-orange-200 bg-orange-50/60 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-800">
                        {fmtDay(s.start)}
                      </div>
                      <div className="text-xs text-gray-600">
                        {fmtTime(s.start)} – {fmtTime(s.end)} · {horas.toFixed(1)} h
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUnselect(i)}
                      className="ml-3 inline-flex items-center gap-1 rounded-full border border-red-300 bg-white px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      aria-label={`Quitar franja ${i + 1}`}
                    >
                      <X className="h-3.5 w-3.5" />
                      Quitar
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-3 flex justify-between items-center">
              <button
                type="button"
                onClick={handleClearAll}
                className="text-sm underline text-gray-600 hover:text-gray-800"
              >
                Limpiar todo
              </button>

              {/* ── Resumen con subtotal ── */}
              <div className="inline-flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2 shadow-sm">
                <Receipt className="h-4 w-4 text-gray-500" />
                <div className="text-sm">
                  <div className="text-gray-600">
                    {costeHora != null ? (
                      <>Precio/hora: <span className="font-medium">{fmtEUR(costeHora)}</span></>
                    ) : (
                      'Precio/hora: —'
                    )}
                  </div>
                  <div className="font-semibold">
                    Subtotal: {costeHora != null ? fmtEUR(subtotal) : '—'}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ── Formulario ───────────────────────── */}
      {!success && (
        <section
          aria-labelledby="titulo-form"
          className="rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 id="titulo-form" className="text-lg font-semibold">
              Datos de contacto
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Introduzca sus datos para confirmar la reserva.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
            {error && (
              <div
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700"
                role="alert"
                aria-live="polite"
              >
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="nombre">
                  Nombre completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    value={form.nombre}
                    onChange={handleChange}
                    required
                    autoComplete="name"
                    placeholder="Nombre y apellidos"
                    className="mt-0 w-full rounded-xl border border-gray-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="correo">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    id="correo"
                    name="correo"
                    type="email"
                    value={form.correo}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                    placeholder="nombre@dominio.com"
                    className="mt-0 w-full rounded-xl border border-gray-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="telefono">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    value={form.telefono}
                    onChange={handleChange}
                    required
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="+34 600 000 000"
                    className="mt-0 w-full rounded-xl border border-gray-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Solo para comunicaciones sobre su reserva.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1" htmlFor="info_adicional">
                  Información adicional (opcional)
                </label>
                <div className="relative">
                  <Info className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <textarea
                    id="info_adicional"
                    name="info_adicional"
                    value={form.info_adicional}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Indique necesidades técnicas, número de asistentes, etc."
                    className="mt-0 w-full rounded-xl border border-gray-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {payLabel}
              </button>
            </div>
          </form>
        </section>
      )}

      {success && (
        <div className="text-center text-green-700 bg-green-50 border border-green-200 rounded-xl py-4 px-6 text-base">
          Reserva realizada con éxito.
        </div>
      )}
    </main>
  );
}
