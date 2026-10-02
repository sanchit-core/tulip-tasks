<script lang="ts">
  import { store, type View } from "$lib/store.svelte";
  import { dueLabel } from "$lib/dates";
  import Icon from "./Icon.svelte";
  import NeuBadge from "./NeuBadge.svelte";
  import { toast } from "$lib/toasts";
  import PromptModal from "./PromptModal.svelte";
  import ConfirmModal from "./ConfirmModal.svelte";

  let {
    onquickadd,
    onsettings,
    onexport,
    onimport,
  }: {
    onquickadd: () => void;
    onsettings: () => void;
    onexport: () => void;
    onimport: () => void;
  } = $props();

  // Replacement for prompt/confirm
  let promptOpen = $state(false);
  let promptTitle = $state("");
  let promptMessage = $state("");
  let promptPlaceholder = $state("");
  let promptDefault = $state("");
  let promptResolve = $state<((v: string) => void) | null>(null);
  let promptReject = $state<(() => void) | null>(null);

  let confirmOpen = $state(false);
  let confirmMessage = $state("");
  let confirmResolve = $state<(() => void) | null>(null);
  let confirmReject = $state<(() => void) | null>(null);

  function showPrompt(title: string, message: string, placeholder: string, defaultValue: string): Promise<string> {
    promptTitle = title;
    promptMessage = message;
    promptPlaceholder = placeholder;
    promptDefault = defaultValue;
    promptOpen = true;
    return new Promise((resolve, reject) => {
      promptResolve = resolve;
      promptReject = reject;
    });
  }

  function showConfirm(message: string): Promise<boolean> {
    confirmMessage = message;
    confirmOpen = true;
    return new Promise((resolve) => {
      confirmResolve = () => resolve(true);
      confirmReject = () => resolve(false);
    });
  }

  function onPromptConfirm(value: string) {
    promptOpen = false;
    promptResolve?.(value);
    promptResolve = promptReject = null;
  }

  function onPromptCancel() {
    promptOpen = false;
    promptReject?.();
    promptResolve = promptReject = null;
  }

  function onConfirmConfirm() {
    confirmOpen = false;
    confirmResolve?.();
    confirmResolve = confirmReject = null;
  }

  function onConfirmCancel() {
    confirmOpen = false;
    confirmReject?.();
    confirmResolve = confirmReject = null;
  }

  interface Cmd {
    id: string;
    label: string;
    hint?: string;
    icon: string;
    group: string;
    keys?: string;
    run: () => void;
  }

  let query = $state("");
  let cursor = $state(0);
  let listEl = $state<HTMLDivElement | null>(null);

  function close() {
    store.paletteOpen = false;
    query = "";
    cursor = 0;
  }

  function go(view: View) {
    store.view = view;
    close();
  }

  function switchBoard(id: string) {
    store.selectBoard(id);
    store.view = "board";
    close();
  }

  let commands = $derived.by((): Cmd[] => {
    const out: Cmd[] = [
      { id: "v-board", label: "Go to board", icon: "columns", group: "Navigate", keys: "1", run: () => go("board") },
      { id: "v-cal", label: "Go to calendar", icon: "calendar", group: "Navigate", keys: "2", run: () => go("calendar") },
      { id: "v-back", label: "Go to backlog inbox", icon: "inbox", group: "Navigate", keys: "3", run: () => go("backlog") },
      { id: "new-task", label: "Quick capture to inbox", icon: "plus", group: "Create", keys: "N", run: () => { close(); onquickadd(); } },
      {
        id: "new-board",
        label: "New board…",
        icon: "board",
        group: "Create",
        run: async () => {
          close();
          const name = await showPrompt("New board", "Board name", "New board", "New board");
          if (name) store.addBoard(name);
        },
      },
      {
        id: "new-col",
        label: "Add column to current board",
        icon: "columns",
        group: "Create",
        run: async () => {
          close();
          const id = store.activeBoardId;
          if (!id) return;
          const name = await showPrompt("New column", "Column name", "New column", "New column");
          if (name) store.addColumn(id, name);
        },
      },
      {
        id: "hide-completed",
        label: store.filters.hideCompleted ? "Show completed tasks" : "Hide completed tasks",
        icon: "check-circle",
        group: "View",
        run: () => {
          store.filters.hideCompleted = !store.filters.hideCompleted;
          close();
        },
      },
      {
        id: "clear-filters",
        label: "Clear search and filters",
        icon: "filter",
        group: "View",
        run: () => {
          store.clearFilters();
          close();
          toast("Filters cleared", "info", 1800);
        },
      },
      {
        id: "notif",
        label: store.workspace.settings.notificationsEnabled
          ? "Disable due-date notifications"
          : "Enable due-date notifications",
        icon: "bell",
        group: "View",
        run: () => {
          store.updateSettings({ notificationsEnabled: !store.workspace.settings.notificationsEnabled });
          close();
        },
      },
      { id: "export", label: "Export workspace as JSON…", icon: "download", group: "Data", run: () => { close(); onexport(); } },
      { id: "import", label: "Import workspace from JSON…", icon: "upload", group: "Data", run: () => { close(); onimport(); } },
      { id: "settings", label: "Open settings", icon: "settings", group: "Data", keys: ",", run: () => { close(); onsettings(); } },
    ];

    for (const b of store.boards()) {
      const s = store.stats(b.id);
      out.push({
        id: `b-${b.id}`,
        label: b.title,
        hint: `${s.open} open · ${s.backlog} in inbox`,
        icon: "board",
        group: "Boards",
        run: () => switchBoard(b.id),
      });
    }

    for (const t of store.allTasks()) {
      out.push({
        id: `t-${t.id}`,
        label: t.title,
        hint: [
          store.board(t.boardId)?.title,
          t.columnId ? store.column(t.columnId)?.title : "Inbox",
          t.due ? dueLabel(t.due) : null,
          t.completedAt ? "done" : null,
        ]
          .filter(Boolean)
          .join(" · "),
        icon: t.completedAt ? "check-circle" : "circle",
        group: "Tasks",
        run: () => {
          store.selectBoard(t.boardId);
          store.openTask(t.id);
          close();
        },
      });
    }

    return out;
  });

  let results = $derived.by(() => {
    const q = query.trim().toLowerCase();
    const pool = q
      ? commands.filter((c) => `${c.label} ${c.hint ?? ""}`.toLowerCase().includes(q))
      : commands;
    // Keep section order stable and cap the (very long) task list.
    const order = ["Navigate", "Create", "Boards", "Tasks", "View", "Data"];
    const perGroup = q ? 50 : 8;
    const out: Cmd[] = [];
    for (const g of order) {
      out.push(...pool.filter((c) => c.group === g).slice(0, perGroup));
    }
    return out.slice(0, 60);
  });

  let groups = $derived.by(() => {
    const map = new Map<string, Cmd[]>();
    for (const c of results) {
      if (!map.has(c.group)) map.set(c.group, []);
      map.get(c.group)!.push(c);
    }
    return [...map.entries()];
  });

  $effect(() => {
    // Keep the cursor inside the result set as the query narrows.
    if (cursor >= results.length) cursor = Math.max(0, results.length - 1);
  });

  $effect(() => {
    if (!store.paletteOpen) {
      query = "";
      cursor = 0;
      return;
    }
    const el = listEl?.querySelector<HTMLElement>("[data-cursor='true']");
    el?.scrollIntoView({ block: "nearest" });
  });

  function pick(c: Cmd) {
    c.run();
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      cursor = Math.min(cursor + 1, results.length - 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      cursor = Math.max(cursor - 1, 0);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const c = results[cursor];
      if (c) pick(c);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  }

  let flatIndex = $derived.by(() => {
    const map = new Map<string, number>();
    let i = 0;
    for (const [, items] of groups) for (const c of items) map.set(c.id, i++);
    return map;
  });
</script>

<svelte:window onkeydown={(e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    store.paletteOpen = !store.paletteOpen;
  }
  if (store.paletteOpen && e.key === "Escape") {
    e.preventDefault();
    close();
  }
}} />

