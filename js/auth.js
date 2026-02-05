import { supabase } from './supabase.js';

// ==========================================
// 1. DOM ELEMENTS
// ==========================================
const container = document.getElementById('container');
const registerBtnTrigger = document.getElementById('registerBtnTrigger');
const loginBtnTrigger = document.getElementById('loginBtnTrigger');
const alertBox = document.getElementById('alert-box');

// Form Elements
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');

// Social Buttons
const googleReg = document.getElementById('googleRegister');
const googleLog = document.getElementById('googleLogin');
const githubReg = document.getElementById('githubRegister');
const githubLog = document.getElementById('githubLogin');

// ==========================================
// 2. SLIDING ANIMATION LOGIC
// ==========================================
if (registerBtnTrigger && loginBtnTrigger) {
    registerBtnTrigger.addEventListener('click', () => {
        container.classList.add("active");
    });

    loginBtnTrigger.addEventListener('click', () => {
        container.classList.remove("active");
    });
}

// ==========================================
// 3. UTILITY FUNCTIONS
// ==========================================
function showAlert(message, type = 'error') {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.className = `alert ${type}`;
    alertBox.classList.remove('hidden');

    setTimeout(() => {
        alertBox.classList.add('hidden');
    }, 4000);
}

// --- CEK SESSION (Auto Redirect) ---
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        window.location.href = 'dashboard.html';
    }
}
checkSession();

// --- SOCIAL LOGIN HANDLER ---
async function handleSocialLogin(provider) {
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: provider,
            options: {
                redirectTo: window.location.origin + '/dashboard.html'
            }
        });
        if (error) throw error;
    } catch (error) {
        showAlert("Gagal login sosmed: " + error.message);
    }
}

// Attach Event ke Tombol Google
if(googleReg) googleReg.addEventListener('click', () => handleSocialLogin('google'));
if(googleLog) googleLog.addEventListener('click', () => handleSocialLogin('google'));
if(githubReg) githubReg.addEventListener('click', () => handleSocialLogin('github'));
if(githubLog) githubLog.addEventListener('click', () => handleSocialLogin('github'));


// ==========================================
// 4. REGISTER LOGIC
// ==========================================
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value.toLowerCase().trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const btn = registerForm.querySelector('button[type="submit"]');
        const originalText = btn.textContent;

        // Validasi
        const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
        if (!usernameRegex.test(username)) {
            return showAlert("Username hanya boleh huruf, angka, dan underscore (min 3 char).");
        }
        if (password !== confirmPassword) {
            return showAlert("Password tidak cocok!");
        }

        try {
            btn.textContent = "Loading...";
            btn.disabled = true;

            // 1. Cek Username Unik
            const { data: existingUser, error: checkError } = await supabase
                .from('profiles')
                .select('username')
                .eq('username', username)
                .maybeSingle();

            if (checkError) throw checkError;
            if (existingUser) throw new Error("Username sudah dipakai. Cari yang lain ya!");

            // 2. Sign Up Supabase
            const { error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: { username: username }
                }
            });

            if (error) throw error;

            showAlert("Sukses! Cek email kamu untuk verifikasi.", "success");
            registerForm.reset();
            
            // Opsional: Geser otomatis ke login setelah sukses
            setTimeout(() => container.classList.remove("active"), 2000);

        } catch (error) {
            showAlert(error.message || "Terjadi kesalahan saat daftar.");
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
}


// ==========================================
// 5. LOGIN LOGIC
// ==========================================
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Menggunakan ID baru (emailLogin & passwordLogin)
        const email = document.getElementById('emailLogin').value.trim();
        const password = document.getElementById('passwordLogin').value;
        const btn = loginForm.querySelector('button[type="submit"]');
        const originalText = btn.textContent;

        try {
            btn.textContent = "Masuk...";
            btn.disabled = true;

            const { error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            window.location.href = 'dashboard.html';

        } catch (error) {
            showAlert("Login gagal: " + error.message);
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
}