import { dom, init } from './cv-generator.js';
import { supabase } from './supabase.js';
import { GEMINI_KEY } from './config.js';

// ==========================================
// 1. CONFIG
// ==========================================
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
        download: document.getElementById('btnDownload')
    },
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

// ==========================================
// 2. INITIALIZATION
// ==========================================
async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return window.location.href = 'index.html';
    
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', session.user.id).single();
    if (profile && profile.full_name && dom.inputs.guru) {
        dom.inputs.guru.value = profile.full_name;
    }
}
init();

// ==========================================
// 3. GENERATE LOGIC
// ==========================================
if(dom.btns.generate) {
    dom.btns.generate.addEventListener('click', async () => {
        // Validasi
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

        // --- PROMPT ENGINEERING (SAMAKAN DENGAN APP.PY) ---
        const prompt = `
            Bertindaklah sebagai Guru Profesional Kurikulum Merdeka.
            Buatkan MODUL AJAR LENGKAP.
            
            DATA INPUT:
            - Penyusun: ${data.guru} | Sekolah: ${data.sekolah}
            - Mapel: ${data.mapel} | Fase/Kelas: ${data.fase}
            - Topik: ${data.topik}

            TUGAS AI (AUTO-FILL):
            Karena user tidak mengisi detail berikut, tolong tentukan yang paling cocok dengan topik:
            - Alokasi Waktu (misal: 2 JP x 45 menit)
            - Elemen CP (misal: Membaca - Memirsa)
            - Profil Pelajar Pancasila (misal: Mandiri, Bernalar Kritis)
            - Metode Pembelajaran (misal: Problem Based Learning / Discovery Learning)
            - Capaian Pembelajaran (CP) sesuai Fase

            INSTRUKSI FORMATTING (HTML ONLY):
            1. JANGAN GUNAKAN MARKDOWN. Gunakan HTML murni.
            2. Gunakan tag <table>, <tr>, <th>, <td> (border="1") untuk tabel.
            3. Gunakan <ul> dan <li> untuk poin.
            4. Gunakan <h2> dan <h3> untuk judul.
            5. Gunakan <i> untuk istilah asing.
            
            STRUKTUR ISI MODUL (WAJIB IKUTI INI):
            <h2>MODUL AJAR: ${data.topik.toUpperCase()}</h2>
            <hr>
            <h3>I. INFORMASI UMUM</h3>
            <p><strong>A. IDENTITAS MODUL</strong></p>
            <table border="1" style="border-collapse: collapse; width: 100%;">
                <tr><th width="30%">Informasi</th><th>Keterangan</th></tr>
                <tr><td>Penyusun</td><td>${data.guru}</td></tr>
                <tr><td>Instansi</td><td>${data.sekolah}</td></tr>
                <tr><td>Jenjang / Kelas</td><td>${data.fase}</td></tr>
                <tr><td>Alokasi Waktu</td><td>[Isi Alokasi Waktu]</td></tr>
                <tr><td>Mata Pelajaran</td><td>${data.mapel}</td></tr>
                <tr><td>Elemen</td><td>[Isi Elemen CP]</td></tr>
            </table>

            <p><strong>B. KOMPETENSI AWAL</strong></p>
            <p>[Tuliskan 1 paragraf singkat kompetensi awal]</p>

            <p><strong>C. PROFIL PELAJAR PANCASILA</strong></p>
            <p>[Isi Profil Pelajar Pancasila]</p>

            <p><strong>D. SARANA DAN PRASARANA</strong></p>
            <ul>
                <li>Laptop/Smartphone</li>
                <li>Jaringan Internet</li>
                <li>Materi/Sumber Belajar ${data.topik}</li>
            </ul>

            <p><strong>E. MODEL PEMBELAJARAN</strong></p>
            <p>Tatap Muka dengan metode <strong>[Isi Metode Pembelajaran]</strong>.</p>

            <h3>II. KOMPONEN INTI</h3>
            <p><strong>A. TUJUAN PEMBELAJARAN</strong></p>
            <p>1. <strong>Capaian Pembelajaran (CP):</strong> [Tuliskan CP Lengkap]</p>
            <p>2. <strong>Tujuan Pembelajaran (TP):</strong></p>
            <ul>
                <li>[TP 1]</li>
                <li>[TP 2]</li>
                <li>[TP 3]</li>
            </ul>

            <p><strong>B. PEMAHAMAN BERMAKNA</strong></p>
            <p>[Isi Pemahaman Bermakna]</p>

            <p><strong>C. KEGIATAN PEMBELAJARAN</strong></p>
            <table border="1" style="border-collapse: collapse; width: 100%;">
                <tr><th width="15%">Tahap</th><th width="70%">Deskripsi Kegiatan</th><th width="15%">Waktu</th></tr>
                <tr>
                    <td><strong>Pendahuluan</strong></td>
                    <td><ul><li>Salam & Doa</li><li>Apersepsi terkait ${data.topik}</li><li>Pertanyaan Pemantik</li></ul></td>
                    <td>10'</td>
                </tr>
                <tr>
                    <td><strong>Inti</strong></td>
                    <td>[Rincikan langkah pembelajaran sesuai metode yang dipilih. Gunakan poin-poin]</td>
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
            <table border="1" style="border-collapse: collapse; width: 100%;">
                <tr><th>Aspek</th><th>Skor 4 (Sangat Baik)</th><th>Skor 3 (Baik)</th><th>Skor 2 (Cukup)</th><th>Skor 1 (Kurang)</th></tr>
                <tr>
                    <td>[Aspek Sikap]</td>
                    <td>Sangat aktif...</td>
                    <td>Aktif...</td>
                    <td>Cukup aktif...</td>
                    <td>Kurang aktif...</td>
                </tr>
            </table>

            <p><strong>2. Penilaian Keterampilan</strong></p>
            <table border="1" style="border-collapse: collapse; width: 100%;">
                <tr><th>Aspek</th><th>Indikator</th></tr>
                <tr>
                    <td>Konten/Materi</td>
                    <td>[Indikator Penilaian]</td>
                </tr>
            </table>

            <p><strong>B. LEMBAR KERJA PESERTA DIDIK (LKPD)</strong></p>
            <p><strong>Activity: ${data.topik}</strong></p>
            <table border="1" style="border-collapse: collapse; width: 100%;">
                <tr><th width="10%">No</th><th width="50%">Pertanyaan / Instruksi</th><th width="40%">Jawaban</th></tr>
                <tr><td>1</td><td>[Buat Pertanyaan Pemahaman 1]</td><td>...</td></tr>
                <tr><td>2</td><td>[Buat Pertanyaan Analisis 2]</td><td>...</td></tr>
            </table>

            <p><strong>C. GLOSARIUM</strong></p>
            <ul><li>[Istilah 1]: [Definisi]</li><li>[Istilah 2]: [Definisi]</li></ul>

            <p><strong>D. DAFTAR PUSTAKA</strong></p>
            <ul>
                <li>Kementerian Pendidikan dan Kebudayaan. (2025). <em>Buku Panduan Guru ${data.mapel} ${data.fase}</em>. Jakarta: Kemendikbud.</li>
                <li>Sumber relevan tentang ${data.topik}.</li>
            </ul>
        `;

        try {
            // URL Model Gemini 2.5 Flash
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
            
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            if (!response.ok) {
                const err = await response.json();
                
                // Fallback otomatis ke 1.5 kalau 2.5 gagal
                if (response.status === 404 || (err.error && err.error.message.includes("not found"))) {
                    return tryFallbackModel(prompt);
                }
                throw new Error(err.error?.message || "Gagal menghubungi AI");
            }

            const result = await response.json();
            processResult(result);

        } catch (error) {
            showAlert("Error: " + error.message, "error");
            toggleLoading(false);
        }
    });
}

