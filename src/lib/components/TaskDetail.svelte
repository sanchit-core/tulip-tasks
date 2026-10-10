<script lang="ts">
  import { store } from "$lib/store.svelte";
  import { PRIORITIES, PRIORITY_LABEL, type Priority, type RecurrenceKind } from "$lib/types";
  import { RECURRENCE_KINDS, RECURRENCE_LABEL, describeRecurrence } from "$lib/recurrence";
  import { addDays, dueLabel, formatLongDate, isOverdue, todayISO } from "$lib/dates";
  import Modal from "./Modal.svelte";
  import Icon from "./Icon.svelte";
  import NeuBadge from "./NeuBadge.svelte";
  import NeuButton from "./NeuButton.svelte";
  import NeuInput from "./NeuInput.svelte";
  import ConfirmModal from "./ConfirmModal.svelte";
  import { toast } from "$lib/toasts";

  let task = $derived(store.task(store.activeTaskId));
  let open = $derived(!!task);
  let confirmDeleteOpen = $state(false);

  let subDraft = $state("");
  let tagDraft = $state("");
  let editingTitle = $state(false);
  let titleDraft = $state("");

  const PRIO_TONE: Record<Priority, "urgent" | "high" | "medium" | "low"> = {
    urgent: "urgent",
    high: "high",
    medium: "medium",
    low: "low",
  };

  let columns = $derived(store.columns(task?.boardId ?? null));
  let board = $derived(store.board(task?.boardId ?? null));
  let allTags = $derived(store.allTags());

  function set(patch: Parameters<typeof store.updateTask>[1]) {
    if (task) store.updateTask(task.id, patch);
  }

  function addSub() {
    if (!task) return;
    store.addSubtask(task.id, subDraft);
    subDraft = "";
  }

  function addTag() {
    if (!task) return;
    const clean = tagDraft.trim();
    if (!clean) return;
    store.addTag(task.id, clean);
    tagDraft = "";
    if (!store.filters.tags.includes(clean.toLowerCase())) {
      toast(`Tagged #${clean.toLowerCase()}`, "success", 1800);
    }
  }

  function saveTitle() {
    if (task && titleDraft.trim()) store.updateTask(task.id, { title: titleDraft.trim() });
    editingTitle = false;
  }

  function shiftDue(days: number) {
    if (!task) return;
    const base = task.due ?? todayISO();
    set({ due: addDays(base, days) });
  }

  function setRecurrence(kind: RecurrenceKind | "none") {
    if (!task) return;
    set({ recurrence: { kind, interval: task.recurrence.interval || 1 } });
  }

  function remove() {
    if (!task) return;
    confirmDeleteOpen = true;
  }

  function doRemove() {
    if (!task) return;
    store.deleteTask(task.id);
    store.closeTask();
    toast("Task deleted", "info");
    confirmDeleteOpen = false;
  }

  function duplicate() {
    if (!task) return;
    const copy = store.duplicateTask(task.id);
    if (copy) {
      store.openTask(copy.id);
      toast("Task duplicated", "success");
    }
  }

  let subDone = $derived(task?.subtasks.filter((s) => s.done).length ?? 0);
  let subTotal = $derived(task?.subtasks.length ?? 0);
</script>

