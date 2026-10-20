-- Akun login admin dashboard. GANTI username/password di bawah sebelum Run.
-- Password di-hash bcrypt (cost 12) oleh pgcrypto, jadi yang tersimpan hanya hash.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

INSERT INTO public.users (username, nama, password_hash)
VALUES ('admin', 'Administrator', extensions.crypt('GANTI_PASSWORD_ADMIN', extensions.gen_salt('bf', 12)))
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;
