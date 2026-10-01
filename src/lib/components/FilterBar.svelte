<script lang="ts">
  import { store } from "$lib/store.svelte";
  import { PRIORITIES, PRIORITY_LABEL, type Priority } from "$lib/types";
  import Icon from "./Icon.svelte";
  import NeuButton from "./NeuButton.svelte";

  const DUE_OPTIONS: { value: "any" | "overdue" | "today" | "week" | "none"; label: string }[] = [
    { value: "any", label: "Any due date" },
    { value: "overdue", label: "Overdue" },
    { value: "today", label: "Due today" },
    { value: "week", label: "Next 7 days" },
    { value: "none", label: "No due date" },
  ];

  let tags = $derived(store.allTags());
  let active = $derived(store.filterActive());
</script>

<div class="bar">
  <div class="search">
    <Icon name="search" size={16} strokeWidth={2.6} />
    <input
      id="tk-search"
      placeholder="Search tasks, notes, tags…"
      value={store.filters.query}
      oninput={(e) => (store.filters.query = e.currentTarget.value)}
    />
    {#if store.filters.query}
      <button
        class="clr"
        type="button"
        aria-label="Clear search"
        onclick={() => (store.filters.query = "")}
      >
        <Icon name="x" size={14} strokeWidth={2.8} />
      </button>
    {/if}
  </div>

  <div class="prios">
    {#each PRIORITIES as p (p)}
      <button
        type="button"
        class="pf"
        class:on={store.filters.priorities.includes(p)}
        style:--c="var(--{p}-soft)"
        onclick={() => store.togglePriorityFilter(p)}
      >
        {PRIORITY_LABEL[p]}
      </button>
    {/each}
  </div>

  <label class="due">
    <Icon name="clock" size={15} strokeWidth={2.6} />
    <select
      value={store.filters.due}
      onchange={(e) =>
        (store.filters.due = e.currentTarget.value as (typeof DUE_OPTIONS)[number]["value"])}
    >
      {#each DUE_OPTIONS as o (o.value)}
        <option value={o.value}>{o.label}</option>
      {/each}
    </select>
  </label>

  <button
    type="button"
    class="pf"
    class:on={!store.filters.hideCompleted}
    onclick={() => (store.filters.hideCompleted = !store.filters.hideCompleted)}
  >
    <Icon name="check-circle" size={13} strokeWidth={2.6} />
    Done
  </button>

  {#if tags.length}
    <div class="tags">
      {#each tags.slice(0, 14) as tag (tag)}
        <button
          type="button"
          class="tf"
          class:on={store.filters.tags.includes(tag)}
          onclick={() => store.toggleTagFilter(tag)}
        >
          #{tag}
        </button>
      {/each}
    </div>
  {/if}

  <div class="spacer"></div>

  {#if active}
    <NeuButton size="sm" variant="flat" onclick={() => store.clearFilters()}>
      <Icon name="x" size={14} strokeWidth={2.8} /> Clear
    </NeuButton>
  {/if}
</div>

<style>
  .bar {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    padding: 9px 20px;
    border-bottom: var(--border);
    background: var(--surface);
  }

  .search {
    display: flex;
    align-items: center;
    gap: 7px;
    border: var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
    box-shadow: var(--shadow-inset-tight);
    padding: 0 9px;
    flex: 1;
    min-width: 190px;
    max-width: 320px;
    color: var(--text-3);
  }
  .search input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    padding: 7px 0;
    font-weight: 700;
  }
  .clr {
    border: none;
    background: transparent;
    padding: 0;
    display: flex;
    color: var(--text-3);
  }
  .clr:hover {
    color: var(--danger);
  }

  .prios,
  .tags {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .pf,
  .tf {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border: 2px solid var(--ink);
    border-radius: 999px;
    background: var(--surface-2);
    padding: 3px 10px;
    font-size: 12px;
    font-weight: 800;
    transition: transform var(--t);
  }
  .pf:hover,
  .tf:hover {
    transform: translate(-1px, -1px);
    box-shadow: 2px 2px 0 var(--ink);
  }
  .pf.on {
    background: var(--c, var(--accent));
    box-shadow: 2px 2px 0 var(--ink);
  }
  .tf.on {
    background: var(--primary);
    color: var(--text-on-primary);
    box-shadow: 2px 2px 0 var(--ink);
  }

  .due {
    display: flex;
    align-items: center;
    gap: 5px;
    color: var(--text-3);
  }
  .due select {
    border: 2px solid var(--ink);
    border-radius: 999px;
    background: var(--surface-2);
    padding: 3px 8px;
    font-weight: 800;
    font-size: 12px;
    outline: none;
    cursor: pointer;
  }
</style>
