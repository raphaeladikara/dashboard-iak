import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "Masuk · Dashboard Padi 2025" };

export default function LoginPage() {
  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  );
}
