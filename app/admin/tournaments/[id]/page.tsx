"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Group, Match, Team, TeamStatus, Tournament } from "@/lib/types";
import { fmtDateTime, fromLocalInput, toLocalInput } from "@/lib/format";
import { StatusBadge } from "@/components/ui";
import EmailPanel from "@/components/admin/EmailPanel";

const STATUSES: [TeamStatus, string][] = [
  ["registered", "Registered (waiting)"],
  ["selected", "Selected"],
  ["qualified", "Qualified (next round)"],
  ["eliminated", "Eliminated"],
  ["disqualified", "Disqualified"],
];
const IN_GAME: TeamStatus[] = ["selected", "qualified"];
const groupLetter = (n: number) => String.fromCharCode(65 + (n % 26)) + (n >= 26 ? String(Math.floor(n / 26)) : "");

type Notice = { text: string; ok: boolean } | null;
type Tab = "teams" | "groups" | "matches" | "notice";

export default function TournamentManager() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [t, setT] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [roleWarning, setRoleWarning] = useState("");
  const [loadErr, setLoadErr] = useState("");
  const [tab, setTab] = useState<Tab>("teams");
  const [notice, setNotice] = useState<Notice>(null);

  const say = (text: string, ok = true) => setNotice({ text, ok });

  const load = useCallback(async () => {
    const [tr, tm, gr, mt] = await Promise.all([
      supabase.from("tournaments").select("*").eq("id", id).maybeSingle(),
      supabase.from("tournament_teams").select("*").eq("tournament_id", id).order("created_at"),
      supabase.from("tournament_groups").select("*").eq("tournament_id", id).order("created_at"),
      supabase.from("tournament_matches").select("*").eq("tournament_id", id).order("start_time"),
    ]);
    if (tr.error) return setLoadErr(tr.error.message);
    if (!tr.data) return setLoadErr("Tournament not found.");
    const bad = tm.error || gr.error || mt.error;
    if (bad) {
      return setLoadErr(`${bad.message}. Run supabase/update-v2.sql in the Supabase SQL Editor first.`);
    }
    setLoadErr("");
    const tour = tr.data as Tournament;
    setT(tour);
    setTeams((tm.data ?? []) as Team[]);
    setGroups((gr.data ?? []) as Group[]);
    setMatches((mt.data ?? []) as Match[]);

    if (!tour.form_id) {
      setRoleWarning("No registration form is linked to this tournament. Link one in Tournaments, then Edit.");
    } else {
      const [fq, fm] = await Promise.all([
        supabase.from("form_questions").select("role").eq("form_id", tour.form_id),
        supabase.from("forms").select("collect_email").eq("id", tour.form_id).maybeSingle(),
      ]);
      const roles = new Set((fq.data ?? []).map((q: { role: string | null }) => q.role));
      const missing: string[] = [];
      if (!roles.has("team_name")) missing.push("team name");
      if (!roles.has("captain_uid")) missing.push("captain UID");
      if (fm.data && !fm.data.collect_email) missing.push("email collection");
      setRoleWarning(
        missing.length
          ? `The registration form is missing: ${missing.join(", ")}. Open the form, add "team registration questions" (or set a question's role) and turn on email collection, otherwise teams cannot be created or log in.`
          : ""
      );
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const groupName = useMemo(() => Object.fromEntries(groups.map((g) => [g.id, g.name])), [groups]);

  if (loadErr) {
    return (
      <div className="max-w-xl">
        <Link href="/admin/tournaments" className="text-sm text-zinc-400 hover:text-brand">
          ← Tournaments
        </Link>
        <p className="mt-4 rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{loadErr}</p>
      </div>
    );
  }
  if (!t) return <p className="text-zinc-500">Loading…</p>;

  const counts = Object.fromEntries(STATUSES.map(([s]) => [s, teams.filter((x) => x.status === s).length]));

  return (
    <div className="max-w-6xl">
      <Link href="/admin/tournaments" className="text-sm text-zinc-400 hover:text-brand">
        ← Tournaments
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-4xl text-white">{t.title}</h1>
        <StatusBadge status={t.status} />
        <Link href={`/admin/tournaments/${id}/report`} className="btn btn-ghost btn-sm ml-auto">
          Full report
        </Link>
        <a href="/portal" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
          Open team portal ↗
        </a>
      </div>
      <p className="mt-1 text-sm text-zinc-400">
        {t.registration_end ? `Registration ends ${fmtDateTime(t.registration_end)}` : "No registration end time set"}
        {t.start_date ? ` · starts ${fmtDateTime(t.start_date)}` : ""}
      </p>

      {roleWarning && <p className="mt-4 rounded-lg border border-brand2/40 bg-brand2/10 px-4 py-3 text-sm text-brand2">{roleWarning}</p>}
      {notice && (
        <p
          className={`mt-4 flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
            notice.ok ? "border-leaf/40 bg-leaf/10 text-leaf" : "border-red-400/40 bg-red-500/10 text-red-300"
          }`}
        >
          <span>{notice.text}</span>
          <button className="text-xs underline" onClick={() => setNotice(null)}>
            Dismiss
          </button>
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {STATUSES.map(([s, label]) => (
          <div key={s} className="card p-3">
            <p className="text-xs text-zinc-500">{label.split(" (")[0]}</p>
            <p className="font-display text-3xl font-black text-white">{counts[s]}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto border-b border-line">
        {(
          [
            ["teams", `Teams (${teams.length})`],
            ["groups", `Groups (${groups.length})`],
            ["matches", `Matches (${matches.length})`],
            ["notice", "Notice & info"],
          ] as [Tab, string][]
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-bold ${
              tab === k ? "border-brand text-brand" : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "teams" && <TeamsTab t={t} teams={teams} groups={groups} groupName={groupName} reload={load} say={say} />}
      {tab === "groups" && <GroupsTab tid={id} teams={teams} groups={groups} reload={load} say={say} />}
      {tab === "matches" && <MatchesTab tid={id} groups={groups} matches={matches} groupName={groupName} reload={load} say={say} />}
      {tab === "notice" && <NoticeTab t={t} reload={load} say={say} />}
    </div>
  );
}

/* ------------------------------------------------------------------ Teams */

type Common = { reload: () => Promise<void>; say: (t: string, ok?: boolean) => void };

function TeamsTab({
  t,
  teams,
  groups,
  groupName,
  reload,
  say,
}: Common & { t: Tournament; teams: Team[]; groups: Group[]; groupName: Record<string, string> }) {
  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState("all");
  const [fGroup, setFGroup] = useState("all");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Team>>({});
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkGroup, setBulkGroup] = useState("");
  const [email, setEmail] = useState<Team[] | null>(null);
  const [busy, setBusy] = useState(false);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return teams.filter((x) => {
      if (fStatus !== "all" && x.status !== fStatus) return false;
      if (fGroup === "none" && x.group_id) return false;
      if (fGroup !== "all" && fGroup !== "none" && x.group_id !== fGroup) return false;
      if (!s) return true;
      return `${x.team_name} ${x.captain_name ?? ""} ${x.captain_uid} ${x.email}`.toLowerCase().includes(s);
    });
  }, [teams, q, fStatus, fGroup]);

  const selIds = Array.from(sel);
  const toggle = (tid: string) =>
    setSel((p) => {
      const n = new Set(p);
      n.has(tid) ? n.delete(tid) : n.add(tid);
      return n;
    });
  const allShownSelected = shown.length > 0 && shown.every((x) => sel.has(x.id));

  async function patch(ids: string[], p: Partial<Team>, okMsg: string) {
    setBusy(true);
    const { error } = await supabase.from("tournament_teams").update(p).in("id", ids);
    setBusy(false);
    if (error) return say(`Error: ${error.message}`, false);
    say(okMsg);
    await reload();
  }

  function fits(groupId: string, ids: string[]): string | null {
    const g = groups.find((x) => x.id === groupId);
    if (!g) return "Group not found.";
    const already = teams.filter((x) => x.group_id === groupId && !ids.includes(x.id)).length;
    if (already + ids.length > g.max_teams) return `${g.name} holds ${g.max_teams} teams and already has ${already}. Raise its limit in Groups, or pick another group.`;
    return null;
  }

  async function applyStatus() {
    if (!bulkStatus || !selIds.length) return;
    const p: Partial<Team> = { status: bulkStatus as TeamStatus };
    if (bulkStatus === "disqualified") {
      const reason = window.prompt("Why are these teams disqualified? The team will see this in their portal.");
      if (reason === null) return;
      p.disqualify_reason = reason.trim() || null;
    }
    await patch(selIds, p, `${selIds.length} team(s) set to ${bulkStatus}.`);
    setBulkStatus("");
  }

  async function applyGroup() {
    if (!selIds.length || bulkGroup === "") return;
    const gid = bulkGroup === "none" ? null : bulkGroup;
    if (gid) {
      const problem = fits(gid, selIds);
      if (problem) return say(`Error: ${problem}`, false);
    }
    await patch(selIds, { group_id: gid }, gid ? `${selIds.length} team(s) moved to ${groupName[gid]}.` : "Group removed.");
    setBulkGroup("");
  }

  function openRow(x: Team) {
    if (open === x.id) return setOpen(null);
    setOpen(x.id);
    setDraft({ ...x });
  }

  async function saveRow() {
    if (!draft.id) return;
    const gid = draft.group_id || null;
    if (gid && draft.group_id !== teams.find((x) => x.id === draft.id)?.group_id) {
      const problem = fits(gid, [draft.id]);
      if (problem) return say(`Error: ${problem}`, false);
    }
    if (draft.status === "disqualified" && !(draft.disqualify_reason ?? "").trim()) {
      return say("Error: write the reason for the disqualification. The team sees it in their portal.", false);
    }
    await patch(
      [draft.id],
      {
        team_name: (draft.team_name ?? "").trim() || undefined,
        captain_name: draft.captain_name || null,
        status: draft.status,
        group_id: gid,
        disqualify_reason: draft.status === "disqualified" ? draft.disqualify_reason || null : draft.disqualify_reason || null,
        evidence_url: draft.evidence_url || null,
        admin_notes: draft.admin_notes || null,
      },
      "Team saved."
    );
  }

  async function removeTeam(x: Team) {
    if (!confirm(`Remove team "${x.team_name}" from this tournament? Their form response stays in the Forms page.`)) return;
    const { error } = await supabase.from("tournament_teams").delete().eq("id", x.id);
    if (error) return say(`Error: ${error.message}`, false);
    setOpen(null);
    say("Team removed.");
    reload();
  }

  async function sync() {
    setBusy(true);
    const { data, error } = await supabase.rpc("sync_tournament_teams", { p_tournament: t.id });
    setBusy(false);
    if (error) return say(`Error: ${error.message}`, false);
    say(`${data ?? 0} new team(s) added from the registration form.`);
    reload();
  }

  const emailTargets = selIds.length ? teams.filter((x) => sel.has(x.id)) : teams.filter((x) => IN_GAME.includes(x.status));

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-3">
        <input className="input max-w-xs" placeholder="Search team, UID, email…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input w-auto" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {STATUSES.map(([s, l]) => (
            <option key={s} value={s}>
              {l}
            </option>
          ))}
        </select>
        <select className="input w-auto" value={fGroup} onChange={(e) => setFGroup(e.target.value)}>
          <option value="all">All groups</option>
          <option value="none">No group</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <div className="ml-auto flex flex-wrap gap-2">
          <button className="btn btn-ghost btn-sm" disabled={busy || !t.form_id} onClick={sync}>
            Sync from form
          </button>
          <button className="btn btn-primary btn-sm" disabled={!emailTargets.length} onClick={() => setEmail(emailTargets)}>
            Email {selIds.length ? "selected rows" : "selected teams"} ({emailTargets.length})
          </button>
        </div>
      </div>

      {email && <EmailPanel teams={email} tournamentTitle={t.title} onClose={() => setEmail(null)} />}

      {selIds.length > 0 && (
        <div className="card mt-4 flex flex-wrap items-center gap-3 border-brand/50 p-3">
          <span className="text-sm font-bold text-white">{selIds.length} selected</span>
          <select className="input w-auto" value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}>
            <option value="">Set status…</option>
            {STATUSES.map(([s, l]) => (
              <option key={s} value={s}>
                {l}
              </option>
            ))}
          </select>
          <button className="btn btn-primary btn-sm" disabled={!bulkStatus || busy} onClick={applyStatus}>
            Apply
          </button>
          <select className="input w-auto" value={bulkGroup} onChange={(e) => setBulkGroup(e.target.value)}>
            <option value="">Move to group…</option>
            <option value="none">No group</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <button className="btn btn-primary btn-sm" disabled={bulkGroup === "" || busy} onClick={applyGroup}>
            Apply
          </button>
          <button className="btn btn-ghost btn-sm ml-auto" onClick={() => setSel(new Set())}>
            Clear
          </button>
        </div>
      )}

      {teams.length === 0 && (
        <p className="mt-6 text-zinc-500">
          No teams yet. Teams appear here automatically when someone submits the registration form. If people registered before you linked the
          form, press "Sync from form".
        </p>
      )}

      {shown.length > 0 && (
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
            <thead className="bg-field text-xs text-zinc-400">
              <tr>
                <th className="w-10 border-b border-line px-3 py-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#ff7a29]"
                    checked={allShownSelected}
                    onChange={() => setSel(allShownSelected ? new Set() : new Set(shown.map((x) => x.id)))}
                    aria-label="Select all shown"
                  />
                </th>
                <th className="border-b border-line px-3 py-3">Team</th>
                <th className="border-b border-line px-3 py-3">Captain UID</th>
                <th className="border-b border-line px-3 py-3">Email</th>
                <th className="border-b border-line px-3 py-3">Status</th>
                <th className="border-b border-line px-3 py-3">Group</th>
                <th className="border-b border-line px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {shown.map((x) => (
                <FragmentRow key={x.id}>
                  <tr className="odd:bg-white/[0.02] hover:bg-white/[0.04]">
                    <td className="border-b border-line px-3 py-2.5">
                      <input type="checkbox" className="h-4 w-4 accent-[#ff7a29]" checked={sel.has(x.id)} onChange={() => toggle(x.id)} aria-label={`Select ${x.team_name}`} />
                    </td>
                    <td className="border-b border-line px-3 py-2.5">
                      <p className="font-bold text-white">{x.team_name}</p>
                      {x.captain_name && <p className="text-xs text-zinc-500">{x.captain_name}</p>}
                    </td>
                    <td className="num border-b border-line px-3 py-2.5 text-zinc-200">{x.captain_uid}</td>
                    <td className="border-b border-line px-3 py-2.5 text-zinc-300">{x.email}</td>
                    <td className="border-b border-line px-3 py-2.5">
                      <StatusBadge status={x.status} />
                    </td>
                    <td className="border-b border-line px-3 py-2.5 text-zinc-300">{x.group_id ? groupName[x.group_id] ?? "—" : "—"}</td>
                    <td className="border-b border-line px-3 py-2.5 text-right">
                      <button className="btn btn-ghost btn-sm" onClick={() => openRow(x)}>
                        {open === x.id ? "Close" : "Details"}
                      </button>
                    </td>
                  </tr>
                  {open === x.id && (
                    <tr>
                      <td colSpan={7} className="border-b border-line bg-field/60 p-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="label">Team name</label>
                            <input className="input" value={draft.team_name ?? ""} onChange={(e) => setDraft({ ...draft, team_name: e.target.value })} />
                          </div>
                          <div>
                            <label className="label">Captain name</label>
                            <input className="input" value={draft.captain_name ?? ""} onChange={(e) => setDraft({ ...draft, captain_name: e.target.value })} />
                          </div>
                          <div>
                            <label className="label">Status</label>
                            <select className="input" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as TeamStatus })}>
                              {STATUSES.map(([s, l]) => (
                                <option key={s} value={s}>
                                  {l}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="label">Group</label>
                            <select className="input" value={draft.group_id ?? ""} onChange={(e) => setDraft({ ...draft, group_id: e.target.value || null })}>
                              <option value="">No group</option>
                              {groups.map((g) => (
                                <option key={g.id} value={g.id}>
                                  {g.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="label">
                              {draft.status === "disqualified" ? "Reason for disqualification (the team sees this)" : "Disqualification reason (only used if disqualified)"}
                            </label>
                            <textarea rows={3} className="input" value={draft.disqualify_reason ?? ""} onChange={(e) => setDraft({ ...draft, disqualify_reason: e.target.value })} />
                          </div>
                          <div>
                            <label className="label">Document / evidence link (Google Drive, optional)</label>
                            <input className="input" placeholder="https://drive.google.com/…" value={draft.evidence_url ?? ""} onChange={(e) => setDraft({ ...draft, evidence_url: e.target.value })} />
                          </div>
                          <div>
                            <label className="label">Private notes (only admins see this)</label>
                            <textarea rows={2} className="input" value={draft.admin_notes ?? ""} onChange={(e) => setDraft({ ...draft, admin_notes: e.target.value })} />
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <button className="btn btn-primary btn-sm" disabled={busy} onClick={saveRow}>
                            Save team
                          </button>
                          <button className="btn btn-danger btn-sm ml-auto" onClick={() => removeTeam(x)}>
                            Remove team
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </FragmentRow>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {teams.length > 0 && shown.length === 0 && <p className="mt-6 text-zinc-500">No team matches these filters.</p>}
    </div>
  );
}

function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/* ----------------------------------------------------------------- Groups */

function GroupsTab({ tid, teams, groups, reload, say }: Common & { tid: string; teams: Team[]; groups: Group[] }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState<Record<string, Partial<Group>>>({});

  const pool = teams.filter((x) => IN_GAME.includes(x.status) && !x.group_id);

  async function autoFill() {
    if (!pool.length) return say("No selected teams without a group. First set some teams to Selected.", false);
    const size = 12;
    const chunks: Team[][] = [];
    for (let i = 0; i < pool.length; i += size) chunks.push(pool.slice(i, i + size));
    if (!confirm(`Create ${chunks.length} new group(s) of up to ${size} teams for ${pool.length} selected team(s)?`)) return;
    setBusy(true);
    let n = groups.length;
    for (const chunk of chunks) {
      const { data, error } = await supabase
        .from("tournament_groups")
        .insert({ tournament_id: tid, name: `Group ${groupLetter(n)}`, max_teams: size })
        .select("id")
        .single();
      n++;
      if (error || !data) {
        setBusy(false);
        return say(`Error: ${error?.message ?? "could not create group"}`, false);
      }
      const { error: e2 } = await supabase.from("tournament_teams").update({ group_id: data.id }).in("id", chunk.map((c) => c.id));
      if (e2) {
        setBusy(false);
        return say(`Error: ${e2.message}`, false);
      }
    }
    setBusy(false);
    say(`${chunks.length} group(s) created and filled.`);
    reload();
  }

  async function addGroup(e: React.FormEvent) {
    e.preventDefault();
    const nm = name.trim() || `Group ${groupLetter(groups.length)}`;
    const { error } = await supabase.from("tournament_groups").insert({ tournament_id: tid, name: nm, max_teams: 12 });
    if (error) return say(`Error: ${error.message}`, false);
    setName("");
    reload();
  }

  async function saveGroup(g: Group) {
    const d = edit[g.id];
    if (!d) return;
    const max = Number(d.max_teams ?? g.max_teams);
    const inGroup = teams.filter((x) => x.group_id === g.id).length;
    if (max < inGroup) return say(`Error: ${g.name} already has ${inGroup} teams. Move some out first.`, false);
    const { error } = await supabase
      .from("tournament_groups")
      .update({
        name: (d.name ?? g.name).trim() || g.name,
        max_teams: max,
        qualify_top: d.qualify_top === undefined ? g.qualify_top : d.qualify_top,
        info: d.info === undefined ? g.info : d.info || null,
      })
      .eq("id", g.id);
    if (error) return say(`Error: ${error.message}`, false);
    setEdit((p) => {
      const n = { ...p };
      delete n[g.id];
      return n;
    });
    say(`${g.name} saved.`);
    reload();
  }

  async function removeGroup(g: Group) {
    if (!confirm(`Delete ${g.name}? Its teams stay in the tournament but lose their group, and its matches are deleted.`)) return;
    const { error } = await supabase.from("tournament_groups").delete().eq("id", g.id);
    if (error) return say(`Error: ${error.message}`, false);
    reload();
  }

  async function ungroup(team: Team) {
    const { error } = await supabase.from("tournament_teams").update({ group_id: null }).eq("id", team.id);
    if (error) return say(`Error: ${error.message}`, false);
    reload();
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="card flex flex-wrap items-center gap-3 p-4">
        <button className="btn btn-primary" disabled={busy} onClick={autoFill}>
          Auto-fill groups ({pool.length} teams waiting)
        </button>
        <form onSubmit={addGroup} className="ml-auto flex gap-2">
          <input className="input w-44" placeholder="New group name" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn btn-ghost">Add group</button>
        </form>
      </div>
      <p className="text-sm text-zinc-500">
        Auto-fill puts selected teams that have no group into new groups of 12 (one Free Fire lobby). You can move teams between groups from the
        Teams tab.
      </p>

      {groups.length === 0 && <p className="text-zinc-500">No groups yet.</p>}

      <div className="grid gap-5 lg:grid-cols-2">
        {groups.map((g) => {
          const d = edit[g.id] ?? {};
          const members = teams.filter((x) => x.group_id === g.id);
          const val = <K extends keyof Group>(k: K) => (d[k] !== undefined ? d[k] : g[k]) as Group[K];
          return (
            <div key={g.id} className="card space-y-3 p-5">
              <div className="flex items-center justify-between gap-3">
                <input
                  className="input max-w-[14rem] font-display text-2xl font-bold"
                  value={val("name")}
                  onChange={(e) => setEdit({ ...edit, [g.id]: { ...d, name: e.target.value } })}
                />
                <span className={`num rounded-full border px-3 py-1 text-sm font-bold ${members.length >= g.max_teams ? "border-brand2/50 text-brand2" : "border-line text-zinc-300"}`}>
                  {members.length}/{g.max_teams} teams
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Team limit</label>
                  <input type="number" min={1} max={60} className="input" value={val("max_teams")} onChange={(e) => setEdit({ ...edit, [g.id]: { ...d, max_teams: Number(e.target.value) } })} />
                </div>
                <div>
                  <label className="label">Top teams that qualify</label>
                  <input
                    type="number"
                    min={0}
                    className="input"
                    placeholder="e.g. 6"
                    value={val("qualify_top") ?? ""}
                    onChange={(e) => setEdit({ ...edit, [g.id]: { ...d, qualify_top: e.target.value === "" ? null : Number(e.target.value) } })}
                  />
                </div>
              </div>
              <div>
                <label className="label">Info for this group (teams see it in the portal)</label>
                <textarea
                  rows={3}
                  className="input"
                  placeholder="e.g. Top 6 of Group A qualify for the final. Points: 1 kill = 1 point."
                  value={val("info") ?? ""}
                  onChange={(e) => setEdit({ ...edit, [g.id]: { ...d, info: e.target.value } })}
                />
              </div>
              <ul className="space-y-1">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-1.5 text-sm">
                    <span className="text-zinc-200">
                      {m.team_name} <span className="ml-1 text-xs text-zinc-500">{m.status}</span>
                    </span>
                    <button className="text-xs text-red-300 hover:underline" onClick={() => ungroup(m)}>
                      Remove
                    </button>
                  </li>
                ))}
                {members.length === 0 && <li className="text-sm text-zinc-500">No teams in this group.</li>}
              </ul>
              <div className="flex gap-2">
                <button className="btn btn-primary btn-sm" disabled={!edit[g.id]} onClick={() => saveGroup(g)}>
                  Save group
                </button>
                <button className="btn btn-danger btn-sm ml-auto" onClick={() => removeGroup(g)}>
                  Delete group
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Matches */

type MDraft = Partial<Match> & { time_input?: string; all_groups?: boolean };

function MatchesTab({
  tid,
  groups,
  matches,
  groupName,
  reload,
  say,
}: Common & { tid: string; groups: Group[]; matches: Match[]; groupName: Record<string, string> }) {
  const [d, setD] = useState<MDraft | null>(null);
  const [busy, setBusy] = useState(false);

  const blank: MDraft = { title: "", group_id: null, time_input: "", room_id: "", room_password: "", reveal_minutes_before: 10, note: "", all_groups: false };

  async function save() {
    if (!d) return;
    const start = fromLocalInput(d.time_input);
    if (!d.title?.trim() || !start) return say("Error: match title and start time are required.", false);
    const base = {
      tournament_id: tid,
      title: d.title.trim(),
      start_time: start,
      room_id: d.room_id?.trim() || null,
      room_password: d.room_password?.trim() || null,
      reveal_minutes_before: Math.min(180, Math.max(0, Number(d.reveal_minutes_before) || 0)),
      note: d.note?.trim() || null,
    };
    setBusy(true);
    let error;
    if (d.id) {
      ({ error } = await supabase.from("tournament_matches").update({ ...base, group_id: d.group_id || null }).eq("id", d.id));
    } else if (d.all_groups && groups.length) {
      ({ error } = await supabase.from("tournament_matches").insert(groups.map((g) => ({ ...base, group_id: g.id }))));
    } else {
      ({ error } = await supabase.from("tournament_matches").insert({ ...base, group_id: d.group_id || null }));
    }
    setBusy(false);
    if (error) return say(`Error: ${error.message}`, false);
    say("Match saved.");
    setD(null);
    reload();
  }

  async function remove(m: Match) {
    if (!confirm(`Delete "${m.title}"?`)) return;
    const { error } = await supabase.from("tournament_matches").delete().eq("id", m.id);
    if (error) return say(`Error: ${error.message}`, false);
    reload();
  }

  return (
    <div className="mt-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">
          Teams see the countdown to the start time. The room ID and password unlock for them at the unlock time you choose.
        </p>
        <button className="btn btn-primary shrink-0" onClick={() => setD({ ...blank })}>
          + Add match
        </button>
      </div>

      {d && (
        <div className="card space-y-4 p-5">
          <h3 className="text-2xl text-white">{d.id ? "Edit match" : "New match"}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Match title *</label>
              <input className="input" placeholder="e.g. Qualifier match 1" value={d.title ?? ""} onChange={(e) => setD({ ...d, title: e.target.value })} />
            </div>
            <div>
              <label className="label">For which group</label>
              <select
                className="input"
                value={d.group_id ?? ""}
                disabled={!d.id && !!d.all_groups}
                onChange={(e) => setD({ ...d, group_id: e.target.value || null })}
              >
                <option value="">All selected teams</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Start time * (Bangladesh time)</label>
              <input type="datetime-local" className="input" value={d.time_input ?? ""} onChange={(e) => setD({ ...d, time_input: e.target.value })} />
            </div>
            <div>
              <label className="label">Show room details this many minutes before start</label>
              <input type="number" min={0} max={180} className="input" value={d.reveal_minutes_before ?? 10} onChange={(e) => setD({ ...d, reveal_minutes_before: Number(e.target.value) })} />
              <p className="mt-1 text-xs text-zinc-500">0 = exactly at match time.</p>
            </div>
            <div>
              <label className="label">Room ID</label>
              <input className="input" value={d.room_id ?? ""} onChange={(e) => setD({ ...d, room_id: e.target.value })} />
            </div>
            <div>
              <label className="label">Room password</label>
              <input className="input" value={d.room_password ?? ""} onChange={(e) => setD({ ...d, room_password: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Note for teams (optional)</label>
            <textarea rows={2} className="input" value={d.note ?? ""} onChange={(e) => setD({ ...d, note: e.target.value })} />
          </div>
          {!d.id && groups.length > 1 && (
            <label className="flex items-center gap-2 text-sm text-zinc-200">
              <input type="checkbox" className="h-4 w-4 accent-[#ff7a29]" checked={!!d.all_groups} onChange={(e) => setD({ ...d, all_groups: e.target.checked })} />
              Create this match for every group ({groups.length}). Then add each group's own room ID and password by editing.
            </label>
          )}
          <div className="flex gap-2">
            <button className="btn btn-primary" disabled={busy} onClick={save}>
              {busy ? "Saving…" : "Save match"}
            </button>
            <button className="btn btn-ghost" onClick={() => setD(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {matches.length === 0 && !d && <p className="text-zinc-500">No matches yet.</p>}

      <div className="space-y-3">
        {matches.map((m) => (
          <div key={m.id} className="card flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-bold text-white">
                {m.title} <span className="ml-2 rounded bg-zinc-800 px-2 py-0.5 text-xs font-normal text-zinc-300">{m.group_id ? groupName[m.group_id] ?? "group" : "All selected teams"}</span>
              </p>
              <p className="text-sm text-zinc-400">
                {fmtDateTime(m.start_time)} · room unlocks {m.reveal_minutes_before} min before
              </p>
              <p className="text-sm text-zinc-500">
                Room ID: {m.room_id || "not set"} · Password: {m.room_password || "not set"}
              </p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setD({ ...m, time_input: toLocalInput(m.start_time) })}>
              Edit
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => remove(m)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- Notice */

function NoticeTab({ t, reload, say }: Common & { t: Tournament }) {
  const [text, setText] = useState(t.portal_info ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const { error } = await supabase.from("tournaments").update({ portal_info: text.trim() || null }).eq("id", t.id);
    setBusy(false);
    if (error) return say(`Error: ${error.message}`, false);
    say("Notice saved.");
    reload();
  }

  return (
    <div className="mt-6 max-w-2xl space-y-4">
      <div className="card space-y-3 p-5">
        <h3 className="text-2xl text-white">Notice for all teams</h3>
        <p className="text-sm text-zinc-400">Shown at the top of every team's portal. Use it for rules, point system, time changes, or announcements.</p>
        <textarea rows={7} className="input" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn btn-primary" disabled={busy} onClick={save}>
          {busy ? "Saving…" : "Save notice"}
        </button>
      </div>
      <div className="card p-5 text-sm text-zinc-400">
        <p>
          Registration end time, entry fee and the registration form are set in{" "}
          <Link href="/admin/tournaments" className="text-brand underline">
            Tournaments → Edit
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
