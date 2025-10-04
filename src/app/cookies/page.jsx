"use client";

import Link from "next/link";

export default function CookiesPage() {
  const updated = "2 de octubre de 2025";

  return (
    <main className="bg-white text-zinc-900">
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-600 via-orange-500 to-orange-600" />
          <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(255,255,255,0.25),transparent_65%)] mix-blend-soft-light" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6 py-20 text-center sm:py-28">
          <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm sm:text-5xl">
            Política de Cookies
          </h1>
          <p className="mt-3 text-orange-50">Última actualización: {updated}</p>
        </div>
      </section>

      {/* Contenido */}
      <section className="mx-auto max-w-4xl px-6 py-12">
        <nav className="mb-8 rounded-2xl border border-orange-200 bg-orange-50 p-5">
          <h2 className="mb-3 text-sm font-semibold text-orange-900">Contenido</h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-orange-900/90">
            <li><a href="#que-son" className="hover:underline">1. ¿Qué son las cookies?</a></li>
            <li><a href="#tipos" className="hover:underline">2. Tipos de cookies que utilizamos</a></li>
            <li><a href="#gestion" className="hover:underline">3. Cómo gestionar o desactivar cookies</a></li>
            <li><a href="#terceros" className="hover:underline">4. Cookies de terceros</a></li>
            <li><a href="#cambios" className="hover:underline">5. Cambios en la política de cookies</a></li>
            <li><a href="#contacto" className="hover:underline">6. Contacto</a></li>
          </ol>
        </nav>

        <article className="prose prose-zinc max-w-none">
          <section id="que-son" className="not-prose mb-6 rounded-2xl border border-orange-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">1. ¿Qué son las cookies?</h2>
            <p className="mt-2 text-sm text-zinc-700">
              Son pequeños archivos que se almacenan en tu dispositivo para recordar información cuando navegas. Pueden ser propias o de terceros.
            </p>
          </section>

          <section id="tipos" className="not-prose mb-6 rounded-2xl border border-orange-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">2. Tipos de cookies que utilizamos</h2>
            <ul className="mt-2 list-disc pl-6 text-sm text-zinc-700">
              <li><strong>Técnicas</strong>: necesarias para que el sitio funcione (sesión, seguridad, reservas).</li>
              <li><strong>Preferencias</strong>: recuerdan elecciones (idioma, ajustes).</li>
              <li><strong>Analíticas</strong>: ayudan a comprender el uso del sitio (métricas agregadas).</li>
              <li><strong>Marketing</strong>: solo si las habilitas; sirven para personalizar publicidad.</li>
            </ul>
          </section>

          <section id="gestion" className="not-prose mb-6 rounded-2xl border border-orange-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">3. Cómo gestionar o desactivar cookies</h2>
            <p className="mt-2 text-sm text-zinc-700">
              Puedes aceptar, rechazar o configurar las cookies desde el banner de consentimiento y desde la configuración de tu navegador. Ten en cuenta que bloquear algunas cookies puede afectar al funcionamiento del sitio.
            </p>
          </section>

          <section id="terceros" className="not-prose mb-6 rounded-2xl border border-orange-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">4. Cookies de terceros</h2>
            <p className="mt-2 text-sm text-zinc-700">
              Podemos utilizar proveedores como <strong>Google</strong> (Analytics/Maps) o servicios de <strong>pago (Redsys)</strong>. Estos terceros pueden establecer cookies según sus propias políticas.
            </p>
          </section>

          <section id="cambios" className="not-prose mb-6 rounded-2xl border border-orange-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">5. Cambios en la política de cookies</h2>
            <p className="mt-2 text-sm text-zinc-700">
              Podemos actualizar esta política para reflejar cambios normativos o técnicos. Publicaremos la versión vigente en esta página.
            </p>
          </section>

          <section id="contacto" className="not-prose rounded-2xl border border-orange-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">6. Contacto</h2>
            <p className="mt-2 text-sm text-zinc-700">
              Para consultas sobre cookies y privacidad:{" "}
              <a href="mailto:privacidad@artesala.org" className="text-orange-700 underline">privacidad@artesala.org</a>. Consulta también la{" "}
              <Link href="/politica-privacidad" className="text-orange-700 underline">Política de Privacidad</Link>.
            </p>
          </section>
        </article>
      </section>
    </main>
  );
}
