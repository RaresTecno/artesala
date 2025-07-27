'use client';

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReservaCalendar from '@/components/Calendar';
import { supabase } from '@/lib/supabaseClient';
import { signPayload } from '@/lib/redsys';

export default function ReservaSalaPage({ params }) {
  // Desenvuelve params antes de usar
  const { salaId: salaParam } = use(params);
  const salaId = parseInt(salaParam, 10);
  const router = useRouter();

  // Estados de reserva
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
  const [total, setTotal] = useState(0);
  const [reservaId, setReservaId] = useState(null);

  // Efecto para redirigir tras éxito
  useEffect(() => {
    if (!success) return;

    // Preparamos payload con datos fijos y calculados
    const payload = {
      Ds_Merchant_Amount: String(Math.round(total * 100)),
      Ds_Merchant_MerchantCode: '367598893',         // Tu código de comercio
      Ds_Merchant_Currency: '978',                  // Euro
      Ds_Merchant_TransactionType: '0',             // Pago estándar
      Ds_Merchant_Order: String(reservaId),         // ID de la reserva
      Ds_Merchant_Terminal: '1',
      Ds_Merchant_MerchantURL: `${window.location.origin}/api/redsys/notify`,
      Ds_Merchant_UrlOK: `${window.location.origin}/pago/exito`,
      Ds_Merchant_UrlKO: `${window.location.origin}/pago/error`
    };

    // Firmamos payload
    const { Ds_SignatureVersion, Ds_MerchantSignature } = signPayload(payload);
    payload.Ds_SignatureVersion = Ds_SignatureVersion;
    payload.Ds_MerchantSignature = Ds_MerchantSignature;

    // Creamos y enviamos el formulario a Redsys
    const formEl = document.createElement('form');
    formEl.method = 'POST';
    formEl.action = 'https://sis-t.redsys.es:25443/sis/realizarPago';
    Object.entries(payload).forEach(([k, v]) => {
      const inp = document.createElement('input');
      inp.type = 'hidden';
      inp.name = k;
      inp.value = v;
      formEl.appendChild(inp);
    });
    document.body.appendChild(formEl);
    formEl.submit();
  }, [success, total, reservaId]);

  // Selección de franjas en el calendario
  const handleDateSelect = ({ start, end }) => {
    setSelectedSlots(prev => [...prev, { salaId, start, end }]);
  };

  // Manejo de inputs de formulario
  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Envío de la reserva y preparación del pago
  const handleSubmit = async e => {
    e.preventDefault();
    if (!selectedSlots.length) {
      setError('Debes seleccionar al menos un tramo.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // 1) Obtener coste por hora
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
      setTotal(calcTotal);

      // 3) Guardar reserva en Supabase
      const { data: reserva, error: resErr } = await supabase
        .from('reservas')
        .insert({
          ...form,
          estado: 'pendiente',
          total: calcTotal
        })
        .select('id')
        .single();
      if (resErr) throw resErr;
      setReservaId(reserva.id);

      // 4) Guardar tramos reservados
      await supabase
        .from('tramos_reservados')
        .insert(
          selectedSlots.map(t => ({
            reserva_id: reserva.id,
            sala_id: salaId,
            inicio: t.start,
            fin: t.end
          }))
        );

      // 5) Marcamos éxito para disparar el efecto de redirección
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Error al procesar la reserva');
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-center mb-6">
        Reservar Sala {salaId}
      </h1>

      <div className="mb-8">
        <ReservaCalendar
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
              <li key={i}>
                {new Date(s.start).toLocaleString()} —{' '}
                {new Date(s.end).toLocaleString()}
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
            {loading ? 'Procesando...' : 'Crear reserva y pagar'}
          </button>
        </form>
      )}

      {success && (
        <div className="text-center text-green-600 text-lg">
          Redirigiendo a pasarela de pago...
        </div>
      )}
    </main>
  );
}
