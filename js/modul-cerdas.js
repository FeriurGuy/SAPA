import { supabase } from './supabase.js';
import { GEMINI_KEY } from './config.js'; 

const GEMINI_API_KEY = GEMINI_KEY;

const dom = {
    inputs: {
        guru: document.getElementById('guruName'),
        sekolah: document.getElementById('schoolName'),
        mapel: document.getElementById('mapel'),
        fase: document.getElementById('faseKelas'),
        topik: document.getElementById('topikMateri')
    },
    btns: {
        generate: document.getElementById('btnGenerate'),
        download: document.getElementById('btnDownload'),
        // Menu Navigasi Baru
        menu: document.getElementById('hamburgerBtn'),   
        dropdown: document.getElementById('dropdownMenu'), 
        logout: document.getElementById('logoutBtn')      
    },
    navUsername: document.getElementById('navUsername'),
    sections: {
        loading: document.getElementById('loadingSection'),
        result: document.getElementById('resultSection')
    },
    output: {
        paper: document.getElementById('paperContent'),
        contentArea: document.getElementById('aiContentArea')
    },
    alert: document.getElementById('alert-box')
};

// --- INITIALIZATION ---
async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return window.location.href = 'index.html';
    
    const { data: profile } = await supabase.from('profiles').select('full_name, username').eq('id', session.user.id).single();
    if (profile) {
        if (profile.full_name && dom.inputs.guru) dom.inputs.guru.value = profile.full_name;
        if (dom.navUsername && profile.username) dom.navUsername.textContent = '@' + profile.username;
    }
}
init();

// --- LOGIC HAMBURGER MENU ---
if (dom.btns.menu) {
    dom.btns.menu.addEventListener('click', (e) => {
        e.stopPropagation();
        dom.btns.dropdown.classList.toggle('hidden');
    });
}
window.addEventListener('click', (e) => {
    if (dom.btns.dropdown && !dom.btns.dropdown.classList.contains('hidden')) {
        if (!dom.btns.menu.contains(e.target) && !dom.btns.dropdown.contains(e.target)) {
            dom.btns.dropdown.classList.add('hidden');
        }
    }
});
if (dom.btns.logout) {
    dom.btns.logout.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    });
}

