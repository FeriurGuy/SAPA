import { supabase } from './supabase.js';

// ==========================================
// 1. STATE & VARIABLES
// ==========================================
let user = null; 
let userProfile = null; // Simpan data profil lengkap
let isDirty = false;

// --- DOM ELEMENTS ---
const profileForm = document.getElementById('profileForm');
const usernameInput = document.getElementById('usernameInput'); // Input Username Baru
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

// --- TOAST NOTIFICATION (3 DETIK) ---
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

    // Auto hilang dalam 3 detik
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
    if (!session) { window.location.href = 'login.html'; return; }
    user = session.user;
    await loadProfile(); 
    await loadLinks();
}
init();

// --- DETEKSI PERUBAHAN INPUT ---
const inputs = [document.getElementById('fullName'), document.getElementById('bio'), bgColorInput, donationInput, musicInput, usernameInput];
inputs.forEach(input => { if(input) input.addEventListener('input', () => { isDirty = true; }); });

// --- LOGIC PRESET TEMA ---
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
    const color = e.target.value;
    colorValueDisplay.textContent = color;
    updateActivePreset(color);
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

        // Isi Form
        if(usernameInput) usernameInput.value = profile.username; // Isi username
        document.getElementById('fullName').value = profile.full_name || '';
        document.getElementById('bio').value = profile.bio || '';
        if (donationInput) donationInput.value = profile.donation_url || '';
        
        // Load Warna
        bgColorInput.value = profile.bg_color || '#ffffff';
        colorValueDisplay.textContent = profile.bg_color || '#ffffff';
        updateActivePreset(profile.bg_color);

        // Navbar & Preview Link (Format Pendek)
        navUsername.textContent = '@' + profile.username;
        previewBtn.href = `${window.location.origin}/${profile.username}`;
        
        if (profile.avatar_url) avatarPreview.style.backgroundImage = `url('${profile.avatar_url}')`;

        // --- HANDLING STATUS PRO ---
        if (profile.is_pro) {
            // USER PRO
            if (upgradeBanner) upgradeBanner.classList.add('hidden');
            if (!navUsername.innerHTML.includes('fa-circle-check')) {
                navUsername.innerHTML += ` <i class="fa-solid fa-circle-check" style="color:#3b82f6; margin-left:5px;"></i>`;
            }
            
            // Buka akses input Pro (termasuk username & background)
            proInputs.forEach(el => el.disabled = false);
            musicInput.value = profile.music_url || '';
            
            if (profile.bg_image_url) {
                bgPreview.style.backgroundImage = `url('${profile.bg_image_url}')`;
                bgPreview.innerHTML = '';
                deleteBgBtn.classList.remove('hidden');
            }
            presets.forEach(p => p.classList.remove('locked-feature'));

        } else {
            // USER GRATIS
            if (upgradeBanner) upgradeBanner.classList.remove('hidden');
            
            // Kunci input Pro
            proInputs.forEach(el => {
                el.disabled = true;
                el.title = "Upgrade ke Pro untuk buka fitur ini";
                el.parentElement.style.opacity = "0.6";
            });
            musicInput.value = '';
        }
        isDirty = false;
    } catch (error) { console.error('Gagal load profile:', error); }
}

// --- SAVE PROFIL (DENGAN PERBAIKAN TOMBOL) ---
profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // FIX: Pilih tombol spesifik type="submit" biar gak ketukar sama tombol lain
    const btn = profileForm.querySelector('button[type="submit"]'); 
    
    // Simpan teks asli tombol buat dibalikin nanti
    const originalText = btn.innerHTML;
    
    // Ubah status tombol
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
    btn.disabled = true;

    try {
        // 1. Data Update Standard
        const updates = {
            id: user.id,
            full_name: document.getElementById('fullName').value,
            bio: document.getElementById('bio').value,
            bg_color: bgColorInput.value,
            donation_url: donationInput ? donationInput.value : null,
            updated_at: new Date()
        };

        // 2. Logic Khusus Pro
        if (userProfile.is_pro) {
            updates.music_url = musicInput.value;

            // Cek Username (Hanya kalau input username ada di HTML)
            if (usernameInput) {
                const newUsername = usernameInput.value.trim().toLowerCase();
                if (newUsername !== userProfile.username) {
                    
                    // Validasi Format
                    if (!/^[a-zA-Z0-9_]{3,}$/.test(newUsername)) {
                        throw new Error("Username minimal 3 karakter (huruf, angka, _).");
                    }

                    // Cek Ketersediaan di DB
                    const { data: existingUser, error: checkError } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('username', newUsername)
                        .maybeSingle();

                    if (checkError) throw checkError;
                    if (existingUser) {
                        throw new Error("Username sudah dipakai orang lain.");
                    }

                    updates.username = newUsername;
                }
            }
        }

        // 3. Eksekusi Update
        const { error } = await supabase.from('profiles').upsert(updates);
        if (error) throw error;

        // 4. Sukses
        showToast('Berhasil!', 'Profil disimpan.', 'success');
        isDirty = false;
        
        // Reload data
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        userProfile = data; 
        
        // Update Tampilan UI
        navUsername.textContent = '@' + userProfile.username;
        if (userProfile.is_pro && !navUsername.innerHTML.includes('check')) {
            navUsername.innerHTML += ` <i class="fa-solid fa-circle-check" style="color:#3b82f6; margin-left:5px;"></i>`;
        }
        previewBtn.href = `${window.location.origin}/${userProfile.username}`;

    } catch (error) {
        showToast('Gagal', error.message, 'error');
    } finally {
        // Balikin tombol seperti semula
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

// LOGIC UPLOAD BACKGROUND (Pro Only)
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

    } catch (error) {
        showToast('Gagal Upload', error.message, 'error');
    } finally {
        bgPreview.style.opacity = '1';
    }
});

