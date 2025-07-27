import { createClient } from '@supabase/supabase-js';

// Captura la URL y la clave pública (anon key) desde variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Verifica que existan las variables necesarias
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Crea y exporta la instancia de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);