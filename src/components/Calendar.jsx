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
  onRemoveSlot,
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

  // 2) Mínimo seleccionable: ahora (ajusta si quieres +1h)
  const minSelectableDate = new Date(Date.now());

  // 3) Eventos: bloqueos, reservas existentes y tus selecciones
  const todayDate = minSelectableDate.toISOString().split('T')[0];

  const blockEarlyToday = {
    start: `${todayDate}T00:00:00`,
    end: minSelectableDate.toISOString(),
    display: 'background',
    backgroundColor: '#e5e7eb',
    overlap: false,
    classNames: ['!bg-zinc-200/70'],
  };

  const events = [
    blockEarlyToday,
    ...reservedSlots.map((slot) => ({
      start: slot.inicio,
      end: slot.fin,
      display: 'background',
      backgroundColor: '#fecaca', // rojo suave
      overlap: false,
      classNames: ['!bg-red-300/50', 'backdrop-blur-[1px]'],
    })),
    ...selectedSlots
      .filter((s) => s.salaId === salaId)
      .map((slot) => ({
        id: `${slot.start}-${slot.end}`,
        start: slot.start,
        end: slot.end,
        backgroundColor: '#f59e0b',
        borderColor: '#d97706',
        textColor: '#ffffff',
        overlap: false,
        extendedProps: { userSelected: true },
      })),
  ];

  // 4) Permisos de selección
  const selectAllow = (info) => {
    const api = calendarRef.current?.getApi();
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
    <div className="mx-auto overflow-x-auto rounded-2xl border border-orange-200/50 bg-white/95 p-4 shadow-lg shadow-orange-900/10 backdrop-blur">
      <div className="min-w-[600px]">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          views={{
            dayGridMonth: { type: 'dayGrid', buttonText: 'Mes' },
            timeGridCustom: { type: 'timeGrid', duration: { days: 7 }, buttonText: 'Semana' },
            timeGridDay: { type: 'timeGrid', buttonText: 'Día' },
          }}
          initialView="timeGridCustom"
          initialDate={todayStr}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridCustom',
          }}
          buttonText={{ today: 'Hoy', dayGridMonth: 'Mes', timeGridCustom: 'Semana', timeGridDay: 'Día' }}
          locale="es"
          navLinks
          dateClick={handleDateClick}
          slotMinTime="07:00:00"
          slotMaxTime="23:00:00"
          slotDuration="00:30:00"
          slotLabelInterval="00:30:00"
          slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          dayHeaderFormat={{ weekday: 'short', day: 'numeric' }}
          allDaySlot={false}
          selectable
          selectLongPressDelay={60}
          select={handleSelect}
          selectAllow={selectAllow}
          events={events}
          eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          height="auto"
          className="fc-container"
          contentClassNames={['fc-content']}
          viewClassNames={['fc-view']}

          /* Botones del toolbar */
          buttonClassNames={[
            'bg-orange-600',
            'text-white',
            'px-3',
            'py-1.5',
            'rounded-full',
            'uppercase',
            'text-xs',
            'font-semibold',
            'shadow',
            'shadow-orange-900/10',
            'ring-1',
            'ring-orange-700/30',
            'hover:bg-orange-700',
            'transition',
          ]}
          titleClassNames={[
            'text-center',
            'text-lg',
            'font-bold',
            'text-orange-900',
            'tracking-tight',
          ]}
          navLinkClassNames={() => ['underline', 'text-orange-700', 'hover:text-orange-800']}

          /* Encabezados y rejilla */
          dayHeaderClassNames={() => [
            'bg-orange-50',
            'border-b',
            'border-orange-200',
            'text-xs',
            'sm:text-sm',
            'sm:font-medium',
            'whitespace-nowrap',
            'px-2',
            'py-1.5',
            'text-orange-900',
          ]}
          dayHeaderContentClassNames={() => ['flex', 'justify-center', 'items-center', 'text-xs', 'sm:text-base']}
          slotLabelClassNames={() => ['text-zinc-500', 'text-[10px]', 'sm:text-[12px]', 'pr-1']}
          slotLaneClassNames={() => ['!border-l', '!border-orange-100']}
          dayCellClassNames={(arg) => [
            '!border',
            '!border-orange-100',
            arg.isToday ? 'bg-orange-50/60' : '',
          ]}

          /* Clase base de eventos + sutiles mejoras en tus selecciones */
          eventClassNames={(arg) => {
            const isMine = arg.event.extendedProps?.userSelected;
            if (isMine) {
              return [
                'rounded-md',
                'shadow',
                'shadow-orange-800/20',
                'ring-1',
                'ring-orange-400/60',
                'hover:brightness-[1.02]',
              ];
            }
            return ['rounded', 'border', 'border-orange-500'];
          }}
          moreLinkClassNames={() => [
            'cursor-pointer',
            'text-xs',
            'px-2',
            'py-0.5',
            'rounded-full',
            'bg-orange-50',
            'text-orange-700',
            'ring-1',
            'ring-orange-200',
            'hover:bg-orange-100',
          ]}

          /* Contenido de eventos: mini “x” y margen superior 3px para tus franjas */
          eventContent={(arg) => {
            const { event, timeText } = arg;
            if (event.display === 'background') return undefined;

            const isMine = event.extendedProps?.userSelected;

            return (
              <div className="relative h-full w-full px-1 py-0.5">
                <div className={`text-[11px] leading-4 ${isMine ? 'mt-[14px]' : ''}`}>
                  <strong>{timeText}</strong>
                  {event.title ? ` · ${event.title}` : null}
                </div>

                {isMine && (
                  <button
                    type="button"
                    title="Quitar franja"
                    aria-label="Quitar franja"
                    className="absolute right-0.5 top-0.5 grid h-4 w-4 place-items-center rounded bg-white/90 text-[10px] font-bold text-red-600 shadow ring-1 ring-red-300 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveSlot?.({
                        salaId,
                        start: event.start?.toISOString?.() ?? event.startStr,
                        end: event.end?.toISOString?.() ?? event.endStr,
                      });
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
