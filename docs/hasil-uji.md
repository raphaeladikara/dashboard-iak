# Hasil pengujian black-box

Dijalankan 20/10/2026, 16.06.32 terhadap http://localhost:3000. 29 dari 29 skenario lulus.

| No | Kelompok | Skenario | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|
| 1 | Akses | Buka API tanpa login | 401 | 401 | Lulus |
| 2 | Akses | Buka dashboard tanpa login | redirect ke /login | 307 → /login | Lulus |
| 3 | Login | Password salah | 401, pesan generik | 401 "Username atau password salah" | Lulus |
| 4 | Login | Username tidak terdaftar | 401, pesan sama dengan password salah | 401 "Username atau password salah" | Lulus |
| 5 | Login | SQL injection di username | 401 (tidak bisa masuk) | 401 | Lulus |
| 6 | Login | Form kosong | 400 | 400 | Lulus |
| 7 | Login | 6× salah untuk satu username | percobaan ke-6 diblokir (429) | 429 | Lulus |
| 8 | Akses | Cookie session palsu | 401 | 401 | Lulus |
| 9 | Login | Login dengan akun benar | 200 + cookie httpOnly | 200, httpOnly=true | Lulus |
| 10 | API | GET /api | 200 JSON | 200 | Lulus |
| 11 | API | GET /api/provinsi | 200 JSON | 200 | Lulus |
| 12 | API | GET /api/kpi | 200 JSON | 200 | Lulus |
| 13 | API | GET /api/kpi?provinsi=Jawa Timur | 200 JSON | 200 | Lulus |
| 14 | API | GET /api/chart/top-produksi | 200 JSON | 200 | Lulus |
| 15 | API | GET /api/chart/produktivitas?urut=asc | 200 JSON | 200 | Lulus |
| 16 | API | GET /api/chart/produksi-konsumsi?limit=15 | 200 JSON | 200 | Lulus |
| 17 | API | GET /api/chart/selisih | 200 JSON | 200 | Lulus |
| 18 | API | GET /api/chart/scatter-panen | 200 JSON | 200 | Lulus |
| 19 | API | GET /api/insight | 200 JSON | 200 | Lulus |
| 20 | API | GET /api/meta | 200 JSON | 200 | Lulus |
| 21 | API | Filter provinsi tidak dikenal | 400 | 400 | Lulus |
| 22 | Data | Daftar provinsi | 38 provinsi | 38 | Lulus |
| 23 | Data | Grafik 4 memuat semua provinsi | 38 baris | 38 | Lulus |
| 24 | Data | Filter Bali di grafik 1 | Bali ikut dikirim walau di luar 10 besar | 11 baris, Bali di_luar_peringkat=true | Lulus |
| 25 | Data | KPI Total produksi padi = query SQL langsung | sama | API 60207098.00 | SQL 60207098.00 | Lulus |
| 26 | Data | KPI Total produksi beras = query SQL langsung | sama | API 34690959.00 | SQL 34690959.00 | Lulus |
| 27 | Data | KPI Produktivitas nasional = query SQL langsung | sama | API 53.18 | SQL 53.18 | Lulus |
| 28 | Data | KPI Rasio produksi/konsumsi = query SQL langsung | sama | API 139.90 | SQL 139.90 | Lulus |
| 29 | Akses | Logout lalu buka API | 401 | logout 200, lalu 401 | Lulus |
