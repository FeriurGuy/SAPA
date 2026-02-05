import { supabase } from './supabase.js';

// --- STATE & CONFIG ---
let isProUser = false;
const MAX_FREE_DOWNLOADS = 2;

// --- DOM ELEMENTS ---
const dom = {
    // Inputs
    photoInput: document.getElementById('inputPhoto'),
    photoLabelSpan: document.getElementById('photoFileName'),
    inputs: {
        name: document.getElementById('inputName'),
        job: document.getElementById('inputJob'),
        phone: document.getElementById('inputPhone'),
        email: document.getElementById('inputEmail'),
        loc: document.getElementById('inputLoc'),
        link: document.getElementById('inputLink'),
        summary: document.getElementById('inputSummary'),
        skills: document.getElementById('inputSkills'),
        extras: document.getElementById('inputExtras')
    },
    // Dynamic Containers
    expInputList: document.getElementById('experienceInputList'),
    eduInputList: document.getElementById('educationInputList'),
    // Buttons
    btns: {
        addExp: document.getElementById('addExpBtn'),
        addEdu: document.getElementById('addEduBtn'),
        download: document.getElementById('btnDownload'),
        logout: document.getElementById('logoutBtn'),
        menu: document.getElementById('hamburgerBtn'),
        dropdown: document.getElementById('dropdownMenu')
    },
    // Preview Elements
    views: {
        photoBox: document.getElementById('viewPhotoBox'),
        photoImg: document.getElementById('viewPhoto'),
        name: document.getElementById('viewName'),
        job: document.getElementById('viewJob'),
        phone: document.getElementById('viewPhone'),
        email: document.getElementById('viewEmail'),
        loc: document.getElementById('viewLoc'),
        link: document.getElementById('viewLink'),
        summary: document.getElementById('viewSummary'),
        expList: document.getElementById('viewExpList'),
        eduList: document.getElementById('viewEduList'),
        skills: document.getElementById('viewSkills'),
        extras: document.getElementById('viewExtras')
    },
    canvas: document.getElementById('cvCanvas'),
    watermark: document.getElementById('watermark'),
    alertBox: document.getElementById('alert-box')
};

// --- INITIALIZATION ---
async function init() {
    // 1. Cek Session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return window.location.href = 'index.html';

    // 2. Ambil Data User Profile
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('is_pro, full_name, email')
            .eq('id', session.user.id)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;

        if (profile) {
            isProUser = profile.is_pro || false;
            // Auto-fill basic info jika ada
            if (profile.full_name) dom.inputs.name.value = profile.full_name;
            if (profile.email) dom.inputs.email.value = profile.email;
        }

        // 3. Atur Status Pro/Free
        setupProStatus();
        // 4. Update Preview Awal
        updateRealtimePreview();

    } catch (err) {
        console.error("Init Error:", err);
        showAlert("Gagal memuat data profil.", "error");
    }
}

function setupProStatus() {
    if (isProUser) {
        dom.watermark.classList.add('hidden');
    } else {
        dom.watermark.classList.remove('hidden');
    }
}

// --- EVENT LISTENERS ---

// 1. Realtime Text Input Update
Object.values(dom.inputs).forEach(input => {
    input.addEventListener('input', updateRealtimePreview);
});

// 2. Photo Upload Handler
dom.photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 2 * 1024 * 1024) { // Max 2MB
            showAlert("Ukuran foto maksimal 2MB.", "error");
            dom.photoInput.value = '';
            dom.photoLabelSpan.textContent = "Belum ada foto dipilih";
            dom.views.photoBox.classList.add('hidden');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            dom.views.photoImg.src = event.target.result;
            dom.views.photoBox.classList.remove('hidden'); // Tampilkan box foto
        };
        reader.readAsDataURL(file);
        dom.photoLabelSpan.textContent = file.name; // Update nama file di label
    } else {
        dom.views.photoBox.classList.add('hidden');
        dom.photoLabelSpan.textContent = "Belum ada foto dipilih";
    }
});

// 3. Dynamic Items Buttons
dom.btns.addExp.addEventListener('click', () => addDynamicItem('exp'));
dom.btns.addEdu.addEventListener('click', () => addDynamicItem('edu'));

