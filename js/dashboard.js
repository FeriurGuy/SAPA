import { supabase } from './supabase.js';

// --- STATE ---
let user = null; 
let isDirty = false; // TRUE jika user sudah ngetik tapi BELUM simpan

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

// --- NOTIFICATION SYSTEM (PENGGANTI ALERT) ---
function showToast(title, message, type = 'info') {
    const container = document.getElementById('toast-container');
    
    // Tentukan Icon berdasarkan tipe
    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-circle-xmark';
    if (type === 'warning') iconClass = 'fa-triangle-exclamation';

    // Buat elemen HTML Toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fa-solid ${iconClass}"></i>
        <div class="toast-content">
            <span class="toast-title">${title}</span>
            <span class="toast-message">${message}</span>
        </div>
    `;

    container.appendChild(toast);

    // Hapus otomatis setelah 3 detik
    setTimeout(() => {
        toast.classList.add('hide');
        toast.addEventListener('animationend', () => toast.remove());
    }, 3500);
}

// --- 1. INISIALISASI ---
async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'login.html'; 
        return;
    }
    user = session.user;
    await loadProfile();
    await loadLinks();
}

init();

// --- LOGIC DETEKSI PERUBAHAN (DIRTY STATE) ---
// Kalau user ngetik/ganti warna, tandai 'isDirty = true'
const inputs = [document.getElementById('fullName'), document.getElementById('bio'), bgColorInput];
inputs.forEach(input => {
    input.addEventListener('input', () => { isDirty = true; });
});

// Logic Warna Preset
const presets = document.querySelectorAll('.preset');
presets.forEach(preset => {
    preset.addEventListener('click', () => {
        const color = preset.getAttribute('data-color');
        bgColorInput.value = color;
        colorValueDisplay.textContent = color;
        updateActivePreset(color);
        isDirty = true; // Ganti warna preset juga dihitung perubahan
    });
});

bgColorInput.addEventListener('input', (e) => {
    const color = e.target.value;
    colorValueDisplay.textContent = color;
    updateActivePreset(color);
});

function updateActivePreset(color) {
    presets.forEach(p => p.classList.remove('active'));
    const match = document.querySelector(`.preset[data-color="${color}"]`);
    if (match) match.classList.add('active');
}

// --- LOGIC TOMBOL PREVIEW (PENTING!) ---
previewBtn.addEventListener('click', (e) => {
    // Cek apakah ada perubahan belum disimpan?
    if (isDirty) {
        e.preventDefault(); // Tahan dulu, jangan buka tab baru
        showToast('Ups, belum disave!', 'Simpan profil dulu biar perubahannya muncul ya.', 'warning');
    }
    // Kalau isDirty false, dia bakal lanjut buka link (default behavior)
});

// --- 2. LOGIC PROFIL ---
async function loadProfile() {
    try {
        const { data: profile, error } = await supabase
            .from('profiles').select('*').eq('id', user.id).single();
        if (error) throw error;

        document.getElementById('fullName').value = profile.full_name || '';
        document.getElementById('bio').value = profile.bio || '';
        
        const loadedColor = profile.bg_color || '#ffffff';
        bgColorInput.value = loadedColor;
        colorValueDisplay.textContent = loadedColor;
        updateActivePreset(loadedColor);

        navUsername.textContent = '@' + profile.username;
        previewBtn.href = `profile.html?u=${profile.username}`;
        if (profile.avatar_url) avatarPreview.style.backgroundImage = `url('${profile.avatar_url}')`;

        isDirty = false; // Reset dirty state setelah load

    } catch (error) { console.error('Gagal load profile:', error); }
}

profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = profileForm.querySelector('button');
    const originalText = btn.textContent;
    btn.textContent = 'Menyimpan...';

    const updates = {
        id: user.id,
        full_name: document.getElementById('fullName').value,
        bio: document.getElementById('bio').value,
        bg_color: bgColorInput.value,
        updated_at: new Date()
    };
    
    const { error } = await supabase.from('profiles').upsert(updates);
    
    if (error) {
        // DETEKSI ERROR KONEKSI
        if (error.message.includes('Failed to fetch')) {
            showToast('Koneksi Putus', 'Gagal menghubungi server. Cek internet HP kamu ya!', 'error');
        } else {
            showToast('Gagal', error.message, 'error');
        }
    } else {
        showToast('Berhasil!', 'Profil kamu udah paling ganteng sekarang. 😎', 'success');
        isDirty = false;
    }
    btn.textContent = originalText;
    
});

avatarInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
        avatarPreview.style.opacity = '0.5';
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
        await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
        
        avatarPreview.style.backgroundImage = `url('${publicUrl}')`;
        showToast('Foto Baru!', 'Foto profil berhasil diupdate.', 'success');
    } catch (error) {
        showToast('Error Upload', error.message, 'error');
    } finally {
        avatarPreview.style.opacity = '1';
    }
});

// --- 3. LOGIC LINK MANAGER ---
async function loadLinks() {
    linksList.innerHTML = '<p class="text-center">Loading...</p>';
    const { data: links, error } = await supabase
        .from('links')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true }) 
        .order('created_at', { ascending: true }); 

    if (error) return console.error(error);
    renderLinks(links);
}

function renderLinks(links) {
    linksList.innerHTML = '';
    
    if (links.length === 0) {
        emptyState.classList.remove('hidden');
        return; 
    } else {
        emptyState.classList.add('hidden'); 
    }

    links.forEach(link => {
        const item = document.createElement('div');
        item.className = 'link-item';
        item.setAttribute('data-id', link.id); 
        item.innerHTML = `
            <div class="drag-handle"><i class="fa-solid fa-grip-lines"></i></div>
            <div class="link-info">
                <strong>${sanitize(link.title)}</strong>
                <a href="${sanitize(link.url)}" target="_blank">${sanitize(link.url)}</a>
            </div>
            <div class="link-actions">
                <button class="btn-icon-sm text-red" onclick="deleteLink(${link.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        linksList.appendChild(item);
    });

    if (window.sortableInstance) window.sortableInstance.destroy();
    
    window.sortableInstance = new Sortable(linksList, {
        animation: 150,
        handle: '.drag-handle',
        ghostClass: 'sortable-ghost',
        onEnd: async function () {
            await updateLinkOrder(); 
        }
    });
}

