<script lang="ts">
  import { store } from "$lib/store.svelte";
  import { dnd } from "$lib/dnd.svelte";
  import { dueLabel, isOverdue, isToday } from "$lib/dates";
  import { recurrenceBadge } from "$lib/recurrence";
  import type { Priority, Task } from "$lib/types";
  import Icon from "./Icon.svelte";
  import NeuBadge from "./NeuBadge.svelte";
  import NeuButton from "./NeuButton.svelte";
  import NeuCard from "./NeuCard.svelte";
  import NeuInput from "./NeuInput.svelte";
  import EmptyState from "./EmptyState.svelte";
  import ConfirmModal from "./ConfirmModal.svelte";
  import { toast } from "$lib/toasts";

  let { onopen }: { onopen: (id: string) => void } = $props();

  let draft = $state("");
  let priority = $state<Priority>("medium");
  let due = $state("");
  let tagInput = $state("");

  const PRIO_TONE: Record<Priority, "urgent" | "high" | "medium" | "low"> = {
    urgent: "urgent",
    high: "high",
    medium: "medium",
    low: "low",
  };

  let tasks = $derived(store.backlogTasks());
  let cols = $derived(store.columns());

  function add() {
    const title = draft.trim();
    if (!title) return;
    const tags = tagInput
      .split(/[,\s]+/)
      .map((t) => t.replace(/^#/, "").toLowerCase())
      .filter(Boolean);
    store.addTask({ title, columnId: null, priority, due: due || null, tags });
    draft = "";
    tagInput = "";
    due = "";
    priority = "medium";
  }

  /** Quick triage: pull a task out of the inbox and drop it at the end of a column. */
  function triage(task: Task, columnId: string) {
    store.moveTask(task.id, columnId, store.rawColumnTasks(columnId).length);
    toast(`Moved to “${store.column(columnId)?.title}”`, "success", 1800);
  }

  function requestRemove(id: string, title: string) {
    pendingDiscard = { id, title };
  }

  function confirmRemove() {
    if (!pendingDiscard) return;
    store.deleteTask(pendingDiscard.id);
    toast("Task discarded", "info");
    pendingDiscard = null;
  }

  let pendingDiscard: { id: string; title: string } | null = $state(null);

  let overdueCount = $derived(tasks.filter((t) => t.due && isOverdue(t.due) && !t.completedAt).length);
</script>

<div class="wrap">
  <div class="cols">
    <section class="capture">
      <h2>Capture</h2>
      <p class="tiny muted">Dump anything here without deciding where it belongs. Triage it later.</p>

      <NeuCard tone="surface-2" pad="md">
        <div class="col">
          <NeuInput
            label="Task"
            placeholder="What needs doing?"
            bind:value={draft}
            onenter={add}
            autofocus
          />
          <div class="row wrap">
            <label class="inline">
              <span class="tiny muted">Priority</span>
              <select bind:value={priority}>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
            <label class="inline">
              <span class="tiny muted">Due</span>
              <input type="date" bind:value={due} />
            </label>
          </div>
          <NeuInput
            label="Tags"
            placeholder="comma separated, e.g. home, urgent"
            bind:value={tagInput}
            onenter={add}
          />
          <NeuButton tone="primary" size="lg" full onclick={add}>
            <Icon name="plus" size={17} strokeWidth={2.8} /> Add to inbox
          </NeuButton>
        </div>
      </NeuCard>

      <NeuCard tone="accent-soft" pad="sm">
        <div class="row small tip">
          <Icon name="zap" size={16} strokeWidth={2.4} />
          <span>
            <strong>Tip:</strong> press <kbd>N</kbd> anywhere to capture instantly.
          </span>
        </div>
      </NeuCard>
    </section>

    <section class="list-col">
      <div class="head">
        <h2>Inbox</h2>
        <NeuBadge tone={overdueCount ? "overdue" : "default"} size="sm">
          {tasks.length} item{tasks.length === 1 ? "" : "s"}
        </NeuBadge>
        {#if overdueCount}
          <NeuBadge tone="overdue" size="sm">{overdueCount} overdue</NeuBadge>
        {/if}
      </div>

      {#if tasks.length === 0}
        <EmptyState
          icon="inbox"
          title={store.filterActive() ? "Nothing matches your filters" : "Inbox zero"}
          hint={store.filterActive()
            ? "Try clearing the search or filters."
            : "Capture tasks on the left, then triage them onto the board."}
        />
      {:else}
        <div class="rows" class:over={dnd.isOver(null)} data-drop-zone data-drop-column={null}>
          {#each tasks as task (task.id)}
            <NeuCard pad="md" tone="default">
                <div
                  class="item"
                  class:dragging={dnd.isDragging(task.id)}
                  data-card
                  role="button"
                  tabindex="0"
                  onpointerdown={(e) => {
                    const t = e.target as HTMLElement;
                    if (t.closest("button") || t.closest("input") || t.closest("select") || t.closest("label")) return;
                    dnd.start(task, e);
                  }}
                  onkeydown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onopen(task.id);
                    }
                  }}
                >
                  <button
                    class="tick"
                    type="button"
                    title="Mark done"
                    onclick={(e) => {
                      e.stopPropagation();
                      store.toggleComplete(task.id);
                    }}
                  >
                    <Icon
                      name={task.completedAt ? "check-circle" : "circle"}
                      size={19}
                      strokeWidth={2.3}
                    />
                  </button>

                  <div class="body">
                    <button class="title" type="button" onclick={(e) => {
                      e.stopPropagation();
                      onopen(task.id);
                    }}>
                      {task.title}
                    </button>
                    {#if task.tags.length}
                      <div class="chip-row">
                        {#each task.tags as tag (tag)}
                          <NeuBadge tone="default" size="sm">#{tag}</NeuBadge>
                        {/each}
                      </div>
                    {/if}
                    {#if task.notes}
                      <p class="tiny notes">{task.notes}</p>
                    {/if}
                    <div class="chip-row">
                      <NeuBadge tone={PRIO_TONE[task.priority]} size="sm">{task.priority}</NeuBadge>
                      {#if task.due}
                        <NeuBadge
                          tone={isOverdue(task.due) && !task.completedAt ? "overdue" : isToday(task.due) ? "accent" : "default"}
                          size="sm"
                        >
                          <Icon name="clock" size={11} strokeWidth={2.6} /> {dueLabel(task.due)}
                        </NeuBadge>
                      {/if}
                      {#if recurrenceBadge(task.recurrence)}
                        <NeuBadge tone="medium" size="sm">{recurrenceBadge(task.recurrence)}</NeuBadge>
                      {/if}
                      {#if task.subtasks.length}
                        <NeuBadge tone="default" size="sm">
                          {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length}
                        </NeuBadge>
                      {/if}
                    </div>
                  </div>

                  <div class="triage">
                    <span class="tiny muted">Triage →</span>
                    {#each cols as col (col.id)}
                      <button
                        class="tbtn"
                        type="button"
                        title="Move to {col.title}"
                        onclick={(e) => {
                          e.stopPropagation();
                          triage(task, col.id);
                        }}
                      >
                        {col.title}
                      </button>
                    {/each}
                    <NeuButton
                      size="sm"
                      variant="ghost"
                      title="Discard"
                      onclick={(e) => {
                        e.stopPropagation();
                        requestRemove(task.id, task.title);
                      }}
                    >
                      <Icon name="trash" size={15} strokeWidth={2.3} />
                    </NeuButton>
                  </div>
                </div>
            </NeuCard>
          {/each}
        </div>

        <p class="tiny muted-3 hint">
          Drag an item onto the board, or use the column buttons. Tasks with no column live here.
        </p>
      {/if}
    </section>
  </div>
</div>

<ConfirmModal
  open={pendingDiscard !== null}
  title="Discard task"
  message={pendingDiscard ? `Discard “${pendingDiscard.title}” from the inbox?` : ""}
  confirmLabel="Discard"
  onconfirm={confirmRemove}
  oncancel={() => (pendingDiscard = null)}
/>

<style>
  .wrap {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 18px 20px 26px;
  }
  .cols {
    display: grid;
    grid-template-columns: 320px minmax(0, 1fr);
    gap: 18px;
    align-items: start;
    max-width: 1240px;
  }
  @media (max-width: 900px) {
    .cols {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  h2 {
    font-size: 20px;
  }
  .capture {
    display: flex;
    flex-direction: column;
    gap: 10px;
    position: sticky;
    top: 0;
  }
  .capture p {
    margin: 4px 0 0;
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 0;
  }

  .inline {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    min-width: 130px;
  }
  .inline select,
  .inline input {
    border: var(--border-thin);
    border-radius: var(--radius-sm);
    padding: 5px 7px;
    background: var(--surface);
    outline: none;
    font-weight: 700;
  }

  kbd {
    border: var(--border-thin);
    border-radius: var(--radius-sm);
    padding: 0 5px;
    background: var(--surface);
    font-family: inherit;
    font-size: 11px;
    font-weight: 900;
    box-shadow: var(--shadow-micro);
  }

  .list-col {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .rows {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 60px;
    border-radius: var(--radius-lg);
  }
  .rows.over {
    background: var(--accent-soft);
  }

  .item {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    cursor: grab;
    touch-action: none;
  }
  .item.dragging {
    opacity: 0.92;
    transform: rotate(1deg) translate(0, -1px);
    box-shadow: var(--shadow-pop);
  }
  .tick {
    border: none;
    background: transparent;
    padding: 0;
    color: var(--text-3);
    display: flex;
    flex: none;
    margin-top: 1px;
  }
  .tick:hover {
    color: var(--low);
  }
  .body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .title {
    border: none;
    background: transparent;
    padding: 0;
    font-weight: 800;
    font-size: 15px;
    text-align: left;
    line-height: 1.35;
  }
  .title:hover {
    color: var(--primary);
  }
  .notes {
    margin: 0;
    color: var(--text-2);
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .triage {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-wrap: wrap;
    justify-content: flex-end;
    max-width: 260px;
    flex: none;
  }
  .tbtn {
    border: var(--border-thin);
    border-radius: 999px;
    background: var(--surface-2);
    font-size: 11px;
    font-weight: 800;
    padding: 2px 9px;
    box-shadow: var(--shadow-hair);
    transition: transform var(--t);
  }
  .tbtn:hover {
    background: var(--accent);
    transform: translate(-1px, -1px);
  }
  .tbtn:active {
    transform: translate(var(--press-shift-sm));
    box-shadow: none;
  }

  .hint {
    margin: 0;
  }
  .tip {
    align-items: center;
    gap: 6px;
  }
</style>
