import { supabase } from './supabase.js';

// --- CEK LOCALHOST/LIVE SERVER (Opsional tapi disarankan) ---
if (window.location.protocol === 'file:') {
    console.warn("Sebaiknya gunakan Live Server agar fitur download berjalan lancar.");
}

// --- DOM ELEMENTS ---
const dom = {
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
    expInputList: document.getElementById('experienceInputList'),
    eduInputList: document.getElementById('educationInputList'),
    btns: {
        addExp: document.getElementById('addExpBtn'),
        addEdu: document.getElementById('addEduBtn'),
        download: document.getElementById('btnDownload'),
        logout: document.getElementById('logoutBtn'),
        menu: document.getElementById('hamburgerBtn'),
        dropdown: document.getElementById('dropdownMenu')
    },
    views: {
        photoBox: document.getElementById('viewPhotoBox'),
        photoImg: document.getElementById('viewPhoto'), // Kita pakai IMG lagi
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

let isProUser = false;
const MAX_FREE_DOWNLOADS = 2;

// --- INITIALIZATION ---
async function init() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return window.location.href = 'index.html';

        const { data: profile } = await supabase
            .from('profiles')
            .select('is_pro, full_name, email')
            .eq('id', session.user.id)
            .single();

        if (profile) {
            isProUser = profile.is_pro || false;
            if (profile.full_name && dom.inputs.name) dom.inputs.name.value = profile.full_name;
            if (profile.email && dom.inputs.email) dom.inputs.email.value = profile.email;
        }
    } catch (err) {
        console.error("Init Error:", err);
    }
}

function setupProStatus() {
    if (dom.watermark) {
        if (isProUser) {
            dom.watermark.style.setProperty('display', 'none', 'important');
        } else {
            dom.watermark.style.display = 'flex';
        }
    }
}

// --- FUNGSI CROP FOTO JADI KOTAK (ANTI GEPENG) ---
function cropImageSquare(imageSrc, callback) {
    const img = new Image();
    img.onload = function() {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height);
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Hitung posisi tengah (Center Crop)
        const offsetX = (img.width - size) / 2;
        const offsetY = (img.height - size) / 2;

        // Gambar ke canvas (Crop)
        ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);
        
        // Kembalikan Data URL
        callback(canvas.toDataURL('image/png'));
    };
    img.src = imageSrc;
}

// --- EVENT LISTENERS ---
Object.values(dom.inputs).forEach(input => {
    if(input) input.addEventListener('input', updateRealtimePreview);
});

// LOGIK FOTO BARU (Pake Crop Helper)
if(dom.photoInput) {
    dom.photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) return showAlert("Maksimal 2MB!", "error");
            
            const reader = new FileReader();
            reader.onload = (event) => {
                // Panggil fungsi crop dulu, baru tampilkan
                cropImageSquare(event.target.result, (croppedSrc) => {
                    dom.views.photoImg.src = croppedSrc;
                    dom.views.photoBox.classList.remove('hidden');
                });
            };
            reader.readAsDataURL(file);
            if(dom.photoLabelSpan) dom.photoLabelSpan.textContent = file.name;
        }
    });
}

if(dom.btns.addExp) dom.btns.addExp.addEventListener('click', () => addDynamicItem('exp'));
if(dom.btns.addEdu) dom.btns.addEdu.addEventListener('click', () => addDynamicItem('edu'));

document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        dom.canvas.className = `cv-canvas ${btn.dataset.theme}`;
    });
});

if(dom.btns.download) dom.btns.download.addEventListener('click', handleDownloadPDF);


// --- CORE LOGIC ---
function updateRealtimePreview() {
    const i = dom.inputs;
    const v = dom.views;

    if(v.name) v.name.textContent = i.name.value || 'Nama Lengkap';
    if(v.job) v.job.textContent = i.job.value || 'Posisi / Jabatan';
    
    updateContactItem(v.phone, i.phone.value, '<i class="fa-solid fa-phone"></i>');
    updateContactItem(v.email, i.email.value, '<i class="fa-solid fa-envelope"></i>');
    updateContactItem(v.loc, i.loc.value, '<i class="fa-solid fa-location-dot"></i>');
    updateContactItem(v.link, i.link.value, '<i class="fa-brands fa-linkedin"></i>');

    if(v.summary) v.summary.textContent = i.summary.value || 'Ringkasan singkat...';
    if(v.skills) v.skills.textContent = i.skills.value || '-';
    if(v.extras) v.extras.textContent = i.extras.value || '-';

    const secExtras = document.getElementById('secExtras');
    if(secExtras) secExtras.style.display = i.extras.value.trim() ? 'block' : 'none';
}

function updateContactItem(el, val, icon) {
    if(!el) return;
    if(val) { el.innerHTML = `${icon} ${val}`; el.style.display = 'inline-flex'; }
    else { el.style.display = 'none'; }
}