async function updateLinkOrder() {
    const items = document.querySelectorAll('.link-item');
    const updates = [];
    items.forEach((item, index) => {
        const id = item.getAttribute('data-id');
        updates.push({ id: parseInt(id), user_id: user.id, position: index });
    });
    
    await supabase.from('links').upsert(updates, { onConflict: 'id' });
    showToast('Urutan Disimpan', 'Susunan link berhasil diupdate.', 'success');
}

function sanitize(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

linkForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('linkTitle').value;
    const url = document.getElementById('linkUrl').value;
    let finalUrl = url;
    if (!/^https?:\/\//i.test(url)) finalUrl = 'https://' + url;

    const items = document.querySelectorAll('.link-item');
    const newPosition = items.length;

    const { error } = await supabase
        .from('links')
        .insert([{ user_id: user.id, title: title, url: finalUrl, position: newPosition }]);

    if (error) {
        showToast('Gagal', 'Gagal menambah link.', 'error');
    } else {
        closeLinkModal();
        linkForm.reset();
        loadLinks();
        showToast('Link Ditambahkan', 'Link baru berhasil muncul!', 'success');
    }
});

window.deleteLink = async (id) => {
    if (!confirm('Yakin mau hapus link ini?')) return;
    const { error } = await supabase.from('links').delete().eq('id', id);
    if (error) showToast('Error', 'Gagal menghapus link.', 'error');
    else {
        loadLinks();
        showToast('Terhapus', 'Link berhasil dihapus.', 'info');
    }
};

addLinkBtn.addEventListener('click', () => linkModal.classList.remove('hidden'));
closeModal.addEventListener('click', closeLinkModal);
function closeLinkModal() { linkModal.classList.add('hidden'); }
window.addEventListener('click', (e) => { if (e.target == linkModal) closeLinkModal(); });

logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
});