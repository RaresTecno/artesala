"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarCheck2,
  CreditCard,
  Star,
  ShieldCheck,
  Clock3,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import Gallery from "@/app/salas/Gallery"; // ← ajusta la ruta si es necesario

const SALAS = [
  {
    id: 1,
    slug: "sala1",
    title: "Sala 1 — 75 m²",
    meta: "75 m² • 20–25 personas • 14 €/h",
    images: [
      "https://artesala.org/wp-content/uploads/2024/09/img20240911193009-1.jpg",
      "https://artesala.org/wp-content/uploads/2024/09/img20240911193025-1.jpg",
      "https://artesala.org/wp-content/uploads/2024/09/img20240911193039-1.jpg",
      "https://artesala.org/wp-content/uploads/2024/09/img20240911193056-1.jpg",
      "https://artesala.org/wp-content/uploads/2024/09/img20240911193125.jpg",
      "https://artesala.org/wp-content/uploads/2024/10/img-20241010-wa0006.jpg",
      "https://artesala.org/wp-content/uploads/2024/10/img-20241010-wa0008.jpg",
    ],
    atributos: [
      "La sala original donde ha ensayado una gran parte del teatro y la danza madrileños, desde José Sacristán o Carmen Machi a Yllana, Carlos Rodríguez o Daniel Abreu.",
      "Suelo de danza con absorción de impacto e insonorizado, acabado en tarima laminada de madera color roble oscuro.",
      "Paredes blancas con cámara negra de cortina, para crear un oscuro teatral donde poder rodar o actuar sin fondos que distraigan.",
      "2 Barras de Ballet disponibles: una simple de 2,5 m y otra doble de 3 m de largo.",
      "Puerta insonorizada tipo estudio de sonido, para que nada moleste al trabajo, ni dentro ni fuera (obligatorio mantenerla bien cerrada durante la actividad).",
      "Aire acondicionado calor/frío. Trabaje siempre a la temperatura ideal. Ventiladores de suelo disponibles.",
      "Luz natural (6 lucernarios obturables en techo), luz de trabajo, luces indirectas y posibilidad de colgar/patchear iluminación espectacular (varas móviles de 50 mm de diámetro).",
      "5 metros lineales de espejo. ¿No quiere espejo? Cúbralo con la cortina y olvídese de él.",
      "Conecte su sonido por Bluetooth o desde cualquier fuente a través de mesa de mezclas.",
      "Sillas y mesas disponibles para trabajo de mesa. Piano eléctrico de 88 teclas contrapesadas, con stand y banqueta regulable. Pizarra blanca de trabajo.",
    ],
  },
  {
    id: 2,
    slug: "sala2",
    title: "Sala 2 — 45 m²",
    meta: "45 m² • 10–15 personas • 12 €/h",
    images: [
      "https://artesala.org/wp-content/uploads/2024/09/img20240911193206-1.jpg",
      "https://artesala.org/wp-content/uploads/2024/10/img20241010150822.jpg",
      "https://artesala.org/wp-content/uploads/2024/10/img20241010150846.jpg",
      "https://artesala.org/wp-content/uploads/2024/10/img20241010150930.jpg",
      "https://artesala.org/wp-content/uploads/2024/10/img20241010151002.jpg",
      "https://artesala.org/wp-content/uploads/2024/10/img20241010151128.jpg",
      "https://artesala.org/wp-content/uploads/2024/10/img20241010151202.jpg",
      "https://artesala.org/wp-content/uploads/2024/10/img20241010151400.jpg",
      "https://artesala.org/wp-content/uploads/2024/10/img20241010151418.jpg",
      "https://artesala.org/wp-content/uploads/2024/10/img20241010151506.jpg",
      "https://artesala.org/wp-content/uploads/2024/10/img20241010151559.jpg",
      "https://artesala.org/wp-content/uploads/2024/10/img-20241010-wa0006-1.jpg",
      "https://artesala.org/wp-content/uploads/2024/10/img-20241010-wa0008-1.jpg",
    ],
    atributos: [
      "Reformada en el verano de 2024 para dar más disponibilidad de horarios. Ideal para ensayos de menos personas, pero dotada igualmente de todas las facilidades.",
      "Suelo de teatro/danza con absorción de impactos, acabado en tarima laminada de madera color roble oscuro.",
      "Techo negro y paredes blancas, con cámara de cortina negra, para conseguir el oscuro teatral y grabar o actuar sin distracciones de fondo.",
      "Espejos a lo largo de toda una pared (7 m lineales) ocultables tras la cortina.",
      "Sonido con entrada Bluetooth / minijack.",
      "2 Barras de Ballet disponibles: una simple de 2,5 m y otra doble de 3 m de largo.",
      "Amplios ventanales para trabajar con luz natural. Totalmente obturables.",
      "Puerta insonorizada tipo estudio de sonido (obligatorio mantenerla cerrada durante la actividad).",
      "Renovación de aire mediante ventilación forzada. Ventiladores portátiles de suelo disponibles. Aire acondicionado / calefacción.",
      "Dotación de sillas y mesas para trabajo teórico.",
      "Luz natural, luz de trabajo o luces indirectas para crear un ambiente más íntimo.",
    ],
  },
];

