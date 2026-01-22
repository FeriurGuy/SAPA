import { supabase } from './supabase.js';

// --- 1. LOGIC HAMBURGER MENU (Wajib Ada) ---
const hamburgerBtn = document.getElementById('hamburgerBtn');
const dropdownMenu = document.getElementById('dropdownMenu');
const logoutBtn = document.getElementById('logoutBtn');

if (hamburgerBtn && dropdownMenu) {
    hamburgerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('hidden');
    });

    window.addEventListener('click', (e) => {
        if (!hamburgerBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.add('hidden');
        }
    });
}
// Logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    });
}

// --- 2. CARD GENERATOR LOGIC ---
const inputs = {
    receiver: document.getElementById('inputReceiver'),
    message: document.getElementById('inputMessage'),
    sender: document.getElementById('inputSender')
};
const previews = {
    receiver: document.getElementById('prevReceiver'),
    message: document.getElementById('prevMessage'),
    sender: document.getElementById('prevSender')
};

const cardCanvas = document.getElementById('cardCanvas');
const themeOptions = document.querySelectorAll('.theme-opt');
const bgUploader = document.getElementById('bgUploader');
const resetBgBtn = document.getElementById('resetBgBtn');
const btnDownload = document.getElementById('btnDownload');
const btnShareWA = document.getElementById('btnShareWA');

// Realtime Text Update
Object.keys(inputs).forEach(key => {
    inputs[key].addEventListener('input', () => {
        const val = inputs[key].value;
        if(val.trim() === '') {
            // Default Values
            if(key === 'receiver') previews[key].innerText = 'Nama Penerima';
            if(key === 'message') previews[key].innerText = 'Tulis pesan ucapanmu di sini...';
            if(key === 'sender') previews[key].innerText = 'Nama Kamu';
        } else {
            previews[key].innerText = val;
        }
    });
});

// Theme Switcher
themeOptions.forEach(opt => {
    opt.addEventListener('click', () => {
        themeOptions.forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        
        const theme = opt.getAttribute('data-theme');
        // Reset class tapi pertahankan 'has-bg' kalo ada background image
        const hasBg = cardCanvas.classList.contains('has-bg');
        cardCanvas.className = `card-canvas ${theme} ${hasBg ? 'has-bg' : ''}`;
        
        // Ubah Judul Header sesuai tema
        const header = cardCanvas.querySelector('.card-header-text');
        if(theme === 'theme-ramadhan') header.innerText = 'Ramadhan Kareem';
        if(theme === 'theme-lebaran') header.innerText = 'Selamat Idul Fitri';
        if(theme === 'theme-cyber') header.innerText = 'System.Status = "FORGIVEN";';
        if(theme === 'theme-mudik') header.innerText = 'TIKET MUDIK 2026';
    });
});

// Logic Upload Background
bgUploader.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            cardCanvas.style.backgroundImage = `url('${evt.target.result}')`;
            cardCanvas.classList.add('has-bg');
            resetBgBtn.classList.remove('hidden');
        }
        reader.readAsDataURL(file);
    }
});

resetBgBtn.addEventListener('click', () => {
    cardCanvas.style.backgroundImage = '';
    cardCanvas.classList.remove('has-bg');
    resetBgBtn.classList.add('hidden');
    bgUploader.value = '';
});

// Logic Download Image
btnDownload.addEventListener('click', async () => {
    const oriHTML = btnDownload.innerHTML;
    btnDownload.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Rendering...';
    btnDownload.disabled = true;

    try {
        const canvas = await html2canvas(cardCanvas, {
            scale: 2, // High Resolution
            useCORS: true,
            allowTaint: true,
            backgroundColor: null // Transparent corner if border-radius used
        });

        const link = document.createElement('a');
        link.download = `SAPA-Card-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (err) {
        console.error(err);
        alert('Gagal render gambar. Coba refresh.');
    } finally {
        btnDownload.innerHTML = oriHTML;
        btnDownload.disabled = false;
    }
});

// Logic Share WA
btnShareWA.addEventListener('click', () => {
    const text = `*Untuk: ${inputs.receiver.value}*\n\n"${inputs.message.value}"\n\n- Dari: ${inputs.sender.value}\n\n(Buat kartumu di sapain.my.id)`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
});

// Update Theme Switcher text (Opsional: Tambahin console log ala cyber)
themeOptions.forEach(opt => {
    opt.addEventListener('click', () => {
        // ... (kode sebelumnya) ...
        
        if(theme === 'theme-cyber') header.innerText = 'System.out.println("Maaf Lahir Batin");';
        // ...
    });
});

// Auto-fill nama dari Supabase (Mirip Dashboard)
async function loadUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if(session) {
        const { data } = await supabase.from('profiles').select('full_name, username').eq('id', session.user.id).single();
        if(data) {
            const name = data.full_name || data.username;
            inputs.sender.value = name;
            previews.sender.innerText = name;
        }
    }
}
loadUser();