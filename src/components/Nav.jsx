'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';

const links = [
  { href: '/', label: 'Inicio' },
  { href: '/salas', label: 'Reservar' },
  { href: '/calendarios', label: 'Calendarios' },
  { href: '/actividades', label: 'Actividades' }
];

export default function Nav() {
  const pathname = usePathname();
  const [show, setShow] = useState(true);
  const [lastY, setLastY] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  
  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      setShow(y < lastY || y < 40);
      setLastY(y);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [lastY]);

  return (
    <nav
      className={`
        fixed inset-x-0 top-0 z-50 h-20
        bg-black text-orange-400
        transition-transform duration-300
        ${show ? 'translate-y-0' : '-translate-y-full'}
      `}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-base font-semibold">
          <Image
            src="/artesala_logo2.png"
            alt="ArteSala logo"
            width={110}
            height={0}
            className="shrink-0"
            priority
          />
        </Link>

        {/* Menú de escritorio */}
        <ul className="hidden md:flex gap-6 text-sm">
          {links.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`hover:text-orange-300 transition-colors ${
                  pathname === href ? 'underline decoration-2 underline-offset-4' : ''
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Botón hamburguesa en móvil */}
        <button
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <X size={24} />
          ) : (
            <Menu size={24} />
          )}
        </button>
      </div>

      {/* Dropdown móvil */}
      <div
        className={`
          md:hidden bg-black overflow-hidden transition-[max-height] duration-300
          ${isOpen ? 'max-h-60 py-2' : 'max-h-0'}
        `}
      >
        <ul className="flex flex-col gap-4 px-4 text-sm">
          {links.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`block hover:text-orange-300 transition-colors ${
                  pathname === href ? 'underline decoration-2 underline-offset-4' : ''
                }`}
                onClick={() => setIsOpen(false)}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}