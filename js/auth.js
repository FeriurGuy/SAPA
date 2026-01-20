import { supabase } from './supabase.js';

// --- ELEMENT SELECTORS ---
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const alertBox = document.getElementById('alert-box');

// --- UTILITY: Show Alert ---
function showAlert(message, type = 'error') {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.className = `alert ${type}`;
    alertBox.classList.remove('hidden');

    setTimeout(() => {
        alertBox.classList.add('hidden');
    }, 5000);
}

// --- REGISTER ---
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

            const { data: existingUser, error: checkError } = await supabase
                .from('profiles')
                .select('username')
                .eq('username', username)
                .maybeSingle();

            if (checkError) throw checkError;
            if (existingUser) {
                throw new Error("Username sudah dipakai. Ganti yang lain ya!");
            }

        const password = document.getElementById('password').value;
        // confirm password
        const confirmPassword = document.getElementById('confirmPassword').value; 

            if (password !== confirmPassword) {
                return showAlert("Password tidak cocok lae! Coba cek lagi.");
            }    

            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        username: username
                    }
                }
            });

            if (error) throw error;

            showAlert("Sukses! Silakan cek email kamu untuk verifikasi.", "success");

            registerForm.reset();
            
        } catch (error) {
            console.error(error);
            showAlert(error.message || "Terjadi kesalahan.");
            btn.textContent = "Daftar Sekarang";
            btn.disabled = false;
        }
    });
}

// --- LOGIN ---
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

            window.location.href = 'dashboard.html';

        } catch (error) {
            showAlert("Login gagal: " + error.message);
            btn.textContent = "Masuk";
            btn.disabled = false;
        }
    });
}

// --- CEK SESSION (Auto Redirect) ---
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {

        const path = window.location.pathname;
        if (path.includes('login.html') || path.includes('register.html')) {
            window.location.href = 'dashboard.html';
        }
    }
}

// --- SOCIAL LOGIN ---
window.handleSocialLogin = async (provider) => {
    try {

        let options = {
            redirectTo: window.location.origin + '/dashboard.html'
        };

        if (provider === 'linkedin') {
            options.scopes = 'openid profile email';
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