<Modal bind:open title="" width={640} onclose={() => store.closeTask()}>
  {#if task}
    <div class="head">
      {#if editingTitle}
        <!-- svelte-ignore a11y_autofocus -->
        <input
          class="title-input"
          bind:value={titleDraft}
          autofocus
          onblur={saveTitle}
          onkeydown={(e) => {
            if (e.key === "Enter") saveTitle();
            if (e.key === "Escape") editingTitle = false;
          }}
        />
      {:else}
        <h2 class="truncate" class:done={!!task.completedAt}>{task.title}</h2>
      {/if}
      <NeuButton
        size="icon"
        variant="ghost"
        title="Rename"
        onclick={() => {
          titleDraft = task?.title ?? "";
          editingTitle = true;
        }}
      >
        <Icon name="edit" size={16} strokeWidth={2.4} />
      </NeuButton>
      <NeuButton size="icon" variant="ghost" title="Close" onclick={() => store.closeTask()}>
        <Icon name="x" size={17} strokeWidth={2.6} />
      </NeuButton>
    </div>

    <div class="meta">
      <NeuBadge tone="violet" size="sm">
        <Icon name="board" size={11} strokeWidth={2.6} /> {board?.title ?? "Unknown board"}
      </NeuBadge>
      <NeuBadge tone={PRIO_TONE[task.priority]} size="sm">{PRIORITY_LABEL[task.priority]}</NeuBadge>
      {#if task.columnId}
        <NeuBadge tone="default" size="sm">
          <Icon name="columns" size={11} strokeWidth={2.6} />
          {store.column(task.columnId)?.title ?? "—"}
        </NeuBadge>
      {:else}
        <NeuBadge tone="accent" size="sm">
          <Icon name="inbox" size={11} strokeWidth={2.6} /> Inbox
        </NeuBadge>
      {/if}
      {#if task.due}
        <NeuBadge
          tone={!task.completedAt && isOverdue(task.due) ? "overdue" : "default"}
          size="sm"
          title={formatLongDate(task.due)}
        >
          <Icon name="clock" size={11} strokeWidth={2.6} /> {dueLabel(task.due)}
        </NeuBadge>
      {/if}
      <NeuButton
        size="sm"
        variant={task.completedAt ? "flat" : "primary"}
        onclick={() => store.toggleComplete(task.id)}
      >
        <Icon name={task.completedAt ? "arrowDown" : "check"} size={15} strokeWidth={2.8} />
        {task.completedAt ? "Reopen" : "Complete"}
      </NeuButton>
    </div>

    <div class="grid">
      <section>
        <h4>Column</h4>
        <select
          value={task.columnId ?? ""}
          onchange={(e) => set({ columnId: e.currentTarget.value || null })}
        >
          <option value="">Inbox (unscheduled)</option>
          {#each columns as col (col.id)}
            <option value={col.id}>{col.title}</option>
          {/each}
        </select>
      </section>

      <section>
        <h4>Priority</h4>
        <div class="seg">
          {#each PRIORITIES as p (p)}
            <button
              type="button"
              class:on={task.priority === p}
              style:--c="var(--{p}-soft)"
              onclick={() => set({ priority: p })}
            >
              {PRIORITY_LABEL[p]}
            </button>
          {/each}
        </div>
      </section>

      <section>
        <h4>Due date</h4>
        <div class="row wrap">
          <input
            type="date"
            value={task.due ?? ""}
            onchange={(e) => set({ due: e.currentTarget.value || null })}
          />
          <NeuButton size="sm" variant="flat" onclick={() => shiftDue(1)}>+1d</NeuButton>
          <NeuButton size="sm" variant="flat" onclick={() => shiftDue(7)}>+1w</NeuButton>
          <NeuButton size="sm" variant="flat" onclick={() => set({ due: todayISO() })}>Today</NeuButton>
          {#if task.due}
            <NeuButton size="sm" variant="ghost" onclick={() => set({ due: null })}>Clear</NeuButton>
          {/if}
        </div>
      </section>

      <section>
        <h4>Repeats</h4>
        <div class="row wrap">
          <select
            value={task.recurrence.kind}
            onchange={(e) => setRecurrence(e.currentTarget.value as RecurrenceKind | "none")}
          >
            <option value="none">Never</option>
            {#each RECURRENCE_KINDS as k (k)}
              <option value={k}>{RECURRENCE_LABEL[k]}</option>
            {/each}
          </select>
          {#if task.recurrence.kind !== "none"}
            <label class="row">
              <span class="tiny muted">every</span>
              <input
                class="int"
                type="number"
                min="1"
                max="99"
                value={task.recurrence.interval}
                onchange={(e) => {
                  const n = Number(e.currentTarget.value);
                  set({
                    recurrence: { kind: task?.recurrence.kind ?? "none", interval: Math.max(1, n || 1) },
                  });
                }}
              />
              <span class="tiny muted">
                {task.recurrence.kind === "daily"
                  ? "day(s)"
                  : task.recurrence.kind === "weekly"
                    ? "week(s)"
                    : task.recurrence.kind === "monthly"
                      ? "month(s)"
                      : "year(s)"}
              </span>
            </label>
          {/if}
        </div>
        {#if task.recurrence.kind !== "none"}
          <p class="tiny muted recur-note">
            <Icon name="repeat" size={12} strokeWidth={2.6} />
            {describeRecurrence(task.recurrence)} — completing this spawns the next one
            {#if task.due}on the following due date{/if}.
          </p>
        {/if}
      </section>
    </div>

    <section class="block">
      <h4>Tags</h4>
      <div class="chip-row">
        {#each task.tags as tag (tag)}
          <span class="tagx">
            #{tag}
            <button
              type="button"
              aria-label="Remove tag {tag}"
              onclick={() => store.removeTag(task?.id ?? "", tag)}
            >
              <Icon name="x" size={11} strokeWidth={3} />
            </button>
          </span>
        {/each}
      </div>
      <div class="row">
        <NeuInput placeholder="Add a tag…" bind:value={tagDraft} onenter={addTag} />
        <NeuButton onclick={addTag}><Icon name="plus" size={15} strokeWidth={2.8} /></NeuButton>
      </div>
      {#if allTags.length}
        <p class="tiny muted suggest">
          Existing: {#each allTags.slice(0, 12) as t (t)}
            <button type="button" class="linkish" onclick={() => store.addTag(task?.id ?? "", t)}>#{t}</button>
          {/each}
        </p>
      {/if}
    </section>

    <section class="block">
      <h4>
        Subtasks
        {#if subTotal}<span class="muted-3 small">({subDone}/{subTotal})</span>{/if}
      </h4>
      {#if subTotal}
        <div class="bar">
          <div class="fill" style:width="{Math.round((subDone / subTotal) * 100)}%"></div>
        </div>
      {/if}
      <ul>
        {#each task.subtasks as sub (sub.id)}
          <li>
            <input
              type="checkbox"
              checked={sub.done}
              onchange={() => store.toggleSubtask(task?.id ?? "", sub.id)}
            />
            <span class="truncate grow" class:strike={sub.done}>{sub.title}</span>
            <NeuButton
              size="icon"
              variant="ghost"
              title="Move up"
              disabled={task.subtasks[0].id === sub.id}
              onclick={() => store.moveSubtask(task?.id ?? "", sub.id, -1)}
            >
              <Icon name="arrowUp" size={13} strokeWidth={2.8} />
            </NeuButton>
            <NeuButton
              size="icon"
              variant="ghost"
              title="Move down"
              disabled={task.subtasks[task.subtasks.length - 1].id === sub.id}
              onclick={() => store.moveSubtask(task?.id ?? "", sub.id, 1)}
            >
              <Icon name="arrowDown" size={13} strokeWidth={2.8} />
            </NeuButton>
            <NeuButton
              size="icon"
              variant="ghost"
              title="Remove"
              onclick={() => store.removeSubtask(task?.id ?? "", sub.id)}
            >
              <Icon name="trash" size={14} strokeWidth={2.4} />
            </NeuButton>
          </li>
        {/each}
      </ul>
      <div class="row">
        <NeuInput
          placeholder="Add a subtask…"
          bind:value={subDraft}
          onenter={addSub}
        />
        <NeuButton onclick={addSub}><Icon name="plus" size={15} strokeWidth={2.8} /></NeuButton>
      </div>
    </section>

    <section class="block">
      <h4>Notes</h4>
      <textarea
        rows="5"
        placeholder="Details, links, context…"
        value={task.notes}
        onchange={(e) => set({ notes: e.currentTarget.value })}
      ></textarea>
    </section>

    <footer class="actions">
      <NeuButton variant="flat" onclick={duplicate}>
        <Icon name="copy" size={15} strokeWidth={2.4} /> Duplicate
      </NeuButton>
      <div class="spacer"></div>
      <NeuButton variant="danger" onclick={remove}>
        <Icon name="trash" size={15} strokeWidth={2.4} /> Delete
      </NeuButton>
    </footer>
  {/if}
</Modal>

<ConfirmModal
  bind:open={confirmDeleteOpen}
  title="Delete task"
  message={task ? `Delete “${task.title}”? This cannot be undone.` : ""}
  onconfirm={doRemove}
  oncancel={() => (confirmDeleteOpen = false)}
/>

<style>
  .head {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  h2 {
    font-size: 21px;
    flex: 1;
    min-width: 0;
  }
  h2.done {
    text-decoration: line-through;
    color: var(--text-3);
  }
  .title-input {
    flex: 1;
    min-width: 0;
    border: 3px solid var(--primary);
    border-radius: var(--radius-sm);
    padding: 4px 7px;
    font-weight: 900;
    font-size: 20px;
    outline: none;
  }

  .meta {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    align-items: center;
    margin-top: 10px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 14px;
    margin-top: 18px;
  }
  h4 {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-2);
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  select,
  input[type="date"],
  textarea {
    width: 100%;
    border: var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
    box-shadow: var(--shadow-inset-tight);
    padding: 8px 10px;
    font-weight: 700;
    outline: none;
  }
  select:focus,
  input[type="date"]:focus,
  textarea:focus {
    border-color: var(--primary);
  }
  textarea {
    resize: vertical;
    font-weight: 500;
    line-height: 1.5;
  }
  .int {
    width: 62px;
  }

  .seg {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
  }
  .seg button {
    border: var(--border-thin);
    border-radius: 999px;
    background: var(--surface-2);
    padding: 4px 11px;
    font-size: 12px;
    font-weight: 800;
    box-shadow: var(--shadow-hair);
  }
  .seg button.on {
    background: var(--c);
    transform: translate(var(--press-shift-sm));
    box-shadow: none;
  }

  .recur-note {
    margin: 7px 0 0;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .block {
    margin-top: 18px;
  }

  .tagx {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    border: var(--border-thin);
    border-radius: 999px;
    background: var(--primary-soft);
    padding: 2px 5px 2px 9px;
    font-size: 12px;
    font-weight: 800;
  }
  .tagx button {
    border: none;
    background: transparent;
    padding: 0;
    display: flex;
    color: var(--text-2);
  }
  .tagx button:hover {
    color: var(--danger);
  }
  .suggest {
    margin: 7px 0 0;
  }
  .linkish {
    border: none;
    background: transparent;
    padding: 0 4px;
    font-weight: 800;
    color: var(--primary-ink);
    font-size: 12px;
  }

  .bar {
    height: 9px;
    border: var(--border-thin);
    border-radius: 999px;
    background: var(--surface-2);
    overflow: hidden;
    margin-bottom: 9px;
  }
  .fill {
    height: 100%;
    background: var(--low);
  }

  ul {
    list-style: none;
    margin: 0 0 9px;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  li {
    display: flex;
    align-items: center;
    gap: 7px;
    border: var(--border-thin);
    border-radius: var(--radius-md);
    background: var(--surface-2);
    padding: 4px 7px;
  }
  li input[type="checkbox"] {
    width: 17px;
    height: 17px;
    accent-color: var(--primary);
    flex: none;
  }
  .grow {
    flex: 1;
    min-width: 0;
    font-weight: 600;
  }
  .strike {
    text-decoration: line-through;
    color: var(--text-3);
  }

  .actions {
    display: flex;
    gap: 8px;
    margin-top: 20px;
  }
</style>
