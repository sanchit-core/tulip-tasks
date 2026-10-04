<script lang="ts">
  import { store, PRIORITY_RANK } from "$lib/store.svelte";
  import { dnd } from "$lib/dnd.svelte";
  import {
    MONTHS,
    WEEKDAYS_MIN,
    addMonthsDate,
    monthGrid,
    sameMonth,
    toISO,
    todayISO,
    weekGrid,
  } from "$lib/dates";
  import Icon from "./Icon.svelte";
  import NeuBadge from "./NeuBadge.svelte";
  import NeuButton from "./NeuButton.svelte";
  import TaskCard from "./TaskCard.svelte";
  import type { Priority } from "$lib/types";

  let { onopen }: { onopen: (id: string) => void } = $props();

  let anchor = $derived(store.calendarAnchor);
  let mode = $derived(store.calendarMode);

  let cells = $derived(mode === "month" ? monthGrid(anchor) : weekGrid(anchor));
  let today = todayISO();

  let title = $derived(
    mode === "month"
      ? `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`
      : (() => {
          const w = weekGrid(anchor);
          const a = w[0];
          const b = w[6];
          const sameYear = a.getFullYear() === b.getFullYear();
          const left = `${a.getDate()} ${MONTHS[a.getMonth()].slice(0, 3)}${sameYear ? "" : ` ${a.getFullYear()}`}`;
          const right = `${b.getDate()} ${MONTHS[b.getMonth()].slice(0, 3)} ${b.getFullYear()}`;
          return `${left} – ${right}`;
        })(),
  );

  function shift(dir: number) {
    store.calendarAnchor =
      mode === "month"
        ? addMonthsDate(anchor, dir)
        : new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + dir * 7);
  }

  function goToday() {
    store.calendarAnchor = new Date();
  }

  function tasksFor(iso: string) {
    return store
      .dueOn(iso)
      .slice()
      .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.title.localeCompare(b.title));
  }

  let unscheduled = $derived(
    store.visibleTasks().filter((t) => t.due === null && !t.completedAt).slice(0, 40),
  );

  const PRIO_TONE: Record<Priority, "urgent" | "high" | "medium" | "low"> = {
    urgent: "urgent",
    high: "high",
    medium: "medium",
    low: "low",
  };

  let picked = $state<string | null>(null);
  let newTitle = $state("");

  function scheduleOn(iso: string) {
    const title = newTitle.trim();
    if (!title) return;
    const t = store.addTask({ title, due: iso, columnId: firstOpenColumn() });
    newTitle = "";
    if (t) onopen(t.id);
  }

  function firstOpenColumn(): string | null {
    const cols = store.columns();
    const todo = cols.find((c) => !c.done);
    return (todo ?? cols[0])?.id ?? null;
  }

  function unschedule(id: string) {
    store.updateTask(id, { due: null });
  }
</script>

