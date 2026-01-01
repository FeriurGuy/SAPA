import { supabase } from './supabase.js';

// --- STATE ---
let user = null; 
let userProfile = null; // Simpan data profil lengkap (termasuk is_pro)
let isDirty = false;

// --- DOM ELEMENTS ---
const profileForm = document.getElementById('profileForm');
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

// Elemen PRO BARU
const musicInput = document.getElementById('musicUrl');
const bgInput = document.getElementById('bgInput');
const bgPreview = document.getElementById('bgPreview');
const deleteBgBtn = document.getElementById('deleteBgBtn');
const proInputs = document.querySelectorAll('.pro-input, .pro-input-btn'); // Class helper

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
    setTimeout(() => { toast.classList.add('hide'); toast.addEventListener('animationend', () => toast.remove()); }, 3500);
}

// --- 1. INISIALISASI ---
async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = 'login.html'; return; }
    user = session.user;
    await loadProfile(); // Load profil dulu buat tau status PRO
    await loadLinks();
}
init();

// --- DETEKSI PERUBAHAN ---
const inputs = [document.getElementById('fullName'), document.getElementById('bio'), bgColorInput, donationInput, musicInput];
inputs.forEach(input => { if(input) input.addEventListener('input', () => { isDirty = true; }); });

// --- LOGIC PRESET WARNA (DIKUNCI BUAT FREE USER) ---
const presets = document.querySelectorAll('.preset');
presets.forEach(preset => {
    preset.addEventListener('click', () => {
        // CEK STATUS PRO
        if (!userProfile.is_pro) {
            showToast('Fitur Premium 🔒', 'Upgrade ke Pro untuk pakai tema instan ini!', 'warning');
            return;
        }

        const color = preset.getAttribute('data-color');
        bgColorInput.value = color;
        colorValueDisplay.textContent = color;
        updateActivePreset(color);
        isDirty = true;
    });
});

bgColorInput.addEventListener('input', (e) => {
    // Manual color BOLEH buat user gratis
    const color = e.target.value;
    colorValueDisplay.textContent = color;
    updateActivePreset(color);
});

function updateActivePreset(color) {
    presets.forEach(p => p.classList.remove('active'));
    const match = document.querySelector(`.preset[data-color="${color}"]`);
    if (match) match.classList.add('active');
}

previewBtn.addEventListener('click', (e) => {
    if (isDirty) {
        e.preventDefault();
        showToast('Ups, belum disave!', 'Simpan dulu ya.', 'warning');
    }
});

// --- 2. LOAD PROFILE & PRO LOGIC ---
async function loadProfile() {
    try {
        const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (error) throw error;
        
        userProfile = profile; // Simpan ke variabel global

        // Isi Form Dasar
        document.getElementById('fullName').value = profile.full_name || '';
        document.getElementById('bio').value = profile.bio || '';
        if (donationInput) donationInput.value = profile.donation_url || '';
        
        // Load Warna
        bgColorInput.value = profile.bg_color || '#ffffff';
        colorValueDisplay.textContent = profile.bg_color || '#ffffff';
        updateActivePreset(profile.bg_color);

        // Navbar & Avatar
        navUsername.textContent = '@' + profile.username;
        previewBtn.href = `profile.html?u=${profile.username}`;
        if (profile.avatar_url) avatarPreview.style.backgroundImage = `url('${profile.avatar_url}')`;

        // --- HANDLING FITUR PRO ---
        if (profile.is_pro) {
            // ---> USER SULTAN (PRO) <---
            if (upgradeBanner) upgradeBanner.classList.add('hidden');
            if (!navUsername.innerHTML.includes('fa-circle-check')) {
                navUsername.innerHTML += ` <i class="fa-solid fa-circle-check" style="color:#3b82f6; margin-left:5px;"></i>`;
            }
            
            // Buka akses input Pro
            proInputs.forEach(el => el.disabled = false);
            musicInput.value = profile.music_url || '';
            
            // Load Background Image
            if (profile.bg_image_url) {
                bgPreview.style.backgroundImage = `url('${profile.bg_image_url}')`;
                bgPreview.innerHTML = '';
                deleteBgBtn.classList.remove('hidden');
            }

            // Buka Gembok Preset
            presets.forEach(p => p.classList.remove('locked-feature'));

        } else {
            // ---> USER GRATISAN <---
            if (upgradeBanner) upgradeBanner.classList.remove('hidden');
            
            // Kunci input Pro (tapi tetap kelihatan biar ngiler)
            proInputs.forEach(el => {
                el.disabled = true;
                el.title = "Upgrade ke Pro untuk buka fitur ini";
                el.parentElement.style.opacity = "0.6";
            });
            musicInput.value = ''; // Kosongkan visualnya
            
            // Kunci Preset Warna
            presets.forEach(p => {
                p.classList.add('locked-feature');
                p.title = "Upgrade ke Pro";
            });
        }
        // -------------------------

        isDirty = false;
    } catch (error) { console.error('Gagal load profile:', error); }
}

// SIMPAN PROFIL
profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = profileForm.querySelector('button');
    btn.textContent = 'Menyimpan...';

    // Data dasar
    const updates = {
        id: user.id,
        full_name: document.getElementById('fullName').value,
        bio: document.getElementById('bio').value,
        bg_color: bgColorInput.value,
        donation_url: donationInput ? donationInput.value : null,
        updated_at: new Date()
    };

    // Kalau PRO, simpan juga data Musik (Background disimpan pas upload)
    if (userProfile.is_pro) {
        updates.music_url = musicInput.value;
    }

    const { error } = await supabase.from('profiles').upsert(updates);
    
    if (error) showToast('Gagal', error.message, 'error');
    else {
        showToast('Berhasil!', 'Profil disimpan.', 'success');
        isDirty = false;
        // Reload data biar sinkron
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        userProfile = data; 
    }
    btn.textContent = 'Simpan Profil';
});

