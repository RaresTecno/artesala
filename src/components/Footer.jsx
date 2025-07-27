import Link from 'next/link';
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Empresa Info */}
        <div>
          <h3 className="text-xl font-semibold mb-2">ArteSala</h3>
          <p className="text-sm">Tu espacio de danza y cultura en Madrid</p>
          <p className="text-sm mt-2">Calle Falsa 123, Madrid</p>
          <p className="text-sm">info@artesala.com | +34 600 000 000</p>
        </div>
        {/* Políticas */}
        <div>
          <h3 className="text-xl font-semibold mb-2">Políticas</h3>
          <ul className="space-y-1 text-sm">
            <li>
              <Link href="/politica-privacidad" className="hover:underline">
                Política de Privacidad
              </Link>
            </li>
            <li>
              <Link href="/terminos-condiciones" className="hover:underline">
                Términos y Condiciones
              </Link>
            </li>
            <li>
              <Link href="/cookies" className="hover:underline">
                Política de Cookies
              </Link>
            </li>
          </ul>
        </div>
        {/* Redes Sociales */}
        <div>
          <h3 className="text-xl font-semibold mb-2">Síguenos</h3>
          <div className="flex space-x-4">
            <a
              href="https://facebook.com/ArteSala"
              aria-label="Facebook"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Facebook size={24} />
            </a>
            <a
              href="https://instagram.com/ArteSala"
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Instagram size={24} />
            </a>
            <a
              href="https://twitter.com/ArteSala"
              aria-label="Twitter"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Twitter size={24} />
            </a>
            <a
              href="https://youtube.com/ArteSala"
              aria-label="YouTube"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Youtube size={24} />
            </a>
          </div>
        </div>
      </div>
      <div className="mt-8 text-center text-sm border-t border-gray-700 pt-4">
        © {new Date().getFullYear()} ArteSala. Todos los derechos reservados.
      </div>
    </footer>
  );
}
