<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { store } from "$lib/store.svelte";
  import { bootNotifier, isDesktop, notify } from "$lib/notify";
  import Toast from "$lib/components/Toast.svelte";

  let { children }: { children?: import("svelte").Snippet } = $props();

  let ready = $state(false);

  $effect(() => {
    if (!ready || typeof document === "undefined") return;
    document.documentElement.dataset.theme = store.workspace.settings.theme;
  });

  onMount(() => {
    store.boot().then(() => {
      ready = true;
      if (typeof document !== "undefined") {
        document.documentElement.dataset.theme = store.workspace.settings.theme;
      }
      if (store.workspace.settings.notificationsEnabled && isDesktop()) {
        bootNotifier(
          () => store.workspace.tasks,
          () => store.workspace.settings.notifyHour,
        );
      }
    });
    window.addEventListener("beforeunload", () => void store.flush());
  });
</script>

{#if !ready}
  <div class="splash">
    <span class="dot"><span></span></span>
    <p class="muted small">Loading workspace…</p>
  </div>
{:else}
  <Toast />
  {@render children?.()}
{/if}

<style>
  .splash {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
  }
  .dot {
    width: 58px;
    height: 58px;
    border-radius: var(--radius-lg);
    background: var(--surface);
    border: var(--border);
    box-shadow: var(--shadow-raised);
    display: grid;
    place-items: center;
  }
  .dot span {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--primary);
    animation: pulse 1s ease-in-out infinite;
  }
  @keyframes pulse {
    50% {
      opacity: 0.25;
      transform: scale(0.7);
    }
  }
</style>
