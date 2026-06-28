import { AuthForm } from "@/components/auth/auth-form";

export default function SignInPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <AuthForm mode="signIn" />
    </main>
  );
}
