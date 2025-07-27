'use client';

import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { supabase } from '@/lib/supabaseClient';

export default function ReservaCalendar({ salaId, selectedSlots, onDateSelect }) {
  const [reservedSlots, setReservedSlots] = useState([]);

  // Carga los tramos ya reservados desde Supabase
  useEffect(() => {
    supabase
      .from('tramos_reservados')
      .select('inicio, fin')
      .eq('sala_id', salaId)
      .then(({ data, error }) => {
        if (error) console.error('Error fetching reserved slots:', error);
        else setReservedSlots(data);
      });
  }, [salaId]);

  // Calcula la fecha mínima seleccionable: ahora + 1 hora
  const minSelectableDate = new Date(Date.now() + 60 * 60 * 1000);

  // Evento de fondo para bloquear las horas de hoy hasta minSelectableDate
  const todayDate = minSelectableDate.toISOString().split('T')[0];
  const blockEarlyToday = {
    start: `${todayDate}T00:00:00`,
    end: minSelectableDate.toISOString(),
    display: 'background',
    backgroundColor: '#e5e7eb',
    overlap: false
  };

  // Combina eventos de fondo (bloqueos y reservados) con selecciones del usuario
  const events = [
    blockEarlyToday,
    ...reservedSlots.map(slot => ({
      start: slot.inicio,
      end: slot.fin,
      display: 'background',
      backgroundColor: '#f87171',
      overlap: false
    })),
    ...selectedSlots
      .filter(s => s.salaId === salaId)
      .map(slot => ({
        id: `${slot.start}-${slot.end}`,
        title: 'Tu reserva',
        start: slot.start,
        end: slot.end,
        backgroundColor: '#f59e0b',
        overlap: false
      }))
  ];

  // Impide seleccionar franjas bloqueadas o de reservas
  const selectAllow = info => {
    if (info.start < minSelectableDate || info.end < minSelectableDate) return false;
    for (let slot of reservedSlots) {
      const startRes = new Date(slot.inicio);
      const endRes = new Date(slot.fin);
      if (info.start < endRes && info.end > startRes) return false;
    }
    const mine = selectedSlots.filter(s => s.salaId === salaId);
    for (let slot of mine) {
      const startSel = new Date(slot.start);
      const endSel = new Date(slot.end);
      if (info.start < endSel && info.end > startSel) return false;
    }
    return true;
  };

  const handleSelect = info => onDateSelect({ salaId, start: info.startStr, end: info.endStr });

  return (
    <div className="w-full lg:w-[1200px] mx-auto bg-white rounded-lg shadow-lg p-4">
      <FullCalendar
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{ left: 'prev,next today', center: 'title', right: 'timeGridWeek,timeGridDay' }}
        buttonText={{ today: 'Hoy', timeGridWeek: 'Semana', timeGridDay: 'Día' }}
        locale="es"
        slotMinTime="07:00:00"  // Horario mínimo ajustado
        slotMaxTime="23:00:00" // Horario máximo ajustado
        allDaySlot={false}
        selectable={true}
        select={handleSelect}
        selectAllow={selectAllow}
        events={events}
        height="auto"

        /* Estilos con Tailwind */
        buttonClassNames={[
          'bg-orange-500','text-white','px-3','py-1',
          'rounded-full','uppercase','text-xs','font-semibold',
          'hover:bg-orange-600','transition'
        ]}
        titleClassNames={['text-center','text-lg','font-bold','text-gray-800']}
        dayHeaderClassNames={() => ['bg-gray-100','text-gray-700','font-medium','border-b','border-gray-200']}
        slotLabelClassNames={() => ['text-gray-500','font-medium']}
        slotLaneClassNames={() => ['!border-l','!border-gray-200']}
        dayCellClassNames={() => ['!border','!border-gray-200']}
        eventClassNames={() => ['rounded','border','border-orange-500']}
      />
    </div>
  );
}
