"use client";

import { useEffect, useState } from "react";

/**
 * Server-rendered counters (unread, chat…) kept live by the bell's polling ("wameed:counts" events).
 * A fresh server value (router.refresh) replaces the live override automatically.
 */
export function useLiveCounts(initial) {
  const [live, setLive] = useState(null);

  useEffect(() => {
    const onCounts = (e) => setLive((prev) => ({ base: initial, values: { ...(prev?.base === initial ? prev.values : {}), ...e.detail } }));
    window.addEventListener("wameed:counts", onCounts);
    return () => window.removeEventListener("wameed:counts", onCounts);
  }, [initial]);

  return live && live.base === initial ? { ...initial, ...live.values } : initial;
}
