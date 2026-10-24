"use client";

import { useMemo, useState } from "react";
import type { Team } from "@/lib/types";

// No email server is needed: this opens Gmail / your mail app with all recipients in BCC, so teams cannot see each other's emails.
export default function EmailPanel({
  teams,
  tournamentTitle,
  onClose,
}: {
  teams: Team[];
  tournamentTitle: string;
  onClose: () => void;
}) {
  const emails = useMemo(() => Array.from(new Set(teams.map((t) => t.email.toLowerCase()))), [teams]);
  const portal = typeof window !== "undefined" ? `${window.location.origin}/portal` : "/portal";

  const [subject, setSubject] = useState(`You are selected for ${tournamentTitle}`);
  const [body, setBody] = useState(
    `Hello,\n\nCongratulations! Your team has been selected for ${tournamentTitle}.\n\n` +
      `How to join your match:\n` +
      `1. Open ${portal}\n` +
      `2. Log in with this email address and your captain's Free Fire UID.\n` +
      `3. You will see your group, the match time and a countdown. The room ID and password appear at match time.\n\n` +
      `Please do not share the room ID or password with anyone outside your team.\n\nGood luck!`
  );
  const [copied, setCopied] = useState("");

  const copy = (what: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(what);
    setTimeout(() => setCopied(""), 1500);
  };
  const bcc = emails.join(",");
  const gmail = `https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(bcc)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const mailto = `mailto:?bcc=${encodeURIComponent(bcc)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <div className="card mt-6 space-y-4 border-brand/50 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl text-white">Email {emails.length} team(s)</h3>
          <p className="text-sm text-zinc-400">Recipients go in BCC, so teams cannot see each other. Edit the message if you like.</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>
          Close
        </button>
      </div>
      <div>
        <label className="label">Subject</label>
        <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
      </div>
      <div>
        <label className="label">Message</label>
        <textarea rows={10} className="input" value={body} onChange={(e) => setBody(e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={gmail} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
          Open in Gmail
        </a>
        <a href={mailto} className="btn btn-ghost">
          Open in mail app
        </a>
        <button className="btn btn-ghost" onClick={() => copy("emails", emails.join(", "))}>
          {copied === "emails" ? "Copied" : "Copy emails"}
        </button>
        <button className="btn btn-ghost" onClick={() => copy("msg", `${subject}\n\n${body}`)}>
          {copied === "msg" ? "Copied" : "Copy message"}
        </button>
      </div>
      {emails.length > 40 && (
        <p className="text-xs text-brand2">Many recipients: if Gmail cuts the list, use "Copy emails" and paste them into the BCC box.</p>
      )}
    </div>
  );
}
