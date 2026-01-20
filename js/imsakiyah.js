import { Adhan } from './adhan.js';

// --- CONFIG ---
// Koordinat Banda Aceh (Placeholder untuk Countdown Kiri)
const MY_LAT = 5.5483; 
const MY_LNG = 95.3238; 

const PRAYER_NAMES = {
    fajr: 'Subuh',
    dhuhr: 'Dzuhur',
    asr: 'Ashar',
    maghrib: 'Maghrib',
    isha: 'Isya'
};

const elCountdown = document.getElementById('countdown');
const elNextName = document.getElementById('nextPrayerName');
const elDate = document.getElementById('dateNow');

function initApp() {
    // 1. Hitung Jadwal Hari Ini (Untuk Widget Kiri)
    const prayer = new Adhan();
    prayer.setMethod('MWL');
    
    // Timezone 7 (WIB)
    const times = prayer.getTimes(new Date(), [MY_LAT, MY_LNG, 0], 7, 0, '24h');

    // 2. Isi Widget Kiri
    document.getElementById('time-fajr').innerText = times.fajr;
    document.getElementById('time-dhuhr').innerText = times.dhuhr;
    document.getElementById('time-asr').innerText = times.asr;
    document.getElementById('time-maghrib').innerText = times.maghrib;
    document.getElementById('time-isha').innerText = times.isha;
    
    // Tanggal
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    elDate.innerText = new Date().toLocaleDateString('id-ID', options);

    // 3. Jalankan Countdown
    startLiveTimer(times);
}

function startLiveTimer(times) {
    const parseTime = (strTime) => {
        const now = new Date();
        const [h, m] = strTime.split(':');
        const d = new Date(now);
        d.setHours(h, m, 0, 0);
        return d;
    };

    const prayerObj = {
        fajr: parseTime(times.fajr),
        dhuhr: parseTime(times.dhuhr),
        asr: parseTime(times.asr),
        maghrib: parseTime(times.maghrib),
        isha: parseTime(times.isha)
    };

    setInterval(() => {
        const now = new Date();
        let nextPrayerKey = null;
        let minDiff = Infinity;

        for (const [key, timeVal] of Object.entries(prayerObj)) {
            const diff = timeVal - now;
            if (diff > 0 && diff < minDiff) {
                minDiff = diff;
                nextPrayerKey = key;
            }
        }

        if (!nextPrayerKey) {
            // Kalau sudah lewat Isya, anggap target besok Subuh
            elCountdown.innerText = "Selesai"; 
            elNextName.innerText = "Istirahat";
            return;
        }

        // Update Text
        const h = Math.floor(minDiff / 3600000);
        const m = Math.floor((minDiff % 3600000) / 60000);
        const s = Math.floor((minDiff % 60000) / 1000);
        
        elCountdown.innerText = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        elNextName.innerText = PRAYER_NAMES[nextPrayerKey];

        // Highlight Row
        document.querySelectorAll('.today-list li').forEach(el => el.classList.remove('active'));
        const row = document.getElementById(`row-${nextPrayerKey}`);
        if(row) row.classList.add('active');

    }, 1000);
}

initApp();