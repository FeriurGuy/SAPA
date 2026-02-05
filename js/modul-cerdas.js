import { supabase } from './supabase.js';

// ==========================================
// 1. KONFIGURASI & STATE
// ==========================================

const GEMINI_API_KEY = "AIzaSyAM6fBc26BAmwpiiRr_0KkuTbz1rbuZVds"; 

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
        copy: document.getElementById('btnCopy'),
        download: document.getElementById('btnDownload')
    },
    sections: {
        loading: document.getElementById('loadingSection'),
        result: document.getElementById('resultSection'),
        empty: document.getElementById('emptyState') // Kalau ada state kosong di HTML
    },
    output: {
        paper: document.getElementById('paperContent'),
        contentArea: document.getElementById('aiContentArea')
    },
    alert: document.getElementById('alert-box')
};

// ==========================================
// 2. INITIALIZATION (Cek Login)
// ==========================================
async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return window.location.href = 'index.html';
    
    // Auto-fill nama guru dari profil (kalau ada)
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', session.user.id).single();
    if (profile && profile.full_name) {
        dom.inputs.guru.value = profile.full_name;
    }
}
init();

// ==========================================
// 3. CORE LOGIC: GENERATE MODUL
// ==========================================
dom.btns.generate.addEventListener('click', async () => {
    // 1. Validasi Input
    const data = {
        guru: dom.inputs.guru.value.trim(),
        sekolah: dom.inputs.sekolah.value.trim(),
        mapel: dom.inputs.mapel.value.trim(),
        fase: dom.inputs.fase.value,
        topik: dom.inputs.topik.value.trim()
    };

    if (!data.guru || !data.sekolah || !data.mapel || !data.fase || !data.topik) {
        return showAlert("Harap lengkapi semua form input!", "error");
    }

    if (GEMINI_API_KEY === "ISI_API_KEY_GEMINI_DISINI") {
        return showAlert("API Key belum dipasang di script js/modul-cerdas.js", "error");
    }

    // 2. UI Loading State
    toggleLoading(true);

    // 3. Susun Prompt (Sama persis kayak logic Python kamu tapi versi JS)
    const prompt = `
        Berperanlah sebagai Ahli Kurikulum Pendidikan Indonesia (Kurikulum Merdeka).
        Buatkan "Modul Ajar" lengkap dan profesional.
        
        Data Guru:
        - Nama: ${data.guru}
        - Sekolah: ${data.sekolah}
        - Mapel: ${data.mapel}
        - Fase/Kelas: ${data.fase}
        - Topik Materi: ${data.topik}

        Instruksi Output:
        Gunakan format HTML yang rapi (h1, h2, h3, ul, li, p, table). 
        JANGAN gunakan markdown (\`\`\`). Langsung tag HTML saja.
        
        Struktur Modul Ajar:
        1. INFORMASI UMUM
           (Identitas, Kompetensi Awal, Profil Pelajar Pancasila, Sarana Prasarana, Target Peserta Didik, Model Pembelajaran)
        
        2. KOMPONEN INTI
           - Tujuan Pembelajaran (Buatkan 2-3 tujuan spesifik berdasarkan topik)
           - Pemahaman Bermakna
           - Pertanyaan Pemantik
           - Kegiatan Pembelajaran (Pendahuluan, Inti, Penutup - buat detail langkah-langkahnya)
           - Asesmen (Formatif & Sumatif)
           - Pengayaan & Remedial
        
        3. LAMPIRAN
           - LKPD (Lembar Kerja Peserta Didik - Buatkan contoh soal/aktivitas)
           - Bahan Bacaan Guru & Peserta Didik (Ringkasan materi singkat)
           - Glosarium
           - Daftar Pustaka (Buat referensi fiktif yang relevan)

        Gaya Bahasa: Formal, Edukatif, dan siap cetak.
    `;

    try {
        // 4. Panggil Gemini API
        const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const result = await aiResponse.json();
        
        // 5. Olah Hasil
        if (result.candidates && result.candidates[0].content) {
            let rawText = result.candidates[0].content.parts[0].text;
            
            // Bersihkan markdown kalau AI bandel masih kasih ```html
            let cleanHtml = rawText.replace(/```html/g, '').replace(/```/g, '');

            // Render ke Layar
            dom.output.contentArea.innerHTML = cleanHtml;
            
            // Sukses
            showAlert("Modul Ajar berhasil dibuat!", "success");
            toggleLoading(false);
            
            // Scroll ke bawah biar user lihat hasilnya
            document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth' });

        } else {
            throw new Error("Gagal mendapatkan respons dari AI.");
        }

    } catch (error) {
        console.error(error);
        showAlert("Terjadi kesalahan: " + error.message, "error");
        toggleLoading(false);
    }
});

// ==========================================
// 4. DOWNLOAD WORD (FITUR SPESIAL)
// ==========================================
dom.btns.download.addEventListener('click', () => {
    const content = dom.output.contentArea.innerHTML;
    
    if (!content) return showAlert("Belum ada materi untuk didownload.", "error");

    // Trik Header Word agar styling HTML terbawa
    const header = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' 
              xmlns:w='urn:schemas-microsoft-com:office:word' 
              xmlns='[http://www.w3.org/TR/REC-html40](http://www.w3.org/TR/REC-html40)'>
        <head><meta charset='utf-8'><title>Modul Ajar</title>
        <style>
            body { font-family: 'Times New Roman', serif; font-size: 12pt; }
            h1 { font-size: 16pt; font-weight: bold; text-align: center; }
            h2 { font-size: 14pt; border-bottom: 1px solid #000; margin-top: 20px; }
            h3 { font-size: 12pt; font-weight: bold; margin-top: 15px; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 10px; }
            td, th { border: 1px solid #000; padding: 5px; }
        </style>
        </head><body>`;
    
    const footer = "</body></html>";
    const sourceHTML = header + content + footer;

    // Convert ke Blob
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    
    // Trigger Download
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `Modul_Ajar_${dom.inputs.topik.value.replace(/[^a-zA-Z0-9]/g, '_')}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
    
    showAlert("File Word sedang didownload...", "success");
});

// ==========================================
// 5. COPY TEXT
// ==========================================
dom.btns.copy.addEventListener('click', () => {
    const text = dom.output.contentArea.innerText;
    navigator.clipboard.writeText(text).then(() => {
        showAlert("Teks berhasil disalin!", "success");
    });
});

// ==========================================
// 6. UTILITIES
// ==========================================
function toggleLoading(isLoading) {
    if (isLoading) {
        dom.sections.loading.classList.remove('hidden');
        dom.sections.result.classList.add('hidden');
        dom.btns.generate.disabled = true;
        dom.btns.generate.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sedang Berpikir...';
    } else {
        dom.sections.loading.classList.add('hidden');
        dom.sections.result.classList.remove('hidden');
        dom.btns.generate.disabled = false;
        dom.btns.generate.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Generate Modul Ajar';
    }
}

function showAlert(message, type = 'success') {
    dom.alert.textContent = message;
    dom.alert.className = `alert ${type}`;
    dom.alert.classList.remove('hidden');
    setTimeout(() => dom.alert.classList.add('hidden'), 4000);
}