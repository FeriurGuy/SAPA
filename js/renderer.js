import { supabase } from './supabase.js';

// ==========================================
// 1. DEFINISI ELEMENT & HELPER
// ==========================================
const pAvatar = document.getElementById('pAvatar');
const pName = document.getElementById('pName');
const pBio = document.getElementById('pBio');
const pLinks = document.getElementById('pLinks');

function sanitize(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

function getContrastColor(hexColor) {
    if (hexColor.length < 7) return '#000000';
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#0f172a' : '#ffffff';
}

// ==========================================
// 2. TAMPILAN ERROR (404 Not Found)
// ==========================================
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

// ==========================================
// 3. RENDER MUSIK (YouTube & Spotify)
// ==========================================
function renderMusicPlayer(url) {
    try {
        if (!url) return;

        // A. LOGIKA YOUTUBE (Autoplay + Piringan Hitam)
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            let videoId = '';
            if (url.includes('youtu.be')) videoId = url.split('/').pop();
            else videoId = new URLSearchParams(new URL(url).search).get('v');
            
            if (videoId) {
                const playerDiv = document.createElement('div');
                playerDiv.style.cssText = 'position: fixed; bottom: 20px; left: 20px; z-index: 100; width: 80px; height: 80px; border-radius: 50%; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 3px solid white; animation: spin 10s linear infinite; cursor: pointer;';
                playerDiv.innerHTML = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&loop=1&playlist=${videoId}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="pointer-events: none; transform: scale(2);"></iframe>`;
                document.body.appendChild(playerDiv);
                
                if (!document.getElementById('animSpin')) {
                    const style = document.createElement('style');
                    style.id = 'animSpin';
                    style.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
                    document.head.appendChild(style);
                }
            }
        } 
        // B. LOGIKA SPOTIFY (Widget Floating)
        else if (url.includes('open.spotify.com')) { 
            // Support format: open.spotify.com/track/xxxx
            const parts = url.split('/track/');
            if (parts.length > 1) {
                const trackId = parts[1].split('?')[0]; 
                const embedUrl = `https://open.spotify.com/embed/track/${trackId}?utm_source=generator`;

                const spotifyDiv = document.createElement('div');
                spotifyDiv.style.cssText = 'position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 100; width: 90%; max-width: 400px; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 20px rgba(0,0,0,0.2);';
                
                spotifyDiv.innerHTML = `<iframe style="border-radius:12px" src="${embedUrl}" width="100%" height="80" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
                
                document.body.appendChild(spotifyDiv);
                document.body.style.paddingBottom = '120px'; // Geser padding biar konten ga ketutup
            }
        }
    } catch (err) {
        console.error("Gagal load musik:", err);
    }
}

// ==========================================
// 4. MAIN LOGIC (RENDER PROFILE)
// ==========================================
async function renderProfile() {
    const params = new URLSearchParams(window.location.search);
    let username = params.get('u');

    if (!username) {
        const path = window.location.pathname;
        
        if (path !== '/' && 
            path !== '/index.html' && 
            path !== '/profile.html' && 
            !path.includes('.html')) {
            username = path.startsWith('/') ? path.substring(1) : path;
        }
    }

    if (!username) { show404(); return; }

    try {
        // --- FETCH DATA DARI SUPABASE ---
        const { data: profile, error: profileError } = await supabase
            .from('profiles').select('*').eq('username', username).single();

        if (profileError || !profile) { show404(); return; }

        pAvatar.classList.remove('skeleton');
        pName.classList.remove('skeleton');
        pBio.classList.remove('skeleton'); 
        pName.style.width = 'auto';
        pBio.style.width = 'auto';
        document.title = `${profile.full_name} | SAPA`;
        
        // Verified Badge
        pName.innerHTML = sanitize(profile.full_name || `@${profile.username}`);
        if (profile.is_pro) {
            const badge = document.createElement('i');
            badge.className = 'fa-solid fa-circle-check';
            badge.style.cssText = `color: #3b82f6; margin-left: 8px; font-size: 0.8em; vertical-align: middle; filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3));`;
            pName.appendChild(badge);
        }
        pBio.textContent = profile.bio || '';

        // --- LOGIKA TEMA & BACKGROUND ---
        let customCardBg = null;
        let customCardBorder = null;
        let textColor = '#0f172a';

        document.body.className = ''; 
        document.body.style = '';

        if (profile.bg_image_url) {
            document.body.style.backgroundImage = `url('${profile.bg_image_url}')`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundAttachment = 'fixed';
            
            textColor = '#ffffff';
            document.body.style.color = textColor;
            customCardBg = 'rgba(0, 0, 0, 0.6)';
            customCardBorder = '1px solid rgba(255, 255, 255, 0.3)';
        } 

        else if (profile.bg_color) {
            const color = profile.bg_color.toLowerCase();
            
            if (color === '#0f172a') document.body.classList.add('theme-dark');
            else if (['#f43f5e', '#fff1f2', '#fecdd3'].includes(color)) document.body.classList.add('theme-pastel');
            else if (color === '#10b981') document.body.classList.add('theme-cyber');
            else if (color === '#ffd700') document.body.classList.add('theme-gold');   // Sultan
            else if (color === '#0ea5e9') document.body.classList.add('theme-ocean');  // Ocean
            else if (color === '#f97316') document.body.classList.add('theme-sunset'); // Sunset
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

        pAvatar.src = profile.avatar_url || 'https://ui-avatars.com/api/?name=' + profile.username;

        const { data: links } = await supabase
            .from('links').select('*').eq('user_id', profile.id)
            .order('position', { ascending: true }).order('created_at', { ascending: true });

        pLinks.innerHTML = '';
        
        if (links) {
            links.forEach((link, index) => {
                const a = document.createElement('a');
                a.href = link.url;
                a.target = '_blank';
                a.className = 'link-card animate-enter';
                a.style.animationDelay = `${index * 0.1}s`; 

                if (customCardBg) {
                    a.style.background = customCardBg;
                    a.style.border = customCardBorder;
                    a.style.color = textColor;
                }

                a.addEventListener('click', (e) => {
                    // 1. Analytics
                    supabase.rpc('increment_clicks', { link_id: link.id })
                        .then(() => console.log('Click recorded'))
                        .catch(err => console.warn('Analytics skipped:', err));

                    // 2. Logic Navigasi
                    if (a.target === '_blank') {
                        return; 
                    } else {
                        e.preventDefault();
                        setTimeout(() => window.location.href = link.url, 300);
                    }
                });

                // Deteksi Icon Otomatis
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
                else if (urlLower.includes('trakteer') || urlLower.includes('saweria')) iconClass = 'fa-solid fa-hand-holding-dollar';

                a.innerHTML = `<i class="${iconClass}" style="margin-right:10px; font-size: 1.1em;"></i> ${sanitize(link.title)}`;
                pLinks.appendChild(a);

                if (typeof VanillaTilt !== 'undefined') {
                    VanillaTilt.init(a, { 
                        max: 15, 
                        speed: 400, 
                        glare: true, 
                        "max-glare": 0.2, 
                        scale: 1.02 
                    });
                }
            });
        }
        
        // --- LOAD MUSIK ---
        if (profile.music_url) renderMusicPlayer(profile.music_url);

        // ==========================================
        // 5. FITUR SHARE (MODAL & LOGIC) - Addon
        // ==========================================
        function renderShareFeature(username, fullName) {
            // 1. Buat Tombol Trigger (Inline)
            const btnShare = document.createElement('button');
            btnShare.className = 'btn-share-profile';
            btnShare.innerHTML = '<i class="fa-solid fa-share-nodes"></i> Bagikan Profil';
            
            // Masukkan tombol SETELAH container link (pLinks)
            // Pastikan pLinks punya parentNode
            if (pLinks && pLinks.parentNode) {
                pLinks.parentNode.insertBefore(btnShare, pLinks.nextSibling);
            }

            // 2. Buat Elemen Modal (Hidden by default)
            const currentUrl = window.location.href;
            const shareText = `Cek profil ${fullName} di SAPA! 👇`;
            
            // Template Modal HTML
            const modalHtml = `
                <div class="share-modal-overlay" id="shareModalOverlay">
                    <div class="share-modal">
                        <div class="share-header">
                            <h3>Bagikan ke Teman</h3>
                            <p>Sebarkan link profil ini ke sosmedmu</p>
                        </div>
                        
                        <div class="share-grid">
                            <a href="https://wa.me/?text=${encodeURIComponent(shareText + '\n' + currentUrl)}" target="_blank" class="share-item">
                                <div class="share-icon-box bg-wa"><i class="fa-brands fa-whatsapp"></i></div>
                                <span>WhatsApp</span>
                            </a>

                            <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}" target="_blank" class="share-item">
                                <div class="share-icon-box bg-x"><i class="fa-brands fa-x-twitter"></i></div>
                                <span>X</span>
                            </a>

                            <a href="mailto:?subject=Cek Profil ${fullName}&body=${encodeURIComponent(shareText + '\n' + currentUrl)}" class="share-item">
                                <div class="share-icon-box bg-email"><i class="fa-solid fa-envelope"></i></div>
                                <span>Email</span>
                            </a>

                            <button class="share-item" id="btnCopyLinkShare">
                                <div class="share-icon-box bg-copy"><i class="fa-solid fa-link"></i></div>
                                <span>Salin</span>
                            </button>
                        </div>

                        <button class="btn-close-share" id="btnCloseShare">Tutup</button>
                    </div>
                </div>
            `;

            // Inject Modal ke Body
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = modalHtml;
            document.body.appendChild(modalContainer);

            // 3. Logic Event Listener (Buka/Tutup/Copy)
            const overlay = document.getElementById('shareModalOverlay');
            const btnClose = document.getElementById('btnCloseShare');
            const btnCopy = document.getElementById('btnCopyLinkShare');

            // Buka Modal
            btnShare.addEventListener('click', () => {
                overlay.classList.add('active');
            });

            // Tutup Modal
            const closeModal = () => overlay.classList.remove('active');
            btnClose.addEventListener('click', closeModal);
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) closeModal();
            });

            // Copy Link Logic
            btnCopy.addEventListener('click', () => {
                navigator.clipboard.writeText(currentUrl).then(() => {
                    const originalIcon = btnCopy.innerHTML;
                    btnCopy.innerHTML = `<div class="share-icon-box bg-copy" style="background:#10b981"><i class="fa-solid fa-check"></i></div><span>Disalin!</span>`;
                    setTimeout(() => {
                        btnCopy.innerHTML = originalIcon;
                    }, 2000);
                });
            });
        }
        renderShareFeature(profile.username, profile.full_name);

    } catch (error) {
        console.error("Critical Render Error:", error);
        show404(); 
    }
}
renderProfile();

