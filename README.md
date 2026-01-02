# SAPA - Satu Page Aja 🚀

![SAPA Banner](assets/Icons/favicon.png)

**SAPA** adalah aplikasi *Link in Bio* (seperti Linktree/Carrd) berbasis web yang ringan, cepat, dan estetik. Dibuat dengan **Vanilla JavaScript** murni tanpa framework berat, menjadikannya sangat performan dan mudah dipelajari.

Project ini dikembangkan sebagai *Mini SaaS* (Software as a Service) dengan sistem membership (Gratis & Pro).

🔗 **Live Demo:** (https://sapa-flame.vercel.app/)

---

## ✨ Fitur Utama

### 👤 User Dashboard
* **Authentication:** Login & Register aman menggunakan Supabase Auth.
* **Link Management:** Tambah, Edit, Hapus, dan Geser (Drag & Drop) urutan link.
* **Profile Customization:** Ganti nama, bio, dan foto profil.
* **Theme System:** Pilih preset tema (Clean, Soft, Night) atau atur warna sendiri.

### 💎 Fitur Pro (Premium)
* **Verified Badge:** Centang biru di samping nama profil.
* **Analytics:** Lihat jumlah klik untuk setiap link.
* **Custom Background:** Upload gambar latar belakang sendiri.
* **Music Embed:** Pasang lagu dari **Spotify** (Widget) atau **YouTube** (Piringan hitam + Autoplay).
* **Exclusive Themes:** Akses tema premium (Royal, Hacker, Love).

### 🎨 Tampilan Profil (Public)
* **Responsive:** Tampilan optimal di HP dan Laptop.
* **Fast Loading:** Tanpa bloatware framework.
* **Interactive UI:** Efek 3D Tilt pada kartu link dan animasi skeleton loading.
* **Hybrid Analytics:** Logika cerdas untuk mencatat klik link tanpa terblokir browser laptop/HP.

---

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3 (Variables & Flexbox/Grid), Vanilla JavaScript (ES6 Modules).
* **Backend & Database:** [Supabase](https://supabase.com) (PostgreSQL + Auth + Storage).
* **Libraries:**
    * `SortableJS` (Drag & drop list).
    * `Vanilla-Tilt` (Efek 3D pada kartu).
    * `FontAwesome` (Ikon).
* **Hosting:** Vercel.
