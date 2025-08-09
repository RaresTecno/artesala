// app/disponibilidad/page.jsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { supabase } from '@/lib/supabaseClient';

export default function Page() {
  return (
    <main className="bg-white text-zinc-900">
      {/* HERO – degradado naranja (estilo consistente) */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-600 via-orange-500 to-orange-600" />
          <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(255,255,255,0.25),transparent_65%)] mix-blend-soft-light" />
        </div>

        <div className="relative mx-auto flex min-h-[40vh] flex-col items-center justify-center px-6 py-24 text-center sm:py-32">
          <span className="mb-3 inline-flex items-center rounded-full bg-orange-200/30 px-3 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/40">
            Disponibilidad en tiempo real
          </span>
          <h1 className="max-w-5xl text-4xl font-bold tracking-tight text-white drop-shadow-sm sm:text-6xl">
            Disponibilidad
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-orange-50 sm:text-lg">
            Visualiza ambas salas en un solo calendario.
          </p>
        </div>
      </section>

      {/* CALENDARIO COMBINADO */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-2xl border border-orange-200/50 bg-white/95 p-5 shadow-lg backdrop-blur">
          <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Disponibilidad</h2>
            {/* Leyenda */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 ring-1 ring-blue-200">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                Sala 1
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 ring-1 ring-green-200">
                <span className="h-2.5 w-2.5 rounded-full bg-green-600" />
                Sala 2
              </span>
            </div>
          </header>

          <CombinedCalendar />

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/reservas/sala1"
              className="inline-flex items-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Reservar Sala 1
            </Link>
            <Link
              href="/reservas/sala2"
              className="inline-flex items-center rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
            >
              Reservar Sala 2
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ────────────────────────────────────────────────────────────
   Calendario fusionado (solo lectura)
   - Sala 1 → azul vibrante | Sala 2 → verde vibrante
   - Si coinciden, FullCalendar los coloca en columnas (mitad del ancho)
   - Fondo gris para horas pasadas del día actual
────────────────────────────────────────────────────────────── */
function CombinedCalendar() {
  const calendarRef = useRef(null);
  const [events, setEvents] = useState([]);

  const todayStr = new Date().toISOString().split('T')[0];


  useEffect(() => {
    let alive = true;

    supabase
      .from('tramos_reservados')
      .select('inicio, fin, sala_id')
      .in('sala_id', [1, 2])
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) {
          console.error('Error cargando reservas:', error);
          return;
        }

        const mapped = (data ?? []).map((slot) => {
          const isSala1 = slot.sala_id === 1;

          // Usamos eventos "normales" (no background) para que al coincidir se
          // repartan el ancho automáticamente (50/50 cuando hay 2 solapados).
          return {
            title: isSala1 ? 'Sala 1' : 'Sala 2',
            start: slot.inicio,
            end: slot.fin,
            overlap: true, // permitir solaparse
            // Quitamos color base del contenedor y pintamos con un gradiente dentro
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            textColor: '#ffffff',
            extendedProps: { salaId: slot.sala_id },
            classNames: ['rounded-md', 'shadow-md'],
          };
        });

        setEvents([...mapped]);
      });

    return () => {
      alive = false;
    };
  }, []);

  const handleDateClick = (arg) => {
    const api = calendarRef.current?.getApi();
    if (api?.view?.type === 'dayGridMonth') api.changeView('timeGridDay', arg.date);
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-orange-100 bg-white">
      <div className="min-w-[820px] p-3">
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
          selectable={false}
          nowIndicator
          events={events}
          eventOverlap // aseguramos el solapamiento
          eventMinHeight={22}
          eventOrder="extendedProps.salaId,start"
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
          moreLinkClassNames={() => ['cursor-pointer', 'text-sm']}

          /* Pintado custom para colores vibrantes + chip de sala */
          eventContent={(arg) => {
            const salaId = arg.event.extendedProps?.salaId;
            const isSala1 = salaId === 1;

            return (
              <div className="relative h-full w-full">
                {/* Capa de color vibrante */}
                <div
                  className={`absolute inset-0 rounded-md ring-1 ${
                    isSala1
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 ring-blue-700'
                      : 'bg-gradient-to-br from-green-500 to-green-600 ring-green-700'
                  }`}
                />
                {/* Contenido */}
                <div className="relative z-10 px-1.5 py-1 text-[11px] leading-4 text-white">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold">{arg.timeText}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${
                        isSala1
                          ? 'bg-white/15 ring-white/30'
                          : 'bg-white/15 ring-white/30'
                      }`}
                    >
                      {isSala1 ? 'Sala 1' : 'Sala 2'}
                    </span>
                  </div>
                </div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
