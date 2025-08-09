'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarClock,
  X,
  User,
  Mail,
  Phone,
  Info,
  Receipt,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import Calendar from '@/components/Calendar';
import { supabase } from '@/lib/supabaseClient';

export default function ReservaSalaPage({ salaId }) {
  const router = useRouter();

  const [selectedSlots, setSelectedSlots] = useState([]);
  const [form, setForm] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    info_adicional: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [costeHora, setCosteHora] = useState(null);
  const formRef = useRef(null);

  const fmtDay = (iso) =>
    new Date(iso).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });

  const fmtTime = (iso) =>
    new Date(iso).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
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

  const handleDateSelect = ({ start, end }) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const isSameDay = startDate.toDateString() === endDate.toDateString();
    if (!isSameDay) {
      setError('No se puede seleccionar una franja que cruce entre días diferentes.');
      return;
    }
    const overlapSameDay = selectedSlots.some((slot) => {
      const s = new Date(slot.start);
      const e = new Date(slot.end);
      if (s.toDateString() !== startDate.toDateString()) return false;
      return startDate < e && endDate > s;
    });
    if (overlapSameDay) {
      setError('Esa franja se solapa con otra ya seleccionada ese día.');
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

  const removeSlot = ({ start, end }) => {
    setSelectedSlots((prev) =>
      prev.filter(
        (s) =>
          new Date(s.start).getTime() !== new Date(start).getTime() ||
          new Date(s.end).getTime() !== new Date(end).getTime()
      )
    );
  };

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
          extra: { salaId, selectedSlots },
        }),
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

  const payLabel =
    !loading && costeHora != null && totalHoras > 0
      ? `Pagar ${fmtEUR(subtotal)}`
      : loading
        ? 'Procesando…'
        : 'Crear reserva';

  return (
    <>
      {/* Fondo “Home” */}
      <div aria-hidden className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-600 via-orange-500 to-orange-600" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(255,255,255,0.25),transparent_65%)] mix-blend-soft-light" />
      </div>

      <main className="mx-auto w-full max-w-[85vw] px-4 pb-24 pt-8 text-zinc-900">
        <header className="mb-6 mt-16 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/90 px-3 py-2 text-sm text-zinc-700 shadow-sm backdrop-blur hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
          <h1 className="text-center text-xl font-semibold text-white drop-shadow sm:text-2xl">
            Reservar Sala {salaId}
          </h1>
          <div className="w-[88px]" aria-hidden />
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <section className="rounded-2xl border border-white/40 bg-white/95 shadow-lg shadow-orange-900/10 backdrop-blur">
              <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
                <h2 className="text-base font-semibold">Calendario</h2>
                <div className="ml-3 text-xs text-zinc-500">
                  Manten y arrastre para seleccionar franjas
                </div>
              </div>
              <div className="px-3 py-4 sm:px-5">
                <Calendar
                  salaId={salaId}
                  selectedSlots={selectedSlots}
                  onDateSelect={handleDateSelect}
                  onRemoveSlot={removeSlot}
                />
              </div>
            </section>

            {/* Franjas seleccionadas */}
            <section className="mt-6 rounded-2xl border border-white/40 bg-white/95 shadow-lg shadow-orange-900/10 backdrop-blur">
              <div className="flex items-center justify-between border-zinc-100 px-5 py-4">
                <h2 className="text-base font-semibold">Franjas seleccionadas</h2>
                <div className="text-sm text-gray-600">
                  {selectedSlots.length > 0 ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1">
                      <CalendarClock className="h-4 w-4 text-orange-500" />
                      {selectedSlots.length} tramo(s) · {totalHoras.toFixed(1)} h
                    </span>
                  ) : (
                    <span className="text-gray-500">Aún no hay franjas seleccionadas</span>
                  )}
                </div>
              </div>

              {selectedSlots.length > 0 && (
                <div className="px-5 py-4">
                  <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {selectedSlots.map((s, i) => {
                      const horas = diffHours(s.start, s.end);
                      return (
                        <li
                          key={i}
                          className="flex items-center justify-between rounded-xl border border-orange-200 bg-orange-50/80 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-gray-800">
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

                  <div className="mt-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="text-sm underline text-gray-700 hover:text-gray-900"
                    >
                      Limpiar todo
                    </button>

                    <div className="inline-flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2 shadow-sm">
                      <Receipt className="h-4 w-4 text-gray-500" />
                      <div className="text-sm">
                        <div className="text-gray-600">
                          {costeHora != null ? (
                            <>
                              Precio/hora:{' '}
                              <span className="font-medium">{fmtEUR(costeHora)}</span>
                            </>
                          ) : (
                            'Precio/hora: —'
                          )}
                        </div>
                        <div className="font-semibold">
                          Subtotal: <output>{costeHora != null ? fmtEUR(subtotal) : '—'}</output>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 lg:space-y-6">
              <section className="mb-5 rounded-2xl border border-orange-200 bg-orange-50/95 p-5 shadow-sm backdrop-blur">
                <h3 className="text-sm font-semibold text-orange-900">Resumen</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-orange-900/80">Horas totales</dt>
                    <dd className="font-medium text-orange-900">{totalHoras.toFixed(1)} h</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-orange-900/80">Precio/hora</dt>
                    <dd className="font-medium text-orange-900">
                      {costeHora != null ? fmtEUR(costeHora) : '—'}
                    </dd>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-orange-200 pt-3">
                    <dt className="text-base font-semibold text-orange-900">Subtotal</dt>
                    <dd className="text-base font-bold text-orange-900">
                      <output>{costeHora != null ? fmtEUR(subtotal) : '—'}</output>
                    </dd>
                  </div>
                </dl>
              </section>

              {!success && (
                <section
                  aria-labelledby="titulo-form"
                  className="rounded-2xl border border-white/40 bg-white/95 shadow-lg shadow-orange-900/10 backdrop-blur"
                >
                  <div className="border-b border-gray-100 px-5 py-4">
                    <h3 id="titulo-form" className="text-base font-semibold">
                      Datos de contacto
                    </h3>
                    <p className="mt-1 text-xs text-gray-600">
                      Introduzca sus datos para confirmar la reserva.
                    </p>
                  </div>

                  <form ref={formRef} onSubmit={handleSubmit} className="space-y-5 px-5 py-5">
                    {error && (
                      <div
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700"
                        role="alert"
                        aria-live="polite"
                      >
                        {error}
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="mb-1 block text-sm font-medium" htmlFor="nombre">
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
                            className="mt-0 w-full rounded-xl border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium" htmlFor="correo">
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
                            className="mt-0 w-full rounded-xl border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium" htmlFor="telefono">
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
                            className="mt-0 w-full rounded-xl border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Solo para comunicaciones sobre su reserva.
                        </p>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium" htmlFor="info_adicional">
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
                            placeholder="Indique necesidades técnicas, número de personas, etc."
                            className="mt-0 w-full rounded-xl border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {payLabel}
                      </button>
                    </div>
                  </form>
                </section>
              )}

              {success && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-center text-green-700">
                  Reserva realizada con éxito.
                </div>
              )}
            </div>
          </aside>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/30 bg-white/95 px-4 py-3 backdrop-blur sm:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div className="text-sm">
              <div className="text-zinc-700">
                Subtotal <span className="font-medium">{costeHora != null ? fmtEUR(subtotal) : '—'}</span>
              </div>
              <div className="text-xs text-zinc-500">
                {totalHoras.toFixed(1)} h · Precio/hora {costeHora != null ? fmtEUR(costeHora) : '—'}
              </div>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={() => formRef.current?.requestSubmit()}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {payLabel}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
