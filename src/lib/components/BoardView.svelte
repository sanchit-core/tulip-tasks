<script lang="ts">
  import { store } from "$lib/store.svelte";
  import { dnd } from "$lib/dnd.svelte";
  import type { Column, Task } from "$lib/types";
  import TaskCard from "./TaskCard.svelte";
  import Icon from "./Icon.svelte";
  import NeuButton from "./NeuButton.svelte";
  import EmptyState from "./EmptyState.svelte";
  import { toast } from "$lib/toasts";

  let { onopen }: { onopen: (id: string) => void } = $props();

  let editingId = $state<string | null>(null);
  let editTitle = $state("");
  let wipFor = $state<string | null>(null);
  let wipValue = $state("");

  let columns = $derived(store.columns());
  let active = $derived(store.activeBoardId);

  function startRename(col: Column) {
    editingId = col.id;
    editTitle = col.title;
  }

  function commitRename() {
    if (editingId) store.renameColumn(editingId, editTitle);
    editingId = null;
  }

  function addColumn() {
    if (!active) return;
    const name = prompt("Column name", "New column");
    if (name === null) return;
    store.addColumn(active, name);
  }

  function quickAdd(col: Column) {
    const title = prompt(`Add a task to “${col.title}”`, "");
    if (title === null || !title.trim()) return;
    store.addTask({ title, columnId: col.id });
  }

  function saveWip(col: Column) {
    const n = Number(wipValue);
    store.setWipLimit(col.id, Number.isFinite(n) && n > 0 ? n : null);
    wipFor = null;
  }

  function removeColumn(col: Column) {
    const n = store.rawColumnTasks(col.id).length;
    const msg = n
      ? `Delete “${col.title}” and send its ${n} task${n === 1 ? "" : "s"} back to the inbox?`
      : `Delete “${col.title}”?`;
    if (!confirm(msg)) return;
    store.deleteColumn(col.id);
    toast("Column deleted", "info");
  }

  function wipOver(col: Column, count: number): boolean {
    return store.workspace.settings.wipWarnings && col.wipLimit !== null && count > col.wipLimit;
  }
</script>

