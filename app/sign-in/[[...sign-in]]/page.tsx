import { AuthForm } from "@/components/auth/auth-form";
import { CONTENT_PX } from "@/lib/responsive";

export default function SignInPage() {
  return (
    <main
      className={`flex min-h-dvh items-center justify-center py-8 ${CONTENT_PX}`}
    >
      <AuthForm mode="signIn" />
    </main>
  );
}
