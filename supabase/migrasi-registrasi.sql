-- Registrasi akun + login demo. Aman dijalankan ulang (idempotent).
-- Sudah termasuk di schema.sql; file ini untuk database yang dibuat
-- sebelum fitur registrasi ada. Supabase → SQL Editor → tempel → Run.

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
