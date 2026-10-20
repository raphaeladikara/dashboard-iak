# Dashboard Padi 2025

Dashboard produksi dan konsumsi beras per provinsi tahun 2025, dibuat untuk Tugas 2 mata kuliah Enterprise Application Integration. Datanya dari 5 file BPS dan Bapanas (CSV, XLSX, JSON) yang digabung dengan ETL Pentaho, lalu dimuat ke PostgreSQL di Supabase. Aplikasinya di-deploy ke Vercel.

## 1. Siapkan database di Supabase

1. Buat project baru di [supabase.com](https://supabase.com). Pilih region **Southeast Asia (Singapore)** supaya dekat dengan server Vercel (`sin1` di `vercel.json`).
2. Buka **SQL Editor** → New query, tempel isi [`supabase/schema.sql`](supabase/schema.sql).
   Ganti dulu `GANTI_PASSWORD_ROLE_APLIKASI` (muncul 2 kali) dengan password acak, lalu **Run**.
   Isinya: tabel fakta + 38 provinsi, tabel `users`, `login_audit`, `meta_tabel`, RLS aktif, dan role `iak_dashboard` yang hak aksesnya dibatasi.
3. Query baru lagi, tempel [`supabase/seed-admin.sql`](supabase/seed-admin.sql). Ganti username dan `GANTI_PASSWORD_ADMIN`, lalu **Run**. Ini akun untuk login ke dashboard.

Cara lain untuk langkah 2–3: isi `DATABASE_URL_ADMIN`, `APP_DB_PASSWORD`, dan `SEED_ADMIN_*` di `.env.local`, lalu jalankan `npm run setup`.

## 2. Isi `.env.local`

Salin `.env.example` menjadi `.env.local`. Nilai yang dipakai aplikasi:

| Variabel | Isi | Perlu di Vercel? |
|---|---|---|
| `DATABASE_URL` | Supabase → **Connect** → *Transaction pooler* (port 6543). Ganti user menjadi `iak_dashboard.<PROJECT_REF>` dan password menjadi password role dari langkah 1.2 | Ya |
| `SESSION_SECRET` | String acak minimal 32 karakter | Ya |
| `DATABASE_URL_ADMIN`, `APP_DB_PASSWORD`, `SEED_ADMIN_*` | Hanya untuk `npm run setup` dan `npm run uji` | Tidak |

Contoh `DATABASE_URL`:

```
postgresql://iak_dashboard.abcdefghijklmnop:passwordRole@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

## 3. Jalankan di localhost

Yang perlu terpasang: Node.js 20 ke atas.

```bash
npm install
```

```bash
npm run dev
```

Buka http://localhost:3000 dan login dengan akun dari `seed-admin.sql`.

Pengujian otomatis (aplikasi harus sedang jalan, `BASE_URL` bisa diarahkan ke URL Vercel):

```bash
npm run uji
```

Ada 29 skenario: login, hak akses, semua endpoint, dan kecocokan KPI dengan query SQL langsung. Tabel hasilnya tersimpan di `docs/hasil-uji.md` dan bisa langsung disalin ke BAB IV.

## 4. Deploy ke Vercel

1. Push repo ini ke GitHub, lalu di [vercel.com/new](https://vercel.com/new) pilih **Import** repo tersebut. Framework otomatis terdeteksi sebagai Next.js, jadi build command tidak perlu diubah.
2. Di **Environment Variables**, isi `DATABASE_URL` dan `SESSION_SECRET` (nilai yang sama dengan `.env.local`).
3. Klik **Deploy**. Setelah selesai, buka URL `*.vercel.app` dan login.

Kalau env variable diubah setelah deploy, jalankan **Redeploy** supaya nilainya terbaca.

## Kaitan dengan materi PPT

| Materi | Penerapan di proyek |
|---|---|
| Data-level EAI: transformation | ETL Pentaho: filter baris total, cleaning nama provinsi, ubah teks ke angka, merge join 5 sumber, hitung estimasi konsumsi |
| Data-level EAI: one-way synchronization | Data hanya mengalir satu arah, dari file sumber ke PostgreSQL (Supabase) lalu ke dashboard. Dashboard menampilkan waktu tabel terakhir dimuat, dan tombol ambil ulang meminta data terbaru dari database |
| Application Interface-level (API) | Dashboard tidak menyentuh database. Semua data diambil lewat REST API berformat JSON |
| Three-tier architecture | UI (halaman Next.js), business logic (route API di `src/app/api`), dan data (PostgreSQL di Supabase) terpisah. Koneksi ke database lewat connection pool |
| Types of services | Business service: login, KPI, insight. Data service: daftar provinsi, data grafik, metadata. Daftar lengkapnya di `GET /api` |
| Types of interface: controlled | Semua layanan selain login wajib session, dan user database aplikasi hanya boleh membaca tabel fakta |

## Struktur

| Lapisan | Isi | File |
|---|---|---|
| Presentasi | Halaman login, dashboard (5 KPI, 6 grafik ECharts, filter provinsi, insight, panel ETL) | `src/app/login`, `src/components/dashboard` |
| Business logic | Route API, perhitungan KPI dan insight, autentikasi | `src/app/api`, `src/lib/data.ts`, `src/lib/insight.ts`, `src/proxy.ts` |
| Data | PostgreSQL Supabase, tabel `fakta_produksi_konsumsi_2025` | `src/lib/db.ts`, `supabase/schema.sql` |

## Endpoint API

Semua endpoint selain `/api/auth/*` butuh session. Tanpa session, balasannya 401. Parameter `?provinsi=` boleh dikosongkan, dan nilainya dicocokkan dulu dengan daftar provinsi di database.

| Endpoint | Jenis layanan | Isi |
|---|---|---|
| `GET /api` | — | Katalog layanan |
| `POST /api/auth/login` | business | Cek username dan password, buat cookie session httpOnly (berlaku 8 jam) |
| `POST /api/auth/logout` | business | Hapus cookie session |
| `GET /api/provinsi` | data | 38 provinsi untuk filter |
| `GET /api/kpi` | business | 5 KPI, angka nasional sebagai pembanding, dan peringkat provinsi |
| `GET /api/chart/top-produksi` | data | Grafik 1: 10 provinsi produksi padi tertinggi |
| `GET /api/chart/produktivitas?urut=desc\|asc` | data | Grafik 2: produktivitas 10 tertinggi atau terendah |
| `GET /api/chart/produksi-konsumsi?limit=15` | data | Grafik 3: produksi beras dan estimasi konsumsi |
| `GET /api/chart/selisih` | data | Grafik 4: selisih produksi dan konsumsi, 38 provinsi |
| `GET /api/chart/scatter-panen` | data | Grafik 5 dan 6: luas panen, produksi, luas wilayah |
| `GET /api/insight` | business | 5 kalimat temuan yang angkanya dihitung dari data |
| `GET /api/meta` | data | Sumber data, langkah ETL, dan hasil validasi tabel |

## Keamanan login

- Password disimpan sebagai hash bcrypt (cost 12).
- Session berupa JWT bertanda tangan HS256 di cookie `httpOnly` dengan `sameSite=lax`.
- `src/proxy.ts` menjaga semua halaman dan API, lalu setiap route API memeriksa session sekali lagi.
- Setelah 5 kali gagal dalam 10 menit untuk IP dan username yang sama, login diblokir sementara. Hitungannya diambil dari tabel `login_audit`, jadi tetap berlaku walaupun request dilayani instance Vercel yang berbeda.
- Pesan gagal login sama untuk password salah maupun username yang tidak ada, jadi orang luar tidak bisa menebak username mana yang terdaftar.
- Aplikasi konek ke Postgres sebagai role `iak_dashboard`, yang hanya punya hak `SELECT` pada tabel fakta. Semua tabel memakai RLS, jadi tidak bisa dibaca lewat anon key Supabase.
- Semua query memakai parameter terikat (tagged template `postgres`), sehingga input pengguna tidak bisa menyisipkan SQL.

Batasannya: session tidak disimpan di server, jadi logout hanya menghapus cookie di browser. Token yang sempat tersalin tetap berlaku sampai habis masa 8 jamnya. Untuk skala tugas ini masih wajar, tapi perlu dicatat di laporan.