// 4. Theme Switcher
document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // Reset class dan tambah tema yang dipilih
        dom.canvas.className = `cv-canvas ${btn.dataset.theme}`;
    });
});

// 5. Download PDF Handler
dom.btns.download.addEventListener('click', handleDownloadPDF);


// --- CORE FUNCTIONS ---

function updateRealtimePreview() {
    const i = dom.inputs;
    const v = dom.views;

    v.name.textContent = i.name.value || 'Nama Lengkap Anda';
    v.job.textContent = i.job.value || 'Target Posisi / Jabatan';
    
    // Update Kontak dengan Icon
    updateContactItem(v.phone, i.phone.value, '<i class="fa-solid fa-phone"></i>');
    updateContactItem(v.email, i.email.value, '<i class="fa-solid fa-envelope"></i>');
    updateContactItem(v.loc, i.loc.value, '<i class="fa-solid fa-location-dot"></i>');
    updateContactItem(v.link, i.link.value, '<i class="fa-brands fa-linkedin"></i>');

    v.summary.textContent = i.summary.value || 'Ringkasan singkat mengenai pengalaman, kualifikasi, dan tujuan karier Anda akan muncul di sini.';
    v.skills.textContent = i.skills.value || '-';
    v.extras.textContent = i.extras.value || '-';

    // Hide section if empty
    document.getElementById('secExtras').style.display = i.extras.value.trim() ? 'block' : 'none';
}

function updateContactItem(element, value, iconHtml) {
    if (value) {
        element.innerHTML = `${iconHtml} ${value}`;
        element.style.display = 'inline-flex';
    } else {
        element.style.display = 'none';
    }
}

// Fungsi untuk menambah input dinamis (Pengalaman & Pendidikan)
function addDynamicItem(type) {
    const container = type === 'exp' ? dom.expInputList : dom.eduInputList;
    const div = document.createElement('div');
    div.className = 'dynamic-item';

    let htmlContent = '';
    if (type === 'exp') {
        htmlContent = `
            <input type="text" class="d-role" placeholder="Jabatan (ex: Frontend Dev)" style="font-weight:600;">
            <input type="text" class="d-comp mt-2" placeholder="Perusahaan">
            <input type="text" class="d-date mt-2" placeholder="Periode (ex: Jan 2020 - Des 2022)">
            <textarea class="d-desc mt-2" rows="3" placeholder="Deskripsi pekerjaan/pencapaian..."></textarea>
        `;
    } else {
        htmlContent = `
            <input type="text" class="d-school" placeholder="Nama Sekolah/Universitas" style="font-weight:600;">
            <input type="text" class="d-degree mt-2" placeholder="Gelar/Jurusan">
            <input type="text" class="d-year mt-2" placeholder="Tahun Lulus/Periode">
        `;
    }

    // Tombol Hapus yang Baru
    div.innerHTML = `${htmlContent}<button class="btn-remove-item"><i class="fa-solid fa-xmark"></i></button>`;
    
    // Event Listener untuk Hapus dan Update
    div.querySelector('.btn-remove-item').addEventListener('click', () => {
        div.remove();
        renderDynamicPreview(type);
    });
    div.querySelectorAll('input, textarea').forEach(inp => {
        inp.addEventListener('input', () => renderDynamicPreview(type));
    });

    container.appendChild(div);
}

