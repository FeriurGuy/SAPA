import { supabase } from './supabase.js';

// ==========================================
// 1. STATE & VARIABLES
// ==========================================
let user = null; 
let userProfile = null;
let isDirty = false;

// --- DOM ELEMENTS ---
const profileForm = document.getElementById('profileForm');
const usernameInput = document.getElementById('usernameInput');
const avatarInput = document.getElementById('avatarInput');
const avatarPreview = document.getElementById('avatarPreview');
const linksList = document.getElementById('linksList');
const emptyState = document.getElementById('emptyState');
const linkModal = document.getElementById('linkModal');
const linkForm = document.getElementById('linkForm');
const addLinkBtn = document.getElementById('addLinkBtn');
const closeModal = document.querySelector('.close-modal');
const logoutBtn = document.getElementById('logoutBtn');
const previewBtn = document.getElementById('previewBtn');
const navUsername = document.getElementById('navUsername');
const bgColorInput = document.getElementById('bgColor');
const colorValueDisplay = document.getElementById('colorValue');
const donationInput = document.getElementById('donationUrl');
const upgradeBanner = document.getElementById('upgradeBanner');

// Elemen PRO
const musicInput = document.getElementById('musicUrl');
const bgInput = document.getElementById('bgInput');
const bgPreview = document.getElementById('bgPreview');
const deleteBgBtn = document.getElementById('deleteBgBtn');
const proInputs = document.querySelectorAll('.pro-input, .pro-input-btn');

// --- TOAST NOTIFICATION ---
function showToast(title, message, type = 'info') {
    const container = document.getElementById('toast-container');
    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-circle-xmark';
    if (type === 'warning') iconClass = 'fa-triangle-exclamation';

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fa-solid ${iconClass}"></i><div><span class="toast-title">${title}</span><span class="toast-message">${message}</span></div>`;
    container.appendChild(toast);

    setTimeout(() => { 
        toast.classList.add('hide'); 
        toast.addEventListener('animationend', () => toast.remove()); 
    }, 3000);
}

// ==========================================
// 2. INISIALISASI & LOAD DATA
// ==========================================
async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = 'auth.html'; return; }
    user = session.user;
    await loadProfile(); 
    await loadLinks();
    
    // --- PANGGIL FITUR SHARE DISINI ---
    initFloatingShare();
}
init();

// Detect Input Changes
const inputs = [document.getElementById('fullName'), document.getElementById('bio'), bgColorInput, donationInput, musicInput, usernameInput];
inputs.forEach(input => { if(input) input.addEventListener('input', () => { isDirty = true; }); });

// Preset Themes Logic
const presets = document.querySelectorAll('.theme-box'); 
presets.forEach(preset => {
    preset.addEventListener('click', () => {
        const isLocked = preset.classList.contains('locked-feature');
        if (isLocked) {
            showToast('Fitur Premium 👑', 'Upgrade ke Pro untuk pakai tema instan ini!', 'warning');
            return;
        }
        const color = preset.getAttribute('data-color');
        if (color) {
            bgColorInput.value = color;
            colorValueDisplay.textContent = color;
            updateActivePreset(color);
            isDirty = true;
        }
    });
});

bgColorInput.addEventListener('input', (e) => {
    colorValueDisplay.textContent = e.target.value;
    updateActivePreset(e.target.value);
});

function updateActivePreset(color) {
    presets.forEach(p => p.classList.remove('active'));
    const match = document.querySelector(`.theme-box[data-color="${color}"]`);
    if (match) match.classList.add('active');
}

previewBtn.addEventListener('click', (e) => {
    if (isDirty) {
        e.preventDefault();
        showToast('Ups, belum disave!', 'Simpan dulu ya.', 'warning');
    }
});

