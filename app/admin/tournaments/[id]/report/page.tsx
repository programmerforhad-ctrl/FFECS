"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Group, Match, Team, Tournament } from "@/lib/types";
import { fmtDateTime } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";

const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function ReportPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [t, setT] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [now, setNow] = useState("");

  useEffect(() => {
    (async () => {
      const [tr, tm, gr, mt, st] = await Promise.all([
        supabase.from("tournaments").select("*").eq("id", id).maybeSingle(),
        supabase.from("tournament_teams").select("*").eq("tournament_id", id).order("team_name"),
        supabase.from("tournament_groups").select("*").eq("tournament_id", id).order("created_at"),
        supabase.from("tournament_matches").select("*").eq("tournament_id", id).order("start_time"),
        supabase.from("site_settings").select("value").eq("key", "community_name").maybeSingle(),
      ]);
      const bad = tr.error || tm.error || gr.error || mt.error;
      if (bad) return setErr(bad.message);
      if (!tr.data) return setErr("Tournament not found.");
      setT(tr.data as Tournament);
      setTeams((tm.data ?? []) as Team[]);
      setGroups((gr.data ?? []) as Group[]);
      setMatches((mt.data ?? []) as Match[]);
      setName(st.data?.value ?? "");
      setNow(fmtDateTime(new Date().toISOString()));
    })();
  }, [id]);

  if (err) return <p className="rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{err}</p>;
  if (!t) return <p className="text-zinc-500">Loading…</p>;

  const gName = (gid: string | null) => groups.find((g) => g.id === gid)?.name ?? "No group";
  const byStatus = (s: string) => teams.filter((x) => x.status === s);
  const statuses = ["registered", "selected", "qualified", "eliminated", "disqualified"];
  const disq = byStatus("disqualified");

  function exportCsv() {
    const rows: string[][] = [
      ["Team", "Captain", "Captain UID", "Email", "Status", "Group", "Disqualification reason", "Document link", "Admin notes", "Registered at"],
    ];
    teams.forEach((x) =>
      rows.push([
        x.team_name,
        x.captain_name ?? "",
        x.captain_uid,
        x.email,
        x.status,
        gName(x.group_id),
        x.disqualify_reason ?? "",
        x.evidence_url ?? "",
        x.admin_notes ?? "",
        fmtDateTime(x.created_at),
      ])
    );
    downloadCsv(`${t!.title.replace(/\W+/g, "-").toLowerCase()}-teams.csv`, rows);
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center gap-3 print:hidden">
        <Link href={`/admin/tournaments/${id}`} className="text-sm text-zinc-400 hover:text-brand">
          ← Back to manager
        </Link>
        <button className="btn btn-primary btn-sm ml-auto" onClick={() => window.print()}>
          Print / Save as PDF
        </button>
        <button className="btn btn-ghost btn-sm" onClick={exportCsv}>
          Download teams CSV
        </button>
      </div>

      <article className="report space-y-10">
        <header className="border-b border-line pb-6">
          <p className="text-sm text-zinc-400">{name}</p>
          <h1 className="mt-1 text-5xl text-white">{t.title}: full report</h1>
          <p className="mt-2 text-sm text-zinc-400">Generated {now}</p>
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-zinc-500">Status</dt>
              <dd className="font-bold text-white">{label(t.status)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Start</dt>
              <dd className="font-bold text-white">{t.start_date ? fmtDateTime(t.start_date) : "Not set"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Registration ended</dt>
              <dd className="font-bold text-white">{t.registration_end ? fmtDateTime(t.registration_end) : "Not set"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Entry fee</dt>
              <dd className="font-bold text-white">{t.entry_fee || "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Prize pool</dt>
              <dd className="font-bold text-white">{t.prize_pool || "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Champion</dt>
              <dd className="font-bold text-white">{t.champion || "—"}</dd>
            </div>
          </dl>
        </header>

        <section>
          <h2 className="text-3xl text-white">Summary</h2>
          <table className="mt-3 w-full max-w-md border-collapse text-sm">
            <tbody>
              <tr>
                <td className="border-b border-line py-2 text-zinc-300">Total registered teams</td>
                <td className="num border-b border-line py-2 text-right font-bold text-white">{teams.length}</td>
              </tr>
              {statuses.map((s) => (
                <tr key={s}>
                  <td className="border-b border-line py-2 text-zinc-300">{label(s)}</td>
                  <td className="num border-b border-line py-2 text-right font-bold text-white">{byStatus(s).length}</td>
                </tr>
              ))}
              <tr>
                <td className="border-b border-line py-2 text-zinc-300">Groups</td>
                <td className="num border-b border-line py-2 text-right font-bold text-white">{groups.length}</td>
              </tr>
              <tr>
                <td className="py-2 text-zinc-300">Matches</td>
                <td className="num py-2 text-right font-bold text-white">{matches.length}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="page-break">
          <h2 className="text-3xl text-white">Groups</h2>
          {groups.length === 0 && <p className="mt-2 text-sm text-zinc-500">No groups.</p>}
          <div className="mt-3 space-y-6">
            {groups.map((g) => {
              const members = teams.filter((x) => x.group_id === g.id);
              return (
                <div key={g.id}>
                  <h3 className="text-2xl text-white">
                    {g.name}{" "}
                    <span className="text-sm font-normal text-zinc-400">
                      ({members.length}/{g.max_teams} teams{g.qualify_top ? `, top ${g.qualify_top} qualify` : ""})
                    </span>
                  </h3>
                  {g.info && <p className="mt-1 whitespace-pre-line text-sm text-zinc-300">{g.info}</p>}
                  <table className="mt-2 w-full border-collapse text-left text-sm">
                    <thead className="text-xs text-zinc-500">
                      <tr>
                        <th className="border-b border-line py-1.5 pr-3">#</th>
                        <th className="border-b border-line py-1.5 pr-3">Team</th>
                        <th className="border-b border-line py-1.5 pr-3">Captain UID</th>
                        <th className="border-b border-line py-1.5 pr-3">Email</th>
                        <th className="border-b border-line py-1.5">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((x, i) => (
                        <tr key={x.id}>
                          <td className="border-b border-line py-1.5 pr-3 text-zinc-500">{i + 1}</td>
                          <td className="border-b border-line py-1.5 pr-3 text-white">{x.team_name}</td>
                          <td className="num border-b border-line py-1.5 pr-3">{x.captain_uid}</td>
                          <td className="border-b border-line py-1.5 pr-3">{x.email}</td>
                          <td className="border-b border-line py-1.5">{label(x.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-3xl text-white">Match schedule</h2>
          {matches.length === 0 && <p className="mt-2 text-sm text-zinc-500">No matches.</p>}
          {matches.length > 0 && (
            <table className="mt-3 w-full border-collapse text-left text-sm">
              <thead className="text-xs text-zinc-500">
                <tr>
                  <th className="border-b border-line py-1.5 pr-3">Match</th>
                  <th className="border-b border-line py-1.5 pr-3">Group</th>
                  <th className="border-b border-line py-1.5 pr-3">Start</th>
                  <th className="border-b border-line py-1.5 pr-3">Room ID</th>
                  <th className="border-b border-line py-1.5">Password</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => (
                  <tr key={m.id}>
                    <td className="border-b border-line py-1.5 pr-3 text-white">{m.title}</td>
                    <td className="border-b border-line py-1.5 pr-3">{m.group_id ? gName(m.group_id) : "All selected teams"}</td>
                    <td className="border-b border-line py-1.5 pr-3">{fmtDateTime(m.start_time)}</td>
                    <td className="num border-b border-line py-1.5 pr-3">{m.room_id || "—"}</td>
                    <td className="num border-b border-line py-1.5">{m.room_password || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="page-break">
          <h2 className="text-3xl text-white">Disqualified teams and problems</h2>
          {disq.length === 0 && <p className="mt-2 text-sm text-zinc-500">No team was disqualified.</p>}
          <div className="mt-3 space-y-4">
            {disq.map((x) => (
              <div key={x.id} className="rounded-xl border border-line p-4">
                <p className="text-xl font-bold text-white">
                  {x.team_name} <span className="text-sm font-normal text-zinc-400">UID {x.captain_uid} · {x.email}</span>
                </p>
                <p className="mt-1 text-sm text-zinc-500">Group: {gName(x.group_id)}</p>
                <p className="mt-2 whitespace-pre-line text-sm text-zinc-200">
                  <span className="font-bold">What went wrong: </span>
                  {x.disqualify_reason || "No reason recorded."}
                </p>
                {x.evidence_url && (
                  <p className="mt-1 text-sm">
                    <span className="font-bold text-zinc-200">Document: </span>
                    <a href={x.evidence_url} target="_blank" rel="noopener noreferrer" className="text-brand">
                      {x.evidence_url}
                    </a>
                  </p>
                )}
                {x.admin_notes && (
                  <p className="mt-1 whitespace-pre-line text-sm text-zinc-300">
                    <span className="font-bold">Admin notes: </span>
                    {x.admin_notes}
                  </p>
                )}
              </div>
            ))}
          </div>
          {teams.some((x) => x.status !== "disqualified" && x.admin_notes) && (
            <>
              <h3 className="mt-8 text-2xl text-white">Other admin notes</h3>
              <ul className="mt-2 space-y-1 text-sm text-zinc-300">
                {teams
                  .filter((x) => x.status !== "disqualified" && x.admin_notes)
                  .map((x) => (
                    <li key={x.id}>
                      <span className="font-bold text-white">{x.team_name}:</span> {x.admin_notes}
                    </li>
                  ))}
              </ul>
            </>
          )}
        </section>

        <section className="page-break">
          <h2 className="text-3xl text-white">All registered teams</h2>
          <table className="mt-3 w-full border-collapse text-left text-sm">
            <thead className="text-xs text-zinc-500">
              <tr>
                <th className="border-b border-line py-1.5 pr-3">#</th>
                <th className="border-b border-line py-1.5 pr-3">Team</th>
                <th className="border-b border-line py-1.5 pr-3">Captain</th>
                <th className="border-b border-line py-1.5 pr-3">UID</th>
                <th className="border-b border-line py-1.5 pr-3">Email</th>
                <th className="border-b border-line py-1.5 pr-3">Status</th>
                <th className="border-b border-line py-1.5">Group</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((x, i) => (
                <tr key={x.id}>
                  <td className="border-b border-line py-1.5 pr-3 text-zinc-500">{i + 1}</td>
                  <td className="border-b border-line py-1.5 pr-3 text-white">{x.team_name}</td>
                  <td className="border-b border-line py-1.5 pr-3">{x.captain_name || "—"}</td>
                  <td className="num border-b border-line py-1.5 pr-3">{x.captain_uid}</td>
                  <td className="border-b border-line py-1.5 pr-3">{x.email}</td>
                  <td className="border-b border-line py-1.5 pr-3">{label(x.status)}</td>
                  <td className="border-b border-line py-1.5">{gName(x.group_id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-6 text-xs text-zinc-500">Confidential: contains emails and room passwords. Do not share publicly.</p>
        </section>
      </article>
    </div>
  );
}
