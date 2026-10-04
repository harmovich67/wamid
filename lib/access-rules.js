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
    if (rule) return { ...evaluateRule(rule, now), via: type, ...(rule.group ? { group: rule.group } : {}) };
  }
  return { open: false, state: STATES.unassigned };
}

// How useful a rule is to the student right now — used to pick between conflicting class rules.
const RANK = { open: 3, scheduled: 2, expired: 1, denied: 0 };

/**
 * Collapses the rules of every class a student belongs to into one map. When two classes disagree
 * about the same item, the more generous one wins (open > scheduled > expired > denied), and between
 * two scheduled rules the earlier opening wins. Each rule keeps `group` (the class name) for display.
 */
export function mergeGroupRules(groupRules, now = new Date()) {
  const map = new Map();
  for (const rule of groupRules) {
    const key = ruleKey(rule.resourceType, rule.resourceId);
    const prev = map.get(key);
    if (!prev) {
      map.set(key, rule);
      continue;
    }
    const a = RANK[evaluateRule(rule, now).state];
    const b = RANK[evaluateRule(prev, now).state];
    const earlier = (toDate(rule.availableFrom)?.getTime() ?? 0) < (toDate(prev.availableFrom)?.getTime() ?? 0);
    if (a > b || (a === b && earlier)) map.set(key, rule);
  }
  return map;
}

/** Personal rules on top of class rules: a student's own rule always overrides the class one. */
export function withGroupRules(ownMap, groupMap) {
  if (!groupMap?.size) return ownMap;
  const merged = new Map(groupMap);
  for (const [key, rule] of ownMap) merged.set(key, rule);
  return merged;
}