// Fallback Function (Jaga-jaga)
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
        showAlert("Gagal Generate: " + err.message, "error");
        toggleLoading(false);
    }
}

// Olah Hasil & Render
function processResult(result) {
    if (result.candidates && result.candidates[0].content) {
        const rawText = result.candidates[0].content.parts[0].text;
        const cleanHtml = rawText.replace(/```html/g, '').replace(/```/g, '');
        
        dom.output.contentArea.innerHTML = cleanHtml;
        toggleLoading(false);
        showAlert("Modul Ajar Selesai!", "success");
        if(dom.sections.result) dom.sections.result.scrollIntoView({ behavior: 'smooth' });
        if(dom.btns.download) dom.btns.download.disabled = false;
    } else {
        throw new Error("AI tidak memberikan jawaban.");
    }
}

// Download Word
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

// Helpers
function toggleLoading(isLoading) {
    if (isLoading) {
        if(dom.sections.loading) dom.sections.loading.classList.remove('hidden');
        if(dom.sections.result) dom.sections.result.classList.add('hidden');
        if(dom.btns.generate) {
            dom.btns.generate.disabled = true;
            dom.btns.generate.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sedang Proses...';
        }
    } else {
        if(dom.sections.loading) dom.sections.loading.classList.add('hidden');
        if(dom.sections.result) dom.sections.result.classList.remove('hidden');
        if(dom.btns.generate) {
            dom.btns.generate.disabled = false;
            dom.btns.generate.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Generate Lagi';
        }
    }
}

function showAlert(message, type = 'success') {
    if(dom.alert) {
        dom.alert.textContent = message;
        dom.alert.className = `alert ${type}`;
        dom.alert.classList.remove('hidden');
        setTimeout(() => dom.alert.classList.add('hidden'), 4000);
    }
}

if(dom.btns.menu) dom.btns.menu.addEventListener('click', (e) => { e.stopPropagation(); dom.btns.dropdown.classList.toggle('hidden'); });
window.addEventListener('click', () => dom.btns.dropdown?.classList.add('hidden'));
if(dom.btns.logout) dom.btns.logout.addEventListener('click', async () => {
    await supabase.auth.signOut(); window.location.href = 'index.html';
});

init();
