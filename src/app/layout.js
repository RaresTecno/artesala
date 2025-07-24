import { Metadata } from "next";
import "./globals.css";

import Nav from '@/components/Nav';

export const metadata = {
  title: "Artesala",
  description: "Reserva ya tu sala",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="h-full">
         <body cz-shortcut-listen="true" className="h-full flex flex-col" >
           <Nav />
           <main className="flex-1">{children}</main>
         </body>
       </html>
  );
}
