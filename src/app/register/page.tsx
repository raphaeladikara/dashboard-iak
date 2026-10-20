import { AuthShell } from "@/components/auth-shell";
import { RegisterForm } from "@/components/register-form";

export const metadata = { title: "Daftar · Dashboard Padi 2025" };

export default function RegisterPage() {
  return (
    <AuthShell>
      <RegisterForm />
    </AuthShell>
  );
}
