/* Home page for ArteSala – improved minimal style */

import Link from 'next/link';
// import Image from 'next/image';

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative isolate flex min-h-[60vh] items-center justify-center overflow-hidden bg-black/90 text-orange-400">
        {/* Background image – replace with real photo */}
        {/* <Image
          src="/artesala_logo2.png"
          alt="ArteSala – espacio de ensayo"
          width={200}
          height={200}
          priority
          className="absolute w-1/2 -z-10 h-full object-cover opacity-50"
        /> */}
        <div className="max-w-3xl text-center px-6">
          <h1 className="mb-4 font-heading text-4xl font-bold sm:text-5xl md:text-6xl">
            Espacios flexibles para tus artes escénicas
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-lg sm:text-xl text-orange-200">
            Bienvenido a ArteSala, dos salas equipadas y económicas en Madrid para ensayar, enseñar y crear.
          </p>
          <Link
            href="/reservar"
            className="inline-block rounded bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-400"
          >
            Reservar ahora
          </Link>
        </div>
      </section>

      {/* PASOS – ahora en dos pasos */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-10 text-center text-2xl font-semibold text-black-500">
          ¿Cómo funciona?
        </h2>
        <ol className="grid gap-8 sm:grid-cols-2">
          {[
            {
              num: '1',
              title: 'Reserva online',
              text: 'Elige sala, fecha y hora directamente en el calendario.'
            },
            {
              num: '2',
              title: 'Paga y listo',
              text: '¡Paga online y seguro y tu reserva queda confirmada!'
            }
          ].map(({ num, title, text }) => (
            <li key={num} className="relative rounded border border-orange-200 p-6">
              <span className="absolute -top-4 left-6 flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 font-bold text-white">
                {num}
              </span>
              <h3 className="mb-2 text-lg font-semibold text-black-400">{title}</h3>
              <p className="text-sm text-grey-200/90">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* TESTIMONIOS */}
      <section className="bg-zinc-900 py-16 text-orange-200">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-10 text-center text-2xl font-semibold text-orange-500">
            Lo que dicen nuestros clientes
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: 'Teresa Ruiz Velasco',
                quote:
                  'Un espacio muy recomendable para ensayos: económico, limpio y con un trato impecable.'
              },
              {
                name: 'Fábrica de Ninjas',
                quote:
                  'Muy acogedor, tranquilo para trabajar y el dueño es muy atento. ¡Muy recomendable!'
              },
              {
                name: 'Marta Paúl',
                quote:
                  'Un espacio muy bien equipado. Julio pone todas las facilidades para que sea cómodo.'
              },
              {
                name: 'Annika Pannito',
                quote:
                  'Ideal para clases de danza. Sala amplia y dueño siempre disponible. Lo recomiendo.'
              },
              {
                name: 'Miss Teen España',
                quote:
                  'Excelente espacio para ensayar distintos eventos y con muchas comodidades.'
              },
              {
                name: 'Naima Sahko',
                quote:
                  'Espacio amplio, impecable, buenas instalaciones y muy buen trato.'
              }
            ].map(({ name, quote }) => (
              <figure
                key={name}
                className="rounded border border-orange-200 p-6 shadow-lg transition hover:scale-[1.02] hover:shadow-orange-500/20"
              >
                <blockquote className="mb-4 text-sm italic leading-relaxed">
                  “{quote}”
                </blockquote>
                <figcaption className="text-right text-xs uppercase tracking-wide text-orange-400">
                  — {name}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACTO / UBICACIÓN */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-4 text-center text-2xl font-semibold text-black-500">¿Dónde estamos?</h2>
        <p className="mb-6 text-center text-grey-200">C/ Abejuela, 7 · 28047 Madrid · Metros: Carpetana / Carabanchel</p>
        <div className="relative h-72 overflow-hidden rounded shadow-md">
          <iframe
            title="ArteSala ubicación"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1519.4127083559686!2d-3.7465625552751867!3d40.390561782248604!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd4189db67b86a53%3A0x32f396bf5aa3a8c6!2sARTESALA%20-%20Alquiler%20Espacio%20Multiusos!5e0!3m2!1ses!2ses!4v1750352489858!5m2!1ses!2ses&basemap=satellite"
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
            allowFullScreen
          />
        </div>
      </section>
    </>
  );
}

