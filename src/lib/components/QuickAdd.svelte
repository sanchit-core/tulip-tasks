<script lang="ts">
  import { store } from "$lib/store.svelte";
  import { PRIORITIES, PRIORITY_LABEL, type Priority } from "$lib/types";
  import Modal from "./Modal.svelte";
  import NeuButton from "./NeuButton.svelte";
  import NeuInput from "./NeuInput.svelte";
  import Icon from "./Icon.svelte";

  let { open = $bindable(false) }: { open?: boolean } = $props();

  let title = $state("");
  let priority = $state<Priority>("medium");
  let due = $state("");
  let tags = $state("");

  function reset() {
    title = "";
    priority = "medium";
    due = "";
    tags = "";
  }

  function submit() {
    const clean = title.trim();
    if (!clean) return;
    store.addTask({
      title: clean,
      columnId: null,
      priority,
      due: due || null,
      tags: tags
        .split(/[,\s]+/)
        .map((t) => t.replace(/^#/, "").toLowerCase())
        .filter(Boolean),
    });
    reset();
    open = false;
  }
</script>

<Modal bind:open title="Quick capture" width={480}>
  <div class="col">
    <NeuInput
      placeholder="What needs doing?"
      bind:value={title}
      autofocus
      onenter={submit}
    />

    <div class="row wrap">
      <div class="seg">
        {#each PRIORITIES as p (p)}
          <button
            type="button"
            class="on-p"
            class:on={priority === p}
            style:--c="var(--{p}-soft)"
            onclick={() => (priority = p)}
          >
            {PRIORITY_LABEL[p]}
          </button>
        {/each}
      </div>
    </div>

    <div class="row wrap">
      <label class="f">
        <span class="tiny muted">Due</span>
        <input type="date" bind:value={due} />
      </label>
      <label class="f grow">
        <span class="tiny muted">Tags</span>
        <input placeholder="comma separated" bind:value={tags} />
      </label>
    </div>

    <p class="tiny muted-3">
      <Icon name="info" size={12} strokeWidth={2.4} />
      Goes straight to the backlog inbox. Triage it onto the board whenever you like.
    </p>
  </div>

  {#snippet footer()}
    <NeuButton variant="ghost" onclick={() => (open = false)}>Cancel</NeuButton>
    <NeuButton tone="primary" onclick={submit} disabled={!title.trim()}>Add to inbox</NeuButton>
  {/snippet}
</Modal>

<style>
  .col {
    display: flex;
    flex-direction: column;
    gap: 13px;
  }
  .seg {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
  }
  .on-p {
    border: 2px solid var(--ink);
    border-radius: 999px;
    background: var(--surface-2);
    padding: 4px 11px;
    font-size: 12px;
    font-weight: 800;
    box-shadow: 2px 2px 0 var(--ink);
  }
  .on-p.on {
    background: var(--c);
    transform: translate(1px, 1px);
    box-shadow: none;
  }
  .f {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 140px;
  }
  .f input {
    border: var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
    box-shadow: var(--shadow-inset-tight);
    padding: 8px 10px;
    font-weight: 700;
    outline: none;
  }
  .grow {
    flex: 1;
  }
  p {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 5px;
  }
</style>
