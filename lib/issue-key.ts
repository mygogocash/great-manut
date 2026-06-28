/** Issue identifier pattern, e.g. ENG-123 */
export const ISSUE_KEY_REGEX = /[A-Z]{2,}-\d+/g;

export type ParsedIssueKey = { teamKey: string; number: number; raw: string };

/** Extract unique issue keys from free text. */
export function parseIssueKeys(text: string): ParsedIssueKey[] {
  const seen = new Set<string>();
  const keys: ParsedIssueKey[] = [];
  for (const match of text.matchAll(ISSUE_KEY_REGEX)) {
    const raw = match[0];
    if (seen.has(raw)) {
      continue;
    }
    seen.add(raw);
    const dash = raw.lastIndexOf("-");
    const teamKey = raw.slice(0, dash);
    const number = Number.parseInt(raw.slice(dash + 1), 10);
    if (number > 0) {
      keys.push({ teamKey, number, raw });
    }
  }
  return keys;
}
