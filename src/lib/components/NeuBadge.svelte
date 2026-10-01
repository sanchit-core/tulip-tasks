<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    children,
    tone = "default",
    size = "md",
    title,
  }: {
    children: Snippet;
    tone?:
      | "default"
      | "primary"
      | "accent"
      | "urgent"
      | "high"
      | "medium"
      | "low"
      | "violet"
      | "overdue"
      | "muted";
    size?: "sm" | "md";
    title?: string;
  } = $props();

  const TONE: Record<string, string> = {
    default: "var(--surface-2)",
    primary: "var(--primary-soft)",
    accent: "var(--accent-soft)",
    urgent: "var(--urgent-soft)",
    high: "var(--high-soft)",
    medium: "var(--medium-soft)",
    low: "var(--low-soft)",
    violet: "var(--violet-soft)",
    overdue: "var(--danger)",
    muted: "var(--surface-2)",
  };

  const INK: Record<string, string> = {
    overdue: "var(--text-on-primary)",
  };
</script>

<span
  class="badge {size}"
  style:--tone={TONE[tone]}
  style:--ink={INK[tone] ?? "var(--text-1)"}
  {title}
>
  {@render children()}
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border: 2px solid var(--ink);
    border-radius: 999px;
    background: var(--tone);
    color: var(--ink);
    font-weight: 800;
    white-space: nowrap;
    max-width: 100%;
    overflow: hidden;
  }
  .badge.sm {
    padding: 1px 7px;
    font-size: 11px;
  }
  .badge.md {
    padding: 3px 10px;
    font-size: 12px;
  }
</style>
