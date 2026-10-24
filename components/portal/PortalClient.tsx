"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { PortalMatch, PortalTeam } from "@/lib/types";
import { fmtDateTime } from "@/lib/format";
import { Countdown, useRemaining } from "@/components/Countdown";
import { StatusBadge } from "@/components/ui";
import Contours from "@/components/Contours";

const KEY = "ffec_portal_login";

type Creds = { email: string; uid: string };

function CopyField({ label, value }: { label: string; value: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="rounded-xl border border-brand/40 bg-brand/10 p-4">
      <p className="text-xs text-zinc-400">{label}</p>
      <div className="mt-1 flex items-center justify-between gap-3">
        <span className="break-all font-display text-3xl font-black tracking-wider text-white sm:text-4xl">{value || "—"}</span>
        {value && (
          <button
            className="btn btn-ghost btn-sm shrink-0"
            onClick={() => {
              navigator.clipboard?.writeText(value);
              setOk(true);
              setTimeout(() => setOk(false), 1500);
            }}
          >
            {ok ? "Copied" : "Copy"}
          </button>
        )}
      </div>
    </div>
  );
}

// Calls `onZero` the moment the room details unlock, so they appear without a page refresh.
function UnlockWatcher({ at, offsetMs, onZero }: { at: string; offsetMs: number; onZero: () => void }) {
  useRemaining(at, offsetMs, onZero);
  return null;
}

function MatchCard({ m, offsetMs, refresh }: { m: PortalMatch; offsetMs: number; refresh: () => void }) {
  const unlockDiffers = m.reveal_at !== m.start_time;
  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-2xl text-white">{m.title}</h4>
        <span className="text-sm text-zinc-400">{fmtDateTime(m.start_time)}</span>
      </div>

      {m.state === "waiting" && (
        <div className="mt-4">
          <p className="mb-2 text-sm text-zinc-400">Match starts in</p>
          <Countdown target={m.start_time} offsetMs={offsetMs} />
          <p className="mt-4 rounded-lg border border-line bg-bg/60 px-3 py-2 text-sm text-zinc-400">
            Room ID and password appear here {unlockDiffers ? `at ${fmtDateTime(m.reveal_at)}` : "when the match starts"}. Keep this page open.
          </p>
          <UnlockWatcher at={m.reveal_at} offsetMs={offsetMs} onZero={refresh} />
        </div>
      )}

      {m.state === "open" && (
        <div className="mt-4 space-y-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-brand">
            <span className="live-dot h-2 w-2 rounded-full bg-brand" /> Room is open. Join now.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <CopyField label="Room ID" value={m.room_id ?? ""} />
            <CopyField label="Password" value={m.room_password ?? ""} />
          </div>
          {!m.room_id && <p className="text-sm text-zinc-400">The admin has not entered the room details yet. This page checks again every 30 seconds.</p>}
        </div>
      )}

      {m.state === "finished" && <p className="mt-3 text-sm text-zinc-500">This match is finished.</p>}
      {m.note && <p className="mt-3 whitespace-pre-line text-sm text-zinc-300">{m.note}</p>}
    </div>
  );
}

