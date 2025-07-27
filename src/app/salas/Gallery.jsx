// app/salas/Gallery.jsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';



export default function Gallery({ imgs }) {
  const [current, setCurrent]     = useState(0);
  const [thumbStart, setThumbStart] = useState(0);
  const maxVisible = 4;

  // Auto-rotación imagen principal
  useEffect(() => {
    const mainInt = setInterval(
      () => setCurrent(c => (c + 1) % imgs.length),
      4000
    );
    return () => clearInterval(mainInt);
  }, [imgs.length]);

  // Auto-rotación miniaturas
  useEffect(() => {
    const thumbInt = setInterval(
      () => setThumbStart(s => (s + 1) % imgs.length),
      4000
    );
    return () => clearInterval(thumbInt);
  }, [imgs.length]);

  // Índices de miniaturas a mostrar
  const thumbnails = Array.from(
    { length: Math.min(maxVisible, imgs.length) },
    (_, i) => (thumbStart + i) % imgs.length
  );

  return (
    <div className="space-y-2 ">
      {/* Imagen principal */}
      <div className="relative h-56 w-full sm:h-72 overflow-hidden rounded-lg">
        <Image
          src={imgs[current]}
          alt={`Imagen ${current + 1}`}
          fill
          sizes="(min-width: 640px) 600px, 100vw"
          className="object-cover object-center"
          unoptimized
        />
      </div>

      {/* Miniaturas: con márgenes laterales y animación */}
      <div
        key={thumbStart /* fuerza remount para disparar la animación */}
        className="flex justify-center gap-3 px-6 sm:px-10 py-2 fade-enter"
      >
        {thumbnails.map(idx => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`
              relative flex-shrink-0 w-1/4 aspect-[3/2] overflow-hidden rounded-md
              transition-transform duration-300 ease-in-out transform hover:scale-105
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
              ${idx === current
                ? 'ring-4 ring-orange-400 ring-offset-2'
                : 'opacity-80'}
            `}
          >
            <Image
              src={imgs[idx]}
              alt={`Miniatura ${idx + 1}`}
              fill
              sizes="(min-width: 640px) 96px, 20vw"
              className="object-cover"
              unoptimized
            />
          </button>
        ))}
      </div>
    </div>
  );
}
