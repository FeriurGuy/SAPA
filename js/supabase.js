// Import library Supabase via CDN (karena kita gak pake npm install)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
        
const SUPABASE_URL = 'https://urrpvfcqnkosawceesui.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVycnB2ZmNxbmtvc2F3Y2Vlc3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxOTQyMjgsImV4cCI6MjA4Mjc3MDIyOH0.QVUJqeaoJJY3VU7dtm515kerVF6zBm0k9jJeW2zClqo';

// Inisialisasi Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Cek koneksi di Console (opsional, buat debug aja)
console.log("Supabase Client Ready!");