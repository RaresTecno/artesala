'use client';

import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { supabase } from '@/lib/supabaseClient';

export default function ReservaCalendar({
  salaId,
  selectedSlots = [],           // ← valor por defecto: opcional
  onDateSelect,                  // ← opcional, se invoca con ?. más abajo
}) {
  const calendarRef = useRef(null);
  const [reservedSlots, setReservedSlots] = useState([]);
  const todayStr = new Date().toISOString().split('T')[0];

  // 1) Carga los tramos ya reservados desde Supabase
  useEffect(() => {
    supabase
      .from('tramos_reservados')
      .select('inicio, fin')
      .eq('sala_id', salaId)
      .then(({ data, error }) => {
        if (error) console.error('Error fetching reserved slots:', error);
        else setReservedSlots(data ?? []);
      });
  }, [salaId]);

  // 2) Fecha mínima seleccionable: ahora + 1 hora
  const minSelectableDate = new Date(Date.now() + 60 * 60 * 1000);

  // 3) Responsive: cambia la vista según el ancho de ventana (corrijo ramas)
  // const handleResize = () => {
  //   const api = calendarRef.current?.getApi();
  //   if (!api) return;
  //   if (window.innerWidth < 768) {
  //     api.changeView('timeGridDay');
  //   } else {
  //     api.changeView('timeGridCustom');
  //   }
  // };
  // useEffect(() => {
  //   handleResize();
  //   window.addEventListener('resize', handleResize);
  //   return () => window.removeEventListener('resize', handleResize);
  // }, []);

  // 4) Construye el array de eventos, incluyendo bloqueos y reservas
  const todayDate = minSelectableDate.toISOString().split('T')[0];
  const blockEarlyToday = {
    start: `${todayDate}T00:00:00`,
    end: minSelectableDate.toISOString(),
    display: 'background',
    backgroundColor: '#e5e7eb',
    overlap: false,
  };

  const events = [
    blockEarlyToday,
    ...reservedSlots.map((slot) => ({
      start: slot.inicio,
      end: slot.fin,
      display: 'background',
      backgroundColor: '#f87171',
      overlap: false,
    })),
    ...selectedSlots
      .filter((s) => s.salaId === salaId)
      .map((slot) => ({
        id: `${slot.start}-${slot.end}`,
        title: 'Tu reserva',
        start: slot.start,
        end: slot.end,
        backgroundColor: '#f59e0b',
        overlap: false,
      })),
  ];

  // 5) Impide seleccionar franjas bloqueadas o pasadas
  const selectAllow = (info) => {
    if (info.start < minSelectableDate || info.end < minSelectableDate) return false;

    for (let slot of reservedSlots) {
      const startRes = new Date(slot.inicio);
      const endRes = new Date(slot.fin);
      if (info.start < endRes && info.end > startRes) return false;
    }

    const mine = selectedSlots.filter((s) => s.salaId === salaId);
    for (let slot of mine) {
      const startSel = new Date(slot.start);
      const endSel = new Date(slot.end);
      if (info.start < endSel && info.end > startSel) return false;
    }
    return true;
  };

  const handleSelect = (info) => {
    // ← llamada segura: solo si el callback está definido
    onDateSelect?.({ salaId, start: info.startStr, end: info.endStr });
  };

  return (
    <div className="mx-auto bg-white rounded-lg shadow-lg p-4 overflow-x-auto">
      <div className="min-w-[600px]">
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, interactionPlugin]}
          views={{
            timeGridCustom: {
              type: 'timeGrid',
              duration: { days: 7 },
              buttonText: 'Semana',
            },
          }}
          initialView="timeGridCustom"
          initialDate={todayStr}
          // windowResize={handleResize}
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'timeGridCustom' }}
          buttonText={{ today: 'Hoy', timeGridWeek: 'Semana', timeGridDay: 'Día' }}
          locale="es"
          slotMinTime="07:00:00"
          slotMaxTime="23:00:00"
          slotDuration="00:30:00"
          slotLabelInterval="00:30:00"
          slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          dayHeaderFormat={{ weekday: 'short', day: 'numeric' }}
          allDaySlot={false}
          selectable={true}
          select={handleSelect}
          selectAllow={selectAllow}
          events={events}
          height="auto"
          className="fc-container"
          contentClassNames={['fc-content']}
          viewClassNames={['fc-view']}
          buttonClassNames={[
            'bg-orange-500',
            'text-white',
            'px-3',
            'py-1',
            'rounded-full',
            'uppercase',
            'text-xs',
            'font-semibold',
            'hover:bg-orange-600',
            'transition',
          ]}
          titleClassNames={['text-center', 'text-lg', 'font-bold', 'text-gray-800']}
          navLinkClassNames={() => ['underline', 'text-blue-600']}
          dayHeaderClassNames={() => ['bg-gray-100', 'border-b', 'border-gray-200', 'text-xs', 'sm:text-sm', 'sm:font-medium', 'whitespace-nowrap', 'px-2', 'py-1']}
          dayHeaderContentClassNames={() => ['flex', 'justify-center', 'items-center', 'text-xs', 'sm:text-base']}
          slotLabelClassNames={() => ['text-gray-400', 'text-[10px]', 'sm:text-[12px]', 'pr-1']}
          slotLaneClassNames={() => ['!border-l', '!border-gray-200']}
          dayCellClassNames={() => ['!border', '!border-gray-200']}
          eventClassNames={() => ['rounded', 'border', 'border-orange-500']}
          moreLinkClassNames={() => ['cursor-pointer', 'text-sm']}
        />
      </div>
    </div>
  );
}
