'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// Componente reutilizable de galería con auto-rotación
function Gallery({ imgs }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent(prev => (prev + 1) % imgs.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [imgs.length]);

  return (
    <div className="space-y-2">
      <div className="relative h-56 w-full sm:h-72">
        <Image
          src={imgs[current]}
          alt={`Sala imagen ${current + 1}`}
          fill
          sizes="(min-width: 640px) 600px, 100vw"
          className="object-cover object-center"
          unoptimized
        />
      </div>
      <div className="flex justify-center gap-2">
        {imgs.map((src, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`relative h-16 w-24 overflow-hidden rounded transition focus:outline-none ${
              idx === current ? 'ring-2 ring-orange-500' : 'opacity-70 hover:opacity-100'
            }`}
          >
            <Image
              src={src}
              alt={`Vista previa ${idx + 1}`}
              fill
              sizes="96px"
              className="object-cover"
              unoptimized
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  const salas = [
    {
      id: 1,
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
      link: '/reservas/1',
    },
    {
      id: 2,
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
      link: '/reservas/2',
    },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-24 text-orange-200">
      <h1 className="mb-12 text-center text-4xl font-bold text-black">Nuestras Salas</h1>
      <div className="grid gap-12 lg:grid-cols-2">
        {salas.map(({ id, title, images, features, link }) => (
          <section
            key={id}
            className="overflow-hidden rounded-lg border border-orange-200/40 bg-black/70 shadow-xl shadow-orange-500/10 backdrop-blur-sm"
          >
            <Gallery imgs={images} />
            <div className="space-y-4 p-6">
              <h2 className="text-2xl font-semibold text-orange-400">{title}</h2>
              <ul className="grid gap-1 text-sm leading-relaxed">
                {features.map((feat, idx) => (
                  <li key={idx}>{feat}</li>
                ))}
              </ul>
              <Link href={link} className="inline-block rounded bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-400">
                Reservar Sala {id}
              </Link>
            </div>
          </section>
        ))}
      </div>
      <p className="mt-16 text-center text-sm">
        ¿Dudas? Escríbenos a&nbsp;
        <a href="mailto:artesalainfo@gmail.com" className="underline hover:text-orange-400">
          artesalainfo@gmail.com
        </a>
        &nbsp;o por WhatsApp.
      </p>
    </main>
  );
}
