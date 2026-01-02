import { supabase } from './supabase.js';

// --- ELEMENTS ---
const pAvatar = document.getElementById('pAvatar');
const pName = document.getElementById('pName');
const pBio = document.getElementById('pBio');
const pLinks = document.getElementById('pLinks');

// --- HELPER: SANITIZE INPUT ---
function sanitize(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

// --- HELPER: CONTRAST COLOR ---
function getContrastColor(hexColor) {
    if (hexColor.length < 7) return '#000000';
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#0f172a' : '#ffffff';
}

// --- FUNGSI TAMPILAN 404 (ERROR PAGE) ---
function show404() {
    document.body.className = '';
    document.body.style.backgroundColor = '#f8fafc';
    document.body.style.color = '#0f172a';
    document.body.style.display = 'flex';
    document.body.style.flexDirection = 'column';
    document.body.style.justifyContent = 'center';

    document.body.innerHTML = `
        <div style="text-align: center; padding: 20px; font-family: 'Outfit', sans-serif;">
            <div style="font-size: 5rem; margin-bottom: 20px; animation: float 3s infinite ease-in-out;">🤔</div>
            <h2 style="font-size: 2rem; margin-bottom: 10px; color: #1e293b;">Waduh, Siapa Tuh?</h2>
            <p style="color: #64748b; margin-bottom: 30px; font-family: 'Inter', sans-serif; font-size: 1.1rem; line-height: 1.6;">
                User yang kamu cari nggak ditemukan.<br>Mungkin salah ketik atau orangnya lagi ngumpet.
            </p>
            <a href="index.html" style="
                display: inline-block; background: #4f46e5; color: white; padding: 14px 28px;
                border-radius: 50px; text-decoration: none; font-weight: 600; font-family: 'Inter', sans-serif;
                box-shadow: 0 10px 20px -5px rgba(79, 70, 229, 0.4); transition: transform 0.2s;
            " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                🚀 Bikin Halaman Kayak Gini
            </a>
            <style>@keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-15px); } 100% { transform: translateY(0px); } }</style>
        </div>
    `;
}

// --- FUNGSI RENDER MUSIK (DIPISAH BIAR AMAN) ---
function renderMusicPlayer(url) {
    try {
        if (!url) return;

        // 1. YOUTUBE
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            let videoId = '';
            if (url.includes('youtu.be')) videoId = url.split('/').pop();
            else videoId = new URLSearchParams(new URL(url).search).get('v');
            
            if (videoId) {
                const playerDiv = document.createElement('div');
                playerDiv.style.cssText = 'position: fixed; bottom: 20px; left: 20px; z-index: 100; width: 80px; height: 80px; border-radius: 50%; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 3px solid white; animation: spin 10s linear infinite; cursor: pointer;';
                playerDiv.innerHTML = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&loop=1&playlist=${videoId}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="pointer-events: none; transform: scale(2);"></iframe>`;
                document.body.appendChild(playerDiv);
                
                // Tambah style keyframe
                if (!document.getElementById('animSpin')) {
                    const style = document.createElement('style');
                    style.id = 'animSpin';
                    style.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
                    document.head.appendChild(style);
                }
            }
        } 
        // 2. SPOTIFY (Logic Baru yang Lebih Aman)
        else if (url.includes('spotify.com')) {
            // Contoh URL: https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKZFC?si=...
            // Kita butuh ID: 4uLU6hMCjMI75M1A2tKZFC
            
            const parts = url.split('/track/');
            if (parts.length > 1) {
                const trackId = parts[1].split('?')[0]; // Hapus query params (?si=...)
                const embedUrl = `https://open.spotify.com/embed/track/${trackId}?utm_source=generator`;

                const spotifyDiv = document.createElement('div');
                spotifyDiv.style.cssText = 'position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 100; width: 90%; max-width: 400px; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 20px rgba(0,0,0,0.2);';
                
                spotifyDiv.innerHTML = `<iframe style="border-radius:12px" src="${embedUrl}" width="100%" height="80" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
                
                document.body.appendChild(spotifyDiv);
                document.body.style.paddingBottom = '120px'; // Geser padding biar gak ketutup
            }
        }
    } catch (err) {
        console.error("Gagal load musik:", err);
        // Musik gagal? Gak masalah, yang penting Profil tetap jalan!
    }
}

// --- MAIN LOGIC ---
async function renderProfile() {
    const params = new URLSearchParams(window.location.search);
    const username = params.get('u');

    if (!username) { show404(); return; }

    try {
        const { data: profile, error: profileError } = await supabase
            .from('profiles').select('*').eq('username', username).single();

        if (profileError || !profile) { show404(); return; }

        // --- RENDER DATA PROFILE ---
        pAvatar.classList.remove('skeleton');
        pName.classList.remove('skeleton');
        pBio.classList.remove('skeleton');
        pName.style.width = 'auto';
        pBio.style.width = 'auto';
        document.title = `${profile.full_name} | SAPA`;
        
        // Nama & Verified
        pName.innerHTML = sanitize(profile.full_name || `@${profile.username}`);
        if (profile.is_pro) {
            const badge = document.createElement('i');
            badge.className = 'fa-solid fa-circle-check';
            badge.style.cssText = `color: #3b82f6; margin-left: 8px; font-size: 0.8em; vertical-align: middle; filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3));`;
            pName.appendChild(badge);
        }
        pBio.textContent = profile.bio || '';

        // --- SETUP TEMA ---
        let customCardBg = null;
        let customCardBorder = null;
        let textColor = '#0f172a';

        document.body.className = ''; 
        document.body.style = ''; // Reset style body

        // Background Logic
        if (profile.bg_image_url) {
            document.body.style.backgroundImage = `url('${profile.bg_image_url}')`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundAttachment = 'fixed';
            textColor = '#ffffff';
            document.body.style.color = textColor;
            customCardBg = 'rgba(0, 0, 0, 0.6)'; // Gelapin dikit lagi biar teks kebaca
            customCardBorder = '1px solid rgba(255, 255, 255, 0.3)';
        } else if (profile.bg_color) {
            const color = profile.bg_color.toLowerCase();
            if (color === '#0f172a') document.body.classList.add('theme-dark');
            else if (['#f43f5e', '#fff1f2', '#fecdd3'].includes(color)) document.body.classList.add('theme-pastel');
            else if (color === '#10b981') document.body.classList.add('theme-cyber');
            else {
                document.body.style.backgroundColor = profile.bg_color;
                textColor = getContrastColor(profile.bg_color);
                document.body.style.color = textColor;
                if (textColor === '#ffffff') {
                    customCardBg = 'rgba(0, 0, 0, 0.4)';
                    customCardBorder = '1px solid rgba(255, 255, 255, 0.2)';
                } else {
                    customCardBg = 'rgba(255, 255, 255, 0.8)';
                    customCardBorder = '1px solid rgba(255, 255, 255, 0.5)';
                }
            }
        }
        
        // Avatar
        pAvatar.src = profile.avatar_url || 'https://ui-avatars.com/api/?name=' + profile.username;

        // --- RENDER LINKS (INTI MASALAH KITA) ---
        const { data: links } = await supabase
            .from('links').select('*').eq('user_id', profile.id)
            .order('position', { ascending: true }).order('created_at', { ascending: true });

        pLinks.innerHTML = '';
        if (links) {
            links.forEach((link, index) => {
                const a = document.createElement('a');
                a.href = link.url;
                a.target = '_blank'; // Default Tab Baru
                a.className = 'link-card animate-enter';
                a.style.animationDelay = `${index * 0.1}s`; 

                if (customCardBg) {
                    a.style.background = customCardBg;
                    a.style.border = customCardBorder;
                    a.style.color = textColor;
                }

                // --- EVENT LISTENER KLIK (SAFE MODE) ---
                a.addEventListener('click', (e) => {
                    // 1. Analytics (Fire & Forget)
                    // Kita pakai .then/.catch biar gak crash script kalau Supabase error (misal diblokir)
                    supabase.rpc('increment_clicks', { link_id: link.id })
                        .then(() => console.log('Click recorded'))
                        .catch(err => console.warn('Analytics skipped:', err));

                    // 2. Navigasi
                    if (a.target === '_blank') {
                        // Kalau Tab Baru: Biarin browser kerja (Return)
                        // INI YANG BIKIN LAPTOP JALAN LANCAR
                        return; 
                    } else {
                        // Kalau Tab Sama (Optional): Baru pake delay
                        e.preventDefault();
                        setTimeout(() => window.location.href = link.url, 300);
                    }
                });

                // Icon Logic
                let iconClass = 'fa-solid fa-link';
                const urlLower = link.url.toLowerCase();
                if (urlLower.includes('instagram')) iconClass = 'fa-brands fa-instagram';
                else if (urlLower.includes('tiktok')) iconClass = 'fa-brands fa-tiktok';
                else if (urlLower.includes('linkedin')) iconClass = 'fa-brands fa-linkedin';
                else if (urlLower.includes('github')) iconClass = 'fa-brands fa-github';
                else if (urlLower.includes('twitter') || urlLower.includes('x.com')) iconClass = 'fa-brands fa-x-twitter';
                else if (urlLower.includes('youtube') || urlLower.includes('youtu.be')) iconClass = 'fa-brands fa-youtube';
                else if (urlLower.includes('wa.me') || urlLower.includes('whatsapp')) iconClass = 'fa-brands fa-whatsapp';
                else if (urlLower.includes('facebook')) iconClass = 'fa-brands fa-facebook';
                else if (urlLower.includes('spotify')) iconClass = 'fa-brands fa-spotify';

                a.innerHTML = `<i class="${iconClass}" style="margin-right:10px; font-size: 1.1em;"></i> ${sanitize(link.title)}`;
                pLinks.appendChild(a);
                VanillaTilt.init(a, {
                    max: 15,            // Kemiringan maksimal
                    speed: 400,         // Kecepatan animasi
                    glare: true,        // Efek kilau cahaya
                    "max-glare": 0.2    // Opasitas kilau
                });
            });
        }
        
        // --- PANGGIL MUSIK (TERAKHIR) ---
        // Panggil ini di luar loop links, jadi kalau error gak ngefek ke link.
        if (profile.music_url) {
            renderMusicPlayer(profile.music_url);
        }

    } catch (error) {
        console.error("Critical Render Error:", error);
        show404(); 
    }
}

// Jalankan
renderProfile();