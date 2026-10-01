<script lang="ts">
  import { toasts, dismissToast } from "$lib/toasts";
  import Icon from "./Icon.svelte";

  const ICON = { success: "check-circle", error: "alert-circle", info: "info" } as const;
</script>

<div class="wrap" aria-live="polite">
  {#each $toasts as t (t.id)}
    <button class="toast {t.type}" type="button" onclick={() => dismissToast(t.id)}>
      <Icon name={ICON[t.type]} size={18} strokeWidth={2.4} />
      <span>{t.message}</span>
    </button>
  {/each}
</div>

<style>
  .wrap {
    position: fixed;
    right: 18px;
    bottom: 18px;
    z-index: 120;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none;
  }
  .toast {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 9px;
    border: var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
    box-shadow: var(--shadow-raised);
    padding: 10px 14px;
    font-weight: 700;
    max-width: 380px;
    text-align: left;
    animation: slide 0.2s cubic-bezier(0.2, 0.9, 0.3, 1);
  }
  .toast.success {
    background: var(--low-soft);
  }
  .toast.error {
    background: var(--danger-soft);
  }
  @keyframes slide {
    from {
      opacity: 0;
      transform: translateX(24px);
    }
  }
</style>
