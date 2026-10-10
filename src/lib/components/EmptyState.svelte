<script lang="ts">
  import type { Snippet } from "svelte";
  import Icon from "./Icon.svelte";

  let {
    icon = "inbox",
    title,
    hint = "",
    children,
  }: {
    icon?: string;
    title: string;
    hint?: string;
    children?: Snippet;
  } = $props();
</script>

<div class="empty">
  <span class="badge-ico"><Icon name={icon} size={26} strokeWidth={2} /></span>
  <h3>{title}</h3>
  {#if hint}<p class="muted small">{hint}</p>{/if}
  {#if children}<div class="actions">{@render children()}</div>{/if}
</div>

<style>
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 36px 20px;
    text-align: center;
  }
  .badge-ico {
    width: 54px;
    height: 54px;
    border: var(--border);
    border-radius: var(--radius-lg);
    background: var(--surface-2);
    box-shadow: var(--shadow-inset);
    display: grid;
    place-items: center;
    color: var(--text-3);
    margin-bottom: 4px;
  }
  h3 {
    font-size: 16px;
  }
  p {
    margin: 0;
    max-width: 320px;
  }
  .actions {
    margin-top: 8px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
  }
</style>
