# SI-NOTULEN: Sistem Notulen & Berita Acara Rapat Digital
### Terintegrasi Google Drive & Google Sheets Backend API

Aplikasi web modern untuk manajemen notulensi dan berita acara rapat dinas/organisasi secara terpadu. Dilengkapi fitur perekaman audio jalannya rapat, dikte suara langsung ke teks (*Speech-to-Text* Bahasa Indonesia), unggah berkas absensi fisik/foto dokumentasi, cetak format resmi Berita Acara, serta penyimpanan otomatis ke **Google Drive** dan **Google Sheets** via **Google Apps Script**.

---

## 🚀 Fitur Unggulan

1. **Auto-Provisioning Google Drive & Sheets**:
   - Backend langsung mendeteksi dan secara otomatis membuat:
     - Folder Induk: `Sistem_Notulen_Rapat`
     - Subfolder: `Rekaman_Audio`
     - Subfolder: `Lampiran_Dokumen`
     - Spreadsheet Database: `DB_Notulen_Rapat` dengan lembar `Data_Rapat` beserta baris *header* yang terformat rapi dan terkunci (*freeze row*).
2. **Perekam Suara Rapat Terintegrasi (MediaRecorder API)**:
   - Tombol kontrol: Mulai Rekam, Jeda/Lanjut, Selesai, dan Rekam Ulang.
   - Timer digital berjalan dan animasi gelombang suara saat mikrofon aktif.
   - Pemutar audio mini (*preview*) sebelum rekaman diunggah ke Google Drive.
3. **Dikte Langsung Suara ke Teks (Web Speech API)**:
   - Cukup klik tombol mikrofon pada kolom **Agenda**, **Hasil Kesepakatan**, atau **Tindak Lanjut** dan bicaralah dalam Bahasa Indonesia.
   - Kata-kata yang diucapkan akan langsung terketik otomatis secara *real-time*.
4. **Format Cetak Berita Acara Resmi**:
   - Menghasilkan lembar dokumen resmi standar Berita Acara (Kop instansi, nomor berita acara, waktu/tempat, pimpinan rapat, daftar hadir, risalah, serta kolom tanda tangan pimpinan dan notulis).
   - Dilengkapi tombol cetak langsung atau simpan ke file PDF (*Print to PDF*).
5. **UI/UX Elegan & Responsif**:
   - Desain formal bernuansa *Deep Royal Navy Blue* (`#1E3A8A`), putih, dan abu-abu terang.
   - Ramah perangkat desktop, tablet, maupun smartphone (*mobile-friendly*).
   - Pengaturan URL Web App fleksibel melalui modal konfigurasi dengan fitur uji koneksi instan.

---

## 📁 Struktur Berkas Proyek

```text
d:\RUDIANSYAH\Aplikasku\Notulen\
├── Code.gs         # Kode Backend Google Apps Script (Auto-setup, Drive & Sheets API)
├── index.html      # Frontend Single Page Application (HTML5, Tailwind CSS, Vanilla JS)
└── README.md       # Panduan instalasi dan penggunaan lengkap
```

---

## 🛠️ Langkah Deployment Google Apps Script (Backend)

Ikuti langkah-langkah mudah berikut untuk menyebarkan backend ke akun Google Anda:

