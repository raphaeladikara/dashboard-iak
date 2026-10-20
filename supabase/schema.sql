-- Skema Dashboard Padi 2025 untuk Supabase (PostgreSQL).
-- Cara pakai: buka Supabase Dashboard → SQL Editor → tempel seluruh file ini → Run.
-- Aman dijalankan ulang (idempotent). Setelah itu jalankan supabase/seed-admin.sql.
-- Sudah termasuk registrasi + akun demo (lihat juga supabase/migrasi-registrasi.sql).

-- 1. Tabel fakta hasil ETL Pentaho -------------------------------------------
CREATE TABLE IF NOT EXISTS public.fakta_produksi_konsumsi_2025 (
  provinsi                       varchar(100) PRIMARY KEY,
  luas_panen_ha                  double precision,
  produktivitas_ku_ha            double precision,
  produksi_padi_ton              double precision,
  produksi_beras_ton             double precision,
  luas_wilayah_km2               double precision,
  jumlah_penduduk_ribu           double precision,
  konsumsi_beras_per_kapita      double precision,
  estimasi_konsumsi_beras_ton    double precision,
  selisih_produksi_konsumsi_ton  double precision
);

-- 2. Waktu tabel fakta dimuat (pengganti information_schema.CREATE_TIME MariaDB)
CREATE TABLE IF NOT EXISTS public.meta_tabel (
  nama        text PRIMARY KEY,
  dibuat      timestamptz NOT NULL DEFAULT now(),
  diperbarui  timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.tandai_fakta_diperbarui() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO meta_tabel (nama) VALUES (TG_TABLE_NAME)
  ON CONFLICT (nama) DO UPDATE SET diperbarui = now();
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_fakta_diperbarui ON public.fakta_produksi_konsumsi_2025;
CREATE TRIGGER trg_fakta_diperbarui
  AFTER INSERT OR UPDATE OR DELETE ON public.fakta_produksi_konsumsi_2025
  FOR EACH STATEMENT EXECUTE FUNCTION public.tandai_fakta_diperbarui();

-- 3. Data 38 provinsi (dump MariaDB hasil ETL) --------------------------------
INSERT INTO public.fakta_produksi_konsumsi_2025 VALUES
  ('Aceh',283182,57.04,1615200,930489,56835,5626,93.9,528281.4,402207.6),
  ('Bali',96444,60.95,587866,331531,5582,4461.3,105.3,469774.89,-138243.89),
  ('Banten',345421,51.36,1774017,1010357,9355,12537.4,89.8,1125858.52,-115501.52000000002),
  ('Bengkulu',51654,51.61,266567,153533,20122,2138,91.6,195840.8,-42307.79999999999),
  ('DI Yogyakarta',107224,51.06,547510,311000,3170,3781.5,74.6,282099.89999999997,28900.100000000035),
  ('DKI Jakarta',274,54.38,1487,877,661,10678,80.6,860646.7999999999,-859769.7999999999),
  ('Gorontalo',53897,52.17,281171,156995,12024,1242.2,102.6,127449.72,29545.28),
  ('Jambi',80373,45.76,367791,212757,49023,3768.5,81.9,308640.15,-95883.15000000002),
  ('Jawa Barat',1755300,58.26,10226654,5905710,37053,50759,86.3,4380501.7,1525208.2999999998),
  ('Jawa Tengah',1674994,55.55,9304063,5350386,34347,38233.9,80.9,3093122.5100000002,2257263.4899999998),
  ('Jawa Timur',1841346,56.69,10438361,6027320,48055,42089.3,85.5,3598635.1500000004,2428684.8499999996),
  ('Kalimantan Barat',263551,28.75,757829,448325,147018,5766,86.3,497605.8,-49280.79999999999),
  ('Kalimantan Selatan',290332,40.62,1179338,697788,37125,4323.3,85.4,369209.82000000007,328578.17999999993),
  ('Kalimantan Tengah',97151,34.32,333429,198061,153430,2845,84.8,241256,-43195),
  ('Kalimantan Timur',66518,40.72,270867,157555,126951,4267.6,76.2,325191.12000000005,-167636.12000000005),
  ('Kalimantan Utara',10210,37.26,38038,22550,69900,749.4,78.1,58528.13999999999,-35978.13999999999),
  ('Kepulauan Bangka Belitung',16287,39.48,64304,38115,16670,1550.8,81,125614.8,-87499.8),
  ('Kepulauan Riau',216,31.86,688,394,8170,2213.5,76.3,168890.05,-168496.05),
  ('Lampung',596017,54.57,3252627,1869782,33570,9522.9,84.3,802780.47,1067001.53),
  ('Maluku',24323,42.68,103819,58139,46133,1970.6,84.4,166318.64,-108179.64000000001),
  ('Maluku Utara',6655,34.02,22642,12670,31465,1373.8,83.9,115261.82,-102591.82),
  ('Nusa Tenggara Barat',322896,52.92,1708619,973144,19631,5731.1,114.1,653918.51,319225.49),
  ('Nusa Tenggara Timur',212090,45.66,968324,567178,46378,5742.6,111.1,638002.86,-70824.85999999999),
  ('Papua',432,42.99,1859,1061,81383,1073.6,69,74078.4,-73017.4),
  ('Papua Barat',2663,50.19,13366,8031,60308,587.6,77.8,45715.28,-37684.28),
  ('Papua Barat Daya',310,26.75,830,499,39103,636.4,76.9,48939.16,-48440.16),
  ('Papua Pegunungan',79,43.99,346,198,52508,1484.9,43.9,65187.11,-64989.11),
  ('Papua Selatan',79434,45.64,362542,207007,117858,549.7,66.5,36555.05,170451.95),
  ('Papua Tengah',999,38.08,3805,2173,61079,1492.3,58.8,87747.23999999999,-85574.23999999999),
  ('Riau',59502,39,232071,133187,89900,6811.2,82.3,560561.76,-427374.76),
  ('Sulawesi Barat',74098,52.1,386084,221738,16590,1525.3,103.6,158021.08,63716.92000000001),
  ('Sulawesi Selatan',1041701,52.48,5466592,3136929,45323,9563.1,96.8,925708.08,2211220.92),
  ('Sulawesi Tengah',198290,46.4,920086,543107,61496,3156.1,100.4,316872.44,226234.56),
  ('Sulawesi Tenggara',151811,44.85,680820,390981,36139,2836.7,96.1,272606.87,118374.13),
  ('Sulawesi Utara',59912,44.25,265112,148975,14488,2721.4,99.3,270235.02,-121260.02000000002),
  ('Sumatera Barat',284076,48.67,1382697,800613,42107,5914.3,92.6,547664.1799999999,252948.82000000007),
  ('Sumatera Selatan',636316,57,3627022,2082836,86771,8928.5,88.7,791957.9500000001,1290878.0499999998),
  ('Sumatera Utara',535009,51.45,2752655,1578968,72437,15785.8,92.6,1461765.0799999998,117202.92000000016)
ON CONFLICT (provinsi) DO UPDATE SET
  luas_panen_ha                 = EXCLUDED.luas_panen_ha,
  produktivitas_ku_ha           = EXCLUDED.produktivitas_ku_ha,
  produksi_padi_ton             = EXCLUDED.produksi_padi_ton,
  produksi_beras_ton            = EXCLUDED.produksi_beras_ton,
  luas_wilayah_km2              = EXCLUDED.luas_wilayah_km2,
  jumlah_penduduk_ribu          = EXCLUDED.jumlah_penduduk_ribu,
  konsumsi_beras_per_kapita     = EXCLUDED.konsumsi_beras_per_kapita,
  estimasi_konsumsi_beras_ton   = EXCLUDED.estimasi_konsumsi_beras_ton,
  selisih_produksi_konsumsi_ton = EXCLUDED.selisih_produksi_konsumsi_ton;

-- 4. Tabel pendukung aplikasi ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id             integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username       varchar(50)  NOT NULL UNIQUE,
  nama           varchar(100) NOT NULL,
  password_hash  varchar(100) NOT NULL,          -- bcrypt, bukan password asli
  created_at     timestamptz  NOT NULL DEFAULT now(),
  last_login_at  timestamptz
);

