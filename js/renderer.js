import { supabase } from './supabase.js';

// --- ELEMENTS ---
const pAvatar = document.getElementById('pAvatar');
const pName = document.getElementById('pName');
const pBio = document.getElementById('pBio');
const pLinks = document.getElementById('pLinks');

// --- FUNGSI TAMPILAN 404 (USER NOT FOUND) ---
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

// --- MAIN LOGIC ---
async function renderProfile() {
    const params = new URLSearchParams(window.location.search);
    const username = params.get('u');

    if (!username) { show404(); return; }

    try {
        const { data: profile, error: profileError } = await supabase
            .from('profiles').select('*').eq('username', username).single();

        if (profileError || !profile) { show404(); return; }

        // Render Data Dasar
        pAvatar.classList.remove('skeleton');
        pName.classList.remove('skeleton');
        pBio.classList.remove('skeleton');
        pName.style.width = 'auto';
        pBio.style.width = 'auto';
        
        document.title = `${profile.full_name} | SAPA`;
        
        // NAMA & BADGE
        pName.innerHTML = sanitize(profile.full_name || `@${profile.username}`);
        if (profile.is_pro) {
            const badge = document.createElement('i');
            badge.className = 'fa-solid fa-circle-check';
            badge.style.cssText = `color: #3b82f6; margin-left: 8px; font-size: 0.8em; vertical-align: middle; filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3));`;
            pName.appendChild(badge);
        }

        pBio.textContent = profile.bio || '';
        
        // --- TOMBOL DONASI ---
        const oldBtn = document.getElementById('donateBtn');
        if (oldBtn) oldBtn.remove(); 

        if (profile.donation_url) {
            const btnDonate = document.createElement('a');
            btnDonate.id = 'donateBtn';
            btnDonate.href = profile.donation_url;
            btnDonate.target = '_blank';
            btnDonate.innerHTML = `<i class="fa-solid fa-mug-hot"></i> Traktir Saya Kopi`;
            btnDonate.style.cssText = `
                display: inline-flex; align-items: center; gap: 8px; background: #F59E0B;
                color: #fff; padding: 10px 20px; border-radius: 50px; font-weight: bold;
                margin-bottom: 25px; text-decoration: none; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
                transition: transform 0.2s; animation: pulse 2s infinite;
            `;
            pBio.parentNode.insertBefore(btnDonate, pLinks);
            
            if (!document.getElementById('animPulse')) {
                const style = document.createElement("style");
                style.id = 'animPulse';
                style.innerHTML = `@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.03); } 100% { transform: scale(1); } }`;
                document.head.appendChild(style);
            }
        }

        // --- THEME ENGINE ---
        document.body.className = ''; document.body.style = '';
        let customCardBg = null; let customCardBorder = null; let textColor = '#0f172a';

        if (profile.bg_image_url) {
            document.body.style.backgroundImage = `url('${profile.bg_image_url}')`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundAttachment = 'fixed';
            textColor = '#ffffff';
            document.body.style.color = textColor;
            customCardBg = 'rgba(0, 0, 0, 0.6)'; 
            customCardBorder = '1px solid rgba(255, 255, 255, 0.2)';
        } else if (profile.bg_color) {
            const color = profile.bg_color.toLowerCase();
            if (color === '#0f172a') document.body.classList.add('theme-dark');
            else if (['#f43f5e','#fff1f2','#fecdd3'].includes(color)) document.body.classList.add('theme-pastel');
            else if (color === '#10b981') document.body.classList.add('theme-cyber');
            else {
                document.body.style.backgroundColor = profile.bg_color;
                textColor = getContrastColor(profile.bg_color);
                document.body.style.color = textColor;
                if (textColor === '#ffffff') {
                    customCardBg = 'rgba(0, 0, 0, 0.4)'; customCardBorder = '1px solid rgba(255, 255, 255, 0.2)';
                } else {
                    customCardBg = 'rgba(255, 255, 255, 0.8)'; customCardBorder = '1px solid rgba(255, 255, 255, 0.5)';
                }
            }
        }

        // AVATAR
        pAvatar.src = profile.avatar_url || 'https://ui-avatars.com/api/?name=' + profile.username;

        // RENDER LINKS
        const { data: links } = await supabase.from('links').select('*').eq('user_id', profile.id).order('position');
        pLinks.innerHTML = ''; 
        
        if (links) {
            links.forEach((link, index) => {
                const a = document.createElement('a');
                a.href = link.url;
                // a.target = '_blank'; <--- KITA MATIKAN DULU BIAR KONTROL DI JS
                a.className = 'link-card animate-enter';
                a.style.animationDelay = `${index * 0.1}s`; 

                if (customCardBg) {
                    a.style.background = customCardBg;
                    a.style.border = customCardBorder;
                    a.style.color = textColor;
                }

                // ===========================================
                // 🔥 LOGIC KLIK SAKTI (PAKE DELAY) 🔥
                // ===========================================
                a.addEventListener('click', (e) => {
                    e.preventDefault(); // 1. TAHAN! Jangan pindah dulu.
                    
                    // 2. Kirim sinyal ke Supabase
                    console.log('📡 Sending beacon for:', link.title);
                    supabase.rpc('increment_clicks', { link_id: link.id });

                    // 3. Pindah manual setelah 300ms (0.3 detik)
                    // Waktu segini cukup buat sinyal keluar, tapi user gak ngerasa ngelag.
                    setTimeout(() => {
                        window.open(link.url, '_blank'); // Buka di tab baru
                    }, 300);
                });
                // ===========================================

                let iconClass = 'fa-solid fa-link';
                const u = link.url.toLowerCase();
                if (u.includes('instagram')) iconClass = 'fa-brands fa-instagram';
                else if (u.includes('tiktok')) iconClass = 'fa-brands fa-tiktok';
                else if (u.includes('linkedin')) iconClass = 'fa-brands fa-linkedin';
                else if (u.includes('github')) iconClass = 'fa-brands fa-github';
                else if (u.includes('twitter') || u.includes('x.com')) iconClass = 'fa-brands fa-x-twitter';
                else if (u.includes('youtube')) iconClass = 'fa-brands fa-youtube';
                else if (u.includes('wa.me') || u.includes('whatsapp')) iconClass = 'fa-brands fa-whatsapp';
                else if (u.includes('facebook')) iconClass = 'fa-brands fa-facebook';
                else if (u.includes('spotify')) iconClass = 'fa-brands fa-spotify';
                else if (u.includes('saweria') || u.includes('trakteer')) iconClass = 'fa-solid fa-hand-holding-dollar';

                a.innerHTML = `<i class="${iconClass}" style="margin-right:10px; font-size: 1.1em;"></i> ${sanitize(link.title)}`;
                pLinks.appendChild(a);
            });
        }
        
        // MUSIC PLAYER (HIDDEN)
        if (profile.music_url && (profile.music_url.includes('youtube') || profile.music_url.includes('youtu.be'))) {
            let vid = profile.music_url.includes('youtu.be') ? profile.music_url.split('/').pop() : new URLSearchParams(new URL(profile.music_url).search).get('v');
            if (vid) {
                const playerDiv = document.createElement('div');
                playerDiv.style.cssText = 'position: fixed; bottom: 20px; left: 20px; z-index: 999; width: 60px; height: 60px; border-radius: 50%; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.5); border: 2px solid white; animation: spin 10s linear infinite; opacity: 0.8;';
                playerDiv.innerHTML = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${vid}?autoplay=1&controls=0&loop=1&playlist=${vid}&mute=0" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="pointer-events: none; transform: scale(3);"></iframe>`;
                document.body.appendChild(playerDiv);
                if (!document.getElementById('animSpin')) {
                    const s = document.createElement('style'); s.id = 'animSpin';
                    s.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
                    document.head.appendChild(s);
                }
            }
        }

    } catch (error) { console.error(error); show404(); }
}

function getContrastColor(hex) {
    if (!hex || hex.length < 7) return '#000000';
    const r = parseInt(hex.substr(1, 2), 16), g = parseInt(hex.substr(3, 2), 16), b = parseInt(hex.substr(5, 2), 16);
    return (((r * 299) + (g * 587) + (b * 114)) / 1000) >= 128 ? '#0f172a' : '#ffffff';
}
function sanitize(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

renderProfile();