export default function HomePage() {
  const [expanded, setExpanded] = useState({});
  const toggle = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  return (
    <main className="bg-white text-zinc-900">
      {/* HERO – degradado naranja */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-600 via-orange-500 to-orange-600" />
          <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(255,255,255,0.25),transparent_65%)] mix-blend-soft-light" />
        </div>

        <div className="relative mx-auto flex min-h-[40vh] flex-col items-center justify-center px-6 py-28 text-center sm:py-36 lg:py-28">
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

      <section
        aria-label="Garantías y confianza"
        className="border-y border-orange-200 bg-orange-50/70"
      >
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-6 py-4 sm:grid-cols-2 lg:grid-cols-5">
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

          {/* NUEVO: Abierto 365 días */}
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white p-2 text-orange-600 ring-1 ring-orange-200">
              <CalendarCheck2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-orange-900">Abierto 365 días</p>
              <p className="text-xs text-orange-900/70">Todos los días del año</p>
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

      {/* NUESTRAS SALAS */}
      <section className="relative py-12 ">
        <div className="mx-auto max-w-7xl rounded-3xl border border-orange-200/50 bg-gradient-to-b from-orange-600 via-orange-400 to-orange-600 p-6 shadow-lg shadow-orange-900/5 sm:p-8">

          <header className="mb-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow sm:text-4xl">
              Nuestras Salas
            </h2>
            <p className="mb-4 mt-4 inline-flex items-center rounded-full bg-orange-200/30 px-3 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/40">
              Elige sala, explora la galería y comienza tu reserva por horas.
            </p>
          </header>

          <div className="grid gap-10 lg:grid-cols-2">
            {SALAS.map(({ id, slug, title, meta, images, atributos }) => {
              const isExpanded = !!expanded[id];
              const items = atributos?.length
                ? isExpanded
                  ? atributos
                  : atributos.slice(0, 4)
                : [];

              return (
                <article
                  key={id}
                  className="overflow-hidden rounded-2xl border border-orange-200/60 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  {/* Galería */}
                  <div className="relative">
                    <Gallery imgs={images} />
                    <div className="pointer-events-none absolute left-3 top-3 z-10">
                      <span className="inline-flex rounded-full bg-orange-600/95 px-3 py-1 text-xs font-semibold text-white ring-1 ring-orange-700/40">
                        {title}
                      </span>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="space-y-5 p-6">
                    <h3 className="text-xl font-semibold text-zinc-900">{title}</h3>

                    {meta && (
                      <div className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 ring-1 ring-orange-200">
                        {meta}
                      </div>
                    )}

                    {items.length > 0 && (
                      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {items.map((item, idx) => (
                          <li
                            key={idx}
                            className="inline-flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-zinc-800"
                          >
                            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-orange-300 bg-white">
                              <CheckCircle2 className="h-3.5 w-3.5 text-orange-600" />
                            </span>
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {atributos?.length > 4 && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => toggle(id)}
                          className="inline-flex items-center rounded-xl border border-orange-300 bg-white px-4 py-2 text-sm font-medium text-orange-700 transition hover:bg-orange-50"
                          aria-expanded={isExpanded}
                          aria-controls={`detalles-${slug}`}
                        >
                          {isExpanded ? "Ver menos" : "Ver más"}
                        </button>
                      </div>
                    )}

                    <div className="pt-2">
                      <Link
                        href={`/reservas/${slug}`}
                        className="inline-flex items-center justify-center rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                        aria-label={`Reservar ${title}`}
                      >
                        Reservar Sala {id}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
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
            {
              num: "1",
              title: "Reserva online",
              text: "Elige sala, fecha y hora directamente en el calendario.",
              Icon: CalendarCheck2,
            },
            {
              num: "2",
              title: "Paga y listo",
              text: "Paga online de forma segura y tu reserva queda confirmada.",
              Icon: CreditCard,
            },
          ].map(({ num, title, text, Icon }) => (
            <li
              key={num}
              className="relative rounded-2xl border border-orange-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
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
      <section className="bg-gradient-to-b from-orange-600 via-orange-600 to-orange-600 py-16 text-orange-50">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-10 text-center text-3xl font-semibold text-white">
            Lo que dicen nuestros clientes
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "Teresa Ruiz Velasco",
                location: "Madrid",
                avatar: "/usuario.webp",
                quote:
                  "Un espacio muy recomendable para ensayos: económico, limpio y con un trato impecable.",
              },
              {
                name: "Fábrica de Ninjas",
                location: "Madrid",
                avatar: "/usuario.webp",
                quote:
                  "Muy acogedor, tranquilo para trabajar y el dueño es muy atento. ¡Muy recomendable!",
              },
              {
                name: "Marta Paúl",
                location: "Madrid",
                avatar: "/usuario.webp",
                quote:
                  "Un espacio muy bien equipado. Julio pone todas las facilidades para que sea cómodo.",
              },
              {
                name: "Annika Pannito",
                location: "Madrid",
                avatar: "/usuario.webp",
                quote:
                  "Ideal para clases de danza. Sala amplia y dueño siempre disponible. Lo recomiendo.",
              },
              {
                name: "Miss Teen España",
                location: "Madrid",
                avatar: "/usuario.webp",
                quote:
                  "Excelente espacio para ensayar distintos eventos y con muchas comodidades.",
              },
              {
                name: "Naima Sahko",
                location: "Madrid",
                avatar: "/usuario.webp",
                quote:
                  "Espacio amplio, impecable, buenas instalaciones y muy buen trato.",
              },
            ].map(({ name, location, avatar, quote }) => (
              <figure
                key={name}
                className="flex flex-col gap-4 rounded-2xl border border-white-300/100 bg-orange-800/80 p-6 shadow-sm backdrop-blur-[2px] transition hover:-translate-y-0.5 hover:bg-orange-400/30 hover:shadow-md"
              >
                <figcaption className="flex items-center gap-3">
                  <Image
                    src={avatar}
                    alt={`Foto de ${name}`}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-orange-300/40"
                  />
                  <div>
                    <p className="font-semibold text-orange-100">{name}</p>
                    <p className="text-xs text-orange-200/70">{location}</p>
                  </div>
                </figcaption>
                <blockquote className="text-sm leading-relaxed text-orange-50/90">
                  “{quote}”
                </blockquote>
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
              <Link
                href="/salas"
                className="inline-flex items-center rounded-xl bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-orange-700"
              >
                Reservar
              </Link>
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://maps.app.goo.gl/T5ERiRirPLUYbF8J6"
                className="inline-flex items-center rounded-xl border border-orange-300 bg-white px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-50"
              >
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
