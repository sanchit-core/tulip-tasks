<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    children,
    tone = "default",
    pad = "md",
    inset = false,
    raised = true,
  }: {
    children: Snippet;
    tone?: "default" | "surface-2" | "primary-soft" | "accent-soft" | "violet-soft" | "danger-soft";
    pad?: "none" | "sm" | "md" | "lg";
    inset?: boolean;
    raised?: boolean;
  } = $props();

  const TONE: Record<string, string> = {
    default: "var(--surface)",
    "surface-2": "var(--surface-2)",
    "primary-soft": "var(--primary-soft)",
    "accent-soft": "var(--accent-soft)",
    "violet-soft": "var(--violet-soft)",
    "danger-soft": "var(--danger-soft)",
  };
</script>

<div
  class="card {pad}"
  style:--tone={TONE[tone]}
  class:inset
  class:raised
>
  {@render children()}
</div>

<style>
  .card {
    border: var(--border);
    border-radius: var(--radius-lg);
    background: var(--tone);
  }
  .card.raised {
    box-shadow: var(--shadow-raised);
  }
  .card.inset {
    box-shadow: var(--shadow-inset);
  }
  .card.pad.none {
    padding: 0;
  }
  .card.pad.sm {
    padding: 8px;
  }
  .card.pad.md {
    padding: 14px;
  }
  .card.pad.lg {
    padding: 20px;
  }
</style>
