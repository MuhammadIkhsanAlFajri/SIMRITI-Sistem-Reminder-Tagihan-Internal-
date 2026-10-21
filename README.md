# SIMRITI --- Smart Invoice Reminder System

> Aplikasi web untuk mengelola tagihan, memantau jatuh tempo, mencatat
> pembayaran, dan mengirim pengingat otomatis melalui email dan
> Telegram.

SIMRITI (*Smart Invoice Reminder System*) adalah aplikasi pengelolaan
tagihan berbasis web. Sistem ini dirancang untuk membantu pengguna
mencatat data invoice, memantau status pembayaran, menyimpan riwayat
transaksi pembayaran, serta menerima pengingat ketika tagihan mendekati
tanggal jatuh tempo.

Repository ini memuat source code aplikasi web Node.js, layanan OCR
berbasis Python, skema dan migration database, serta template antarmuka
EJS.

## Daftar Isi

-   [Fitur Utama](#fitur-utama)
-   [Teknologi](#teknologi)
-   [Arsitektur Sistem](#arsitektur-sistem)
-   [Struktur Repository](#struktur-repository)
-   [Prasyarat](#prasyarat)
-   [Instalasi](#instalasi)
-   [Konfigurasi Environment](#konfigurasi-environment)
-   [Menjalankan Aplikasi](#menjalankan-aplikasi)
-   [Alur Sistem](#alur-sistem)
-   [Desain Database](#desain-database)
-   [Layanan OCR](#layanan-ocr)
-   [Pengingat Email dan Telegram](#pengingat-email-dan-telegram)
-   [Pengujian](#pengujian)
-   [Troubleshooting](#troubleshooting)
-   [Keamanan](#keamanan)
-   [Batasan dan Pengembangan
    Berikutnya](#batasan-dan-pengembangan-berikutnya)
-   [Kontribusi](#kontribusi)
-   [Lisensi](#lisensi)

## Fitur Utama

-   **Dashboard** untuk melihat ringkasan informasi tagihan.
-   **Manajemen tagihan** untuk menambah, melihat, dan mengubah data
    invoice.
-   **Pelacakan status** tagihan, termasuk menunggu pembayaran,
    mendekati jatuh tempo, terlambat, dan sudah dibayar.
-   **Tagihan berulang** dengan struktur data periode dan transaksi
    pembayaran.
-   **Riwayat pembayaran** untuk mencatat tanggal, nominal, bukti
    pembayaran, dan catatan terkait.
-   **Ekstraksi data invoice berbantuan OCR dan AI lokal** melalui
    layanan Python.
-   **Pengingat otomatis** melalui email dan Telegram.
-   **Autentikasi pengguna** serta alur permintaan reset password.
-   **Activity log** untuk mencatat aktivitas tertentu.
-   **Antarmuka web** menggunakan EJS, CSS, dan JavaScript.

> Ketersediaan dan perilaku tiap fitur bergantung pada konfigurasi lokal
> serta layanan pendukung yang sedang berjalan.

## Teknologi

  Komponen                        Teknologi
  ------------------------------- -----------------------------------------
  Runtime backend                 Node.js
  Web framework                   Express.js
  Template antarmuka              EJS
  Frontend                        HTML, CSS, JavaScript
  Database                        PostgreSQL
  ORM dan akses database          Prisma ORM
  Layanan OCR                     Python, Flask
  Parsing invoice berbantuan AI   Ollama dengan model `gemma3:4b`
  HTTP client Node.js             Axios
  Pengiriman email                Nodemailer
  Pengingat Telegram              Telegram Bot API
  Pengolahan unggahan             Multer/FormData dan utilitas filesystem

## Arsitektur Sistem

``` text
Pengguna
   |
   v
Browser
   |
   v
Node.js + Express.js + EJS
   |              |
   |              +---- Email Service ----> SMTP / Gmail
   |              |
   |              +---- Telegram Service -> Telegram Bot API
   |              |
   |              +---- OCR Client
   |                       |
   v                       v
Prisma ORM             Flask OCR Service
   |                       |
   v                       +---- OCR Engine
PostgreSQL                 |
                           +---- Ollama / Gemma
```

Aplikasi Node.js menangani antarmuka web, autentikasi, pengelolaan
tagihan, pembayaran, dan penjadwalan pengingat. Prisma ORM digunakan
untuk mengakses PostgreSQL. Ketika fitur pemindaian invoice digunakan,
Node.js mengirim berkas ke layanan Flask pada alamat lokal
`http://127.0.0.1:5000/ocr`. Layanan tersebut memproses berkas dan
menggunakan Ollama pada `http://127.0.0.1:11434/api/generate` untuk
membantu mengekstrak data terstruktur.

## Struktur Repository

``` text
SIMRITI/
├── orc-service/
│   ├── app.py                 # API Flask untuk pemrosesan OCR
│   ├── ocr_engine.py          # Mesin ekstraksi teks
│   ├── llm_parser.py          # Parsing data invoice dengan Ollama/Gemma
│   ├── parser.py              # Utilitas parsing tambahan
│   └── ...
├── prisma/
│   ├── migrations/            # Riwayat perubahan skema database
│   └── schema.prisma          # Model dan relasi database
├── src/
│   ├── config/                # Konfigurasi aplikasi/database
│   ├── controllers/            # Pengendali request
│   ├── middleware/             # Middleware autentikasi dan unggahan
│   ├── public/                 # CSS, JavaScript, dan aset statis
│   ├── routes/                 # Rute aplikasi
│   ├── services/               # Logika bisnis dan integrasi layanan
│   ├── utils/                  # Utilitas
│   └── views/                  # Template EJS
├── .gitignore
├── package.json
├── package-lock.json
├── prisma.config.ts
└── README.md
```

Nama folder `orc-service` dipertahankan sesuai nama yang digunakan di
repository.

## Prasyarat

Pastikan perangkat pengembangan memiliki:

-   Node.js dan npm.
-   PostgreSQL yang aktif.
-   Python 3.
-   Ollama jika fitur parsing AI lokal akan digunakan.
-   Model Ollama `gemma3:4b` yang tersedia secara lokal.
-   Git untuk mengambil source code.

Dependensi Python, Poppler untuk pemrosesan PDF, dan mesin OCR yang
dibutuhkan dapat berbeda sesuai implementasi di `ocr_engine.py`. Periksa
file tersebut sebelum menyiapkan lingkungan OCR.

## Instalasi

### 1. Clone repository

``` bash
git clone https://github.com/MuhammadIkhsanAlFajri/SIMRITI-Sistem-Reminder-Tagihan-Internal-.git
cd SIMRITI-Sistem-Reminder-Tagihan-Internal-
```

### 2. Pasang dependensi Node.js

``` bash
npm install
```

### 3. Siapkan database PostgreSQL

Buat database PostgreSQL untuk SIMRITI. Nama database dan kredensialnya
dapat ditentukan sendiri melalui `DATABASE_URL` pada file environment.

Contoh format koneksi:

``` env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/NAMA_DATABASE?schema=public"
```

Ganti `USER`, `PASSWORD`, dan `NAMA_DATABASE` sesuai konfigurasi lokal.

### 4. Siapkan Prisma

Periksa `package.json`, `prisma/schema.prisma`, dan konfigurasi Prisma
untuk memastikan perintah yang tersedia sesuai dengan versi repository.
Jika menggunakan migration yang tersedia, tinjau dahulu isinya, kemudian
jalankan:

``` bash
npx prisma migrate deploy
npx prisma generate
```

Untuk lingkungan pengembangan baru, gunakan cara sinkronisasi skema yang
sesuai dengan prosedur proyek. Jangan menjalankan `prisma migrate reset`
pada database berisi data penting karena perintah tersebut dapat
menghapus data.

### 5. Siapkan layanan OCR (opsional)

Masuk ke folder layanan OCR dan buat virtual environment Python:

**Windows PowerShell**

``` powershell
cd orc-service
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Pasang dependensi Python yang dibutuhkan. Jika repository memiliki
`requirements.txt`, gunakan:

``` bash
pip install -r requirements.txt
```

Jika belum ada file `requirements.txt`, identifikasi dependensi dari
import pada file Python dan dokumentasikan dependensi yang benar sebelum
instalasi.

Pastikan Ollama aktif dan model tersedia:

``` bash
ollama pull gemma3:4b
```

Model ini membutuhkan sumber daya komputer yang memadai. Jika tidak
memakai fitur parsing AI lokal, bagian ini tidak diperlukan untuk
menjalankan fitur web dasar, tetapi fitur OCR berbasis AI tidak akan
berfungsi lengkap.

## Konfigurasi Environment

Buat file `.env` di root project. Jangan mengunggah file ini ke
repository publik.

Contoh template --- sesuaikan nama variabel dengan yang dibaca oleh kode
aplikasi:

``` env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/NAMA_DATABASE?schema=public"
EMAIL_USER=
EMAIL_PASSWORD=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
MAILTRAP_API_TOKEN=
MAILTRAP_INBOX_ID=
```

**Penting:** - Isi variabel berdasarkan kebutuhan fitur yang benar-benar
digunakan. - Periksa kode sumber untuk memastikan semua nama environment
variable cocok. - Jangan pernah menyimpan token, password, API key, atau
kredensial database sungguhan di README, screenshot, source code, atau
commit Git. - File `.env` seharusnya diabaikan oleh `.gitignore`;
repository dapat menyediakan `.env.example` tanpa nilai rahasia. -
`EMAIL_PASSWORD` sebaiknya menggunakan kredensial yang sesuai untuk
pengiriman email, misalnya App Password Gmail jika konfigurasi Gmail
memerlukannya.

## Menjalankan Aplikasi

### 1. Jalankan server web

Di root project, jalankan script yang tersedia di `package.json`. Pada
konfigurasi pengembangan yang digunakan, perintahnya:

``` bash
npm run dev
```

Jika script tersebut tidak tersedia di versi yang kamu clone, periksa
bagian `scripts` pada `package.json` dan gunakan perintah yang
didefinisikan di sana.

Buka browser:

``` text
http://localhost:3000
```

### 2. Jalankan layanan OCR

Buka terminal terpisah, masuk ke root project lalu jalankan:

``` powershell
cd orc-service
.\venv\Scripts\Activate.ps1
python app.py
```

Layanan OCR secara default berjalan di `http://127.0.0.1:5000`.

Layanan Ollama yang dipakai `llm_parser.py` diakses pada
`http://127.0.0.1:11434/api/generate`.

Pastikan port dan alamat sesuai dengan konfigurasi aplikasi. Untuk
penggunaan produksi, jangan mengekspos layanan OCR atau Ollama ke
jaringan publik tanpa autentikasi dan pengamanan yang sesuai.

## Alur Sistem

### Pengelolaan tagihan

1.  Pengguna masuk ke aplikasi.
2.  Pengguna menambahkan atau memperbarui data invoice.
3.  Aplikasi menyimpan data melalui Prisma ORM ke PostgreSQL.
4.  Sistem menentukan dan menampilkan status tagihan berdasarkan tanggal
    jatuh tempo dan pembayaran.

### OCR invoice

1.  Pengguna mengunggah file invoice melalui aplikasi web.
2.  Node.js mengirim file ke endpoint Flask `/ocr`.
3.  Layanan OCR mengekstrak teks dari PDF atau gambar.
4.  Teks diteruskan ke Ollama/Gemma untuk menghasilkan data invoice
    terstruktur.
5.  Hasil dikembalikan ke Node.js untuk ditampilkan atau diproses lebih
    lanjut.

Hasil OCR dan parsing AI dapat keliru. Pengguna perlu memeriksa vendor,
nomor invoice, nominal, tanggal invoice, dan tanggal jatuh tempo sebelum
menyimpan atau mengandalkan data tersebut.

### Pembayaran dan tagihan berulang

Data tagihan memiliki relasi ke data pembayaran. Struktur ini
memungkinkan pencatatan transaksi pembayaran per periode. Detail aturan
pembentukan periode berikutnya mengikuti implementasi layanan tagihan
dan pembayaran pada source code.

### Pengingat

Scheduler aplikasi memeriksa tagihan dan meneruskan pengingat melalui
layanan email dan/atau Telegram sesuai konfigurasi. Pastikan kredensial
layanan sudah benar dan layanan terkait dapat diakses.

## Desain Database

Skema utama didefinisikan di `prisma/schema.prisma`. Model yang
tercantum meliputi:

  Model                  Fungsi
  ---------------------- --------------------------------------------
  `User`                 Data pengguna aplikasi
  `PasswordResetToken`   Token dan waktu kedaluwarsa reset password
  `Vendor`               Data perusahaan/penerbit tagihan
  `Bill`                 Data utama tagihan atau invoice
  `Payment`              Riwayat transaksi pembayaran dan periode
  `ReminderSetting`      Pengaturan pengingat
  `Notification`         Data notifikasi aplikasi
  `ActivityLog`          Catatan aktivitas pengguna

Relasi, kolom, tipe data, dan enum status yang berlaku dapat dilihat
langsung pada `prisma/schema.prisma`. File migration di
`prisma/migrations/` menyimpan riwayat perubahan struktur database.

## Layanan OCR

API OCR berada di `orc-service/app.py` dan menerima permintaan
`POST /ocr` dengan file pada field `file`. Implementasi menerima
ekstensi PDF, PNG, JPG, dan JPEG. PDF diproses per halaman sebelum teks
hasil OCR dikirim ke parser AI.

Parser AI di `orc-service/llm_parser.py` menggunakan Ollama dengan model
`gemma3:4b` dan meminta keluaran JSON yang memuat:

-   `vendor`
-   `invoice_name`
-   `invoice_number`
-   `amount`
-   `invoice_date`
-   `due_date`

Format tanggal yang diharapkan parser adalah `YYYY-MM-DD`; nominal
dinormalisasi menjadi digit. Normalisasi format tidak menjamin data
hasil ekstraksi benar, sehingga verifikasi pengguna tetap diperlukan.

## Pengingat Email dan Telegram

### Email

Pengiriman email diimplementasikan menggunakan Nodemailer. Konfigurasi
akun diambil dari environment variable seperti `EMAIL_USER` dan
`EMAIL_PASSWORD`. Fitur yang ada mencakup email pengingat dan email
reset password.

### Telegram

Pengiriman pesan dilakukan melalui Telegram Bot API. Token bot dan chat
ID dibaca dari `TELEGRAM_BOT_TOKEN` dan `TELEGRAM_CHAT_ID`.

Jangan memasukkan token asli ke source code atau membagikannya di issue
publik. Jika token pernah terpublikasi, cabut atau rotasi token
tersebut.

## Pengujian

Repository menyertakan beberapa skrip pengujian, antara lain:

-   `src/test-db.js` --- pengujian koneksi database (periksa isi file
    sebelum menjalankan).
-   `src/testReminder.js` --- skrip pengujian reminder.
-   `src/testTelegram.js` --- skrip pengujian Telegram.
-   `test-email.js` --- skrip pengujian email.
-   `test-mailtrap-api.js` --- skrip pengujian Mailtrap API.

Skrip pengujian dapat mengirim pesan, mengakses layanan eksternal, atau
mengubah data sesuai implementasinya. Baca isi skrip dan pastikan
environment sudah benar sebelum menjalankan. Jalankan pengujian
menggunakan akun sandbox atau data dummy, bukan invoice dan kredensial
produksi.

## Troubleshooting

  -----------------------------------------------------------------------
  Masalah                             Pemeriksaan
  ----------------------------------- -----------------------------------
  Aplikasi tidak dapat terhubung ke   Pastikan PostgreSQL aktif,
  PostgreSQL                          `DATABASE_URL` benar, dan database
                                      tersedia.

  Prisma menampilkan error            Periksa `prisma/schema.prisma`,
  schema/client                       versi dependensi, lalu jalankan
                                      `npx prisma generate`.

  OCR mengembalikan                   Pastikan layanan Flask berjalan
  `ECONNREFUSED 127.0.0.1:5000`       pada port 5000.

  Parsing AI gagal                    Pastikan Ollama aktif, model
                                      `gemma3:4b` tersedia, dan endpoint
                                      lokal dapat diakses.

  Email gagal dikirim                 Periksa `EMAIL_USER`,
                                      `EMAIL_PASSWORD`, konfigurasi
                                      Gmail/SMTP, dan log error.

  Telegram gagal mengirim pesan       Periksa token bot, chat ID, koneksi
                                      internet, dan izin bot.

  Data invoice tidak terbaca dengan   Periksa kualitas PDF/gambar, hasil
  benar                               OCR, serta data hasil parsing
                                      sebelum menyimpan.
  -----------------------------------------------------------------------

## Keamanan

-   Jangan commit `.env` atau file yang berisi rahasia.
-   Jangan menggunakan data invoice asli, password, atau token dalam
    screenshot dokumentasi.
-   Batasi akses ke database dan gunakan kredensial khusus aplikasi.
-   Validasi tipe, ukuran, dan isi file yang diunggah; ekstensi file
    saja tidak cukup untuk memastikan file aman.
-   Hindari mencetak teks invoice atau informasi sensitif ke log
    produksi.
-   Gunakan HTTPS, autentikasi, pengaturan akses, dan konfigurasi server
    yang sesuai sebelum deployment publik.
-   Nonaktifkan mode debug pada layanan Flask untuk lingkungan produksi.
-   Tinjau ulang file pengujian sebelum menjalankannya pada layanan atau
    data produksi.

## Batasan dan Pengembangan Berikutnya

Pengembangan lanjutan yang dapat dipertimbangkan:

-   Menambahkan test otomatis untuk layanan, controller, dan alur
    pembayaran.
-   Menyediakan `.env.example` dan daftar dependensi Python yang
    terversi.
-   Menambahkan validasi hasil OCR serta konfirmasi pengguna sebelum
    penyimpanan.
-   Menambah audit log, pengamanan unggahan, dan penanganan error yang
    konsisten.
-   Menyediakan dokumentasi deployment, backup database, dan konfigurasi
    production.
-   Menambahkan screenshot antarmuka dan diagram database pada
    dokumentasi.

Daftar ini merupakan saran pengembangan, bukan klaim bahwa fitur
tersebut sudah diterapkan.

## Kontribusi

Kontribusi dan masukan dipersilakan. Untuk perubahan besar, buat issue
terlebih dahulu agar kebutuhan dan pendekatan dapat dibahas. Jangan
sertakan data invoice, token, atau kredensial rahasia saat melaporkan
masalah.

## Lisensi

Belum ada lisensi yang dinyatakan pada dokumentasi ini. Jika ingin
mengizinkan orang lain menggunakan, memodifikasi, dan mendistribusikan
source code secara jelas, tambahkan file `LICENSE` dan pilih lisensi
yang sesuai. Repository publik tanpa lisensi tidak otomatis memberikan
izin penggunaan ulang tanpa batas.

------------------------------------------------------------------------

**SIMRITI --- Smart Invoice Reminder System**\
*Invoice tracking, payment history, OCR-assisted extraction, and
automated reminders.*
