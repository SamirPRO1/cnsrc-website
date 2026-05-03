"use client";

import { useEffect, useState } from "react";

/**
 * Ticking UTC HH:MM:SS clock. Renders an empty placeholder during SSR
 * to avoid hydration mismatch.
 */
export function LiveClock() {
  const [now, setNow] = useState<string>("");

  useEffect(() => {
    function tick() {
      const d = new Date();
      const hh = String(d.getUTCHours()).padStart(2, "0");
      const mm = String(d.getUTCMinutes()).padStart(2, "0");
      const ss = String(d.getUTCSeconds()).padStart(2, "0");
      setNow(`${hh}:${mm}:${ss}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="mono" suppressHydrationWarning style={{ fontVariantNumeric: "tabular-nums" }}>
      {now || "--:--:--"} UTC
    </span>
  );
}