// LOGIC UPLOAD BACKGROUND (Hanya Pro)
bgInput.addEventListener('change', async (e) => {
    if (!userProfile.is_pro) return; // Jaga-jaga

    const file = e.target.files[0];
    if (!file) return;

    try {
        bgPreview.style.opacity = '0.5';
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-bg-${Date.now()}.${fileExt}`;
        
        // Upload ke bucket 'backgrounds'
        const { error: uploadError } = await supabase.storage.from('backgrounds').upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('backgrounds').getPublicUrl(fileName);
        
        // Update Database Langsung
        await supabase.from('profiles').update({ bg_image_url: publicUrl }).eq('id', user.id);
        
        // Update UI
        bgPreview.style.backgroundImage = `url('${publicUrl}')`;
        bgPreview.innerHTML = '';
        deleteBgBtn.classList.remove('hidden');
        showToast('Background Terpasang!', 'Keren banget! 😎', 'success');

    } catch (error) {
        showToast('Gagal Upload', error.message, 'error');
    } finally {
        bgPreview.style.opacity = '1';
    }
});

// Hapus Background
deleteBgBtn.addEventListener('click', async () => {
    if (!confirm("Hapus background custom?")) return;
    await supabase.from('profiles').update({ bg_image_url: null }).eq('id', user.id);
    bgPreview.style.backgroundImage = '';
    bgPreview.innerHTML = '<span>Tidak ada gambar</span>';
    deleteBgBtn.classList.add('hidden');
});

// LOGIC UPLOAD AVATAR (Bisa Semua User)
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
    } catch (error) { showToast('Error', error.message, 'error'); } finally { avatarPreview.style.opacity = '1'; }
});

// --- 3. LINK MANAGER (DENGAN LIMITASI) ---
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
        
        // --- LOGIC ANALYTICS (HANYA PRO) ---
        let analyticsHTML = '';
        if (userProfile.is_pro) {
            // Tampilkan Statistik kalau PRO
            analyticsHTML = `
            <div class="link-stats" title="Total Klik">
                <i class="fa-solid fa-chart-simple"></i>
                <span>${link.clicks || 0}</span>
            </div>`;
        } else {
            // Sembunyikan kalau GRATIS (atau kasih gembok kecil)
            analyticsHTML = ``; // Kosongkan saja biar bersih
        }

        item.innerHTML = `
            <div class="drag-handle"><i class="fa-solid fa-grip-lines"></i></div>
            <div class="link-info">
                <strong>${sanitize(link.title)}</strong>
                <a href="${sanitize(link.url)}" target="_blank">${sanitize(link.url)}</a>
            </div>
            ${analyticsHTML}
            <div class="link-actions">
                <button class="btn-icon-sm text-red" onclick="deleteLink(${link.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        linksList.appendChild(item);
    });

    if (window.sortableInstance) window.sortableInstance.destroy();
    window.sortableInstance = new Sortable(linksList, {
        animation: 150, handle: '.drag-handle', ghostClass: 'sortable-ghost',
        onEnd: async function () { await updateLinkOrder(); }
    });
}

// TAMBAH LINK (DIBATASI 3 UNTUK FREE)
addLinkBtn.addEventListener('click', () => {
    const currentLinkCount = document.querySelectorAll('.link-item').length;

    // CEK LIMIT
    if (!userProfile.is_pro && currentLinkCount >= 3) {
        // Tampilkan Modal Rayuan Maut
        showToast('Limit Tercapai! 🔒', 'User Gratis cuma boleh 3 link. Upgrade ke Pro yuk!', 'warning');
        // Bisa juga trigger buka Banner Upgrade disini
        return; 
    }

    linkModal.classList.remove('hidden');
});

// ... (Sisa fungsi updateLinkOrder, linkForm submit, deleteLink sama seperti sebelumnya) ...
// Biar kode gak kepanjangan, fungsi-fungsi standar (sanitize, closeModal, linkForm listener) 
// MASIH SAMA dengan versi sebelumnya. Perlu saya tulis ulang lengkap atau kamu copas bawahnya sendiri?
// Biar aman saya tulis fungsi sisanya ringkas di bawah ini:

async function updateLinkOrder() {
    const items = document.querySelectorAll('.link-item');
    const updates = [];
    items.forEach((item, index) => {
        const id = item.getAttribute('data-id');
        updates.push({ id: parseInt(id), user_id: user.id, position: index });
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
window.deleteLink = async (id) => {
    if (!confirm('Hapus link?')) return;
    const { error } = await supabase.from('links').delete().eq('id', id);
    if (!error) { loadLinks(); showToast('Dihapus', 'Link hilang', 'info'); }
};
closeModal.addEventListener('click', closeLinkModal);
function closeLinkModal() { linkModal.classList.add('hidden'); }
window.addEventListener('click', (e) => { if (e.target == linkModal) closeLinkModal(); });
logoutBtn.addEventListener('click', async () => { await supabase.auth.signOut(); window.location.href = 'index.html'; });
const shareBtn = document.getElementById('shareBtn');
if (shareBtn) {
    shareBtn.addEventListener('click', () => {
        const username = navUsername.textContent.replace('@', '').trim();
        navigator.clipboard.writeText(`${window.location.origin}/profile.html?u=${username}`)
            .then(() => showToast('Disalin!', 'Link profil sudah di clipboard', 'success'));
    });
}