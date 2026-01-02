import { supabase } from './supabase.js';

// --- ELEMENT SELECTORS ---
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const alertBox = document.getElementById('alert-box');

// --- UTILITY: Show Alert ---
function showAlert(message, type = 'error') {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.className = `alert ${type}`; // reset class
    alertBox.classList.remove('hidden');
    
    // Sembunyikan otomatis setelah 3 detik
    setTimeout(() => {
        alertBox.classList.add('hidden');
    }, 5000);
}

// --- 1. LOGIC REGISTER ---
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value.toLowerCase().trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const btn = registerForm.querySelector('button');

        const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
        if (!usernameRegex.test(username)) {
            return showAlert("Username hanya boleh huruf, angka, dan underscore (min 3 char).");
        }

        try {
            btn.textContent = "Loading...";
            btn.disabled = true;

            // 1. Cek dulu apakah username sudah dipakai?
            const { data: existingUser, error: checkError } = await supabase
                .from('profiles')
                .select('username')
                .eq('username', username)
                .maybeSingle();

            if (checkError) throw checkError;
            if (existingUser) {
                throw new Error("Username sudah dipakai. Ganti yang lain ya!");
            }

            // 2. Daftar Auth + TITIP USERNAME di Metadata
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        username: username // <--- INI PENTING! Dikirim ke Trigger DB
                    }
                }
            });

            if (error) throw error;

            // 3. Sukses (Tidak perlu insert profile manual lagi)
            showAlert("Sukses! Silakan cek email kamu untuk verifikasi.", "success");
            
            // Opsional: Disable form biar gak dipencet lagi
            registerForm.reset();
            
        } catch (error) {
            console.error(error);
            showAlert(error.message || "Terjadi kesalahan.");
            btn.textContent = "Daftar Sekarang";
            btn.disabled = false;
        }
    });
}

// --- 2. LOGIC LOGIN ---
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const btn = loginForm.querySelector('button');

        try {
            btn.textContent = "Masuk...";
            btn.disabled = true;

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            // Login sukses
            window.location.href = 'dashboard.html';

        } catch (error) {
            showAlert("Login gagal: " + error.message);
            btn.textContent = "Masuk";
            btn.disabled = false;
        }
    });
}

// --- 3. LOGIC CEK SESSION (Auto Redirect) ---
// Kalau user buka halaman login/register tapi sebenernya udah login,
// langsung lempar ke dashboard.
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        // Cek nama file sekarang
        const path = window.location.pathname;
        if (path.includes('login.html') || path.includes('register.html')) {
            window.location.href = 'dashboard.html';
        }
    }
}

// ... kode checkSession() di atasnya ...

// ... kode checkSession() di atasnya ...

// --- 4. LOGIC SOCIAL LOGIN (Google, GitHub, LinkedIn) ---
window.handleSocialLogin = async (provider) => {
    try {
        // Opsi tambahan: Kalau LinkedIn, kita WAJIB minta scopes ini
        let options = {
            redirectTo: window.location.origin + '/dashboard.html'
        };

        if (provider === 'linkedin') {
            options.scopes = 'openid profile email'; // <--- INI KUNCINYA BRO!
        }

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: provider,
            options: options
        });

        if (error) throw error;
        
    } catch (error) {
        console.error("Social login error:", error);
        if (typeof showAlert === 'function') {
            showAlert("Gagal login sosmed: " + error.message);
        } else {
            alert("Gagal login sosmed: " + error.message);
        }
    }
};

checkSession();