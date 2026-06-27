import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import "./app.css";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <title>Great Manut</title>
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[#222733] px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">Great Manut</div>
          <div className="muted text-sm">Cloudflare-native issue tracking</div>
        </div>
      </header>
      <main className="px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}

export function ErrorBoundary({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : "Unknown error";
  return (
    <main className="px-6 py-10">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="muted mt-2">{message}</p>
    </main>
  );
}
