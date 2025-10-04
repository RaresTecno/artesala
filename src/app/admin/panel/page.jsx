// app/admin/panel/page.jsx
"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// FullCalendar
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

// Para generar recurrencias client-side (crea los tramos en la tabla hija)
import { RRule } from "rrule";
import React from "react";

import {
  CalendarPlus,
  CalendarRange,
  Loader2,
  LogOut,
  RefreshCcw,
  Trash2,
  ListFilter,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/*****
ESQUEMA ACTUAL (según tu imagen)

reservas (cabecera)
- id uuid pk
- nombre text
- correo text
- telefono text
- info_adicional text
- estado text -- 'pendiente', 'pagada', 'cancelada'
- total numeric
- referencia_pago text
- created_at timestamptz default now()

salas
- id int2 pk
- coste_hora numeric

tramos_reservados (detalle)
- id uuid pk
- reserva_id uuid fk -> reservas.id ON DELETE CASCADE
- sala_id int2
- inicio timestamptz
- fin timestamptz
- rango tstzrange (GENERATED)

SQL recomendado (si no lo tienes aún):

create extension if not exists btree_gist;

alter table tramos_reservados
  add column if not exists rango tstzrange
  generated always as (tstzrange(inicio, fin, '[)')) stored;

create index if not exists tramos_rango_gist
  on tramos_reservados using gist (sala_id, rango);

alter table tramos_reservados
  drop constraint if exists tramos_no_overlap;

alter table tramos_reservados
  add constraint tramos_no_overlap
  exclude using gist (
    sala_id with =,
    rango with &&
  );

alter table tramos_reservados
  add constraint if not exists tramos_res_fk
  foreign key (reserva_id) references reservas(id) on delete cascade;
*****/

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

const START_HOUR = "07:00:00";
const END_HOUR = "23:00:00";
const SLOT_MIN = "00:30:00"; // 30 minutos

// COLORES POR SALA
const ROOM_COLORS = {
  1: "#3b82f6", // azul (Tailwind blue-500)
  2: "#22c55e", // verde (Tailwind green-500)
};

function startOfWeek(d = new Date()) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // lunes=0
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
}

