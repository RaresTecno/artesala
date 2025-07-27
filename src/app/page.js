"use client";

import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { CalendarCheck2, CreditCard, Star } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const testimonials = [
  {
    name: "Teresa Ruiz Velasco",
    location: "Madrid",
    avatar: "/usuario.webp", // sustituir por foto real o placeholder
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
];

async function fetchSalas() {
  const { data, error } = await supabase
    .from('salas')
    .select('*')    // id, coste_hora
  if (error) {
    console.error('Error al cargar salas:', error)
    return []
  }
  return data
}

fetchSalas()
  .then(salas => {
    console.log('Salas disponibles:', salas)
    // Ejemplo de salida:
    // [ { id: 1, coste_hora: '20.00' }, { id: 2, coste_hora: '25.00' } ]
  })
  .catch(err => {
    console.error('Falló la consulta:', err)
  })

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className=" relative isolate flex items-center justify-center
    overflow-hidden bg-black/90 text-orange-400
    min-h-[60vh] md:min-h-[70vh]
    pt-24 sm:pt-32
  ">
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
          <h1 className="mb-4 font-heading text-4xl font-bold sm:text-5xl md:text-9xl">
            ArteSala
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-lg sm:text-xl text-orange-200">
            ArteSala, dos salas equipadas y económicas en Madrid para ensayar, enseñar y crear.
          </p>
          <Link
            href="/salas"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#f17f2d] px-7 py-4 font-semibold text-white shadow-lg transition hover:bg-[#f17f2d]/90 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-[#f17f2d] mb-4 md:mb-0"
          >
            Reservar ahora
          </Link>
        </div>
      </section>

      <section className="relative isolate flex items-center justify-center
    overflow-hidden">
        <div className="max-w-6xl px-6 py-10">
          <h2 className="mb-4 font-heading text-4xl font-bold sm:text-5xl md:text-6xl">
            Nuestro servicio
          </h2>
          <p className="text-2xl">
            ¿Buscas un espacio para ensayar, dar clases, grabar vídeos o montar tu evento? Todas nuestras salas cuentan con aire acondicionado, espejos, suelo de tarima y están totalmente equipadas. Están en el centro de Madrid y puedes reservarlas por horas con total flexibilidad. Buen ambiente, comodidad y todo lo que necesitas para bailar o crear a tu ritmo.
          </p>
        </div>
      </section>

      {/* PASOS – ahora en dos pasos */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="mb-6 font-heading text-4xl font-bold sm:text-5xl md:text-3xl">
          ¿Cómo funciona?
        </h2>
        <ol className="grid gap-8 sm:grid-cols-2 ">
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
        <div className="w-[100%] flex aling-items justify-center mt-5">
          <Link
            href="/salas"
            className="inline-flex items-center gap-2 rounded-2xl bg-[black] px-7 py-4 font-semibold text-white shadow-lg transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-[#f17f2d] mb-4 md:mb-0"
          >
            Reserva ahora tu sala
          </Link>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="bg-zinc-900 py-20 text-orange-100">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-12 text-center text-3xl font-semibold text-[#f17f2d]">
            Lo que dicen nuestros clientes
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map(({ name, location, avatar, quote }) => (
              <figure
                key={name}
                className="flex flex-col gap-4 rounded-2xl border border-orange-200/30 bg-zinc-800 p-8 shadow transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <Image
                    src={avatar}
                    alt={`Foto de ${name}`}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-[#f17f2d]">{name}</p>
                    <p className="text-xs text-neutral-400">{location}</p>
                  </div>
                </div>
                <blockquote className="text-sm leading-relaxed text-neutral-200">
                  “{quote}”
                </blockquote>
                <div className="flex" aria-label="5 estrellas">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
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

