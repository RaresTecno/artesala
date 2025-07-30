'use client';


import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Calendar from '@/components/Calendar';
import Link from 'next/link';

export default function Page() {
    const router = useRouter();

    return (
        <main className="mx-auto w-[100vw] lg:w-[80vw] px-4 py-30 ">
            <div className="mb-8 flex flex-col gap-5">
            <h1 className="m-auto text-5xl underline text-black">Sala 1</h1>
                <Calendar
                    salaId={1}
                />
                <Link
                    href={`/salas`}
                    className="m-auto inline-block rounded bg-[#090606] px-5 py-2 text-sm font-semibold text-white"
                >
                    Reservar
                </Link>
            </div>
            <div className="mb-8 flex flex-col gap-5">
            <h1 className="m-auto text-5xl underline text-black">Sala 2</h1>
                <Calendar
                    salaId={2}
                />
                <Link
                    href={`/salas`}
                    className="m-auto inline-block rounded bg-[#090606] px-5 py-2 text-sm font-semibold text-white"
                >
                    Reservar
                </Link>
            </div>
        </main>
    );
}