function TeamView({ t, offsetMs, refresh }: { t: PortalTeam; offsetMs: number; refresh: () => void }) {
  const active = t.status === "selected" || t.status === "qualified";
  return (
    <section className="space-y-5">
      <div className="card relative overflow-hidden p-6 sm:p-8">
        <Contours className="pointer-events-none absolute -right-20 -top-16 h-[200%] w-[55%] text-brand/[0.1]" rings={9} />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-zinc-400">{t.tournament.title}</p>
            <h2 className="mt-1 text-5xl text-white sm:text-6xl">{t.team_name}</h2>
          </div>
          <StatusBadge status={t.status} />
        </div>
      </div>

      {t.status === "registered" && (
        <div className="card p-5 text-zinc-300">
          Your registration is received. The selection result will be sent to your email. Come back here after you are selected to see
          your group and match room.
        </div>
      )}

      {t.status === "eliminated" && (
        <div className="card p-5 text-zinc-300">Your team is out of this tournament. Thank you for playing. See you in the next one.</div>
      )}

      {t.status === "disqualified" && (
        <div className="rounded-2xl border border-red-400/50 bg-red-500/10 p-5">
          <h3 className="text-2xl text-red-300">Your team was disqualified</h3>
          <p className="mt-2 whitespace-pre-line text-zinc-200">{t.disqualify_reason || "No reason has been added yet. Please contact the management."}</p>
          {t.evidence_url && (
            <a href={t.evidence_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm mt-4">
              View the document
            </a>
          )}
          <p className="mt-4 text-sm text-zinc-400">If you think this is a mistake, contact the management with your team name and captain UID.</p>
        </div>
      )}

      {t.tournament.portal_info && (
        <div className="card p-5">
          <h3 className="text-xl text-white">Notice from management</h3>
          <p className="mt-2 whitespace-pre-line text-zinc-300">{t.tournament.portal_info}</p>
        </div>
      )}

      {active && (
        <>
          {t.group ? (
            <div className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-3xl text-white">{t.group.name}</h3>
                {t.group.qualify_top ? (
                  <span className="rounded-full border border-brand2/50 bg-brand2/10 px-3 py-1 text-sm font-bold text-brand2">
                    Top {t.group.qualify_top} teams qualify
                  </span>
                ) : null}
              </div>
              {t.group.info && <p className="mt-2 whitespace-pre-line text-zinc-300">{t.group.info}</p>}
              <p className="mt-4 text-sm text-zinc-400">
                Teams in your group ({t.group.teams.length}/{t.group.max_teams})
              </p>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {t.group.teams.map((n) => (
                  <li
                    key={n}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      n === t.team_name ? "border-brand bg-brand/10 font-bold text-white" : "border-line text-zinc-300"
                    }`}
                  >
                    {n}
                    {n === t.team_name && <span className="ml-2 text-xs text-brand">your team</span>}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="card p-5 text-zinc-300">You are selected. Your group will be shown here soon.</div>
          )}

          <div className="space-y-4">
            <h3 className="text-3xl text-white">Matches</h3>
            {t.matches.length === 0 && <div className="card p-5 text-zinc-400">No match is scheduled yet. Check back later.</div>}
            {t.matches.map((m) => (
              <MatchCard key={m.id} m={m} offsetMs={offsetMs} refresh={refresh} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default function PortalClient() {
  const [email, setEmail] = useState("");
  const [uid, setUid] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [teams, setTeams] = useState<PortalTeam[] | null>(null);
  const [offsetMs, setOffsetMs] = useState(0);
  const [booting, setBooting] = useState(true);
  const creds = useRef<Creds | null>(null);

  const login = useCallback(async (c: Creds, silent = false) => {
    if (!silent) {
      setBusy(true);
      setError("");
    }
    const { data, error: err } = await supabase.rpc("team_login", { p_email: c.email, p_uid: c.uid });
    if (!silent) setBusy(false);

    if (err) {
      if (!silent) {
        setError(
          /team_login/.test(err.message) ? "Team login is not set up yet. The admin must run supabase/update-v2.sql." : "Could not reach the server. Check your internet and try again."
        );
      }
      return;
    }
    const res = data as { ok: boolean; error?: string; server_time?: string; teams?: PortalTeam[] } | null;
    if (!res?.ok) {
      if (silent) {
        // credentials stopped working (for example the team was removed): sign out
        creds.current = null;
        try {
          sessionStorage.removeItem(KEY);
        } catch {}
        setTeams(null);
      } else {
        setError(res?.error ?? "Login failed.");
      }
      return;
    }
    creds.current = c;
    try {
      sessionStorage.setItem(KEY, JSON.stringify(c));
    } catch {}
    if (res.server_time) setOffsetMs(new Date(res.server_time).getTime() - Date.now());
    setTeams(res.teams ?? []);
  }, []);

  // restore a login from this browser tab
  useEffect(() => {
    let saved: Creds | null = null;
    try {
      const raw = sessionStorage.getItem(KEY);
      saved = raw ? (JSON.parse(raw) as Creds) : null;
    } catch {}
    if (saved?.email && saved.uid) {
      login(saved, true).finally(() => setBooting(false));
    } else {
      setBooting(false);
    }
  }, [login]);

  // keep match info fresh
  useEffect(() => {
    if (!teams) return;
    const id = setInterval(() => {
      if (creds.current) login(creds.current, true);
    }, 30000);
    return () => clearInterval(id);
  }, [teams, login]);

  const refresh = useCallback(() => {
    if (creds.current) login(creds.current, true);
  }, [login]);

  function logout() {
    creds.current = null;
    try {
      sessionStorage.removeItem(KEY);
    } catch {}
    setTeams(null);
    setUid("");
  }

  if (booting) return <p className="py-24 text-center text-zinc-500">Loading…</p>;

  if (!teams) {
    return (
      <div className="relative overflow-hidden">
        <Contours className="pointer-events-none absolute -left-40 -top-32 h-[150%] w-[80%] text-brand/[0.09]" rings={14} />
        <div className="container-x relative flex min-h-[70vh] items-center justify-center py-16">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              login({ email: email.trim().toLowerCase(), uid: uid.replace(/\D/g, "") });
            }}
            className="card anim-fade-up w-full max-w-md space-y-5 p-6 sm:p-8"
          >
            <div>
              <h1 className="text-5xl text-white">Team portal</h1>
              <p className="mt-2 text-sm text-zinc-400">
                Log in with the email your team registered with and your captain's Free Fire UID. You will see your group, match time, and
                room ID and password.
              </p>
            </div>
            <div>
              <label className="label">Team email</label>
              <input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div>
              <label className="label">Captain UID</label>
              <input
                required
                inputMode="numeric"
                className="input"
                placeholder="e.g. 123456789"
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                autoComplete="off"
              />
            </div>
            {error && <p className="rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
            <button className="btn btn-primary w-full py-3" disabled={busy}>
              {busy ? "Checking…" : "Log in"}
            </button>
            <p className="text-center text-xs text-zinc-500">Never share your room ID or password with anyone outside your team.</p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container-x max-w-4xl space-y-12 py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-4xl text-white">Team portal</h1>
        <button className="btn btn-ghost btn-sm" onClick={logout}>
          Log out
        </button>
      </div>
      {teams.map((t) => (
        <TeamView key={t.team_id} t={t} offsetMs={offsetMs} refresh={refresh} />
      ))}
    </div>
  );
}
