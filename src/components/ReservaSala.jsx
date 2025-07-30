'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Calendar from '@/components/Calendar';
import { supabase } from '@/lib/supabaseClient';

export default function ReservaSalaPage({ salaId }) {
  console.log(salaId);
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

  // ────────────────────────────────────────────────────────────────
  // Selección de franjas en el calendario
  // ────────────────────────────────────────────────────────────────
  const handleDateSelect = ({ start, end }) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    // 1. impide rangos que crucen días distintos
    const isSameDay =
      startDate.getFullYear() === endDate.getFullYear() &&
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getDate() === endDate.getDate();

    if (!isSameDay) {
      setError('No se puede seleccionar una franja que cruce entre días diferentes.');
      return;
    }

    // 2. evita duplicados en distintos días con mismo tramo horario
    const newKey = `${startDate.getHours()}-${endDate.getHours()}`;
    const exists = selectedSlots.some(slot => {
      const s = new Date(slot.start);
      const e = new Date(slot.end);
      return `${s.getHours()}-${e.getHours()}` === newKey;
    });

    if (exists) {
      setError('Ya has seleccionado una franja con ese horario en otro día.');
      return;
    }

    setError(null);
    setSelectedSlots(prev => [...prev, { salaId, start, end }]);
  };

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleUnselect = index =>
    setSelectedSlots(prev => prev.filter((_, i) => i !== index));

  // ────────────────────────────────────────────────────────────────
  // Submit
  // ────────────────────────────────────────────────────────────────
  const handleSubmit = async e => {
    e.preventDefault();

    if (!selectedSlots.length) {
      setError('Debes seleccionar al menos un tramo.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1) Obtener coste/hora de la sala
      const { data: salaData, error: salaErr } = await supabase
        .from('salas')
        .select('coste_hora')
        .eq('id', salaId)
        .single();
      if (salaErr) throw salaErr;

      // 2) Calcular total
      const calcTotal = selectedSlots.reduce(
        (sum, t) =>
          sum +
          ((new Date(t.end) - new Date(t.start)) / (1000 * 60 * 60)) *
            salaData.coste_hora,
        0
      );

      // 3) Validar total > 0 €
      const total = calcTotal;
      if (total <= 0) {
        setError('Importe incorrecto. Selecciona al menos 1 h de reserva.');
        setLoading(false);
        return;
      }

      // 4) Solicitar parámetros a Redsys
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

      // 5) Crear formulario oculto y redirigir
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

  // ────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────
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

      {selectedSlots.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold mb-2">Franjas seleccionadas:</h2>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {selectedSlots.map((s, i) => (
              <li key={i} className="flex items-center gap-2">
                {new Date(s.start).toLocaleString()} —{' '}
                {new Date(s.end).toLocaleString()}
                <button
                  onClick={() => handleUnselect(i)}
                  className="ml-2 text-red-500 text-xs underline"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!success && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-600">{error}</p>}

          <div>
            <label className="block text-sm font-medium">Nombre completo</label>
            <input
              name="nombre"
              type="text"
              value={form.nombre}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Correo electrónico
            </label>
            <input
              name="correo"
              type="email"
              value={form.correo}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Teléfono</label>
            <input
              name="telefono"
              type="tel"
              value={form.telefono}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Información adicional (opcional)
            </label>
            <textarea
              name="info_adicional"
              value={form.info_adicional}
              onChange={handleChange}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-400 transition disabled:opacity-50"
          >
            {loading ? 'Procesando…' : 'Crear reserva'}
          </button>
        </form>
      )}

      {success && (
        <div className="text-center text-green-600 text-lg">
          Reserva realizada con éxito.
        </div>
      )}
    </main>
  );
}