// ==========================================
// 3. LOGIC PROFIL (LOAD & SAVE)
// ==========================================
async function loadProfile() {
    try {
        const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (error) throw error;
        
        userProfile = profile; 

        // Fill Form
        if(usernameInput) usernameInput.value = profile.username;
        document.getElementById('fullName').value = profile.full_name || '';
        document.getElementById('bio').value = profile.bio || '';
        if (donationInput) donationInput.value = profile.donation_url || '';
        
        // Colors
        bgColorInput.value = profile.bg_color || '#ffffff';
        colorValueDisplay.textContent = profile.bg_color || '#ffffff';
        updateActivePreset(profile.bg_color);

        // UI Updates
        navUsername.textContent = '@' + profile.username;
        previewBtn.href = `${window.location.origin}/${profile.username}`;
        if (profile.avatar_url) avatarPreview.style.backgroundImage = `url('${profile.avatar_url}')`;

        // --- PRO STATUS HANDLING ---
        if (profile.is_pro) {
            if (upgradeBanner) upgradeBanner.classList.add('hidden');
            if (!navUsername.innerHTML.includes('fa-circle-check')) {
                navUsername.innerHTML += ` <i class="fa-solid fa-circle-check" style="color:#3b82f6; margin-left:5px;"></i>`;
            }
            proInputs.forEach(el => el.disabled = false);
            musicInput.value = profile.music_url || '';
            
            if (profile.bg_image_url) {
                bgPreview.style.backgroundImage = `url('${profile.bg_image_url}')`;
                bgPreview.innerHTML = '';
                deleteBgBtn.classList.remove('hidden');
            }
            presets.forEach(p => p.classList.remove('locked-feature'));
        } else {
            if (upgradeBanner) upgradeBanner.classList.remove('hidden');
            proInputs.forEach(el => {
                el.disabled = true;
                el.title = "Upgrade ke Pro untuk buka fitur ini";
                el.parentElement.style.opacity = "0.6";
            });
            musicInput.value = '';
        }
        
        if(usernameInput) {
            usernameInput.disabled = false;
            usernameInput.parentElement.style.opacity = "1";
        }

        isDirty = false;
    } catch (error) { console.error('Load Error:', error); }
}

// --- SAVE PROFILE ---
profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = profileForm.querySelector('button[type="submit"]'); 
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
    btn.disabled = true;

    try {
        const updates = {
            id: user.id,
            full_name: document.getElementById('fullName').value,
            bio: document.getElementById('bio').value,
            bg_color: bgColorInput.value,
            donation_url: donationInput ? donationInput.value : null,
            updated_at: new Date()
        };

        if (userProfile.is_pro) {
            updates.music_url = musicInput.value;
        }

        if (usernameInput) {
            const newUsername = usernameInput.value.trim().toLowerCase();
            if (newUsername !== userProfile.username) {
                if (!/^[a-zA-Z0-9_]{3,}$/.test(newUsername)) {
                    throw new Error("Username minimal 3 karakter (huruf, angka, _).");
                }
                const { data: existingUser, error: checkError } = await supabase.from('profiles').select('id').eq('username', newUsername).maybeSingle();
                if (checkError) throw checkError;
                if (existingUser) throw new Error("Username sudah dipakai orang lain.");
                updates.username = newUsername;
            }
        }

        const { error } = await supabase.from('profiles').upsert(updates);
        if (error) throw error;

        showToast('Berhasil!',  'Profil disimpan.', 'success');
        isDirty = false;
        
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        userProfile = data; 
        
        navUsername.textContent = '@' + userProfile.username;
        if (userProfile.is_pro && !navUsername.innerHTML.includes('check')) {
            navUsername.innerHTML += ` <i class="fa-solid fa-circle-check" style="color:#3b82f6; margin-left:5px;"></i>`;
        }
        previewBtn.href = `${window.location.origin}/${userProfile.username}`;

    } catch (error) {
        showToast('Gagal', error.message, 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

// ==========================================
// 4. BACKGROUND & AVATAR UPLOAD
// ==========================================
bgInput.addEventListener('change', async (e) => {
    if (!userProfile.is_pro) return; 
    const file = e.target.files[0];
    if (!file) return;

    try {
        bgPreview.style.opacity = '0.5';
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-bg-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('backgrounds').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('backgrounds').getPublicUrl(fileName);
        await supabase.from('profiles').update({ bg_image_url: publicUrl }).eq('id', user.id);
        bgPreview.style.backgroundImage = `url('${publicUrl}')`;
        bgPreview.innerHTML = '';
        deleteBgBtn.classList.remove('hidden');
        showToast('Background Terpasang!', 'Keren banget! 🤩', 'success');
    } catch (error) { showToast('Gagal Upload', error.message, 'error'); } 
    finally { bgPreview.style.opacity = '1'; }
});

deleteBgBtn.addEventListener('click', () => {
    showConfirm("Hapus Background?", "Gambar background kamu bakal hilang.", async () => {
        try {
            const { error } = await supabase.from('profiles').update({ bg_image_url: null }).eq('id', user.id);
            if (error) throw error;
            bgPreview.style.backgroundImage = '';
            bgPreview.innerHTML = '<span>Tidak ada gambar</span>';
            deleteBgBtn.classList.add('hidden');
            showToast('Dihapus!', 'Background berhasil dihapus.', 'success');
        } catch (error) { showToast('Gagal', error.message, 'error'); }
    });
});

avatarInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
        avatarPreview.style.opacity = '0.5';
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
        await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
        avatarPreview.style.backgroundImage = `url('${publicUrl}')`;
        showToast('Foto Baru!', 'Avatar berhasil diupdate.', 'success');
    } catch (error) { showToast('Error', error.message, 'error'); } 
    finally { avatarPreview.style.opacity = '1'; }
});