-- Jejak percobaan login, untuk pengujian keamanan/akses (BAB IV) dan
-- pembatas percobaan gagal (dipakai bersama oleh semua instance Vercel).
CREATE TABLE IF NOT EXISTS public.login_audit (
  id        integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username  varchar(50) NOT NULL,
  berhasil  boolean     NOT NULL,
  ip        varchar(64),
  waktu     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_kunci ON public.login_audit (username, ip, waktu DESC);

-- 5. Tutup akses lewat REST API Supabase (anon/authenticated key) -------------
-- Aplikasi konek langsung ke Postgres, bukan lewat PostgREST. RLS tanpa policy
-- untuk anon/authenticated berarti tabel tidak bisa dibaca pakai anon key.
ALTER TABLE public.fakta_produksi_konsumsi_2025 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_tabel                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_audit                  ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.fakta_produksi_konsumsi_2025, public.meta_tabel,
              public.users, public.login_audit FROM anon, authenticated;

-- 6. Role database khusus aplikasi (hak akses minimum) ------------------------
-- GANTI password di bawah sebelum Run, lalu pakai di DATABASE_URL.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'iak_dashboard') THEN
    CREATE ROLE iak_dashboard LOGIN PASSWORD 'GANTI_PASSWORD_ROLE_APLIKASI';
  END IF;
