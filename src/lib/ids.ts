let seq = 0;

/**
 * Short, collision-resistant id with a readable type prefix (`tk`, `bd`, `cl`, `sb`).
 * Not a UUID — the prefix plus a session counter is enough for a single-user,
 * local-first workspace and keeps the JSON file greppable.
 */
export function uid(prefix = "id"): string {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}${seq.toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}
