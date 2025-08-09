'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';

const links = [
  { href: '/', label: 'Inicio' },
  { href: '/salas', label: 'Reservar' },      // CTA destacado
  { href: '/calendarios', label: 'Calendarios' },
  { href: '/actividades', label: 'Actividades' },
];

export default function Nav() {
  const pathname = usePathname();
  const [show, setShow] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const lastYRef = useRef(0);

  // Ocultar/mostrar según scroll y aplicar sombra si hay desplazamiento
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      setScrolled(y > 4);
      const goingUp = y < lastYRef.current;
      setShow(goingUp || y < 40);
      lastYRef.current = y;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Cerrar menú en cambio de ruta
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Cerrar menú con ESC + bloquear scroll del body cuando está abierto
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setIsOpen(false);
    window.addEventListener('keydown', onKey);
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const isActive = (href) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav
      className={[
        'fixed inset-x-0 top-0 z-50',
        'transition-transform duration-300',
        show ? 'translate-y-0' : '-translate-y-full',
      ].join(' ')}
      aria-label="Barra de navegación"
    >
      <div
        className={[
          'mx-auto max-w-6xl px-4',
          'h-16 sm:h-20',
          // Fondo con blur y bordes naranja; sombra al hacer scroll
          'backdrop-blur supports-[backdrop-filter]:bg-black/70 bg-black/90',
          'border-b border-orange-500/20',
          scrolled ? 'shadow-md' : 'shadow-none',
          'rounded-b-2xl',
        ].join(' ')}
      >
        <div className="flex h-full items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-base font-semibold text-orange-400"
          >
            <Image
              src="/artesala_logo2.png"
              alt="ArteSala logo"
              width={110}
              height={40}
              className="shrink-0"
              priority
            />
          </Link>

          {/* Menú escritorio */}
          <ul className="hidden items-center gap-2 md:flex">
            {links.map(({ href, label }) => {
              const active = isActive(href);
              const isCTA = href === '/salas';
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={[
                      'inline-flex items-center rounded-full px-4 py-2 text-sm transition-colors',
                      active
                        ? 'bg-orange-500/15 text-orange-100 ring-1 ring-inset ring-orange-500/30'
                        : 'text-orange-300 hover:text-orange-200',
                      isCTA
                        ? 'ml-2 bg-orange-600 text-white hover:bg-orange-700 ring-0'
                        : '',
                    ].join(' ')}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Botón hamburguesa móvil */}
          <button
            type="button"
            className="inline-flex items-center rounded-md p-2 text-orange-200 hover:bg-white/5 md:hidden"
            onClick={() => setIsOpen((v) => !v)}
            aria-label="Abrir menú"
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Dropdown móvil */}
      <div
        id="mobile-menu"
        className={[
          'md:hidden overflow-hidden bg-black/95 backdrop-blur',
          'transition-[max-height,opacity] duration-300',
          isOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0',
          'border-b border-orange-500/20',
        ].join(' ')}
      >
        <ul className="flex flex-col gap-2 px-4 py-3">
          {links.map(({ href, label }) => {
            const active = isActive(href);
            const isCTA = href === '/salas';
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setIsOpen(false)}
                  className={[
                    'block rounded-xl px-4 py-3 text-sm transition-colors',
                    active
                      ? 'bg-orange-600 text-white'
                      : 'text-orange-300 hover:bg-white/5 hover:text-orange-200',
                    isCTA ? 'bg-orange-600 text-white hover:bg-orange-700' : '',
                  ].join(' ')}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