// --- LOGIC GENERATE AI (PROMPT APP.PY STRUCTURE) ---
if (dom.btns.generate) {
    dom.btns.generate.addEventListener('click', async () => {
        const data = {
            guru: dom.inputs.guru.value.trim(),
            sekolah: dom.inputs.sekolah.value.trim(),
            mapel: dom.inputs.mapel.value.trim(),
            fase: dom.inputs.fase.value,
            topik: dom.inputs.topik.value.trim()
        };

        if (!data.guru || !data.mapel || !data.topik) {
            return showAlert("Mohon lengkapi Nama Guru, Mapel, dan Topik!", "error");
        }

        toggleLoading(true);

        // PROMPT INI SAMA PERSIS DENGAN APP.PY SECARA STRUKTUR
        // Bedanya: Bagian 'Metode', 'Profil Pancasila', 'Alokasi Waktu' saya minta AI tentukan sendiri (Auto-fill)
        const prompt = `
            Bertindaklah sebagai Guru Profesional Kurikulum Merdeka.
            Buat Modul Ajar Lengkap.
            
            **DATA:**
            Penyusun: ${data.guru} | Sekolah: ${data.sekolah} | Jenjang/Fase: ${data.fase}
            Mata Pelajaran: ${data.mapel} | Topik: ${data.topik}

            **TUGAS AUTO-FILL (PENTING):**
            Karena user tidak mengisi detail ini, tentukanlah yang paling cocok dengan topik "${data.topik}":
            1. Alokasi Waktu (misal: 2 JP x 45 Menit)
            2. Elemen CP (misal: Menyimak - Berbicara, atau Membaca - Memirsa)
            3. Profil Pelajar Pancasila (Pilih 2-3 dimensi yang relevan)
            4. Metode Pembelajaran (misal: Problem Based Learning, Discovery Learning, dll)
            5. Capaian Pembelajaran (CP) Lengkap sesuai Fase ${data.fase}

            **INSTRUKSI FORMATTING (HTML ONLY):**
            1. JANGAN GUNAKAN MARKDOWN. Gunakan HTML murni.
            2. Gunakan tag <i> untuk tulisan miring (bahasa asing).
            3. Gunakan tag <table border="1" style="border-collapse: collapse; width: 100%; margin-bottom: 10px;">, <tr>, <th>, <td> untuk SEMUA tabel.
            4. Gunakan <ul> dan <li> untuk poin-poin.
            5. Gunakan <h2> dan <h3> untuk judul bab.
            
            **STRUKTUR ISI MODUL (Sesuai Standar App.py):**
            <h2>MODUL AJAR: ${data.topik.toUpperCase()}</h2>
            <hr>
            <h3>I. INFORMASI UMUM</h3>
            <p><strong>A. IDENTITAS MODUL</strong></p>
            <table>
                <tr><th width="30%">Informasi</th><th>Keterangan</th></tr>
                <tr><td>Penyusun</td><td>${data.guru}</td></tr>
                <tr><td>Instansi</td><td>${data.sekolah}</td></tr>
                <tr><td>Jenjang / Fase</td><td>${data.fase}</td></tr>
                <tr><td>Mata Pelajaran</td><td>${data.mapel}</td></tr>
                <tr><td>Alokasi Waktu</td><td>[Isi Otomatis]</td></tr>
                <tr><td>Elemen CP</td><td>[Isi Otomatis]</td></tr>
            </table>

            <p><strong>B. KOMPETENSI AWAL</strong></p>
            <p>(1 Paragraf singkat tentang prasyarat materi)</p>

            <p><strong>C. PROFIL PELAJAR PANCASILA</strong></p>
            <p>[Isi Otomatis]</p>

            <p><strong>D. SARANA DAN PRASARANA</strong></p>
            <ul><li>Laptop/Smartphone</li><li>Jaringan Internet</li><li>Sumber belajar: ${data.topik}</li></ul>

            <p><strong>E. MODEL PEMBELAJARAN</strong></p>
            <p>Tatap Muka dengan metode <strong>[Isi Otomatis]</strong>.</p>

            <h3>II. KOMPONEN INTI</h3>
            <p><strong>A. TUJUAN PEMBELAJARAN</strong></p>
            <p>1. <strong>Capaian Pembelajaran (CP):</strong> [Isi CP Lengkap disini]</p>
            <p>2. <strong>Tujuan Pembelajaran (TP):</strong></p>
            <ul>
                <li>[TP 1]</li>
                <li>[TP 2]</li>
                <li>[TP 3]</li>
            </ul>

            <p><strong>B. PEMAHAMAN BERMAKNA</strong></p>
            <p>(Manfaat mempelajari topik ini bagi kehidupan siswa)</p>

            <p><strong>C. KEGIATAN PEMBELAJARAN</strong></p>
            <table>
                <tr><th width="15%">Tahap</th><th width="70%">Deskripsi Kegiatan</th><th width="15%">Waktu</th></tr>
                <tr>
                    <td><strong>Pendahuluan</strong></td>
                    <td><ul><li>Salam & Doa</li><li>Apersepsi: Guru mengaitkan materi dengan pengalaman siswa.</li><li>Pertanyaan Pemantik</li></ul></td>
                    <td>10'</td>
                </tr>
                <tr>
                    <td><strong>Inti</strong></td>
                    <td>(Rincikan langkah pembelajaran sesuai metode [Isi Otomatis] disini. Gunakan poin-poin)</td>
                    <td>70'</td>
                </tr>
                <tr>
                    <td><strong>Penutup</strong></td>
                    <td><ul><li>Refleksi</li><li>Kesimpulan</li><li>Doa</li></ul></td>
                    <td>10'</td>
                </tr>
            </table>

            <h3>III. LAMPIRAN</h3>
            <p><strong>A. ASESMEN / PENILAIAN</strong></p>
            
            <p><strong>1. Penilaian Sikap</strong></p>
            <table>
                <tr><th width="20%">Aspek</th><th width="20%">Sangat Baik</th><th width="20%">Baik</th><th width="20%">Cukup</th><th width="20%">Kurang</th></tr>
                <tr>
                    <td>[Dimensi PPP]</td>
                    <td>...</td>
                    <td>...</td>
                    <td>...</td>
                    <td>...</td>
                </tr>
            </table>

            <p><strong>2. Penilaian Keterampilan</strong></p>
            <table>
                <tr><th width="30%">Aspek</th><th width="70%">Indikator</th></tr>
                <tr>
                    <td>Konten/Performa</td>
                    <td>(Deskripsi indikator penilaian)</td>
                </tr>
            </table>

            <p><strong>B. LEMBAR KERJA PESERTA DIDIK (LKPD)</strong></p>
            <p><strong>Activity 1: ${data.topik}</strong></p>
            <table>
                <tr><th width="10%">No</th><th width="50%">Pertanyaan / Instruksi</th><th width="40%">Jawaban</th></tr>
                <tr><td>1</td><td>(Buatkan pertanyaan pemahaman)</td><td>...</td></tr>
                <tr><td>2</td><td>(Buatkan pertanyaan analisis)</td><td>...</td></tr>
            </table>

            <p><strong>C. GLOSARIUM</strong></p>
            <ul><li>(Istilah 1): (Definisi)</li><li>(Istilah 2): (Definisi)</li></ul>

            <p><strong>D. DAFTAR PUSTAKA</strong></p>
            <ul>
                <li>Kementerian Pendidikan dan Kebudayaan. (2025). <em>Buku Guru ${data.mapel} ${data.fase}</em>. Jakarta: Kemendikbud.</li>
                <li>Sumber internet relevan tentang ${data.topik}.</li>
            </ul>
        `;

        try {
            // URL Model (Gemini 2.5 Flash - Sesuai Request)
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
            
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            // Handle Error Model Not Found (Otomatis Fallback ke 1.5)
            if (!response.ok) {
                const err = await response.json();
                if (response.status === 404 || (err.error && err.error.message.includes("not found"))) {
                    console.warn("⚠️ Model 2.5 tidak ketemu, mencoba fallback ke 1.5...");
                    return tryFallbackModel(prompt);
                }
                throw new Error(err.error?.message || "Gagal menghubungi AI");
            }

            const result = await response.json();
            processResult(result);

        } catch (error) {
            console.error("❌ ERROR:", error);
            showAlert("Error: " + error.message, "error");
            toggleLoading(false);
        }
    });
}

