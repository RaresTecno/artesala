"use client";

import Link from "next/link";

export default function TerminosCondicionesPage() {
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
            Términos y Condiciones
          </h1>
          <p className="mt-3 text-orange-50">Última actualización: {updated}</p>
        </div>
      </section>

      {/* Contenido */}
      <section className="mx-auto max-w-4xl px-6 py-12">
        <nav className="mb-8 rounded-2xl border border-orange-200 bg-orange-50 p-5">
          <h2 className="mb-3 text-sm font-semibold text-orange-900">Contenido</h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-orange-900/90">
            <li><a href="#objeto" className="hover:underline">1. Objeto</a></li>
            <li><a href="#reservas" className="hover:underline">2. Reservas y disponibilidad</a></li>
            <li><a href="#pagos" className="hover:underline">3. Pagos</a></li>
            <li><a href="#cancelaciones" className="hover:underline">4. Cancelaciones y cambios</a></li>
            <li><a href="#uso" className="hover:underline">5. Normas de uso de las salas</a></li>
            <li><a href="#responsabilidad" className="hover:underline">6. Limitación de responsabilidad</a></li>
            <li><a href="#propiedad" className="hover:underline">7. Propiedad intelectual</a></li>
            <li><a href="#ley" className="hover:underline">8. Ley aplicable y jurisdicción</a></li>
            <li><a href="#contacto" className="hover:underline">9. Contacto</a></li>
          </ol>
        </nav>

        <article className="prose prose-zinc max-w-none">
          <section id="objeto" className="not-prose mb-6 rounded-2xl border border-orange-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">1. Objeto</h2>
            <p className="mt-2 text-sm text-zinc-700">
              Estos términos regulan el uso del sitio y la contratación de servicios de reserva de salas ofrecidos por <strong>ArteSala</strong>.
            </p>
          </section>

          <section id="reservas" className="not-prose mb-6 rounded-2xl border border-orange-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">2. Reservas y disponibilidad</h2>
            <p className="mt-2 text-sm text-zinc-700">
              Las reservas se realizan por horas a través del calendario online. La confirmación se envía por email/WhatsApp con instrucciones de acceso.
            </p>
          </section>

          <section id="pagos" className="not-prose mb-6 rounded-2xl border border-orange-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">3. Pagos</h2>
            <p className="mt-2 text-sm text-zinc-700">
              El pago se efectúa mediante TPV <strong>Redsys</strong>. ArteSala no almacena datos completos de tarjeta.
            </p>
          </section>

          <section id="cancelaciones" className="not-prose mb-6 rounded-2xl border border-orange-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">4. Cancelaciones y cambios</h2>
            <p className="mt-2 text-sm text-zinc-700">
              Indica aquí tu política (p. ej., cancelación gratuita hasta 7 días antes; fuera de plazo, no reembolsable / cambio sujeto a disponibilidad).
            </p>
          </section>

          <section id="uso" className="not-prose mb-6 rounded-2xl border border-orange-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">5. Normas de uso de las salas</h2>
            <ul className="mt-2 list-disc pl-6 text-sm text-zinc-700">
              <li>Respeto al aforo y horario contratado.</li>
              <li>Mantener puerta insonorizada cerrada durante la actividad.</li>
              <li>Dejar la sala limpia y en condiciones adecuadas.</li>
              <li>Prohibido fumar o consumir sustancias ilícitas.</li>
            </ul>
          </section>

          <section id="responsabilidad" className="not-prose mb-6 rounded-2xl border border-orange-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">6. Limitación de responsabilidad</h2>
            <p className="mt-2 text-sm text-zinc-700">
              ArteSala no se responsabiliza de objetos personales ni de usos contrarios a las normas. La responsabilidad del usuario se extiende a daños ocasionados en el espacio.
            </p>
          </section>

          <section id="propiedad" className="not-prose mb-6 rounded-2xl border border-orange-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">7. Propiedad intelectual</h2>
            <p className="mt-2 text-sm text-zinc-700">
              El contenido del sitio (textos, imágenes, logotipos) pertenece a ArteSala o a sus titulares y se encuentra protegido por la normativa aplicable.
            </p>
          </section>

          <section id="ley" className="not-prose mb-6 rounded-2xl border border-orange-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">8. Ley aplicable y jurisdicción</h2>
            <p className="mt-2 text-sm text-zinc-700">
              Esta relación se rige por la legislación española. Para cualquier controversia, las partes se someten a los juzgados de Madrid, salvo derechos imperativos del consumidor.
            </p>
          </section>

          <section id="contacto" className="not-prose rounded-2xl border border-orange-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">9. Contacto</h2>
            <p className="mt-2 text-sm text-zinc-700">
              Escríbenos a{" "}
              <a href="mailto:info@artesala.org" className="text-orange-700 underline">info@artesala.org</a> o consulta nuestra{" "}
              <Link href="/politica-privacidad" className="text-orange-700 underline">Política de Privacidad</Link>.
            </p>
          </section>
        </article>
      </section>
    </main>
  );
}
