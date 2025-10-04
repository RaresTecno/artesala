import Link from 'next/link';
import Image from 'next/image'; // Mejora: usa next/image para optimización de imágenes y lazy-loading
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

// Extraer datos de navegación y políticas evita recrear arrays en cada render
const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/salas', label: 'Reservar' },
  { href: '/calendarios', label: 'Calendarios' },
  { href: '/actividades', label: 'Actividades' },
];
const POLICY_LINKS = [
  { href: '/politica-privacidad', label: 'Política de Privacidad' },
  { href: '/terminos-condiciones', label: 'Términos y Condiciones' },
  { href: '/cookies', label: 'Política de Cookies' },
];
const SOCIAL_LINKS = [
  { icon: Facebook, url: 'https://www.facebook.com/EspacioDeEnsayo', label: 'Facebook' },
  { icon: Instagram, url: 'https://www.instagram.com/artesalamulti/', label: 'Instagram' },
  // { icon: Twitter, url: 'https://twitter.com/ArteSala', label: 'Twitter' },
  // { icon: Youtube, url: 'https://youtube.com/ArteSala', label: 'YouTube' },
];

export default function Footer() {
  return (
    <footer className="bg-zinc-900 text-gray-200">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Logo & Descripción */}
        <div>
          <Link href="/" className="flex items-center space-x-2" prefetch={false}>
            {/* Actualiza el logo a artesala_logo2.png */}
            <Image src="/artesala_logo2.png" alt="ArteSala Logo" width={110} height={64} />
            {/* <span className="text-2xl font-bold">ArteSala</span> */}
          </Link>
          <p className="mt-4 text-sm leading-relaxed">
            Espacios flexibles para tus artes escénicas en Madrid. Reserva tu sala y crea sin límites.
          </p>
        </div>
        {/* Navegación */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Navegación</h4>
          <ul className="space-y-2 text-sm">
            {NAV_LINKS.map(({ href, label }) => (
              <li key={label}>
                <Link href={href} className="hover:text-white transition-colors" prefetch={false}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {/* Políticas */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Políticas</h4>
          <ul className="space-y-2 text-sm">
            {POLICY_LINKS.map(({ href, label }) => (
              <li key={label}>
                <Link href={href} className="hover:text-white transition-colors" prefetch={false}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {/* Contacto & Redes Sociales */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Contáctanos</h4>
          <Link href="/contacto" className="hover:text-white transition-colors underline" prefetch={false}>
            Ir a contacto
          </Link>
          <p className="text-sm leading-relaxed">
            C/ Abejuela, 7<br />
            28047 Madrid<br />
            <a href="mailto:artesalainfo@gmail.com" className="hover:text-white transition-colors">
              artesalainfo@gmail.com
            </a>
            <br />
            <a href="tel:+34690822002" className="hover:text-white transition-colors">
              +34 690 822 002
            </a>
          </p>
          <div className="mt-4 flex space-x-3">
            {SOCIAL_LINKS.map(({ icon: Icon, url, label }) => (
              <a
                key={label}
                href={url}
                aria-label={label}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 rounded-full hover:bg-purple-600 transition-colors"
              >
                <Icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-4 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} ArteSala. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
