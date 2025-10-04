// app/actividades/page.jsx
"use client";

import Link from "next/link";
import { CheckCircle2, CalendarRange, Instagram } from "lucide-react";

const ACTIVIDADES = [
  {
    title: "Muchas actividades diferentes",
    slug: "varias",
    tag: "General",
    ig: "https://www.instagram.com/artesalamulti/",
    img: "https://artesala.org/wp-content/uploads/2024/09/actividades.jpg?w=913",
  },
  {
    title: "Cris Mesones — HouseDance / SoulDance",
    slug: "crismesones",
    tag: "Danza urbana",
    ig: "https://www.instagram.com/cris.mesones/",
    img: "https://artesala.org/wp-content/uploads/2024/10/captura-de-pantalla-2024-10-24-a-las-15.43.10.png?w=364",
  },
  {
    title: "Marina Lilred — Danza Urbana",
    slug: "marina-lilred",
    tag: "Danza urbana",
    ig: "https://www.instagram.com/marina_lilred/",
    img: "https://artesala.org/wp-content/uploads/2024/10/captura-de-pantalla-2024-10-24-a-las-15.21.18.png?w=415",
  },
  {
    title: "Acting Studio — Interpretación",
    slug: "acting-studio",
    tag: "Teatro / Interpretación",
    ig: "https://www.instagram.com/theactingstudiomadrid/",
    img: "https://artesala.org/wp-content/uploads/2024/09/captura-de-pantalla-2024-09-19-a-las-17.32.23.png?w=737",
  },
  {
    title: "Mi cuerpo crea — Danza",
    slug: "mi-cuerpo-crea",
    tag: "Danza / Cuerpo",
    ig: "https://www.instagram.com/micuerpocrea/",
    img: "https://artesala.org/wp-content/uploads/2024/09/captura-de-pantalla-2024-09-19-a-las-16.59.55.png?w=732",
  },
  {
    title: "Del entrenamiento a la escena — Teatro",
    slug: "entrenamiento-a-escena",
    tag: "Teatro",
    ig: "https://www.instagram.com/vanessarasero/",
    img: "https://artesala.org/wp-content/uploads/2024/09/curso-vanessa-raserlo-lanzamiento-24-25.png?w=915",
  },
];

export default function ActividadesPage() {
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
            Actividades
          </h1>
          <p className="mt-3 max-w-2xl text-orange-50">
            Algunas de las propuestas que pasan por ArteSala: danza, teatro e interpretación.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/salas"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-semibold text-orange-700 shadow-lg hover:bg-orange-50"
            >
              Ver salas
            </Link>
            <Link
              href="/contacto"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/60 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
              title="¿Quieres proponer una actividad?"
            >
              <CalendarRange className="h-4 w-4" />
              Proponer actividad
            </Link>
          </div>
        </div>
      </section>

      {/* LISTA */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ACTIVIDADES.map(({ title, tag, slug, ig, img }) => (
            <article
              key={slug}
              className="group flex flex-col rounded-2xl border border-orange-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {/* Imagen */}
              <div className="mb-4 h-40 w-full overflow-hidden rounded-xl ring-1 ring-orange-100">
                <img
                  src={img}
                  alt={title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                />
              </div>

              <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>

              {tag && (
                <span className="mt-2 inline-flex w-fit items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
                  <CheckCircle2 className="h-3.5 w-3.5 text-orange-600" />
                  {tag}
                </span>
              )}

              <p className="mt-3 text-sm text-zinc-600">
                Conoce fechas, vídeos y novedades en su Instagram.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={ig}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
                >
                  <Instagram className="h-4 w-4" />
                  Ver en Instagram
                </a>
              </div>
            </article>
          ))}
        </div>

        {/* CTA final */}
        <div className="mt-10 rounded-2xl border border-orange-200 bg-orange-50 p-6 text-center">
          <h3 className="text-base font-semibold text-orange-900">
            ¿Tienes una actividad recurrente (clases semanales, ensayos, bonos)?
          </h3>
          <p className="mt-1 text-sm text-orange-900/80">
            Cuéntanos tu caso y te preparamos una propuesta a medida.
          </p>
          <div className="mt-4">
            <Link
              href="/contacto"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
            >
              Contactar ahora
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
