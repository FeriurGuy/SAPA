import { supabase } from './supabase.js';

// --- STATE ---
let user = null; // Menyimpan data user yang sedang login

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

// --- 1. INISIALISASI (Cek Login & Load Data) ---
async function init() {
    // Cek user login
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        window.location.href = 'login.html'; // Tendang kalau belum login
        return;
    }

    user = session.user;
    
    // Load Data Profil & Link
    await loadProfile();
    await loadLinks();
}

init();

// --- 2. LOGIC PROFIL ---

// A. Load Profil dari Database
async function loadProfile() {
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) throw error;

        // Isi Form dengan data dari DB
        document.getElementById('fullName').value = profile.full_name || '';
        document.getElementById('bio').value = profile.bio || '';
        document.getElementById('bgColor').value = profile.bg_color || '#ffffff';
        document.getElementById('colorValue').textContent = profile.bg_color || '#ffffff';
        navUsername.textContent = '@' + profile.username;

        // Set tombol preview (arahin ke profile.html?u=username)
        previewBtn.href = `profile.html?u=${profile.username}`;

        // Set Avatar kalau ada
        if (profile.avatar_url) {
             // Kita asumsikan avatar_url sudah Full URL public
            avatarPreview.style.backgroundImage = `url('${profile.avatar_url}')`;
        }

    } catch (error) {
        console.error('Gagal load profile:', error);
    }
}

// B. Simpan Perubahan Profil
profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = profileForm.querySelector('button');
    const originalText = btn.textContent;
    btn.textContent = 'Menyimpan...';

    const updates = {
        id: user.id,
        full_name: document.getElementById('fullName').value,
        bio: document.getElementById('bio').value,
        bg_color: document.getElementById('bgColor').value,
        updated_at: new Date()
    };

    const { error } = await supabase.from('profiles').upsert(updates);

    if (error) {
        alert('Gagal update: ' + error.message);
    } else {
        alert('Profil berhasil diupdate! 🎉');
    }
    btn.textContent = originalText;
});

// C. Upload Avatar (Langsung upload saat file dipilih)
avatarInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        // Ganti icon jadi loading (opsional, visual aja)
        avatarPreview.style.opacity = '0.5';

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        // 1. Upload ke Storage Bucket 'avatars'
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 2. Ambil Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        // 3. Simpan URL ke Tabel Profiles
        const { error: dbError } = await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', user.id);

        if (dbError) throw dbError;

        // 4. Update tampilan
        avatarPreview.style.backgroundImage = `url('${publicUrl}')`;
        alert('Foto profil baru terpasang! 📸');

    } catch (error) {
        alert('Gagal upload foto: ' + error.message);
        console.error(error);
    } finally {
        avatarPreview.style.opacity = '1';
    }
});

// Update label warna realtime
document.getElementById('bgColor').addEventListener('input', (e) => {
    document.getElementById('colorValue').textContent = e.target.value;
});


// --- 3. LOGIC LINK MANAGER ---

// A. Load Link
async function loadLinks() {
    linksList.innerHTML = '<p class="text-center">Loading...</p>';
    
    const { data: links, error } = await supabase
        .from('links')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }); // Nanti bisa ganti 'position'

    if (error) {
        console.error(error);
        return;
    }

    renderLinks(links);
}

// B. Render HTML List Link
function renderLinks(links) {
    linksList.innerHTML = '';

    if (links.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    links.forEach(link => {
        const item = document.createElement('div');
        item.className = 'link-item';
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
}

// Security: Mencegah XSS sederhana
function sanitize(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

// C. Tambah Link Baru
linkForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('linkTitle').value;
    const url = document.getElementById('linkUrl').value;

    // Pastikan URL ada https://
    let finalUrl = url;
    if (!/^https?:\/\//i.test(url)) {
        finalUrl = 'https://' + url;
    }

    const { error } = await supabase
        .from('links')
        .insert([{ user_id: user.id, title: title, url: finalUrl }]);

    if (error) {
        alert('Gagal nambah link');
    } else {
        closeLinkModal();
        linkForm.reset();
        loadLinks(); // Reload list
    }
});

// D. Hapus Link (Harus di-expose ke window karena dipanggil via onclick HTML)
window.deleteLink = async (id) => {
    if (!confirm('Yakin mau hapus link ini?')) return;

    const { error } = await supabase
        .from('links')
        .delete()
        .eq('id', id);

    if (error) alert('Gagal hapus');
    else loadLinks();
};


// --- 4. MODAL & UTILS ---

addLinkBtn.addEventListener('click', () => {
    linkModal.classList.remove('hidden');
});

closeModal.addEventListener('click', closeLinkModal);

function closeLinkModal() {
    linkModal.classList.add('hidden');
}

// Tutup modal kalau klik di luar kotak
window.addEventListener('click', (e) => {
    if (e.target == linkModal) closeLinkModal();
});

// Logout
logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
});