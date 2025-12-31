import { supabase } from './supabase.js';

// --- ELEMENTS ---
const pAvatar = document.getElementById('pAvatar');
const pName = document.getElementById('pName');
const pBio = document.getElementById('pBio');
const pLinks = document.getElementById('pLinks');
const themeBody = document.getElementById('themeBody');

// --- MAIN LOGIC ---
async function renderProfile() {
    // 1. Ambil username dari URL (?u=feri)
    const params = new URLSearchParams(window.location.search);
    const username = params.get('u');

    if (!username) {
        document.body.innerHTML = '<h1 style="text-align:center; margin-top:50px;">User tidak ditemukan 😢</h1>';
        return;
    }

    try {
        // 2. Cari User ID berdasarkan Username
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', username)
            .single();

        if (profileError || !profile) throw new Error('User not found');

        // 3. Render Data Profil
        document.title = `${profile.full_name} | SAPA`;
        pName.textContent = profile.full_name || `@${profile.username}`;
        pBio.textContent = profile.bio || '';
        
        // Set Warna Background
        if (profile.bg_color) {
            themeBody.style.backgroundColor = profile.bg_color;
            themeBody.style.color = getContrastColor(profile.bg_color); // Hitung warna teks (Putih/Hitam) biar kontras
        }

        // Set Avatar
        if (profile.avatar_url) {
            pAvatar.src = profile.avatar_url;
        } else {
            pAvatar.src = 'https://ui-avatars.com/api/?name=' + profile.username; // Fallback avatar huruf
        }

        // 4. Ambil Link User tersebut
        const { data: links, error: linkError } = await supabase
            .from('links')
            .select('*')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: true }); // Nanti ganti 'position'

        // 5. Render Links
        pLinks.innerHTML = '';
        if (links) {
            links.forEach(link => {
                const a = document.createElement('a');
                a.href = link.url;
                a.target = '_blank';
                a.className = 'link-card';
                
                // --- LOGIKA ICON PINTAR ---
                let iconClass = 'fa-solid fa-link'; // Icon default (rantai)
                const urlLower = link.url.toLowerCase();

                if (urlLower.includes('instagram.com')) iconClass = 'fa-brands fa-instagram';
                else if (urlLower.includes('tiktok.com')) iconClass = 'fa-brands fa-tiktok';
                else if (urlLower.includes('linkedin.com')) iconClass = 'fa-brands fa-linkedin';
                else if (urlLower.includes('github.com')) iconClass = 'fa-brands fa-github';
                else if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) iconClass = 'fa-brands fa-x-twitter';
                else if (urlLower.includes('youtube.com')) iconClass = 'fa-brands fa-youtube';
                else if (urlLower.includes('wa.me') || urlLower.includes('whatsapp.com')) iconClass = 'fa-brands fa-whatsapp';
                // ---------------------------

                a.innerHTML = `<i class="${iconClass}" style="margin-right:10px; font-size: 1.1em;"></i> ${sanitize(link.title)}`;
                pLinks.appendChild(a);
            });
        }

    } catch (error) {
        console.error(error);
        document.body.innerHTML = '<h1 style="text-align:center; margin-top:50px;">Halaman tidak ditemukan. Coba cek URL lagi.</h1>';
    }
}

// Utility: Tentukan warna teks (Hitam/Putih) berdasarkan warna background
function getContrastColor(hexColor) {
    // Ubah hex ke RGB
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    
    // Hitung luminance
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    
    // Kalau gelap balik putih, kalau terang balik hitam
    return (yiq >= 128) ? '#0f172a' : '#ffffff';
}

function sanitize(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

renderProfile();