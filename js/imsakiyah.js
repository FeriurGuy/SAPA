import { supabase } from './supabase.js';

// ==========================================
// 1. LOGIKA HAMBURGER MENU (PRIORITAS UTAMA)
// ==========================================
// Kode ini ditaruh paling atas & tanpa ketergantungan library lain
const hamburgerBtn = document.getElementById('hamburgerBtn');
const dropdownMenu = document.getElementById('dropdownMenu');
const logoutBtn = document.getElementById('logoutBtn');
const navUsername = document.getElementById('navUsername');

// Debugging: Cek apakah elemen ditemukan
if (!hamburgerBtn) console.error("Hamburger Button not found!");
if (!dropdownMenu) console.error("Dropdown Menu not found!");

if (hamburgerBtn && dropdownMenu) {
    hamburgerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('hidden');
        console.log("Hamburger clicked!"); // Cek di console kalau diklik
    });

    window.addEventListener('click', (e) => {
        if (!hamburgerBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.add('hidden');
        }
    });
}

// Active State Menu
const currentPath = window.location.pathname;
document.querySelectorAll('.dropdown-item').forEach(link => {
    const href = link.getAttribute('href');
    if (href && currentPath.includes(href.replace('.html', ''))) {
        link.classList.add('active');
    }
});

// Logout Logic
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    });
}

// Cek User Login
async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && navUsername) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single();
        if (profile) navUsername.innerText = '@' + profile.username;
    }
}
checkUser();


