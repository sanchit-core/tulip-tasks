<script lang="ts">
  import { store } from "$lib/store.svelte";
  import { workspaceLocation } from "$lib/persist";
  import { isDesktop } from "$lib/notify";
  import Modal from "./Modal.svelte";
  import Icon from "./Icon.svelte";
  import NeuButton from "./NeuButton.svelte";
  import NeuToggle from "./NeuToggle.svelte";
  import NeuBadge from "./NeuBadge.svelte";
  import ConfirmModal from "./ConfirmModal.svelte";
  import { THEMES, type Theme } from "$lib/types";
  import { toast } from "$lib/toasts";

  const THEME_LABELS: Record<Theme, string> = {
    minimal: "Minimal (default)",
    dark: "Dark mode",
  };

  let {
    open = $bindable(false),
    onexport,
    onimport,
  }: {
    open?: boolean;
    onexport: () => void;
    onimport: () => void;
  } = $props();

  let location = $state("…");
  let notifOk = $state<boolean | null>(null);

  $effect(() => {
    if (open) {
      void workspaceLocation().then((p) => (location = p));
      notifOk = isDesktop();
    }
  });

  const s = $derived(store.workspace.settings);
  let stats = $derived(store.stats(null));
  let confirmResetOpen = $state(false);

  function resetDemo() {
    confirmResetOpen = true;
  }

  function doResetDemo() {
    store.resetToDemo();
    toast("Demo workspace restored", "info");
    confirmResetOpen = false;
    open = false;
  }
</script>

<Modal bind:open title="Settings" width={580}>
  <div class="sec">
    <h4>Notifications</h4>
    <NeuToggle
      checked={s.notificationsEnabled}
      label="Notify me about due and overdue tasks"
      onchange={(v) => store.updateSettings({ notificationsEnabled: v })}
    />
    <p class="tiny muted">
      {#if notifOk}
        Desktop notifications are checked hourly and on launch.
      {:else}
        Desktop notifications need the Tauri app shell — run <code>npm run tauri dev</code>.
      {/if}
    </p>
    <label class="row">
      <span class="small">Daily digest hour</span>
      <select
        value={String(s.notifyHour)}
        onchange={(e) => store.updateSettings({ notifyHour: Number(e.currentTarget.value) })}
      >
        {#each Array.from({ length: 24 }, (_, i) => i) as h (h)}
          <option value={String(h)}>{String(h).padStart(2, "0")}:00</option>
        {/each}
      </select>
    </label>
  </div>

  <div class="sec">
    <h4>Board</h4>
    <NeuToggle
      checked={s.wipWarnings}
      label="Warn when a column is over its WIP limit"
      onchange={(v) => store.updateSettings({ wipWarnings: v })}
    />
    <NeuToggle
      checked={store.filters.hideCompleted}
      label="Hide completed tasks"
      onchange={(v) => (store.filters.hideCompleted = v)}
    />
    <NeuToggle
      checked={s.hideTitlebar}
      label="Hide window titlebar and native controls"
      onchange={(v) => store.updateSettings({ hideTitlebar: v })}
    />
    <div class="field">
      <span class="lbl">Theme & design</span>
      <select
        value={s.theme}
        onchange={(e) => store.updateSettings({ theme: e.currentTarget.value as Theme })}
      >
        {#each THEMES as t (t)}
          <option value={t}>{THEME_LABELS[t]}</option>
        {/each}
      </select>
    </div>
  </div>

  <div class="sec">
    <h4>Appearance</h4>
    <NeuToggle
      checked={s.theme === "dark"}
      label="Dark mode"
      onchange={(v) => store.updateSettings({ theme: v ? "dark" : "minimal" })}>
    </NeuToggle>
  </div>

  <div class="sec">
    <h4>Data</h4>
    <div class="row wrap">
      <NeuBadge tone="default" size="sm">{stats.total} tasks</NeuBadge>
      <NeuBadge tone="default" size="sm">{store.boards().length} boards</NeuBadge>
      <NeuBadge tone="default" size="sm">{store.workspace.columns.length} columns</NeuBadge>
    </div>
    <p class="tiny muted path">
      <Icon name="folder" size={13} strokeWidth={2.4} />
      {location}
    </p>
    <div class="row wrap">
      <NeuButton variant="flat" onclick={onexport}>
        <Icon name="download" size={15} strokeWidth={2.4} /> Export JSON
      </NeuButton>
      <NeuButton variant="flat" onclick={onimport}>
        <Icon name="upload" size={15} strokeWidth={2.4} /> Import JSON
      </NeuButton>
      <NeuButton variant="danger" onclick={resetDemo}>
        <Icon name="refresh" size={15} strokeWidth={2.4} /> Reset to demo
      </NeuButton>
    </div>
  </div>

  {#snippet footer()}
    <NeuButton onclick={() => (open = false)}>Close</NeuButton>
  {/snippet}
</Modal>

<ConfirmModal
  bind:open={confirmResetOpen}
  title="Reset to demo"
  message="Replace everything with the demo workspace? Your current data is lost."
  confirmLabel="Reset"
  onconfirm={doResetDemo}
  oncancel={() => (confirmResetOpen = false)}
/>

<style>
  .sec {
    display: flex;
    flex-direction: column;
    gap: 9px;
    padding-bottom: 16px;
    margin-bottom: 16px;
    border-bottom: 2px solid var(--surface-2);
  }
  .sec:last-of-type {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
  h4 {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--text-2);
  }
  p {
    margin: 0;
  }
  code {
    border: var(--border-thin);
    border-radius: var(--radius-sm);
    padding: 0 4px;
    background: var(--surface-2);
    font-size: 11px;
  }
  select {
    border: var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
    padding: 6px 9px;
    font-weight: 700;
    outline: none;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .lbl {
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-2);
    font-size: 12px;
    font-weight: 900;
  }
  .path {
    display: flex;
    align-items: center;
    gap: 6px;
    overflow-wrap: anywhere;
  }
</style>