// ==========================================
// 5. LINK MANAGER & UTILS
// ==========================================
async function loadLinks() {
    linksList.innerHTML = '<p class="text-center">Loading...</p>';
    const { data: links, error } = await supabase.from('links').select('*').eq('user_id', user.id).order('position');
    if (error) return console.error(error);
    renderLinks(links);
}

function renderLinks(links) {
    linksList.innerHTML = '';
    if (links.length === 0) emptyState.classList.remove('hidden');
    else emptyState.classList.add('hidden');

    links.forEach(link => {
        const item = document.createElement('div');
        item.className = 'link-item';
        item.setAttribute('data-id', link.id); 
        
        let analyticsHTML = '';
        if (userProfile.is_pro) {
            analyticsHTML = `<div class="link-stats" title="Total Klik"><i class="fa-solid fa-chart-simple"></i><span>${link.clicks || 0}</span></div>`;
        }

        item.innerHTML = `
            <div class="drag-handle"><i class="fa-solid fa-grip-lines"></i></div>
            <div class="link-info"><strong>${sanitize(link.title)}</strong><a href="${sanitize(link.url)}" target="_blank">${sanitize(link.url)}</a></div>
            ${analyticsHTML}
            <div class="link-actions"><button class="btn-icon-sm text-red" onclick="deleteLink(${link.id})"><i class="fa-solid fa-trash"></i></button></div>
        `;
        linksList.appendChild(item);
    });

    if (window.sortableInstance) window.sortableInstance.destroy();
    window.sortableInstance = new Sortable(linksList, {
        animation: 150, handle: '.drag-handle', ghostClass: 'sortable-ghost',
        onEnd: async function () { await updateLinkOrder(); }
    });
}

addLinkBtn.addEventListener('click', () => {
    const currentLinkCount = document.querySelectorAll('.link-item').length;
    if (!userProfile.is_pro && currentLinkCount >= 3) {
        showToast('Limit Tercapai! 🥺', 'User Gratis cuma boleh 3 link. Upgrade ke Pro yuk!', 'warning');
        return; 
    }
    linkModal.classList.remove('hidden');
});

async function updateLinkOrder() {
    const items = document.querySelectorAll('.link-item');
    const updates = [];
    items.forEach((item, index) => {
        updates.push({ id: parseInt(item.getAttribute('data-id')), user_id: user.id, position: index });
    });
    await supabase.from('links').upsert(updates, { onConflict: 'id' });
}

function sanitize(str) { const temp = document.createElement('div'); temp.textContent = str; return temp.innerHTML; }

linkForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('linkTitle').value;
    let url = document.getElementById('linkUrl').value;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    const { error } = await supabase.from('links').insert([{ user_id: user.id, title: title, url: url, position: 999 }]);
    if (error) showToast('Gagal', 'Error database', 'error');
    else { closeLinkModal(); linkForm.reset(); loadLinks(); showToast('Sukses', 'Link ditambah', 'success'); }
});

window.deleteLink = (id) => {
    showConfirm("Hapus Link Ini?", "Link yang dihapus gak bisa balik lagi.", async () => {
        const { error } = await supabase.from('links').delete().eq('id', id);
        if (error) { showToast('Gagal', 'Gagal menghapus link', 'error'); } 
        else { loadLinks(); showToast('Terhapus!', 'Link berhasil dihapus.', 'success'); }
    });
};

const confirmModal = document.getElementById('confirmModal');
const btnCancel = document.getElementById('btnCancel');
const btnConfirm = document.getElementById('btnConfirm');
let confirmCallback = null; 

function showConfirm(title, message, callback) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    confirmCallback = callback;
    confirmModal.classList.remove('hidden');
}

btnCancel.addEventListener('click', () => { confirmModal.classList.add('hidden'); confirmCallback = null; });
btnConfirm.addEventListener('click', () => { if (confirmCallback) confirmCallback(); confirmModal.classList.add('hidden'); });
closeModal.addEventListener('click', closeLinkModal);
function closeLinkModal() { linkModal.classList.add('hidden'); }
window.addEventListener('click', (e) => { if (e.target == linkModal) closeLinkModal(); if (e.target === confirmModal) confirmModal.classList.add('hidden'); });

logoutBtn.addEventListener('click', async () => { await supabase.auth.signOut(); window.location.href = 'index.html'; });

