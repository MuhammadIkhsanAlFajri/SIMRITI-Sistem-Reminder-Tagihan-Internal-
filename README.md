# SIMRITI --- Sistem Reminder Tagihan Internal

SIMRITI (Sistem Reminder Tagihan Internal) adalah prototipe aplikasi
berbasis web yang dirancang untuk membantu pengelolaan tagihan
operasional, pemantauan status pembayaran, dan pengingat tanggal jatuh
tempo. Proyek ini dikembangkan sebagai bagian dari kegiatan Kerja
Praktik untuk Divisi Unit of ICT PT Semen Baturaja Tbk.

> **Status Proyek: Prototype / Local Development**
>
> SIMRITI merupakan dummy system untuk simulasi konsep dan evaluasi
> Kerja Praktik. Aplikasi ini belum diterapkan secara penuh di
> lingkungan perusahaan dan belum ditujukan untuk penggunaan produksi.
> Gunakan hanya data dummy saat demonstrasi. Fitur tertentu, termasuk
> isi otomatis dari dokumen dan proses validasi pembayaran, masih
> bersifat simulasi.

## Daftar Isi

-   [Fitur Utama](#fitur-utama)
-   [Teknologi](#teknologi)
-   [Panduan Penggunaan](#panduan-penggunaan)
-   [Alur Pengelolaan Tagihan](#alur-pengelolaan-tagihan)
-   [Catatan Keamanan dan Privasi](#catatan-keamanan-dan-privasi)
-   [Pengembangan Selanjutnya](#pengembangan-selanjutnya)

## Fitur Utama

-   **Dashboard:** ringkasan total tagihan, tagihan yang akan jatuh
    tempo, tagihan terlambat, dan tagihan yang sudah dibayar.
-   **Manajemen tagihan:** menambah, melihat, mengubah, mencari,
    menyaring, dan menghapus data tagihan.
-   **Unggah dokumen:** mendukung PDF, PNG, dan JPG dengan ukuran
    maksimal 10 MB sesuai panduan aplikasi.
-   **OCR:** integrasi layanan OCR untuk membantu membaca informasi dari
    dokumen tagihan. Fitur isi otomatis pada versi dummy masih berupa
    simulasi.
-   **Tagihan berulang:** pencatatan tagihan yang memiliki beberapa
    periode pembayaran.
-   **Validasi pembayaran:** pencatatan tanggal dan nominal pembayaran,
    catatan, serta bukti pembayaran opsional.
-   **Histori log:** pencatatan aktivitas pengguna di dalam aplikasi.
-   **Pengingat:** rancangan pengingat tagihan melalui Email dan
    Telegram.
-   **Help Center:** panduan penggunaan dan informasi bantuan.

## Teknologi

  Bagian         Teknologi
  -------------- ----------------------------
  Backend        Node.js, Express.js
  Frontend       EJS, HTML, CSS, JavaScript
  Database       PostgreSQL
  ORM            Prisma
  OCR Service    Python, Flask
  AI/LLM lokal   Ollama, Gemma
  Notifikasi     Email, Telegram Bot

## Panduan Penggunaan

### 1. Mengakses Aplikasi

1.  Jalankan aplikasi SIMRITI pada lingkungan pengembangan lokal.
2.  Buka browser seperti Google Chrome, Microsoft Edge, atau Firefox.
3.  Masukkan alamat lokal aplikasi sesuai konfigurasi server.
4.  Jika belum memiliki akun, pilih **Register**. Jika sudah memiliki
    akun, pilih **Login**.

### 2. Login dan Registrasi

**Login** 1. Masukkan username dan password yang telah terdaftar. 2.
Klik **Login**. 3. Jika data valid, pengguna diarahkan ke Dashboard.
Jika tidak, sistem menampilkan pesan kesalahan.

**Register** 1. Isi username, nama lengkap, email, password, dan
konfirmasi password. 2. Pastikan password dan konfirmasi password sama.
3. Klik **Simpan Pengguna**. 4. Setelah registrasi berhasil, pengguna
diarahkan ke halaman Login.

### 3. Lupa Password

1.  Pilih tautan **Lupa Password?** pada halaman Login.
2.  Masukkan alamat email akun.
3.  Klik **Kirim Link Reset**.
4.  Ikuti proses pengaturan ulang password melalui tautan reset apabila
    layanan email telah dikonfigurasi.

Pada versi prototipe, alur ini digunakan untuk simulasi pemulihan akun.

### 4. Dashboard

Dashboard menampilkan empat ringkasan: - **Total Tagihan:** jumlah
seluruh tagihan yang terdaftar. - **Akan Jatuh Tempo:** tagihan dengan
tenggat dalam tujuh hari ke depan. - **Terlambat Bayar:** tagihan yang
telah melewati tenggat. - **Sudah Dibayar:** tagihan yang telah
dinyatakan lunas.

Dashboard juga menampilkan daftar tagihan terbaru, daftar vendor, dan
notifikasi.

### 5. Data Tagihan

Halaman Data Tagihan digunakan untuk melihat dan mengelola seluruh data
tagihan. Pengguna dapat: 1. Mencari tagihan berdasarkan judul. 2.
Menyaring data berdasarkan vendor, status, dan periode. 3. Melihat
detail melalui ikon mata. 4. Mengubah data melalui ikon pensil. 5.
Menghapus data melalui ikon tempat sampah. 6. Menambahkan tagihan
melalui tombol **+ Tambah Tagihan**.

Tabel menampilkan nomor tagihan, judul, vendor, nominal, tanggal jatuh
tempo, hitung mundur, status, dan aksi.

### 6. Detail Tagihan

Halaman Detail Tagihan menampilkan judul dan nomor invoice, vendor,
total biaya, jumlah yang telah dibayar, sisa tagihan, tanggal tagihan,
tenggat, status, pratinjau dokumen, informasi pengingat, serta riwayat
pembayaran untuk tagihan berulang.

Tersedia tombol **Edit Tagihan**, **Validasi Pembayaran**, dan
**Kembali**.

### 7. Tambah Tagihan

1.  Buka halaman Data Tagihan.
2.  Klik **+ Tambah Tagihan**.
3.  Isi judul tagihan, nomor tagihan, vendor, total biaya, tanggal
    tagihan, dan tenggat pembayaran.
4.  Tentukan apakah tagihan termasuk tagihan berulang.
5.  Isi deskripsi atau catatan jika diperlukan.
6.  Unggah dokumen pendukung jika tersedia.
7.  Klik **Simpan Tagihan**.

Format dokumen yang dicantumkan dalam panduan adalah PDF, PNG, dan JPG
dengan ukuran maksimal 10 MB.

> Pada versi dummy, data yang dimasukkan digunakan untuk simulasi dan
> bukan untuk pencatatan pada database produksi. Fitur **Isi Otomatis**
> dari dokumen juga masih berupa contoh interaksi pengguna.

### 8. Validasi Pembayaran

1.  Buka Detail Tagihan yang akan divalidasi.
2.  Pilih **Validasi Pembayaran**.
3.  Isi tanggal pembayaran dan nominal pembayaran.
4.  Tambahkan bukti pembayaran jika diperlukan.
5.  Isi catatan apabila ada.
6.  Klik **Validasi Pembayaran**.

Menurut panduan, setelah validasi status tagihan diperbarui menjadi
**Lunas** dan riwayat pembayaran dicatat. Untuk tagihan berulang,
informasi periode pembayaran juga ditampilkan.

> Proses validasi pada versi dummy tidak terhubung dengan sistem
> keuangan atau pembayaran perusahaan.

### 9. Histori Log

Halaman Histori Log menampilkan riwayat aktivitas seperti penambahan
tagihan, penghapusan tagihan, dan validasi pembayaran. Informasi
meliputi jenis aktivitas, detail, pengguna, serta waktu aktivitas.

### 10. Help Center

Help Center menyediakan: - **Log Activity / History:** melihat riwayat
aktivitas dan perubahan sistem. - **Ketentuan:** kebijakan dan aturan
penggunaan. - **Cara Penggunaan Aplikasi:** panduan umum penggunaan
SIMRITI. - **Informasi Kontak Teknisi:** informasi kontak pengembang
atau teknisi.

### 11. Notifikasi Email dan Telegram

SIMRITI dirancang untuk memberikan pengingat ketika tagihan mendekati
tanggal jatuh tempo melalui Email dan Telegram Bot.

Berdasarkan panduan prototipe: - Pengingat dimulai ketika tenggat
tersisa tujuh hari. - **7--4 hari sebelum tenggat:** satu kali
pengiriman per hari. - **3 hari terakhir sebelum tenggat:** tiga kali
pengiriman per hari (pagi, siang, dan sore). - Pengiriman pengingat
dihentikan setelah tagihan dibayar atau divalidasi. - Pesan memuat judul
tagihan, nomor invoice, vendor, nominal, tanggal jatuh tempo, dan status
pembayaran.

> Pada versi dummy yang dijelaskan dalam manual book, pengiriman
> notifikasi merupakan simulasi dan belum terhubung ke sistem email atau
> Telegram resmi perusahaan. Implementasi aktual bergantung pada
> konfigurasi layanan yang digunakan.

## Alur Pengelolaan Tagihan

1.  Pengguna melakukan registrasi atau login.
2.  Pengguna melihat ringkasan tagihan pada Dashboard.
3.  Pengguna menambahkan atau memilih data tagihan.
4.  Pengguna melihat detail dan memantau tenggat pembayaran.
5.  Pengguna mencatat dan memvalidasi pembayaran.
6.  Sistem memperbarui status dan mencatat aktivitas.
7.  Pengguna memantau pengingat dan histori melalui aplikasi.

## Catatan Keamanan dan Privasi

-   SIMRITI saat ini merupakan prototipe untuk pengembangan dan
    evaluasi.
-   Jangan memasukkan data invoice, bukti pembayaran, kredensial, atau
    informasi perusahaan yang sebenarnya ke dalam demonstrasi publik.
-   Gunakan data dummy untuk screenshot, pengujian, dan presentasi.
-   Jangan mengunggah file `.env`, token bot, password email, kredensial
    database, atau rahasia aplikasi ke repositori publik.
-   Sebelum deployment, lakukan pemeriksaan keamanan, konfigurasi
    autentikasi dan sesi, pembatasan akses dokumen unggahan, serta
    pengujian menyeluruh.

## Pengembangan Selanjutnya

Proyek ini masih dapat dikembangkan melalui pengujian fitur,
penyempurnaan alur OCR, peningkatan keamanan, dan evaluasi keandalan
sistem sebelum dipertimbangkan untuk penggunaan di lingkungan produksi.

------------------------------------------------------------------------

**SIMRITI --- Sistem Reminder Tagihan Internal**\
Dikembangkan sebagai proyek Kerja Praktik untuk Divisi Unit of ICT, PT
Semen Baturaja Tbk.
