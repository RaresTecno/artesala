"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarCheck2, CreditCard, Star, ShieldCheck, Clock3, MapPin } from "lucide-react";

const testimonials = [
  { name: "Teresa Ruiz Velasco", location: "Madrid", avatar: "/usuario.webp", quote: "Un espacio muy recomendable para ensayos: económico, limpio y con un trato impecable." },
  { name: "Fábrica de Ninjas", location: "Madrid", avatar: "/usuario.webp", quote: "Muy acogedor, tranquilo para trabajar y el dueño es muy atento. ¡Muy recomendable!" },
  { name: "Marta Paúl", location: "Madrid", avatar: "/usuario.webp", quote: "Un espacio muy bien equipado. Julio pone todas las facilidades para que sea cómodo." },
  { name: "Annika Pannito", location: "Madrid", avatar: "/usuario.webp", quote: "Ideal para clases de danza. Sala amplia y dueño siempre disponible. Lo recomiendo." },
  { name: "Miss Teen España", location: "Madrid", avatar: "/usuario.webp", quote: "Excelente espacio para ensayar distintos eventos y con muchas comodidades." },
  { name: "Naima Sahko", location: "Madrid", avatar: "/usuario.webp", quote: "Espacio amplio, impecable, buenas instalaciones y muy buen trato." },
];