// ==========================================
// 2. LIBRARY ADHAN (INLINE / LANGSUNG DISINI)
// ==========================================
// Kita taruh kodenya disini supaya tidak perlu import file luar (Anti-Error)
const AdhanLibrary = (function() {
    var v=Object.defineProperty,c=(t,i,s)=>i in t?v(t,i,{enumerable:!0,configurable:!0,writable:!0,value:s}):t[i]=s,u=(t,i,s)=>(c(t,"symbol"!=typeof i?i+"":i,s),s);const f=class{constructor(){u(this,"calcMethod","MWL"),u(this,"setting",{imsak:"10 min",dhuhr:"0 min",asr:"Standard",highLats:"NightMiddle",fajr:18,isha:17,maghrib:"0 min",midnight:"Standard"}),u(this,"timeFormat","24h"),u(this,"timeSuffixes",["am","pm"]),u(this,"invalidTime","-----"),u(this,"numIterations",1),u(this,"offset",{imsak:0,fajr:0,sunrise:0,dhuhr:0,asr:0,sunset:0,maghrib:0,isha:0,midnight:0}),u(this,"lat"),u(this,"lng"),u(this,"elv"),u(this,"timeZone"),u(this,"jDate")}setMethod(t){f.methods[t]&&(this.adjust(f.methods[t].params),this.calcMethod=t)}adjust(t){let i;for(i in t)this.setting[i]=t[i]||this.setting[i]}tune(t){let i;for(i in t)this.offset[i]=t[i]||this.offset[i]}getMethod(){return this.calcMethod}getSetting(){return this.setting}getOffsets(){return this.offset}getDefaults(){return f.methods}getTimes(t,i,s,a,e){return this.lat=i[0],this.lng=i[1],this.elv=i[2]||0,this.timeFormat=e||this.timeFormat,t instanceof Date&&(t=[t.getFullYear(),t.getMonth()+1,t.getDate()]),(typeof s>"u"||"auto"===s)&&(s=this.getTimeZone(t)),(typeof a>"u"||"auto"===a)&&(a=this.getDst(t)),this.timeZone=1*s+(1*a?1:0),this.jDate=this.julian(t[0],t[1],t[2])-this.lng/360,this.computeTimes()}getFormattedTime(t,i,s){if(isNaN(t))return this.invalidTime;if("Float"==i)return t;s=s||this.timeSuffixes,t=n.fixHour(t+.5/60);var a=Math.floor(t),e=Math.floor(60*(t-a)),r="12h"==i?s[a<12?0:1]:"";return("24h"==i?this.twoDigitsFormat(a):(a+12-1)%12+1)+":"+this.twoDigitsFormat(e)+(r?" "+r:"")}midDay(t){var i=this.sunPosition(this.jDate+t).equation;return n.fixHour(12-i)}sunAngleTime(t,i,s){var a=this.sunPosition(this.jDate+i).declination,e=this.midDay(i),r=1/15*n.arccos((-n.sin(t)-n.sin(a)*n.sin(this.lat))/(n.cos(a)*n.cos(this.lat)));return e+("ccw"==s?-r:r)}asrTime(t,i){var s=this.sunPosition(this.jDate+i).declination,a=-n.arccot(t+n.tan(Math.abs(this.lat-s)));return this.sunAngleTime(a,i)}sunPosition(t){var i=t-2451545,s=n.fixAngle(357.529+.98560028*i),a=n.fixAngle(280.459+.98564736*i),e=n.fixAngle(a+1.915*n.sin(s)+.02*n.sin(2*s)),r=23.439-36e-8*i,h=n.arctan2(n.cos(r)*n.sin(e),n.cos(e))/15,m=a/15-n.fixHour(h);return{declination:n.arcsin(n.sin(r)*n.sin(e)),equation:m}}julian(t,i,s){i<=2&&(t-=1,i+=12);var a=Math.floor(t/100),e=2-a+Math.floor(a/4);return Math.floor(365.25*(t+4716))+Math.floor(30.6001*(i+1))+s+e-1524.5}computePrayerTimes(t){t=this.dayPortion(t);var i=this.setting;return{imsak:this.sunAngleTime(this.eval(i.imsak),t.imsak,"ccw"),fajr:this.sunAngleTime(this.eval(i.fajr),t.fajr,"ccw"),sunrise:this.sunAngleTime(this.riseSetAngle(),t.sunrise,"ccw"),dhuhr:this.midDay(t.dhuhr),asr:this.asrTime(this.asrFactor(i.asr),t.asr),sunset:this.sunAngleTime(this.riseSetAngle(),t.sunset),maghrib:this.sunAngleTime(this.eval(i.maghrib),t.maghrib),isha:this.sunAngleTime(this.eval(i.isha),t.isha)}}computeTimes(){for(var t={imsak:5,fajr:5,sunrise:6,dhuhr:12,asr:13,sunset:18,maghrib:18,isha:18},i=1;i<=this.numIterations;i++)t=this.computePrayerTimes(t);return(t=this.adjustTimes(t)).midnight="Jafari"==this.setting.midnight?t.sunset+this.timeDiff(t.sunset,t.fajr)/2:t.sunset+this.timeDiff(t.sunset,t.sunrise)/2,t=this.tuneTimes(t),this.modifyFormats(t)}adjustTimes(t){var i=this.setting;let s;for(s in t)t[s]+=this.timeZone-this.lng/15;return"None"!=i.highLats&&(t=this.adjustHighLats(t)),this.isMin(i.imsak)&&(t.imsak=t.fajr-this.eval(i.imsak)/60),this.isMin(i.maghrib)&&(t.maghrib=t.sunset+this.eval(i.maghrib)/60),this.isMin(i.isha)&&(t.isha=t.maghrib+this.eval(i.isha)/60),t.dhuhr+=this.eval(i.dhuhr)/60,t}asrFactor(t){return{Standard:1,Hanafi:2}[t]||this.eval(t)}riseSetAngle(){return.833+.0347*Math.sqrt(this.elv)}tuneTimes(t){let i;for(i in t)t[i]+=this.offset[i]/60;return t}modifyFormats(t){let i;for(i in t)t[i]=this.getFormattedTime(t[i],this.timeFormat);return t}adjustHighLats(t){var i=this.setting,s=this.timeDiff(t.sunset,t.sunrise);return t.imsak=this.adjustHLTime(t.imsak,t.sunrise,this.eval(i.imsak),s,"ccw"),t.fajr=this.adjustHLTime(t.fajr,t.sunrise,this.eval(i.fajr),s,"ccw"),t.isha=this.adjustHLTime(t.isha,t.sunset,this.eval(i.isha),s),t.maghrib=this.adjustHLTime(t.maghrib,t.sunset,this.eval(i.maghrib),s),t}adjustHLTime(t,i,s,a,e){var r=this.nightPortion(s,a),n="ccw"==e?this.timeDiff(t,i):this.timeDiff(i,t);return(isNaN(t)||n>r)&&(t=i+("ccw"==e?-r:r)),t}nightPortion(t,i){var s=this.setting.highLats,a=.5;return"AngleBased"==s&&(a=1/60*t),"OneSeventh"==s&&(a=1/7),a*i}dayPortion(t){let i;for(i in t)t[i]/=24;return t}getTimeZone(t){const i=t[0],s=this.gmtOffset([i,0,1]),a=this.gmtOffset([i,6,1]);return Math.min(s,a)}getDst(t){return this.gmtOffset(t)!=this.getTimeZone(t)?1:0}gmtOffset(t){return new Date(t[0],t[1]-1,t[2],12).getTimezoneOffset()/-60}eval(t){return+(t+"").split(/[^0-9.+-]/)[0]}isMin(t){return-1!=(t+"").indexOf("min")}timeDiff(t,i){return n.fixHour(i-t)}twoDigitsFormat(t){return(t<10?"0":"")+t}};let l=f;u(l,"methods",{MWL:{name:"Muslim World League",params:{fajr:18,isha:17,maghrib:"0 min",midnight:"Standard"}},ISNA:{name:"Islamic Society of North America (ISNA)",params:{fajr:15,isha:15,maghrib:"0 min",midnight:"Standard"}},Egypt:{name:"Egyptian General Authority of Survey",params:{fajr:19.5,isha:17.5,maghrib:"0 min",midnight:"Standard"}},Makkah:{name:"Umm Al-Qura University, Makkah",params:{fajr:18.5,isha:"90 min",maghrib:"0 min",midnight:"Standard"}},Karachi:{name:"University of Islamic Sciences, Karachi",params:{fajr:18,isha:18,maghrib:"0 min",midnight:"Standard"}},Tehran:{name:"Institute of Geophysics, University of Tehran",params:{fajr:17.7,isha:14,maghrib:4.5,midnight:"Jafari"}},Jafari:{name:"Shia Ithna-Ashari, Leva Institute, Qum",params:{fajr:16,isha:14,maghrib:4,midnight:"Jafari"}}});var n={dtr:t=>t*Math.PI/180,rtd:t=>180*t/Math.PI,sin(t){return Math.sin(this.dtr(t))},cos(t){return Math.cos(this.dtr(t))},tan(t){return Math.tan(this.dtr(t))},arcsin(t){return this.rtd(Math.asin(t))},arccos(t){return this.rtd(Math.acos(t))},arctan(t){return this.rtd(Math.atan(t))},arccot(t){return this.rtd(Math.atan(1/t))},arctan2(t,i){return this.rtd(Math.atan2(t,i))},fixAngle(t){return this.fix(t,360)},fixHour(t){return this.fix(t,24)},fix:(t,i)=>(t-=i*Math.floor(t/i))<0?t+i:t};
    return l; // Return class Adhan
})();