{#if store.paletteOpen}
  <div
    class="scrim"
    role="presentation"
    onclick={(e) => {
      if (e.target === e.currentTarget) close();
    }}
  >
    <div class="pal" role="dialog" aria-modal="true" aria-label="Command palette">
      <div class="search">
        <Icon name="search" size={18} strokeWidth={2.6} />
        <!-- svelte-ignore a11y_autofocus -->
        <input
          bind:value={query}
          placeholder="Search tasks, boards, commands…"
          autofocus
          {onkeydown}
        />
        <kbd>esc</kbd>
      </div>

      <div class="list" bind:this={listEl}>
        {#if results.length === 0}
          <p class="none muted">No matches for “{query}”.</p>
        {:else}
          {#each groups as [group, items] (group)}
            <div class="grp">
              <div class="grp-h">{group}</div>
              {#each items as c (c.id)}
                {@const idx = flatIndex.get(c.id) ?? 0}
                <button
                  type="button"
                  data-cursor={idx === cursor}
                  class="row-item"
                  class:on={idx === cursor}
                  onmouseenter={() => (cursor = idx)}
                  onclick={() => pick(c)}
                >
                  <Icon name={c.icon} size={16} strokeWidth={2.4} />
                  <span class="truncate lab">{c.label}</span>
                  {#if c.hint}<span class="truncate hint">{c.hint}</span>{/if}
                  {#if c.keys}<kbd>{c.keys}</kbd>{/if}
                </button>
              {/each}
            </div>
          {/each}
        {/if}
      </div>

      <div class="foot">
        <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
        <span><kbd>↵</kbd> run</span>
        <span class="spacer"></span>
        <NeuBadge tone="default" size="sm">{results.length} results</NeuBadge>
      </div>
    </div>
  </div>
{/if}

<PromptModal
  bind:open={promptOpen}
  title={promptTitle}
  message={promptMessage}
  placeholder={promptPlaceholder}
  defaultValue={promptDefault}
  validate={undefined}
  onconfirm={onPromptConfirm}
  oncancel={onPromptCancel}
/>

<ConfirmModal
  bind:open={confirmOpen}
  title="Confirm"
  message={confirmMessage}
  onconfirm={onConfirmConfirm}
  oncancel={onConfirmCancel}
/>

<style>
  .scrim {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: rgba(23, 23, 23, 0.42);
    display: flex;
    justify-content: center;
    padding: 12vh 20px 20px;
    animation: fade 0.12s ease;
  }
  .pal {
    width: 100%;
    max-width: 640px;
    height: fit-content;
    max-height: 74vh;
    display: flex;
    flex-direction: column;
    background: var(--surface);
    border: var(--border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-pop);
    overflow: hidden;
    animation: pop 0.16s cubic-bezier(0.2, 0.9, 0.3, 1);
  }

  .search {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-bottom: var(--border);
    color: var(--text-3);
  }
  .search input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    font-size: 16px;
    font-weight: 700;
    padding: 2px 0;
  }

  .list {
    overflow-y: auto;
    padding: 6px;
    min-height: 0;
  }
  .grp-h {
    font-size: 10.5px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-3);
    padding: 8px 8px 4px;
  }
  .row-item {
    display: flex;
    align-items: center;
    gap: 9px;
    width: 100%;
    border: 2px solid transparent;
    border-radius: var(--radius-md);
    background: transparent;
    padding: 7px 9px;
    text-align: left;
  }
  .row-item.on {
    border-color: var(--ink);
    background: var(--accent);
    box-shadow: var(--shadow-flat);
  }
  .lab {
    font-weight: 800;
    flex: none;
    max-width: 55%;
  }
  .hint {
    font-size: 12px;
    color: var(--text-2);
    flex: 1;
    min-width: 0;
  }
  .row-item.on .hint {
    color: var(--text-2);
  }

  .none {
    padding: 22px;
    text-align: center;
    margin: 0;
  }

  .foot {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    border-top: var(--border);
    background: var(--surface-2);
    font-size: 11px;
    font-weight: 800;
    color: var(--text-2);
  }
  .foot span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .spacer {
    flex: 1;
  }

  kbd {
    border: 2px solid var(--ink);
    border-radius: var(--radius-sm);
    padding: 0 4px;
    background: var(--surface);
    font-family: inherit;
    font-size: 10px;
    font-weight: 900;
    box-shadow: 1px 1px 0 var(--ink);
  }

  @keyframes fade {
    from {
      opacity: 0;
    }
  }
  @keyframes pop {
    from {
      opacity: 0;
      transform: translateY(-10px) scale(0.98);
    }
  }
</style>
