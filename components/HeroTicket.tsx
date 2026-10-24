import Link from "next/link";
import type { Tournament } from "@/lib/types";
import { registerHref } from "@/lib/data";
import { fmtDateTime } from "@/lib/format";
import { Countdown } from "./Countdown";
import RegisterButton from "./RegisterButton";
import { StatusBadge } from "./ui";

// The hero's centrepiece: the next tournament as a match ticket with a live countdown.
export default function HeroTicket({ t }: { t?: Tournament | null }) {
  if (!t) {
    return (
      <div className="anim-ticket card relative w-full max-w-md p-6 sm:p-8">
        <p className="text-sm font-semibold text-brand">Next tournament</p>
        <h2 className="mt-2 text-4xl text-white">Dates coming soon</h2>
        <p className="mt-3 text-sm text-zinc-400">
          Follow our Facebook page for the announcement. Already registered? Open the team portal for your match room.
        </p>
        <Link href="/portal" className="btn btn-primary mt-6 w-full">
          Team login
        </Link>
      </div>
    );
  }

  const now = Date.now();
  const href = registerHref(t);
  const regOpen = !!href && (!t.registration_end || new Date(t.registration_end).getTime() > now);
  const startsLater = !!t.start_date && new Date(t.start_date).getTime() > now;

  let label = "";
  let target: string | null = null;
  if (regOpen && t.registration_end) {
    label = "Registration closes in";
    target = t.registration_end;
  } else if (startsLater && t.start_date) {
    label = "Starts in";
    target = t.start_date;
  }

  return (
    <div className="anim-ticket card relative w-full max-w-md p-6 shadow-[0_30px_80px_-40px_rgba(255,122,41,0.45)] sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <StatusBadge status={t.status} />
        {t.start_date && <span className="text-xs text-zinc-400">{fmtDateTime(t.start_date)}</span>}
      </div>
      <h2 className="mt-4 text-4xl text-white sm:text-5xl">{t.title}</h2>

      <div className="mt-6 min-h-[5.5rem]">
        {target ? (
          <>
            <p className="mb-2 text-sm text-zinc-400">{label}</p>
            <Countdown target={target} />
          </>
        ) : t.status === "live" ? (
          <p className="flex items-center gap-2 text-2xl font-extrabold text-brand">
            <span className="live-dot h-2.5 w-2.5 rounded-full bg-brand" /> Live now
          </p>
        ) : (
          <p className="text-zinc-400">Registration is closed.</p>
        )}
      </div>

      <div className="perf">
        <div className="perforation" />
      </div>

      <div className="flex items-end justify-between gap-4">
        <dl className="flex gap-6 text-sm">
          {t.entry_fee && (
            <div>
              <dt className="text-xs text-zinc-500">Entry fee</dt>
              <dd className="font-bold text-white">{t.entry_fee}</dd>
            </div>
          )}
          {t.prize_pool && (
            <div>
              <dt className="text-xs text-zinc-500">Prize pool</dt>
              <dd className="font-bold text-brand2">{t.prize_pool}</dd>
            </div>
          )}
        </dl>
        <Link href="/tournaments" className="text-sm font-semibold text-zinc-300 transition hover:text-brand">
          Details
        </Link>
      </div>

      {regOpen && href && (
        <div className="mt-5">
          <RegisterButton href={href} end={t.registration_end} />
        </div>
      )}
    </div>
  );
}
