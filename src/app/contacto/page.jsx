"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Info, Loader2, User } from "lucide-react";

export default function ContactoPage() {
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    const fd = new FormData(formRef.current);
    const nombre = String(fd.get("nombre") || "").trim();
    const correo = String(fd.get("correo") || "").trim();
    const prefijo = String(fd.get("prefijo") || "").trim();
    const telefono = String(fd.get("telefono") || "").replace(/\s+/g, "");
    const mensaje = String(fd.get("mensaje") || "").trim();

    if (nombre.length < 3) return setErr("Introduce tu nombre completo.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return setErr("Correo no válido.");
    if (!/^\+\d{1,4}$/.test(prefijo)) return setErr("Prefijo inválido. Ej.: +34");
    if (!/^\d{6,15}$/.test(telefono)) return setErr("Teléfono inválido (6–15 dígitos).");
    if (mensaje.length < 5) return setErr("Cuéntanos brevemente tu consulta.");

    setLoading(true);
    try {
      const res = await fetch("/api/contacto", {
        method: "POST",
        body: JSON.stringify({
          nombre,
          correo,
          telefono: `${prefijo}${telefono}`,
          mensaje,
        }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("No se pudo enviar el mensaje.");
      setOk(true);
      formRef.current?.reset();
    } catch (e) {
      setErr(e.message || "Error enviando el formulario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-white text-zinc-900">
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-600 via-orange-500 to-orange-600" />
          <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(255,255,255,0.25),transparent_65%)] mix-blend-soft-light" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm sm:text-5xl">
            Contacto
          </h1>
          <p className="mt-3 max-w-2xl text-orange-50">
            ¿Dudas sobre reservas, facturación o disponibilidad? Escríbenos y te respondemos hoy.
          </p>
          <div className="mt-6">
            <Link
              href="/salas"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-semibold text-orange-700 shadow-lg hover:bg-orange-50"
            >
              Ver salas
            </Link>
          </div>
        </div>
      </section>

      {/* CONTENIDO */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Datos de contacto */}
          <div className="space-y-4 lg:col-span-1">
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-orange-900">ArteSala</h2>
              <p className="mt-1 text-sm text-orange-900/90">
                C/ Abejuela, 7 · 28047 Madrid
              </p>
              <div className="mt-3 space-y-2 text-sm text-orange-900/90">
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-orange-600" />
                  <a className="underline" href="mailto:artesalainfo@gmail.com">
                    artesalainfo@gmail.com
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-orange-600" />
                  <span>+34 690 822 002</span>
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-orange-600" />
                  <a
                    className="underline"
                    href="https://maps.app.goo.gl/T5ERiRirPLUYbF8J6"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir en Google Maps
                  </a>
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-zinc-900">Horario</h3>
              <p className="mt-1 text-sm text-zinc-700">07:00–23:00 · 365 días</p>
            </div>
          </div>

          {/* Formulario */}
          <div className="lg:col-span-2">
            <form
              ref={formRef}
              onSubmit={onSubmit}
              className="rounded-2xl border border-white/40 bg-white/95 p-6 shadow-lg shadow-orange-900/10 backdrop-blur"
            >
              <div className="mb-5 border-b border-zinc-100 pb-4">
                <h2 className="text-base font-semibold">Escríbenos</h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Te responderemos por correo o WhatsApp.
                </p>
              </div>

              {err && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {err}
                </div>
              )}
              {ok && (
                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  ¡Mensaje enviado! Gracias por contactarnos.
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium" htmlFor="nombre">
                    Nombre completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      id="nombre"
                      name="nombre"
                      type="text"
                      placeholder="Nombre y apellidos"
                      className="w-full rounded-xl border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                      required
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
                      placeholder="nombre@dominio.com"
                      className="w-full rounded-xl border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="telefono">
                    Prefijo + Teléfono
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="prefijo"
                      name="prefijo"
                      type="tel"
                      defaultValue="+34"
                      className="w-24 rounded-xl border border-gray-300 py-2.5 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                      required
                    />
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        id="telefono"
                        name="telefono"
                        type="tel"
                        placeholder="600000000"
                        className="w-full rounded-xl border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                        required
                      />
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    Solo para comunicaciones sobre tu consulta o reserva.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium" htmlFor="mensaje">
                    Mensaje
                  </label>
                  <div className="relative">
                    <Info className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <textarea
                      id="mensaje"
                      name="mensaje"
                      rows={5}
                      placeholder="¿En qué podemos ayudarte?"
                      className="w-full rounded-xl border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Enviar
                </button>
                <p className="mt-2 text-center text-xs text-zinc-500">
                  También puedes escribir a <a href="mailto:artesalainfo@gmail.com" className="underline">artesalainfo@gmail.com</a>.
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