### 1. Buat Proyek Google Apps Script Baru
1. Buka browser dan kunjungi [script.google.com](https://script.google.com/).
2. Klik tombol **Proyek Baru** (*New Project*).
3. Ubah judul proyek di pojok kiri atas menjadi: `Backend_Notulen_Rapat`.

### 2. Salin Kode `Code.gs`
1. Buka file `Code.gs` yang ada di proyek ini.
2. Salin (*copy*) seluruh isinya, lalu tempel (*paste*) ke editor Google Apps Script (menggantikan kode bawaan `myFunction`).
3. Tekan `Ctrl + S` atau klik ikon disket untuk menyimpan.

### 3. (Opsional) Uji Inisialisasi Otomatis Pertama Kali
1. Pada menu fungsi dropdown di atas editor, pilih fungsi `manualInitialSetupTest`.
2. Klik tombol **Jalankan** (*Run*).
3. Google akan meminta izin otorisasi (*Review Permissions*):
   - Pilih akun Google Anda.
   - Jika muncul peringatan *"Google hasn't verified this app"*, klik **Advanced** lalu klik **Go to Backend_Notulen_Rapat (unsafe)**.
   - Klik **Allow**.
4. Setelah selesai, buka [drive.google.com](https://drive.google.com/). Anda akan melihat folder baru `Sistem_Notulen_Rapat` beserta subfolder dan database spreadsheet yang telah dibuat otomatis!

### 4. Deploy sebagai Web App
1. Klik tombol **Deploy** di pojok kanan atas, lalu pilih **New deployment** (Penerapan baru).
2. Pada ikon gerigi di samping *Select type*, pilih **Web app**.
3. Isi konfigurasi sebagai berikut:
   - **Description**: `Versi 1.0 - API Sistem Notulen`
   - **Execute as** (Jalankan sebagai): **Me (emailanda@gmail.com)**
   - **Who has access** (Siapa yang memiliki akses): **Anyone** *(Penting: pilih Anyone agar frontend dapat mengirim data tanpa kendala autentikasi browser)*.
4. Klik tombol **Deploy**.
5. Salin **Web app URL** yang muncul (contoh format: `https://script.google.com/macros/s/AKfycbx.../exec`).

---

## 🌐 Menghubungkan Frontend (`index.html`)

Anda dapat membuka file `index.html` langsung di browser Anda (klik ganda file `index.html` atau jalankan via ekstensi *Live Server* di VS Code).

### Cara 1: Mengatur URL Melalui Tampilan Aplikasi (Tanpa Ubah Kode)
1. Buka `index.html` di browser (Google Chrome atau Microsoft Edge direkomendasikan).
2. Klik tombol status di pojok kanan atas navbar (ikon slider bertuliskan **Mode Demo Lokal** atau titik status).
3. Masukkan URL Web App Google Apps Script yang telah Anda salin pada kolom yang tersedia.
4. Klik **Uji Koneksi** untuk memverifikasi. Jika berhasil, akan muncul notifikasi sukses berwarna hijau.
5. Klik **Simpan Konfigurasi**. Pengaturan ini otomatis tersimpan di browser Anda (`localStorage`).

### Cara 2: Menetapkan URL Secara Permanen di Kode
Buka file `index.html`, baris berikut telah otomatis dikonfigurasi ke URL Web App Anda:
```javascript
const DEFAULT_GAS_URL = "https://script.google.com/macros/s/AKfycbyIwHyGfax9VvYg-Ca9GZE43wJsLJSo2kCbtWeZPfBky-ttjwgGG7be9-F8qxGtUkJ5kA/exec";
```
Aplikasi langsung terhubung secara otomatis ke Google Drive tanpa konfigurasi manual.

---

## 🎙️ Panduan Penggunaan Fitur

### 1. Membuat Notulen Baru
1. Klik tab **Buat Notulen Baru**.
2. Lengkapi data identitas rapat (Judul, Tanggal/Waktu, Tempat, Pimpinan Rapat, Notulis, dan Daftar Hadir Peserta).
3. Pada bagian **Agenda** dan **Hasil Kesepakatan**, Anda dapat mengetik manual atau menekan tombol **Dikte Suara** untuk berbicara langsung melalui mikrofon.
4. Pada bagian **Perekam Suara Rapat**, tekan **Mulai Rekam** untuk merekam pembicaraan rapat. Anda bisa menekan tombol **Jeda** jika istirahat, lalu tekan **Selesai**. Putar kembali rekaman pada pemutar suara untuk memastikan suara terdengar jelas.
5. Pada bagian **Unggah Lampiran**, pilih berkas pendukung (misal: lembar absensi bertanda tangan atau foto kegiatan).
6. Klik **Simpan Notulen ke Google Drive**. Sistem akan secara otomatis mengunggah rekaman dan dokumen ke Google Drive lalu mencatat seluruh resume rapat ke Google Sheets.

### 2. Mencetak Berita Acara Rapat
1. Di tab **Daftar Berita Acara & Notulen**, cari notulen yang diinginkan.
2. Klik tombol **Berita Acara**.
3. Dokumen resmi Berita Acara lengkap dengan kop, nomor dokumen, isi risalah, dan kolom tanda tangan pimpinan serta notulis akan muncul.
4. Klik **Cetak / Ekspor PDF** untuk langsung mencetaknya ke printer fisik atau menyimpannya sebagai file PDF berkualitas tinggi.

---

## 🔒 Catatan Teknis & Kompatibilitas Browser

- **Perekaman Suara (MediaRecorder)**: Didukung oleh hampir seluruh peramban modern (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari iOS 14.8+, dan Chrome Android). Format file audio yang dihasilkan adalah `.webm` yang hemat ukuran dengan kejernihan suara tinggi.
- **Dikte Suara (Web Speech API)**: Direkomendasikan menggunakan **Google Chrome** atau **Microsoft Edge** untuk akurasi pengenalan Bahasa Indonesia (*id-ID*) terbaik. Pastikan izin akses mikrofon telah diizinkan (*Allowed*) di peramban Anda.
- **CORS-Safe Fetch**: Komunikasi antara frontend dan Google Apps Script menggunakan metode aman `text/plain;charset=utf-8` untuk mencegah pemblokiran *preflight* CORS oleh browser.
