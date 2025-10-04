// app/layout.jsx  (SERVER)
import "./globals.css";
import { Metadata } from "next";
import Chrome from "@/components/Chrome"; // (cliente) con la lógica de ocultar

// app/layout.jsx (o layout.tsx)
export const metadata = {
  title: "Artesala",
  description: "Reserva ya tu sala",
  icons: {
    icon: [
      { url: "/artesala_logo.png", type: "image/png", sizes: "any" },
    ],
    apple: [
      { url: "/artesala_logo.png" }, // opcional para iOS
    ],
  },
};


export default function RootLayout({ children }) {
  return (
    <html lang="es" className="h-full">
      <body cz-shortcut-listen="true" className="h-full flex flex-col">
        <Chrome>{children}</Chrome>
      </body>
    </html>
  );
}
