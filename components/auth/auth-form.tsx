"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { captureEvent } from "@/lib/posthog/client";
import { PostHogEvents } from "@/lib/posthog/events";
import { authErrorMessage } from "@/lib/auth-errors";

export function AuthForm({
  mode,
}: {
  mode: "signIn" | "signUp";
}) {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signIn("password", {
        flow: mode === "signUp" ? "signUp" : "signIn",
        email: email.trim(),
        password,
        ...(mode === "signUp" ? { name: name.trim() || email.trim() } : {}),
      });
      captureEvent(
        mode === "signUp"
          ? PostHogEvents.userSignedUp
          : PostHogEvents.userSignedIn,
        { method: "password" },
      );
      router.push("/onboarding");
    } catch (caught) {
      setError(authErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold tracking-tight">
          {mode === "signUp" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signUp"
            ? "Sign up to start tracking issues with your team."
            : "Sign in to your Manut workspace."}
        </p>
      </div>

      <OAuthButtons mode={mode} onError={setError} />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            or continue with email
          </span>
        </div>
      </div>

      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        {mode === "signUp" && (
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Alex Chen"
              autoComplete="name"
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={
              mode === "signUp" ? "new-password" : "current-password"
            }
          />
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {mode === "signUp" ? "Create account with email" : "Sign in with email"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {mode === "signUp" ? (
          <>
            Already have an account?{" "}
            <Link href="/sign-in" className="text-foreground underline-offset-4 hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to Manut?{" "}
            <Link href="/sign-up" className="text-foreground underline-offset-4 hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
