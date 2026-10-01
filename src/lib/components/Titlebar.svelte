<script lang="ts">
  import { onMount } from "svelte";
  import Icon from "./Icon.svelte";
  import { closeWindow, inDesktop, minimizeWindow, toggleMaximize } from "$lib/window";

  let { saveState = "idle" }: { saveState?: "idle" | "saving" | "error" } = $props();

  let desktop = $state(false);
  onMount(() => {
    desktop = inDesktop();
  });

  let title = $derived(
    saveState === "saving"
      ? "Tulip Kanban — saving…"
      : saveState === "error"
        ? "Tulip Kanban — save failed"
        : "Tulip Kanban",
  );
</script>

<div class="bar" data-tauri-drag-region>
  <span class="logo" data-tauri-drag-region>
    <Icon name="tulip" size={17} fill />
  </span>
  <span class="title truncate" data-tauri-drag-region>{title}</span>

  <div class="spacer" data-tauri-drag-region></div>

  {#if saveState === "error"}
    <span class="err" title="Could not write workspace.json — see console">
      <Icon name="alert-circle" size={14} strokeWidth={2.4} /> save failed
    </span>
  {/if}

  {#if desktop}
    <div class="wins">
      <button type="button" aria-label="Minimize" onclick={() => minimizeWindow()}>
        <Icon name="minus" size={15} strokeWidth={2.5} />
      </button>
      <button type="button" aria-label="Maximize" onclick={() => toggleMaximize()}>
        <Icon name="maximize" size={13} strokeWidth={2.5} />
      </button>
      <button class="danger" type="button" aria-label="Close" onclick={() => closeWindow()}>
        <Icon name="x" size={15} strokeWidth={2.5} />
      </button>
    </div>
  {/if}
</div>

<style>
  .bar {
    height: var(--titlebar-h);
    flex: none;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 0 0 0 12px;
    background: var(--surface-2);
    border-bottom: var(--border);
    user-select: none;
  }
  .logo {
    width: 26px;
    height: 26px;
    border: 2px solid var(--ink);
    border-radius: var(--radius-sm);
    background: var(--primary);
    color: var(--text-on-primary);
    display: grid;
    place-items: center;
    box-shadow: 2px 2px 0 var(--ink);
    flex: none;
  }
  .title {
    font-weight: 900;
    font-size: 14px;
    letter-spacing: -0.01em;
  }
  .err {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 800;
    color: var(--danger);
  }
  .wins {
    display: flex;
  }
  .wins button {
    width: 42px;
    height: var(--titlebar-h);
    border: none;
    border-left: 2px solid var(--ink);
    background: var(--surface-2);
    display: grid;
    place-items: center;
    transition: background-color var(--t);
  }
  .wins button:hover {
    background: var(--surface-3);
  }
  .wins button.danger:hover {
    background: var(--danger);
    color: var(--text-on-primary);
  }
</style>