<div class="cal">
  <div class="toolbar">
    <div class="row">
      <NeuButton size="sm" variant="flat" onclick={() => shift(-1)} title="Previous">
        <Icon name="chevron-left" size={16} strokeWidth={2.6} />
      </NeuButton>
      <NeuButton size="sm" variant="flat" onclick={() => shift(1)} title="Next">
        <Icon name="chevron-right" size={16} strokeWidth={2.6} />
      </NeuButton>
      <NeuButton size="sm" variant="flat" onclick={goToday}>Today</NeuButton>
      <h2>{title}</h2>
    </div>

    <div class="spacer"></div>

    <div class="switch">
      <button
        type="button"
        class:on={mode === "month"}
        onclick={() => (store.calendarMode = "month")}>Month</button
      >
      <button
        type="button"
        class:on={mode === "week"}
        onclick={() => (store.calendarMode = "week")}>Week</button
      >
    </div>
  </div>

  <div class="grid" class:week={mode === "week"}>
    {#each WEEKDAYS_MIN as d, i (i)}
      <div class="dow">{d}</div>
    {/each}

    {#each cells as cell (cell.getTime())}
      {@const iso = toISO(cell)}
      {@const list = tasksFor(iso)}
      {@const dim = mode === "month" && !sameMonth(cell, anchor)}
      <div
        class="day"
        class:dim
        class:today={iso === today}
        class:over={dnd.isOverDate(iso)}
        data-drop-zone
        data-drop-date={iso}
      >
        <div class="day-head">
          <span class="num mono">{cell.getDate()}</span>
          {#if list.length}
            <span class="count">{list.length}</span>
          {/if}
        </div>

        <div class="pills">
          {#each list.slice(0, mode === "week" ? 20 : 4) as task (task.id)}
            <button
              class="pill {PRIO_TONE[task.priority]}"
              class:done={!!task.completedAt}
              type="button"
              title={task.title}
              onclick={() => onopen(task.id)}
              onpointerdown={(e) => {
                e.stopPropagation();
                dnd.start(task, e);
              }}
            >
              <Icon name="check-circle" size={11} strokeWidth={2.6} />
              <span class="truncate">{task.title}</span>
            </button>
          {/each}
          {#if list.length > (mode === "week" ? 20 : 4)}
            <button
              class="more"
              type="button"
              onclick={() => {
                picked = picked === iso ? null : iso;
              }}
            >
              +{list.length - (mode === "week" ? 20 : 4)} more
            </button>
          {/if}
        </div>

        {#if picked === iso}
          <div class="more-box">
            {#each list.slice(mode === "week" ? 20 : 4) as task (task.id)}
              <TaskCard {task} compact onopen={onopen} oncomplete={(id) => store.toggleComplete(id)} ondragstart={() => {}} />
            {/each}
            <input
              placeholder="Add a task on this day…"
              bind:value={newTitle}
              onkeydown={(e) => {
                if (e.key === "Enter") scheduleOn(iso);
              }}
            />
          </div>
        {/if}
      </div>
    {/each}
  </div>

  {#if unscheduled.length}
    <section class="unscheduled">
      <h3>
        <Icon name="inbox" size={16} strokeWidth={2.4} />
        Unscheduled on {store.activeBoard()?.title ?? "this board"}
        <span class="muted-3 small">({unscheduled.length})</span>
      </h3>
      <p class="tiny muted">Drag a card onto a day to schedule it, or use the button.</p>
      <div class="rows">
        {#each unscheduled as task (task.id)}
          <div class="urow" class:dragging={dnd.isDragging(task.id)} data-card>
            <button
              class="grip"
              type="button"
              title="Drag onto a day to schedule"
              aria-label="Drag {task.title} onto a calendar day"
              onpointerdown={(e) => dnd.start(task, e)}
            >
              <Icon name="grip" size={16} strokeWidth={2.8} />
            </button>
            <button
              class="dot-btn"
              type="button"
              title="Mark done"
              onclick={() => store.toggleComplete(task.id)}
            >
              <Icon name="circle" size={17} strokeWidth={2.3} />
            </button>
            <button class="grow utitle truncate" type="button" onclick={() => onopen(task.id)}>
              {task.title}
            </button>
            <NeuBadge tone={PRIO_TONE[task.priority]} size="sm">{task.priority}</NeuBadge>
            <label class="date">
              <span class="tiny muted">Due</span>
              <input
                type="date"
                value={task.due ?? ""}
                onchange={(e) => {
                  const v = e.currentTarget.value;
                  store.updateTask(task.id, { due: v || null });
                }}
              />
            </label>
            <NeuButton size="sm" variant="ghost" title="Clear due date" onclick={() => unschedule(task.id)}>
              <Icon name="x" size={14} strokeWidth={2.6} />
            </NeuButton>
          </div>
        {/each}
      </div>
    </section>
  {/if}
</div>

<style>
  .cal {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 16px 20px 24px;
    gap: 12px;
    overflow: auto;
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    flex-shrink: 0;
  }
  h2 {
    font-size: 20px;
    margin-left: 6px;
  }

  .switch {
    display: flex;
    border: var(--border);
    border-radius: var(--radius-md);
    overflow: hidden;
    box-shadow: var(--shadow-flat);
    background: var(--surface);
  }
  .switch button {
    border: none;
    border-right: var(--border-thin);
    background: var(--surface);
    padding: 6px 14px;
    font-weight: 800;
  }
  .switch button:last-child {
    border-right: none;
  }
  .switch button.on {
    background: var(--primary);
    color: var(--text-1);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 8px;
    /* .cal is a scrolling column flexbox: without this the grid is squeezed
       below its row height and the day cells spill onto .unscheduled. */
    flex-shrink: 0;
  }
  .dow {
    text-align: center;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-2);
    padding-bottom: 2px;
  }
  .day {
    border: var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
    box-shadow: var(--shadow-flat);
    padding: 6px;
    min-height: 116px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .grid.week .day {
    min-height: 320px;
  }
  .day.dim {
    background: var(--surface-2);
    color: var(--text-3);
  }
  .day.today {
    box-shadow: var(--shadow-raised);
    border-color: var(--primary);
  }
  .day.over {
    background: var(--accent-soft);
    border-color: var(--primary);
    box-shadow: var(--shadow-raised);
  }

  .day-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .num {
    font-weight: 900;
    font-size: 13px;
    width: 24px;
    height: 24px;
    display: grid;
    place-items: center;
    border-radius: 50%;
  }
  .day.today .num {
    background: var(--primary);
    color: var(--text-1);
  }
  .count {
    font-size: 11px;
    font-weight: 900;
    color: var(--text-3);
  }

  .pills {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-height: 0;
  }
  .pill {
    display: flex;
    align-items: center;
    gap: 4px;
    border: var(--border-thin);
    border-radius: var(--radius-sm);
    padding: 2px 5px;
    font-size: 11.5px;
    font-weight: 800;
    text-align: left;
    min-width: 0;
    touch-action: none;
  }
  .pill :global(.icon) {
    flex: none;
  }
  .pill.urgent {
    background: var(--urgent-soft);
  }
  .pill.high {
    background: var(--high-soft);
  }
  .pill.medium {
    background: var(--medium-soft);
  }
  .pill.low {
    background: var(--low-soft);
  }
  .pill.done {
    opacity: 0.55;
    text-decoration: line-through;
  }
  .more {
    border: none;
    background: transparent;
    font-size: 11px;
    font-weight: 900;
    color: var(--primary);
    text-align: left;
    padding: 1px 4px;
  }

  .more-box {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-top: 4px;
  }
  .more-box input {
    border: var(--border-thin);
    border-radius: var(--radius-sm);
    padding: 4px 6px;
    outline: none;
    font-size: 12px;
  }

  .unscheduled {
    flex-shrink: 0;
    border: var(--border);
    border-radius: var(--radius-lg);
    background: var(--surface-2);
    box-shadow: var(--shadow-flat);
    padding: 12px;
  }
  .unscheduled h3 {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 14px;
  }
  .unscheduled p {
    margin: 3px 0 9px;
  }
  .rows {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .urow {
    display: flex;
    align-items: center;
    gap: 8px;
    border: var(--border-thin);
    border-radius: var(--radius-md);
    background: var(--surface);
    padding: 5px 9px;
  }
  .urow:hover {
    box-shadow: var(--shadow-flat);
  }
  .urow.dragging {
    opacity: 0.92;
    transform: rotate(1deg) translate(0, -1px);
    box-shadow: var(--shadow-pop);
  }
  .dot-btn {
    border: none;
    background: transparent;
    padding: 0;
    color: var(--text-3);
    display: flex;
    flex: none;
  }
  .dot-btn:hover {
    color: var(--low);
  }
  .grip {
    border: none;
    background: transparent;
    padding: 0;
    color: var(--text-3);
    display: flex;
    flex: none;
    cursor: grab;
    touch-action: none;
  }
  .grip:hover {
    color: var(--primary);
  }
  .utitle {
    border: none;
    background: transparent;
    padding: 0;
    text-align: left;
  }
  .utitle:hover {
    color: var(--primary-ink);
  }
  .grow {
    flex: 1;
    min-width: 0;
    font-weight: 700;
  }
  .date {
    display: flex;
    align-items: center;
    gap: 5px;
    flex: none;
  }
  .date input {
    border: var(--border-thin);
    border-radius: var(--radius-sm);
    padding: 3px 6px;
    outline: none;
    background: var(--surface);
    font-size: 12px;
  }
</style>
