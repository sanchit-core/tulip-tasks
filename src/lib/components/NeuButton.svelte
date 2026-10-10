<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    children,
    variant = "raised",
    tone = "default",
    size = "md",
    disabled = false,
    title,
    onclick,
    type = "button",
    full = false,
  }: {
    children: Snippet;
    variant?: "raised" | "flat" | "pressed" | "primary" | "ghost" | "danger";
    tone?: "default" | "primary" | "danger" | "accent" | "violet";
    size?: "sm" | "md" | "lg" | "icon";
    disabled?: boolean;
    title?: string;
    onclick?: (e: MouseEvent) => void;
    type?: "button" | "submit";
    full?: boolean;
  } = $props();

  const TONE: Record<string, string> = {
    default: "var(--surface)",
    primary: "var(--primary)",
    danger: "var(--danger)",
    accent: "var(--accent)",
    violet: "var(--violet)",
  };
</script>

<button
  {type}
  {title}
  {disabled}
  {onclick}
  class="btn {variant} {size}"
  class:full
  style:--tone={TONE[tone]}
>
  {@render children()}
</button>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: var(--border);
    border-radius: var(--radius-md);
    background: var(--tone);
    color: var(--text-1);
    font-weight: 800;
    box-shadow: var(--shadow-raised);
    transition:
      transform var(--t),
      box-shadow var(--t),
      background-color var(--t);
    white-space: nowrap;
  }
  .btn.sm {
    padding: 5px 10px;
    font-size: 13px;
    box-shadow: var(--shadow-flat);
  }
  .btn.md {
    padding: 8px 14px;
    font-size: 14px;
  }
  .btn.lg {
    padding: 12px 20px;
    font-size: 16px;
    box-shadow: var(--shadow-raised-lg);
  }
  .btn.icon {
    padding: 0;
    width: 34px;
    height: 34px;
    box-shadow: var(--shadow-flat);
  }
  .btn.full {
    width: 100%;
  }

  .btn:hover:not(:disabled) {
    transform: translate(-1px, -1px);
  }
  .btn:active:not(:disabled) {
    transform: translate(var(--press-shift));
    box-shadow: none;
  }

  .btn.flat {
    box-shadow: var(--shadow-flat);
  }
  .btn.pressed,
  .btn.ghost {
    box-shadow: none;
  }
  .btn.ghost {
    background: transparent;
    border-color: transparent;
    box-shadow: none;
    color: var(--text-2);
  }
  .btn.ghost:hover:not(:disabled) {
    background: var(--surface-2);
    color: var(--text-1);
    transform: none;
  }
  .btn.primary {
    background: var(--primary);
    /* ink on the pink fill: 5.6:1. White on --primary is only 3.2:1. */
    color: var(--text-1);
  }
  .btn.danger {
    background: var(--danger);
    /* white on --danger is 4.8:1; ink on red would only be 3.7:1 */
    color: var(--text-on-primary);
  }
  .btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none;
    box-shadow: var(--shadow-flat);
  }
</style>
