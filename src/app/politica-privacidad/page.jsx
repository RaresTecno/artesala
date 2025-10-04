"use client";

import Link from "next/link";

export default function PoliticaPrivacidadPage() {
  const updated = "2 de octubre de 2025";

  return (
    <main className="bg-white text-zinc-900">
      {/* HERO con degradado naranja */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-600 via-orange-500 to-orange-600" />
          <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(255,255,255,0.25),transparent_65%)] mix-blend-soft-light" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6 py-20 text-center sm:py-28">
          <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm sm:text-5xl">
            Política de Privacidad
          </h1>
          <p className="mt-3 text-orange-50">Última actualización: {updated}</p>
        </div>
      </section>

      {/* Contenido */}
      <section className="mx-auto max-w-4xl px-6 py-12">
        {/* Índice */}
        <nav className="mb-8 rounded-2xl border border-orange-200 bg-orange-50 p-5">
          <h2 className="mb-3 text-sm font-semibold text-orange-900">Contenido</h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-orange-900/90">
            <li><a href="#responsable" className="hover:underline">1. Responsable del tratamiento</a></li>
            <li><a href="#datos" className="hover:underline">2. Datos que recopilamos</a></li>
            <li><a href="#finalidades" className="hover:underline">3. Finalidades y base legal</a></li>
            <li><a href="#conservacion" className="hover:underline">4. Plazo de conservación</a></li>
            <li><a href="#destinatarios" className="hover:underline">5. Destinatarios y encargados</a></li>
            <li><a href="#derechos" className="hover:underline">6. Derechos de las personas usuarias</a></li>
            <li><a href="#seguridad" className="hover:underline">7. Seguridad de la información</a></li>
            <li><a href="#cookies" className="hover:underline">8. Cookies</a></li>
            <li><a href="#contacto" className="hover:underline">9. Contacto</a></li>
          </ol>
        </nav>

        <article className="prose prose-zinc max-w-none">
          <section id="responsable" className="not-prose mb-6 rounded-2xl border border-orange-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">1. Responsable del tratamiento</h2>
            <p className="mt-2 text-sm text-zinc-700">
              <strong>ArteSala</strong> — C/ Abejuela, 7, 28047 Madrid. Correo:{" "}
              <a href="mailto:info@artesala.org" className="text-orange-700 underline">info@artesala.org</a>.
            </p>
          </section>

          <section id="datos" className="not-prose mb-6 rounded-2xl border border-orange-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">2. Datos que recopilamos</h2>
            <ul className="mt-2 list-disc pl-6 text-sm text-zinc-700">
              <li>Identificación y contacto (nombre, email, teléfono).</li>
              <li>Datos de la reserva (sala, fecha, hora, comentarios).</li>
              <li>Datos de pago (procesados por Redsys; no almacenamos la tarjeta).</li>
              <li>Datos técnicos (IP, logs, cookies/identificadores).</li>
            </ul>
          </section>

          <section id="finalidades" className="not-prose mb-6 rounded-2xl border border-orange-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">3. Finalidades y base legal</h2>
            <ul className="mt-2 list-disc pl-6 text-sm text-zinc-700">
              <li>Gestionar reservas y prestar el servicio (ejecución contractual).</li>
              <li>Facturación y cumplimiento legal (obligación legal).</li>
              <li>Atención al cliente y comunicaciones operativas (interés legítimo/contractual).</li>
              <li>Mejora del sitio y seguridad (interés legítimo).</li>
              <li>Comunicaciones comerciales (consentimiento, cuando aplique).</li>
            </ul>
          </section>

          <section id="conservacion" className="not-prose mb-6 rounded-2xl border border-orange-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">4. Plazo de conservación</h2>
            <p className="mt-2 text-sm text-zinc-700">
              Conservamos los datos el tiempo necesario para la prestación del servicio y los plazos exigidos por normativa fiscal/contable.
            </p>
          </section>

          <section id="destinatarios" className="not-prose mb-6 rounded-2xl border border-orange-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">5. Destinatarios y encargados</h2>
            <p className="mt-2 text-sm text-zinc-700">
              Proveedores con acceso a datos (p. ej., <strong>Redsys</strong> para pagos, <strong>Supabase</strong> para BBDD, <strong>Cloudflare</strong> para CDN/hosting) actúan como encargados siguiendo nuestras instrucciones.
            </p>
          </section>

          <section id="derechos" className="not-prose mb-6 rounded-2xl border border-orange-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">6. Derechos de las personas usuarias</h2>
            <p className="mt-2 text-sm text-zinc-700">
              Puedes ejercer acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a{" "}
              <a href="mailto:privacidad@artesala.org" className="text-orange-700 underline">privacidad@artesala.org</a>. También puedes reclamar ante la AEPD.
            </p>
          </section>

          <section id="seguridad" className="not-prose mb-6 rounded-2xl border border-orange-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">7. Seguridad de la información</h2>
            <p className="mt-2 text-sm text-zinc-700">
              Aplicamos medidas técnicas y organizativas (cifrado en tránsito, control de accesos, backups) acordes al riesgo.
            </p>
          </section>

          <section id="cookies" className="not-prose mb-6 rounded-2xl border border-orange-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">8. Cookies</h2>
            <p className="mt-2 text-sm text-zinc-700">
              Consulta la <Link href="/cookies" className="text-orange-700 underline">Política de Cookies</Link> para más información.
            </p>
          </section>

          <section id="contacto" className="not-prose rounded-2xl border border-orange-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">9. Contacto</h2>
            <p className="mt-2 text-sm text-zinc-700">
              Para dudas sobre privacidad, escríbenos a{" "}
              <a href="mailto:privacidad@artesala.org" className="text-orange-700 underline">privacidad@artesala.org</a>.
            </p>
          </section>
        </article>
      </section>
    </main>
  );
}
