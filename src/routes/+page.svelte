<script lang="ts">
  import { store } from "$lib/store.svelte";
  import { dnd } from "$lib/dnd.svelte";
  import { importFromFile, exportToFile } from "$lib/transfer";
  import { toast } from "$lib/toasts";
  import Titlebar from "$lib/components/Titlebar.svelte";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import Sidebar from "$lib/components/Sidebar.svelte";
  import FilterBar from "$lib/components/FilterBar.svelte";
  import BoardView from "$lib/components/BoardView.svelte";
  import CalendarView from "$lib/components/CalendarView.svelte";
  import BacklogView from "$lib/components/BacklogView.svelte";
  import TaskDetail from "$lib/components/TaskDetail.svelte";
  import CommandPalette from "$lib/components/CommandPalette.svelte";
  import QuickAdd from "$lib/components/QuickAdd.svelte";
  import SettingsModal from "$lib/components/SettingsModal.svelte";
  import ContextMenu from "$lib/components/ContextMenu.svelte";
  import Icon from "$lib/components/Icon.svelte";
  import NeuButton from "$lib/components/NeuButton.svelte";
  import NeuBadge from "$lib/components/NeuBadge.svelte";

  let quickAddOpen = $state(false);
  let settingsOpen = $state(false);
  let shortcutsOpen = $state(false);

  let board = $derived(store.activeBoard());
  let stats = $derived(store.stats());

  // ---- context menu state ----
  let contextMenu = $state<{
    open: boolean;
    x: number;
    y: number;
    items: Array<{
      label: string;
      icon?: string;
      action: () => void;
      disabled?: boolean;
      danger?: boolean;
      separator?: boolean;
    }>;
  }>({ open: false, x: 0, y: 0, items: [] });

  function showContextMenu(e: MouseEvent, items: typeof contextMenu.items) {
    e.preventDefault();
    e.stopPropagation();
    contextMenu = { open: true, x: e.clientX, y: e.clientY, items };
  }

  function hideContextMenu() {
    contextMenu.open = false;
  }

  function taskContextMenu(e: MouseEvent, task: any) {
    showContextMenu(e, [
      { label: "Open", icon: "external-link", action: () => store.openTask(task.id) },
      { label: "Edit", icon: "edit", action: () => { store.openTask(task.id); } },
      { label: "Duplicate", icon: "copy", action: () => store.duplicateTask(task.id) },
      { label: "", action: () => {}, separator: true },
      { label: "Mark done", icon: "check-circle", action: () => store.completeTask(task.id), disabled: !!task.completedAt },
      { label: "Reopen", icon: "rotate-ccw", action: () => store.reopenTask(task.id), disabled: !task.completedAt },
      { label: "", action: () => {}, separator: true },
      { label: "Delete", icon: "trash", action: () => store.deleteTask(task.id), danger: true },
    ]);
  }

  // ---- drag & drop wiring (window-level so it works across views) ------
  function onPointerMove(e: PointerEvent) {
    dnd.move(e);
  }

  function onPointerUp() {
    const drop = dnd.end();
    if (!drop) return;

    if (drop.iso !== null) {
      // Dropped on a calendar day: only reschedule, never change column.
      store.updateTask(drop.taskId, { due: drop.iso });
      return;
    }

    const task = store.task(drop.taskId);
    if (!task) return;

    // If dropping with no valid target or dropping to "nowhere meaningful" (e.g. empty board area not over a drop zone),
    // don't move it - snap back to original position
    if (!dnd.hasValidTarget) return;
    if (drop.columnId === undefined) return;

    // Translate the filtered slot index into a raw sibling index.
    try {
      const rawIndex = store.visibleToRaw(drop.columnId, drop.index, task.boardId);
      store.moveTaskSmart(drop.taskId, drop.columnId, rawIndex);
    } catch {
      return;
    }
  }

  function onPointerCancel() {
    dnd.cancel();
  }

  /**
   * A pointer drag still ends with a click event on the card underneath. Swallow
   * exactly one click after a real drag so dropping a card never opens its detail.
   */
  function onClickCapture(e: MouseEvent) {
    if (!dnd.suppressClick) return;
    dnd.suppressClick = false;
    e.stopPropagation();
    e.preventDefault();
  }

  // ---- keyboard shortcuts ---------------------------------------------
  function typing(e: KeyboardEvent): boolean {
    const el = e.target as HTMLElement | null;
    if (!el) return false;
    return (
      el.tagName === "INPUT" ||
      el.tagName === "TEXTAREA" ||
      el.tagName === "SELECT" ||
      el.isContentEditable
    );
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      // Close whatever overlay is open. This runs before the `typing` guard so
      // Escape still works while focus sits inside an overlay's own input.
      if (shortcutsOpen) {
        shortcutsOpen = false;
        return;
      }
      if (quickAddOpen) {
        quickAddOpen = false;
        return;
      }
      if (store.activeTaskId) {
        store.closeTask();
        return;
      }
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (typing(e)) return;
    if (store.paletteOpen) return;

    const k = e.key.toLowerCase();

    if (k === "n") {
      e.preventDefault();
      quickAddOpen = true;
    } else if (k === "1") {
      store.view = "board";
    } else if (k === "2") {
      store.view = "calendar";
    } else if (k === "3") {
      store.view = "backlog";
    } else if (k === "/") {
      e.preventDefault();
      document.getElementById("tk-search")?.focus();
    } else if (k === ",") {
      e.preventDefault();
      settingsOpen = true;
    } else if (k === "b") {
      store.sidebarOpen = !store.sidebarOpen;
    } else if (k === "?") {
      e.preventDefault();
      shortcutsOpen = true;
    }
  }

  // ---- data transfer ---------------------------------------------------
  async function doExport() {
    const path = await exportToFile(store.exportJSON());
    if (path) toast(`Exported to ${path.split("/").pop()}`, "success");
    else if (path === null) toast("Export cancelled", "info", 1600);
    else toast("Export failed", "error");
  }

  async function doImport() {
    const raw = await importFromFile();
    if (raw === null) {
      return;
    }
    try {
      const ok = store.importJSON(raw);
      if (ok) {
        toast("Workspace imported", "success");
        settingsOpen = false;
      } else {
        toast("That file is not a Tulip Kanban workspace", "error", 5000);
      }
    } catch {
      toast("Could not parse that JSON file", "error", 5000);
    }
  }

  const SHORTCUTS: [string, string][] = [
    ["⌘K / Ctrl+K", "Command palette"],
    ["N", "Quick capture to inbox"],
    ["1 / 2 / 3", "Board / Calendar / Backlog"],
    ["/", "Focus search"],
    ["B", "Toggle sidebar"],
    [",", "Settings"],
    ["Esc", "Close dialog or task"],
    ["?", "This help"],
  ];
