<script lang="ts">
  import { store } from "$lib/store.svelte";
  import Icon from "./Icon.svelte";
  import NeuButton from "./NeuButton.svelte";
  import { toast } from "$lib/toasts";

  type MenuItem = {
    label: string;
    icon?: string;
    action: () => void;
    disabled?: boolean;
    danger?: boolean;
    separator?: boolean;
  };

  let {
    open = $bindable(false),
    x = 0,
    y = 0,
    items = [],
    onclose,
  }: {
    open?: boolean;
    x: number;
    y: number;
    items: MenuItem[];
    onclose?: () => void;
  } = $props();

  let menuEl = $state<HTMLDivElement | null>(null);

  function close() {
    open = false;
    onclose?.();
  }

  function handleItem(item: MenuItem) {
    if (item.disabled) return;
    item.action();
    close();
  }

  $effect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuEl && !menuEl.contains(e.target as Node)) close();
    };
    document.addEventListener("click", handleClickOutside, { capture: true });
    return () => document.removeEventListener("click", handleClickOutside, { capture: true });
  });

  $effect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  });
</script>

{#if open}
  <div
    class="context-menu"
    style:left="{x}px"
    style:top="{y}px"
    bind:this={menuEl}
    role="menu"
    aria-label="Context menu"
  >
    {#each items as item, i (i)}
      {#if item.separator}
        <div class="sep" role="separator"></div>
      {:else}
        <button
          type="button"
          class="item"
          class:disabled={item.disabled}
          class:danger={item.danger}
          role="menuitem"
          onclick={() => handleItem(item)}
        >
          {#if item.icon}
            <Icon name={item.icon} size={14} strokeWidth={2.4} />
          {/if}
          <span>{item.label}</span>
        </button>
      {/if}
    {/each}
  </div>
{/if}

<style>
  .context-menu {
    position: fixed;
    z-index: 200;
    background: var(--surface);
    border: var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-pop);
    padding: 4px;
    min-width: 180px;
    animation: pop 0.12s cubic-bezier(0.2, 0.9, 0.3, 1);
  }
  .sep {
    height: 2px;
    background: var(--surface-2);
    margin: 4px 0;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    border: none;
    background: transparent;
    border-radius: var(--radius-sm);
    padding: 7px 10px;
    font-weight: 700;
    font-size: 13px;
    text-align: left;
    color: var(--text-1);
  }
  .item:hover:not(.disabled) {
    background: var(--accent);
  }
  .item:active:not(.disabled) {
    background: var(--accent-soft);
  }
  .item.disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .item.danger {
    color: var(--danger);
  }
  .item.danger:hover:not(.disabled) {
    background: var(--danger-soft);
  }
  .item :global(.icon) {
    flex: none;
    color: var(--text-2);
  }
  .item.danger :global(.icon) {
    color: var(--danger);
  }

  @keyframes pop {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
  }
</style>