// ==========================================
// 4. CUSTOM MODAL (CONFIRMATION)
// ==========================================
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

btnCancel.addEventListener('click', () => {
    confirmModal.classList.add('hidden');
    confirmCallback = null;
});

btnConfirm.addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    confirmModal.classList.add('hidden');
});

window.addEventListener('click', (e) => {
    if (e.target === confirmModal) confirmModal.classList.add('hidden');
});

// HAPUS BACKGROUND
deleteBgBtn.addEventListener('click', () => {
    showConfirm(
        "Hapus Background?", 
        "Gambar background kamu bakal hilang.", 
        async () => {
            try {
                const { error } = await supabase.from('profiles').update({ bg_image_url: null }).eq('id', user.id);
                if (error) throw error;
                bgPreview.style.backgroundImage = '';
                bgPreview.innerHTML = '<span>Tidak ada gambar</span>';
                deleteBgBtn.classList.add('hidden');
                showToast('Dihapus!', 'Background berhasil dihapus.', 'success');
            } catch (error) {
                showToast('Gagal', error.message, 'error');
            }
        }
    );
});

// UPLOAD AVATAR
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

// ==========================================
// 5. LINK MANAGER (CRUD)
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
            analyticsHTML = `
            <div class="link-stats" title="Total Klik">
                <i class="fa-solid fa-chart-simple"></i>
                <span>${link.clicks || 0}</span>
            </div>`;
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

// TAMBAH LINK (LIMIT 3 UNTUK FREE)
addLinkBtn.addEventListener('click', () => {
    const currentLinkCount = document.querySelectorAll('.link-item').length;
    if (!userProfile.is_pro && currentLinkCount >= 3) {
        showToast('Limit Tercapai! 👑', 'User Gratis cuma boleh 3 link. Upgrade ke Pro yuk!', 'warning');
        return; 
    }
    linkModal.classList.remove('hidden');
});

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

window.deleteLink = (id) => {
    showConfirm(
        "Hapus Link Ini?", 
        "Yakin mau hapus? Link yang dihapus gak bisa balik lagi lho.", 
        async () => {
            const { error } = await supabase.from('links').delete().eq('id', id);
            if (error) { showToast('Gagal', 'Gagal menghapus link', 'error'); } 
            else { loadLinks(); showToast('Terhapus!', 'Link berhasil dihapus.', 'success'); }
        }
    );
};

closeModal.addEventListener('click', closeLinkModal);
function closeLinkModal() { linkModal.classList.add('hidden'); }
window.addEventListener('click', (e) => { if (e.target == linkModal) closeLinkModal(); });

// LOGOUT
logoutBtn.addEventListener('click', async () => { await supabase.auth.signOut(); window.location.href = 'index.html'; });

// ==========================================
// 6. SHARE & COPY LINK (LINK PENDEK)
// ==========================================
const shareBtn = document.getElementById('shareBtn');
if (shareBtn) {
    shareBtn.addEventListener('click', () => {
        const username = navUsername.textContent.replace('@', '').trim();
        
        // ---> COPY LINK PENDEK BIAR KEREN <---
        const fullUrl = `${window.location.origin}/${userProfile.username}`; // Pake userProfile.username biar aman
        
        navigator.clipboard.writeText(fullUrl).then(() => {
            showToast('Disalin!', 'Link profil siap dibagikan', 'success');
            const originalHTML = shareBtn.innerHTML;
            shareBtn.innerHTML = `<i class="fa-solid fa-check"></i> Tersalin!`;
            shareBtn.classList.add('btn-success'); 
            setTimeout(() => {
                shareBtn.innerHTML = originalHTML;
                shareBtn.classList.remove('btn-success');
            }, 2000);
        });
    });
}