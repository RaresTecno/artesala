// app/salas/page.jsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import Gallery from './Gallery';

/** Solo información nueva (meta + atributos) */
const SALAS = [
  {
    id: 1,
    slug: 'sala1',
    title: 'Sala 1 — 75 m²',
    meta: '75 m² • 20–25 personas • 14 €/h',
    images: [
      'https://artesala.org/wp-content/uploads/2024/09/img20240911193009-1.jpg',
      'https://artesala.org/wp-content/uploads/2024/09/img20240911193025-1.jpg',
      'https://artesala.org/wp-content/uploads/2024/09/img20240911193039-1.jpg',
      'https://artesala.org/wp-content/uploads/2024/09/img20240911193056-1.jpg',
      'https://artesala.org/wp-content/uploads/2024/09/img20240911193125.jpg',
      'https://artesala.org/wp-content/uploads/2024/10/img-20241010-wa0006.jpg',
      'https://artesala.org/wp-content/uploads/2024/10/img-20241010-wa0008.jpg',
    ],
    atributos: [
      'La sala original donde ha ensayado una gran parte del teatro y la danza madrileños, desde José Sacristán o Carmen Machi a Yllana, Carlos Rodríguez o Daniel Abreu.',
      'Suelo de danza con absorción de impacto e insonorizado, acabado en tarima laminada de madera color roble oscuro.',
      'Paredes blancas con cámara negra de cortina, para crear un oscuro teatral donde poder rodar o actuar sin fondos que distraigan.',
      '2 Barras de Ballet disponibles: una simple de 2,5 m y otra doble de 3 m de largo.',
      'Puerta insonorizada tipo estudio de sonido, para que nada moleste al trabajo, ni dentro ni fuera (obligatorio mantenerla bien cerrada durante la actividad).',
      'Aire acondicionado calor/frío. Trabaje siempre a la temperatura ideal. Ventiladores de suelo disponibles.',
      'Luz natural (6 lucernarios obturables en techo), luz de trabajo, luces indirectas y posibilidad de colgar/patchear iluminación espectacular (varas móviles de 50 mm de diámetro).',
      '5 metros lineales de espejo. ¿No quiere espejo? Cúbralo con la cortina y olvídese de él.',
      'Conecte su sonido por Bluetooth o desde cualquier fuente a través de mesa de mezclas.',
      'Sillas y mesas disponibles para trabajo de mesa. Piano eléctrico de 88 teclas contrapesadas, con stand y banqueta regulable. Pizarra blanca de trabajo.',
    ],
  },
  {
    id: 2,
    slug: 'sala2',
    title: 'Sala 2 — 45 m²',
    meta: '45 m² • 10–15 personas • 12 €/h',
    images: [
      'https://artesala.org/wp-content/uploads/2024/09/img20240911193206-1.jpg',
      'https://artesala.org/wp-content/uploads/2024/10/img20241010150822.jpg',
      'https://artesala.org/wp-content/uploads/2024/10/img20241010150846.jpg',
      'https://artesala.org/wp-content/uploads/2024/10/img20241010150930.jpg',
      'https://artesala.org/wp-content/uploads/2024/10/img20241010151002.jpg',
      'https://artesala.org/wp-content/uploads/2024/10/img20241010151128.jpg',
      'https://artesala.org/wp-content/uploads/2024/10/img20241010151202.jpg',
      'https://artesala.org/wp-content/uploads/2024/10/img20241010151400.jpg',
      'https://artesala.org/wp-content/uploads/2024/10/img20241010151418.jpg',
      'https://artesala.org/wp-content/uploads/2024/10/img20241010151506.jpg',
      'https://artesala.org/wp-content/uploads/2024/10/img20241010151559.jpg',
      'https://artesala.org/wp-content/uploads/2024/10/img-20241010-wa0006-1.jpg',
      'https://artesala.org/wp-content/uploads/2024/10/img-20241010-wa0008-1.jpg',
    ],
    atributos: [
      'Reformada en el verano de 2024 para dar más disponibilidad de horarios. Ideal para ensayos de menos personas, pero dotada igualmente de todas las facilidades.',
      'Suelo de teatro/danza con absorción de impactos, acabado en tarima laminada de madera color roble oscuro.',
      'Techo negro y paredes blancas, con cámara de cortina negra, para conseguir el oscuro teatral y grabar o actuar sin distracciones de fondo.',
      'Espejos a lo largo de toda una pared (7 m lineales) ocultables tras la cortina.',
      'Sonido con entrada Bluetooth / minijack.',
      '2 Barras de Ballet disponibles: una simple de 2,5 m y otra doble de 3 m de largo.',
      'Amplios ventanales para trabajar con luz natural. Totalmente obturables.',
      'Puerta insonorizada tipo estudio de sonido (obligatorio mantenerla cerrada durante la actividad).',
      'Renovación de aire mediante ventilación forzada. Ventiladores portátiles de suelo disponibles. Aire acondicionado / calefacción.',
      'Dotación de sillas y mesas para trabajo teórico.',
      'Luz natural, luz de trabajo o luces indirectas para crear un ambiente más íntimo.',
    ],
  },
];

export default function Page() {
  // Expandible por sala (sin tipos TS)
  const [expanded, setExpanded] = useState({});

  const toggle = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-white">
      {/* === Fondo: mismo estilo del hero naranja === */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-600 via-orange-500 to-orange-600" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(255,255,255,0.25),transparent_65%)] mix-blend-soft-light" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-24">
        {/* Cabecera */}
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow sm:text-5xl">
            Nuestras Salas
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-orange-50/95">
            Dos espacios versátiles y equipados en Madrid. Elija sala, revise la
            galería e inicie su reserva por horas.
          </p>
        </header>

        {/* Cards */}
        <div className="grid gap-10 lg:grid-cols-2">
          {SALAS.map(({ id, slug, title, meta, images, atributos }) => {
            const isExpanded = !!expanded[id];
            const itemsToShow =
              atributos?.length ? (isExpanded ? atributos : atributos.slice(0, 4)) : [];

            return (
              <section
                key={id}
                className="overflow-hidden rounded-2xl border border-orange-200/50 bg-white shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md"
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
                  <h2 className="text-xl font-semibold text-zinc-900">{title}</h2>

                  {/* Meta */}
                  {meta && (
                    <div className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 ring-1 ring-orange-200">
                      {meta}
                    </div>
                  )}

                  {/* Atributos (ticks tamaño fijo y consistente) */}
                  {itemsToShow.length > 0 && (
                    <ul
                      id={`detalles-${slug}`}
                      className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                    >
                      {itemsToShow.map((item, idx) => (
                        <li
                          key={idx}
                          className="inline-flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-zinc-800"
                        >
                          {/* Contenedor cuadrado fijo para el tick */}
                          <span
                            aria-hidden
                            className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-orange-300 bg-white"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-orange-600" />
                          </span>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Ver más / Ver menos */}
                  {atributos?.length > 4 && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => toggle(id)}
                        className="inline-flex items-center rounded-xl border border-orange-300 bg-white px-4 py-2 text-sm font-medium text-orange-700 transition hover:bg-orange-50"
                        aria-expanded={isExpanded}
                        aria-controls={`detalles-${slug}`}
                      >
                        {isExpanded ? 'Ver menos' : 'Ver más'}
                      </button>
                    </div>
                  )}

                  {/* CTA */}
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
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