function addDynamicItem(type) {
    const container = type === 'exp' ? dom.expInputList : dom.eduInputList;
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    
    if (type === 'exp') {
        div.innerHTML = `
            <input type="text" class="d-role" placeholder="Jabatan" style="font-weight:600;">
            <input type="text" class="d-comp mt-2" placeholder="Perusahaan">
            <input type="text" class="d-date mt-2" placeholder="Tahun">
            <textarea class="d-desc mt-2" rows="2" placeholder="Deskripsi..."></textarea>
            <button class="btn-remove-item"><i class="fa-solid fa-xmark"></i></button>`;
    } else {
        div.innerHTML = `
            <input type="text" class="d-school" placeholder="Sekolah/Univ" style="font-weight:600;">
            <input type="text" class="d-degree mt-2" placeholder="Jurusan">
            <input type="text" class="d-year mt-2" placeholder="Tahun">
            <button class="btn-remove-item"><i class="fa-solid fa-xmark"></i></button>`;
    }

    div.querySelector('.btn-remove-item').addEventListener('click', () => { div.remove(); renderDynamic(type); });
    div.querySelectorAll('input, textarea').forEach(inp => inp.addEventListener('input', () => renderDynamic(type)));
    container.appendChild(div);
}

function renderDynamic(type) {
    const inputs = type === 'exp' ? dom.expInputList : dom.eduInputList;
    const view = type === 'exp' ? dom.views.expList : dom.views.eduList;
    let html = '';
    
    inputs.querySelectorAll('.dynamic-item').forEach(item => {
        if(type === 'exp') {
            const role = item.querySelector('.d-role').value;
            const comp = item.querySelector('.d-comp').value;
            const date = item.querySelector('.d-date').value;
            const desc = item.querySelector('.d-desc').value;
            if(role || comp) {
                html += `<div class="cv-list-item">
                    <div class="item-head"><span>${role}</span><span>${date}</span></div>
                    <div class="item-sub-head">${comp}</div>
                    <p class="section-content" style="margin-top:5px;">${desc.replace(/\n/g, '<br>')}</p>
                </div>`;
            }
        } else {
            const school = item.querySelector('.d-school').value;
            const degree = item.querySelector('.d-degree').value;
            const year = item.querySelector('.d-year').value;
            if(school || degree) {
                html += `<div class="cv-list-item">
                    <div class="item-head"><span>${school}</span><span>${year}</span></div>
                    <div class="item-sub-head">${degree}</div>
                </div>`;
            }
        }
    });
    view.innerHTML = html || `<p class="text-muted empty-state">- Belum ada data -</p>`;
}

// --- PDF DOWNLOAD ---
async function handleDownloadPDF() {
    if (!window.jspdf || !window.html2canvas) {
        return showAlert("Library PDF belum siap. Cek koneksi internet!", "error");
    }

    if (!isProUser) {
        const dlCount = parseInt(localStorage.getItem('sapa_cv_count') || '0');
        if (dlCount >= MAX_FREE_DOWNLOADS) return showAlert("Kuota Habis! Upgrade ke Pro.", "error");
        localStorage.setItem('sapa_cv_count', dlCount + 1);
    }

    const btn = dom.btns.download;
    const originalContent = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Proses...`;
    btn.disabled = true;

    try {
        window.scrollTo(0, 0);
        
        const canvas = await html2canvas(dom.canvas, {
            scale: 2,
            useCORS: true, 
            logging: false
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const w = pdf.internal.pageSize.getWidth();
        const h = pdf.internal.pageSize.getHeight();

        const imgProps = pdf.getImageProperties(imgData);
        const ratio = imgProps.width / imgProps.height;
        let finalH = w / ratio;

        if (finalH > h) finalH = h; 

        pdf.addImage(imgData, 'JPEG', 0, 0, w, finalH);
        
        const cleanName = (dom.inputs.name.value || 'CV_SAPA').replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_');
        pdf.save(`CV_${cleanName}.pdf`);
        
        showAlert("Berhasil Download!", "success");

    } catch (err) {
        console.error(err);
        showAlert("Gagal Download: " + err.message, "error");
    } finally {
        btn.innerHTML = originalContent;
        btn.disabled = false;
    }
}

function showAlert(msg, type) {
    if(!dom.alertBox) return;
    dom.alertBox.textContent = msg;
    dom.alertBox.className = `alert ${type}`;
    dom.alertBox.classList.remove('hidden');
    setTimeout(() => dom.alertBox.classList.add('hidden'), 4000);
}

// Nav
if(dom.btns.menu) dom.btns.menu.addEventListener('click', (e) => { e.stopPropagation(); dom.btns.dropdown.classList.toggle('hidden'); });
window.addEventListener('click', () => dom.btns.dropdown?.classList.add('hidden'));
if(dom.btns.logout) dom.btns.logout.addEventListener('click', async () => {
    await supabase.auth.signOut(); window.location.href = 'index.html';
});

init();