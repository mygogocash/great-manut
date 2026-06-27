import { Form, redirect, useNavigation } from "react-router";
import { useState } from "react";
import { loginWithMagicCode, requestMagicCode, useAuthToken } from "../../features/app-state";

export function meta() {
  return [{ title: "Login · Great Manut" }];
}

export default function LoginRoute() {
  const navigation = useNavigation();
  const token = useAuthToken();
  const [email, setEmail] = useState("dev@gogocash.co");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [error, setError] = useState<string | null>(null);

  if (token) {
    throw redirect("/app");
  }

  return (
    <div className="max-w-md mx-auto card p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="muted text-sm mt-1">Magic link auth with JWT for web and future mobile.</p>
      </div>

      {step === "email" ? (
        <Form
          onSubmit={async (event) => {
            event.preventDefault();
            setError(null);
            try {
              await requestMagicCode(email);
              setStep("code");
            } catch {
              setError("Could not send magic code.");
            }
          }}
          className="space-y-3"
        >
          <label className="block space-y-1">
            <span className="text-sm muted">Email</span>
            <input
              className="w-full rounded-lg border border-[#222733] bg-[#0b0d12] px-3 py-2"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
            />
          </label>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            className="w-full rounded-lg bg-[#5e6ad2] px-3 py-2 font-medium text-white"
            type="submit"
            disabled={navigation.state !== "idle"}
          >
            Send code
          </button>
        </Form>
      ) : (
        <Form
          onSubmit={async (event) => {
            event.preventDefault();
            setError(null);
            try {
              await loginWithMagicCode(email, code);
              window.location.href = "/app";
            } catch {
              setError("Invalid code. Check the API worker logs in dev.");
            }
          }}
          className="space-y-3"
        >
          <p className="text-sm muted">Enter the 6-digit code from worker logs (dev mode).</p>
          <label className="block space-y-1">
            <span className="text-sm muted">Code</span>
            <input
              className="w-full rounded-lg border border-[#222733] bg-[#0b0d12] px-3 py-2"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              inputMode="numeric"
              required
            />
          </label>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button className="w-full rounded-lg bg-[#5e6ad2] px-3 py-2 font-medium text-white" type="submit">
            Verify
          </button>
        </Form>
      )}
    </div>
  );
}
