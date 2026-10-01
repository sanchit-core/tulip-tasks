<script lang="ts">
  /** Focus the input once it enters the DOM (avoids the `autofocus` attribute). */
  function focusOnMount(node: HTMLInputElement, enabled: boolean) {
    if (!enabled) return {};
    const id = requestAnimationFrame(() => node.focus());
    return {
      destroy() {
        cancelAnimationFrame(id);
      },
    };
  }

  let {
    value = $bindable(""),
    placeholder = "",
    type = "text",
    label = "",
    icon,
    autofocus = false,
    onkeydown,
    onenter,
    min,
    max,
    name,
  }: {
    value?: string;
    placeholder?: string;
    type?: string;
    label?: string;
    icon?: string;
    autofocus?: boolean;
    onkeydown?: (e: KeyboardEvent) => void;
    onenter?: () => void;
    min?: string;
    max?: string;
    name?: string;
  } = $props();
</script>

<label class="field">
  {#if label}<span class="lbl">{label}</span>{/if}
  <span class="wrap-in">
    {#if icon}<span class="lead">{icon}</span>{/if}
    <input
      {type}
      {placeholder}
      use:focusOnMount={autofocus}
      {min}
      {max}
      {name}
      bind:value
      onkeydown={(e) => {
        if (e.key === "Enter" && onenter) {
          e.preventDefault();
          onenter();
        }
        onkeydown?.(e);
      }}
    />
  </span>
</label>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-width: 0;
  }
  .lbl {
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-2);
  }
  .wrap-in {
    display: flex;
    align-items: center;
    gap: 7px;
    border: var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
    box-shadow: var(--shadow-inset-tight);
    padding: 0 10px;
  }
  .wrap-in:focus-within {
    border-color: var(--primary);
  }
  .lead {
    color: var(--text-3);
    display: flex;
    flex: none;
  }
  input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    padding: 9px 0;
    font-weight: 600;
  }
  input::placeholder {
    color: var(--text-3);
    font-weight: 500;
  }
</style>
