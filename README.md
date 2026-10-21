# SIMRITI --- Smart Invoice Reminder System

> Aplikasi web untuk mengelola tagihan, memantau jatuh tempo, mencatat
> riwayat pembayaran, dan mengirim pengingat melalui email serta
> Telegram.

SIMRITI (*Smart Invoice Reminder System*) merupakan aplikasi pengelolaan
tagihan berbasis web. Repository ini berisi aplikasi Node.js/Express
dengan template EJS, database PostgreSQL melalui Prisma ORM, dan layanan
OCR terpisah berbasis Python Flask yang menggunakan OCR serta
Ollama/Gemma untuk membantu ekstraksi data invoice.

Dokumentasi ini menjelaskan dua skenario penggunaan: 1. **Local
development** --- menjalankan SIMRITI di komputer sendiri untuk
pengembangan dan pengujian. 2. **Server deployment** --- menjalankan
SIMRITI pada server agar aplikasi web dapat diakses melalui jaringan
atau internet.

> Panduan server di bawah merupakan panduan umum untuk server Linux/VPS.
> Langkah detail dapat berbeda menurut penyedia server, sistem operasi,
> domain, dan konfigurasi yang dipilih.

------------------------------------------------------------------------

## Daftar Isi

-   [Fitur Utama](#fitur-utama)
-   [Technology Stack](#technology-stack)
-   [Arsitektur Sistem](#arsitektur-sistem)
-   [Struktur Repository](#struktur-repository)
-   [Prasyarat](#prasyarat)
-   [A. Menjalankan Secara Lokal](#a-menjalankan-secara-lokal)
-   [B. Deployment ke Server](#b-deployment-ke-server)
-   [Konfigurasi Environment](#konfigurasi-environment)
-   [Database dan Prisma](#database-dan-prisma)
-   [Alur Fitur](#alur-fitur)
-   [Pengujian](#pengujian)
-   [Troubleshooting](#troubleshooting)
-   [Keamanan](#keamanan)
-   [Pengembangan Selanjutnya](#pengembangan-selanjutnya)
-   [Lisensi](#lisensi)

## Fitur Utama

-   Dashboard ringkasan tagihan.
-   Pengelolaan data invoice.
-   Status tagihan: menunggu pembayaran, akan jatuh tempo, terlambat,
    dan sudah dibayar.
-   Dukungan struktur tagihan berulang dan transaksi pembayaran per
    periode.
-   Riwayat pembayaran.
-   Ekstraksi data invoice dengan OCR dan bantuan model AI lokal.
-   Pengingat email dan Telegram.
-   Autentikasi pengguna dan alur reset password.
-   Activity log dan notifikasi aplikasi.
-   Antarmuka web berbasis EJS, HTML, CSS, dan JavaScript.

Ketersediaan setiap fitur bergantung pada konfigurasi dan layanan
pendukung yang berjalan.

## Technology Stack

  Komponen             Teknologi
  -------------------- ---------------------------
  Backend runtime      Node.js
  Web framework        Express.js
  Template engine      EJS
  Frontend             HTML, CSS, JavaScript
  Database             PostgreSQL
  ORM                  Prisma
  OCR service          Python, Flask
  Invoice AI parsing   Ollama, model `gemma3:4b`
  HTTP client          Axios
  Email                Nodemailer
  Telegram             Telegram Bot API

## Arsitektur Sistem

``` text
                         Pengguna
                            |
                            v
                      Browser Web
                            |
                            v
                    Node.js / Express
                      /     |      \
                     /      |       \
                    v       v        v
                Prisma   Email     Telegram
                   |      Service   Bot API
                   v
               PostgreSQL

Node.js OCR Client ---> Python Flask OCR ---> OCR Engine
                              |
                              v
                         Ollama / Gemma
```

Node.js menangani aplikasi web dan logika bisnis. PostgreSQL menyimpan
data. Layanan Flask memproses invoice yang dikirim dari aplikasi,
sedangkan Ollama/Gemma membantu mengubah teks hasil OCR menjadi data
terstruktur. Email dan Telegram digunakan untuk pengiriman pengingat
sesuai konfigurasi.

## Struktur Repository

``` text
SIMRITI/
├── orc-service/
│   ├── app.py
│   ├── ocr_engine.py
│   ├── llm_parser.py
│   └── parser.py
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── public/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── views/
├── package.json
├── package-lock.json
├── prisma.config.ts
├── .gitignore
└── README.md
```

Nama `orc-service` mengikuti nama folder pada repository ini.

## Prasyarat

### Untuk aplikasi web

-   Node.js dan npm.
-   PostgreSQL.
-   Git.

### Untuk fitur OCR berbantuan AI

-   Python 3.
-   Dependensi Python yang digunakan oleh `orc-service`.
-   Dependensi sistem OCR/PDF yang diperlukan oleh implementasi
    `ocr_engine.py`.
-   Ollama dan model `gemma3:4b`.

### Untuk notifikasi

-   Kredensial SMTP/email yang valid.
-   Bot Telegram dan chat ID jika pengingat Telegram digunakan.

------------------------------------------------------------------------

## A. Menjalankan Secara Lokal

Bagian ini ditujukan untuk menjalankan SIMRITI di komputer pengembang,
misalnya Windows dengan VS Code.

### 1. Clone repository

``` bash
git clone https://github.com/MuhammadIkhsanAlFajri/SIMRITI-Sistem-Reminder-Tagihan-Internal-.git
cd SIMRITI-Sistem-Reminder-Tagihan-Internal-
```

### 2. Instal dependensi Node.js

``` bash
npm install
```

### 3. Buat database PostgreSQL

Buat database untuk SIMRITI menggunakan PostgreSQL/pgAdmin. Tentukan
nama database, username, dan password sesuai konfigurasi lokal.

### 4. Konfigurasikan environment

Buat file `.env` di root repository. Contoh berikut adalah template,
bukan kredensial siap pakai:

``` env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/NAMA_DATABASE?schema=public"

EMAIL_USER=
EMAIL_PASSWORD=

TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

MAILTRAP_API_TOKEN=
MAILTRAP_INBOX_ID=
```

Isi hanya variabel yang digunakan. Pastikan `.env` tidak ikut di-commit
atau diunggah ke GitHub.

### 5. Siapkan Prisma

Tinjau `prisma/schema.prisma`, `prisma.config.ts`, dan folder
`prisma/migrations` agar sesuai dengan versi project. Untuk database
baru yang menggunakan migration repository, jalankan:

``` bash
npx prisma migrate deploy
npx prisma generate
```

Jangan menjalankan `prisma migrate reset` pada database yang berisi data
penting karena dapat menghapus data.

### 6. Jalankan aplikasi web

Gunakan script yang tersedia pada `package.json`. Pada konfigurasi
pengembangan project ini, perintah yang digunakan adalah:

``` bash
npm run dev
```

Buka:

``` text
http://localhost:3000
```

Jika `npm run dev` tidak tersedia pada versi repository yang digunakan,
periksa bagian `scripts` di `package.json`.

### 7. Jalankan layanan OCR (opsional)

Buka terminal terpisah. Dari root project:

``` powershell
cd orc-service
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Instal dependensi Python sesuai implementasi di folder `orc-service`.
Jika file `requirements.txt` tersedia, gunakan:

``` bash
pip install -r requirements.txt
```

Jika `requirements.txt` belum tersedia, identifikasi dan catat
dependensi yang benar dari import pada file Python sebelum
menginstalnya.

Pastikan Ollama berjalan dan model tersedia:

``` bash
ollama pull gemma3:4b
```

Jalankan layanan Flask:

``` bash
python app.py
```

Menurut konfigurasi saat ini, endpoint OCR berada di
`http://127.0.0.1:5000/ocr`, dan parser menggunakan Ollama pada
`http://127.0.0.1:11434/api/generate`.

> Untuk pemrosesan PDF, kebutuhan sistem tambahan seperti Poppler dapat
> bergantung pada implementasi `pdf2image` dan instalasi lokal.

### 8. Uji fungsi utama

-   Login dan navigasi halaman.
-   Menambah serta mengubah tagihan.
-   Memeriksa status dan jatuh tempo.
-   Mencatat pembayaran.
-   Menguji OCR dengan file contoh yang tidak berisi data sensitif.
-   Menguji email dan Telegram menggunakan akun uji.

------------------------------------------------------------------------

## B. Deployment ke Server

Bagian ini merupakan panduan umum untuk VPS/server Linux. Contoh
arsitektur menggunakan Node.js, PostgreSQL, Python OCR, Ollama, dan
Nginx. Sesuaikan perintah dengan distribusi Linux dan konfigurasi server
yang digunakan.

### 1. Rencanakan penempatan layanan

Sebelum memulai, tentukan apakah semua layanan berjalan di satu server
atau dipisah. Aplikasi Node.js dan PostgreSQL dapat ditempatkan pada
satu server untuk prototipe kecil, tetapi layanan OCR dan model AI lokal
dapat membutuhkan CPU, RAM, dan penyimpanan lebih besar.

``` text
Internet
   |
   v
Domain + HTTPS
   |
   v
Nginx (reverse proxy)
   |
   v
Node.js / Express
   |       |        |
   v       v        v
PostgreSQL OCR API  Email/Telegram
             |
             v
         Ollama/Gemma
```

### 2. Siapkan server

-   Sediakan VPS dengan sistem operasi Linux yang didukung.
-   Perbarui sistem dan instal Node.js, npm, Git, PostgreSQL, Python,
    serta Nginx sesuai kebutuhan.
-   Siapkan domain dan HTTPS jika aplikasi akan diakses melalui
    internet.
-   Atur firewall agar hanya port yang diperlukan yang dapat diakses
    dari luar.

Instruksi instalasi paket berbeda antarversi sistem operasi. Ikuti
dokumentasi resmi distribusi Linux dan penyedia server yang digunakan.

### 3. Ambil source code

Masuk ke server melalui SSH, lalu jalankan:

``` bash
git clone https://github.com/MuhammadIkhsanAlFajri/SIMRITI-Sistem-Reminder-Tagihan-Internal-.git
cd SIMRITI-Sistem-Reminder-Tagihan-Internal-
npm ci
```

Gunakan `npm ci` untuk instalasi yang mengikuti `package-lock.json`.
Jika ada perubahan dependency, perbarui lockfile di lingkungan
pengembangan dan tinjau perubahan sebelum deployment.

### 4. Siapkan PostgreSQL

Buat database dan akun khusus aplikasi. Hindari menggunakan akun
superuser PostgreSQL untuk koneksi aplikasi. Simpan kredensial di
environment server, kemudian atur `DATABASE_URL` sesuai alamat database.

Jika PostgreSQL berjalan di server yang sama, gunakan host lokal bila
sesuai. Jika berada di server terpisah, gunakan alamat jaringan privat
dan batasi aksesnya melalui firewall.

### 5. Atur environment server

Simpan environment variables melalui mekanisme environment service atau
file privat yang izin aksesnya dibatasi. Variabel yang mungkin
dibutuhkan:

``` env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/NAMA_DATABASE?schema=public"
EMAIL_USER=
EMAIL_PASSWORD=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
MAILTRAP_API_TOKEN=
MAILTRAP_INBOX_ID=
```

Jangan mengisi nilai rahasia ke README atau menyimpan `.env` server
dalam repository publik. Mailtrap hanya diperlukan bila memang
digunakan.

### 6. Terapkan database schema

Tinjau migration sebelum menjalankannya terhadap database server. Jika
database baru siap dan migration repository sesuai, jalankan dari root
project:

``` bash
npx prisma migrate deploy
npx prisma generate
```

Pastikan tersedia backup dan prosedur pemulihan sebelum melakukan
perubahan database pada sistem yang sudah memiliki data.

### 7. Siapkan OCR dan AI (opsional)

Jika fitur OCR diperlukan di server:

-   Instal Python dan dependensi OCR.
-   Instal dependensi sistem yang diperlukan untuk membaca PDF/gambar.
-   Jalankan Flask OCR sebagai service terpisah.
-   Instal dan jalankan Ollama serta model `gemma3:4b` jika parsing AI
    lokal digunakan.
-   Sesuaikan URL OCR dan Ollama agar Node.js dapat menjangkaunya.

Perhatian: `127.0.0.1` menunjuk ke mesin tempat proses berjalan. Jika
Node.js, Flask, dan Ollama berada di mesin berbeda, ubah alamat sesuai
jaringan privat dan jangan mengekspos endpoint internal ke internet
tanpa perlindungan.

### 8. Jalankan Node.js sebagai service

Untuk server, jangan mengandalkan terminal SSH yang harus selalu
terbuka. Gunakan process manager atau service manager yang sesuai,
misalnya systemd atau process manager Node.js. Konfigurasikan agar:

-   aplikasi berjalan dengan akun sistem non-root;
-   environment variables tersedia pada service;
-   log dapat diperiksa;
-   service dapat dimulai kembali saat server reboot;
-   proses dihentikan dan dimulai kembali dengan aman saat deployment.

Nama service dan file konfigurasi harus dibuat sesuai lingkungan server
aktual.

### 9. Konfigurasikan Nginx dan HTTPS

Atur Nginx sebagai reverse proxy menuju port aplikasi Node.js yang hanya
dibuka secara lokal atau jaringan privat. Pasang sertifikat HTTPS untuk
domain. Jangan membuka port internal PostgreSQL, Flask OCR, atau Ollama
ke publik jika tidak diperlukan.

Konfigurasi Nginx, domain, dan sertifikat harus disesuaikan dengan
sistem operasi dan penyedia hosting.

### 10. Uji setelah deployment

Setelah semua service aktif, verifikasi:

-   halaman login dan dashboard dapat diakses melalui HTTPS;
-   koneksi PostgreSQL berjalan;
-   tambah/edit tagihan dan riwayat pembayaran berfungsi;
-   OCR dapat mengakses layanan Flask dan Ollama;
-   email dan Telegram berhasil mengirim pengingat;
-   scheduler berjalan dan tidak mengirim notifikasi berulang secara
    tidak semestinya;
-   log tidak membocorkan token, password, atau teks invoice sensitif.

### Catatan kompatibilitas hosting

Tidak semua hosting mendukung seluruh komponen SIMRITI. Hosting Node.js
saja mungkin tidak mendukung Python Flask atau Ollama. Jika hosting
tidak mampu menjalankan model AI lokal, tempatkan layanan OCR/AI pada
server terpisah yang aman atau nonaktifkan fitur tersebut sesuai
kebutuhan. Pastikan juga database PostgreSQL tersedia dan dapat diakses
oleh aplikasi.

------------------------------------------------------------------------

## Konfigurasi Environment

Variabel environment dibaca oleh kode aplikasi untuk menghubungkan
database dan layanan eksternal. Nama variabel pada template di atas
harus dicocokkan dengan source code versi yang digunakan.

-   `DATABASE_URL`: koneksi PostgreSQL.
-   `EMAIL_USER` dan `EMAIL_PASSWORD`: akun pengiriman email.
-   `TELEGRAM_BOT_TOKEN` dan `TELEGRAM_CHAT_ID`: konfigurasi bot
    Telegram.
-   `MAILTRAP_API_TOKEN` dan `MAILTRAP_INBOX_ID`: hanya untuk pengujian
    Mailtrap bila digunakan.

Buat `.env.example` berisi nama variabel dan placeholder kosong agar
developer lain mengetahui konfigurasi yang diperlukan tanpa membagikan
kredensial. Pastikan `.env` tetap diabaikan oleh `.gitignore`.

## Alur Fitur

### OCR invoice

1.  Pengguna mengunggah invoice dari aplikasi.
2.  Node.js mengirim file ke endpoint Flask `/ocr`.
3.  Layanan OCR mengekstrak teks dari PDF atau gambar.
4.  Ollama/Gemma membantu mengubah teks menjadi data terstruktur.
5.  Data hasil parsing dikembalikan ke aplikasi untuk diperiksa dan
    diproses.

Data hasil OCR/AI dapat salah. Verifikasi vendor, nomor invoice,
nominal, dan tanggal sebelum menyimpan data.

### Tagihan dan pembayaran

Data tagihan disimpan di PostgreSQL melalui Prisma. Model `Bill` dan
`Payment` mendukung struktur tagihan serta transaksi pembayaran. Rincian
aturan periode dan status mengikuti implementasi pada source code.

### Reminder

Scheduler memeriksa data tagihan dan memanggil layanan email/Telegram
sesuai konfigurasi. Pastikan layanan terkait aktif dan kredensial valid.

## Desain Database

Skema berada di `prisma/schema.prisma`. Model utama yang tersedia
mencakup:

  Model                  Fungsi
  ---------------------- -------------------------------------------
  `User`                 Data pengguna
  `PasswordResetToken`   Data token reset password dan kedaluwarsa
  `Vendor`               Data vendor
  `Bill`                 Data tagihan
  `Payment`              Transaksi/riwayat pembayaran
  `ReminderSetting`      Pengaturan pengingat
  `Notification`         Notifikasi aplikasi
  `ActivityLog`          Catatan aktivitas

Untuk detail kolom, enum, dan relasi, lihat `prisma/schema.prisma` dan
migration yang ada di `prisma/migrations/`.

## Pengujian

Repository memuat beberapa skrip pengujian seperti `src/test-db.js`,
`src/testReminder.js`, `src/testTelegram.js`, `test-email.js`, dan
`test-mailtrap-api.js`. Baca isi skrip sebelum menjalankannya karena
skrip dapat mengakses database atau mengirim pesan ke layanan eksternal.

Gunakan data dummy dan akun sandbox untuk pengujian. Jangan menjalankan
skrip pengujian pada data produksi tanpa memahami efeknya.

## Troubleshooting

  -----------------------------------------------------------------------
  Masalah                             Pemeriksaan
  ----------------------------------- -----------------------------------
  PostgreSQL tidak terhubung          Periksa service database,
                                      `DATABASE_URL`, kredensial, dan
                                      firewall.

  Prisma error                        Periksa schema/migration, lalu
                                      jalankan `npx prisma generate`.

  `ECONNREFUSED 127.0.0.1:5000`       Pastikan Flask OCR aktif dan URL
                                      sesuai topologi server.

  Parsing AI gagal                    Pastikan Ollama aktif dan model
                                      tersedia.

  Email gagal                         Periksa konfigurasi SMTP/Gmail dan
                                      environment variables.

  Telegram gagal                      Periksa token, chat ID, dan koneksi
                                      keluar ke Telegram API.

  OCR salah membaca invoice           Periksa kualitas file dan
                                      verifikasi hasil ekstraksi sebelum
                                      menyimpan.
  -----------------------------------------------------------------------

## Keamanan

-   Jangan commit `.env`, token, password, API key, atau kredensial
    database.
-   Jangan menyimpan invoice asli atau data pribadi di repository
    publik.
-   Validasi jenis, ukuran, dan isi file yang diunggah; ekstensi saja
    tidak cukup.
-   Hindari mencatat teks invoice dan informasi sensitif ke log
    produksi.
-   Nonaktifkan debug mode pada Flask di server.
-   Gunakan HTTPS dan batasi akses ke database serta endpoint internal.
-   Jalankan aplikasi dengan hak akses minimum.
-   Buat backup database secara berkala dan uji pemulihannya.
-   Jika rahasia terlanjur terpublikasi, cabut atau rotasi kredensial
    tersebut.

## Pengembangan Selanjutnya

Ide pengembangan berikut merupakan rekomendasi, bukan klaim bahwa
semuanya sudah diterapkan:

-   Test otomatis untuk controller, service, OCR, dan pembayaran.
-   Dokumentasi dependensi Python yang terversi.
-   Diagram ERD dan screenshot antarmuka.
-   Validasi hasil OCR sebelum data disimpan.
-   Dokumentasi deployment spesifik untuk provider yang digunakan.
-   Monitoring service, backup terjadwal, dan prosedur pemulihan.

## Lisensi

Tambahkan file `LICENSE` jika ingin menetapkan izin penggunaan,
modifikasi, dan distribusi source code. Repository publik tanpa lisensi
tidak otomatis memberikan izin penggunaan ulang tanpa batas.

------------------------------------------------------------------------

**SIMRITI --- Smart Invoice Reminder System**\
*Invoice management, payment history, OCR-assisted extraction, and
automated reminders.*
