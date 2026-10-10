import type { Task } from "./types";
import { todayISO, toISO } from "./dates";

/** In-memory guard so the same task is never announced twice in one session. */
const announced = new Set<string>();
const DAY_MS = 86_400_000;

let timer: ReturnType<typeof setInterval> | null = null;

export function isDesktop(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function ensurePermission(): Promise<boolean> {
  if (!isDesktop()) return false;
  try {
    const { isPermissionGranted, requestPermission } = await import(
      "@tauri-apps/plugin-notification"
    );
    if (await isPermissionGranted()) return true;
    return (await requestPermission()) === "granted";
  } catch {
    return false;
  }
}

async function send(title: string, body: string): Promise<void> {
  try {
    const { sendNotification } = await import("@tauri-apps/plugin-notification");
    sendNotification({ title, body });
  } catch {
    /* ignore */
  }
}

/**
 * Announce tasks coming due today and anything overdue.
 *
 * Called on boot and then hourly; `announced` keys are suffixed with the ISO date
 * so the same task can be announced again on a later day.
 */
export async function checkDue(tasks: Task[]): Promise<number> {
  if (!isDesktop()) return 0;
  const ok = await ensurePermission();
  if (!ok) return 0;

  const today = todayISO();
  let sent = 0;

  for (const t of tasks) {
    if (t.completedAt || !t.due) continue;
    const overdue = t.due < today;
    const isToday = t.due === today;
    if (!overdue && !isToday) continue;
    if (announced.has(t.id)) continue;
    announced.add(t.id);

    await send(
      overdue ? "Overdue in Tulip Kanban" : "Due today in Tulip Kanban",
      overdue ? `${t.title} — was due ${t.due}` : t.title,
    );
    sent += 1;
  }

  // Forget announcements for dates that have rolled over.
  if (announced.size > 400) announced.clear();
  return sent;
}

/**
 * Morning digest: "3 due today, 2 overdue". Sent at most once per calendar day
 * and only at or after the user's chosen hour.
 */
export async function maybeDailyDigest(dueToday: Task[], overdue: Task[], hour: number): Promise<void> {
  if (!isDesktop()) return;
  if (dueToday.length === 0 && overdue.length === 0) return;

  const now = new Date();
  if (now.getHours() < hour) return;

  const key = toISO(now);
  if (announced.has(`digest:${key}`)) return;
  announced.add(`digest:${key}`);

  const parts: string[] = [];
  if (dueToday.length) parts.push(`${dueToday.length} due today`);
  if (overdue.length) parts.push(`${overdue.length} overdue`);
  await send("Tulip Kanban — daily digest", parts.join(" · "));
}

/** Start the hourly sweep. Safe to call more than once. */
export function bootNotifier(getTasks: () => Task[], getHour: () => number): void {
  if (timer) clearInterval(timer);
  void checkDue(getTasks());
  void maybeDailyDigest(
    getTasks().filter((t) => t.due === todayISO() && !t.completedAt),
    getTasks().filter((t) => !!t.due && t.due < todayISO() && !t.completedAt),
    getHour(),
  );
  timer = setInterval(
    () => {
      const tasks = getTasks().filter((t) => !t.completedAt);
      void checkDue(tasks);
      void maybeDailyDigest(
        tasks.filter((t) => t.due === todayISO()),
        tasks.filter((t) => !!t.due && t.due < todayISO()),
        getHour(),
      );
    },
    Math.round(DAY_MS / 24),
  );
}
