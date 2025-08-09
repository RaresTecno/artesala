'use client';

import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { supabase } from '@/lib/supabaseClient';

export default function ReservaCalendar({
  salaId,
  selectedSlots = [],
  onDateSelect,
}) {
  const calendarRef = useRef(null);
  const [reservedSlots, setReservedSlots] = useState([]);
  const todayStr = new Date().toISOString().split('T')[0];

  // 1) Cargar reservas existentes
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

  // 2) Mínimo seleccionable: ahora + 1h
  // const minSelectableDate = new Date(Date.now() + 60 * 60 * 1000);
  const minSelectableDate = new Date(Date.now());


  // 3) Eventos: bloqueos, reservas existentes y tus selecciones
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
        classNames: ['pointer-events-none'], // evita bloquear el arrastre
      })),
  ];

  // 4) Permisos de selección
  const selectAllow = (info) => {
    const api = calendarRef.current?.getApi();
    // En vista mensual no permitimos arrastrar para seleccionar (se hace en Día)
    if (api?.view?.type === 'dayGridMonth') return false;

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

  // 5) Selección por arrastre (en Semana/Día)
  const handleSelect = (info) => {
    onDateSelect?.({ salaId, start: info.startStr, end: info.endStr });
  };

  // 6) Click en día (en vista Mensual → cambia a Día)
  const handleDateClick = (arg) => {
    const api = calendarRef.current?.getApi();
    if (api?.view?.type === 'dayGridMonth') {
      api.changeView('timeGridDay', arg.date);
    }
  };

  return (
    <div className="mx-auto bg-white rounded-lg shadow-lg p-4 overflow-x-auto">
      <div className="min-w-[600px]">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          views={{
            dayGridMonth: {
              type: 'dayGrid',
              buttonText: 'Mes',
            },
            timeGridCustom: {
              type: 'timeGrid',
              duration: { days: 7 },
              buttonText: 'Semana',
            },
            timeGridDay: {
              type: 'timeGrid',
              buttonText: 'Día',
            },
          }}
          initialView="timeGridCustom"
          initialDate={todayStr}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridCustom',
          }}
          buttonText={{
            today: 'Hoy',
            dayGridMonth: 'Mes',
            timeGridCustom: 'Semana',
            timeGridDay: 'Día',
          }}
          locale="es"
          navLinks={true}
          dateClick={handleDateClick}
          slotMinTime="07:00:00"
          slotMaxTime="23:00:00"
          slotDuration="00:30:00"
          slotLabelInterval="00:30:00"
          slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          dayHeaderFormat={{ weekday: 'short', day: 'numeric' }}
          allDaySlot={false}
          selectable={true}
          // selectLongPressDelay={50} // opcional: mejora en móvil
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
          dayHeaderClassNames={() => [
            'bg-gray-100',
            'border-b',
            'border-gray-200',
            'text-xs',
            'sm:text-sm',
            'sm:font-medium',
            'whitespace-nowrap',
            'px-2',
            'py-1',
          ]}
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