// --- FUNGSI FALLBACK (Jaga-jaga kalau 2.5 error) ---
async function tryFallbackModel(prompt) {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        
        const result = await response.json();
        if (result.error) throw new Error(result.error.message);
        processResult(result);
        
    } catch (err) {
        showAlert("Gagal: " + err.message, "error");
        toggleLoading(false);
    }
}

// --- OLAH HASIL ---
function processResult(result) {
    if (result.candidates && result.candidates[0].content) {
        const rawText = result.candidates[0].content.parts[0].text;
        const cleanHtml = rawText.replace(/```html/g, '').replace(/```/g, '');
        
        dom.output.contentArea.innerHTML = cleanHtml;
        toggleLoading(false);
        showAlert("Selesai! Modul siap.", "success");
        if(dom.sections.result) dom.sections.result.scrollIntoView({ behavior: 'smooth' });
        if(dom.btns.download) dom.btns.download.disabled = false;
    } else {
        throw new Error("AI tidak memberikan jawaban.");
    }
}

// --- DOWNLOAD WORD ---
if(dom.btns.download) {
    dom.btns.download.addEventListener('click', () => {
        const content = dom.output.contentArea.innerHTML;
        if (!content) return showAlert("Belum ada isi modul!", "error");

        const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Modul Ajar</title><style>body{font-family:'Times New Roman',serif;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #000;padding:5px;}</style></head><body>`;
        const footer = "</body></html>";
        const sourceHTML = header + content + footer;
        
        const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
        const fileDownload = document.createElement("a");
        document.body.appendChild(fileDownload);
        fileDownload.href = source;
        fileDownload.download = `Modul_${dom.inputs.topik.value.substring(0,20)}.doc`;
        fileDownload.click();
        document.body.removeChild(fileDownload);
    });
}

// --- UTILS ---
function toggleLoading(isLoading) {
    dom.sections.loading.classList.toggle('hidden', !isLoading);
    dom.sections.result.classList.toggle('hidden', isLoading);
    dom.btns.generate.disabled = isLoading;
    dom.btns.generate.innerHTML = isLoading ? '<i class="fa-solid fa-spinner fa-spin"></i> Proses...' : '<i class="fa-solid fa-wand-magic-sparkles"></i> Generate';
}

function showAlert(message, type = 'success') {
    if(dom.alert) {
        dom.alert.textContent = message;
        dom.alert.className = `alert ${type}`;
        dom.alert.classList.remove('hidden');
        setTimeout(() => dom.alert.classList.add('hidden'), 4000);
    }
}