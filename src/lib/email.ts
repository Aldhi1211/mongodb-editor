// Email normalization helper.
//
// We store and look up emails in canonical form (trimmed + lowercased) so
// register/login/OAuth/invite all resolve to a single account. Since every
// write normalizes, lookups can use a plain exact match (index-friendly).

/** Canonical form: trimmed + lowercased. */
export function normalizeEmail(email: unknown): string {
  return String(email ?? "").trim().toLowerCase();
}