export default function HomePage() {
  return (
    <main className="bg-white text-zinc-900">
      {/* HERO – degradado naranja */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-600 via-orange-500 to-orange-600" />
          <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(255,255,255,0.25),transparent_65%)] mix-blend-soft-light" />
          {/* <Image src="/hero.jpg" alt="" fill priority className="object-cover mix-blend-overlay opacity-60" /> */}
        </div>

        <div className="relative mx-auto flex min-h-[65vh] flex-col items-center justify-center px-6 py-28 text-center sm:py-36 lg:py-44">
          <span className="mb-4 inline-flex items-center rounded-full bg-orange-200/30 px-3 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/40">
            Espacios de ensayo en Madrid
          </span>
          <h1 className="max-w-5xl text-4xl font-bold tracking-tight text-white drop-shadow-sm sm:text-6xl md:text-7xl">
            ArteSala
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-orange-50 sm:text-lg">
            Dos salas equipadas y económicas para ensayar, enseñar y crear — en el centro de Madrid.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/salas"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-orange-700 shadow-lg transition hover:bg-orange-50 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-white"
            >
              Reservar ahora
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center gap-2 rounded-2xl bg-orange-400/20 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/40 backdrop-blur transition hover:bg-orange-400/30 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-white/60"
            >
              Cómo funciona
            </a>
          </div>
        </div>
      </section>

      {/* BANNER DE CONFIANZA */}
      <section
        aria-label="Garantías y confianza"
        className="border-y border-orange-200 bg-orange-50/70"
      >
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-6 py-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white p-2 text-orange-600 ring-1 ring-orange-200">
              <Star className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-orange-900">Valoración excelente</p>
              <p className="text-xs text-orange-900/70">Clientes satisfechos y recurrentes</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white p-2 text-orange-600 ring-1 ring-orange-200">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-orange-900">Pago seguro</p>
              <p className="text-xs text-orange-900/70">TPV Redsys · Tarjeta</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white p-2 text-orange-600 ring-1 ring-orange-200">
              <Clock3 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-orange-900">Reserva por horas</p>
              <p className="text-xs text-orange-900/70">Horario 07:00–23:00</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white p-2 text-orange-600 ring-1 ring-orange-200">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-orange-900">Ubicación céntrica</p>
              <p className="text-xs text-orange-900/70">C/ Abejuela, 7 · Madrid</p>
            </div>
          </div>
        </div>
      </section>

      {/* NUESTRO SERVICIO */}
      <section className="relative isolate">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-14 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Nuestro servicio
            </h2>
            <p className="mt-4 text-lg leading-8 text-zinc-700">
              ¿Buscas un espacio para ensayar, dar clases, grabar vídeos o montar tu evento?
              Nuestras salas cuentan con aire acondicionado, espejos, suelo de tarima y están
              totalmente equipadas. En el centro de Madrid y con reserva por horas, de forma
              sencilla y flexible. Buen ambiente, comodidad y todo lo que necesitas para bailar o crear a tu ritmo.
            </p>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
              <ul className="grid grid-cols-1 gap-3 text-sm text-zinc-800 sm:grid-cols-2">
                {[
                  "Aire acondicionado",
                  "Espejos de pared",
                  "Suelo de tarima",
                  "Equipo de música",
                  "Reserva por horas",
                  "Ubicación céntrica",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-orange-200">
                    <span className="inline-block h-2 w-2 rounded-full bg-orange-500" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* PASOS */}
      <section id="como-funciona" className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="mb-6 font-heading text-3xl font-bold sm:text-4xl">
          ¿Cómo funciona?
        </h2>

        <ol className="grid gap-6 sm:grid-cols-2">
          {[
            { num: "1", title: "Reserva online", text: "Elige sala, fecha y hora directamente en el calendario.", Icon: CalendarCheck2 },
            { num: "2", title: "Paga y listo", text: "Paga online de forma segura y tu reserva queda confirmada.", Icon: CreditCard },
          ].map(({ num, title, text, Icon }) => (
            <li key={num} className="relative rounded-2xl border border-orange-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="absolute -top-4 left-6 flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white ring-4 ring-orange-100">
                {num}
              </span>
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-xl bg-orange-100 p-2 text-orange-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-zinc-600">{text}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex w-full items-center justify-center">
          <Link
            href="/salas"
            className="inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-7 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-orange-700 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-orange-500"
          >
            Reserva ahora tu sala
          </Link>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="bg-gradient-to-b from-orange-900 via-orange-900 to-orange-950 py-16 text-orange-50">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-10 text-center text-3xl font-semibold text-orange-200">
            Lo que dicen nuestros clientes
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map(({ name, location, avatar, quote }) => (
              <figure key={name} className="flex flex-col gap-4 rounded-2xl border border-orange-300/20 bg-orange-800/30 p-6 shadow-sm backdrop-blur-[2px] transition hover:-translate-y-0.5 hover:shadow-md">
                <figcaption className="flex items-center gap-3">
                  <Image src={avatar} alt={`Foto de ${name}`} width={48} height={48} className="h-12 w-12 rounded-full object-cover ring-2 ring-orange-300/40" />
                  <div>
                    <p className="font-semibold text-orange-100">{name}</p>
                    <p className="text-xs text-orange-200/70">{location}</p>
                  </div>
                </figcaption>
                <blockquote className="text-sm leading-relaxed text-orange-50/90">“{quote}”</blockquote>
                <div className="flex" aria-label="Valoración 5 de 5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACTO / UBICACIÓN */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="mb-2 text-center text-2xl font-semibold">¿Dónde estamos?</h2>
        <p className="mb-6 text-center text-sm text-zinc-600">
          C/ Abejuela, 7 · 28047 Madrid · Metros: Carpetana / Carabanchel
        </p>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm md:col-span-1">
            <h3 className="text-base font-semibold text-orange-900">ArteSala</h3>
            <p className="mt-1 text-sm text-orange-900/80">C/ Abejuela, 7 · 28047 Madrid</p>
            <p className="mt-1 text-sm text-orange-900/80">Metros: Carpetana / Carabanchel</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/salas" className="inline-flex items-center rounded-xl bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-orange-700">
                Reservar
              </Link>
              <a target="_blank" rel="noopener noreferrer" href="https://maps.app.goo.gl/V4mG5pW5oZf4j5y49" className="inline-flex items-center rounded-xl border border-orange-300 bg-white px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-50">
                Abrir en Maps
              </a>
            </div>
          </div>

          <div className="relative h-72 overflow-hidden rounded-2xl border border-orange-200 shadow-sm md:col-span-2">
            <iframe
              title="Ubicación de ArteSala, Madrid"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1519.4127083559686!2d-3.7465625552751867!3d40.390561782248604!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd4189db67b86a53%3A0x32f396bf5aa3a8c6!2sARTESALA%20-%20Alquiler%20Espacio%20Multiusos!5e0!3m2!1ses!2ses!4v1750352489858!5m2!1ses!2ses&basemap=satellite"
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              allowFullScreen
            />
          </div>
        </div>
      </section>
    </main>
  );
}