export default function AdminPanelPage() {
  const router = useRouter();

  // Auth state
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  // UI state
  const [tab, setTab] = useState("calendar"); // calendar | list
  const [roomFilter, setRoomFilter] = useState(0); // 0 (ambas), 1, 2
  const [reloading, setReloading] = useState(false);

  // List pagination
  const [listMode, setListMode] = useState("week"); // 'day' | 'week' | 'all'
  const [listCursor, setListCursor] = useState(() => startOfWeek(new Date()));
  const [listPage, setListPage] = useState(1);
  const PER_PAGE = 12;
  const [listQuery, setListQuery] = useState("");

  // Calendar ref
  const calRef = useRef(null);

  // Selected event for details
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmData, setConfirmData] = useState(null); // {type:'tramo'|'reserva', id:<uuid>}

  // Data state
  const [events, setEvents] = useState([]); // cada evento = un tramo_reservado
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [form, setForm] = useState({
    type: "single", // single | recurring
    room: 1,
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    notes: "",

    // single
    date: new Date().toISOString().slice(0, 10),
    start_time: "10:00",
    end_time: "11:00",

    // recurring (se expandirá a múltiples tramos)
    r_start_date: new Date().toISOString().slice(0, 10),
    r_end_date: new Date(new Date().setMonth(new Date().getMonth() + 1))
      .toISOString()
      .slice(0, 10),
    r_start_time: "10:00",
    r_duration_minutes: 60,
    r_byweekday: { mo: false, tu: true, we: false, th: true, fr: false, sa: false, su: false },
  });

  // ---------- NUEVO: contraseña global de la sala ----------
  const [doorPass, setDoorPass] = useState("");
  const [savingPass, setSavingPass] = useState(false);
  const [passMsg, setPassMsg] = useState("");

  const loadDoorPass = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("sala_password")
        .select("pass")
        .eq("id", 1)
        .single();
      if (error) throw error;
      setDoorPass(data?.pass ?? "");
    } catch (e) {
      console.error("Error cargando sala_password:", e?.message || e);
    }
  }, []);

  const saveDoorPass = async (e) => {
    e.preventDefault();
    setPassMsg("");
    setSavingPass(true);
    try {
      const { error } = await supabase
        .from("sala_password")
        .upsert({ id: 1, pass: doorPass }, { onConflict: "id" });
      if (error) throw error;
      setPassMsg("Contraseña actualizada.");
    } catch (e2) {
      setPassMsg("Error: " + (e2?.message || e2));
    } finally {
      setSavingPass(false);
    }
  };

  // ---------- LOAD EVENTS (desde tramos_reservados join reservas) ----------
  const loadEvents = useCallback(async () => {
    setLoadingEvents(true);
    setError(null);
    try {
      let query = supabase
        .from("tramos_reservados")
        .select(
          "id,inicio,fin,sala_id,reservas(id,nombre,correo,telefono,info_adicional,estado,referencia_pago)"
        )
        .order("inicio", { ascending: true });

      if (roomFilter === 1 || roomFilter === 2) query = query.eq("sala_id", roomFilter);

      const { data, error } = await query;
      if (error) throw error;

      const mapped = (data || []).map((row) => {
        const c = ROOM_COLORS[row.sala_id] || "#64748b"; // gris por defecto
        return {
          id: row.id,
          title: `${row.reservas?.nombre || "Reserva"} · Sala ${row.sala_id}`,
          start: row.inicio,
          end: row.fin,
          extendedProps: {
            sala_id: row.sala_id,
            reserva_id: row.reservas?.id,
            customer_email: row.reservas?.correo,
            customer_phone: row.reservas?.telefono,
            notes: row.reservas?.info_adicional,
            estado: row.reservas?.estado,
            referencia_pago: row.reservas?.referencia_pago,
          },
          backgroundColor: c,
          borderColor: c,
          textColor: "#ffffff",
        };
      });
      setEvents(mapped);
    } catch (e) {
      setError(e.message || "Error cargando tramos");
    } finally {
      setLoadingEvents(false);
    }
  }, [roomFilter]);

  // ---------- AUTH GUARD ----------
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        const email = data?.user?.email || "";
        if (
          error ||
          !email ||
          !ADMIN_EMAIL ||
          email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()
        ) {
          await supabase.auth.signOut();
          router.replace("/admin/login");
          return;
        }
        setUserEmail(email);
      } finally {
        setCheckingAuth(false);
      }
    })();
  }, [router]);

  // ---------- CARGA de eventos + contraseña cuando hay auth ----------
  useEffect(() => {
    if (!checkingAuth) {
      loadEvents();
      loadDoorPass();
    }
  }, [checkingAuth, loadEvents, loadDoorPass]);

  // ---------- HELPERS ----------
  function rruleWeekdaysFromFlags(flags) {
    const map = {
      su: RRule.SU,
      mo: RRule.MO,
      tu: RRule.TU,
      we: RRule.WE,
      th: RRule.TH,
      fr: RRule.FR,
      sa: RRule.SA,
    };
    return Object.entries(flags)
      .filter(([, v]) => v)
      .map(([k]) => map[k]);
  }

  // Genera los tramos (inicio/fin) para una reserva recurrente
  function generateRecurringTramos({
    r_start_date,
    r_end_date,
    r_start_time,
    r_duration_minutes,
    r_byweekday,
  }) {
    const weekdays = rruleWeekdaysFromFlags(r_byweekday);
    if (!weekdays.length) throw new Error("Selecciona al menos un día");

    const dtstart = new Date(`${r_start_date}T${r_start_time}:00`);
    const until = new Date(`${r_end_date}T23:59:59`);

    const rule = new RRule({
      freq: RRule.WEEKLY,
      byweekday: weekdays,
      dtstart,
      until,
    });

    const dates = rule.all();
    const mins = Number(r_duration_minutes);
    return dates.map((start) => {
      const end = new Date(start.getTime() + mins * 60000);
      return { inicio: start.toISOString(), fin: end.toISOString() };
    });
  }

  async function computeTotalEuros({ sala_id, tramos }) {
    const { data: sala, error } = await supabase
      .from("salas")
      .select("coste_hora")
      .eq("id", sala_id)
      .single();
    if (error) throw error;
    const horas = tramos.reduce(
      (acc, t) => acc + (new Date(t.fin) - new Date(t.inicio)) / 3600000,
      0
    );
    const total = Number(sala.coste_hora) * horas;
    return Number(total.toFixed(2));
  }

  // ---------- CREATE BOOKING (cabecera + tramos) ----------
  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const sala_id = Number(form.room);

      // 1) Calcular tramos según tipo
      let tramos = [];
      if (form.type === "single") {
        const start = new Date(`${form.date}T${form.start_time}:00`);
        const end = new Date(`${form.date}T${form.end_time}:00`);
        if (!(end > start))
          throw new Error("La hora de fin debe ser posterior a la de inicio");
        tramos = [{ inicio: start.toISOString(), fin: end.toISOString() }];
      } else {
        tramos = generateRecurringTramos(form);
      }

      // 2) Total estimado
      const total = await computeTotalEuros({ sala_id, tramos });

      // 3) Insert cabecera
      const { data: cab, error: e1 } = await supabase
        .from("reservas")
        .insert({
          nombre: form.customer_name.trim(),
          correo: form.customer_email.trim(),
          telefono: form.customer_phone.trim() || null,
          info_adicional: form.notes || null,
          estado: "pendiente",
          total,
        })
        .select("id")
        .single();
      if (e1) throw e1;

      // 4) Insert tramos
      const payload = tramos.map((t) => ({ ...t, sala_id, reserva_id: cab.id }));
      const { error: e2 } = await supabase
        .from("tramos_reservados")
        .insert(payload);
      if (e2) throw e2;

      // Reset y recarga
      setForm((s) => ({
        ...s,
        customer_name: "",
        customer_email: "",
        customer_phone: "",
        notes: "",
      }));
      await loadEvents();
      setTab("calendar");
    } catch (e2) {
      const msg = String(e2?.message || e2);
      if (msg.includes("tramos_no_overlap") || msg.toLowerCase().includes("overlap")) {
        setError(
          "Solapamiento detectado: ya existe una reserva en ese horario para esa sala."
        );
      } else {
        setError(msg);
      }
    }
  };

  // ---------- DELETE (cancela toda la reserva o un tramo) ----------
  const onDeleteReserva = async (reserva_id) => {
    const { error } = await supabase.from("reservas").delete().eq("id", reserva_id);
    if (error) return alert(error.message);
    await loadEvents();
  };

  const onDeleteTramo = async (tramo_id) => {
    const { error } = await supabase.from("tramos_reservados").delete().eq("id", tramo_id);
    if (error) return alert(error.message);
    await loadEvents();
  };

  // --------- LIST FILTERING (day/week) ---------
  const { listFrom, listTo, listTitle } = useMemo(() => {
    if (listMode === "all") {
      return { listFrom: null, listTo: null, listTitle: "Todas las reservas" };
    }
    let from, to, title;
    if (listMode === "day") {
      from = new Date(listCursor);
      to = new Date(listCursor);
      to.setDate(to.getDate() + 1);
      title = from.toLocaleDateString();
    } else {
      from = startOfWeek(listCursor);
      to = new Date(from);
      to.setDate(to.getDate() + 7);
      const end = new Date(to);
      end.setDate(end.getDate() - 1);
      title = `${from.toLocaleDateString()} – ${end.toLocaleDateString()}`;
    }
    return { listFrom: from, listTo: to, listTitle: title };
  }, [listMode, listCursor]);

  const listEventsBase = useMemo(() => {
    if (listMode === "all") return events;
    return events.filter((ev) => {
      const s = new Date(ev.start);
      return s >= listFrom && s < listTo;
    });
  }, [events, listFrom, listTo, listMode]);

  const filteredListEvents = useMemo(() => {
    // filtro por texto (nombre/correo/teléfono)
    const q = listQuery.trim().toLowerCase();
    if (!q) return listEventsBase;
    return listEventsBase.filter((ev) => {
      const name = (ev.title?.split(" · ")[0] || "").toLowerCase();
      const p = ev.extendedProps || {};
      const email = String(p.customer_email || "").toLowerCase();
      const phone = String(p.customer_phone || "").toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [listEventsBase, listQuery]);

  // reset de página cuando cambian modo o búsqueda
  useEffect(() => {
    setListPage(1);
  }, [listMode, listQuery]);

  if (checkingAuth) {
    return (
      <main className="min-h-screen grid place-items-center bg-zinc-100">
        <div className="flex items-center gap-2 text-zinc-700">
          <Loader2 className="h-5 w-5 animate-spin" /> Comprobando acceso...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100">
      {/* Top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b bg-white/90 p-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-orange-600" />
            <h1 className="text-lg font-semibold">Panel ArteSala</h1>
            <span className="text-xs text-zinc-500">({userEmail})</span>
          </div>
          {/* Leyenda de colores por sala */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-zinc-600 ml-2">
            <span className="inline-flex items-center gap-1">
              <span
                style={{ background: ROOM_COLORS[1] }}
                className="inline-block h-3 w-3 rounded-sm"
              />
              Sala 1
            </span>
            <span className="inline-flex items-center gap-1">
              <span
                style={{ background: ROOM_COLORS[2] }}
                className="inline-block h-3 w-3 rounded-sm"
              />
              Sala 2
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={roomFilter}
            onChange={(e) => setRoomFilter(Number(e.target.value))}
            className="rounded-lg border px-3 py-1 text-sm"
            title="Filtrar por sala"
          >
            <option value={0}>Ambas salas</option>
            <option value={1}>Sala 1</option>
            <option value={2}>Sala 2</option>
          </select>
          <button
            onClick={async () => {
              setReloading(true);
              await loadEvents();
              setReloading(false);
            }}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-sm hover:bg-zinc-50"
            title="Recargar"
          >
            {reloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            Recargar
          </button>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace("/admin/login");
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-1 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            <LogOut className="h-4 w-4" /> Salir
          </button>
        </div>
      </header>

      {/* Content */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-4 p-3 md:grid-cols-3">
        {/* Left: Calendar / List */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab("calendar")}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm ${
                tab === "calendar" ? "bg-white shadow border" : "border hover:bg-white"
              }`}
            >
              <CalendarRange className="h-4 w-4" /> Calendario
            </button>
            <button
              onClick={() => setTab("list")}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm ${
                tab === "list" ? "bg-white shadow border" : "border hover:bg-white"
              }`}
            >
              <ListFilter className="h-4 w-4" /> Listado
            </button>
          </div>

          <div className="rounded-2xl border bg-white p-2 shadow">
            {tab === "calendar" ? (
              <FullCalendar
                ref={calRef}
                plugins={[timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                height="auto"
                locale="es"
                allDaySlot={false}
                slotMinTime={START_HOUR}
                slotMaxTime={END_HOUR}
                slotDuration={SLOT_MIN}
                firstDay={1}
                nowIndicator={true}
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "timeGridWeek,timeGridDay",
                }}
                buttonText={{ today: "Hoy", week: "Semana", day: "Día" }}
                events={events}
                eventClick={(info) => {
                  const p = info.event.extendedProps || {};
                  setSelected({
                    id: info.event.id,
                    title: info.event.title,
                    start: info.event.start?.toISOString(),
                    end: info.event.end?.toISOString(),
                    ...p,
                  });
                  setModalOpen(true);
                }}
              />
            ) : (
              <BookingsList
                events={
                  (listMode === "all"
                    ? filteredListEvents.slice(
                        (listPage - 1) * PER_PAGE,
                        (listPage - 1) * PER_PAGE + PER_PAGE
                      )
                    : filteredListEvents) ?? events
                }
                title={listTitle}
                mode={listMode}
                query={listQuery}
                onQueryChange={setListQuery}
                page={listPage}
                totalPages={
                  listMode === "all"
                    ? Math.max(
                        1,
                        Math.ceil((filteredListEvents?.length || 0) / PER_PAGE)
                      )
                    : 1
                }
                onPagePrev={() => setListPage((p) => Math.max(1, p - 1))}
                onPageNext={() =>
                  setListPage((p) => {
                    const tp = Math.max(
                      1,
                      Math.ceil((filteredListEvents?.length || 0) / PER_PAGE)
                    );
                    return Math.min(tp, p + 1);
                  })
                }
                onPrev={() =>
                  setListCursor(
                    (d) =>
                      new Date(
                        d.getTime() - (listMode === "day" ? 86400000 : 7 * 86400000)
                      )
                  )
                }
                onNext={() =>
                  setListCursor(
                    (d) =>
                      new Date(
                        d.getTime() + (listMode === "day" ? 86400000 : 7 * 86400000)
                      )
                  )
                }
                onToday={() =>
                  setListCursor(
                    listMode === "day"
                      ? new Date(new Date().setHours(0, 0, 0, 0))
                      : startOfWeek(new Date())
                  )
                }
                onModeChange={setListMode}
                onDeleteReserva={(id) => setConfirmData({ type: "reserva", id })}
                onDeleteTramo={(id) => setConfirmData({ type: "tramo", id })}
                loading={loadingEvents}
              />
            )}
          </div>
        </div>

        {/* Right: Forms */}
        <div className="space-y-3">
          {/* Formulario: Nueva reserva */}
          <div className="rounded-2xl border bg-white p-4 shadow">
            <div className="mb-3 flex items-center gap-2">
              <CalendarPlus className="h-5 w-5 text-orange-600" />
              <h2 className="text-base font-semibold">Nueva reserva</h2>
            </div>

            {error && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <select
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    value={form.type}
                    onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))}
                  >
                    <option value="single">Individual</option>
                    <option value="recurring">Recurrente</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Sala</label>
                  <select
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    value={form.room}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, room: Number(e.target.value) }))
                    }
                  >
                    <option value={1}>Sala 1</option>
                    <option value={2}>Sala 2</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Nombre</label>
                  <input
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    value={form.customer_name}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, customer_name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Correo</label>
                  <input
                    type="email"
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    value={form.customer_email}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, customer_email: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Teléfono</label>
                  <input
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    value={form.customer_phone}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, customer_phone: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Notas</label>
                  <input
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    value={form.notes}
                    onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
                  />
                </div>
              </div>

              {form.type === "single" ? (
                <div className="rounded-xl border p-3">
                  <p className="mb-2 text-sm font-medium">Reserva individual</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm">Fecha</label>
                      <input
                        type="date"
                        className="mt-1 w-full rounded-lg border px-3 py-2"
                        value={form.date}
                        onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))}
                      />
                    </div>
                    <div></div>
                    <div>
                      <label className="text-sm">Hora inicio</label>
                      <input
                        type="time"
                        className="mt-1 w-full rounded-lg border px-3 py-2"
                        value={form.start_time}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, start_time: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm">Hora fin</label>
                      <input
                        type="time"
                        className="mt-1 w-full rounded-lg border px-3 py-2"
                        value={form.end_time}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, end_time: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border p-3">
                  <p className="mb-2 text-sm font-medium">Reserva recurrente</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm">Desde</label>
                      <input
                        type="date"
                        className="mt-1 w-full rounded-lg border px-3 py-2"
                        value={form.r_start_date}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, r_start_date: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm">Hasta</label>
                      <input
                        type="date"
                        className="mt-1 w-full rounded-lg border px-3 py-2"
                        value={form.r_end_date}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, r_end_date: e.target.value }))
                        }
                      />
                    </div>

                    <div>
                      <label className="text-sm">Hora inicio</label>
                      <input
                        type="time"
                        className="mt-1 w-full rounded-lg border px-3 py-2"
                        value={form.r_start_time}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, r_start_time: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm">Duración (min)</label>
                      <input
                        type="number"
                        min={15}
                        step={15}
                        className="mt-1 w-full rounded-lg border px-3 py-2"
                        value={form.r_duration_minutes}
                        onChange={(e) =>
                          setForm((s) => ({
                            ...s,
                            r_duration_minutes: Number(e.target.value),
                          }))
                        }
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-sm">Días de la semana</label>
                      <div className="mt-1 grid grid-cols-7 gap-1 text-sm">
                        {[
                          { key: "mo", label: "L" },
                          { key: "tu", label: "M" },
                          { key: "we", label: "X" },
                          { key: "th", label: "J" },
                          { key: "fr", label: "V" },
                          { key: "sa", label: "S" },
                          { key: "su", label: "D" },
                        ].map((d) => (
                          <label
                            key={d.key}
                            className={`flex items-center justify-center gap-2 rounded-lg border px-2 py-2 ${
                              form.r_byweekday[d.key]
                                ? "bg-orange-50 border-orange-300"
                                : "bg-white"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={form.r_byweekday[d.key]}
                              onChange={(e) =>
                                setForm((s) => ({
                                  ...s,
                                  r_byweekday: {
                                    ...s.r_byweekday,
                                    [d.key]: e.target.checked,
                                  },
                                }))
                              }
                            />
                            {d.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
              >
                <CalendarPlus className="h-4 w-4" /> Guardar reserva
              </button>
            </form>
          </div>

          {/* ----- NUEVO: Contraseña de la sala (global) ----- */}
          <div className="rounded-2xl border bg-white p-4 shadow">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-orange-100 text-orange-700 text-xs font-semibold">
                🔑
              </span>
              <h2 className="text-base font-semibold">Contraseña puerta (global)</h2>
            </div>

            <form onSubmit={saveDoorPass} className="space-y-2">
              <label className="text-sm font-medium" htmlFor="doorPass">
                Contraseña
              </label>
              <div className="flex gap-2">
                <input
                  id="doorPass"
                  type="text" /* Cambia a "password" si prefieres ocultarla */
                  className="w-full rounded-lg border px-3 py-2"
                  value={doorPass}
                  onChange={(e) => setDoorPass(e.target.value)}
                  placeholder="Introduce la contraseña..."
                  required
                />
                <button
                  type="submit"
                  disabled={savingPass}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
                  title="Guardar contraseña"
                >
                  {savingPass ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Guardar"
                  )}
                </button>
              </div>

              {passMsg && (
                <div
                  className={`text-xs ${
                    passMsg.startsWith("Error") ? "text-red-600" : "text-green-700"
                  }`}
                >
                  {passMsg}
                </div>
              )}
              <p className="mt-1 text-xs text-zinc-500">
                Esta contraseña es única para la sala física (mostrada al cliente donde
                corresponda).
              </p>
            </form>
          </div>

          <EventModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            selected={selected}
            onDeleteTramo={() => setConfirmData({ type: "tramo", id: selected?.id })}
            onDeleteReserva={() =>
              setConfirmData({ type: "reserva", id: selected?.reserva_id })
            }
          />
          <ConfirmDialog
            data={confirmData}
            onCancel={() => setConfirmData(null)}
            onAccept={async () => {
              if (!confirmData) return;
              if (confirmData.type === "tramo") await onDeleteTramo(confirmData.id);
              if (confirmData.type === "reserva") await onDeleteReserva(confirmData.id);
              setConfirmData(null);
              setModalOpen(false);
            }}
          />
          <TipsCard />
        </div>
      </section>
    </main>
  );
}

function BookingsList({
  events,
  title,
  mode,
  query,
  onQueryChange,
  onPrev,
  onNext,
  onToday,
  onModeChange,
  onDeleteReserva,
  onDeleteTramo,
  loading,
}) {
  return (
    <div className="p-2">
      {/* Controles del listado */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onPrev}
            className="rounded-lg border px-2 py-1 text-sm hover:bg-zinc-50"
            title="Anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-sm font-medium">{title}</div>
          <button
            onClick={onNext}
            className="rounded-lg border px-2 py-1 text-sm hover:bg-zinc-50"
            title="Siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={onToday}
            className="ml-2 rounded-lg border px-2 py-1 text-sm hover:bg-zinc-50"
          >
            Hoy
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => onQueryChange?.(e.target.value)}
            placeholder="Buscar nombre, correo o teléfono"
            className="w-64 rounded-lg border px-3 py-1 text-sm"
          />
          <select
            className="rounded-lg border px-2 py-1 text-sm"
            value={mode}
            onChange={(e) => onModeChange(e.target.value)}
          >
            <option value="day">Día</option>
            <option value="week">Semana</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 p-4 text-sm text-zinc-600">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </div>
      ) : events.length === 0 ? (
        <div className="p-4 text-sm text-zinc-600">No hay tramos en este rango.</div>
      ) : (
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-zinc-50 text-left">
              <th className="px-3 py-2">Cliente</th>
              <th className="px-3 py-2">Sala</th>
              <th className="px-3 py-2">Inicio</th>
              <th className="px-3 py-2">Fin</th>
              <th className="px-3 py-2">Contacto</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => {
              const p = ev.extendedProps || {};
              return (
                <tr key={ev.id} className="border-t">
                  <td className="px-3 py-2">{ev.title?.split(" · ")[0]}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-sm"
                        style={{
                          background: ROOM_COLORS[p.sala_id] || "#64748b",
                        }}
                      />
                      {p.sala_id}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {new Date(ev.start).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">{new Date(ev.end).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <div>{p.customer_email}</div>
                    <div className="text-xs text-zinc-500">{p.customer_phone}</div>
                  </td>
                  <td className="px-3 py-2">{p.estado || "-"}</td>
                  <td className="space-x-2 px-3 py-2 text-right">
                    <button
                      onClick={() => onDeleteTramo(ev.id)}
                      className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs hover:bg-red-50"
                      title="Eliminar tramo"
                    >
                      <Trash2 className="h-3 w-3" /> Tramo
                    </button>
                    <button
                      onClick={() => onDeleteReserva(p.reserva_id)}
                      className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs hover:bg-red-50"
                      title="Eliminar reserva"
                    >
                      <Trash2 className="h-3 w-3" /> Reserva
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function EventModal({ open, onClose, selected, onDeleteTramo, onDeleteReserva }) {
  if (!open || !selected) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-base font-semibold">Detalle de la reserva</h3>
          <button
            onClick={onClose}
            className="rounded-lg border px-2 py-1 text-xs hover:bg-zinc-50"
          >
            Cerrar
          </button>
        </div>
        <div className="space-y-1 text-sm text-zinc-700">
          <div className="font-medium">{selected.title}</div>
          <div>
            <span className="text-zinc-500">Sala:</span> {selected.sala_id}
          </div>
          <div>
            <span className="text-zinc-500">Inicio:</span>{" "}
            {new Date(selected.start).toLocaleString()}
          </div>
          <div>
            <span className="text-zinc-500">Fin:</span>{" "}
            {new Date(selected.end).toLocaleString()}
          </div>
          <div className="pt-2">
            <span className="text-zinc-500">Email:</span>{" "}
            {selected.customer_email || "-"}
          </div>
          <div>
            <span className="text-zinc-500">Tel:</span>{" "}
            {selected.customer_phone || "-"}
          </div>
          <div>
            <span className="text-zinc-500">Estado:</span>{" "}
            {selected.estado || "-"}
          </div>
          {selected.referencia_pago && (
            <div>
              <span className="text-zinc-500">Ref. pago:</span>{" "}
              {selected.referencia_pago}
            </div>
          )}
          {selected.notes && (
            <div className="whitespace-pre-wrap">
              <span className="text-zinc-500">Notas:</span> {selected.notes}
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            onClick={onDeleteTramo}
            className="rounded-lg border px-2 py-1 text-xs hover:bg-red-50"
          >
            Eliminar tramo
          </button>
          <button
            onClick={onDeleteReserva}
            className="rounded-lg border px-2 py-1 text-xs hover:bg-red-50"
          >
            Eliminar reserva
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({ data, onCancel, onAccept }) {
  if (!data) return null;
  const isTramo = data.type === "tramo";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl text-sm">
        <h4 className="mb-2 text-base font-semibold">Confirmar borrado</h4>
        <p className="text-zinc-700">
          ¿Seguro que quieres eliminar {isTramo ? "este tramo" : "toda la reserva"}?
        </p>
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border px-3 py-1 text-xs hover:bg-zinc-50"
          >
            Cancelar
          </button>
          <button
            onClick={onAccept}
            className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

function TipsCard() {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow text-sm text-zinc-700">
      <h3 className="mb-2 font-semibold">Notas del panel</h3>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          El calendario muestra cada <strong>tramo</strong> (fila en{" "}
          <code>tramos_reservados</code>), con datos del cliente de la cabecera{" "}
          <code>reservas</code>.
        </li>
        <li>
          Las reservas recurrentes se expanden a múltiples tramos con el mismo{" "}
          <code>reserva_id</code>.
        </li>
        <li>
          El coste total se calcula consultando <code>salas.coste_hora</code>.
        </li>
        <li>
          La restricción <code>EXCLUDE</code> evita solapes por <em>sala</em> y{" "}
          <em>rango</em>.
        </li>
      </ul>
    </div>
  );
}
