<script lang="ts">
  import type { Snippet } from "svelte";
  import Icon from "./Icon.svelte";

  let {
    open = $bindable(false),
    title = "",
    width = 620,
    onclose,
    children,
    footer,
  }: {
    open?: boolean;
    title?: string;
    width?: number;
    onclose?: () => void;
    children: Snippet;
    footer?: Snippet;
  } = $props();

  let dialog = $state<HTMLDivElement | null>(null);

  function close() {
    open = false;
    onclose?.();
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
    }
  }

  $effect(() => {
    if (!open) return;
    dialog?.focus();
  });
</script>

<svelte:window {onkeydown} />

{#if open}
  <div
    class="scrim"
    role="presentation"
    onclick={(e) => {
      if (e.target === e.currentTarget) close();
    }}
  >
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style:max-width="{width}px"
      bind:this={dialog}
      tabindex="-1"
    >
      {#if title}
        <header>
          <h2 class="truncate">{title}</h2>
          <button class="close" type="button" aria-label="Close" onclick={close}>
            <Icon name="x" size={18} strokeWidth={2.5} />
          </button>
        </header>
      {/if}
      <div class="body">
        {@render children()}
      </div>
      {#if footer}
        <footer>{@render footer()}</footer>
      {/if}
    </div>
  </div>
{/if}

<style>
  .scrim {
    position: fixed;
    inset: 0;
    z-index: 90;
    background: rgba(23, 23, 23, 0.42);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    animation: fade 0.14s ease;
  }
  .modal {
    width: 100%;
    max-height: min(88vh, 900px);
    display: flex;
    flex-direction: column;
    background: var(--surface);
    border: var(--border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-pop);
    animation: pop 0.18s cubic-bezier(0.2, 0.9, 0.3, 1);
    outline: none;
  }
  header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: var(--border);
  }
  h2 {
    font-size: 18px;
    flex: 1;
  }
  .close {
    border: 2px solid var(--ink);
    border-radius: var(--radius-sm);
    background: var(--surface-2);
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    box-shadow: var(--shadow-flat);
  }
  .close:active {
    box-shadow: none;
    transform: translate(2px, 2px);
  }
  .body {
    padding: 16px;
    overflow-y: auto;
    min-height: 0;
  }
  footer {
    padding: 12px 16px;
    border-top: var(--border);
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    background: var(--surface-2);
    border-radius: 0 0 var(--radius-xl) var(--radius-xl);
  }

  @keyframes fade {
    from {
      opacity: 0;
    }
  }
  @keyframes pop {
    from {
      opacity: 0;
      transform: translateY(14px) scale(0.97);
    }
  }
</style>