</script>

<svelte:window
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointercancel={onPointerCancel}
  onclickcapture={onClickCapture}
  onkeydown={onKeydown}
/>

<div class="app" class:dragging={!!dnd.state}>
  {#if !store.workspace.settings.hideTitlebar}
    <Titlebar saveState={store.saveState} />
  {/if}

  {#if dnd.state?.ghostHTML}
    <div class="drag-ghost" style="left: {dnd.state.pointerX}px; top: {dnd.state.pointerY}px;">
      {@html dnd.state.ghostHTML}
    </div>
  {/if}

  <div class="body">
    {#if store.sidebarOpen}
      <Sidebar />
    {/if}

    <main>
      <header class="top">
        <NeuButton
          size="icon"
          variant="ghost"
          title="Toggle sidebar (B)"
          onclick={() => (store.sidebarOpen = !store.sidebarOpen)}
        >
          <Icon name="menu" size={18} strokeWidth={2.4} />
        </NeuButton>

        <div class="titles">
          <h1 class="truncate">
            {#if store.view === "board"}
              {#if board}
                <span class="swatch" style:--c={board.color}></span>{board.title}
              {:else}
                Board
              {/if}
            {:else if store.view === "calendar"}
              Calendar
            {:else if store.view === "backlog"}
              Backlog inbox
            {:else}
              {store.view}
            {/if}
          </h1>
          <p class="tiny muted-3 truncate">
            {stats.open} open · {stats.backlog} unscheduled · {stats.subtasks - stats.completedSubtasks}
            subtasks left
          </p>
        </div>

        <div class="chip-row">
          {#if stats.overdue}
            <NeuBadge tone="overdue" size="sm">
              <Icon name="alert-circle" size={11} strokeWidth={2.8} /> {stats.overdue} overdue
            </NeuBadge>
          {/if}
          {#if stats.dueToday}
            <NeuBadge tone="accent" size="sm">{stats.dueToday} due today</NeuBadge>
          {/if}
          {#if store.filterActive()}
            <NeuBadge tone="medium" size="sm">filtered</NeuBadge>
          {/if}
        </div>

        <div class="spacer"></div>

        <NeuButton size="sm" variant="flat" onclick={() => (store.paletteOpen = true)}>
          <Icon name="search" size={15} strokeWidth={2.6} /> Search
        </NeuButton>
        <NeuButton size="sm" variant="flat" onclick={doExport} title="Export workspace JSON">
          <Icon name="download" size={15} strokeWidth={2.6} />
        </NeuButton>
        <NeuButton size="sm" variant="flat" onclick={() => (settingsOpen = true)} title="Settings (,)">
          <Icon name="settings" size={15} strokeWidth={2.6} />
        </NeuButton>
        <NeuButton size="sm" tone="primary" onclick={() => (quickAddOpen = true)} title="Quick capture (N)">
          <Icon name="plus" size={15} strokeWidth={2.8} /> New task
        </NeuButton>
      </header>

      <FilterBar />

      <div class="view">
        {#if store.view === "board"}
          <BoardView onopen={(id) => store.openTask(id)} oncontextmenu={taskContextMenu} />
        {:else if store.view === "calendar"}
          <CalendarView onopen={(id) => store.openTask(id)} />
        {:else}
          <BacklogView onopen={(id) => store.openTask(id)} />
        {/if}
      </div>
    </main>
  </div>

  <TaskDetail />
  <CommandPalette
    onquickadd={() => (quickAddOpen = true)}
    onsettings={() => (settingsOpen = true)}
    onexport={doExport}
    onimport={doImport}
  />
  <QuickAdd bind:open={quickAddOpen} />
  <SettingsModal bind:open={settingsOpen} onexport={doExport} onimport={doImport} />

  {#if shortcutsOpen}
    <div
      class="scrim"
      role="presentation"
      onclick={() => (shortcutsOpen = false)}
    >
      <div class="help" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
        <h2>Keyboard shortcuts</h2>
        <ul>
          {#each SHORTCUTS as [keys, what] (keys)}
            <li><kbd>{keys}</kbd><span>{what}</span></li>
          {/each}
        </ul>
        <NeuButton onclick={() => (shortcutsOpen = false)}>Got it</NeuButton>
      </div>
    </div>
  {/if}
  <ContextMenu
    bind:open={contextMenu.open}
    x={contextMenu.x}
    y={contextMenu.y}
    items={contextMenu.items}
    onclose={hideContextMenu}
  />
</div>

<style>
  .app {
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .app.dragging {
    cursor: grabbing;
  }
  .app.dragging :global(.card) {
    pointer-events: none;
  }

  .body {
    flex: 1;
    min-height: 0;
    display: flex;
  }

  main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .top {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 11px 20px;
    flex-wrap: wrap;
    min-height: var(--header-h);
  }
  .titles {
    min-width: 0;
  }
  h1 {
    font-size: 22px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .swatch {
    width: 15px;
    height: 15px;
    border: var(--border-thin);
    border-radius: 4px;
    background: var(--c);
    flex: none;
  }
  .titles p {
    margin: 1px 0 0;
  }

  .view {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .scrim {
    position: fixed;
    inset: 0;
    z-index: 110;
    background: rgba(23, 23, 23, 0.42);
    display: grid;
    place-items: center;
    padding: 20px;
  }
  .help {
    width: 100%;
    max-width: 400px;
    background: var(--surface);
    border: var(--border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-pop);
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .help h2 {
    font-size: 18px;
  }
  .help ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .help li {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 700;
    font-size: 13px;
  }
  .help li span {
    color: var(--text-2);
  }
  kbd {
    border: var(--border-thin);
    border-radius: var(--radius-sm);
    padding: 2px 6px;
    background: var(--surface-2);
    font-family: inherit;
    font-size: 11px;
    font-weight: 900;
    box-shadow: var(--shadow-micro);
    min-width: 96px;
    text-align: center;
    flex: none;
  }

  .drag-ghost {
    position: fixed;
    top: 0;
    left: 0;
    pointer-events: none;
    z-index: 9999;
    transform: translate(-12px, -12px) rotate(1.5deg);
    opacity: 0.98;
    border: var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-pop);
    background: var(--surface);
    filter: drop-shadow(0 2px 4px rgba(23, 23, 23, 0.1));
  }
</style>
