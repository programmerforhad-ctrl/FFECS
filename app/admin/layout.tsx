"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type State = "loading" | "out" | "denied" | "ok";

const NAV = [
  ["/admin", "Dashboard"],
  ["/admin/settings", "Site Settings"],
  ["/admin/members", "Management"],
  ["/admin/events", "Events"],
  ["/admin/tournaments", "Tournaments"],
  ["/admin/forms", "Forms & Responses"],
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState(false);
  const path = usePathname();

  async function check() {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return setState("out");
    const { data: row } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
    setState(row ? "ok" : "denied");
  }

  useEffect(() => {
    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      check();
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setErr(error.message);
  }

  const logout = () => supabase.auth.signOut();

  if (state === "loading") {
    return <div className="flex min-h-screen items-center justify-center text-zinc-500">Loading…</div>;
  }

  if (state === "out") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <form onSubmit={login} className="card w-full max-w-sm space-y-4 p-6">
          <div className="text-center">
            <p className="eyebrow">Admin</p>
            <h1 className="mt-1 text-3xl font-bold text-white">Sign in</h1>
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          {err && <p className="text-sm text-red-400">{err}</p>}
          <button disabled={busy} className="btn btn-primary w-full">
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <Link href="/" className="block text-center text-xs text-zinc-500 hover:text-brand">
            ← Back to website
          </Link>
        </form>
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="card max-w-md space-y-3 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">Not an admin</h1>
          <p className="text-sm text-zinc-400">
            You are signed in, but this account is not in the admins list. Run the "make yourself admin" SQL from the README, then
            refresh.
          </p>
          <button onClick={logout} className="btn btn-ghost">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  const active = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));

  return (
    <div className="min-h-screen lg:flex">
      <aside className="border-b border-line bg-panel lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-4 py-3 lg:block">
          <span className="font-display text-lg font-bold text-white">Admin Panel</span>
          <button className="btn btn-ghost btn-sm lg:hidden" onClick={() => setMenu(!menu)}>
            {menu ? "✕" : "☰"}
          </button>
        </div>
        <nav className={`${menu ? "block" : "hidden"} space-y-1 px-3 pb-3 lg:block`}>
          {NAV.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenu(false)}
              className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                active(href) ? "bg-brand/15 text-brand" : "text-zinc-300 hover:bg-white/5"
              }`}
            >
              {label}
            </Link>
          ))}
          <hr className="my-2 border-line" />
          <Link href="/" target="_blank" className="block rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-white/5">
            View website ↗
          </Link>
          <button onClick={logout} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-400 hover:bg-white/5">
            Sign out
          </button>
        </nav>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-8">{children}</main>
    </div>
  );
}