<div class="board-scroll">
  <div class="board" class:inbox={dnd.isOver(null)} data-drop-zone>
    {#each columns as col (col.id)}
      {@const list = store.columnTasks(col.id)}
      {@const openCount = store.rawColumnTasks(col.id).filter((t) => !t.completedAt).length}
      <section class="col" class:over={dnd.isOver(col.id)} class:done={col.done}>
        <header>
          <span class="dot" style:--c={col.done ? "var(--low)" : "var(--ink)"}></span>

          {#if editingId === col.id}
            <!-- svelte-ignore a11y_autofocus -->
            <input
              class="rename"
              bind:value={editTitle}
              autofocus
              onblur={commitRename}
              onkeydown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") editingId = null;
              }}
            />
          {:else}
            <h2 class="truncate" title="Double-click to rename">
              <button
                class="name-btn"
                type="button"
                ondblclick={() => startRename(col)}
                onclick={() => startRename(col)}
              >
                {col.title}
              </button>
            </h2>
          {/if}

          {#if col.wipLimit !== null}
            <button
              class="wip"
              class:over={wipOver(col, openCount)}
              type="button"
              title="Work-in-progress limit"
              onclick={() => {
                wipFor = wipFor === col.id ? null : col.id;
                wipValue = String(col.wipLimit ?? "");
              }}
            >
              {openCount}/{col.wipLimit}
            </button>
          {/if}

          <NeuButton
            size="icon"
            variant="ghost"
            title="Add task to this column"
            onclick={() => quickAdd(col)}
          >
            <Icon name="plus" size={16} strokeWidth={2.6} />
          </NeuButton>
        </header>

        {#if wipFor === col.id}
          <div class="wip-edit">
            <input
              type="number"
              min="1"
              placeholder="no limit"
              bind:value={wipValue}
              onkeydown={(e) => {
                if (e.key === "Enter") saveWip(col);
              }}
            />
            <NeuButton size="sm" onclick={() => saveWip(col)}>Save</NeuButton>
            <NeuButton size="sm" variant="ghost" onclick={() => (wipFor = null)}>Cancel</NeuButton>
          </div>
        {/if}

        <div class="list" data-drop-zone data-drop-column={col.id}>
          {#if list.length === 0}
            <div class="blank">
              {#if store.filterActive()}
                <span class="tiny muted-3">No matches</span>
              {:else}
                <span class="tiny muted-3">Drop tasks here</span>
              {/if}
            </div>
          {/if}

          {#each list as task, i (task.id)}
            {@const isDrag = dnd.isDragging(task.id)}
            <div
              class="slot"
              class:live={dnd.state?.overColumnId === col.id && dnd.state?.overIndex === i && !isDrag}
            ></div>
            <TaskCard
              {task}
              dragging={isDrag}
              onopen={onopen}
              oncomplete={(id) => store.toggleComplete(id)}
              ondragstart={(e) => dnd.start(task, e)}
            />
          {/each}

          <div
            class="slot end"
            class:live={dnd.state?.overColumnId === col.id &&
              (dnd.state?.overIndex ?? 0) >= list.length}
          ></div>
        </div>

        <footer>
          <NeuButton size="sm" variant="flat" full onclick={() => quickAdd(col)}>
            <Icon name="plus" size={14} strokeWidth={2.6} /> Add task
          </NeuButton>
        </footer>
      </section>
    {/each}

    <div class="add-col">
      <NeuButton variant="flat" onclick={addColumn}>
        <Icon name="plus" size={16} strokeWidth={2.6} /> Add column
      </NeuButton>
    </div>
  </div>
</div>

{#if columns.length === 0}
  <EmptyState icon="columns" title="This board has no columns">
    <NeuButton onclick={addColumn}>Add your first column</NeuButton>
  </EmptyState>
{/if}

<style>
  .board-scroll {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 18px 20px 24px;
  }
  .board {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    min-height: 100%;
    min-width: min-content;
    border-radius: var(--radius-lg);
  }
  /* Releasing a card over empty board space sends it back to the inbox. */
  .board.inbox {
    outline: 3px dashed var(--primary);
    outline-offset: 6px;
  }

  .col {
    width: 292px;
    flex: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
    border: var(--border);
    border-radius: var(--radius-lg);
    background: var(--surface-2);
    padding: 10px;
    max-height: 100%;
  }
  .col.over {
    background: var(--accent-soft);
  }
  .col.done header h2 {
    color: var(--low);
  }

  header {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 32px;
  }
  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    border: 2px solid var(--ink);
    background: var(--c);
    flex: none;
  }
  h2 {
    font-size: 14px;
    flex: 1;
    min-width: 0;
  }
  .name-btn {
    border: none;
    background: transparent;
    padding: 0;
    font-weight: 900;
    font-size: 14px;
    letter-spacing: -0.02em;
    color: var(--text-1);
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
    text-align: left;
  }
  .name-btn:hover {
    color: var(--primary);
  }
  .rename {
    flex: 1;
    min-width: 0;
    border: 2px solid var(--primary);
    border-radius: var(--radius-sm);
    padding: 2px 5px;
    font-weight: 900;
    outline: none;
    background: var(--surface);
  }
  .wip {
    border: 2px solid var(--ink);
    border-radius: 999px;
    background: var(--surface);
    font-size: 11px;
    font-weight: 900;
    padding: 1px 7px;
    font-variant-numeric: tabular-nums;
  }
  .wip.over {
    background: var(--danger);
    color: var(--text-on-primary);
  }

  .wip-edit {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .wip-edit input {
    width: 74px;
    border: 2px solid var(--ink);
    border-radius: var(--radius-sm);
    padding: 3px 6px;
    outline: none;
    background: var(--surface);
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 0;
    overflow-y: auto;
    min-height: 46px;
    flex: 1;
    padding-bottom: 2px;
  }

  .slot {
    height: 4px;
    border-radius: 999px;
    transition:
      height var(--t),
      background-color var(--t);
  }
  .slot.live {
    height: 14px;
    background: var(--primary);
    border: 2px solid var(--ink);
  }

  .blank {
    border: 2px dashed var(--text-3);
    border-radius: var(--radius-md);
    padding: 14px 8px;
    text-align: center;
  }

  footer {
    padding-top: 2px;
  }

  .add-col {
    flex: none;
    padding-top: 2px;
  }
</style>
