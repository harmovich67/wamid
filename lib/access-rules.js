// Pure rule resolution shared by the server (lib/access.js) and the admin access editor.

export const STATES = {
  open: "open",
  denied: "denied",
  scheduled: "scheduled",
  expired: "expired",
  unassigned: "unassigned",
  sequential: "sequential",
};

export const ruleKey = (type, id) => `${type}:${id}`;

const toDate = (v) => (v ? (v instanceof Date ? v : new Date(v)) : null);

export function evaluateRule(rule, now = new Date()) {
  if (rule.effect === "DENY") return { open: false, state: STATES.denied };
  const from = toDate(rule.availableFrom);
  const until = toDate(rule.availableUntil);
  if (from && from > now) return { open: false, state: STATES.scheduled, opensAt: from };
  if (until && until < now) return { open: false, state: STATES.expired, closedAt: until };
  return { open: true, state: STATES.open, closesAt: until };
}

// chain: [["LESSON", id], ["MODULE", id], ...] — most specific first; first rule found wins.
export function resolveChain(ruleMap, chain, now = new Date()) {
  for (const [type, id] of chain) {
    if (!id) continue;
    const rule = ruleMap.get(ruleKey(type, id));
    if (rule) return { ...evaluateRule(rule, now), via: type };
  }
  return { open: false, state: STATES.unassigned };
}
