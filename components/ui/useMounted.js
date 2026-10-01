"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// True only after hydration — lets portals render without server/client mismatches.
export function useMounted() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
