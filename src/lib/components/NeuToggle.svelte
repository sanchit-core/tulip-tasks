<script lang="ts">
  let {
    checked = $bindable(false),
    label = "",
    onchange,
  }: {
    checked?: boolean;
    label?: string;
    onchange?: (v: boolean) => void;
  } = $props();
</script>

<label class="toggle">
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    class="track"
    onclick={() => {
      checked = !checked;
      onchange?.(checked);
    }}
  >
    <span class="knob"></span>
  </button>
  <span class="lbl">{label}</span>
</label>

<style>
  .toggle {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
  }
  .track {
    width: 46px;
    height: 26px;
    flex: none;
    border: var(--border);
    border-radius: 999px;
    background: var(--surface-2);
    box-shadow: var(--shadow-inset-tight);
    position: relative;
    padding: 0;
    transition: background-color var(--t);
  }
  .knob {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    border: var(--border-thin);
    border-radius: 50%;
    background: var(--surface);
    transition: transform var(--t);
  }
  .track[aria-checked="true"] {
    background: var(--primary);
  }
  .track[aria-checked="true"] .knob {
    transform: translateX(20px);
  }
  .lbl {
    font-weight: 700;
  }
</style>
