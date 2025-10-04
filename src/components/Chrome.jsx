// components/Chrome.jsx  (CLIENT)
"use client";

import { usePathname } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function Chrome({ children }) {
  const pathname = usePathname();

  // Oculta Nav/Footer en todo /admin...
  const hideChrome = pathname?.startsWith("/admin");
  // ...o si quieres SOLO en /admin/panel, usa:
  // const hideChrome = pathname === "/admin/panel";

  return (
    <>
      {!hideChrome && <Nav />}
      <main className="flex-1">{children}</main>
      {!hideChrome && <Footer />}
    </>
  );
}
