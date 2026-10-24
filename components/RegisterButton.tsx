"use client";

import Link from "next/link";
import { useState } from "react";
import { CountdownText, useRemaining } from "./Countdown";

/** Register button that shows how long registration stays open and switches to "closed" by itself. */
export default function RegisterButton({
  href,
  end,
  label = "Register now",
  full = true,
}: {
  href: string;
  end?: string | null;
  label?: string;
  full?: boolean;
}) {
  const [closed, setClosed] = useState(false);
  const left = useRemaining(end ?? "2999-01-01T00:00:00Z", 0, () => {
    if (end) setClosed(true);
  });
  const isClosed = !!end && (closed || (left !== null && left <= 0));

  if (isClosed) {
    return (
      <span className={`btn btn-ghost cursor-not-allowed opacity-60 ${full ? "w-full" : ""}`}>Registration closed</span>
    );
  }
  return (
    <div className={full ? "w-full" : ""}>
      <Link href={href} className={`btn btn-primary ${full ? "w-full" : ""}`}>
        {label}
      </Link>
      {end && (
        <p className="mt-2 text-center text-xs text-zinc-400">
          Closes in <CountdownText target={end} />
        </p>
      )}
    </div>
  );
}
