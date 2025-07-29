import { createClient } from '@supabase/supabase-js';

// Captura la URL y la clave pública (anon key) desde variables de entorno
const supabaseUrl = "https://lrrpcznutedkorbkvfre.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxycnBjem51dGVka29yYmt2ZnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzQzMzUsImV4cCI6MjA2OTAxMDMzNX0.cndyXsMOuIOfKOJQ5BDY1W_9UmJKROLouAeKXd_YCOc";

// Verifica que existan las variables necesarias
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Crea y exporta la instancia de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);