// Fungsi untuk merender list di preview berdasarkan input
function renderDynamicPreview(type) {
    const inputContainer = type === 'exp' ? dom.expInputList : dom.eduInputList;
    const viewContainer = type === 'exp' ? dom.views.expList : dom.views.eduList;
    let htmlOutput = '';
    let hasItem = false;

    inputContainer.querySelectorAll('.dynamic-item').forEach(item => {
        if (type === 'exp') {
            const role = item.querySelector('.d-role').value;
            const comp = item.querySelector('.d-comp').value;
            const date = item.querySelector('.d-date').value;
            const desc = item.querySelector('.d-desc').value;
            if(role || comp) {
                hasItem = true;
                htmlOutput += `
                    <div class="cv-list-item">
                        <div class="item-head"><span>${role}</span><span>${date}</span></div>
                        <div class="item-sub-head">${comp}</div>
                        <p class="item-desc section-content">${desc}</p>
                    </div>`;
            }
        } else {
            const school = item.querySelector('.d-school').value;
            const degree = item.querySelector('.d-degree').value;
            const year = item.querySelector('.d-year').value;
             if(school || degree) {
                hasItem = true;
                htmlOutput += `
                    <div class="cv-list-item">
                        <div class="item-head"><span>${school}</span><span>${year}</span></div>
                        <div class="item-sub-head">${degree}</div>
                    </div>`;
             }
        }
    });

    viewContainer.innerHTML = hasItem ? htmlOutput : `<p class="text-muted empty-state">- Belum ada ${type === 'exp' ? 'pengalaman kerja' : 'pendidikan'} ditambahkan -</p>`;
}


async function handleDownloadPDF() {
    // 1. Cek Limit untuk Free User
    if (!isProUser) {
        const dlCount = parseInt(localStorage.getItem('sapa_cv_count') || '0');
        if (dlCount >= MAX_FREE_DOWNLOADS) {
            return showAlert(`Kuota download gratis habis (${MAX_FREE_DOWNLOADS}/${MAX_FREE_DOWNLOADS}). Upgrade ke PRO untuk unlimited!`, "error");
        }
        localStorage.setItem('sapa_cv_count', dlCount + 1);
    }

    // 2. Proses Rendering PDF
    const btn = dom.btns.download;
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
    btn.disabled = true;

    try {
        window.scrollTo(0, 0); // Scroll ke atas agar capture tidak terpotong
        
        // Opsi html2canvas yang dioptimalkan untuk kualitas
        const canvas = await html2canvas(dom.canvas, {
            scale: 2, // Kualitas retina (2x)
            useCORS: true, // Izinkan gambar eksternal jika ada
            logging: false,
            windowWidth: dom.canvas.scrollWidth,
            windowHeight: dom.canvas.scrollHeight
        });

        const imgData = canvas.toDataURL('image/jpeg', 1.0); // Gunakan JPEG kualitas max
        const { jsPDF } = window.jspdf;
        // Setup PDF A4 Portrait
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
        const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

        // Hitung rasio agar gambar pas di kertas A4 tanpa distorsi
        const imgProps = pdf.getImageProperties(imgData);
        const ratio = imgProps.width / imgProps.height;
        let renderWidth = pdfWidth;
        let renderHeight = pdfWidth / ratio;

        // Jika hasil capture lebih tinggi dari A4 (jarang terjadi jika CSS benar), sesuaikan
        if (renderHeight > pdfHeight) {
             renderHeight = pdfHeight;
             renderWidth = pdfHeight * ratio;
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, renderWidth, renderHeight);
        
        // Nama file format: CV_NamaLengkap.pdf
        const fileName = `CV_${(dom.inputs.name.value || 'SAPA').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        pdf.save(fileName);

        if(!isProUser) {
            showAlert("Berhasil download! Sisa kuota gratis: " + (MAX_FREE_DOWNLOADS - (parseInt(localStorage.getItem('sapa_cv_count')))), "success");
        } else {
            showAlert("CV berhasil diunduh!", "success");
        }

    } catch (error) {
        console.error("PDF Error:", error);
        showAlert("Gagal membuat PDF. Silakan coba lagi atau refresh halaman.", "error");
    } finally {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
    }
}


// --- UTILITY: ALERT ---
function showAlert(message, type = 'success') {
    dom.alertBox.textContent = message;
    dom.alertBox.className = `alert ${type}`;
    dom.alertBox.classList.remove('hidden');
    setTimeout(() => dom.alertBox.classList.add('hidden'), 4000);
}

// --- NAV HANDLER (Mobile Menu & Logout) ---
dom.btns.menu?.addEventListener('click', (e) => { e.stopPropagation(); dom.btns.dropdown.classList.toggle('hidden'); });
window.addEventListener('click', () => dom.btns.dropdown?.classList.add('hidden'));
dom.btns.logout?.addEventListener('click', async () => {
    await supabase.auth.signOut(); window.location.href = 'index.html';
});

// --- START ---
init();