// ==========================================
// 3. APP LOGIC (WIDGET JADWAL SALAT)
// ==========================================
try {
    const MY_LAT = 5.5483; 
    const MY_LNG = 95.3238; 
    const PRAYER_NAMES = { fajr: 'Subuh', dhuhr: 'Dzuhur', asr: 'Ashar', maghrib: 'Maghrib', isha: 'Isya' };

    const elH = document.getElementById('timerH'); 
    const elM = document.getElementById('timerM'); 
    const elS = document.getElementById('timerS'); 
    const elNextName = document.getElementById('nextPrayerName'); 
    const elDate = document.getElementById('dateNow');

    function initApp() {
        // Gunakan variable AdhanLibrary yang kita buat di atas
        const prayer = new AdhanLibrary(); 
        prayer.setMethod('MWL');
        
        const times = prayer.getTimes(new Date(), [MY_LAT, MY_LNG, 0], 7, 0, '24h');

        if(document.getElementById('time-fajr')) {
            document.getElementById('time-fajr').innerText = times.fajr; 
            document.getElementById('time-dhuhr').innerText = times.dhuhr; 
            document.getElementById('time-asr').innerText = times.asr; 
            document.getElementById('time-maghrib').innerText = times.maghrib; 
            document.getElementById('time-isha').innerText = times.isha;
        }
        
        if (elDate) {
            const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }; 
            elDate.innerText = new Date().toLocaleDateString('id-ID', options);
        }
        
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
            fajr: parseTime(times.fajr), dhuhr: parseTime(times.dhuhr), 
            asr: parseTime(times.asr), maghrib: parseTime(times.maghrib), isha: parseTime(times.isha) 
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
                if(elNextName) elNextName.innerText = "Istirahat"; 
                return; 
            }

            const h = Math.floor(minDiff / 3600000); 
            const m = Math.floor((minDiff % 3600000) / 60000); 
            const s = Math.floor((minDiff % 60000) / 1000);
            
            if(elH) elH.innerText = String(h).padStart(2,'0'); 
            if(elM) elM.innerText = String(m).padStart(2,'0'); 
            if(elS) elS.innerText = String(s).padStart(2,'0');
            
            if(elNextName) elNextName.innerText = PRAYER_NAMES[nextPrayerKey];

            const listItems = document.querySelectorAll('.today-list li');
            if (listItems) listItems.forEach(el => el.classList.remove('active'));
            
            const row = document.getElementById(`row-${nextPrayerKey}`); 
            if(row) row.classList.add('active');

        }, 1000);
    }

    initApp();

} catch (error) {
    console.error("Jadwal Salat Error:", error);
}