<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { store } from "$lib/store.svelte";
  import { bootNotifier, isDesktop } from "$lib/notify";
  import Toast from "$lib/components/Toast.svelte";

  let { children }: { children?: import("svelte").Snippet } = $props();

  let ready = $state(false);

  $effect(() => {
    if (!ready || typeof document === "undefined") return;
    // Apply the theme from store settings, defaulting to system
    const storedTheme = store.workspace.settings.theme;
    if (storedTheme === "dark") {
      document.documentElement.dataset.theme = "dark";
    } else if (storedTheme === "neo-brutalist") {
      document.documentElement.dataset.theme = "neo-brutalist";
    } else {
      // Default to system preference for other themes
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.dataset.theme = prefersDark ? "dark" : storedTheme;
    }
  });

  onMount(() => {
    store.boot().then(() => {
      ready = true;
      if (typeof document !== "undefined") {
        // Re-apply after store is ready
        const storedTheme = store.workspace.settings.theme;
        if (storedTheme === "dark") {
          document.documentElement.dataset.theme = "dark";
        } else if (storedTheme === "neo-brutalist") {
          document.documentElement.dataset.theme = "neo-brutalist";
        } else {
          const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          document.documentElement.dataset.theme = prefersDark ? "dark" : storedTheme;
        }
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