// ==========================================
// 6. FITUR SHARE FAB (FINAL FIX ICON SHARE)
// ==========================================
function initFloatingShare() {
    if (!userProfile) return;

    const username = userProfile.username;
    const fullName = userProfile.full_name || username;
    const publicUrl = `${window.location.origin}/${username}`; 
    const shareText = `Sstt... Cek profil lengkap aku di sini! 👇✨`;

    const oldFab = document.querySelector('.fab-container');
    if (oldFab) oldFab.remove();

    const fabHTML = `
        <div class="fab-options">
            <button class="fab-btn" id="fabCopy" data-label="Salin Link">
                <i class="fa-solid fa-link text-copy"></i>
            </button>
            <a href="https://www.tiktok.com/" target="_blank" class="fab-btn" data-label="TikTok" onclick="navigator.clipboard.writeText('${publicUrl}')">
                <i class="fa-brands fa-tiktok text-tiktok"></i>
            </a>
            <a href="https://www.instagram.com/" target="_blank" class="fab-btn" data-label="Instagram" onclick="navigator.clipboard.writeText('${publicUrl}')">
                <i class="fa-brands fa-instagram text-ig"></i>
            </a>
            <a href="https://wa.me/?text=${encodeURIComponent(shareText + '\n' + publicUrl)}" target="_blank" class="fab-btn" data-label="WhatsApp">
                <i class="fa-brands fa-whatsapp text-wa"></i>
            </a>
        </div>

        <button class="fab-main" id="fabTrigger" title="Bagikan">
            <i class="fa-solid fa-share"></i>
        </button>
    `;

    const fabContainer = document.createElement('div');
    fabContainer.className = 'fab-container';
    fabContainer.innerHTML = fabHTML;
    document.body.appendChild(fabContainer);

    const trigger = document.getElementById('fabTrigger');
    const btnCopy = document.getElementById('fabCopy');

    // --- LOGIC GANTI ICON (SHARE <-> SILANG) ---
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        fabContainer.classList.toggle('active');
        const icon = trigger.querySelector('i');
        
        if (fabContainer.classList.contains('active')) {
            // Kalau menu TERBUKA: Ganti panah jadi X
            icon.className = 'fa-solid fa-xmark'; 
            icon.style.transform = 'rotate(90deg)'; // Putar dikit biar mulus
        } else {
            // Kalau menu TERTUTUP: Balikin jadi panah share
            icon.className = 'fa-solid fa-share';
            icon.style.transform = 'rotate(0deg)';
        }
    });

    document.addEventListener('click', (e) => {
        if (!fabContainer.contains(e.target)) {
            fabContainer.classList.remove('active');
            const icon = trigger.querySelector('i');
            // Reset ke ikon awal
            icon.className = 'fa-solid fa-share';
            icon.style.transform = 'rotate(0deg)';
        }
    });

    btnCopy.addEventListener('click', () => {
        navigator.clipboard.writeText(publicUrl).then(() => {
            const icon = btnCopy.querySelector('i');
            icon.className = 'fa-solid fa-check text-copy';
            setTimeout(() => icon.className = 'fa-solid fa-link text-copy', 2000);
        });
    });
}

// QR Code Logic
const hamburgerBtn = document.getElementById('hamburgerBtn');
const dropdownMenu = document.getElementById('dropdownMenu');
if (hamburgerBtn && dropdownMenu) {
    hamburgerBtn.addEventListener('click', (e) => { e.stopPropagation(); dropdownMenu.classList.toggle('hidden'); });
    window.addEventListener('click', (e) => { if (!hamburgerBtn.contains(e.target) && !dropdownMenu.contains(e.target)) { dropdownMenu.classList.add('hidden'); }});
}
const currentPath = window.location.pathname;
document.querySelectorAll('.dropdown-item').forEach(link => {
    const href = link.getAttribute('href');
    if (href && currentPath.includes(href.replace('.html', ''))) {
        link.classList.add('active');
    }
});

window.addEventListener('load', () => {
    setTimeout(() => {
        const userText = document.getElementById('navUsername').innerText.replace('@', '').trim();
        const cleanUrl = window.location.origin + '/' + userText;
        const qrContainer = document.getElementById('qrcode');
        if(qrContainer) {
            qrContainer.innerHTML = "";
            new QRCode(qrContainer, { text: cleanUrl, width: 140, height: 140, colorDark : "#0f172a", colorLight : "#ffffff", correctLevel : QRCode.CorrectLevel.H });
        }
    }, 2000);
});

window.downloadQR = function() {
    const qrContainer = document.getElementById("qrcode");
    const canvas = qrContainer.querySelector("canvas");
    const img = qrContainer.querySelector("img");
    
    let url = null;

    if (canvas) {
        url = canvas.toDataURL("image/png");
    } else if (img && img.src) {
        url = img.src;
    }

    if (url) {
        const link = document.createElement('a');
        link.download = `QR-SAPA-${Date.now()}.png`;
        link.href = url;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        alert("Sabar bos, QR Code lagi digambar...");
    }
}