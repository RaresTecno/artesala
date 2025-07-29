// app/salas/page.jsx
'use client';

import Link from 'next/link';
import Gallery from './Gallery';

/**
 * Define los datos fuera del componente para no recrearlos en cada render.
 * Añadimos un `slug` para generar la URL y evitamos guardar rutas absolutas
 * directamente en el objeto.
 */
const SALAS = [
  {
    id: 1,
    slug: 'sala1',
    title: 'Sala 1 — 65 m²',
    images: [
      'https://artesala.org/wp-content/uploads/2024/09/img20240911193009-1.jpg',
      'https://artesala.org/wp-content/uploads/2024/09/img20240911193025-1.jpg',
      'https://artesala.org/wp-content/uploads/2024/09/img20240911193039-1.jpg',
      'https://artesala.org/wp-content/uploads/2024/09/img20240911193056-1.jpg',
      'https://artesala.org/wp-content/uploads/2024/09/img20240911193125.jpg',
      'https://artesala.org/wp-content/uploads/2024/10/img-20241010-wa0006.jpg',
      'https://artesala.org/wp-content/uploads/2024/10/img-20241010-wa0008.jpg',
    ],
    features: [
      'Dimensiones: 10 × 6,5 m sin columnas',
      'Suelo de tarima flotante',
      'Pared de espejos (6 m) con barra de ballet',
      'Equipo de sonido Bluetooth / minijack',
      'Aire acondicionado y calefacción',
      'Aforo recomendado: 20 personas',
    ],
  },
  {
    id: 2,
    slug: 'sala2',
    title: 'Sala 2 — 45 m²',
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
    features: [
      'Dimensiones: 8 × 5,5 m',
      'Suelo vinílico profesional',
      'Pared de espejos (5 m)',
      'Equipo de sonido Bluetooth / minijack',
      'Aforo recomendado: 12 personas',
    ],
  },
];

export default function Page() {
  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-24 text-orange-200">
      <h1 className="mb-12 text-center text-6xl font-bold text-black underline">
        Nuestras Salas
      </h1>

      <div className="grid gap-12 lg:grid-cols-2">
        {SALAS.map(({ id, slug, title, images, features }) => (
          <section
            key={id}
            className="overflow-hidden rounded-lg border border-orange-200/40 bg-black/70 shadow-xl shadow-orange-500/10 backdrop-blur-sm"
          >
            {/* Carrusel de imágenes */}
            <Gallery imgs={images} />

            <div className="space-y-4 p-6">
              <h2 className="text-2xl font-semibold text-orange-400">{title}</h2>

              <ul className="grid gap-1 text-sm leading-relaxed">
                {features.map((feat, idx) => (
                  <li key={idx}>{feat}</li>
                ))}
              </ul>

              {/* Enlace con slug para evitar la sustitución por id numérico */}
              <Link
                href={`/reservas/${slug}`}
                className="inline-block rounded bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-400"
              >
                Reservar Sala {id}
              </Link>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
