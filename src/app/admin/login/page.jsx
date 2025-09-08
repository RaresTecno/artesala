'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, LogIn } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const signedEmail = data?.user?.email || data?.session?.user?.email;
      if (!signedEmail || signedEmail.toLowerCase() !== String(ADMIN_EMAIL || '').toLowerCase()) {
        await supabase.auth.signOut();
        throw new Error('No autorizado. Este usuario no es administrador.');
      }
      router.replace('/admin/panel');
    } catch (e2) {
      setErr(e2.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen grid place-items-center bg-gradient-to-b from-orange-600 via-orange-500 to-orange-600 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl bg-white/95 p-6 shadow-lg">
        <h1 className="mb-1 text-xl font-semibold">Panel ArteSala · Acceso</h1>
        <p className="mb-6 text-sm text-zinc-600">
          Introduce tus credenciales de administrador.
        </p>

        {err && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {err}
          </div>
        )}

        <label className="block text-sm font-medium">Correo</label>
        <input
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="mt-4 block text-sm font-medium">Contraseña</label>
        <input
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          Entrar
        </button>
      </form>
    </main>
  );
}
