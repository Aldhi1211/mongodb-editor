// Email normalization + matching helpers.
//
// We store emails lowercased on every write so register/login/OAuth/invite all
// resolve to a single account. Reads use a case-insensitive match so rows that
// were created before normalization (mixed-case emails) still resolve.

/** Canonical form stored in the DB: trimmed + lowercased. */
export function normalizeEmail(email: unknown): string {
  return String(email ?? "").trim().toLowerCase();
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Mongo filter value for a case-insensitive exact-email match.
 * Usage: `collection.findOne({ email: emailMatch(input) })`
 */
export function emailMatch(email: unknown) {
  return { $regex: new RegExp(`^${escapeRegex(normalizeEmail(email))}$`, "i") };
}
