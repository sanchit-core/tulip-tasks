<script lang="ts">
  import type { Task } from "$lib/types";
  import { PRIORITY_LABEL, type Priority } from "$lib/types";
  import { dueLabel, isOverdue, isToday } from "$lib/dates";
  import { recurrenceBadge } from "$lib/recurrence";
  import Icon from "./Icon.svelte";
  import NeuBadge from "./NeuBadge.svelte";

  let {
    task,
    dragging = false,
    showBoard = false,
    boardTitle = "",
    onopen,
    ondragstart,
    oncomplete,
    compact = false,
  }: {
    task: Task;
    dragging?: boolean;
    showBoard?: boolean;
    boardTitle?: string;
    onopen: (id: string) => void;
    ondragstart: (e: PointerEvent) => void;
    oncomplete: (id: string) => void;
    compact?: boolean;
  } = $props();

  const PRIO_TONE: Record<Priority, "urgent" | "high" | "medium" | "low"> = {
    urgent: "urgent",
    high: "high",
    medium: "medium",
    low: "low",
  };

  let subDone = $derived(task.subtasks.filter((s) => s.done).length);
  let subTotal = $derived(task.subtasks.length);
  let overdue = $derived(!!task.due && !task.completedAt && isOverdue(task.due));
  let dueToday = $derived(!!task.due && !task.completedAt && isToday(task.due));
  let recur = $derived(recurrenceBadge(task.recurrence));
</script>

<div
  class="card"
  class:dragging
  class:done={!!task.completedAt}
  class:compact
  data-card
  role="button"
  tabindex="0"
  aria-label={task.title}
  onpointerdown={(e) => {
    if ((e.target as HTMLElement).closest("button")) return;
    ondragstart(e);
  }}
  onclick={() => onopen(task.id)}
  onkeydown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onopen(task.id);
    }
  }}
>
  <header>
    <button
      class="check"
      class:checked={!!task.completedAt}
      type="button"
      aria-label={task.completedAt ? "Mark as not done" : "Mark as done"}
      onclick={(e) => {
        e.stopPropagation();
        oncomplete(task.id);
      }}
    >
      <Icon name={task.completedAt ? "check-circle" : "circle"} size={19} strokeWidth={2.3} />
    </button>
    <span class="title" class:strike={!!task.completedAt}>{task.title}</span>
  </header>

  {#if task.tags.length || showBoard}
    <div class="chip-row tags">
      {#if showBoard}
        <NeuBadge tone="violet" size="sm">{boardTitle}</NeuBadge>
      {/if}
      {#each task.tags.slice(0, 3) as tag (tag)}
        <NeuBadge tone="default" size="sm">#{tag}</NeuBadge>
      {/each}
      {#if task.tags.length > 3}
        <NeuBadge tone="default" size="sm">+{task.tags.length - 3}</NeuBadge>
      {/if}
    </div>
  {/if}

  {#if subTotal > 0}
    <div class="progress" title="{subDone} of {subTotal} subtasks done">
      <div class="bar">
        <div class="fill" style:width="{Math.round((subDone / subTotal) * 100)}%"></div>
      </div>
      <span class="tiny mono">{subDone}/{subTotal}</span>
    </div>
  {/if}

  <footer>
    <NeuBadge tone={PRIO_TONE[task.priority]} size="sm" title="Priority">
      {PRIORITY_LABEL[task.priority]}
    </NeuBadge>
    {#if task.due}
      <NeuBadge
        tone={overdue ? "overdue" : dueToday ? "accent" : "default"}
        size="sm"
        title="Due {task.due}"
      >
        <Icon name="clock" size={11} strokeWidth={2.6} />
        {dueLabel(task.due)}
      </NeuBadge>
    {/if}
    {#if recur}
      <NeuBadge tone="medium" size="sm" title="Repeats">
        {recur}
      </NeuBadge>
    {/if}
  </footer>
</div>

<style>
  .card {
    border: var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
    box-shadow: var(--shadow-flat);
    padding: 9px 10px;
    display: flex;
    flex-direction: column;
    gap: 7px;
    cursor: grab;
    touch-action: none;
    transition:
      transform var(--t),
      box-shadow var(--t),
      opacity var(--t);
  }
  .card:hover {
    transform: translate(-1px, -1px);
    box-shadow: var(--shadow-raised);
  }
  .card.dragging {
    opacity: 0.35;
    cursor: grabbing;
  }
  .card.done {
    background: var(--surface-2);
  }
  .card.done .title {
    text-decoration: line-through;
    color: var(--text-3);
  }
  .card.compact {
    padding: 6px 8px;
    gap: 5px;
  }

  header {
    display: flex;
    align-items: flex-start;
    gap: 7px;
  }
  .check {
    border: none;
    background: transparent;
    padding: 0;
    color: var(--text-3);
    display: flex;
    flex: none;
    margin-top: 1px;
  }
  .check:hover {
    color: var(--low);
  }
  .check.checked {
    color: var(--low);
  }
  .title {
    font-weight: 800;
    line-height: 1.32;
    overflow-wrap: anywhere;
  }

  .tags {
    gap: 4px;
  }

  .progress {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .bar {
    flex: 1;
    height: 7px;
    border: 2px solid var(--ink);
    border-radius: 999px;
    background: var(--surface-2);
    overflow: hidden;
  }
  .fill {
    height: 100%;
    background: var(--low);
  }

  footer {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    align-items: center;
  }
</style>
