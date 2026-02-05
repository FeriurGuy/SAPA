// Import Client Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Import Kunci dari config.js
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

// Cek di Console apakah kunci terbaca (Bisa dihapus nanti)
if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Gawat! Kunci Supabase tidak ditemukan di config.js");
}

// Buat Koneksi
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);