END $$;
ALTER ROLE iak_dashboard WITH LOGIN PASSWORD 'GANTI_PASSWORD_ROLE_APLIKASI';

GRANT USAGE ON SCHEMA public TO iak_dashboard;
GRANT SELECT ON public.fakta_produksi_konsumsi_2025, public.meta_tabel TO iak_dashboard;
GRANT SELECT (id, username, nama, password_hash), UPDATE (last_login_at) ON public.users TO iak_dashboard;
GRANT SELECT, INSERT ON public.login_audit TO iak_dashboard;

DROP POLICY IF EXISTS app_baca ON public.fakta_produksi_konsumsi_2025;
CREATE POLICY app_baca ON public.fakta_produksi_konsumsi_2025 FOR SELECT TO iak_dashboard USING (true);
DROP POLICY IF EXISTS app_baca ON public.meta_tabel;
CREATE POLICY app_baca ON public.meta_tabel FOR SELECT TO iak_dashboard USING (true);
DROP POLICY IF EXISTS app_baca ON public.users;
CREATE POLICY app_baca ON public.users FOR SELECT TO iak_dashboard USING (true);
DROP POLICY IF EXISTS app_login ON public.users;
CREATE POLICY app_login ON public.users FOR UPDATE TO iak_dashboard USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS app_audit ON public.login_audit;
CREATE POLICY app_audit ON public.login_audit FOR ALL TO iak_dashboard USING (true) WITH CHECK (true);

-- 7. Registrasi akun + login demo ---------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Jenis kejadian di jejak audit: login, daftar, atau demo.
ALTER TABLE public.login_audit ADD COLUMN IF NOT EXISTS jenis varchar(10) NOT NULL DEFAULT 'login';
CREATE INDEX IF NOT EXISTS idx_audit_ip ON public.login_audit (ip, jenis, waktu DESC);

-- Username dicocokkan tanpa membedakan huruf besar/kecil.
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower ON public.users (lower(username));

-- Role aplikasi boleh membuat akun baru, tapi hanya mengisi 3 kolom ini.
GRANT INSERT (username, nama, password_hash) ON public.users TO iak_dashboard;
DROP POLICY IF EXISTS app_daftar ON public.users;
CREATE POLICY app_daftar ON public.users FOR INSERT TO iak_dashboard WITH CHECK (true);

-- Akun demo: password-nya hash dari string acak yang tidak disimpan di mana pun,
-- jadi akun ini tidak bisa dibuka lewat form login, hanya lewat tombol demo.
-- Hapus baris akun ini untuk mematikan login demo.
INSERT INTO public.users (username, nama, password_hash)
VALUES ('demo', 'Akun Demo', extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf', 12)))
ON CONFLICT DO NOTHING;

-- 8. Validasi ----------------------------------------------------------------
SELECT COUNT(*) AS jumlah_provinsi,
       COUNT(*) FILTER (WHERE produksi_padi_ton IS NULL) AS produksi_padi_kosong
FROM public.fakta_produksi_konsumsi_2025;
